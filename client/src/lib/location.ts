export type Coordinate = { lat: number; lng: number };
export type DistanceUnit = "km" | "mi";

export const deniedLocationMessage = "Location access was denied. Please allow location access or search for an area manually.";
export const unavailableLocationMessage = "We couldn't determine your location. Please try again or search for an area manually.";
export const broaderSignalMessage = "Trying your device’s available location signal…";
export const locationRecoveryTitle = "Turn on location access to refresh nearby toilets";
export const preLocationSortMessage = "Enable location to sort toilets by distance.";
export const distanceSortAppliedMessage = "Toilets are sorted from nearest to farthest.";

export function locationErrorMessage(errorCode: number, permissionDeniedCode = 1) {
  return errorCode === permissionDeniedCode ? deniedLocationMessage : unavailableLocationMessage;
}

export function shouldRetryLocation(errorCode: number, permissionDeniedCode = 1) {
  return errorCode !== permissionDeniedCode;
}

export function locationRecoverySteps(permissionDenied: boolean) {
  return permissionDenied
    ? ["Open your browser’s site settings for CleanRoute and allow Location.", "Make sure location services are turned on for your device.", "Return here and select Refresh location."]
    : ["Make sure location services are turned on for your device.", "Allow location access when your browser asks.", "Move to an area with a stronger signal, then select Refresh location."];
}

export function distanceSortMessage(hasLocation: boolean) {
  return hasLocation ? distanceSortAppliedMessage : preLocationSortMessage;
}

export function formatDistance(kilometers: number, unit: DistanceUnit) {
  if (unit === "km") return kilometers < 1 ? `${Math.round(kilometers * 1000)} m away` : `${kilometers.toFixed(1)} km away`;

  const miles = kilometers * 0.621371;
  return miles < 0.1 ? `${Math.round(miles * 5280)} ft away` : `${miles.toFixed(1)} mi away`;
}

export function distanceKm(from: Coordinate, to: Coordinate) {
  const radians = (value: number) => value * (Math.PI / 180);
  const earthRadiusKm = 6371;
  const deltaLatitude = radians(to.lat - from.lat);
  const deltaLongitude = radians(to.lng - from.lng);
  const originLatitude = radians(from.lat);
  const destinationLatitude = radians(to.lat);
  const haversine = Math.sin(deltaLatitude / 2) ** 2 + Math.cos(originLatitude) * Math.cos(destinationLatitude) * Math.sin(deltaLongitude / 2) ** 2;
  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)));
}

export function sortNearestFirst<T extends { coordinates: Coordinate }>(facilities: T[], location: Coordinate) {
  return [...facilities].sort((first, second) => distanceKm(location, first.coordinates) - distanceKm(location, second.coordinates));
}

export function nearestFilteredFacilities<T extends { coordinates: Coordinate }>(facilities: T[], location: Coordinate, maximumPins = 12) {
  return sortNearestFirst(facilities, location).slice(0, maximumPins);
}
