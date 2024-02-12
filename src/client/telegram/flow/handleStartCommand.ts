import { Telegraf } from "telegraf";

import { ServiceMap } from "~/service/types";

import { getUserId } from "../utils";
import { setUpUserInfo } from "./setUpUserInfoFlow";

export const handleStartCommand = (bot: Telegraf, serviceMap: ServiceMap) => {
  const { getUserService } = serviceMap;

  bot.start(async (ctx) => {
    const userInfo = await getUserService(getUserId(ctx)).getInfo();

    if (userInfo) {
      return ctx.reply(
        "Use /monitor to subscribe on available tickets or /info to check your current set up"
      );
    }

    return ctx
      .reply(`Hello, I am your assistant. Let's set you up first`)
      .then(() => setUpUserInfo(ctx, { userInfo, serviceMap }));
  });
};
