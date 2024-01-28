import { Telegraf } from "telegraf";
import { ExtraReplyMessage } from "telegraf/typings/telegram-types";

import { ClientService } from "./clientService";
import columnify from "columnify";

import { ColumnifyMap } from "../client/telegram/utils";
import { MonitorInfo } from "../types/monitor";

export class TelegramClientService extends ClientService {
  telegraf: Telegraf;

  constructor(telegraf: Telegraf) {
    super("TELEGRAM");

    this.telegraf = telegraf;
  }

  notifyAboutAvailability = ({
    added,
    removed,
    monitorInfo,
  }: {
    added: string[];
    removed: string[];
    monitorInfo: MonitorInfo;
  }): Promise<unknown> => {
    let resultMessage = "";

    if (added.length || removed.length) {
      resultMessage = columnify(
        {
          ...ColumnifyMap.forMonitor(monitorInfo),
          Added: added.join(", "),
          Removed: removed.join(", "),
        },
        { columns: ["ABOUT", "INFO"] }
      );
    }

    return resultMessage
      ? this.notifyUser(
          monitorInfo.userId,
          `<b>Monitor notification</b><pre>${resultMessage}</pre>`
        )
      : Promise.resolve();
  };

  notifyUser = (userId: string, text: string): Promise<unknown> => {
    return this.telegraf.telegram.sendMessage(userId, text, {
      parse_mode: "HTML",
    });
  };
}
