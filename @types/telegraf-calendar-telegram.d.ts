declare module "telegraf-calendar-telegram" {
  import { Context, Markup, Telegraf } from "telegraf";
  import { InlineKeyboardMarkup } from "telegraf/types";

  export default class Calendar {
    constructor(
      bot: Telegraf,
      options?: {
        // first day of the week, where 0 is Sunday
        startWeekDay?: number;
        // week day names, where the first element is startWeekDay name
        weekDayNames?: string[];
        // month names
        monthNames?: string[];
        //  minimum selectable date
        minDate?: Date;
        // maximum selectable date (there is a setter on Calendar object, too)
        maxDate?: Date;
        // numbers of week days that can't be selected by user (E.g. when startWeekDay is 1, 5 means saturday and 6 means sunday)
        ignoreWeekDays?: number[];
        // hide a week if all days of a week can't be selected)
        hideIgnoredWeeks?: boolean;
      }
    );

    getCalendar: () => Markup.Markup<InlineKeyboardMarkup>;

    // date in yyyy-mm-dd
    setDateListener: (param: (ctx: Context, date: string) => any) => void;
  }
}
