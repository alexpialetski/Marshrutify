import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import fetch from "node-fetch-commonjs";
import { lambdaRequestTracker } from "pino-lambda";
import { Handler } from "aws-lambda";

import { killIfNoEnvVariables } from "~/utils";
import { getLambdaEnvArray } from "~/types/env";
import { logger } from "~/utils/logger";

const { AWS_REGION, TELEGRAM_BOT_TOKEN_SECRET_ID, WEBHOOK_URL } =
  killIfNoEnvVariables([
    ...getLambdaEnvArray(["AWS_REGION", "TELEGRAM_BOT_TOKEN_SECRET_ID"]),
    "WEBHOOK_URL" as const,
  ]);

const withRequest = lambdaRequestTracker();

const smClient = new SecretsManagerClient({ region: AWS_REGION });

export const handler: Handler = async (event, context) => {
  withRequest(event, context);

  const { SecretString: botToken } = await smClient.send(
    new GetSecretValueCommand({ SecretId: TELEGRAM_BOT_TOKEN_SECRET_ID })
  );

  if (!botToken) {
    return Promise.reject("No telegram bot token");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/setWebhook?url=${WEBHOOK_URL}`
  );

  logger.info("Telegram setWebhook response:", response);

  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
};
