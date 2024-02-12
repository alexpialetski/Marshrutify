import { MonitorInfo } from "~/types/monitor";
import { ActionQueryKey } from "./utils";

export const prolongMonitorQuery = ActionQueryKey<{
  id: MonitorInfo["id"];
}>("ProlongMonitor");
