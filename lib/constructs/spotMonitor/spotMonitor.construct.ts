import * as cdk from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import * as eventsTargets from "aws-cdk-lib/aws-events-targets";
import { Construct } from "constructs";
import path from "path";

import { monitorStartedEvent } from "~/events/monitorStartedEvent";
import { monitorUnsubscriptionNotificationEvent } from "~/events/monitorUnsubscriptionNotificationEvent";

import { MonitorConstructProps } from "./types";
import { MonitorStateMachineConstruct } from "./monitorStateMachine.construct";
import { getTelegramBotTokenSecret } from "../../utils";

export class SpotMonitorConstruct extends Construct {
  stateMachineArn: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props: MonitorConstructProps) {
    super(scope, id);

    const handleMonitorStartedFunction =
      new cdk.aws_lambda_nodejs.NodejsFunction(this, "HandleMonitorStarted", {
        entry: path.join(
          __dirname,
          "functions",
          "handleMonitorStarted.function.ts"
        ),
        environment: props.lambdaEnvs,
      });

    const handleMonitorUnsubscriptionNotificationFunction =
      new cdk.aws_lambda_nodejs.NodejsFunction(
        this,
        "HandleMonitorUnsubscriptionNotification",
        {
          entry: path.join(
            __dirname,
            "functions",
            "handleMonitorUnsubscriptionNotification.function.ts"
          ),
          environment: props.lambdaEnvs,
        }
      );

    new events.Rule(this, "MonitorStartedEvent rule", {
      eventPattern: monitorStartedEvent.getEvenRulePattern(),
      eventBus: props.eventBus,
      targets: [
        new eventsTargets.LambdaFunction(handleMonitorStartedFunction, {
          event: events.RuleTargetInput.fromEventPath("$"), // Pass the entire event
        }),
      ],
    });

    new events.Rule(this, "MonitorUnsubscriptionNotificationEvent rule", {
      eventPattern: monitorUnsubscriptionNotificationEvent.getEvenRulePattern(),
      eventBus: props.eventBus,
      targets: [
        new eventsTargets.LambdaFunction(
          handleMonitorUnsubscriptionNotificationFunction,
          {
            event: events.RuleTargetInput.fromEventPath("$"), // Pass the entire event
          }
        ),
      ],
    });

    const monitorStateMachine = new MonitorStateMachineConstruct(
      this,
      "MonitorStateMachine",
      props
    );

    const telegramBotToken = getTelegramBotTokenSecret(this);
    telegramBotToken.grantRead(handleMonitorStartedFunction);
    telegramBotToken.grantRead(handleMonitorUnsubscriptionNotificationFunction);

    this.stateMachineArn = new cdk.CfnOutput(this, "StateMachineArnOutput", {
      value: monitorStateMachine.stateMachine.stateMachineArn,
    });
  }
}
