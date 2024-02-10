import { Telegraf } from "telegraf";
import columnify from "columnify";

import { isFullUserInfo } from "~/types/user";
import { ServiceMap } from "~/service/types";

import { ColumnifyMap, getUserId } from "./utils";
import { handleSetUpUserInfo, setUpUserInfo } from "./flow/setUpUserInfoFlow";
import { handleSetUpMonitorFlow, setUpMonitor } from "./flow/setUpMonitorFlow";
import { handleStopMonitor, stopMonitorFlow } from "./flow/stopMonitorFlow";

export const setUpBot = (bot: Telegraf, serviceMap: ServiceMap): Telegraf => {
  const { getUserService, getMonitorService } = serviceMap;

  handleSetUpUserInfo(bot, serviceMap);
  handleSetUpMonitorFlow(bot, serviceMap);
  handleStopMonitor(bot, serviceMap);

  bot.start(async (ctx) => {
    const userInfo = await getUserService(getUserId(ctx)).getInfo();

    if (userInfo) {
      return ctx.reply(
        "Here we go again... Just trying to sleep quitely\nTry /help if you are lost, stranger"
      );
    }

    return ctx
      .reply(
        `Hello, I am your assistant... Tired of this crap though...\nLet's set you up first`
      )
      .then(() => setUpUserInfo(ctx, { userInfo, serviceMap }));
  });

  bot.command("setup", (ctx) => {
    return setUpUserInfo(ctx, { userInfo: undefined, serviceMap });
  });

  bot.command("info", async (ctx) => {
    const userInfo = await getUserService(getUserId(ctx)).getInfo();

    if (!isFullUserInfo(userInfo)) {
      return setUpUserInfo(ctx, { userInfo, serviceMap });
    }

    let result = `<b>User info</b><pre>${columnify(
      ColumnifyMap.forUser(userInfo),
      {
        columns: ["ABOUT", "INFO"],
      }
    ).toString()}</pre>`;

    const monitors = await getMonitorService().getRunningMonitorsByUserId(
      userInfo.id
    );

    if (monitors.length) {
      result += `<b>Monitor info</b><pre>${columnify(
        monitors.map(ColumnifyMap.forMonitor)
      ).toString()}</pre>`;
    }

    return ctx.reply(result, { parse_mode: "HTML" });
  });

  bot.command("monitor", (ctx) => {
    return setUpMonitor(ctx, { bot, serviceMap });
  });

  bot.command("stop_monitor", async (ctx) => {
    return stopMonitorFlow(ctx, serviceMap);
  });

  return bot;
};
