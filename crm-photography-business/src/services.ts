import { openDatabase } from "./database";
import { PhotographerRegistry } from "./photographer-registry";
import { ConvocationEventRegistry } from "./convocation-event-registry";
import { PackageCatalog } from "./package-catalog";
import { TimeSlotBoard } from "./time-slot-board";
import { BookingBoard } from "./booking-board";
import { AgencyDashboard } from "./agency-dashboard";
import { ConvocationLeadRegistry } from "./convocation-lead-registry";
import { ConvocationLeadScraperRunner } from "./convocation-lead-scraper";

export interface Services {
  photographers: PhotographerRegistry;
  convocationEvents: ConvocationEventRegistry;
  packages: PackageCatalog;
  timeSlots: TimeSlotBoard;
  bookings: BookingBoard;
  dashboard: AgencyDashboard;
  convocationLeads: ConvocationLeadRegistry;
  scraperRunner: ConvocationLeadScraperRunner;
}

export function createServices(dbPath: string): Services {
  const db = openDatabase(dbPath);
  const photographers = new PhotographerRegistry(db);
  const convocationEvents = new ConvocationEventRegistry(db);
  const packages = new PackageCatalog(photographers, db);
  const timeSlots = new TimeSlotBoard(photographers, db);
  const bookings = new BookingBoard({ timeSlots, convocationEvents, packages }, db);
  const dashboard = new AgencyDashboard({ bookings, photographers });
  const convocationLeads = new ConvocationLeadRegistry(db);
  const scraperRunner = new ConvocationLeadScraperRunner(db, convocationLeads);
  return {
    photographers,
    convocationEvents,
    packages,
    timeSlots,
    bookings,
    dashboard,
    convocationLeads,
    scraperRunner,
  };
}
