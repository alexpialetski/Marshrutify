import { getLambdaEnvArray } from "~/types/env";

import { MonitorData, MonitorEventData, MonitorInfo } from "../types/monitor";
import { AvailableTimeSlot } from "./busProvider/busProviderService";
import { DiffData, diff } from "fast-array-diff";
import { ServiceMap } from "./types";
import { addMinutes, killIfNoEnvVariables } from "~/utils";
import { MonitorStorageService } from "./monitorStorage/monitorStorageService";

const { MINUTES_BEFORE_MONITOR_UNSUBSCRIPTION } = killIfNoEnvVariables(
  getLambdaEnvArray(["MINUTES_BEFORE_MONITOR_UNSUBSCRIPTION"])
);

export abstract class MonitorService {
  monitorStorage: MonitorStorageService;

  constructor(monitorStorage: MonitorStorageService) {
    this.monitorStorage = monitorStorage;
  }

  abstract startMonitor(monitor: MonitorData): Promise<MonitorInfo>;

  abstract stopMonitor(monitorInfo: MonitorInfo): Promise<void>;

  abstract onMonitorStopped(monitorInfo: MonitorInfo): Promise<void>;

  abstract prolongMonitor(monitorInfo: MonitorInfo): Promise<void>;

  getTimeout = (): string =>
    addMinutes(
      new Date(),
      Number(MINUTES_BEFORE_MONITOR_UNSUBSCRIPTION)
    ).toISOString();

  // for yyyy-mm-dd format
  convertToDate = (date: string): Date => new Date(date);

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
