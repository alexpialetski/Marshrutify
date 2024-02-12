import columnify from "columnify";
import { Telegraf } from "telegraf";

import { ServiceMap } from "~/service/types";
import { isFullUserInfo } from "~/types/user";

import { ColumnifyMap, getUserId } from "../utils";
import { setUpUserInfo } from "./setUpUserInfoFlow";

export const handleInfoCommand = (bot: Telegraf, serviceMap: ServiceMap) => {
  const { getUserService, getMonitorService } = serviceMap;

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

    const monitors =
      await getMonitorService().monitorStorage.getRunningMonitorsByUserId(
        userInfo.id
      );

    if (monitors.length) {
      result += `<b>Monitor info</b><pre>${columnify(
        monitors.map(ColumnifyMap.forMonitor)
      ).toString()}</pre>`;
    }

    return ctx.reply(result, { parse_mode: "HTML" });
  });
};
