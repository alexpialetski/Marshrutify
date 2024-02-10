import { Telegraf } from "telegraf";

import { ServiceMap } from "~/service/types";
import { prolongMonitorQuery } from "../constants";

export const handleSetUpMonitorFlow = (
  bot: Telegraf,
  serviceMap: ServiceMap
) => {
  bot.action(prolongMonitorQuery.baseAsRegex, (ctx, next) => {
    const { id, t } = prolongMonitorQuery.deserialize(ctx.match.input);
    const monitorService = serviceMap.getMonitorService();

    return monitorService
      .getMonitorById(id)
      .then((monitorInfo) =>
        monitorService.prolongMonitor({ monitorInfo, taskToken: t })
      )
      .then(() => next());
  });
};
