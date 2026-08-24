export type AccessUser = { role?: string | null } | null | undefined;

/** Keeps the UI gate aligned with the server's administrator-only procedures. */
export function isAdministrator(user: AccessUser): boolean {
  return user?.role === "admin";
}
