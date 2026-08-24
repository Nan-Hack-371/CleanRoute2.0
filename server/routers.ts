import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as cleanrouteDb from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { canAttemptAuthentication, clearAuthenticationAttempts, hashPassword, normalizeEmail, recordAuthenticationFailure, verifyPassword } from "./localAuth";
import { storagePut } from "./storage";

const imagePayload = z.string().regex(/^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/).max(7_000_000).optional();

type EvidenceUpload = { key?: string; url?: string };

async function uploadEvidence(userId: number, dataUrl?: string, fileName?: string): Promise<EvidenceUpload> {
  if (!dataUrl) return {};
  const [header, encoded] = dataUrl.split(",", 2);
  const contentType = header.match(/^data:(image\/(?:png|jpe?g|webp));base64$/)?.[1];
  if (!contentType || !encoded) throw new Error("Evidence must be a PNG, JPEG, or WebP image");
  const bytes = Buffer.from(encoded, "base64");
  if (bytes.length === 0 || bytes.length > 5 * 1024 * 1024) throw new Error("Evidence image must be smaller than 5 MB");
  const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const safeName = (fileName ?? `evidence.${extension}`).replace(/[^a-zA-Z0-9._-]/g, "_");
  return storagePut(`cleanroute/${userId}/${Date.now()}-${safeName}`, bytes, contentType);
}

const fieldCheckInput = z.object({
  facilityId: z.string().min(1),
  researcherName: z.string().trim().min(2).max(160),
  hygieneRating: z.number().int().min(1).max(5),
  waterStatus: z.enum(["Available", "Not available", "Intermittent", "Unknown"]),
  safetyStatus: z.enum(["Good", "Average", "Poor", "Unknown"]),
  lightingStatus: z.enum(["Good", "Average", "Poor", "Unknown"]),
  accessibilityStatus: z.enum(["Wheelchair accessible", "Partially accessible", "Not accessible", "Unknown"]),
  womenFriendly: z.enum(["Yes", "No", "Needs verification"]),
  operatingStatus: z.enum(["Open", "Closed", "Temporarily closed", "Unknown"]),
  notes: z.string().trim().max(4000).optional(),
  evidenceDataUrl: imagePayload,
  evidenceFileName: z.string().max(200).optional(),
});

const reportInput = z.object({
  facilityId: z.string().min(1),
  reportType: z.enum(["Wrong location", "Toilet closed", "Wrong operating hours", "Incorrect accessibility information", "Incorrect facility information", "Duplicate listing", "Inappropriate content", "Other"]),
  description: z.string().trim().max(4000).optional(),
  evidenceDataUrl: imagePayload,
  evidenceFileName: z.string().max(200).optional(),
});

const reviewInput = z.object({
  facilityId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().max(2000).optional(),
});

const passwordSchema = z.string().min(10, "Use at least 10 characters.").max(128, "Password is too long.");
const emailSchema = z.string().trim().email("Enter a valid email address.").max(320);
const registerInput = z.object({ name: z.string().trim().min(2, "Enter your name.").max(160), email: emailSchema, password: passwordSchema });
const loginInput = z.object({ email: emailSchema, password: z.string().min(1).max(128) });

function requestAttemptKey(req: { headers: Record<string, string | string[] | undefined> }, email: string) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim();
  return `${ip ?? "unknown"}:${normalizeEmail(email)}`;
}

async function createLocalSession(ctx: { req: any; res: any }, user: { openId: string; name: string | null }) {
  const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name?.trim() || "CleanRoute user", expiresInMs: ONE_YEAR_MS });
  const cookieOptions = getSessionCookieOptions(ctx.req);
  ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}

const adminFacilityInput = z.object({
  id: z.string().min(1).max(96).optional(),
  name: z.string().trim().min(2).max(255),
  area: z.string().trim().min(2).max(96),
  district: z.string().trim().min(2).max(96),
  context: z.string().trim().min(2).max(64),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locationPrecision: z.enum(["Listing coordinate", "Approximate area location"]),
  hours: z.string().trim().min(2).max(128),
  sourceKey: z.string().trim().min(1).max(32),
  sourceUrl: z.string().url().optional(),
  finding: z.string().trim().min(2).max(4000),
  publicationStatus: z.enum(["published", "unpublished"]),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user ? ({
      id: ctx.user.id,
      name: ctx.user.name,
      email: ctx.user.email,
      role: ctx.user.role,
    }) : null),
    register: publicProcedure.input(registerInput).mutation(async ({ ctx, input }) => {
      const email = normalizeEmail(input.email);
      const key = requestAttemptKey(ctx.req, email);
      if (!canAttemptAuthentication(key)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait before trying again." });
      if (await cleanrouteDb.getUserByEmail(email)) {
        recordAuthenticationFailure(key);
        throw new TRPCError({ code: "CONFLICT", message: "We couldn't create your account. Please try another email or sign in." });
      }
      try {
        const user = await cleanrouteDb.createLocalUser({ name: input.name.trim(), email, passwordHash: await hashPassword(input.password) });
        await createLocalSession(ctx, user);
        clearAuthenticationAttempts(key);
        return { user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Local auth] Registration failed", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "We couldn't create your account. Please try again." });
      }
    }),
    login: publicProcedure.input(loginInput).mutation(async ({ ctx, input }) => {
      const email = normalizeEmail(input.email);
      const key = requestAttemptKey(ctx.req, email);
      if (!canAttemptAuthentication(key)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait before trying again." });
      const user = await cleanrouteDb.getUserByEmail(email);
      if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
        recordAuthenticationFailure(key);
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Email or password is incorrect." });
      }
      await createLocalSession(ctx, user);
      clearAuthenticationAttempts(key);
      return { user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),
    adminLogin: publicProcedure.input(loginInput).mutation(async ({ ctx, input }) => {
      const email = normalizeEmail(input.email);
      const key = requestAttemptKey(ctx.req, email);
      if (!canAttemptAuthentication(key)) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait before trying again." });
      const user = await cleanrouteDb.getUserByEmail(email);
      if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
        recordAuthenticationFailure(key);
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Email or password is incorrect." });
      }
      if (user.role !== "admin") {
        recordAuthenticationFailure(key);
        throw new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to access this area." });
      }
      await createLocalSession(ctx, user);
      clearAuthenticationAttempts(key);
      return { user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),
    setupAdminPassword: adminProcedure.input(z.object({ password: passwordSchema })).mutation(async ({ ctx, input }) => {
      await cleanrouteDb.setLocalPassword(ctx.user.id, await hashPassword(input.password));
      return { success: true } as const;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  facilities: router({
    list: publicProcedure.query(() => cleanrouteDb.listFacilities()),
    submitFieldCheck: adminProcedure.input(fieldCheckInput).mutation(async ({ ctx, input }) => {
      const evidence = await uploadEvidence(ctx.user.id, input.evidenceDataUrl, input.evidenceFileName);
      return cleanrouteDb.createFieldCheck({
        facilityId: input.facilityId,
        submittedById: ctx.user.id,
        researcherName: input.researcherName,
        hygieneRating: input.hygieneRating,
        waterStatus: input.waterStatus,
        safetyStatus: input.safetyStatus,
        lightingStatus: input.lightingStatus,
        accessibilityStatus: input.accessibilityStatus,
        womenFriendly: input.womenFriendly,
        operatingStatus: input.operatingStatus,
        notes: input.notes,
        evidencePhotoKey: evidence.key,
        evidencePhotoUrl: evidence.url,
        approved: true,
      });
    }),
    submitIssueReport: protectedProcedure.input(reportInput).mutation(async ({ ctx, input }) => {
      const evidence = await uploadEvidence(ctx.user.id, input.evidenceDataUrl, input.evidenceFileName);
      return cleanrouteDb.createIssueReport({
        facilityId: input.facilityId,
        submittedById: ctx.user.id,
        reportType: input.reportType,
        description: input.description,
        evidencePhotoKey: evidence.key,
        evidencePhotoUrl: evidence.url,
      });
    }),
    myReports: protectedProcedure.query(({ ctx }) => cleanrouteDb.listOwnReports(ctx.user.id)),
  }),
  reviews: router({
    listPublished: publicProcedure.input(z.object({ facilityId: z.string().min(1) })).query(({ input }) => cleanrouteDb.listPublishedReviews(input.facilityId)),
    summary: publicProcedure.input(z.object({ facilityId: z.string().min(1) })).query(({ input }) => cleanrouteDb.getPublishedReviewSummary(input.facilityId)),
    submit: protectedProcedure.input(reviewInput).mutation(({ ctx, input }) => cleanrouteDb.createReview({ ...input, submittedById: ctx.user.id })),
    mine: protectedProcedure.query(({ ctx }) => cleanrouteDb.listOwnReviews(ctx.user.id)),
    updateMine: protectedProcedure.input(z.object({ id: z.string().min(1), rating: z.number().int().min(1).max(5), body: z.string().trim().max(2000).optional() })).mutation(({ ctx, input }) => cleanrouteDb.updateOwnReview({ ...input, userId: ctx.user.id })),
    deleteMine: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(({ ctx, input }) => cleanrouteDb.deleteOwnReview(input.id, ctx.user.id)),
  }),
  admin: router({
    stats: adminProcedure.query(() => cleanrouteDb.getAdminStats()),
    facilities: adminProcedure.query(() => cleanrouteDb.listAdminFacilities()),
    createFacility: adminProcedure.input(adminFacilityInput).mutation(({ input }) => cleanrouteDb.createAdminFacility(input)),
    updateFacility: adminProcedure.input(z.object({ id: z.string().min(1), facility: adminFacilityInput })).mutation(({ input }) => cleanrouteDb.updateAdminFacility(input.id, input.facility)),
    reviews: adminProcedure.query(() => cleanrouteDb.listAdminReviews()),
    updateReview: adminProcedure.input(z.object({ reviewId: z.string().min(1), status: z.enum(["pending", "published", "rejected"]), moderationNotes: z.string().trim().max(4000).optional() })).mutation(({ ctx, input }) => cleanrouteDb.updateReview({ ...input, reviewerId: ctx.user.id })),
    reports: adminProcedure.query(() => cleanrouteDb.listReports()),
    updateReport: adminProcedure.input(z.object({
      reportId: z.string().min(1),
      status: z.enum(["pending", "reviewing", "resolved", "rejected"]),
      resolutionNotes: z.string().trim().max(4000).optional(),
    })).mutation(({ ctx, input }) => cleanrouteDb.updateReport({ ...input, reviewerId: ctx.user.id })),
  }),
});

export type AppRouter = typeof appRouter;
