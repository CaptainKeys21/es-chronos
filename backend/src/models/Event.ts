export const WeekDays = {
  Domingo: 0,
  Segunda: 1,
  Terca: 2,
  Quarta: 3,
  Quinta: 4,
  Sexta: 5,
  Sabado: 6,
} as const;

export type WeekDays = (typeof WeekDays)[keyof typeof WeekDays];

export default class Event {
  private _name: string;
  private _date: Date;
  private _weekdays: WeekDays[] = [];

  constructor(name: string, date: Date) {
    this._name = name;
    this._date = date;
  }

  get name() {
    return this._name;
  }

  set name(newName: string) {
    this._name = newName;
  }

  get date() {
    return this._date;
  }

  set date(newDL: Date) {
    this._date = newDL;
  }

  get weekdays() {
    return this._weekdays;
  }

  set weekDays(newWeekdays: WeekDays[]) {
    this._weekdays = newWeekdays;
  }

  public toJSON() {
    return {
      name: this.name,
      date: this.date.getTime(),
      weekdays: this.weekDays,
    };
  }
}
