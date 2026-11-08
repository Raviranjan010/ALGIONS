import { db } from "@/lib/database/in-memory-store";
import { PassengerManifestItem } from "@/types";

export class ManifestService {
  public static async getManifestForTrip(tripId: string): Promise<PassengerManifestItem[]> {
    return db.getPassengerManifest(tripId);
  }
}

