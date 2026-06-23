import db from "../db/index.ts";
import type { EventRow } from "../db/types.ts";
import type Agenda from "../models/Agenda.ts";
import Event from "../models/Event.ts";

export default class EventService {
  private static _instance: EventService | null = null;

  public static get instance() {
    if (this._instance === null) {
      this._instance = new EventService();
    }

    return this._instance;
  }

  private constructor() {}

  public async createEvent(event: Event, agenda: Agenda) {
    await db<EventRow>("event").insert({
      id: event.id,
      name: event.name,
      date: event.date,
      status: event.status,
      weekdays: event.weekdays.join(","),
      agenda_id: agenda.id,
    });

    agenda.addEvent(event);
  }

  public async editEvent(oldEvent: Event, newEvent: Event, agenda: Agenda) {
    await db<EventRow>("event")
      .update({
        name: newEvent.name,
        date: newEvent.date,
        status: newEvent.status,
        weekdays: newEvent.weekdays.join(","),
      })
      .where({ id: oldEvent.id, agenda_id: agenda.id });

    agenda.editEvent(oldEvent, newEvent);
  }

  public async getEventsByAgendaId(agenda_id: string): Promise<Event[]> {
    return (await db<EventRow>("event").select("*").where({ agenda_id })).map(
      (e) => Event.fromDatabase(e),
    );
  }

  public async getEventByName(name: string, agenda: Agenda) {
    const eventRow = await db<EventRow>("event")
      .select("*")
      .where({ name, agenda_id: agenda.id })
      .first();

    if (!eventRow) return null;

    return Event.fromDatabase(eventRow);
  }
}
