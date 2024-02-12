import { Handler } from "aws-lambda";
import { lambdaRequestTracker } from "pino-lambda";

import { getClientService, getMonitorService } from "~/serviceMap";
import { MonitorEventData } from "~/types/monitor";
import { logger } from "~/utils/logger";

const withRequest = lambdaRequestTracker();

export const handler: Handler<MonitorEventData, void> = async (
  event,
  context
) => {
  withRequest(event, context);

  logger.info(event, "Event");

  const monitorEventData = event;
  const client = getClientService(monitorEventData.monitorInfo.client);
  const monitorService = getMonitorService();

  logger.info(monitorEventData.monitorInfo, "monitorService.onMonitorStopped");

  await monitorService.onMonitorStopped(monitorEventData.monitorInfo);

  await client.notifyUser(
    monitorEventData.monitorInfo.userId,
    `Monitor ${monitorEventData.monitorInfo.id} unsubscribed`
  );

  return;
};
