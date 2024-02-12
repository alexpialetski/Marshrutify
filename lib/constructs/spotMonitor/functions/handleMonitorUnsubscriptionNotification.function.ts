import { EventBridgeHandler } from "aws-lambda";
import { lambdaRequestTracker } from "pino-lambda";

import {
  MonitorUnsubscriptionNotificationPayload,
  monitorUnsubscriptionNotificationEvent,
} from "~/events/monitorUnsubscriptionNotificationEvent";
import { EventFacadeType } from "~/events/types";
import { getClientService, getMonitorService } from "~/serviceMap";
import { logger } from "~/utils/logger";

const withRequest = lambdaRequestTracker();

export const handler: EventBridgeHandler<
  EventFacadeType<typeof monitorUnsubscriptionNotificationEvent>,
  MonitorUnsubscriptionNotificationPayload,
  unknown
> = async (event, context) => {
  withRequest(event, context);

  logger.info(event.detail, "Event.detail");

  const {
    monitorEventData: { monitorInfo },
    taskToken,
  } = event.detail;
  const client = getClientService(monitorInfo.client);
  const monitorService = getMonitorService();

  try {
    await monitorService.monitorStorage.updateMonitorExecutionById({
      id: monitorInfo.id,
      userId: monitorInfo.userId,
      execution: { ...monitorInfo.execution, taskToken },
    });

    logger.info(
      undefined,
      "monitorService.monitorStorage.updateMonitorExecutionById success"
    );
  } catch (error) {
    logger.error(
      error,
      "Error: monitorService.monitorStorage.updateMonitorExecutionById"
    );
    throw error;
  }

  try {
    await client.notifyAboutUnsubscription(monitorInfo);
  } catch (error) {
    logger.error(error, "client.notifyAboutUnsubscription");
    // throw error; // do not fail. flow will stop state machine after some time
  }

  return Promise.resolve();
};
