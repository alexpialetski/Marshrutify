import { Context, Markup, Telegraf } from "telegraf";
import columnify from "columnify";

import { MonitorInfo } from "~/types/monitor";
import { ServiceMap } from "~/service/types";

import {
  ActionQueryKey,
  ColumnifyMap,
  genericErrorHandler,
  getUserId,
} from "../utils";

const stopMonitorActionQuery = ActionQueryKey<{
  id: MonitorInfo["id"];
}>(`StopMonitor:`);

export const handleStopMonitor = (
  bot: Telegraf,
  { getMonitorService }: ServiceMap
) => {
  bot.action(stopMonitorActionQuery.baseAsRegex, (ctx, next) => {
    const { id } = stopMonitorActionQuery.deserialize(ctx.match.input);
    const monitorService = getMonitorService();

    return monitorService.monitorStorage
      .getMonitorById(id, getUserId(ctx))
      .then(monitorService.stopMonitor)
      .then(() => ctx.reply(`Monitor ${id} has been stoped`))
      .catch(genericErrorHandler(ctx, "Error: monitorService.stopMonitor"))
      .then(() => next());
  });
};

export const stopMonitorFlow = async (
  ctx: Context,
  { getMonitorService }: ServiceMap
) =>
  getMonitorService()
    .monitorStorage.getRunningMonitorsByUserId(getUserId(ctx))
    .then((monitors) => {
      if (!monitors.length) {
        return ctx.reply("There are no monitors available");
      }

      return ctx.reply(
        `<b>Running monitors</b><pre>${columnify(
          monitors.map(ColumnifyMap.forMonitor)
        ).toString()}</pre>`,
        {
          ...Markup.inlineKeyboard(
            monitors.map((monitor) =>
              Markup.button.callback(
                monitor.id,
                stopMonitorActionQuery.serialize({ id: monitor.id })
              )
            )
          ),
          parse_mode: "HTML",
        }
      );
    })
    .catch(genericErrorHandler(ctx, "Error: stopMonitorFlow"));
