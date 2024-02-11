import { EventBridgeEvent, Handler } from "aws-lambda";
import { lambdaRequestTracker } from "pino-lambda";

import {
  MonitorStartedEvent,
  MonitorStartedEventPayload,
} from "~/events/monitorStartedEvent";
import { EventFacadeType } from "~/events/types";
import { getClientService } from "~/serviceMap";
import { logger } from "~/utils/logger";

const withRequest = lambdaRequestTracker();

export const handler: Handler<
  EventBridgeEvent<
    EventFacadeType<MonitorStartedEvent>,
    MonitorStartedEventPayload
  >,
  MonitorStartedEventPayload
> = async (event, context) => {
  withRequest(event, context);

  const { monitorInfo } = event.detail;
  const clientService = getClientService(monitorInfo.client);

  logger.info({ monitorInfo }, "clientService.notifyUser");

  try {
    await clientService.notifyUser(
      monitorInfo.userId,
      `Successfully started monitor ${monitorInfo.id}. For more details use /info`
    );
  } catch (error) {
    logger.error(error, "Error: clientService.notifyUser");
    // throw error; // do not fail if noitification about start has an error
  }

  return Promise.resolve(event.detail);
};
