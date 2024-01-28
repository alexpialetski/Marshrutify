import { MonitorResultEventData, MonitorService } from "./monitorService";
import { MonitorData, MonitorInfo } from "../types/monitor";
import { TypedEventEmitter } from "../utils";
import { AvailableTimeSlot } from "./busProviderService";

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
  seatNotifier: MonitorResultEventData;
};

export class EventEmitterMonitorService extends MonitorService {
  eventEmiter = new TypedEventEmitter<EventMap>();
  monitors = new MonitorsArray();
  notifierInterval: number;

  constructor(params: { notifierInterval?: number } = {}) {
    super();

    this.notifierInterval = params.notifierInterval || 5 * 1000;
  }

  getMonitorById(id: string): Promise<MonitorInfo> {
    const monitorData = this.monitors
      .getArray()
      .find((monitor) => monitor.monitorInfo.id === id);

    return monitorData
      ? Promise.resolve(monitorData.monitorInfo)
      : Promise.reject("404: Invalid monitor id");
  }

  getRunningMonitorsByUserId(userId: string): Promise<MonitorInfo[]> {
    return Promise.resolve(
      this.monitors
        .getArray()
        .filter(
          (monitor) =>
            monitor.monitorInfo.userId === userId &&
            monitor.monitorInfo.status === "IN_PROGRESS"
        )
        .map((data) => data.monitorInfo)
    );
  }

  saveMonitor(monitorData: MonitorData): Promise<MonitorInfo> {
    const monitorInfo: MonitorInfo = {
      ...monitorData,
      id: this.generateMonitorId(),
      status: "IN_PROGRESS",
    };

    this.monitors.addMonitor(monitorInfo);

    return Promise.resolve(monitorInfo);
  }

  startMonitor(monitorData: MonitorData): Promise<void> {
    return this.saveMonitor(monitorData).then((monitorInfo) => {
      this.eventEmiter.emit("seatNotifier", { monitorInfo, prevSlots: [] });
    });
  }

  stopMonitor(monitorId: string): Promise<void> {
    return Promise.resolve().then(() => this.monitors.stopMonitor(monitorId));
  }

  cleanUp = () => this.monitors.stopAllMonitors();

  subscribe = (
    func: (payload: EventMap["seatNotifier"]) => Promise<MonitorResultEventData>
  ): void => {
    this.eventEmiter.on("seatNotifier", (payload) =>
      func(payload).then((resultData) => {
        const newTimerId = setTimeout(
          () => this.eventEmiter.emit("seatNotifier", resultData),
          this.notifierInterval
        );

        this.monitors.updateMonitor(payload.monitorInfo.id, (monitor) => ({
          ...monitor,
          timerId: newTimerId,
        }));
      })
    );
  };
}
