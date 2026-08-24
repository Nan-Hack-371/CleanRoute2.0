export type AuthIntent = "review" | "report";

export function safeInternalPath(candidate: string | null | undefined, fallback = "/") {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  return candidate;
}

export function buildLoginPath(options: { returnTo?: string; intent?: AuthIntent } = {}) {
  return buildAuthPath("/login", options);
}

export function buildRegistrationPath(options: { returnTo?: string; intent?: AuthIntent } = {}) {
  return buildAuthPath("/register", options);
}

function buildAuthPath(basePath: string, options: { returnTo?: string; intent?: AuthIntent }) {
  const params = new URLSearchParams();
  const returnTo = safeInternalPath(options.returnTo, "/");
  if (returnTo !== "/") params.set("returnTo", returnTo);
  if (options.intent) params.set("intent", options.intent);
  const query = params.toString();
  return `${basePath}${query ? `?${query}` : ""}`;
}

export function currentInternalPath() {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}
