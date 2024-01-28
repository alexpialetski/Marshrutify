import { Context } from "telegraf";
import { MonitorInfo } from "../../types/monitor";
import { FullUserInfo, UserInfo } from "../../types/user";

// TODO: think about "!"
export const getUserId = (ctx: Context): string => String(ctx.chat!.id);

export function ActionQueryKey<T extends object>(
  queryBase: string
): {
  serialize: (payload: T) => string;
  deserialize: (actionQueryKey: string) => T;
  baseAsRegex: RegExp;
} {
  const separator = "||";

  return {
    serialize: (payload: T) =>
      `${queryBase}${separator}${JSON.stringify(payload)}`,
    deserialize: (actionQueryKey) => {
      const [, payload] = actionQueryKey.split(separator);

      return JSON.parse(payload) as T;
    },
    baseAsRegex: new RegExp(queryBase),
  };
}

export const ColumnifyMap = {
  forMonitor: (monitorInfo: MonitorInfo): Record<string, string> => ({
    Id: monitorInfo.id,
    Bus: monitorInfo.busProvider,
    Date: monitorInfo.date,
    From: monitorInfo.from.name,
    To: monitorInfo.to.name,
  }),
  forUser: (userInfo: FullUserInfo): Record<string, string> => ({
    Bus: userInfo.busProvider,
    From: userInfo.from.name,
    To: userInfo.to.name,
  }),
};
