import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export const getTelegramBotTokenSecret = (
  scope: Construct
): cdk.aws_secretsmanager.ISecret =>
  secretsmanager.Secret.fromSecretNameV2(
    scope,
    "marshrutify-telegram-bot-token",
    "marshrutify-telegram-bot-token"
  );
