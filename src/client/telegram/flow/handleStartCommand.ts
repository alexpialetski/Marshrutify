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
        "Here we go again... Just trying to sleep quitely\nTry /help if you are lost, stranger"
      );
    }

    return ctx
      .reply(
        `Hello, I am your assistant... Tired of this crap though...\nLet's set you up first`
      )
      .then(() => setUpUserInfo(ctx, { userInfo, serviceMap }));
  });
};
