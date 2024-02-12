import { DestinationInfo } from "~/types/path";
import { getRandomInt } from "~/utils";

import { AvailableTimeSlot, BusProviderService } from "./busProviderService";

const TEST_DEST_INFO1: DestinationInfo = { id: "testid1", name: "Test 1" };
const TEST_DEST_INFO2: DestinationInfo = { id: "testid2", name: `Test 2` };

const ALL_DESTINATIONS: DestinationInfo[] = [TEST_DEST_INFO1, TEST_DEST_INFO2];

const getRandomTimeSlot = () =>
  Array.from({ length: getRandomInt(4) }).map(
    () => `${getRandomInt(24)}:${getRandomInt(59)}`
  );

export class MockedBusProviderService extends BusProviderService {
  provider: "MARSHRUTOCHKA";

  getFromDestinations = () =>
    Promise.resolve<DestinationInfo[]>(ALL_DESTINATIONS);

  getToDestinations = (from: DestinationInfo) =>
    Promise.resolve<DestinationInfo[]>(
      ALL_DESTINATIONS.filter((dest) => dest.id !== from.id)
    );

  getDestinationInfoById = (id: string): Promise<DestinationInfo> => {
    const destInfo = ALL_DESTINATIONS.find((dest) => dest.id === id);

    return destInfo
      ? Promise.resolve(destInfo)
      : Promise.reject("Error: Could not find dest info");
  };

  getAvailableTimeSlots = (_: {
    from: DestinationInfo;
    to: DestinationInfo;
    date: Date;
  }): Promise<AvailableTimeSlot[]> => Promise.resolve(getRandomTimeSlot());
}
