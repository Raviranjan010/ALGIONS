# API Documentation — ALGIONS Bus Booking Management System

All API endpoints are implemented as Next.js Route Handlers with strict Zod request schema validation and standardized JSON responses.

---

## 1. Public & Passenger Endpoints

### 1.1 Search Trips
- **Endpoint**: `GET /api/trips/search`
- **Query Parameters**:
  - `origin` (string, required): e.g. "Mumbai"
  - `destination` (string, required): e.g. "Pune"
  - `date` (string, optional, YYYY-MM-DD): e.g. "2026-02-15"
  - `passengers` (integer, optional, default: 1)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "count": 2,
    "data": [
      {
        "id": "d1000000-0000-0000-0000-000000000001",
        "trip_code": "RYL-101-MUMPUN",
        "departure_time": "2026-02-09T14:00:00.000Z",
        "arrival_time": "2026-02-09T17:30:00.000Z",
        "base_fare": 850,
        "status": "scheduled",
        "available_seats_count": 24,
        "operator": { "name": "Royal Express Travels" },
        "route": { "origin_city": "Mumbai", "destination_city": "Pune" },
        "vehicle": { "model": "Volvo 9600 Multi-Axle", "layout_type": "sleeper_2x1" }
      }
    ]
  }
  ```

### 1.2 Get Trip Details & Seats
- **Endpoint**: `GET /api/trips/[id]`
- **Response `200 OK`**: Returns trip details, operator, and route info.
- **Endpoint**: `GET /api/trips/[id]/seats`
- **Response `200 OK`**: Returns array of all vehicle seats on this trip with current status (`available`, `booked`, `reserved`), deck (`lower` / `upper`), row, column, and fare.

### 1.3 Create Atomic Booking
- **Endpoint**: `POST /api/bookings`
- **Headers**: `Content-Type: application/json`, optional `x-user-id`
- **Request Body**:
  ```json
  {
    "tripId": "d1000000-0000-0000-0000-000000000001",
    "seatIds": ["ts-t1-L1A", "ts-t1-L1B"],
    "passengers": [
      { "fullName": "Ravi Ranjan", "age": 26, "gender": "male", "seatNumber": "L1A" },
      { "fullName": "Aditi Roy", "age": 24, "gender": "female", "seatNumber": "L1B" }
    ],
    "contact": {
      "name": "Ravi Ranjan",
      "email": "passenger@algions.com",
      "phone": "+91 98765 00001"
    },
    "idempotencyKey": "a90f231e-4501-443b-8240-6f022713e2f1"
  }
  ```
- **Responses**:
  - `201 Created`: Booking created, returns `{ success: true, isIdempotentReplay: false, data: { pnr: "ALG-K92XLM", ... } }`
  - `200 OK`: Idempotent replay, returns identical booking.
  - `409 Conflict`: Seat already booked or conflicting concurrent transaction.
  - `400 Bad Request`: Validation failure.

### 1.4 Get Booking by PNR
- **Endpoint**: `GET /api/bookings/pnr/[pnr]`
- **Response `200 OK`**: Returns full ticket details, passengers, seats, and cancellation status.

### 1.5 Cancel Booking
- **Endpoint**: `POST /api/cancellations`
- **Request Body**:
  ```json
  {
    "bookingId": "bkg-1738981234567-123",
    "reason": "Change of travel plans"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "id": "canc-1738981999999",
      "refund_percentage": 90,
      "refund_amount": 1620,
      "refund_status": "simulated_processed"
    },
    "releasedSeats": 2
  }
  ```

---

## 2. Operator Endpoints

### 2.1 Get Passenger Manifest
- **Endpoint**: `GET /api/operator/manifests?tripId=...`
- **Response `200 OK`**: Returns array of all passenger manifest items for this departure with PNR, passenger name, age, gender, seat number, contact phone, and status.

### 2.2 Get Occupancy & Financial Reports
- **Endpoint**: `GET /api/operator/reports/occupancy`
- **Response `200 OK`**: Returns trip-by-trip load factor, booked seats, total seats, occupancy percentage, gross ticket sales, refund deductions, and net revenue.

### 2.3 Fleet Management
- **`GET /api/operator/vehicles`**: Lists all fleet buses.
- **`POST /api/operator/vehicles`**: Creates a new bus and auto-generates seating layout.
- **`GET /api/operator/routes`**: Lists routes.
- **`POST /api/operator/routes`**: Creates a new route corridor.
- **`POST /api/operator/trips`**: Schedules a new departure and initializes trip seat inventory.
