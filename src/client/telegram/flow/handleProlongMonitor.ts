import { Telegraf } from "telegraf";

import { ServiceMap } from "~/service/types";
import { prolongMonitorQuery } from "../constants";
import { genericErrorHandler, getUserId } from "../utils";

export const handleProlongMonitor = (bot: Telegraf, serviceMap: ServiceMap) => {
  bot.action(prolongMonitorQuery.baseAsRegex, (ctx, next) => {
    const { id } = prolongMonitorQuery.deserialize(ctx.match.input);
    const monitorService = serviceMap.getMonitorService();

    return monitorService.monitorStorage
      .getMonitorById(id, getUserId(ctx))
      .then((monitorInfo) => monitorService.prolongMonitor(monitorInfo))
      .catch(genericErrorHandler(ctx, "handleProlongMonitor"))
      .then(() => next());
  });
};
