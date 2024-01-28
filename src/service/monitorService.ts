import { v4 as uuidv4 } from "uuid";

import { MonitorData, MonitorInfo } from "../types/monitor";
import { UserInfo } from "../types/user";
import { AvailableTimeSlot } from "./busProviderService";
import { DiffData, diff } from "fast-array-diff";
import { ServiceMap } from "../client/telegram/types";

export type MonitorResultEventData = {
  monitorInfo: MonitorInfo;
  prevSlots: AvailableTimeSlot[];
};

export abstract class MonitorService {
  abstract getRunningMonitorsByUserId(
    userId: UserInfo["id"]
  ): Promise<MonitorInfo[]>;

  abstract getMonitorById(id: MonitorInfo["id"]): Promise<MonitorInfo>;

  abstract startMonitor(monitor: MonitorData): Promise<void>;

  abstract stopMonitor(monitorId: MonitorInfo["id"]): Promise<void>;

  abstract saveMonitor(monitor: MonitorData): Promise<MonitorInfo>;

  // for yyyy-mm-dd format
  convertDate = (date: string): Date => new Date(date);

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
    }: MonitorResultEventData): Promise<MonitorResultEventData> =>
      getBusProviderService(monitorInfo.busProvider)
        .getAvailableTimeSlots({
          from: monitorInfo.from,
          to: monitorInfo.to,
          date: this.convertDate(monitorInfo.date),
        })
        .then((slots) => {
          const { added, removed } = this.getDiffOfSlots(prevSlots, slots);

          return getClientService(monitorInfo.client)
            .notifyAboutAvailability({ added, removed, monitorInfo })
            .then<MonitorResultEventData>(() => ({
              monitorInfo,
              prevSlots: slots,
            }));
        });
}
