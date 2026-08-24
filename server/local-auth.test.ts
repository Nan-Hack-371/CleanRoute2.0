import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  createLocalUser: vi.fn(),
  setLocalPassword: vi.fn(),
}));
const sdkMocks = vi.hoisted(() => ({ createSessionToken: vi.fn() }));

vi.mock("./db", () => dbMocks);
vi.mock("./_core/sdk", () => ({ sdk: sdkMocks }));

import { hashPassword, verifyPassword } from "./localAuth";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";

const localUser = {
  id: 11,
  openId: "local:test-account",
  name: "Normal User",
  email: "normal@example.test",
  loginMethod: "password",
  authProvider: "local" as const,
  passwordHash: null,
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function context(user: TrpcContext["user"] = null) {
  const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  return {
    cookies,
    ctx: {
      user,
      req: { protocol: "https", headers: {} },
      res: {
        cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }),
        clearCookie: vi.fn(),
      },
    } as unknown as TrpcContext,
  };
}

describe("CleanRoute local account authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sdkMocks.createSessionToken.mockResolvedValue("signed-local-session");
  });

  it("hashes passwords with a salted non-plaintext value and verifies it", async () => {
    const hash = await hashPassword("a-long-test-password");
    expect(hash).toMatch(/^scrypt-v1\$/);
    expect(hash).not.toContain("a-long-test-password");
    await expect(verifyPassword("a-long-test-password", hash)).resolves.toBe(true);
    await expect(verifyPassword("incorrect-password", hash)).resolves.toBe(false);
  });

  it("returns safe account fields without exposing a password hash", async () => {
    const { ctx } = context({ ...localUser, passwordHash: "scrypt-v1$private$hash" } as TrpcContext["user"]);
    const result = await appRouter.createCaller(ctx).auth.me();
    expect(result).toEqual({ id: 11, name: "Normal User", email: "normal@example.test", role: "user" });
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("registers a normal local user and issues the existing signed session cookie", async () => {
    dbMocks.getUserByEmail.mockResolvedValue(undefined);
    dbMocks.createLocalUser.mockResolvedValue({ ...localUser, passwordHash: "scrypt-v1$mock$mock" });
    const { ctx, cookies } = context();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.register({ name: "Normal User", email: "NORMAL@example.test", password: "a-long-test-password" });
    expect(dbMocks.createLocalUser).toHaveBeenCalledWith(expect.objectContaining({ email: "normal@example.test", name: "Normal User", passwordHash: expect.stringMatching(/^scrypt-v1\$/) }));
    expect(result.user.role).toBe("user");
    expect(cookies).toEqual([expect.objectContaining({ name: COOKIE_NAME, value: "signed-local-session", options: expect.objectContaining({ httpOnly: true, path: "/" }) })]);
  });

  it("rejects duplicate registration without creating a second user", async () => {
    dbMocks.getUserByEmail.mockResolvedValue(localUser);
    const { ctx } = context();
    await expect(appRouter.createCaller(ctx).auth.register({ name: "Duplicate", email: "normal@example.test", password: "a-long-test-password" })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(dbMocks.createLocalUser).not.toHaveBeenCalled();
  });

  it("rejects incorrect credentials with a generic error and does not issue a session", async () => {
    dbMocks.getUserByEmail.mockResolvedValue({ ...localUser, passwordHash: await hashPassword("correct-password") });
    const { ctx, cookies } = context();
    await expect(appRouter.createCaller(ctx).auth.login({ email: "normal@example.test", password: "incorrect-password" })).rejects.toMatchObject({ code: "UNAUTHORIZED", message: "Email or password is incorrect." });
    expect(cookies).toHaveLength(0);
  });

  it("signs in a valid local user and issues a first-party session", async () => {
    dbMocks.getUserByEmail.mockResolvedValue({ ...localUser, passwordHash: await hashPassword("correct-password") });
    const { ctx, cookies } = context();
    const result = await appRouter.createCaller(ctx).auth.login({ email: "normal@example.test", password: "correct-password" });
    expect(result.user).toMatchObject({ id: 11, role: "user" });
    expect(cookies).toEqual([expect.objectContaining({ name: COOKIE_NAME, value: "signed-local-session" })]);
  });

  it("denies a valid normal user at the administrator login procedure", async () => {
    dbMocks.getUserByEmail.mockResolvedValue({ ...localUser, passwordHash: await hashPassword("correct-password") });
    const { ctx, cookies } = context();
    await expect(appRouter.createCaller(ctx).auth.adminLogin({ email: "normal@example.test", password: "correct-password" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(cookies).toHaveLength(0);
  });

  it("denies a normal user from setting an administrator password", async () => {
    const { ctx } = context(localUser as TrpcContext["user"]);
    await expect(appRouter.createCaller(ctx).auth.setupAdminPassword({ password: "a-long-test-password" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(dbMocks.setLocalPassword).not.toHaveBeenCalled();
  });
});
