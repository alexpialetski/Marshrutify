import { MonitorData, MonitorEventData, MonitorInfo } from "~/types/monitor";
import { TypedEventEmitter, addMinutes } from "~/utils";

import { MonitorService } from "./monitorService";
import { TimerMonitorStorageService } from "./monitorStorage/timerMonitorStorageService";
import { MonitorStorageService } from "./monitorStorage/monitorStorageService";

type Monitor = {
  monitorInfo: MonitorInfo;
  timerId: NodeJS.Timeout | undefined;
};

class MonitorsArray {
  arr = new Array<Monitor>();

  getArray = (): Array<Monitor> => this.arr;

  updateMonitor = (
    monitorId: MonitorInfo["id"],
    fun: (monitor: Monitor) => Monitor
  ) => {
    this.arr = this.getArray().map((monitor) => {
      if (monitor.monitorInfo.id === monitorId) {
        clearTimeout(monitor.timerId);

        return fun(monitor);
      }

      return monitor;
    });
  };

  stopMonitor = (monitorId: MonitorInfo["id"]): void => {
    this.updateMonitor(monitorId, (monitor) => ({
      ...monitor,
      monitorInfo: { ...monitor.monitorInfo, status: "STOPED" },
    }));
  };

  stopAllMonitors = () =>
    this.getArray().forEach((monitor) =>
      this.stopMonitor(monitor.monitorInfo.id)
    );

  addMonitor = (monitorInfo: MonitorInfo): Monitor => {
    const monitor: Monitor = { monitorInfo, timerId: undefined };

    this.getArray().push(monitor);

    return monitor;
  };
}

type EventMap = {
  seatNotifier: MonitorEventData;
};

const timerMonitorStorageService = new TimerMonitorStorageService();

export class EventEmitterMonitorService extends MonitorService {
  eventEmiter = new TypedEventEmitter<EventMap>();
  notifierInterval: number;
  monitorStorage: TimerMonitorStorageService;

  constructor(params: { notifierInterval?: number } = {}) {
    super(timerMonitorStorageService);

    this.notifierInterval = params.notifierInterval || 5 * 1000;
  }

  startMonitor(monitorData: MonitorData): Promise<MonitorInfo> {
    return this.monitorStorage.saveMonitor(monitorData).then((monitorInfo) => {
      this.eventEmiter.emit("seatNotifier", {
        monitorInfo,
        prevSlots: [],
        timeOutTime: { value: addMinutes(new Date(), 5).toUTCString() },
      });

      return monitorInfo;
    });
  }

  stopMonitor(monitorInfo: MonitorInfo): Promise<void> {
    return this.onMonitorStopped(monitorInfo);
  }

  onMonitorStopped(monitorInfo: MonitorInfo): Promise<void> {
    return this.monitorStorage.updateMonitorStatusById({
      ...monitorInfo,
      status: "STOPED",
    });
  }

  prolongMonitor(_: MonitorInfo): Promise<void> {
    return Promise.reject("Not implemented.");
  }

  cleanUp = () => this.monitorStorage.monitors.stopAllMonitors();

  subscribe = (
    func: (payload: EventMap["seatNotifier"]) => Promise<MonitorEventData>
  ): void => {
    this.eventEmiter.on("seatNotifier", (payload) =>
      func(payload).then((resultData) => {
        const newTimerId = setTimeout(
          () => this.eventEmiter.emit("seatNotifier", resultData),
          this.notifierInterval
        );

        this.monitorStorage.monitors.updateMonitor(
          payload.monitorInfo.id,
          (monitor) => ({
            ...monitor,
            timerId: newTimerId,
          })
        );
      })
    );
  };
}
