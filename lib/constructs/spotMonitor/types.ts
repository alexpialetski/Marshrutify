import * as cdk from "aws-cdk-lib";

import { LambdaEnvVariable } from "../../types";

export type MonitorConstructProps = {
  eventBus: cdk.aws_events.IEventBus;
  lambdaEnvs: Record<LambdaEnvVariable, string>;
};
