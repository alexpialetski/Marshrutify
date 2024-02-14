// telegram-webhook-resource.ts
import * as cdk from "aws-cdk-lib";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import path = require("path");

export interface TelegramWebhookResourceProps {
  botTokenSecret: cdk.aws_secretsmanager.ISecret;
  webhookUrl: string;
}

export class TelegramWebhookResource extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: TelegramWebhookResourceProps
  ) {
    super(scope, id);

    const setWebhookFunction = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "SetWebhookFunction",
      {
        entry: path.join(__dirname, "handler.function.ts"),
        handler: "handler",
        environment: {
          BOT_TOKEN_SECRET_ARN: props.botTokenSecret.secretArn,
          WEBHOOK_URL: props.webhookUrl,
        },
      }
    );

    props.botTokenSecret.grantRead(setWebhookFunction);

    const provider = new custom.Provider(this, "Provider", {
      onEventHandler: setWebhookFunction,
    });

    new cdk.CustomResource(this, "WebhookResource", {
      serviceToken: provider.serviceToken,
    });
  }
}
