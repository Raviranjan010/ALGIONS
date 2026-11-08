import { test, expect } from "@playwright/test";

test.describe("Full End-to-End User Journey: Passenger & Operator Workflows", () => {
  test("Complete journey: Search trip, select seat, confirm booking, verify PNR, cancel ticket, and verify operator manifest", async ({
    page,
  }) => {
    // 1. Landing Page
    await page.goto("/");
    await expect(page).toHaveTitle(/ALGIONS/);
    await expect(page.locator("text=Next-Generation Intercity")).toBeVisible();

    // 2. Perform Search for Mumbai to Pune
    await page.locator("input#origin").fill("Mumbai");
    await page.locator("input#destination").fill("Pune");
    await page.locator("button[type='submit']:has-text('Search')").click();

    // 3. Search Results Page
    await expect(page).toHaveURL(/\/search\?origin=Mumbai&destination=Pune/);
    await expect(page.locator("text=Mumbai to Pune")).toBeVisible();
    const selectSeatsBtn = page.locator("button:has-text('Select Seats')").first();
    await expect(selectSeatsBtn).toBeVisible();
    await selectSeatsBtn.click();

    // 4. Trip Details & Seat Map
    await expect(page).toHaveURL(/\/trips\//);
    await expect(page.locator("text=Interactive Seat Selection")).toBeVisible();

    // Click on first available seat button
    const availableSeatBtn = page.locator("button[title*='available']").first();
    await expect(availableSeatBtn).toBeVisible();
    const seatTitle = await availableSeatBtn.getAttribute("title");
    await availableSeatBtn.click();

    // 5. Fill Passenger Details Form
    await expect(page.locator("text=Selected Seats (1)")).toBeVisible();
    await page.locator("input[placeholder*='Rahul Sharma']").fill("Ravi Ranjan");
    await page.locator("input[type='number']").first().fill("26");

    // Submit booking
    const confirmBtn = page.locator("button:has-text('Confirm Booking')");
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // 6. Confirmed Ticket / PNR View
    await expect(page).toHaveURL(/\/passenger\/bookings\?pnr=/);
    await expect(page.locator("text=Booking Successfully Confirmed!")).toBeVisible();
    await expect(page.locator("text=Official e-Ticket / Boarding Pass")).toBeVisible();
    await expect(page.locator("text=PNR:")).toBeVisible();
    await expect(page.locator("img[alt*='Verification QR Code']")).toBeVisible();

    // 7. Cancellation Flow
    const cancelBtn = page.locator("button:has-text('Cancel Booking')");
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // Modal Confirmation
    await expect(page.locator("text=Confirm Cancellation")).toBeVisible();
    await page.locator("button:has-text('Confirm & Cancel')").click();

    // Verify Cancelled Status
    await expect(page.locator("text=Cancelled")).toBeVisible();
    await expect(page.locator("text=Simulated Refund")).toBeVisible();

    // 8. Operator Portal Check
    await page.goto("/operator/dashboard");
    await expect(page.locator("text=Operator Management Portal")).toBeVisible();

    // 9. Operator Manifest
    await page.goto("/operator/manifests");
    await expect(page.locator("text=Passenger Dispatch Manifest")).toBeVisible();
    await expect(page.locator("text=Reconciliation Status")).toBeVisible();

    // 10. Operator Occupancy & Financial Report
    await page.goto("/operator/reports");
    await expect(page.locator("text=Occupancy & Revenue Reconciliation")).toBeVisible();
    await expect(page.locator("text=Net Operational Revenue")).toBeVisible();
  });
});
