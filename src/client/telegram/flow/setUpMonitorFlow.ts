import { Telegraf, Context } from "telegraf";
import Calendar from "telegraf-calendar-telegram";

import { isFullUserInfo } from "~/types/user";
import { ServiceMap } from "~/service/types";

import { getUserId } from "../utils";
import { setUpUserInfo } from "./setUpUserInfoFlow";

export const handleSetUpMonitorFlow = (
  bot: Telegraf,
  serviceMap: ServiceMap
) => {
  new Calendar(bot).setDateListener(async (ctx, date) => {
    const { getUserService, getMonitorService } = serviceMap;
    const userInfo = await getUserService(getUserId(ctx)).getInfo();

    if (!isFullUserInfo(userInfo)) {
      return setUpUserInfo(ctx, { userInfo, serviceMap });
    }

    return getMonitorService()
      .startMonitor({
        busProvider: userInfo.busProvider,
        client: "TELEGRAM",
        date,
        from: userInfo.from,
        to: userInfo.to,
        userId: userInfo.id,
      })
      .then(() => ctx.reply("Monitor is set up. Wait for notifications"));
  });
};

export const setUpMonitor = async (
  ctx: Context,
  {
    bot,
    serviceMap,
  }: {
    bot: Telegraf;
    serviceMap: ServiceMap;
  }
) => {
  const { getUserService, getBusProviderService } = serviceMap;
  const userInfo = await getUserService(getUserId(ctx)).getInfo();

  if (!isFullUserInfo(userInfo)) {
    return setUpUserInfo(ctx, { userInfo, serviceMap });
  }

  const busProvider = getBusProviderService(userInfo.busProvider);
  const calendar = new Calendar(bot, {
    minDate: new Date(),
    maxDate: busProvider.getMaxFutureDateForMonitor(),
  });

  return ctx.reply("When is your adventure?", calendar.getCalendar());
};
