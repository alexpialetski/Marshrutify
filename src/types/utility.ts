export type PartialKeys<T, PartialKey extends keyof T> = {
  [Key in keyof T]: Key extends PartialKey ? T[Key] | undefined : T[Key];
};
