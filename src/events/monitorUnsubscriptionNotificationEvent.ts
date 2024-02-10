import { MonitorEventData } from "~/types/monitor";

import { EventFacade } from "./types";

export type MonitorUnsubscriptionNotificationPayload = {
  monitorEventData: MonitorEventData;
  taskToken: string;
};

class MonitorUnsubscriptionNotificationEvent extends EventFacade<MonitorUnsubscriptionNotificationPayload> {
  getEventDetailType(): string {
    return "Monitor unsubscription notification";
  }
}

export const monitorUnsubscriptionNotificationEvent =
  new MonitorUnsubscriptionNotificationEvent();
