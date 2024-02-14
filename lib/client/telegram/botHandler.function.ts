import http from "serverless-http";
import { lambdaRequestTracker } from "pino-lambda";
import { Handler } from "aws-lambda";

import { killIfNoEnvVariables } from "~/utils";
import {
  getBusProviderService,
  getMonitorService,
  getUserService,
} from "~/serviceMap";
import { setUpBot } from "~/client/telegram/bot";
import {
  TelegramClientService,
  getTelegrafWithTokenFromSSM,
} from "~/client/telegram/service";
import { getLambdaEnvArray } from "~/types/env";

const { TELEGRAM_BOT_PATH } = killIfNoEnvVariables(
  getLambdaEnvArray([
    "TELEGRAM_BOT_PATH",
    "AWS_REGION",
    "MINUTES_BEFORE_MONITOR_UNSUBSCRIPTION",
  ])
);

const withRequest = lambdaRequestTracker();

export const handler: Handler = (event, context) => {
  withRequest(event, context);

  return getTelegrafWithTokenFromSSM().then((telegraf) => {
    const telegramClient = new TelegramClientService(telegraf);

    setUpBot(telegraf, {
      getBusProviderService,
      getMonitorService,
      getUserService,
      getClientService: () => telegramClient,
    });

    return http(telegraf.webhookCallback(TELEGRAM_BOT_PATH))(event, context);
  });
};
