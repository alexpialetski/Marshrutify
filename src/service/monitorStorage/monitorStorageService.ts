import { v4 as uuidv4 } from "uuid";

import { MonitorInfo } from "~/types/monitor";
import { UserInfo } from "~/types/user";
import { PartialKeys } from "~/types/utility";

export type CreateMonitorData = PartialKeys<MonitorInfo, "id" | "status">;

export abstract class MonitorStorageService {
  abstract getRunningMonitorsByUserId(
    userId: UserInfo["id"]
  ): Promise<MonitorInfo[]>;

  abstract getMonitorById(
    id: MonitorInfo["id"],
    userId: string
  ): Promise<MonitorInfo>;

  abstract saveMonitor(monitor: CreateMonitorData): Promise<MonitorInfo>;

  abstract updateMonitorStatusById(
    params: Pick<MonitorInfo, "id" | "userId" | "status">
  ): Promise<void>;

  abstract updateMonitorExecutionById(
    params: Pick<MonitorInfo, "id" | "userId" | "execution">
  ): Promise<void>;

  generateMonitorId = (): MonitorInfo["id"] => uuidv4().slice(0, 6);
}
