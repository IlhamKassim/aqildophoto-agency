import type { Booking } from "./booking-board.js";
import type { Photographer } from "./photographer-registry.js";

export interface AgencyDashboardDeps {
  bookings: { listAllBookings(): Booking[] };
  photographers: { listAllPhotographers(): Photographer[] };
}

export class AgencyDashboard {
  constructor(private readonly deps: AgencyDashboardDeps) {}

  listBookings(): Booking[] {
    return this.deps.bookings.listAllBookings();
  }

  listPhotographers(): Photographer[] {
    return this.deps.photographers.listAllPhotographers();
  }
}
