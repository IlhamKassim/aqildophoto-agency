import Link from "next/link";
import { getServices } from "./lib/services";

export const dynamic = "force-dynamic";

export default function Home() {
  const services = getServices();
  const photographerCount = services.photographers.listAllPhotographers().length;
  const bookingCount = services.bookings.listAllBookings().length;
  const eventCount =
    services.convocationEvents.listUpcomingConvocationEvents().length;

  return (
    <>
      <h1>Agency Admin Console</h1>
      <p>
        {photographerCount} Photographer(s), {bookingCount} Booking(s) on record,{" "}
        {eventCount} upcoming Convocation Event(s).
      </p>
      <p>
        <Link href="/photographers">Manage Photographers</Link>
      </p>
      <p>
        <Link href="/convocation-events">Manage Convocation Events</Link>
      </p>
    </>
  );
}
