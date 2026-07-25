export interface ConvocationEventDetails {
  university: string;
  faculty: string;
  date: Date;
  venue: string;
}

export interface ConvocationEvent extends ConvocationEventDetails {
  id: string;
}

export class ConvocationEventRegistry {
  private readonly events: ConvocationEvent[] = [];

  createConvocationEvent(details: ConvocationEventDetails): ConvocationEvent {
    const event: ConvocationEvent = {
      id: crypto.randomUUID(),
      ...details,
    };
    this.events.push(event);
    return event;
  }

  listUpcomingConvocationEvents(now: Date = new Date()): ConvocationEvent[] {
    return this.events.filter((event) => event.date >= now);
  }
}
