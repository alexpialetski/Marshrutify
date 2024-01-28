import { Context, Markup, Telegraf } from "telegraf";
import columnify from "columnify";

import { ServiceMap } from "../types";
import { ActionQueryKey, ColumnifyMap, getUserId } from "../utils";
import { isFullUserInfo } from "../../../types/user";
import { setUpUserInfo } from "./setUpUserInfoFlow";
import { MonitorInfo } from "../../../types/monitor";

const stopMonitorActionQuery = ActionQueryKey<{
  id: MonitorInfo["id"];
}>(`StopMonitor:`);

export const handleStopMonitor = (
  bot: Telegraf,
  { getMonitorService }: ServiceMap
) => {
  bot.action(stopMonitorActionQuery.baseAsRegex, (ctx, next) => {
    const { id } = stopMonitorActionQuery.deserialize(ctx.match.input);

    return getMonitorService()
      .stopMonitor(id)
      .then(() => ctx.reply(`Stopped poor slave with id: ${id}`))
      .then(() => next());
  });
};

export const stopMonitorFlow = async (
  ctx: Context,
  { getMonitorService }: ServiceMap
) => {
  const monitors = await getMonitorService().getRunningMonitorsByUserId(
    getUserId(ctx)
  );

  if (!monitors.length) {
    return ctx.reply("Bad news, buddy, you aint have no monitors");
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
};
