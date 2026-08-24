import { describe, expect, it } from "vitest";
import { toClientFacility } from "./db";

const persistedFacility = {
  id: "panvel-sector-1",
  name: "Public toilet",
  area: "Panvel",
  district: "Raigad",
  context: "Transit",
  latitude: 19.0007899,
  longitude: 73.1174471,
  locationPrecision: "Listing coordinate",
  address: null,
  hours: "Open 24 hours listed",
  publicListingRating: 5,
  reviewCount: 2,
  verificationStatus: "Location sourced from public listing",
  hygieneRating: null,
  waterStatus: "Needs field check",
  safetyStatus: "Needs field check",
  lightingStatus: "Needs field check",
  womenFriendly: "Not verified",
  wheelchairAccess: "Not verified",
  operatingStatus: "Not verified",
  sourceKey: "G1",
  sourceUrl: "https://example.test/place",
  lastChecked: "Public listing reviewed",
  finding: "Map discovery only.",
  tagsJson: '["station","24-hours"]',
  evidencePhotoKey: null,
  evidencePhotoUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("CleanRoute persistent facility mapping", () => {
  it("preserves map coordinates, evidence state, and tags for the data-driven locator", () => {
    const facility = toClientFacility(persistedFacility as never);
    expect(facility.coordinates).toEqual({ lat: 19.0007899, lng: 73.1174471 });
    expect(facility.hygieneRating).toBeNull();
    expect(facility.tags).toEqual(["station", "24-hours"]);
    expect(facility.evidencePhotoUrl).toBeNull();
  });

  it("fails closed to an empty tag list when stored JSON is malformed", () => {
    const facility = toClientFacility({ ...persistedFacility, tagsJson: "not-json" } as never);
    expect(facility.tags).toEqual([]);
  });
});
