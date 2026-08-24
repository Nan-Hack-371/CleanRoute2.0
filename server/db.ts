import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import { facilities as facilitySeed } from "../client/src/const";
import { facilities, fieldChecks, issueReports, reviews, InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function createLocalUser(input: { name: string; email: string; passwordHash: string }) {
  const db = await requireDb();
  const openId = `local:${nanoid(21)}`;
  await db.insert(users).values({
    openId,
    name: input.name,
    email: input.email,
    loginMethod: "password",
    authProvider: "local",
    passwordHash: input.passwordHash,
    role: "user",
    lastSignedIn: new Date(),
  });
  const user = await getUserByOpenId(openId);
  if (!user) throw new Error("Local account creation failed");
  return user;
}

export async function setLocalPassword(userId: number, passwordHash: string) {
  const db = await requireDb();
  await db.update(users).set({
    passwordHash,
    authProvider: "local",
    loginMethod: "password",
    lastSignedIn: new Date(),
  }).where(eq(users.id, userId));
}

function safeTags(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === "string") : [];
  } catch {
    return [];
  }
}

export function toClientFacility(row: typeof facilities.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    area: row.area,
    district: row.district,
    context: row.context,
    coordinates: { lat: row.latitude, lng: row.longitude },
    locationPrecision: row.locationPrecision,
    hours: row.hours,
    publicListingRating: row.publicListingRating,
    reviewCount: row.reviewCount,
    verificationStatus: row.verificationStatus,
    hygieneRating: row.hygieneRating,
    waterStatus: row.waterStatus,
    safetyStatus: row.safetyStatus,
    lightingStatus: row.lightingStatus,
    womenFriendly: row.womenFriendly,
    wheelchairAccess: row.wheelchairAccess,
    operatingStatus: row.operatingStatus,
    sourceKey: row.sourceKey,
    sourceUrl: row.sourceUrl,
    lastChecked: row.lastChecked,
    finding: row.finding,
    tags: safeTags(row.tagsJson),
    evidencePhotoUrl: row.evidencePhotoUrl,
    publicationStatus: row.publicationStatus,
  };
}

async function seedFacilitiesIfEmpty() {
  const db = await requireDb();
  const [count] = await db.select({ count: sql<number>`count(*)` }).from(facilities);
  if (Number(count?.count ?? 0) > 0) return;
  await db.insert(facilities).values(facilitySeed.map(facility => ({
    id: facility.id,
    name: facility.name,
    area: facility.area,
    district: facility.district,
    context: facility.context,
    latitude: facility.coordinates.lat,
    longitude: facility.coordinates.lng,
    locationPrecision: facility.locationPrecision,
    address: null,
    hours: facility.hours,
    publicListingRating: facility.publicListingRating,
    reviewCount: facility.reviewCount,
    verificationStatus: facility.verificationStatus,
    hygieneRating: facility.hygieneRating,
    waterStatus: facility.waterStatus,
    safetyStatus: facility.safetyStatus,
    lightingStatus: facility.lightingStatus,
    womenFriendly: facility.womenFriendly,
    wheelchairAccess: facility.wheelchairAccess,
    operatingStatus: facility.operatingStatus,
    sourceKey: facility.sourceKey,
    sourceUrl: facility.sourceUrl,
    lastChecked: facility.lastChecked,
    finding: facility.finding,
    tagsJson: JSON.stringify(facility.tags),
  })));
}

export async function listFacilities() {
  await seedFacilitiesIfEmpty();
  const db = await requireDb();
  return (await db.select().from(facilities).where(eq(facilities.publicationStatus, "published")).orderBy(facilities.area, facilities.name)).map(toClientFacility);
}

export async function listAdminFacilities() {
  await seedFacilitiesIfEmpty();
  const db = await requireDb();
  return (await db.select().from(facilities).orderBy(facilities.area, facilities.name)).map(toClientFacility);
}

export async function getFacility(id: string) {
  await seedFacilitiesIfEmpty();
  const db = await requireDb();
  const rows = await db.select().from(facilities).where(eq(facilities.id, id)).limit(1);
  return rows[0] ? toClientFacility(rows[0]) : undefined;
}

export type FieldCheckInput = {
  facilityId: string;
  submittedById: number;
  researcherName: string;
  hygieneRating: number;
  waterStatus: string;
  safetyStatus: string;
  lightingStatus: string;
  accessibilityStatus: string;
  womenFriendly: string;
  operatingStatus: string;
  notes?: string;
  evidencePhotoKey?: string;
  evidencePhotoUrl?: string;
  approved: boolean;
};

export async function createFieldCheck(input: FieldCheckInput) {
  const db = await requireDb();
  const verificationStatus = input.approved ? "verified" : "submitted" as const;
  const id = nanoid();
  await db.insert(fieldChecks).values({
    id,
    facilityId: input.facilityId,
    submittedById: input.submittedById,
    researcherName: input.researcherName,
    hygieneRating: input.hygieneRating,
    waterStatus: input.waterStatus,
    safetyStatus: input.safetyStatus,
    lightingStatus: input.lightingStatus,
    accessibilityStatus: input.accessibilityStatus,
    womenFriendly: input.womenFriendly,
    operatingStatus: input.operatingStatus,
    notes: input.notes || null,
    evidencePhotoKey: input.evidencePhotoKey || null,
    evidencePhotoUrl: input.evidencePhotoUrl || null,
    verificationStatus,
  });
  if (input.approved) {
    await db.update(facilities).set({
      hygieneRating: input.hygieneRating,
      waterStatus: input.waterStatus,
      safetyStatus: input.safetyStatus,
      lightingStatus: input.lightingStatus,
      womenFriendly: input.womenFriendly,
      wheelchairAccess: input.accessibilityStatus,
      operatingStatus: input.operatingStatus,
      verificationStatus: "Verified",
      lastChecked: `Verified field check · ${new Date().toISOString()}`,
      finding: input.notes || "Verified field check recorded by an authorised reviewer.",
      evidencePhotoKey: input.evidencePhotoKey || undefined,
      evidencePhotoUrl: input.evidencePhotoUrl || undefined,
    }).where(eq(facilities.id, input.facilityId));
  }
  return { fieldCheckId: id, facility: await getFacility(input.facilityId), applied: input.approved };
}

export type IssueReportInput = {
  facilityId: string;
  submittedById: number;
  reportType: string;
  description?: string;
  evidencePhotoKey?: string;
  evidencePhotoUrl?: string;
};

export async function createIssueReport(input: IssueReportInput) {
  const db = await requireDb();
  const id = nanoid();
  await db.insert(issueReports).values({
    id,
    facilityId: input.facilityId,
    submittedById: input.submittedById,
    reportType: input.reportType,
    description: input.description || null,
    evidencePhotoKey: input.evidencePhotoKey || null,
    evidencePhotoUrl: input.evidencePhotoUrl || null,
    status: "pending",
  });
  return { id, status: "pending" as const };
}

export async function listReports() {
  const db = await requireDb();
  return db.select({ report: issueReports, facilityName: facilities.name, facilityArea: facilities.area })
    .from(issueReports)
    .innerJoin(facilities, eq(issueReports.facilityId, facilities.id))
    .orderBy(desc(issueReports.createdAt));
}

export async function updateReport(input: { reportId: string; status: "pending" | "reviewing" | "resolved" | "rejected"; resolutionNotes?: string; reviewerId: number }) {
  const db = await requireDb();
  await db.update(issueReports).set({ status: input.status, resolutionNotes: input.resolutionNotes || null, reviewedById: input.reviewerId }).where(eq(issueReports.id, input.reportId));
  const rows = await db.select().from(issueReports).where(eq(issueReports.id, input.reportId)).limit(1);
  return rows[0];
}

export async function listOwnReports(userId: number) {
  const db = await requireDb();
  return db.select().from(issueReports).where(eq(issueReports.submittedById, userId)).orderBy(desc(issueReports.createdAt));
}

export type ReviewInput = { facilityId: string; submittedById: number; rating: number; body?: string };

export async function createReview(input: ReviewInput) {
  const db = await requireDb();
  const id = nanoid();
  await db.insert(reviews).values({ id, facilityId: input.facilityId, submittedById: input.submittedById, rating: input.rating, body: input.body || null, status: "pending" });
  return { id, status: "pending" as const };
}

export async function listPublishedReviews(facilityId: string) {
  const db = await requireDb();
  return db.select({ review: reviews, author: users.name }).from(reviews).innerJoin(users, eq(reviews.submittedById, users.id)).where(and(eq(reviews.facilityId, facilityId), eq(reviews.status, "published"))).orderBy(desc(reviews.createdAt));
}

export async function getPublishedReviewSummary(facilityId: string) {
  const db = await requireDb();
  const [summary] = await db.select({
    averageRating: sql<number | null>`avg(${reviews.rating})`,
    ratingCount: sql<number>`count(*)`,
  }).from(reviews).where(and(eq(reviews.facilityId, facilityId), eq(reviews.status, "published")));
  return {
    averageRating: summary?.averageRating === null || summary?.averageRating === undefined ? null : Number(summary.averageRating),
    ratingCount: Number(summary?.ratingCount ?? 0),
  };
}

export async function listOwnReviews(userId: number) {
  const db = await requireDb();
  return db.select().from(reviews).where(eq(reviews.submittedById, userId)).orderBy(desc(reviews.createdAt));
}

export async function updateOwnReview(input: { id: string; userId: number; rating: number; body?: string }) {
  const db = await requireDb();
  await db.update(reviews).set({ rating: input.rating, body: input.body || null, status: "pending", moderationNotes: null, reviewedById: null }).where(and(eq(reviews.id, input.id), eq(reviews.submittedById, input.userId)));
  const rows = await db.select().from(reviews).where(and(eq(reviews.id, input.id), eq(reviews.submittedById, input.userId))).limit(1);
  return rows[0];
}

export async function deleteOwnReview(id: string, userId: number) {
  const db = await requireDb();
  await db.delete(reviews).where(and(eq(reviews.id, id), eq(reviews.submittedById, userId)));
  return { success: true as const };
}

export async function listAdminReviews() {
  const db = await requireDb();
  return db.select({ review: reviews, facilityName: facilities.name, facilityArea: facilities.area, author: users.name })
    .from(reviews)
    .innerJoin(facilities, eq(reviews.facilityId, facilities.id))
    .innerJoin(users, eq(reviews.submittedById, users.id))
    .orderBy(desc(reviews.createdAt));
}

export async function updateReview(input: { reviewId: string; status: "pending" | "published" | "rejected"; moderationNotes?: string; reviewerId: number }) {
  const db = await requireDb();
  await db.update(reviews).set({ status: input.status, moderationNotes: input.moderationNotes || null, reviewedById: input.reviewerId }).where(eq(reviews.id, input.reviewId));
  const rows = await db.select().from(reviews).where(eq(reviews.id, input.reviewId)).limit(1);
  return rows[0];
}

export type AdminFacilityInput = {
  id?: string;
  name: string;
  area: string;
  district: string;
  context: string;
  latitude: number;
  longitude: number;
  locationPrecision: string;
  hours: string;
  sourceKey: string;
  sourceUrl?: string;
  finding: string;
  publicationStatus: "published" | "unpublished";
};

export async function createAdminFacility(input: AdminFacilityInput) {
  const db = await requireDb();
  const id = input.id ?? `admin-${nanoid(12)}`;
  await db.insert(facilities).values({
    id, name: input.name, area: input.area, district: input.district, context: input.context, latitude: input.latitude, longitude: input.longitude,
    locationPrecision: input.locationPrecision, address: null, hours: input.hours, publicListingRating: null, reviewCount: 0,
    verificationStatus: "Needs field check", hygieneRating: null, waterStatus: "Needs field check", safetyStatus: "Needs field check", lightingStatus: "Needs field check",
    womenFriendly: "Not verified", wheelchairAccess: "Not verified", operatingStatus: "Status not listed", sourceKey: input.sourceKey, sourceUrl: input.sourceUrl || null,
    lastChecked: "Admin-created record · needs verification", finding: input.finding, tagsJson: "[]", publicationStatus: input.publicationStatus,
  });
  return getFacility(id);
}

export async function updateAdminFacility(id: string, input: AdminFacilityInput) {
  const db = await requireDb();
  await db.update(facilities).set({
    name: input.name, area: input.area, district: input.district, context: input.context, latitude: input.latitude, longitude: input.longitude,
    locationPrecision: input.locationPrecision, hours: input.hours, sourceKey: input.sourceKey, sourceUrl: input.sourceUrl || null, finding: input.finding, publicationStatus: input.publicationStatus,
  }).where(eq(facilities.id, id));
  return getFacility(id);
}

export async function getAdminStats() {
  const db = await requireDb();
  const [facilityCount] = await db.select({ value: sql<number>`count(*)` }).from(facilities);
  const [unpublishedCount] = await db.select({ value: sql<number>`count(*)` }).from(facilities).where(eq(facilities.publicationStatus, "unpublished"));
  const [pendingReports] = await db.select({ value: sql<number>`count(*)` }).from(issueReports).where(eq(issueReports.status, "pending"));
  const [pendingReviews] = await db.select({ value: sql<number>`count(*)` }).from(reviews).where(eq(reviews.status, "pending"));
  const [verifiedChecks] = await db.select({ value: sql<number>`count(*)` }).from(fieldChecks).where(eq(fieldChecks.verificationStatus, "verified"));
  return { facilities: Number(facilityCount?.value ?? 0), unpublished: Number(unpublishedCount?.value ?? 0), pendingReports: Number(pendingReports?.value ?? 0), pendingReviews: Number(pendingReviews?.value ?? 0), verifiedChecks: Number(verifiedChecks?.value ?? 0) };
}
