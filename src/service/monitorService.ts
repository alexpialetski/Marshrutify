import { v4 as uuidv4 } from "uuid";

import { MonitorData, MonitorEventData, MonitorInfo } from "../types/monitor";
import { UserInfo } from "../types/user";
import { AvailableTimeSlot } from "./busProviderService";
import { DiffData, diff } from "fast-array-diff";
import { ServiceMap } from "./types";
import { addMinutes } from "~/utils";

export abstract class MonitorService {
  abstract getRunningMonitorsByUserId(
    userId: UserInfo["id"]
  ): Promise<MonitorInfo[]>;

  abstract getMonitorById(
    id: MonitorInfo["id"],
    userId: string
  ): Promise<MonitorInfo>;

  abstract startMonitor(monitor: MonitorData): Promise<MonitorInfo>;

  abstract stopMonitor(monitorInfo: MonitorInfo): Promise<void>;

  abstract onMonitorStopped(monitorInfo: MonitorInfo): Promise<void>;

  abstract saveMonitor(monitor: MonitorData): Promise<MonitorInfo>;

  abstract prolongMonitor(params: {
    monitorInfo: MonitorInfo;
    taskToken: string;
  }): Promise<void>;

  getTimeout = (): string => addMinutes(new Date(), 2).toISOString(); // TODO: change to 20 minutes

  // for yyyy-mm-dd format
  convertToDate = (date: string): Date => new Date(date);

  generateMonitorId = (): MonitorInfo["id"] => uuidv4().slice(0, 6);

  getDiffOfSlots = (
    prevSlots: AvailableTimeSlot[],
    currSlots: AvailableTimeSlot[]
  ): DiffData<AvailableTimeSlot, AvailableTimeSlot> =>
    diff(prevSlots, currSlots);

  handleMonitorResult =
    ({
      getBusProviderService,
      getClientService,
    }: Pick<ServiceMap, "getBusProviderService" | "getClientService">) =>
    ({
      monitorInfo,
      prevSlots,
      ...rest
    }: MonitorEventData): Promise<MonitorEventData> =>
      getBusProviderService(monitorInfo.busProvider)
        .getAvailableTimeSlots({
          from: monitorInfo.from,
          to: monitorInfo.to,
          date: this.convertToDate(monitorInfo.date),
        })
        .then((slots) => {
          const { added, removed } = this.getDiffOfSlots(prevSlots, slots);

          return getClientService(monitorInfo.client)
            .notifyAboutAvailability({ added, removed, monitorInfo })
            .then<MonitorEventData>(() => ({
              ...rest,
              monitorInfo,
              prevSlots: slots,
            }));
        });
}
