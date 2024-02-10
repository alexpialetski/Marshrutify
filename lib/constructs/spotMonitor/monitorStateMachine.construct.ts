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

  constructor(
    scope: Construct,
    id = "StepFunction",
    props: MonitorConstructProps
  ) {
    super(scope, id);

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
        entry: path.join(__dirname, "spotMonitorTick.function.ts"),
        environment: props.lambdaEnvs,
      }
    );

    const spotMonitorTickState = new sfnTasks.LambdaInvoke(
      this,
      "SpotMonitorTick state",
      {
        lambdaFunction: spotMonitorTickFunction,
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
              detail: sfn.TaskInput.fromJsonPathAt("$"),
              eventBus: props.eventBus,
              detailType: monitorStartedEvent.getEventDetailType(),
              source: monitorStartedEvent.getEventSource(),
            },
          ],
          resultPath: sfn.JsonPath.DISCARD, // use input instead
          taskTimeout: sfn.Timeout.duration(cdk.Duration.minutes(2)),
        }
      );

    const handleMonitorUnsubscriptionFunction =
      new cdk.aws_lambda_nodejs.NodejsFunction(
        this,
        "HandleMonitorUnsubscription",
        {
          entry: path.join(
            __dirname,
            "handleMonitorUnsubscription.function.ts"
          ),
          environment: props.lambdaEnvs,
        }
      );

    const handleMonitorUnsubscriptionState = new sfnTasks.LambdaInvoke(
      this,
      "HandleMonitorUnsubscription state",
      {
        lambdaFunction: handleMonitorUnsubscriptionFunction,
      }
    );

    const definition = monitorStartedPutEventState.next(
      isTimedOutChoice
        .when(
          sfn.Condition.timestampLessThanEqualsJsonPath(
            "$$.State.EnteredTime",
            "$.timeoutTime"
          ),
          spotMonitorTickState.next(waitX).next(isTimedOutChoice)
        )
        .otherwise(
          monitorUnsubscriptionNotificationState
            .addCatch(handleMonitorUnsubscriptionState, {
              errors: [sfn.Errors.TIMEOUT],
            })
            .next(isTimedOutChoice)
        )
    );

    const telegramBotToken = getTelegramBotTokenSecret(this);
    telegramBotToken.grantRead(handleMonitorUnsubscriptionFunction);
    telegramBotToken.grantRead(spotMonitorTickFunction);

    this.stateMachine = new sfn.StateMachine(this, "SpotMonitorStateMachine", {
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
    });
  }
}