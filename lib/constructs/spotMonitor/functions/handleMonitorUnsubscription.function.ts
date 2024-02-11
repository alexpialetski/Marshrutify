import { EventBridgeHandler } from "aws-lambda";
import { lambdaRequestTracker } from "pino-lambda";

import {
  monitorUnsubscriptionEvent,
  MonitorUnsubscriptionPayload,
} from "~/events/monitorUnsubscriptionEvent";
import { EventFacadeType } from "~/events/types";
import { getClientService, getMonitorService } from "~/serviceMap";
import { logger } from "~/utils/logger";

const withRequest = lambdaRequestTracker();

export const handler: EventBridgeHandler<
  EventFacadeType<typeof monitorUnsubscriptionEvent>,
  MonitorUnsubscriptionPayload,
  unknown
> = async (event, context) => {
  withRequest(event, context);

  const monitorEventData = event.detail;
  const client = getClientService(monitorEventData.monitorInfo.client);
  const monitorService = getMonitorService();

  logger.info(monitorEventData.monitorInfo, "monitorService.onMonitorStopped");

  await monitorService.onMonitorStopped(monitorEventData.monitorInfo);

  return client.notifyUser(
    monitorEventData.monitorInfo.userId,
    `Monitor ${monitorEventData.monitorInfo.id} unsubscribed`
  );
};
