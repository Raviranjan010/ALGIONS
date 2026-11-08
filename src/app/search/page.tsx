import React from "react";
import { SearchForm } from "@/components/search/SearchForm";
import { TripCard } from "@/components/search/TripCard";
import { TripService } from "@/services/trip-service";
import { Bus, Filter, SlidersHorizontal } from "lucide-react";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    origin?: string;
    destination?: string;
    date?: string;
    passengers?: string;
  }>;
}) {
  const params = await searchParams;
  const origin = params.origin || "Mumbai";
  const destination = params.destination || "Pune";
  const date = params.date || "";
  const passengers = Number(params.passengers || "1");

  const trips = await TripService.searchTrips({
    origin,
    destination,
    date,
    passengers,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search Header Form */}
      <SearchForm
        initialOrigin={origin}
        initialDestination={destination}
        initialDate={date}
        initialPassengers={passengers}
        compact={true}
      />

      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bus className="w-6 h-6 text-blue-600" />
            {origin} to {destination}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Found {trips.length} active service{trips.length === 1 ? "" : "s"} available for booking
          </p>
        </div>
      </div>

      {/* Trip List */}
      <div className="grid grid-cols-1 gap-4">
        {trips.length > 0 ? (
          trips.map((trip) => <TripCard key={trip.id} trip={trip} />)
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mx-auto">
              <Bus className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              No direct buses found for this date
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try searching for popular routes like <strong>Mumbai → Pune</strong>, <strong>Bangalore → Hyderabad</strong>, or select tomorrow&apos;s date.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

