import type Agenda from "../models/Agenda.ts";
import type Event from "../models/Event.ts";

export default class EventService {
  private static _instance: EventService | null = null;

  public static get instance() {
    if (this._instance === null) {
      this._instance = new EventService();
    }

    return this._instance;
  }

  private constructor() {}

  public createEvent(event: Event, agenda: Agenda) {
    agenda.addEvent(event);
  }

  public editEvent(oldEvent: Event, newEvent: Event, agenda: Agenda) {
    agenda.editEvent(oldEvent, newEvent);
  }

  public getEventByName(name: string, agenda: Agenda) {
    return agenda.findEventByName(name);
  }
}
