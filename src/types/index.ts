export type UserRole = "passenger" | "operator" | "admin";

export type OperatorMemberRole = "owner" | "admin" | "dispatcher" | "staff";

export type SeatLayoutType = "2x2" | "2x1" | "sleeper_2x1" | "executive_2x2";

export type DeckType = "lower" | "upper";

export type SeatType = "window" | "aisle" | "middle" | "sleeper";

export type SeatStatus = "available" | "reserved" | "booked" | "blocked";

export type TripStatus = "scheduled" | "boarding" | "in_transit" | "completed" | "cancelled";

export type BookingStatus = "confirmed" | "cancelled" | "completed";

export type RefundStatus = "simulated_processed" | "simulated_pending" | "non_refundable";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Operator {
  id: string;
  name: string;
  slug: string;
  code: string;
  contact_email: string;
  contact_phone: string;
  address?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OperatorMember {
  id: string;
  operator_id: string;
  user_id: string;
  role: OperatorMemberRole;
  created_at: string;
}

export interface Vehicle {
  id: string;
  operator_id: string;
  registration_number: string;
  model: string;
  total_capacity: number;
  layout_type: SeatLayoutType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  operator?: Operator;
}

export interface VehicleSeat {
  id: string;
  vehicle_id: string;
  seat_number: string;
  deck: DeckType;
  seat_row: number;
  seat_column: number;
  seat_type: SeatType;
  is_active: boolean;
  created_at: string;
}

export interface Route {
  id: string;
  operator_id: string;
  route_number: string;
  origin_city: string;
  destination_city: string;
  distance_km: number;
  estimated_duration_mins: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  operator?: Operator;
  stops?: RouteStop[];
}

export interface RouteStop {
  id: string;
  route_id: string;
  stop_name: string;
  city: string;
  stop_order: number;
  duration_from_origin_mins: number;
  distance_from_origin_km: number;
  created_at: string;
}

export interface Trip {
  id: string;
  operator_id: string;
  route_id: string;
  vehicle_id: string;
  trip_code: string;
  departure_time: string;
  arrival_time: string;
  base_fare: number;
  status: TripStatus;
  created_at: string;
  updated_at: string;
  operator?: Operator;
  route?: Route;
  vehicle?: Vehicle;
  available_seats_count?: number;
  total_seats_count?: number;
}

export interface TripSeat {
  id: string;
  trip_id: string;
  vehicle_seat_id: string;
  seat_number: string;
  seat_type: SeatType;
  fare: number;
  status: SeatStatus;
  updated_at: string;
  deck?: DeckType;
  seat_row?: number;
  seat_column?: number;
}

export interface Booking {
  id: string;
  pnr: string;
  trip_id: string;
  user_id: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  total_fare: number;
  status: BookingStatus;
  idempotency_key?: string | null;
  created_at: string;
  updated_at: string;
  trip?: Trip;
  passengers?: BookingPassenger[];
  seats?: BookingSeat[];
  cancellation?: Cancellation;
}

export interface BookingPassenger {
  id: string;
  booking_id: string;
  full_name: string;
  age: number;
  gender: "male" | "female" | "other";
  seat_number: string;
  created_at: string;
}

export interface BookingSeat {
  id: string;
  booking_id: string;
  trip_seat_id: string;
  seat_number: string;
  fare: number;
  is_active?: boolean;
  created_at: string;
}

export interface Cancellation {
  id: string;
  booking_id: string;
  cancelled_by: string;
  reason: string;
  refund_percentage: number;
  refund_amount: number;
  refund_status: RefundStatus;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details: Record<string, unknown>;
  ip_address?: string | null;
  created_at: string;
}

export interface PassengerManifestItem {
  booking_id: string;
  pnr: string;
  passenger_name: string;
  age: number;
  gender: string;
  seat_number: string;
  contact_phone: string;
  contact_email: string;
  booking_status: BookingStatus;
  created_at: string;
}

export interface OccupancyReport {
  trip_id: string;
  trip_code: string;
  departure_time: string;
  arrival_time: string;
  route_name: string;
  vehicle_reg: string;
  total_seats: number;
  booked_seats: number;
  available_seats: number;
  occupancy_rate: number;
  gross_revenue: number;
  cancelled_revenue: number;
  net_revenue: number;
}

export interface PublicTicketVerification {
  found: boolean;
  pnr: string;
  status: BookingStatus;
  isValidForBoarding: boolean;
  originCity: string;
  destinationCity: string;
  departureTime: string;
  arrivalTime: string;
  operatorName: string;
  busModel: string;
  busRegistration?: string;
  seats: string[];
  isCancelled: boolean;
  cancelledAt?: string;
  error?: string;
}

