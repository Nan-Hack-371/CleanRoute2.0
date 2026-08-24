import { describe, expect, it } from "vitest";
import { isAdministrator } from "./const";

describe("administrator UI gate", () => {
  it("shows official field-check and edit entry points only for an administrator role", () => {
    expect(isAdministrator({ role: "admin" })).toBe(true);
    expect(isAdministrator({ role: "user" })).toBe(false);
    expect(isAdministrator(null)).toBe(false);
    expect(isAdministrator(undefined)).toBe(false);
  });
});
