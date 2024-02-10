import { MonitorEventData } from "~/types/monitor";

import { EventFacade } from "./types";

export type UserRequestedMonitorEventPayload = MonitorEventData;

export class UserRequestedMonitorEvent extends EventFacade<MonitorEventData> {
  getEventDetailType() {
    return "User requested monitor" as const;
  }
}

export const userRequestedMonitorEvent = new UserRequestedMonitorEvent();
