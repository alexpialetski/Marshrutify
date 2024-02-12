import { MonitorData, MonitorInfo } from "~/types/monitor";
import { MonitorStorageService } from "./monitorStorageService";

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

export class TimerMonitorStorageService extends MonitorStorageService {
  monitors = new MonitorsArray();

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
      execution: {},
    };

    this.monitors.addMonitor(monitorInfo);

    return Promise.resolve(monitorInfo);
  }

  updateMonitorStatusById(
    params: Pick<MonitorInfo, "id" | "userId" | "status">
  ): Promise<void> {
    return Promise.resolve().then(() => {
      this.monitors.updateMonitor(params.id, (monitor) => ({
        ...monitor,
        monitorInfo: { ...monitor.monitorInfo, status: params.status },
      }));
    });
  }

  updateMonitorExecutionById(
    params: Pick<MonitorInfo, "id" | "userId" | "execution">
  ): Promise<void> {
    return Promise.resolve().then(() => {
      this.monitors.updateMonitor(params.id, (monitor) => ({
        ...monitor,
        monitorInfo: { ...monitor.monitorInfo, execution: params.execution },
      }));
    });
  }
}
