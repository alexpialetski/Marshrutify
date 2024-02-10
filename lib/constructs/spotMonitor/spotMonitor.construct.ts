import * as cdk from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import * as eventsTargets from "aws-cdk-lib/aws-events-targets";
import { Construct } from "constructs";
import path from "path";

import { monitorStartedEvent } from "~/events/monitorStartedEvent";
import { monitorUnsubscriptionNotificationEvent } from "~/events/monitorUnsubscriptionNotificationEvent";

import { MonitorConstructProps } from "./types";
import { MonitorStateMachineConstruct } from "./monitorStateMachine.construct";

export class SpotMonitorConstruct extends Construct {
  stateMachineArn: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props: MonitorConstructProps) {
    super(scope, id);

    new events.Rule(this, "MonitorStartedEvent rule", {
      eventPattern: monitorStartedEvent.getEvenRulePattern(),
      eventBus: props.eventBus,
      targets: [
        new eventsTargets.LambdaFunction(
          new cdk.aws_lambda_nodejs.NodejsFunction(
            this,
            "HandleMonitorStarted",
            {
              entry: path.join(__dirname, "handleMonitorStarted.function.ts"),
              environment: props.lambdaEnvs,
            }
          ),
          {
            event: events.RuleTargetInput.fromEventPath("$"), // Pass the entire event
          }
        ),
      ],
    });

    new events.Rule(this, "MonitorUnsubscriptionNotificationEvent rule", {
      eventPattern: monitorUnsubscriptionNotificationEvent.getEvenRulePattern(),
      eventBus: props.eventBus,
      targets: [
        new eventsTargets.LambdaFunction(
          new cdk.aws_lambda_nodejs.NodejsFunction(
            this,
            "HandleMonitorUnsubscriptionNotification",
            {
              entry: path.join(
                __dirname,
                "handleMonitorUnsubscriptionNotification.function.ts"
              ),
              environment: props.lambdaEnvs,
            }
          ),
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

    this.stateMachineArn = new cdk.CfnOutput(this, "MonitorTableNameOutput", {
      value: monitorStateMachine.stateMachine.stateMachineArn,
    });
  }
}
