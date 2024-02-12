import * as cdk from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import { Construct } from "constructs";

import { MonitorTableConstruct } from "./constructs/monitorTable.construct";
import { UserTableConstruct } from "./constructs/userTable.construct";
import { TelegramClientConstruct } from "./client/telegram/telegramClient.construct";
import { LambdaEnvVariable } from "./types";
import { SpotMonitorConstruct } from "./constructs/spotMonitor";
import { getTelegramBotTokenSecret } from "./utils";

export class MarshrutifyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const telegramBotToken = getTelegramBotTokenSecret(this);

    const httpApi = new cdk.aws_apigatewayv2.HttpApi(this, "HttpApi");

    const userTable = new UserTableConstruct(this);

    const monitorTable = new MonitorTableConstruct(this);

    const lambdaEnvVariables: Record<LambdaEnvVariable, string> = {
      USER_TABLE_NAME: userTable.table.tableName,
      //
      MONITOR_TABLE_NAME: monitorTable.table.tableName,
      MONITOR_TABLE_GSI_NAME: monitorTable.monitorTableGSINameOutput.value,
      //
      TELEGRAM_BOT_TOKEN_SECRET_ID: telegramBotToken.secretArn,
      TELEGRAM_BOT_PATH: "/telegram-bot",
      //
      STATE_MACHINE_ARN: "", // calculated later
      MINUTES_BEFORE_MONITOR_UNSUBSCRIPTION: "20",
    };

    const spotMonitor = new SpotMonitorConstruct(this, "Monitor", {
      eventBus: events.EventBus.fromEventBusName(
        this,
        "AWSDefaultEventBus",
        "default"
      ),
      lambdaEnvs: lambdaEnvVariables,
      monitorTable,
    });

    new TelegramClientConstruct(this, "TelegramClientStack", {
      httpApi,
      userTable,
      monitorTable,
      spotMonitor,
      lambdaEnvs: {
        ...lambdaEnvVariables,
        STATE_MACHINE_ARN: spotMonitor.stateMachineArn.value,
      },
    });
  }
}
