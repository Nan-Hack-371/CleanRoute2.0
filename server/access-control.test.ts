import { describe, expect, it } from "vitest";
import { isAdministrator } from "../shared/const";

describe("official field-check UI role gate", () => {
  it("enables the restored field-check and edit entry points only for administrators", () => {
    expect(isAdministrator({ role: "admin" })).toBe(true);
    expect(isAdministrator({ role: "user" })).toBe(false);
    expect(isAdministrator(null)).toBe(false);
  });
});
