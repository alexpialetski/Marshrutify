import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import path = require("path");

import { UserTableConstruct } from "../../constructs/userTable.construct";
import { MonitorTableConstruct } from "../../constructs/monitorTable.construct";
import { SpotMonitorConstruct } from "../../constructs/spotMonitor";
import { LambdaEnvVariable } from "../../types";
import { getTelegramBotTokenSecret } from "../../utils";
import { TelegramWebhookResource } from "./telegramWebHookResource";

interface TelegramClientStackProps {
  readonly httpApi: cdk.aws_apigatewayv2.HttpApi;
  readonly userTable: UserTableConstruct;
  readonly monitorTable: MonitorTableConstruct;
  readonly spotMonitor: SpotMonitorConstruct;
  readonly lambdaEnvs: Record<LambdaEnvVariable, any>;
}

export class TelegramClientConstruct extends Construct {
  public readonly urlOutput: cdk.CfnOutput;

  constructor(
    scope: Construct,
    id: string,
    {
      userTable,
      monitorTable,
      httpApi,
      spotMonitor,
      lambdaEnvs,
    }: TelegramClientStackProps
  ) {
    super(scope, id);

    const telegramBotToken = getTelegramBotTokenSecret(this);

    const telegramBotHandler = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "TelegramBotHandler",
      {
        entry: path.join(__dirname, "botHandler.function.ts"),
        handler: "handler",
        environment: lambdaEnvs,
      }
    );

    const telegramBotAddRoute: cdk.aws_apigatewayv2.AddRoutesOptions = {
      path: lambdaEnvs.TELEGRAM_BOT_PATH,
      methods: [cdk.aws_apigatewayv2.HttpMethod.POST],
      integration: new cdk.aws_apigatewayv2_integrations.HttpLambdaIntegration(
        "TelegramBotApiRoute",
        telegramBotHandler
      ),
    };

    httpApi.addRoutes(telegramBotAddRoute);

    const telegramBotUrl = httpApi.apiEndpoint + telegramBotAddRoute.path;

    new TelegramWebhookResource(this, "TelegramWebhook", {
      botTokenSecret: telegramBotToken,
      webhookUrl: telegramBotUrl,
    });

    // IAM grants
    userTable.table.grantReadWriteData(telegramBotHandler);
    monitorTable.table.grantReadWriteData(telegramBotHandler);
    spotMonitor.stateMachine.grantExecution(
      telegramBotHandler,
      "states:StopExecution"
    );
    spotMonitor.stateMachine.grant(
      telegramBotHandler,
      "states:SendTaskSuccess",
      "states:StartExecution"
    );
    telegramBotToken.grantRead(telegramBotHandler);

    this.urlOutput = new cdk.CfnOutput(this, "telegram-bot-url", {
      value: telegramBotUrl,
    });
  }
}
