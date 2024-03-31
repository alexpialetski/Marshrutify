import go from "gojs";

import { UmlClassLinkData, UmlClassNodeData } from "../diagrams/umlClass";
import type { BusProviderService } from "../../src/service/busProvider/busProviderService";
import type { MockedBusProviderService } from "../../src/service/busProvider/mockedBusProviderService";
import type { MarshrutochkaService } from "../../src/service/busProvider/MarshrutochkaService";

const nodedata = [
  {
    key: 1,
    name: "BusProviderService",
    properties: [{ name: "provider", type: "string", visibility: "public" }],
    methods: [
      {
        name: "getFromDestinations",
        visibility: "public",
        type: "Promise",
      },
      {
        name: "getToDestinations",
        parameters: [{ name: "from", type: "DestinationInfo" }],
        visibility: "public",
        type: "Promise",
      },
      {
        name: "getAvailableTimeSlots",
        parameters: [{ name: "params", type: "Object" }],
        visibility: "public",
        type: "Promise",
      },
      {
        name: "getDestinationInfoById",
        parameters: [{ name: "id", type: "string" }],
        type: "Promise",
      },
      {
        name: "getMaxFutureDateForMonitor",
        visibility: "public",
        type: "string",
      },
    ],
  } as UmlClassNodeData<BusProviderService>,
  {
    key: 2,
    name: "MockedBusProviderService",
  } as UmlClassNodeData<MockedBusProviderService>,
  {
    key: 3,
    name: "MarshrutochkaService",
    methods: [
      {
        name: "convertDateToString",
        visibility: "public",
        type: "string",
        parameters: [{ name: "date", type: "Date" }],
      },
    ],
  } as UmlClassNodeData<MarshrutochkaService>,
];

const linkdata: UmlClassLinkData[] = [
  { from: 2, to: 1 },
  { from: 3, to: 1 },
];

export const umlClassModel = new go.GraphLinksModel({
  copiesArrays: true,
  copiesArrayObjects: true,
  linkCategoryProperty: "relationship",
  nodeDataArray: nodedata,
  linkDataArray: linkdata,
});
