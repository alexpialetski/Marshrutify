import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import path = require("path");

import { UserTableConstruct } from "../../constructs/userTable.construct";
import { MonitorTableConstruct } from "../../constructs/monitorTable.construct";
import { LambdaEnvVariable } from "../../types";
import { getTelegramBotTokenSecret } from "../../utils";

interface TelegramClientStackProps {
  readonly httpApi: cdk.aws_apigatewayv2.HttpApi;
  readonly userTable: UserTableConstruct;
  readonly monitorTable: MonitorTableConstruct;
  readonly lambdaEnvs: Record<LambdaEnvVariable, any>;
}

export class TelegramClientConstruct extends Construct {
  public readonly urlOutput: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props: TelegramClientStackProps) {
    super(scope, id);

    const { userTable, monitorTable, httpApi } = props;

    const telegramBotHandler = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "TelegramBotHandler",
      {
        entry: path.join(__dirname, "botHandler.function.ts"),
        handler: "handler",
        environment: props.lambdaEnvs,
      }
    );

    const telegramBotAddRoute: cdk.aws_apigatewayv2.AddRoutesOptions = {
      path: props.lambdaEnvs.TELEGRAM_BOT_PATH,
      methods: [cdk.aws_apigatewayv2.HttpMethod.POST],
      integration: new cdk.aws_apigatewayv2_integrations.HttpLambdaIntegration(
        "TelegramBotApiRoute",
        telegramBotHandler
      ),
    };

    httpApi.addRoutes(telegramBotAddRoute);

    const telegramBotUrl = httpApi.apiEndpoint + telegramBotAddRoute.path;

    //  TODO: set token for Telegram bot automatically
    // new AwsCustomResource(this, 'Custom', {
    //   onUpdate: {
    //     service: '',
    //     action: ''
    //   }
    // })

    userTable.table.grantReadWriteData(telegramBotHandler);
    monitorTable.table.grantReadWriteData(telegramBotHandler);

    const telegramBotToken = getTelegramBotTokenSecret(this);
    telegramBotToken.grantRead(telegramBotHandler);

    this.urlOutput = new cdk.CfnOutput(this, "telegram-bot-url", {
      value: telegramBotUrl,
    });
  }
}
