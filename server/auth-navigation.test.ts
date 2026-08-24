import { describe, expect, it } from "vitest";
import { buildLoginPath, safeInternalPath } from "../client/src/lib/authNavigation";

describe("CleanRoute local-auth return navigation", () => {
  it("keeps review intent on a validated internal facility return target", () => {
    expect(buildLoginPath({ returnTo: "/?facility=khopoli-rail&authIntent=review", intent: "review" })).toBe("/login?returnTo=%2F%3Ffacility%3Dkhopoli-rail%26authIntent%3Dreview&intent=review");
  });

  it("rejects external and protocol-relative return targets", () => {
    expect(safeInternalPath("https://untrusted.example", "/")).toBe("/");
    expect(safeInternalPath("//untrusted.example", "/")).toBe("/");
  });
});
