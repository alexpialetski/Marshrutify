import { EventPattern } from "aws-cdk-lib/aws-events";

export abstract class EventFacade<TPayload extends object> {
  abstract getEventDetailType(): string;

  getEvenRulePattern(): EventPattern {
    return {
      source: [this.getEventSource()],
      detailType: [this.getEventDetailType()],
    };
  }

  getEventSource(): string {
    return "custom.marshrutify";
  }
}

export type EventFacadeType<T extends EventFacade<any>> = ReturnType<
  T["getEventDetailType"]
>;
