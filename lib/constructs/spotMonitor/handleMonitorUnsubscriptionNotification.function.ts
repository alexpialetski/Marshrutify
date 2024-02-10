import { EventBridgeEvent } from "aws-lambda";

import {
  MonitorUnsubscriptionNotificationPayload,
  monitorUnsubscriptionNotificationEvent,
} from "~/events/monitorUnsubscriptionNotificationEvent";
import { EventFacadeType } from "~/events/types";
import { getClientService } from "~/serviceMap";

export const handler = async (
  event: EventBridgeEvent<
    EventFacadeType<typeof monitorUnsubscriptionNotificationEvent>,
    MonitorUnsubscriptionNotificationPayload
  >
): Promise<unknown> => {
  const { monitorEventData, taskToken } = event.detail;
  const client = getClientService(monitorEventData.monitorInfo.client);

  return client.notifyAboutUnsubscription({
    monitorInfo: monitorEventData.monitorInfo,
    taskToken,
  });
};
