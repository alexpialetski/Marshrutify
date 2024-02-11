import { Handler } from "aws-lambda";
import { lambdaRequestTracker } from "pino-lambda";

import {
  getMonitorService,
  getBusProviderService,
  getClientService,
} from "~/serviceMap";
import { MonitorEventData } from "~/types/monitor";
import { logger } from "~/utils/logger";

const withRequest = lambdaRequestTracker();

export const handler: Handler<MonitorEventData, MonitorEventData> = async (
  event,
  context
) => {
  withRequest(event, context);

  let result: MonitorEventData;

  logger.info(event.timeOutTime, "getMonitorService().handleMonitorResult");

  try {
    result = await getMonitorService().handleMonitorResult({
      getBusProviderService,
      getClientService,
    })(event);
  } catch (error) {
    logger.error(error, "getMonitorService().handleMonitorResult");

    throw error;
  }

  return Promise.resolve(result);
};
