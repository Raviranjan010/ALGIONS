import React from "react";
import { SearchForm } from "@/components/search/SearchForm";
import { TripCard } from "@/components/search/TripCard";
import { TripService } from "@/services/trip-service";
import { Bus, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
      {/* Search Header Form (Compact Rydvanta variant) */}
      <SearchForm
        initialOrigin={origin}
        initialDestination={destination}
        initialDate={date}
        initialPassengers={passengers}
        compact={true}
      />

      {/* Results Title & Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-charcoal-border/70 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-charcoal">
              {origin} to {destination}
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sage-surface border border-sage text-forest">
              {trips.length} {trips.length === 1 ? "Trip" : "Trips"} Available
            </span>
          </div>
          <p className="text-xs text-charcoal-muted mt-1">
            All buses feature real-time interactive seat maps, guaranteed row locking, and instant ticket generation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/search?origin=Mumbai&destination=Pune">
            <Button variant="ghost" size="sm" className="text-xs font-semibold">
              Reset Filters
            </Button>
          </Link>
        </div>
      </div>

      {/* Trip Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {trips.length > 0 ? (
          trips.map((trip) => <TripCard key={trip.id} trip={trip} />)
        ) : (
          <div className="bg-white border border-charcoal-border rounded-3xl p-12 text-center space-y-4 shadow-warm max-w-lg mx-auto my-6">
            <div className="w-16 h-16 rounded-full bg-ivory-soft text-terracotta border border-charcoal-border flex items-center justify-center mx-auto">
              <Bus className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-charcoal">
              No direct buses found for this date
            </h3>
            <p className="text-xs text-charcoal-muted max-w-sm mx-auto leading-relaxed">
              We couldn&apos;t find departures between {origin} and {destination} for the chosen date. Try selecting tomorrow or checking our popular high-frequency routes:
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Link href="/search?origin=Mumbai&destination=Pune">
                <Button size="sm" variant="outline" className="text-xs">
                  Mumbai → Pune
                </Button>
              </Link>
              <Link href="/search?origin=Bangalore&destination=Hyderabad">
                <Button size="sm" variant="outline" className="text-xs">
                  Bangalore → Hyderabad
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
