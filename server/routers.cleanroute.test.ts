import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  createFieldCheck: vi.fn(),
  createIssueReport: vi.fn(),
  getFacility: vi.fn(),
  listFacilities: vi.fn(),
  listReports: vi.fn(),
  updateReport: vi.fn(),
  createReview: vi.fn(),
  listPublishedReviews: vi.fn(),
  getPublishedReviewSummary: vi.fn(),
  updateReview: vi.fn(),
  createAdminFacility: vi.fn(),
  updateAdminFacility: vi.fn(),
}));

const storageMocks = vi.hoisted(() => ({
  storagePut: vi.fn(),
}));

vi.mock("./db", () => dbMocks);
vi.mock("./storage", () => storageMocks);

import { appRouter } from "./routers";

function context(role: "admin" | "user" | null): TrpcContext {
  return {
    user: role ? { id: 7, openId: "tester", name: "Tester", email: "tester@example.test", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as TrpcContext["res"],
  };
}

const fieldCheck = {
  facilityId: "panvel-sector-1",
  researcherName: "Field checker",
  hygieneRating: 4,
  waterStatus: "Available" as const,
  safetyStatus: "Good" as const,
  lightingStatus: "Good" as const,
  accessibilityStatus: "Wheelchair accessible" as const,
  womenFriendly: "Yes" as const,
  operatingStatus: "Open" as const,
};

describe("CleanRoute protected persistence procedures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.createFieldCheck.mockResolvedValue({ fieldCheckId: "check-1", facility: { id: "panvel-sector-1" }, applied: true });
    dbMocks.createIssueReport.mockResolvedValue({ id: "report-1", status: "pending" });
    dbMocks.updateReport.mockResolvedValue({ id: "report-1", status: "resolved" });
    dbMocks.createReview.mockResolvedValue({ id: "review-1", status: "pending" });
    dbMocks.listPublishedReviews.mockResolvedValue([{ review: { id: "published-1", facilityId: "panvel-sector-1", rating: 4, status: "published" }, author: "Community member" }]);
    dbMocks.getPublishedReviewSummary.mockResolvedValue({ averageRating: 4, ratingCount: 1 });
    dbMocks.updateReview.mockResolvedValue({ id: "review-1", status: "published" });
    dbMocks.createAdminFacility.mockResolvedValue({ id: "admin-facility" });
    storageMocks.storagePut.mockResolvedValue({ key: "cleanroute/7/demo-key.png", url: "/manus-storage/cleanroute/7/demo-key.png" });
  });

  it("persists an authorised field check as an evidence update", async () => {
    const caller = appRouter.createCaller(context("admin"));
    await caller.facilities.submitFieldCheck(fieldCheck);
    expect(dbMocks.createFieldCheck).toHaveBeenCalledWith(expect.objectContaining({ facilityId: "panvel-sector-1", submittedById: 7, approved: true, hygieneRating: 4 }));
  });

  it("denies a normal user from submitting an official field check", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.facilities.submitFieldCheck(fieldCheck)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(dbMocks.createFieldCheck).not.toHaveBeenCalled();
  });

  it("stores validated evidence in managed storage and persists only its reference", async () => {
    const caller = appRouter.createCaller(context("admin"));
    await caller.facilities.submitFieldCheck({ ...fieldCheck, evidenceDataUrl: "data:image/png;base64,aGVsbG8=", evidenceFileName: "site.png" });
    expect(storageMocks.storagePut).toHaveBeenCalledWith(expect.stringMatching(/^cleanroute\/7\/\d+-site\.png$/), expect.any(Buffer), "image/png");
    expect(dbMocks.createFieldCheck).toHaveBeenCalledWith(expect.objectContaining({ evidencePhotoKey: "cleanroute/7/demo-key.png", evidencePhotoUrl: "/manus-storage/cleanroute/7/demo-key.png" }));
  });

  it("requires authentication before a community issue report can be submitted", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.facilities.submitIssueReport({ facilityId: "panvel-sector-1", reportType: "Toilet closed" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("allows an authenticated normal user to submit a pending community review", async () => {
    const caller = appRouter.createCaller(context("user"));
    await caller.reviews.submit({ facilityId: "panvel-sector-1", rating: 4, body: "Genuine user feedback goes here." });
    expect(dbMocks.createReview).toHaveBeenCalledWith({ facilityId: "panvel-sector-1", rating: 4, body: "Genuine user feedback goes here.", submittedById: 7 });
  });

  it("serves only the persisted public review list and aggregate for the requested facility", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.reviews.summary({ facilityId: "panvel-sector-1" })).resolves.toEqual({ averageRating: 4, ratingCount: 1 });
    await expect(caller.reviews.listPublished({ facilityId: "panvel-sector-1" })).resolves.toHaveLength(1);
    expect(dbMocks.getPublishedReviewSummary).toHaveBeenCalledWith("panvel-sector-1");
    expect(dbMocks.listPublishedReviews).toHaveBeenCalledWith("panvel-sector-1");
  });

  it("allows only an administrator to resolve a persistent report", async () => {
    const caller = appRouter.createCaller(context("admin"));
    await caller.admin.updateReport({ reportId: "report-1", status: "resolved", resolutionNotes: "Checked and resolved." });
    expect(dbMocks.updateReport).toHaveBeenCalledWith({ reportId: "report-1", status: "resolved", resolutionNotes: "Checked and resolved.", reviewerId: 7 });
    const visitor = appRouter.createCaller(context("user"));
    await expect(visitor.admin.reports()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(visitor.admin.updateReport({ reportId: "report-1", status: "resolved" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(visitor.admin.updateReview({ reviewId: "review-1", status: "published" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(visitor.admin.createFacility({ name: "New toilet", area: "Panvel", district: "Raigad", context: "Town", latitude: 19, longitude: 73, locationPrecision: "Listing coordinate", hours: "Open", sourceKey: "Admin", finding: "Needs verification", publicationStatus: "unpublished" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an administrator to create a controlled facility record", async () => {
    const caller = appRouter.createCaller(context("admin"));
    await caller.admin.createFacility({ name: "New toilet", area: "Panvel", district: "Raigad", context: "Town", latitude: 19, longitude: 73, locationPrecision: "Listing coordinate", hours: "Open", sourceKey: "Admin", finding: "Needs verification", publicationStatus: "unpublished" });
    expect(dbMocks.createAdminFacility).toHaveBeenCalledWith(expect.objectContaining({ name: "New toilet", publicationStatus: "unpublished" }));
  });
});
