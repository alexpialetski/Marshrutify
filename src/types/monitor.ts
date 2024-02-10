import { AvailableTimeSlot, BusProvider } from "./busProvider";
import { Client } from "./client";
import { DestinationInfo } from "./path";
import { FullUserInfo } from "./user";

export type MonitorData = {
  userId: FullUserInfo["id"];
  busProvider: BusProvider;
  from: DestinationInfo;
  to: DestinationInfo;
  client: Client;
  date: string; // yyyy-mm-dd
  arn?: string;
};

export type MonitorInfo = MonitorData & {
  id: string;
  status: "IN_PROGRESS" | "STOPED";
};

export type MonitorEventData = {
  timeOutTime: string;
  monitorInfo: MonitorInfo;
  prevSlots: AvailableTimeSlot[];
};