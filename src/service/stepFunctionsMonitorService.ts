import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import {
  SFNClient,
  StartExecutionCommand,
  StopExecutionCommand,
  SendTaskSuccessCommand,
  StopExecutionCommandInput,
} from "@aws-sdk/client-sfn";

import { MonitorData, MonitorEventData, MonitorInfo } from "~/types/monitor";
import { UserInfo } from "~/types/user";
import { killIfNoEnvVariables } from "~/utils";

import { MonitorService } from "./monitorService";
import { logger } from "~/utils/logger";

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

class StepFunctionsMonitorService extends MonitorService {
  tableName = MONITOR_TABLE_NAME;

  getRunningMonitorsByUserId = (
    userId: UserInfo["id"]
  ): Promise<MonitorInfo[]> => {
    return ddbDocClient
      .query({
        TableName: this.tableName,
        IndexName: MONITOR_TABLE_GSI_NAME,
        KeyConditionExpression:
          "#status = :statusVal and begins_with(#userIdKey, :userId)",
        ExpressionAttributeValues: {
          ":statusVal": "IN_PROGRESS" as MonitorInfo["status"],
          ":userId": userId,
        },
        ExpressionAttributeNames: {
          "#status": "status" as DynamoMonitorInfoKey,
          "#userIdKey": "userId_date" as DynamoMonitorInfoKey,
        },
      })
      .then(({ Items }) => Items as DynamoMonitorInfo[]);
  };

  getMonitorById = (id: MonitorInfo["id"]): Promise<MonitorInfo> => {
    return ddbDocClient
      .get({
        TableName: this.tableName,
        Key: { ["id" as keyof MonitorInfo]: id },
      })
      .then(({ Item }) => {
        if (!Item) {
          return Promise.reject("404: Invalid monitor id");
        }

        return Item as DynamoMonitorInfo;
      });
  };

  saveMonitor = (monitor: MonitorData): Promise<MonitorInfo> => {
    const id = this.generateMonitorId();
    const data: DynamoMonitorInfo = {
      ...monitor,
      id,
      status: "IN_PROGRESS",
      userId_date: `${monitor.userId}_${monitor.date}`,
    };

    return ddbDocClient
      .put({
        TableName: this.tableName,
        Item: data,
      })
      .then(() => data);
  };

  startMonitor = async (monitor: MonitorData): Promise<MonitorInfo> => {
    const { STATE_MACHINE_ARN } = killIfNoEnvVariables(["STATE_MACHINE_ARN"]);

    const input: MonitorEventData = {
      monitorInfo: {
        ...monitor,
        id: this.generateMonitorId(),
        status: "IN_PROGRESS",
        arn: "", // will be set by SM
      },
      prevSlots: [],
      timeOutTime: this.getTimeout(),
    };

    logger.info(input, "StepFunctionsMonitorService.startMonitor");

    const executionInfo = await sfnClient.send(
      new StartExecutionCommand({
        stateMachineArn: STATE_MACHINE_ARN,
        input: JSON.stringify(input),
      })
    );

    logger.info(executionInfo, "StepFunctionsMonitorService.saveMonitor");

    return this.saveMonitor({
      ...input.monitorInfo,
      arn: executionInfo.executionArn,
    });
  };

  stopMonitor(monitorInfo: MonitorInfo): Promise<void> {
    const executionInfo: StopExecutionCommandInput = {
      executionArn: monitorInfo.arn,
    };

    return sfnClient.send(new StopExecutionCommand(executionInfo)).then(() => {
      logger.info(executionInfo, "StepFunctionsMonitorService: Stoped monitor");

      return ddbDocClient
        .update({
          TableName: this.tableName,
          Key: { ["id" as keyof MonitorInfo]: monitorInfo.id },
          ExpressionAttributeNames: {
            "#status": "status" as DynamoMonitorInfoKey,
          },
          ExpressionAttributeValues: {
            ":status": "STOPED" as MonitorInfo["status"],
          },
          UpdateExpression: "SET #status = :status",
        })
        .then(() => {
          logger.info(
            executionInfo,
            "StepFunctionsMonitorService: Updated DB with stoped monitor"
          );
        });
    });
  }

  prolongMonitor({
    taskToken,
  }: {
    monitorInfo: MonitorInfo;
    taskToken: string;
  }): Promise<void> {
    return sfnClient
      .send(
        new SendTaskSuccessCommand({
          output: this.getTimeout(),
          taskToken,
        })
      )
      .then(() => {});
  }
}

export const stepFunctionsMonitorService = new StepFunctionsMonitorService();
