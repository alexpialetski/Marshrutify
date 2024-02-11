import * as cdk from "aws-cdk-lib";

import { LambdaEnvVariable } from "../../types";
import { MonitorTableConstruct } from "../monitorTable.construct";

export type MonitorConstructProps = {
  eventBus: cdk.aws_events.IEventBus;
  monitorTable: MonitorTableConstruct;
  lambdaEnvs: Record<LambdaEnvVariable, string>;
};
