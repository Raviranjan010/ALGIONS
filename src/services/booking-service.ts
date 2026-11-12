import { db } from "@/lib/database/in-memory-store";
import { Booking, PublicTicketVerification } from "@/types";
import { CreateBookingInput } from "@/lib/validation/schemas";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

export class BookingService {
  public static async createBooking(
    userId: string,
    input: CreateBookingInput
  ): Promise<{ success: boolean; isIdempotentReplay: boolean; booking: Booking }> {
    if (isSupabaseConfigured()) {
      // Use the caller's verified Supabase session so auth.uid() inside the
      // booking RPC matches this user. The admin client has no user JWT.
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.rpc("create_booking_atomic", {
        p_trip_id: input.tripId,
        p_user_id: userId,
        p_seat_ids: input.seatIds,
        p_passengers: input.passengers,
        p_contact: input.contact,
        p_idempotency_key: input.idempotencyKey || null,
      });

      if (error) {
        throw new Error(error.message || "Failed to create booking");
      }

      const { data: fullBooking, error: bookingError } = await supabase
        .from("bookings")
        .select(`
          *,
          trip:trips(*, route:routes(*), operator:operators(*), vehicle:vehicles(*)),
          passengers:booking_passengers(*),
          seats:booking_seats(*),
          cancellation:cancellations(*)
        `)
        .eq("id", data.booking_id)
        .eq("user_id", userId)
        .single();

      if (bookingError || !fullBooking) {
        throw new Error(bookingError?.message || "Booking was created, but its ticket could not be loaded");
      }
      return {
        success: true,
        isIdempotentReplay: Boolean(data.is_idempotent_replay),
        booking: fullBooking as Booking,
      };
    }

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
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data: b, error } = await supabase
        .from("bookings")
        .select(`
          *,
          trip:trips(*, route:routes(*), operator:operators(*), vehicle:vehicles(*)),
          passengers:booking_passengers(*),
          seats:booking_seats(*),
          cancellation:cancellations(*)
        `)
        .eq("id", bookingId)
        .single();

      if (error || !b) return null;
      return b as Booking;
    }

    return db.getBookingById(bookingId);
  }

  public static async getBookingByPnr(pnr: string): Promise<Booking | null> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data: b, error } = await supabase
        .from("bookings")
        .select(`
          *,
          trip:trips(*, route:routes(*), operator:operators(*), vehicle:vehicles(*)),
          passengers:booking_passengers(*),
          seats:booking_seats(*),
          cancellation:cancellations(*)
        `)
        .eq("pnr", pnr.trim().toUpperCase())
        .single();

      if (error || !b) return null;
      return b as Booking;
    }

    return db.getBookingByPnr(pnr);
  }

  public static async verifyTicket(pnr: string): Promise<PublicTicketVerification | null> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase.rpc("verify_ticket_by_pnr", {
        p_pnr: pnr.trim().toUpperCase(),
      });

      if (error || !data || !data.found) return null;
      return data as PublicTicketVerification;
    }

    return db.verifyTicketByPnr(pnr);
  }

  public static async getPassengerBookings(userId: string): Promise<Booking[]> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          trip:trips(*, route:routes(*), operator:operators(*), vehicle:vehicles(*)),
          passengers:booking_passengers(*),
          seats:booking_seats(*),
          cancellation:cancellations(*)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error || !data) return [];
      return data as Booking[];
    }

    return db.getPassengerBookings(userId);
  }
}
