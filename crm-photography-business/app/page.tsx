import { getServices } from "./lib/services";

export default function Home() {
  const services = getServices();
  const photographerCount = services.photographers.listAllPhotographers().length;
  const bookingCount = services.bookings.listAllBookings().length;

  return (
    <main>
      <h1>Agency Admin Console</h1>
      <p>{photographerCount} Photographer(s), {bookingCount} Booking(s) on record.</p>
    </main>
  );
}
