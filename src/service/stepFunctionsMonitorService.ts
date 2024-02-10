import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import {
  SFNClient,
  StartExecutionCommand,
  StopExecutionCommand,
  SendTaskSuccessCommand,
} from "@aws-sdk/client-sfn";

import { MonitorData, MonitorEventData, MonitorInfo } from "~/types/monitor";
import { UserInfo } from "~/types/user";
import { killIfNoEnvVariables } from "~/utils";

import { MonitorService } from "./monitorService";

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

export class StepFunctionsMonitorService extends MonitorService {
  tableName = MONITOR_TABLE_NAME;

  getRunningMonitorsByUserId = (
    userId: UserInfo["id"]
  ): Promise<MonitorInfo[]> => {
    return ddbDocClient
      .query({
        TableName: this.tableName,
        IndexName: MONITOR_TABLE_GSI_NAME, // replace with your actual GSI name
        KeyConditionExpression:
          "#status = :statusVal and begins_with(#userIdKey, :userId)",
        ExpressionAttributeValues: {
          ":statusVal": { S: "IN_PROGRESS" as MonitorInfo["status"] }, // S type for strings
          ":userId": { S: userId }, // S type for strings
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

    const executionInfo = await sfnClient.send(
      new StartExecutionCommand({
        stateMachineArn: STATE_MACHINE_ARN,
        input: JSON.stringify(input),
      })
    );

    return this.saveMonitor({
      ...input.monitorInfo,
      arn: executionInfo.executionArn,
    });
  };

  stopMonitor(monitorInfo: MonitorInfo): Promise<void> {
    return sfnClient
      .send(
        new StopExecutionCommand({
          executionArn: monitorInfo.arn,
        })
      )
      .then(() => {});
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
