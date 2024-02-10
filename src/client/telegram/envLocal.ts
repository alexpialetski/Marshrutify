import { Telegraf } from "telegraf";

import { MockedUserService } from "~/service/mockedUserService";
import { EventEmitterMonitorService } from "~/service/eventEmitterMonitorService";
import { MarshrutochkaService } from "~/service/MarshrutochkaService";

import { setUpBot } from "./bot";
import {
  GetBusProviderServiceFn,
  GetClientServiceFn,
  GetMonitorServiceFn,
  GetUserServiceFn,
} from "~/service/types";
import { TelegramClientService } from "./service";

const { TELEGRAM_BOT_TOKEN } = process.env;

if (!TELEGRAM_BOT_TOKEN) {
  process.exit(1);
}
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

const telegramClient = new TelegramClientService(bot);
const eventEmitterMonitorService = new EventEmitterMonitorService();

const getClientService: GetClientServiceFn = () => telegramClient;
const getUserService: GetUserServiceFn = (userId) =>
  new MockedUserService(userId);
const getBusProviderService: GetBusProviderServiceFn = () => {
  //   return new MockedBusProviderService();
  return new MarshrutochkaService();
};
const getMonitorService: GetMonitorServiceFn = () => eventEmitterMonitorService;

eventEmitterMonitorService.subscribe(
  eventEmitterMonitorService.handleMonitorResult({
    getBusProviderService,
    getClientService,
  })
);

setUpBot(bot, {
  getUserService,
  getBusProviderService,
  getClientService,
  getMonitorService,
}).launch();

// Enable graceful stop
process.once("SIGINT", () => {
  bot.stop("SIGINT");
  eventEmitterMonitorService.cleanUp();
});
process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
  eventEmitterMonitorService.cleanUp();
});
