import { BusProvider } from "../types/busProvider";
import { DestinationInfo } from "../types/path";
import { addDays } from "../utils";

export type AvailableTimeSlot = string; // like 12:45

export abstract class BusProviderService {
  abstract provider: BusProvider;

  abstract getFromDestinations: () => Promise<DestinationInfo[]>;

  abstract getToDestinations: (
    from: DestinationInfo
  ) => Promise<DestinationInfo[]>;

  abstract getDestinationInfoById: (
    id: DestinationInfo["id"]
  ) => Promise<DestinationInfo>;

  abstract getAvailableTimeSlots: (params: {
    from: DestinationInfo;
    to: DestinationInfo;
    date: Date;
  }) => Promise<AvailableTimeSlot[]>;

  // week in future
  getMaxFutureDateForMonitor = (): Date => addDays(new Date(), 7);
}
