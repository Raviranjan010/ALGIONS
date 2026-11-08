import { describe, it, expect } from "vitest";

describe("Unit: Policy-Driven Cancellation & Simulated Refund", () => {
  function calculateRefund(fare: number, hoursUntilDeparture: number) {
    let refundPercentage = 0;
    let status: "simulated_processed" | "non_refundable" = "non_refundable";

    if (hoursUntilDeparture >= 24) {
      refundPercentage = 90;
      status = "simulated_processed";
    } else if (hoursUntilDeparture >= 12) {
      refundPercentage = 75;
      status = "simulated_processed";
    } else if (hoursUntilDeparture >= 2) {
      refundPercentage = 50;
      status = "simulated_processed";
    } else {
      refundPercentage = 0;
      status = "non_refundable";
    }

    const refundAmount = Math.round((fare * refundPercentage) / 100);
    return { refundPercentage, refundAmount, status };
  }

  it("should calculate 90% refund if cancelled more than 24 hours prior to departure", () => {
    const res = calculateRefund(1000, 36);
    expect(res.refundPercentage).toBe(90);
    expect(res.refundAmount).toBe(900);
    expect(res.status).toBe("simulated_processed");
  });

  it("should calculate 75% refund if cancelled between 12 and 24 hours prior to departure", () => {
    const res = calculateRefund(1000, 18);
    expect(res.refundPercentage).toBe(75);
    expect(res.refundAmount).toBe(750);
    expect(res.status).toBe("simulated_processed");
  });

  it("should calculate 50% refund if cancelled between 2 and 12 hours prior to departure", () => {
    const res = calculateRefund(1000, 5);
    expect(res.refundPercentage).toBe(50);
    expect(res.refundAmount).toBe(500);
    expect(res.status).toBe("simulated_processed");
  });

  it("should calculate 0% refund (non-refundable) if cancelled less than 2 hours prior to departure", () => {
    const res = calculateRefund(1000, 1.5);
    expect(res.refundPercentage).toBe(0);
    expect(res.refundAmount).toBe(0);
    expect(res.status).toBe("non_refundable");
  });
});

