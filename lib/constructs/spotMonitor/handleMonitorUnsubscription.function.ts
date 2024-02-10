import { EventBridgeEvent } from "aws-lambda";

import {
  monitorUnsubscriptionEvent,
  MonitorUnsubscriptionPayload,
} from "~/events/monitorUnsubscriptionEvent";
import { EventFacadeType } from "~/events/types";
import { getClientService, getMonitorService } from "~/serviceMap";

export const handler = async (
  event: EventBridgeEvent<
    EventFacadeType<typeof monitorUnsubscriptionEvent>,
    MonitorUnsubscriptionPayload
  >
): Promise<unknown> => {
  const monitorEventData = event.detail;
  const client = getClientService(monitorEventData.monitorInfo.client);
  const monitorService = getMonitorService();

  await monitorService.stopMonitor(monitorEventData.monitorInfo);

  return client.notifyUser(
    monitorEventData.monitorInfo.userId,
    `Monitor ${monitorEventData.monitorInfo.id} unsubscribed`
  );
};
