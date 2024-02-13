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

const { AWS_REGION } = killIfNoEnvVariables(["AWS_REGION"]);

const sfnClient = new SFNClient({ region: AWS_REGION });

const dynamoDBMonitorService = new DynamoDBMonitorService();

class StepFunctionsMonitorService extends MonitorService {
  monitorStorage: DynamoDBMonitorService;

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
      timeOutTime: { value: this.getTimeout() },
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

  stopMonitor(monitorInfo: MonitorInfo): Promise<void> {
    const executionInfo: StopExecutionCommandInput = {
      executionArn: monitorInfo.execution.arn,
    };

    return sfnClient.send(new StopExecutionCommand(executionInfo)).then(() => {
      logger.info(executionInfo, "StepFunctionsMonitorService: Stoped monitor");

      return this.onMonitorStopped(monitorInfo);
    });
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
          output: JSON.stringify({ value: this.getTimeout() }),
          taskToken: monitorInfo.execution.taskToken,
        })
      )
      .then(() => {});
  }
}

export const stepFunctionsMonitorService = new StepFunctionsMonitorService();
