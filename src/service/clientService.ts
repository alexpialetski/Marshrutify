import { Client } from "~/types/client";
import { MonitorInfo } from "~/types/monitor";
import { UserInfo } from "~/types/user";

import { AvailableTimeSlot } from "./busProviderService";

export abstract class ClientService {
  clientName: Client;

  constructor(clientName: Client) {
    this.clientName = clientName;
  }

  abstract notifyAboutAvailability: (params: {
    added: AvailableTimeSlot[];
    removed: AvailableTimeSlot[];
    monitorInfo: MonitorInfo;
  }) => Promise<unknown>;

  abstract notifyUser: (
    userId: UserInfo["id"],
    text: string
  ) => Promise<unknown>;

  abstract notifyAboutUnsubscription: (params: {
    monitorInfo: MonitorInfo;
    taskToken: string;
  }) => Promise<unknown>;
}
