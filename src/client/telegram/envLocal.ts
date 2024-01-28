import { Telegraf } from "telegraf";

import { setUpBot } from "./bot";
import { MockedUserService } from "../../service/mockedUserService";
import { EventEmitterMonitorService } from "../../service/eventEmitterMonitorService";
import {
  GetBusProviderServiceFn,
  GetClientServiceFn,
  GetMonitorServiceFn,
  GetUserServiceFn,
} from "./types";
import { TelegramClientService } from "../../service/telegramClientService";
import { MarshrutochkaService } from "../../service/MarshrutochkaService";

const TELEGRAM_BOT_TOKEN = process.env["TELEGRAM_BOT_TOKEN"];

if (!TELEGRAM_BOT_TOKEN) {
  process.exit(1);
}

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

const eventEmitterMonitorService = new EventEmitterMonitorService();

const getClientService: GetClientServiceFn = () =>
  new TelegramClientService(bot);
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
