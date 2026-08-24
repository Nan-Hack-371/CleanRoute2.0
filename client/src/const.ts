/**
 * Transit Field Notes design system: evidence-first civic information, asymmetric wayfinding,
 * mineral green #176B5A, paper surfaces, Fraunces display, and DM Sans UI type.
 * Maharashtra dataset: public-listing information is distinct from unverified field conditions.
 */
export type Area = "Khopoli" | "Rasayani" | "Panvel" | "Navi Mumbai";
export type FacilityContext = "Railway" | "Transit" | "Market" | "Town" | "Community";
export type VerificationStatus = "Location sourced from public listing" | "Needs field check" | "Demo location — needs field verification" | "Community reported" | "Verified";
export type EvidenceStatus = "Not rated" | "Needs field check" | "Not verified" | "Public listing" | "Available" | "Not available" | "Intermittent" | "Unknown" | "Good" | "Average" | "Poor" | "Yes" | "No" | "Wheelchair accessible" | "Partially accessible" | "Not accessible";

export type ToiletFacility = {
  id: string;
  name: string;
  area: Area;
  district: "Raigad" | "Navi Mumbai";
  context: FacilityContext;
  coordinates: { lat: number; lng: number };
  locationPrecision: "Listing coordinate" | "Approximate area location";
  hours: string;
  publicListingRating: number | null;
  reviewCount: number;
  verificationStatus: VerificationStatus;
  hygieneRating: number | null;
  waterStatus: EvidenceStatus;
  safetyStatus: EvidenceStatus;
  lightingStatus: EvidenceStatus;
  womenFriendly: EvidenceStatus;
  wheelchairAccess: EvidenceStatus;
  operatingStatus: "Hours listed" | "Status not listed" | "Platform metadata: functional" | "Open" | "Closed" | "Temporarily closed" | "Unknown";
  sourceKey: string;
  sourceUrl: string | null;
  lastChecked: string;
  finding: string;
  tags: string[];
  evidencePhotoUrl?: string | null;
  publicationStatus?: "published" | "unpublished";
};

const accessed = "19 Aug 2026";

const listing = (facility: Omit<ToiletFacility, "hygieneRating" | "waterStatus" | "safetyStatus" | "lightingStatus" | "womenFriendly" | "wheelchairAccess" | "lastChecked">): ToiletFacility => ({
  ...facility,
  hygieneRating: null,
  waterStatus: "Needs field check",
  safetyStatus: "Needs field check",
  lightingStatus: "Needs field check",
  womenFriendly: "Not verified",
  wheelchairAccess: "Not verified",
  lastChecked: `Source accessed ${accessed}`,
});

const demo = (facility: Omit<ToiletFacility, "verificationStatus" | "locationPrecision" | "hygieneRating" | "waterStatus" | "safetyStatus" | "lightingStatus" | "womenFriendly" | "wheelchairAccess" | "lastChecked" | "publicListingRating" | "reviewCount" | "sourceKey" | "sourceUrl">): ToiletFacility => listing({
  ...facility,
  verificationStatus: "Demo location — needs field verification",
  locationPrecision: "Approximate area location",
  publicListingRating: null,
  reviewCount: 0,
  sourceKey: "D1",
  sourceUrl: null,
});

export const facilities: ToiletFacility[] = [
  // Khopoli — one public listing and four deliberately labelled area-level fieldwork targets.
  listing({ id: "khopoli-mohana", name: "SBM Toilet", area: "Khopoli", district: "Raigad", context: "Town", coordinates: { lat: 18.789886, lng: 73.3488891 }, locationPrecision: "Listing coordinate", hours: "Open 24 hours listed", publicListingRating: 5, reviewCount: 1, verificationStatus: "Location sourced from public listing", operatingStatus: "Hours listed", sourceKey: "G1", sourceUrl: "https://www.google.com/maps/place/SBM+Toilet/data=!4m7!3m6!1s0x3be8074221b179f9:0x2b12d2673fee705!8m2!3d18.789886!4d73.3488891!16s%2Fg%2F11fj_p6jnj!19sChIJ-XmxIUIH6DsRBef-cyYtsQI?authuser=0&hl=en&rclk=1", finding: "Public map listing on Mohana Roky Road. Its one-rating map score is not a hygiene or access result.", tags: ["khopoli", "town", "late"] }),
  demo({ id: "khopoli-rail", name: "Khopoli Railway Station area toilet", area: "Khopoli", district: "Raigad", context: "Railway", coordinates: { lat: 18.7879, lng: 73.3378 }, hours: "Hours to be checked", operatingStatus: "Status not listed", finding: "Approximate station-area marker created for planned fieldwork; confirm the exact facility and operating status on arrival.", tags: ["khopoli", "railway", "transit"] }),
  demo({ id: "khopoli-bus", name: "Khopoli bus / transit area toilet", area: "Khopoli", district: "Raigad", context: "Transit", coordinates: { lat: 18.7906, lng: 73.3415 }, hours: "Hours to be checked", operatingStatus: "Status not listed", finding: "Approximate transit-area fieldwork target, not an individually sourced public-toilet listing.", tags: ["khopoli", "transit"] }),
  demo({ id: "khopoli-market", name: "Khopoli market area toilet", area: "Khopoli", district: "Raigad", context: "Market", coordinates: { lat: 18.7871, lng: 73.3456 }, hours: "Hours to be checked", operatingStatus: "Status not listed", finding: "Approximate market-area fieldwork target. Verify exact location and conditions before recommending it.", tags: ["khopoli", "market"] }),
  demo({ id: "khopoli-yashwant", name: "Yashwant Nagar public-area toilet", area: "Khopoli", district: "Raigad", context: "Community", coordinates: { lat: 18.7847, lng: 73.3512 }, hours: "Hours to be checked", operatingStatus: "Status not listed", finding: "Approximate public-area marker for a future field check; no condition information is asserted.", tags: ["khopoli", "community"] }),

  // Rasayani — one mapped listing and four transparent area-level fieldwork targets.
  listing({ id: "rasayani-dand-apta", name: "Public Toilet", area: "Rasayani", district: "Raigad", context: "Town", coordinates: { lat: 18.8921238, lng: 73.1643463 }, locationPrecision: "Listing coordinate", hours: "Hours not listed", publicListingRating: null, reviewCount: 0, verificationStatus: "Location sourced from public listing", operatingStatus: "Status not listed", sourceKey: "G2", sourceUrl: "https://www.google.com/maps/place/Public+Toilet/data=!4m7!3m6!1s0x3be7e7007516d4f1:0x58ff9b557dd18fdf!8m2!3d18.8921238!4d73.1643463!16s%2Fg%2F11ys91hvhx!19sChIJ8dQWdQDn5zsR34_RfVWb_1g?authuser=0&hl=en&rclk=1", finding: "Mapped on Dand Apta Road without visible public reviews or listed hours.", tags: ["rasayani", "town"] }),
  demo({ id: "rasayani-rail", name: "Rasayani station area toilet", area: "Rasayani", district: "Raigad", context: "Railway", coordinates: { lat: 18.8991, lng: 73.1554 }, hours: "Hours to be checked", operatingStatus: "Status not listed", finding: "Approximate station-area target for research visits; confirm the facility itself before use.", tags: ["rasayani", "railway", "transit"] }),
  demo({ id: "rasayani-market", name: "Rasayani market area toilet", area: "Rasayani", district: "Raigad", context: "Market", coordinates: { lat: 18.8942, lng: 73.1611 }, hours: "Hours to be checked", operatingStatus: "Status not listed", finding: "Approximate market-area target included only to plan field verification.", tags: ["rasayani", "market"] }),
  demo({ id: "rasayani-corner", name: "Rasayani Corner Toilet area", area: "Rasayani", district: "Raigad", context: "Town", coordinates: { lat: 18.8909, lng: 73.1687 }, hours: "Hours to be checked", operatingStatus: "Status not listed", finding: "Approximate area marker for the publicly named Rasayani Corner Toilet; verify its exact pin and amenities in the field.", tags: ["rasayani", "town"] }),
  demo({ id: "rasayani-aptaroad", name: "Apta Road public-area toilet", area: "Rasayani", district: "Raigad", context: "Community", coordinates: { lat: 18.8877, lng: 73.1662 }, hours: "Hours to be checked", operatingStatus: "Status not listed", finding: "Approximate Apta Road fieldwork target, not an asserted facility condition record.", tags: ["rasayani", "community"] }),

  // Panvel — directly captured from a public map result list.
  listing({ id: "panvel-sector1", name: "Public toilet · Sector 1 Road", area: "Panvel", district: "Raigad", context: "Town", coordinates: { lat: 19.0007899, lng: 73.1174471 }, locationPrecision: "Listing coordinate", hours: "Open 24 hours listed", publicListingRating: 5, reviewCount: 2, verificationStatus: "Location sourced from public listing", operatingStatus: "Hours listed", sourceKey: "G3", sourceUrl: "https://www.google.com/maps/place/Public+toilet/data=!4m7!3m6!1s0x3be7e9615b45ed8d:0x9119a2ee4321a765!8m2!3d19.0007899!4d73.1174471!16s%2Fg%2F11l2x457d1", finding: "Sector 1 Road public listing. The two public ratings are general map feedback only.", tags: ["panvel", "town", "late"] }),
  listing({ id: "panvel-mnc", name: "Public Toilet Panvel MNC", area: "Panvel", district: "Raigad", context: "Community", coordinates: { lat: 19.0160659, lng: 73.093069 }, locationPrecision: "Listing coordinate", hours: "Hours not listed", publicListingRating: 4, reviewCount: 1, verificationStatus: "Location sourced from public listing", operatingStatus: "Status not listed", sourceKey: "G3", sourceUrl: "https://www.google.com/maps/search/?api=1&query=Public+Toilet+Panvel+MNC", finding: "Public map listing in Panvel; current water, hygiene, and accessibility remain unverified.", tags: ["panvel", "community"] }),
  listing({ id: "panvel-st-depot", name: "MSRTC public toilet", area: "Panvel", district: "Raigad", context: "Transit", coordinates: { lat: 18.9903883, lng: 73.1161302 }, locationPrecision: "Listing coordinate", hours: "Open 24 hours listed", publicListingRating: 1, reviewCount: 1, verificationStatus: "Location sourced from public listing", operatingStatus: "Hours listed", sourceKey: "G3", sourceUrl: "https://www.google.com/maps/search/?api=1&query=MSRTC+public+toilet+Panvel", finding: "Behind the S.T. depot according to the public listing. Its one low map rating is not treated as a field finding.", tags: ["panvel", "transit", "late"] }),
  listing({ id: "panvel-restroom", name: "Public Restroom / Toilet", area: "Panvel", district: "Raigad", context: "Town", coordinates: { lat: 19.020527, lng: 73.103363 }, locationPrecision: "Listing coordinate", hours: "Open 24 hours listed", publicListingRating: 3.8, reviewCount: 25, verificationStatus: "Location sourced from public listing", operatingStatus: "Hours listed", sourceKey: "G3", sourceUrl: "https://www.google.com/maps/search/?api=1&query=Public+Restroom+Toilet+Panvel", finding: "24-hour public listing. Map reviews do not confirm current hygiene, water, or safety.", tags: ["panvel", "town", "late"] }),
  listing({ id: "panvel-neel", name: "Public toilet · Neel Plaza", area: "Panvel", district: "Raigad", context: "Market", coordinates: { lat: 19.0013865, lng: 73.1212606 }, locationPrecision: "Listing coordinate", hours: "Hours not listed", publicListingRating: 3.3, reviewCount: 3, verificationStatus: "Location sourced from public listing", operatingStatus: "Status not listed", sourceKey: "G3", sourceUrl: "https://www.google.com/maps/search/?api=1&query=Public+toilet+Neel+Plaza+Panvel", finding: "A named commercial-area listing; its limited map feedback is not a condition score.", tags: ["panvel", "market"] }),
  listing({ id: "panvel-sector34", name: "Public toilet · Sector 34 Seaface", area: "Panvel", district: "Raigad", context: "Community", coordinates: { lat: 19.0175221, lng: 73.0865153 }, locationPrecision: "Listing coordinate", hours: "Hours not listed", publicListingRating: 2, reviewCount: 2, verificationStatus: "Location sourced from public listing", operatingStatus: "Status not listed", sourceKey: "G3", sourceUrl: "https://www.google.com/maps/search/?api=1&query=Public+toilet+Sector+34+Seaface+Panvel", finding: "Sector 34 listing with limited general map feedback; field verification is required.", tags: ["panvel", "community"] }),
  listing({ id: "panvel-payuse", name: "Panvel toilet pay and use", area: "Panvel", district: "Raigad", context: "Transit", coordinates: { lat: 18.9849972, lng: 73.1102951 }, locationPrecision: "Listing coordinate", hours: "Hours not listed", publicListingRating: null, reviewCount: 0, verificationStatus: "Location sourced from public listing", operatingStatus: "Status not listed", sourceKey: "G3", sourceUrl: "https://www.google.com/maps/search/?api=1&query=Panvel+toilet+pay+and+use", finding: "Publicly listed pay-and-use facility with no visible map reviews at the time accessed.", tags: ["panvel", "transit"] }),
  listing({ id: "panvel-shop20", name: "Public toilet · Sai Arcade", area: "Panvel", district: "Raigad", context: "Market", coordinates: { lat: 18.9910813, lng: 73.124199 }, locationPrecision: "Listing coordinate", hours: "Hours not listed", publicListingRating: null, reviewCount: 0, verificationStatus: "Location sourced from public listing", operatingStatus: "Status not listed", sourceKey: "G3", sourceUrl: "https://www.google.com/maps/search/?api=1&query=Public+toilet+Sai+Arcade+Panvel", finding: "Shop No. 04 / Sai Arcade public listing with no visible map feedback.", tags: ["panvel", "market"] }),

  // Navi Mumbai — direct Mappls and Google listing coordinates plus two stated demo targets.
  listing({ id: "vashi-station", name: "SBM Toilet · Vashi Station", area: "Navi Mumbai", district: "Navi Mumbai", context: "Railway", coordinates: { lat: 19.063525, lng: 72.9975217 }, locationPrecision: "Listing coordinate", hours: "Open 24 hours listed", publicListingRating: null, reviewCount: 0, verificationStatus: "Location sourced from public listing", operatingStatus: "Hours listed", sourceKey: "G4", sourceUrl: "https://www.google.com/maps/place/SBM+Toilet/data=!4m7!3m6!1s0x3be7c14dbe523a17:0xf24cbe06a13279cf!8m2!3d19.063525!4d72.9975217!16s%2Fg%2F11f3n5rcjc", finding: "Opposite Vashi Railway Station according to a public map listing; no public reviews were shown.", tags: ["navi mumbai", "vashi", "railway", "late"] }),
  listing({ id: "vashi-sector17", name: "Public Toilet · Vashi Sector 17", area: "Navi Mumbai", district: "Navi Mumbai", context: "Community", coordinates: { lat: 19.071668, lng: 72.99776 }, locationPrecision: "Listing coordinate", hours: "Open 00:00–24:00 listed", publicListingRating: null, reviewCount: 0, verificationStatus: "Location sourced from public listing", operatingStatus: "Hours listed", sourceKey: "M2", sourceUrl: "https://www.mappls.com/place-public+toilet-sector+17-vashi-navi+mumbai-maharashtra-400703-DCV3IQ@zdata=MTkuMDcxNjY4KzcyLjk5Nzc2KzE3K0RDVjNJUSsrbnI=ed", finding: "Mappls public-convenience listing in Sector 17; detailed water, hygiene and access conditions are not observed by this project.", tags: ["navi mumbai", "vashi", "late"] }),
  listing({ id: "kharghar-belpedu", name: "Public Toilet · Kharghar", area: "Navi Mumbai", district: "Navi Mumbai", context: "Community", coordinates: { lat: 19.028495, lng: 73.059085 }, locationPrecision: "Listing coordinate", hours: "Hours not listed", publicListingRating: null, reviewCount: 0, verificationStatus: "Location sourced from public listing", operatingStatus: "Platform metadata: functional", sourceKey: "M3", sourceUrl: "https://www.mappls.com/place-public+toilet+kharghar-belpedu+gaon-sector+3-kharghar-navi+mumbai-maharashtra-410210-H19HZR@zdata=MTkuMDI4NDk1KzczLjA1OTA4NSsxNytIMTlIWlIrK25yed", finding: "Mappls metadata says ULB-maintained, 16 seats, functional and no listed charge. Treat this as platform metadata—not field verification.", tags: ["navi mumbai", "kharghar"] }),
  listing({ id: "nerul-karve", name: "Public Toilet · Karve Village", area: "Navi Mumbai", district: "Navi Mumbai", context: "Community", coordinates: { lat: 19.02089, lng: 73.011311 }, locationPrecision: "Listing coordinate", hours: "Hours not listed", publicListingRating: null, reviewCount: 0, verificationStatus: "Location sourced from public listing", operatingStatus: "Platform metadata: functional", sourceKey: "M4", sourceUrl: "https://www.mappls.com/place-public+toilet-karve+village-nerul+west-navi+mumbai-maharashtra-400706-cuk7yo@zdata=MTkuMDIwODkrNzMuMDExMzExKzE3K2N1azd5bysred", finding: "Mappls metadata describes a 16-seat community toilet maintained by a ULB. Current user conditions still need field observation.", tags: ["navi mumbai", "nerul"] }),
  listing({ id: "belapur-diwale", name: "Public Toilet · Diwale Village", area: "Navi Mumbai", district: "Navi Mumbai", context: "Community", coordinates: { lat: 19.009148, lng: 73.040026 }, locationPrecision: "Listing coordinate", hours: "Hours not listed", publicListingRating: null, reviewCount: 0, verificationStatus: "Location sourced from public listing", operatingStatus: "Status not listed", sourceKey: "M5", sourceUrl: "https://www.mappls.com/place-public+toilet-sukir+mnaya+koli+marg-diwale+village-cbd+belapur-navi+mumbai-maharashtra-400614-6LJQNK@zdata=MTkuMDA5MTQ4KzczLjA0MDAyNisxNys2TEpRTksrK25yed", finding: "Mappls public-convenience listing in Diwale Village, CBD Belapur.", tags: ["navi mumbai", "belapur"] }),
  listing({ id: "airoli-divanagar", name: "Public Toilet · Divanagar", area: "Navi Mumbai", district: "Navi Mumbai", context: "Community", coordinates: { lat: 19.147657, lng: 72.989938 }, locationPrecision: "Listing coordinate", hours: "Hours not listed", publicListingRating: null, reviewCount: 0, verificationStatus: "Location sourced from public listing", operatingStatus: "Platform metadata: functional", sourceKey: "M6", sourceUrl: "https://www.mappls.com/place-public+toilet-divanagar-airoli-navi+mumbai-maharashtra-400708-9BCMC8@zdata=MTkuMTQ3NjU3KzcyLjk4OTkzOCsxNys5QkNNQzgrK25yed", finding: "Mappls metadata describes a 21-seat ULB-maintained community toilet with a listed ₹2 charge; conditions need on-site confirmation.", tags: ["navi mumbai", "airoli"] }),
  demo({ id: "koparkhairane-demo", name: "Kopar Khairane public-area toilet", area: "Navi Mumbai", district: "Navi Mumbai", context: "Town", coordinates: { lat: 19.1037, lng: 73.0068 }, hours: "Hours to be checked", operatingStatus: "Status not listed", finding: "Approximate locality-level marker for a future field visit, not a verified individual facility.", tags: ["navi mumbai", "kopar khairane"] }),
  demo({ id: "sanpada-demo", name: "Sanpada station-area toilet", area: "Navi Mumbai", district: "Navi Mumbai", context: "Railway", coordinates: { lat: 19.0603, lng: 73.0109 }, hours: "Hours to be checked", operatingStatus: "Status not listed", finding: "Approximate station-area fieldwork target; confirm precise facility location before use or reporting.", tags: ["navi mumbai", "sanpada", "railway"] }),
];

export const projectScope = {
  label: "Maharashtra fieldwork study",
  locations: ["Khopoli", "Rasayani", "Panvel", "Navi Mumbai"],
  methodology: "Desk research → field verification → community feedback",
};

export const getProjectMetrics = (items: ToiletFacility[]) => ({
  total: items.length,
  publicListings: items.filter(item => item.verificationStatus === "Location sourced from public listing").length,
  fieldCheck: items.filter(item => item.verificationStatus !== "Location sourced from public listing").length,
  notRated: items.filter(item => item.hygieneRating === null).length,
});

export const sources = [
  { key: "M1", title: "NMMC public toilet network mapped for access", publisher: "Hindustan Times, January 2024", url: "https://www.hindustantimes.com/cities/mumbai-news/civic-body-constructs-406-public-toilets-in-navi-mumbai-101704913491872.html" },
  { key: "M2", title: "Public Toilet, Sector 17, Vashi", publisher: "Mappls public listing, accessed 19 Aug 2026", url: "https://www.mappls.com/place-public+toilet-sector+17-vashi-navi+mumbai-maharashtra-400703-DCV3IQ@zdata=MTkuMDcxNjY4KzcyLjk5Nzc2KzE3K0RDVjNJUSsrbnI=ed" },
  { key: "M3", title: "Public Toilet, Belpedu Gaon, Kharghar", publisher: "Mappls public listing, accessed 19 Aug 2026", url: "https://www.mappls.com/place-public+toilet+kharghar-belpedu+gaon-sector+3-kharghar-navi+mumbai-maharashtra-410210-H19HZR@zdata=MTkuMDI4NDk1KzczLjA1OTA4NSsxNytIMTlIWlIrK25yed" },
  { key: "M4", title: "Public Toilet, Karve Village, Nerul West", publisher: "Mappls public listing, accessed 19 Aug 2026", url: "https://www.mappls.com/place-public+toilet-karve+village-nerul+west-navi+mumbai-maharashtra-400706-cuk7yo@zdata=MTkuMDIwODkrNzMuMDExMzExKzE3K2N1azd5bysred" },
  { key: "M5", title: "Public Toilet, Diwale Village, CBD Belapur", publisher: "Mappls public listing, accessed 19 Aug 2026", url: "https://www.mappls.com/place-public+toilet-sukir+mnaya+koli+marg-diwale+village-cbd+belapur-navi+mumbai-maharashtra-400614-6LJQNK@zdata=MTkuMDA5MTQ4KzczLjA0MDAyNisxNys2TEpRTksrK25yed" },
  { key: "M6", title: "Public Toilet, Divanagar, Airoli", publisher: "Mappls public listing, accessed 19 Aug 2026", url: "https://www.mappls.com/place-public+toilet-divanagar-airoli-navi+mumbai-maharashtra-400708-9BCMC8@zdata=MTkuMTQ3NjU3KzcyLjk4OTkzOCsxNys5QkNNQzgrK25yed" },
  { key: "G1", title: "Public toilets in Khopoli", publisher: "Google Maps results, accessed 19 Aug 2026", url: "https://www.google.com/maps/search/?api=1&query=public+toilet+Khopoli+Maharashtra" },
  { key: "G2", title: "Public toilets in Rasayani", publisher: "Google Maps results, accessed 19 Aug 2026", url: "https://www.google.com/maps/search/?api=1&query=public+toilet+Rasayani+Maharashtra" },
  { key: "G3", title: "Public toilets in Panvel", publisher: "Google Maps results, accessed 19 Aug 2026", url: "https://www.google.com/maps/search/?api=1&query=public+toilet+Panvel+Maharashtra" },
  { key: "G4", title: "Public toilets near Vashi Station", publisher: "Google Maps results, accessed 19 Aug 2026", url: "https://www.google.com/maps/search/?api=1&query=public+toilet+Vashi+Station+Navi+Mumbai" },
  { key: "D1", title: "Source to be added: area-level fieldwork target", publisher: "Clearly labelled demo location; no individual facility claim", url: null },
];

const CLIENT_ENV = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
const APP_ID = CLIENT_ENV.VITE_APP_ID ?? "";
const OAUTH_PORTAL_URL = CLIENT_ENV.VITE_OAUTH_PORTAL_URL ?? "";

/** Starts the platform OAuth flow only in response to a user action or an auth-error redirect. */
export const startLogin = () => {
  if (typeof window === "undefined" || !APP_ID || !OAUTH_PORTAL_URL) return;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const nonce = crypto.randomUUID();
  document.cookie = `__Host-oauth_state=${nonce}; Path=/; Max-Age=600; SameSite=None; Secure`;
  const state = btoa(JSON.stringify({ redirectUri, nonce }));
  const params = new URLSearchParams({ app_id: APP_ID, redirect_url: redirectUri, state });
  window.location.assign(`${OAUTH_PORTAL_URL}/login?${params.toString()}`);
};
