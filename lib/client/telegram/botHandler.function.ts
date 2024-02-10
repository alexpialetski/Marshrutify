import http from "serverless-http";

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

const { TELEGRAM_BOT_PATH } = killIfNoEnvVariables([
  "TELEGRAM_BOT_PATH",
  "TELEGRAM_BOT_TOKEN_SECRET_ID",
]);

// setup webhook
export const handler: http.Handler = (event, context) =>
  getTelegrafWithTokenFromSSM().then((telegraf) => {
    const telegramClient = new TelegramClientService(telegraf);

    setUpBot(telegraf, {
      getBusProviderService,
      getMonitorService,
      getUserService,
      getClientService: () => telegramClient,
    });

    return http(telegraf.webhookCallback(TELEGRAM_BOT_PATH))(event, context);
  });
