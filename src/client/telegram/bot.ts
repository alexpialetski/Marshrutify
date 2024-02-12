import { Telegraf } from "telegraf";
import columnify from "columnify";

import { isFullUserInfo } from "~/types/user";
import { ServiceMap } from "~/service/types";

import { ColumnifyMap, getUserId } from "./utils";
import { handleSetUpUserInfo, setUpUserInfo } from "./flow/setUpUserInfoFlow";
import { handleSetUpMonitorFlow, setUpMonitor } from "./flow/setUpMonitorFlow";
import { handleStopMonitor, stopMonitorFlow } from "./flow/stopMonitorFlow";
import { handleInfoCommand } from "./flow/handleInfoCommand";
import { handleStartCommand } from "./flow/handleStartCommand";
import { handleProlongMonitor } from "./flow/handleProlongMonitor";

export const setUpBot = (bot: Telegraf, serviceMap: ServiceMap): Telegraf => {
  // FLOW
  handleSetUpUserInfo(bot, serviceMap);
  handleSetUpMonitorFlow(bot, serviceMap);
  handleStopMonitor(bot, serviceMap);
  handleProlongMonitor(bot, serviceMap);
  // COMMANDS
  handleInfoCommand(bot, serviceMap);
  handleStartCommand(bot, serviceMap);

  bot.command("setup", (ctx) => {
    return setUpUserInfo(ctx, { userInfo: undefined, serviceMap });
  });

  bot.command("monitor", (ctx) => {
    return setUpMonitor(ctx, { bot, serviceMap });
  });

  bot.command("stop_monitor", async (ctx) => {
    return stopMonitorFlow(ctx, serviceMap);
  });

  return bot;
};
