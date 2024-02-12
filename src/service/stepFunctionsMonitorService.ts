import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import {
  SFNClient,
  StartExecutionCommand,
  StopExecutionCommand,
  SendTaskSuccessCommand,
  StopExecutionCommandInput,
  StartExecutionCommandInput,
} from "@aws-sdk/client-sfn";

import { MonitorData, MonitorEventData, MonitorInfo } from "~/types/monitor";
import { killIfNoEnvVariables } from "~/utils";

import { MonitorService } from "./monitorService";
import { logger } from "~/utils/logger";
import { DynamoDBMonitorService } from "./monitorStorage/dynamoDBMonitorService";

const { MONITOR_TABLE_NAME, AWS_REGION, MONITOR_TABLE_GSI_NAME } =
  killIfNoEnvVariables([
    "MONITOR_TABLE_NAME",
    "AWS_REGION",
    "MONITOR_TABLE_GSI_NAME",
  ]);

const ddbDocClient = DynamoDBDocument.from(
  new DynamoDBClient({ region: AWS_REGION })
);
const sfnClient = new SFNClient({ region: AWS_REGION });

type DynamoMonitorInfo = MonitorInfo & {
  userId_date: string;
};

type DynamoMonitorInfoKey = keyof DynamoMonitorInfo;

const dynamoDBMonitorService = new DynamoDBMonitorService();

class StepFunctionsMonitorService extends MonitorService {
  monitorStorage: DynamoDBMonitorService;
  tableName = MONITOR_TABLE_NAME;

  constructor() {
    super(dynamoDBMonitorService);
  }

  startMonitor = async (monitor: MonitorData): Promise<MonitorInfo> => {
    const { STATE_MACHINE_ARN } = killIfNoEnvVariables(["STATE_MACHINE_ARN"]);

    const input: MonitorEventData = {
      monitorInfo: {
        ...monitor,
        id: this.monitorStorage.generateMonitorId(),
        status: "IN_PROGRESS",
        execution: {
          arn: "", // not known right now
        },
      },
      prevSlots: [],
      timeOutTime: this.getTimeout(),
    };
    const startCommandInput: StartExecutionCommandInput = {
      stateMachineArn: STATE_MACHINE_ARN,
      input: JSON.stringify(input),
    };

    logger.info(startCommandInput, "StepFunctionsMonitorService.startMonitor");

    const executionInfo = await sfnClient.send(
      new StartExecutionCommand(startCommandInput)
    );

    logger.info(executionInfo, "StepFunctionsMonitorService.saveMonitor");

    return this.monitorStorage.saveMonitor({
      ...input.monitorInfo,
      execution: {
        arn: executionInfo.executionArn,
      },
    });
  };

  async stopMonitor(monitorInfo: MonitorInfo): Promise<void> {
    const executionInfo: StopExecutionCommandInput = {
      executionArn: monitorInfo.execution.arn,
    };

    await sfnClient.send(new StopExecutionCommand(executionInfo));

    logger.info(executionInfo, "StepFunctionsMonitorService: Stoped monitor");

    return this.onMonitorStopped(monitorInfo);
  }

  onMonitorStopped(monitorInfo: MonitorInfo): Promise<void> {
    const stoppedInfo: MonitorInfo = { ...monitorInfo, status: "STOPED" };

    return this.monitorStorage.updateMonitorStatusById(stoppedInfo).then(() => {
      logger.info(
        stoppedInfo,
        "StepFunctionsMonitorService: Updated DB with stoped monitor"
      );
    });
  }

  prolongMonitor(monitorInfo: MonitorInfo): Promise<void> {
    return sfnClient
      .send(
        new SendTaskSuccessCommand({
          output: this.getTimeout(),
          taskToken: monitorInfo.execution.taskToken,
        })
      )
      .then(() => {});
  }
}

export const stepFunctionsMonitorService = new StepFunctionsMonitorService();
