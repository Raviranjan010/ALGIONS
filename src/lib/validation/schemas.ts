import { z } from "zod";

// Search Trips Schema
export const searchTripsSchema = z.object({
  origin: z.string().min(1, "Origin city is required"),
  destination: z.string().min(1, "Destination city is required"),
  date: z
    .string()
    .optional()
    .default("")
    .refine((val) => val === "" || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "Date must be YYYY-MM-DD",
    }),
  passengers: z.coerce.number().int().min(1).max(10).default(1),
});

export type SearchTripsInput = z.infer<typeof searchTripsSchema>;

// Passenger Input Schema
export const passengerInputSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  age: z.number().int().min(1, "Age must be at least 1").max(120),
  gender: z.enum(["male", "female", "other"]),
  seatNumber: z.string().min(1, "Seat number is required"),
});

// Create Booking Request Schema
export const createBookingSchema = z.object({
  tripId: z.string().min(1, "Invalid trip ID"),
  seatIds: z.array(z.string().min(1, "Invalid seat ID")).min(1, "At least one seat must be selected").max(6, "Maximum 6 seats per booking"),
  passengers: z.array(passengerInputSchema).min(1, "At least one passenger is required"),
  contact: z.object({
    name: z.string().min(2, "Contact name is required"),
    email: z.string().email("Invalid contact email"),
    phone: z.string().min(7, "Valid contact phone number is required").max(20),
  }),
  idempotencyKey: z.string().min(1).max(128).optional(),
}).refine((data) => data.seatIds.length === data.passengers.length, {
  message: "Number of passengers must match the number of selected seats",
  path: ["passengers"],
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// Cancel Booking Request Schema
export const cancelBookingSchema = z.object({
  bookingId: z.string().min(1, "Invalid booking ID"),
  reason: z.string().min(3, "Cancellation reason must be at least 3 characters").max(500),
});

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

// Auth Login Schema
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Auth Register Schema
export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  role: z.enum(["passenger", "operator"]).default("passenger"),
  phone: z.string().min(7).max(15).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Create Vehicle Schema
export const createVehicleSchema = z.object({
  operatorId: z.string().uuid(),
  registrationNumber: z.string().min(3).max(20),
  model: z.string().min(2).max(50),
  layoutType: z.enum(["2x2", "2x1", "sleeper_2x1", "executive_2x2"]),
  totalCapacity: z.number().int().min(10).max(60),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

// Create Route Schema
export const createRouteSchema = z.object({
  operatorId: z.string().uuid(),
  routeNumber: z.string().min(2).max(20),
  originCity: z.string().min(2).max(50),
  destinationCity: z.string().min(2).max(50),
  distanceKm: z.number().positive(),
  estimatedDurationMins: z.number().int().positive(),
  stops: z.array(
    z.object({
      stopName: z.string().min(2),
      city: z.string().min(2),
      stopOrder: z.number().int().min(1),
      durationFromOriginMins: z.number().int().min(0),
      distanceFromOriginKm: z.number().min(0),
    })
  ).optional(),
});

export type CreateRouteInput = z.infer<typeof createRouteSchema>;

// Create Trip Schedule Schema
export const createTripSchema = z.object({
  operatorId: z.string().uuid(),
  routeId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  tripCode: z.string().min(3).max(20),
  departureTime: z.string().datetime(),
  arrivalTime: z.string().datetime(),
  baseFare: z.number().positive("Base fare must be positive"),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;

