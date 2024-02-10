import { EventBridgeEvent } from "aws-lambda";

import { TelegramClientService } from "~/client/telegram/service";
import {
  MonitorStartedEvent,
  MonitorStartedEventPayload,
} from "~/events/monitorStartedEvent";
import { EventFacadeType } from "~/events/types";
import { getClientService } from "~/serviceMap";

export const handler = async (
  event: EventBridgeEvent<
    EventFacadeType<MonitorStartedEvent>,
    MonitorStartedEventPayload
  >
): Promise<MonitorStartedEventPayload> => {
  const { monitorInfo } = event.detail;
  const clientService = getClientService(monitorInfo.client);

  await clientService.notifyUser(
    monitorInfo.userId,
    `Successfully started monitor ${monitorInfo.id}. For more details use /info`
  );

  return Promise.resolve(event.detail);
};
