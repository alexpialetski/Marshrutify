import { MonitorEventData } from "~/types/monitor";
import {
  getMonitorService,
  getBusProviderService,
  getClientService,
} from "~/serviceMap";

export const handler = async (
  event: MonitorEventData
): Promise<MonitorEventData> => {
  console.log("Event: ", event);

  const result = await getMonitorService().handleMonitorResult({
    getBusProviderService,
    getClientService,
  })(event);

  console.log("Result: ", result);

  return Promise.resolve(result);
};
