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

  logger.info(monitorEventData.monitorInfo, "monitorService.stopMonitor");

  try {
    await monitorService.stopMonitor(monitorEventData.monitorInfo);
  } catch (error) {
    logger.error(error, "Error: monitorService.stopMonitor");
    // throw error; // do not fail, state machine will timeout (TODO: better handling)

    return client.notifyUser(
      monitorEventData.monitorInfo.userId,
      `Could not stop poor guy ${monitorEventData.monitorInfo.id}... It is his whole life`
    );
  }

  return client.notifyUser(
    monitorEventData.monitorInfo.userId,
    `Monitor ${monitorEventData.monitorInfo.id} unsubscribed`
  );
};
