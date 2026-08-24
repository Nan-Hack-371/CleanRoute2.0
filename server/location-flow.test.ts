import { describe, expect, it } from "vitest";
import { broaderSignalMessage, deniedLocationMessage, distanceKm, distanceSortAppliedMessage, distanceSortMessage, formatDistance, locationErrorMessage, locationRecoverySteps, nearestFilteredFacilities, preLocationSortMessage, shouldRetryLocation, sortNearestFirst, unavailableLocationMessage } from "../client/src/lib/location";

describe("CleanRoute dynamic location flow", () => {
  it("calculates a real geographic distance from browser coordinates", () => {
    const distance = distanceKm({ lat: 19.011, lng: 73.052 }, { lat: 19.021, lng: 73.052 });
    expect(distance).toBeGreaterThan(1);
    expect(distance).toBeLessThan(1.2);
  });

  it("orders the same facility records from nearest to farthest using dynamic coordinates", () => {
    const origin = { lat: 19.011, lng: 73.052 };
    const facilities = [
      { id: "far", coordinates: { lat: 19.111, lng: 73.052 } },
      { id: "near", coordinates: { lat: 19.016, lng: 73.052 } },
      { id: "middle", coordinates: { lat: 19.041, lng: 73.052 } },
    ];

    expect(sortNearestFirst(facilities, origin).map(facility => facility.id)).toEqual(["near", "middle", "far"]);
  });

  it("uses the required denied and unavailable location guidance", () => {
    expect(locationErrorMessage(1)).toBe(deniedLocationMessage);
    expect(locationErrorMessage(2)).toBe(unavailableLocationMessage);
    expect(locationErrorMessage(3)).toBe(unavailableLocationMessage);
  });

  it("requires location before the distance-sort control can claim a sorted result", () => {
    expect(distanceSortMessage(false)).toBe(preLocationSortMessage);
    expect(distanceSortMessage(true)).toBe(distanceSortAppliedMessage);
  });

  it("sorts the already searched or filtered subset rather than reintroducing excluded facilities", () => {
    const origin = { lat: 19.071668, lng: 72.99776 };
    const publishedFacilities = [
      { id: "khopoli", name: "Khopoli facility", area: "Khopoli", coordinates: { lat: 18.789886, lng: 73.3488891 } },
      { id: "vashi-station", name: "Vashi Station", area: "Navi Mumbai", coordinates: { lat: 19.07981, lng: 72.99812 } },
      { id: "vashi-sector-17", name: "Vashi Sector 17", area: "Navi Mumbai", coordinates: { lat: 19.071668, lng: 72.99776 } },
    ];
    const searchedFacilities = publishedFacilities.filter(facility => facility.name.toLowerCase().includes("vashi"));

    expect(sortNearestFirst(searchedFacilities, origin).map(facility => facility.id)).toEqual(["vashi-sector-17", "vashi-station"]);
  });

  it("formats the same calculated distance in user-selected kilometers or miles", () => {
    expect(formatDistance(1.609344, "km")).toBe("1.6 km away");
    expect(formatDistance(1.609344, "mi")).toBe("1.0 mi away");
    expect(formatDistance(0.05, "mi")).toBe("164 ft away");
  });

  it("limits map pins to the nearest already-filtered facilities", () => {
    const origin = { lat: 19.071668, lng: 72.99776 };
    const filteredFacilities = [
      { id: "far", coordinates: { lat: 19.25, lng: 73.2 } },
      { id: "near", coordinates: { lat: 19.071668, lng: 72.99776 } },
      { id: "middle", coordinates: { lat: 19.081, lng: 72.998 } },
    ];

    expect(nearestFilteredFacilities(filteredFacilities, origin, 2).map(facility => facility.id)).toEqual(["near", "middle"]);
  });

  it("retries unavailable or timed-out high-accuracy location requests but never retries an explicit denial", () => {
    expect(shouldRetryLocation(2, 1)).toBe(true);
    expect(shouldRetryLocation(3, 1)).toBe(true);
    expect(shouldRetryLocation(1, 1)).toBe(false);
  });

  it("provides distinct, actionable recovery instructions for a denial and an unavailable signal", () => {
    expect(broaderSignalMessage).toBe("Trying your device’s available location signal…");
    expect(locationRecoverySteps(true)[0]).toContain("site settings");
    expect(locationRecoverySteps(false)).toContain("Make sure location services are turned on for your device.");
  });
});
