import { db } from "@/lib/database/in-memory-store";
import { Booking, PublicTicketVerification } from "@/types";
import { CreateBookingInput } from "@/lib/validation/schemas";

export class BookingService {
  public static async createBooking(
    userId: string,
    input: CreateBookingInput
  ): Promise<{ success: boolean; isIdempotentReplay: boolean; booking: Booking }> {
    return db.createBookingAtomic({
      tripId: input.tripId,
      userId,
      seatIds: input.seatIds,
      passengers: input.passengers,
      contact: input.contact,
      idempotencyKey: input.idempotencyKey,
    });
  }

  public static async getBookingById(bookingId: string): Promise<Booking | null> {
    return db.getBookingById(bookingId);
  }

  public static async getBookingByPnr(pnr: string): Promise<Booking | null> {
    return db.getBookingByPnr(pnr);
  }

  public static async verifyTicket(pnr: string): Promise<PublicTicketVerification | null> {
    return db.verifyTicketByPnr(pnr);
  }

  public static async getPassengerBookings(userId: string): Promise<Booking[]> {
    return db.getPassengerBookings(userId);
  }
}
