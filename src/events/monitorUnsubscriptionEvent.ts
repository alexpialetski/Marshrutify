import { MonitorEventData } from "~/types/monitor";

import { EventFacade } from "./types";

export type MonitorUnsubscriptionPayload = MonitorEventData;

class MonitorUnsubscriptionEvent extends EventFacade<MonitorUnsubscriptionPayload> {
  getEventDetailType(): string {
    return "Monitor unsubscribed";
  }
}

export const monitorUnsubscriptionEvent = new MonitorUnsubscriptionEvent();
