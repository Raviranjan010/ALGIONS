import { db } from "@/lib/database/in-memory-store";
import { OccupancyReport } from "@/types";

export class ReportService {
  public static async getOccupancyReports(operatorId?: string): Promise<OccupancyReport[]> {
    return db.getOccupancyReports(operatorId);
  }
}

