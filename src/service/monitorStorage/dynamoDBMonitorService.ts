import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

import { killIfNoEnvVariables } from "~/utils";

import {
  CreateMonitorData,
  MonitorStorageService,
} from "./monitorStorageService";
import { UserInfo } from "~/types/user";
import { MonitorInfo } from "~/types/monitor";
import { getLambdaEnvArray } from "~/types/env";

const { MONITOR_TABLE_NAME, AWS_REGION, MONITOR_TABLE_GSI_NAME } =
  killIfNoEnvVariables(
    getLambdaEnvArray([
      "MONITOR_TABLE_NAME",
      "AWS_REGION",
      "MONITOR_TABLE_GSI_NAME",
    ])
  );

const ddbDocClient = DynamoDBDocument.from(
  new DynamoDBClient({ region: AWS_REGION })
);

type DynamoMonitorInfo = MonitorInfo & {
  userId_date: string;
};

type DynamoMonitorInfoKey = keyof DynamoMonitorInfo;

export class DynamoDBMonitorService extends MonitorStorageService {
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

  getMonitorById = (
    id: MonitorInfo["id"],
    userId: string
  ): Promise<MonitorInfo> => {
    return ddbDocClient
      .get({
        TableName: this.tableName,
        Key: {
          ["id" as DynamoMonitorInfoKey]: id,
          ["userId" as DynamoMonitorInfoKey]: userId,
        },
      })
      .then(({ Item }) => {
        if (!Item) {
          return Promise.reject("404: Invalid monitor id");
        }

        return Item as DynamoMonitorInfo;
      });
  };
  saveMonitor(monitor: CreateMonitorData): Promise<MonitorInfo> {
    const data: DynamoMonitorInfo = {
      ...monitor,
      id: monitor.id || this.generateMonitorId(),
      status: monitor.status || "IN_PROGRESS",
      userId_date: `${monitor.userId}_${monitor.date}`,
    };

    return ddbDocClient
      .put({
        TableName: this.tableName,
        Item: data,
      })
      .then(() => data);
  }

  updateMonitorStatusById(
    params: Pick<MonitorInfo, "id" | "userId" | "status">
  ): Promise<void> {
    return ddbDocClient
      .update({
        TableName: this.tableName,
        Key: {
          ["id" as DynamoMonitorInfoKey]: params.id,
          ["userId" as DynamoMonitorInfoKey]: params.userId,
        },
        ExpressionAttributeNames: {
          "#status": "status" as DynamoMonitorInfoKey,
        },
        ExpressionAttributeValues: {
          ":status": params.status,
        },
        UpdateExpression: "SET #status = :status",
      })
      .then(() => {});
  }

  updateMonitorExecutionById(
    params: Pick<MonitorInfo, "id" | "userId" | "execution">
  ): Promise<void> {
    return ddbDocClient
      .update({
        TableName: this.tableName,
        Key: {
          ["id" as DynamoMonitorInfoKey]: params.id,
          ["userId" as DynamoMonitorInfoKey]: params.userId,
        },
        ExpressionAttributeNames: {
          "#execution": "execution" as DynamoMonitorInfoKey,
        },
        ExpressionAttributeValues: {
          ":execution": params.execution,
        },
        UpdateExpression: "SET #execution = :execution",
      })
      .then(() => {});
  }
}
