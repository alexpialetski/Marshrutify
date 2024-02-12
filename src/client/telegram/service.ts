import { Markup, Telegraf } from "telegraf";
import columnify from "columnify";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

import { ColumnifyMap } from "~/client/telegram/utils";
import { MonitorInfo } from "~/types/monitor";
import { ClientService } from "~/service/clientService";

import { prolongMonitorQuery } from "./constants";
import { killIfNoEnvVariables } from "~/utils";

const { AWS_REGION, TELEGRAM_BOT_TOKEN_SECRET_ID } = killIfNoEnvVariables([
  "AWS_REGION",
  "TELEGRAM_BOT_TOKEN_SECRET_ID",
]);

const smClient = new SecretsManagerClient({ region: AWS_REGION });

export const getTelegrafWithTokenFromSSM = (): Promise<Telegraf> =>
  smClient
    .send(new GetSecretValueCommand({ SecretId: TELEGRAM_BOT_TOKEN_SECRET_ID }))
    .then(({ SecretString }) => new Telegraf(SecretString!));

export class TelegramClientService extends ClientService {
  telegraf?: Telegraf;

  constructor(telegraf?: Telegraf) {
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

  initializeTelegraf = (): Promise<Telegraf> => {
    if (this.telegraf) {
      return Promise.resolve(this.telegraf);
    }

    return getTelegrafWithTokenFromSSM().then((telegraf) => {
      this.telegraf = telegraf;

      return this.telegraf;
    });
  };

  notifyUser = (userId: string, text: string): Promise<unknown> => {
    return this.initializeTelegraf().then((telegraf) =>
      telegraf.telegram.sendMessage(userId, text, {
        parse_mode: "HTML",
      })
    );
  };

  notifyAboutUnsubscription = (monitorInfo: MonitorInfo): Promise<unknown> => {
    return this.initializeTelegraf().then((telegraf) =>
      telegraf.telegram.sendMessage(
        monitorInfo.userId,
        `Do you want to prolong suffering of your loyal slave ${monitorInfo.id}?`,
        Markup.inlineKeyboard([
          Markup.button.callback(
            "Prolong",
            prolongMonitorQuery.serialize({ id: monitorInfo.id })
          ),
        ])
      )
    );
  };
}
