import { EventBridgeEvent, Handler, EventBridgeHandler } from "aws-lambda";
import { lambdaRequestTracker } from "pino-lambda";

import {
  MonitorUnsubscriptionNotificationPayload,
  monitorUnsubscriptionNotificationEvent,
} from "~/events/monitorUnsubscriptionNotificationEvent";
import { EventFacadeType } from "~/events/types";
import { getClientService } from "~/serviceMap";
import { logger } from "~/utils/logger";

const withRequest = lambdaRequestTracker();

export const handler: EventBridgeHandler<
  EventFacadeType<typeof monitorUnsubscriptionNotificationEvent>,
  MonitorUnsubscriptionNotificationPayload,
  unknown
> = async (event, context) => {
  withRequest(event, context);

  const { monitorEventData, taskToken } = event.detail;
  const client = getClientService(monitorEventData.monitorInfo.client);

  try {
    await client.notifyAboutUnsubscription({
      monitorInfo: monitorEventData.monitorInfo,
      taskToken,
    });
  } catch (error) {
    logger.error(error, "client.notifyAboutUnsubscription");
    // throw error; // do not fail. flow will stop state machine after some time
  }

  return Promise.resolve();
};
