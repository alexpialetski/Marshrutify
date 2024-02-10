import { EventEmitter } from "stream";

import { ENVVariable } from "./types/env";

export const delay =
  (ms: number) =>
  <T>(arg: T): Promise<T> =>
    new Promise<T>((resolve) => setTimeout(() => resolve(arg), ms)); // TODO: think about ...args

export const addDays = (date: Date, numberOfDays: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + numberOfDays);

export const addMinutes = (date: Date, minutes: number): Date =>
  new Date(date.getTime() + minutes * 60000);

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

type ArrayAsObjectKeys<T extends string[]> = { [key in T[number]]: string };

export const killIfNoEnvVariables = <T extends ENVVariable[]>(
  requiredEnvVars: T
): ArrayAsObjectKeys<T> =>
  requiredEnvVars.reduce((acc, envVar) => {
    const value = process.env[envVar as string];
    if (!value) {
      const errorMessage = `Missing required environment variable: ${String(
        envVar
      )}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    return { ...acc, [envVar]: value };
  }, {} as ArrayAsObjectKeys<T>); // "as" is okay, because there is no risk as absence of env variable will kill process
