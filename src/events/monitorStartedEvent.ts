import { MonitorEventData } from "~/types/monitor";

import { EventFacade } from "./types";

export type MonitorStartedEventPayload = MonitorEventData;

export class MonitorStartedEvent extends EventFacade<MonitorEventData> {
  getEventDetailType() {
    return "Monitor started" as const;
  }
}

export const monitorStartedEvent = new MonitorStartedEvent();
