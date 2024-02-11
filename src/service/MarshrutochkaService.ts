import { parse, HTMLElement } from "node-html-parser";
import fetch from "node-fetch-commonjs";

import { DestinationInfo } from "~/types/path";

import { AvailableTimeSlot, BusProviderService } from "./busProviderService";

const MARSHRUTOCHKA_HOST = "https://xn--90aiim0b.xn--80aa3agllaqi6bg.xn--90ais";

export class MarshrutochkaService extends BusProviderService {
  provider: "MARSHRUTOCHKA";

  getFromDestinations = (): Promise<DestinationInfo[]> =>
    fetch(`https://xn--90aiim0b.xn--80aa3agllaqi6bg.xn--90ais`)
      .then((res) => res.text())
      .then((res) => parse(res))
      .then((dom) => {
        const selectWithCities = dom.getElementById("city_from_id");

        if (!selectWithCities) {
          return Promise.reject("MarshrutochkaService: No selectWithCities");
        }

        return Array.from(selectWithCities.childNodes)
          .filter(
            (node): node is HTMLElement =>
              node instanceof HTMLElement && Boolean(node.getAttribute("value"))
          )
          .map(
            (node): DestinationInfo => ({
              id: String(node.getAttribute("value")),
              name: node.innerText,
            })
          );
      });

  getToDestinations = (from: DestinationInfo) =>
    fetch(`${MARSHRUTOCHKA_HOST}/cities?city_from_id=${from.id}`)
      .then(
        (res) =>
          res.json() as Promise<Record<string, { id: number; name: string }>>
      )
      .then((data) =>
        Object.values(data).map(
          (data): DestinationInfo => ({ id: String(data.id), name: data.name })
        )
      );

  getDestinationInfoById = (id: string): Promise<DestinationInfo> =>
    this.getFromDestinations().then((destinations) => {
      const destInfo = destinations.find((dest) => dest.id === id);

      return destInfo
        ? Promise.resolve(destInfo)
        : Promise.reject("Error: Could not find dest info");
    });

  getAvailableTimeSlots = ({
    from,
    to,
    date,
  }: {
    from: DestinationInfo;
    to: DestinationInfo;
    date: Date;
  }): Promise<AvailableTimeSlot[]> =>
    fetch(
      `https://xn--90aiim0b.xn--80aa3agllaqi6bg.xn--90ais/schedules?station_from_id=0&station_to_id=0&frame_id=&city_from_id=${
        from.id
      }&places=1&city_to_id=${to.id}&date=${this.convertDateToString(date)}`
    )
      .then((res) => res.json())
      .then((res) => parse((res as any).html))
      .then((dom) =>
        [...dom.querySelectorAll(".nf-route:not(.is-disabled)")].map(
          (route) =>
            (route.querySelector(".nf-route__time") as unknown as HTMLElement)
              .innerText
        )
      );

  convertDateToString = (date: Date): string =>
    date.toISOString().split("T")[0];
}

export const marshrutochkaService = new MarshrutochkaService();
