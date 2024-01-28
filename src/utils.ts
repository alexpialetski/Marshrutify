import { EventEmitter } from "stream";

export const delay =
  (ms: number) =>
  <T>(arg: T): Promise<T> =>
    new Promise<T>((resolve) => setTimeout(() => resolve(arg), ms)); // TODO: think about ...args

export const addDays = (date: Date, numberOfDays: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + numberOfDays);

type EventMapKey = string | symbol;

export class TypedEventEmitter<
  T extends Record<EventMapKey, any>
> extends EventEmitter {
  emit<K extends keyof T>(event: K, payload: T[K]): boolean {
    return super.emit(event as EventMapKey, payload);
  }

  on<K extends keyof T>(event: K, listener: (payload: T[K]) => void): this {
    return super.on(event as EventMapKey, listener);
  }
}

export const getRandomInt = (max: number): number =>
  Math.floor(Math.random() * max);
