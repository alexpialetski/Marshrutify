import * as cdk from "aws-cdk-lib";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as sfnTasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Construct } from "constructs";
import path from "path";

import { monitorStartedEvent } from "~/events/monitorStartedEvent";
import { monitorUnsubscriptionNotificationEvent } from "~/events/monitorUnsubscriptionNotificationEvent";

import { MonitorConstructProps } from "./types";
import { getTelegramBotTokenSecret } from "../../utils";

export class MonitorStateMachineConstruct extends Construct {
  public readonly stateMachine: sfn.StateMachine;

  constructor(scope: Construct, id: string, props: MonitorConstructProps) {
    super(scope, id);

    const mixinExecutionArn = new sfn.Pass(this, "Mixin execution", {
      parameters: {
        arn: sfn.TaskInput.fromJsonPathAt("$$.Execution.Id").value,
      },
      inputPath: sfn.TaskInput.fromJsonPathAt("$").value,
      resultPath: sfn.TaskInput.fromJsonPathAt("$.monitorInfo.execution").value,
    });

    const monitorStartedPutEventState = new sfnTasks.EventBridgePutEvents(
      this,
      `${monitorStartedEvent.getEventDetailType()} state`,
      {
        entries: [
          {
            detail: sfn.TaskInput.fromJsonPathAt("$"),
            eventBus: props.eventBus,
            detailType: monitorStartedEvent.getEventDetailType(),
            source: monitorStartedEvent.getEventSource(),
          },
        ],
        resultPath: sfn.JsonPath.DISCARD, // use input instead
      }
    );

    const isTimedOutChoice = new sfn.Choice(this, "Is timed out?", {
      stateName: "Is timed out?",
    });

    const spotMonitorTickFunction = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "SpotMonitorTick",
      {
        entry: path.join(__dirname, "functions", "spotMonitorTick.function.ts"),
        environment: props.lambdaEnvs,
        timeout: cdk.Duration.seconds(10), // some Bus Provider APIs are slow
      }
    );

    const spotMonitorTickState = new sfnTasks.LambdaInvoke(
      this,
      "SpotMonitorTick state",
      {
        lambdaFunction: spotMonitorTickFunction,
        inputPath: sfn.TaskInput.fromJsonPathAt("$").value,
        resultPath: sfn.TaskInput.fromJsonPathAt("$").value,
        outputPath: "$.Payload",
      }
    );

    const waitX = new sfn.Wait(this, "Wait X Seconds", {
      time: sfn.WaitTime.duration(cdk.Duration.seconds(20)),
    });

    const monitorUnsubscriptionNotificationState =
      new sfnTasks.EventBridgePutEvents(
        this,
        `${monitorUnsubscriptionNotificationEvent.getEventDetailType()} state`,
        {
          entries: [
            {
              detail: sfn.TaskInput.fromObject({
                monitorEventData: sfn.TaskInput.fromJsonPathAt("$").value,
                taskToken: sfn.JsonPath.taskToken,
              }),
              eventBus: props.eventBus,
              detailType:
                monitorUnsubscriptionNotificationEvent.getEventDetailType(),
              source: monitorUnsubscriptionNotificationEvent.getEventSource(),
            },
          ],
          resultPath: sfn.JsonPath.DISCARD, // use input instead
          taskTimeout: sfn.Timeout.duration(cdk.Duration.minutes(2)),
          integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
        }
      );

    const handleMonitorUnsubscriptionFunction =
      new cdk.aws_lambda_nodejs.NodejsFunction(this, "HandleUnsubscription", {
        entry: path.join(
          __dirname,
          "functions",
          "handleMonitorUnsubscription.function.ts"
        ),
        environment: props.lambdaEnvs,
      });

    const handleMonitorUnsubscriptionState = new sfnTasks.LambdaInvoke(
      this,
      "HandleMonitorUnsubscription state",
      {
        lambdaFunction: handleMonitorUnsubscriptionFunction,
      }
    );

    const definition = mixinExecutionArn.next(monitorStartedPutEventState).next(
      isTimedOutChoice
        .when(
          // sfn.Condition.timestampLessThanEqualsJsonPath( TODO
          sfn.Condition.timestampGreaterThanEqualsJsonPath(
            "$$.State.EnteredTime",
            "$.timeOutTime"
          ),
          spotMonitorTickState.next(waitX).next(isTimedOutChoice)
        )
        .otherwise(
          monitorUnsubscriptionNotificationState
            .addCatch(handleMonitorUnsubscriptionState, {
              errors: [sfn.Errors.TIMEOUT],
              resultPath: sfn.JsonPath.DISCARD, // use input instead
            })
            .next(isTimedOutChoice)
        )
    );

    props.monitorTable.table.grantReadWriteData(
      handleMonitorUnsubscriptionFunction
    );

    const telegramBotToken = getTelegramBotTokenSecret(this);
    telegramBotToken.grantRead(handleMonitorUnsubscriptionFunction);
    telegramBotToken.grantRead(spotMonitorTickFunction);

    this.stateMachine = new sfn.StateMachine(this, "StateMachine", {
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
    });
  }
}
