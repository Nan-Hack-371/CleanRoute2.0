import { double, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Internal identity used by existing sessions; local accounts use a random local: prefix. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  authProvider: mysqlEnum("authProvider", ["oauth", "local"]).notNull().default("oauth"),
  passwordHash: varchar("passwordHash", { length: 512 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const facilities = mysqlTable("facilities", {
  id: varchar("id", { length: 96 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  area: varchar("area", { length: 96 }).notNull(),
  district: varchar("district", { length: 96 }).notNull(),
  context: varchar("context", { length: 64 }).notNull(),
  latitude: double("latitude").notNull(),
  longitude: double("longitude").notNull(),
  locationPrecision: varchar("locationPrecision", { length: 64 }).notNull(),
  address: text("address"),
  hours: varchar("hours", { length: 128 }).notNull(),
  publicListingRating: double("publicListingRating"),
  reviewCount: int("reviewCount").notNull().default(0),
  verificationStatus: varchar("verificationStatus", { length: 128 }).notNull(),
  hygieneRating: int("hygieneRating"),
  waterStatus: varchar("waterStatus", { length: 64 }).notNull(),
  safetyStatus: varchar("safetyStatus", { length: 64 }).notNull(),
  lightingStatus: varchar("lightingStatus", { length: 64 }).notNull(),
  womenFriendly: varchar("womenFriendly", { length: 64 }).notNull(),
  wheelchairAccess: varchar("wheelchairAccess", { length: 64 }).notNull(),
  operatingStatus: varchar("operatingStatus", { length: 128 }).notNull(),
  sourceKey: varchar("sourceKey", { length: 32 }).notNull(),
  sourceUrl: text("sourceUrl"),
  lastChecked: varchar("lastChecked", { length: 128 }).notNull(),
  finding: text("finding").notNull(),
  tagsJson: text("tagsJson").notNull(),
  evidencePhotoKey: varchar("evidencePhotoKey", { length: 512 }),
  evidencePhotoUrl: text("evidencePhotoUrl"),
  publicationStatus: mysqlEnum("publicationStatus", ["published", "unpublished"]).notNull().default("published"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("facilities_area_idx").on(table.area)]);

export const fieldChecks = mysqlTable("field_checks", {
  id: varchar("id", { length: 96 }).primaryKey(),
  facilityId: varchar("facilityId", { length: 96 }).notNull().references(() => facilities.id),
  submittedById: int("submittedById").notNull().references(() => users.id),
  researcherName: varchar("researcherName", { length: 160 }).notNull(),
  hygieneRating: int("hygieneRating").notNull(),
  waterStatus: varchar("waterStatus", { length: 64 }).notNull(),
  safetyStatus: varchar("safetyStatus", { length: 64 }).notNull(),
  lightingStatus: varchar("lightingStatus", { length: 64 }).notNull(),
  accessibilityStatus: varchar("accessibilityStatus", { length: 64 }).notNull(),
  womenFriendly: varchar("womenFriendly", { length: 64 }).notNull(),
  operatingStatus: varchar("operatingStatus", { length: 64 }).notNull(),
  notes: text("notes"),
  evidencePhotoKey: varchar("evidencePhotoKey", { length: 512 }),
  evidencePhotoUrl: text("evidencePhotoUrl"),
  verificationStatus: mysqlEnum("verificationStatus", ["submitted", "verified"]).notNull().default("submitted"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("field_checks_facility_idx").on(table.facilityId), index("field_checks_submitter_idx").on(table.submittedById)]);

export const issueReports = mysqlTable("issue_reports", {
  id: varchar("id", { length: 96 }).primaryKey(),
  facilityId: varchar("facilityId", { length: 96 }).notNull().references(() => facilities.id),
  submittedById: int("submittedById").notNull().references(() => users.id),
  reportType: varchar("reportType", { length: 96 }).notNull(),
  description: text("description"),
  evidencePhotoKey: varchar("evidencePhotoKey", { length: 512 }),
  evidencePhotoUrl: text("evidencePhotoUrl"),
  status: mysqlEnum("status", ["pending", "reviewing", "resolved", "rejected"]).notNull().default("pending"),
  resolutionNotes: text("resolutionNotes"),
  reviewedById: int("reviewedById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("issue_reports_facility_idx").on(table.facilityId), index("issue_reports_status_idx").on(table.status)]);

export const reviews = mysqlTable("reviews", {
  id: varchar("id", { length: 96 }).primaryKey(),
  facilityId: varchar("facilityId", { length: 96 }).notNull().references(() => facilities.id),
  submittedById: int("submittedById").notNull().references(() => users.id),
  rating: int("rating").notNull(),
  body: text("body"),
  status: mysqlEnum("status", ["pending", "published", "rejected"]).notNull().default("pending"),
  moderationNotes: text("moderationNotes"),
  reviewedById: int("reviewedById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("reviews_facility_idx").on(table.facilityId), index("reviews_submitter_idx").on(table.submittedById), index("reviews_status_idx").on(table.status)]);

export type Facility = typeof facilities.$inferSelect;
export type FieldCheck = typeof fieldChecks.$inferSelect;
export type IssueReport = typeof issueReports.$inferSelect;
export type Review = typeof reviews.$inferSelect;
