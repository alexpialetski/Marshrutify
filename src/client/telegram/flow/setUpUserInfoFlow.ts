import { Telegraf, Context, Markup } from "telegraf";
import { Message } from "telegraf/types";

import { BUS_PROVIDERS } from "~/constants/busProvider";
import { BusProvider } from "~/types/busProvider";
import { UserInfo } from "~/types/user";
import { DestinationInfo } from "~/types/path";
import { ServiceMap } from "~/service/types";

import { ActionQueryKey, genericErrorHandler, getUserId } from "../utils";

type Initiator<T = unknown> = (
  ctx: Context,
  payload: T
) => Promise<Message.TextMessage>;

type DestinationDir = "from" | "to";

const getDestinationQuery = (destDir: DestinationDir) =>
  ActionQueryKey<{
    destId: DestinationInfo["id"];
  }>(`SetUpUserInfo:${destDir}`);

const busProviderActionQuery = ActionQueryKey<{ provider: BusProvider }>(
  "SetUpUserInfo:Provider"
);

const setUpDestination: Initiator<{
  getDestinations: () => Promise<DestinationInfo[]>;
  message: string;
  destDir: DestinationDir;
}> = async (ctx, { getDestinations, message, destDir }) => {
  const destinations = await getDestinations();
  const actionQuery = getDestinationQuery(destDir);

  return ctx.reply(
    message,
    Markup.inlineKeyboard(
      destinations.map((destination) => [
        Markup.button.callback(
          destination.name,
          actionQuery.serialize({ destId: destination.id })
        ),
      ])
    )
  );
};

const setUpBusProvider: Initiator = (ctx) =>
  ctx.reply(
    "Choose your fighter (bus provider):",
    Markup.inlineKeyboard(
      BUS_PROVIDERS.map((provider) =>
        Markup.button.callback(
          provider,
          busProviderActionQuery.serialize({ provider })
        )
      )
    )
  );

export const setUpUserInfo: Initiator<{
  userInfo: UserInfo | undefined;
  serviceMap: ServiceMap;
}> = async (ctx, { userInfo, serviceMap: { getBusProviderService } }) => {
  if (!userInfo) {
    return setUpBusProvider(ctx, undefined);
  }

  const busProvider = getBusProviderService(userInfo.busProvider);
  const { from, to } = userInfo;

  if (!from) {
    return setUpDestination(ctx, {
      destDir: "from",
      getDestinations: () => busProvider.getFromDestinations(),
      message: "What is the start of the trip?",
    });
  }

  if (!to) {
    return setUpDestination(ctx, {
      destDir: "to",
      getDestinations: () => busProvider.getToDestinations(from),
      message: "What is the end of the trip",
    });
  }

  return ctx.sendMessage(
    "You are set up. Use /monitor to subscribe on specific date and get updates on ticket changes."
  );
};

export const handleSetUpUserInfo = (bot: Telegraf, serviceMap: ServiceMap) => {
  const { getUserService, getBusProviderService } = serviceMap;

  // bus provider response
  BUS_PROVIDERS.map((provider) =>
    bot.action(busProviderActionQuery.serialize({ provider }), (ctx, next) => {
      const userId = getUserId(ctx);

      return getUserService(userId)
        .createUpdateUserInfo({ id: userId, busProvider: provider })
        .catch(
          genericErrorHandler(ctx, "Error: getUserService.createUpdateUserInfo")
        )
        .then((userInfo) => setUpUserInfo(ctx, { userInfo, serviceMap }))
        .then(() => next());
    })
  );

  // destination response
  (["from", "to"] as DestinationDir[]).forEach((destinationDir) => {
    const actionQuery = getDestinationQuery(destinationDir);

    bot.action(actionQuery.baseAsRegex, async (ctx, next) => {
      const userService = getUserService(getUserId(ctx));

      const userInfo = await userService.getInfo();

      if (!userInfo) {
        return setUpUserInfo(ctx, { userInfo, serviceMap });
      }

      const { destId } = actionQuery.deserialize(ctx.match.input);

      return getBusProviderService(userInfo.busProvider)
        .getDestinationInfoById(destId)
        .catch(
          genericErrorHandler(
            ctx,
            "Error: getBusProviderService.getDestinationInfoById"
          )
        )
        .then((destInfo) =>
          userService.createUpdateUserInfo({
            ...userInfo,
            [destinationDir]: destInfo,
          })
        )
        .catch(
          genericErrorHandler(ctx, "Error: userService.createUpdateUserInfo")
        )
        .then((userInfo) => setUpUserInfo(ctx, { userInfo, serviceMap }))
        .then(() => next());
    });
  });
};
