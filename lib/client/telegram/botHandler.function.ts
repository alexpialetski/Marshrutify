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
import { logger } from "~/utils/logger";

const { TELEGRAM_BOT_PATH } = killIfNoEnvVariables(["TELEGRAM_BOT_PATH"]);

const withRequest = lambdaRequestTracker();

export const handler: Handler = (event, context) => {
  withRequest(event, context);

  return getTelegrafWithTokenFromSSM().then((telegraf) => {
    const telegramClient = new TelegramClientService(telegraf);

    logger.info(undefined, "Telegram client is set up");

    setUpBot(telegraf, {
      getBusProviderService,
      getMonitorService,
      getUserService,
      getClientService: () => telegramClient,
    });

    return http(telegraf.webhookCallback(TELEGRAM_BOT_PATH))(event, context);
  });
};
