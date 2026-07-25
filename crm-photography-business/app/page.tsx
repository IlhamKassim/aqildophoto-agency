import Link from "next/link";
import { getServices } from "./lib/services";

export const dynamic = "force-dynamic";

export default function Home() {
  const services = getServices();
  const photographerCount = services.photographers.listAllPhotographers().length;
  const bookingCount = services.bookings.listAllBookings().length;

  return (
    <>
      <h1>Agency Admin Console</h1>
      <p>
        {photographerCount} Photographer(s), {bookingCount} Booking(s) on record.
      </p>
      <p>
        <Link href="/photographers">Manage Photographers</Link>
      </p>
    </>
  );
}
