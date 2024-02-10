import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

import { UserInfo } from "~/types/user";
import { killIfNoEnvVariables } from "~/utils";

import { UserService } from "./userService";

const { AWS_REGION, USER_TABLE_NAME } = killIfNoEnvVariables([
  "USER_TABLE_NAME",
  "AWS_REGION",
]);

const ddbDocClient = DynamoDBDocument.from(
  new DynamoDBClient({ region: AWS_REGION })
);

export class DynamoDBUserService extends UserService {
  userId: string;
  tableName: string = USER_TABLE_NAME;

  getInfo = (): Promise<UserInfo | undefined> => {
    return ddbDocClient
      .get({
        TableName: this.tableName,
        Key: { ["id" as keyof UserInfo]: this.userId },
      })
      .then(({ Item }) => Item as UserInfo);
  };

  createUpdateUserInfo = (userInfo: UserInfo): Promise<UserInfo> => {
    return ddbDocClient
      .put({
        TableName: this.tableName,
        Item: userInfo,
      })
      .then(() => userInfo);
  };
}
