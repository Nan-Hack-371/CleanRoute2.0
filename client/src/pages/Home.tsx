/**
 * Transit Field Notes page: evidence-first Maharashtra civic wayfinding with mineral-green route cues,
 * paper surfaces, asymmetrical field-board layout, Fraunces display, and DM Sans UI type.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Accessibility,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Droplets,
  ExternalLink,
  LocateFixed,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Store,
  TrainFront,
  TriangleAlert,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FacilityAdminActions } from "@/components/FacilityAdminActions";
import { MapView } from "@/components/Map";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { facilities as fallbackFacilities, getProjectMetrics, projectScope, sources, type Area, type FacilityContext, type ToiletFacility } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { buildLoginPath, type AuthIntent } from "@/lib/authNavigation";
import { broaderSignalMessage, distanceKm, distanceSortMessage, formatDistance, locationErrorMessage, locationRecoverySteps, locationRecoveryTitle, nearestFilteredFacilities, shouldRetryLocation, sortNearestFirst, unavailableLocationMessage, type DistanceUnit } from "@/lib/location";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { isAdministrator } from "@shared/const";
import { toast } from "sonner";

const logoUrl = "/manus-storage/cleanroute-route-pin_eb83fa51.png";
const heroUrl = "/manus-storage/cleanroute-bengaluru-hero_c4309c24.jpg";
const fieldCheckUrl = "/manus-storage/cleanroute-field-check_c5f5733b.jpg";

type CategoryFilter = "all" | FacilityContext | "late" | "women" | "access";

const areaFilters: { key: "all" | Area; label: string }[] = [
  { key: "all", label: "All Maharashtra" },
  { key: "Khopoli", label: "Khopoli" },
  { key: "Rasayani", label: "Rasayani" },
  { key: "Panvel", label: "Panvel" },
  { key: "Navi Mumbai", label: "Navi Mumbai" },
];

const categoryFilters: { key: CategoryFilter; label: string; icon?: typeof TrainFront }[] = [
  { key: "all", label: "All types" },
  { key: "Railway", label: "Railway stations", icon: TrainFront },
  { key: "Transit", label: "Transit hubs", icon: TrainFront },
  { key: "Market", label: "Markets", icon: Store },
  { key: "Town", label: "Town centres" },
  { key: "late", label: "Open late" },
  { key: "women", label: "Women-friendly" },
  { key: "access", label: "Wheelchair accessible", icon: Accessibility },
];

const statusClass = (status: string) => {
  if (status.includes("Demo") || status.includes("Needs")) return "status-stamp-gap";
  if (status.includes("Community")) return "status-stamp-orientation";
  return "status-stamp-verified";
};

function StatusStamp({ icon: Icon, label, tone = "verified" }: { icon: typeof Droplets; label: string; tone?: "verified" | "gap" | "orientation" }) {
  return <span className={cn("status-stamp", `status-stamp-${tone}`)}><Icon aria-hidden="true" size={14} strokeWidth={2.2} />{label}</span>;
}

const readEvidenceImage = (file: File) => new Promise<{ dataUrl: string; fileName: string }>((resolve, reject) => {
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return reject(new Error("Choose a PNG, JPEG, or WebP image."));
  if (file.size > 5 * 1024 * 1024) return reject(new Error("Evidence photos must be smaller than 5 MB."));
  const reader = new FileReader();
  reader.onerror = () => reject(new Error("The image could not be read."));
  reader.onload = () => resolve({ dataUrl: String(reader.result), fileName: file.name });
  reader.readAsDataURL(file);
});

function SurveyStars({ value, onRate, label }: { value: number; onRate: (value: number) => void; label: string }) {
  return <div className="flex items-center gap-1" aria-label={`${label}: choose a rating from one to five`}>
    {[1, 2, 3, 4, 5].map(star => <button key={star} onClick={() => onRate(star)} className="rating-star" aria-label={`Rate ${label} ${star} out of 5`} type="button"><Star size={18} fill={star <= value ? "currentColor" : "none"} /></button>)}
  </div>;
}

function EvidenceRow({ icon: Icon, label, value }: { icon: typeof Droplets; label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
    <span className="flex items-center gap-2 text-[#40514C]"><Icon size={16} className="text-[#176B5A]" aria-hidden="true" />{label}</span>
    <span className={cn("inline-flex items-center gap-1 text-right font-semibold", value === "Needs field check" || value === "Not verified" || value === "Not rated" ? "text-[#A05B2D]" : "text-[#176B5A]")}><span className={cn("h-1.5 w-1.5 rounded-full", value === "Needs field check" || value === "Not verified" || value === "Not rated" ? "bg-[#C86134]" : "bg-[#176B5A]")} />{value}</span>
  </div>;
}

export default function Home() {
  // Public discovery is available to everyone; contribution actions use the local account flow.
  const { user, isAuthenticated, logout } = useAuth();
  const administrator = isAdministrator(user);
  const utils = trpc.useUtils();
  const facilitiesQuery = trpc.facilities.list.useQuery(undefined, { refetchOnWindowFocus: false });
  const fieldCheckMutation = trpc.facilities.submitFieldCheck.useMutation();
  const issueReportMutation = trpc.facilities.submitIssueReport.useMutation();
  const reviewMutation = trpc.reviews.submit.useMutation();
  const liveFacilities = (facilitiesQuery.data ?? fallbackFacilities) as ToiletFacility[];

  const [activeArea, setActiveArea] = useState<"all" | Area>("all");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("khopoli-mohana");
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [distanceSortEnabled, setDistanceSortEnabled] = useState(false);
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>("km");
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [locationRecoveryNeeded, setLocationRecoveryNeeded] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [surveySaved, setSurveySaved] = useState(false);
  const [fieldCheckApplied, setFieldCheckApplied] = useState(false);
  const [issueSaved, setIssueSaved] = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [survey, setSurvey] = useState({ researcher: "", cleanliness: 0, water: "Unknown", safety: "Unknown", lighting: "Unknown", access: "Unknown", women: "Needs verification", operating: "Unknown", notes: "", evidenceDataUrl: "", evidenceFileName: "" });
  const [issue, setIssue] = useState({ type: "Incorrect facility information", note: "", evidenceDataUrl: "", evidenceFileName: "" });
  const [review, setReview] = useState({ rating: 0, body: "" });
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const boundsSignatureRef = useRef("");
  const [mapReady, setMapReady] = useState(false);

  const filteredFacilities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return liveFacilities.filter(facility => {
      const matchesArea = activeArea === "all" || facility.area === activeArea;
      const matchesCategory = activeCategory === "all"
        || (activeCategory === "late" ? facility.hours.toLowerCase().includes("24") : activeCategory === "women" ? facility.womenFriendly === "Yes" : activeCategory === "access" ? facility.wheelchairAccess === "Wheelchair accessible" : facility.context === activeCategory);
      const searchable = `${facility.name} ${facility.area} ${facility.district} ${facility.context} ${facility.tags.join(" ")}`.toLowerCase();
      return matchesArea && matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [activeArea, activeCategory, liveFacilities, query]);

  const visibleFacilities = useMemo(() => userLocation && distanceSortEnabled ? sortNearestFirst(filteredFacilities, userLocation) : [...filteredFacilities].sort((first, second) => first.area.localeCompare(second.area)), [distanceSortEnabled, filteredFacilities, userLocation]);
  const mapFacilities = useMemo(() => userLocation && distanceSortEnabled ? nearestFilteredFacilities(filteredFacilities, userLocation) : visibleFacilities, [distanceSortEnabled, filteredFacilities, userLocation, visibleFacilities]);

  const selectedFacility = liveFacilities.find(facility => facility.id === selectedId) ?? liveFacilities[0] ?? fallbackFacilities[0];
  const publishedReviews = trpc.reviews.listPublished.useQuery({ facilityId: selectedFacility.id });
  const publishedReviewSummary = trpc.reviews.summary.useQuery({ facilityId: selectedFacility.id });
  const metrics = useMemo(() => getProjectMetrics(liveFacilities), [liveFacilities]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const facilityId = params.get("facility");
    const intent = params.get("authIntent");
    if (!facilityId || !liveFacilities.some(facility => facility.id === facilityId)) return;
    setSelectedId(facilityId);
    if (!isAuthenticated || (intent !== "review" && intent !== "report")) return;
    setSubmissionError("");
    if (intent === "review") setReviewOpen(true);
    else setIssueOpen(true);
    params.delete("authIntent");
    const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, "", next);
  }, [isAuthenticated, liveFacilities]);

  const openDirections = (facility: ToiletFacility) => {
    const { lat, lng } = facility.coordinates;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank", "noopener,noreferrer");
  };

  const selectFacility = (facility: ToiletFacility) => {
    setSelectedId(facility.id);
    mapRef.current?.panTo(facility.coordinates);
    mapRef.current?.setZoom(Math.max(mapRef.current.getZoom() ?? 11, 15));
  };

  const syncMap = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    markersRef.current.forEach(marker => marker.setMap(null));
    const facilityMarkers = mapFacilities.map(facility => {
      const isSelected = facility.id === selectedId;
      const isDemo = facility.locationPrecision === "Approximate area location";
      const distanceLabel = userLocation ? ` · ${formatDistance(distanceKm(userLocation, facility.coordinates), distanceUnit)}` : "";
      const marker = new google.maps.Marker({
        map,
        position: facility.coordinates,
        title: `${facility.name}${distanceLabel} · ${facility.verificationStatus}`,
        icon: { path: google.maps.SymbolPath.CIRCLE, fillColor: isSelected ? "#C86134" : isDemo ? "#A77720" : "#176B5A", fillOpacity: 1, strokeColor: "#FFFCF4", strokeWeight: 3, scale: isSelected ? 10 : 7 },
      });
      marker.addListener("click", () => selectFacility(facility));
      return marker;
    });
    const userMarker = userLocation ? new google.maps.Marker({
      map,
      position: userLocation,
      title: "Your current location",
      zIndex: 1000,
      icon: { path: google.maps.SymbolPath.CIRCLE, fillColor: "#3F7890", fillOpacity: 1, strokeColor: "#FFFCF4", strokeWeight: 3, scale: 9 },
    }) : null;
    markersRef.current = userMarker ? [...facilityMarkers, userMarker] : facilityMarkers;
    const nextBoundsSignature = `${mapFacilities.map(facility => facility.id).join("|")}:${userLocation?.lat ?? ""}:${userLocation?.lng ?? ""}:${distanceUnit}`;
    if (mapFacilities.length && boundsSignatureRef.current !== nextBoundsSignature) {
      const bounds = new google.maps.LatLngBounds();
      mapFacilities.forEach(facility => bounds.extend(facility.coordinates));
      if (userLocation) bounds.extend(userLocation);
      map.fitBounds(bounds, 68);
      boundsSignatureRef.current = nextBoundsSignature;
    }
  }, [distanceUnit, mapFacilities, mapReady, selectedId, userLocation]);

  useEffect(() => { syncMap(); }, [syncMap]);

  const onMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  const findNearMe = () => {
    if (isLocating) return;
    if (!navigator.geolocation) {
      setLocationMessage(unavailableLocationMessage);
      setLocationRecoveryNeeded(true);
      setLocationPermissionDenied(false);
      toast.error("Location is unavailable", {
        id: "cleanroute-location",
        description: "Turn on location services and allow this site to use your location, then refresh.",
      });
      return;
    }
    setIsLocating(true);
    setLocationMessage("Finding toilets near you…");
    setLocationRecoveryNeeded(false);
    setLocationPermissionDenied(false);
    toast.loading("Locating…", {
      id: "cleanroute-location",
      description: "Requesting your device location to update nearby toilets.",
    });

    const applyLocation = (position: GeolocationPosition) => {
      const point = { lat: position.coords.latitude, lng: position.coords.longitude };
      setUserLocation(point);
      setDistanceSortEnabled(true);
      setIsLocating(false);
      setLocationMessage("Nearby published toilets are sorted by distance.");
      setLocationRecoveryNeeded(false);
      mapRef.current?.panTo(point);
      const count = visibleFacilities.length;
      toast.success(`Found ${count} toilet${count === 1 ? "" : "s"} near you`, {
        id: "cleanroute-location",
        description: "Published results are now ordered from nearest to farthest.",
      });
    };

    const finishWithError = (error: GeolocationPositionError) => {
      setIsLocating(false);
      const message = locationErrorMessage(error.code, error.PERMISSION_DENIED);
      setLocationMessage(message);
      setLocationPermissionDenied(error.code === error.PERMISSION_DENIED);
      setLocationRecoveryNeeded(true);
      toast.error("Location could not be updated", {
        id: "cleanroute-location",
        description: message,
      });
    };

    const requestLocation = (useHighAccuracy: boolean) => {
      navigator.geolocation.getCurrentPosition(
        applyLocation,
        error => {
          if (useHighAccuracy && shouldRetryLocation(error.code, error.PERMISSION_DENIED)) {
            setLocationMessage(broaderSignalMessage);
            toast.info("Getting an approximate location…", {
              id: "cleanroute-location",
              description: "High-accuracy location is taking longer. We’ll try your device’s available location next.",
            });
            requestLocation(false);
            return;
          }
          finishWithError(error);
        },
        useHighAccuracy
          ? { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 }
          : { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 },
      );
    };

    requestLocation(true);
  };

  const enableDistanceSort = () => {
    if (!userLocation) {
      setLocationMessage(distanceSortMessage(false));
      return;
    }
    setDistanceSortEnabled(true);
    setLocationMessage(distanceSortMessage(true));
  };

  const openAuthenticated = (open: (value: boolean) => void, intent: AuthIntent = open === setReviewOpen ? "review" : "report") => {
    if (!isAuthenticated) {
      const returnTo = `/?facility=${encodeURIComponent(selectedFacility.id)}&authIntent=${intent}`;
      window.location.assign(buildLoginPath({ returnTo, intent }));
      return;
    }
    setSubmissionError("");
    open(true);
  };

  const saveSurvey = async () => {
    if (!isAuthenticated) return;
    setSubmissionError("");
    setSurveySaved(false);
    setFieldCheckApplied(false);
    try {
      const result = await fieldCheckMutation.mutateAsync({
        facilityId: selectedFacility.id,
        researcherName: survey.researcher,
        hygieneRating: survey.cleanliness,
        waterStatus: survey.water as "Available" | "Not available" | "Intermittent" | "Unknown",
        safetyStatus: survey.safety as "Good" | "Average" | "Poor" | "Unknown",
        lightingStatus: survey.lighting as "Good" | "Average" | "Poor" | "Unknown",
        accessibilityStatus: survey.access as "Wheelchair accessible" | "Partially accessible" | "Not accessible" | "Unknown",
        womenFriendly: survey.women as "Yes" | "No" | "Needs verification",
        operatingStatus: survey.operating as "Open" | "Closed" | "Temporarily closed" | "Unknown",
        notes: survey.notes || undefined,
        evidenceDataUrl: survey.evidenceDataUrl || undefined,
        evidenceFileName: survey.evidenceFileName || undefined,
      });
      await utils.facilities.list.invalidate();
      setSelectedId(result.facility?.id ?? selectedFacility.id);
      setFieldCheckApplied(result.applied);
      setSurveySaved(true);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : "Field check could not be saved. Please try again.");
    }
  };

  const saveIssue = async () => {
    if (!isAuthenticated) return openAuthenticated(setIssueOpen, "report");
    setSubmissionError("");
    setIssueSaved(false);
    try {
      await issueReportMutation.mutateAsync({
        facilityId: selectedFacility.id,
        reportType: issue.type as "Wrong location" | "Toilet closed" | "Wrong operating hours" | "Incorrect accessibility information" | "Incorrect facility information" | "Duplicate listing" | "Inappropriate content" | "Other",
        description: issue.note || undefined,
        evidenceDataUrl: issue.evidenceDataUrl || undefined,
        evidenceFileName: issue.evidenceFileName || undefined,
      });
      setIssueSaved(true);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : "Report could not be submitted. Please try again.");
    }
  };

  const saveReview = async () => {
    if (!isAuthenticated) return openAuthenticated(setReviewOpen, "review");
    setSubmissionError("");
    setReviewSaved(false);
    try {
      await reviewMutation.mutateAsync({ facilityId: selectedFacility.id, rating: review.rating, body: review.body || undefined });
      await Promise.all([
        utils.reviews.listPublished.invalidate({ facilityId: selectedFacility.id }),
        utils.reviews.summary.invalidate({ facilityId: selectedFacility.id }),
      ]);
      setReviewSaved(true);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : "Review could not be submitted. Please try again.");
    }
  };

  const openOfficialFieldCheck = () => {
    setSubmissionError("");
    setSurveySaved(false);
    setFieldCheckApplied(false);
    setSurveyOpen(true);
  };

  return <div className="min-h-screen overflow-x-hidden bg-[#F7F4EA] text-[#142A25]">
    <header className="sticky top-0 z-50 border-b border-[#D9D6C8]/80 bg-[#F7F4EA]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between px-5 py-3.5 sm:px-8 lg:px-10">
        <a href="#top" className="brand-lockup flex items-center gap-3" aria-label="CleanRoute home"><img src={logoUrl} alt="" className="h-11 w-11 object-contain" /><span className="brand-wordmark">Clean<span>Route</span></span><i aria-hidden="true" /></a>
        <nav className="hidden items-center gap-5 text-sm font-semibold text-[#40514C] xl:flex" aria-label="Page navigation"><a className="nav-link" href="#locator">Locator</a><a className="nav-link" href="#findings">Trust & updates</a><a className="nav-link" href="#method">How to check</a>{user ? <><a className="nav-link" href="/my-contributions">My contributions</a><span className="max-w-24 truncate border-l border-[#D9D6C8] pl-4 text-xs text-[#53635E]" title={user.name || user.email || "CleanRoute member"}>{user.name || user.email || "Member"}</span><button type="button" onClick={() => { void logout(); }} className="text-xs text-[#176B5A] hover:underline">Sign out</button></> : <a className="nav-link" href="/login">Sign in</a>}{administrator && <><a className="nav-link" href="/admin/field-checks">Field checks</a><a className="nav-link" href="/admin/reports">Moderate reports</a></>}</nav>
        {administrator ? <Button asChild className="rounded-full bg-[#176B5A] px-4 font-semibold text-white shadow-none hover:bg-[#0F5145] sm:px-5"><a href="/admin/field-checks">Add a field check <ChevronRight size={16} /></a></Button> : <div className="flex items-center gap-2">{user ? <details className="relative xl:hidden"><summary className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-full border border-[#176B5A] text-[#176B5A] hover:bg-[#EEF5EF]" aria-label="Open account menu"><UserRound size={16} /></summary><div className="absolute right-0 top-11 z-50 w-44 border border-[#D9D6C8] bg-[#FFFDF7] p-2 shadow-lg"><a href="/my-contributions" className="block rounded px-3 py-2 text-sm font-semibold text-[#176B5A] hover:bg-[#EEF1EB]">My contributions</a><button type="button" onClick={() => { void logout(); }} className="mt-1 w-full rounded px-3 py-2 text-left text-sm font-semibold text-[#176B5A] hover:bg-[#EEF1EB]">Sign out</button></div></details> : null}<Button onClick={() => openAuthenticated(setIssueOpen)} className="rounded-full bg-[#176B5A] px-3 font-semibold text-white shadow-none hover:bg-[#0F5145] sm:px-5">Report an issue <TriangleAlert size={16} /></Button></div>}
      </div>
    </header>

    <main id="top">
      <section className="route-section relative isolate overflow-hidden border-b border-[#D9D6C8]">
        <img src={heroUrl} alt="Abstract civic route map texture" className="absolute inset-0 -z-20 h-full w-full object-cover object-right" />
        <div className="absolute inset-0 -z-10 bg-[#F7F4EA]/80" />
        <div className="mx-auto grid min-h-[580px] max-w-[1480px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.45fr)] lg:px-10 lg:py-24">
          <div className="flex max-w-3xl flex-col justify-end">
            <div className="route-kicker"><span /> Public toilet locator</div>
            <h1 className="mt-6 max-w-3xl font-['Fraunces'] text-5xl font-semibold leading-[0.96] tracking-[-0.055em] text-[#142A25] sm:text-6xl lg:text-[76px]">Find the right public toilet for you.</h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#40514C] sm:text-lg">Find nearby public toilets by distance, hygiene, accessibility, women-friendly facilities and community ratings. Currently exploring selected locations across Maharashtra.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3"><Button onClick={findNearMe} disabled={isLocating} aria-describedby={isLocating ? "location-loading-status" : undefined} className="rounded-full bg-[#176B5A] px-5 text-white hover:bg-[#0F5145]"><span className="flex items-center gap-2">{isLocating ? <Spinner className="size-4 text-white" aria-label="Finding your location" /> : <LocateFixed size={16} />} {isLocating ? "Finding toilets near you…" : "Find toilets near me"}</span></Button><Button asChild variant="outline" className="rounded-full border-[#176B5A] px-5 text-[#176B5A] hover:bg-[#176B5A] hover:text-white"><a href="#locator"><Search size={16} /> Search an area</a></Button></div>
            {isLocating ? <div id="location-loading-status" role="status" aria-live="polite" className="mt-4 flex max-w-md items-center gap-3 border border-[#B7C7BF] bg-[#FFFDF7]/90 px-3.5 py-3 text-sm text-[#40514C]"><Spinner className="size-5 shrink-0 text-[#176B5A]" /><span><strong className="block text-[#142A25]">{locationMessage || "Finding toilets near you…"}</strong>Using your device location to calculate live distances.</span></div> : locationRecoveryNeeded ? <div role="alert" className="mt-4 max-w-xl border border-[#E2C8A6] bg-[#FFF8EA] p-4 text-sm text-[#40514C]"><div className="flex items-start gap-3"><TriangleAlert className="mt-0.5 shrink-0 text-[#A77720]" size={19} aria-hidden="true" /><div><strong className="block text-[#142A25]">{locationRecoveryTitle}</strong><p className="mt-1 leading-6">{locationMessage}</p><ol className="mt-3 list-decimal space-y-1 pl-5 text-xs leading-5">{locationRecoverySteps(locationPermissionDenied).map(step => <li key={step}>{step}</li>)}</ol><Button type="button" onClick={findNearMe} className="mt-4 h-9 rounded-full bg-[#176B5A] px-4 text-xs text-white hover:bg-[#0F5145]"><RefreshCw size={14} /> Refresh location</Button></div></div></div> : locationMessage && <p className="mt-4 text-sm font-semibold text-[#176B5A]">{locationMessage}</p>}
          </div>
          <aside className="self-end border border-[#D9D6C8] bg-[#FFFDF7]/90 p-5 shadow-[10px_10px_0_rgba(20,42,37,0.09)] backdrop-blur-sm sm:p-6">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176B5A]">Built for informed visits</p><p className="mt-2 font-['Fraunces'] text-3xl font-semibold tracking-[-0.04em]">Useful details, clearly labelled.</p></div><CircleHelp className="mt-1 shrink-0 text-[#A77720]" size={24} aria-hidden="true" /></div>
            <div className="mt-5 border-t border-dashed border-[#CFCBBB] pt-5 text-sm leading-6 text-[#40514C]"><p>CleanRoute brings together public listings, verified field checks and community feedback. Each toilet detail card shows what is known and what still needs an update.</p><a className="mt-3 inline-flex items-center gap-1 font-bold text-[#176B5A] hover:underline" href="#method">How updates are verified <ChevronRight size={15} /></a></div>
          </aside>
        </div>
      </section>

      <section id="locator" className="route-section mx-auto max-w-[1480px] scroll-mt-20 px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[278px_minmax(0,1fr)] lg:gap-14">
          <aside className="lg:pt-2"><p className="eyebrow">01 · Maharashtra locator</p><h2 className="mt-4 font-['Fraunces'] text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-[#142A25]">Choose a route, not a promise.</h2><p className="mt-4 text-sm leading-6 text-[#53635E]">Every filter drives the map, result count, cards and evidence record from the same dataset.</p>
            <label className="mt-7 flex items-center gap-2 border border-[#CFCBBB] bg-[#FFFDF7] px-3 py-2.5 text-[#53635E] focus-within:border-[#176B5A]"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search Khopoli, Panvel, Vashi…" className="w-full bg-transparent text-sm outline-none placeholder:text-[#89938D]" aria-label="Search toilet listings" /></label>
            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.15em] text-[#3F7890]">Study area</p><div className="mt-2 flex flex-wrap gap-2 lg:flex-col lg:items-stretch">{areaFilters.map(filter => <button key={filter.key} onClick={() => setActiveArea(filter.key)} className={cn("filter-button", activeArea === filter.key && "filter-button-active")} type="button">{filter.label}</button>)}</div>
            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.15em] text-[#3F7890]">Type & availability</p><div className="mt-2 flex flex-wrap gap-2 lg:flex-col lg:items-stretch">{categoryFilters.map(({ key, label, icon: Icon }) => <button key={key} onClick={() => setActiveCategory(key)} className={cn("filter-button", activeCategory === key && "filter-button-active")} type="button">{Icon && <Icon size={16} aria-hidden="true" />}{label}{key === "women" || key === "access" ? <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.12em]">evidence</span> : null}</button>)}</div>
            <div className="mt-6 flex items-center justify-between gap-3 border border-[#CFCBBB] bg-[#FFFDF7] px-3.5 py-3"><div><p id="distance-unit-label" className="text-xs font-bold text-[#142A25]">Distance unit</p><p className="mt-0.5 text-[11px] text-[#53635E]">Show nearby results in {distanceUnit === "km" ? "kilometers" : "miles"}.</p></div><div className="flex items-center gap-2"><span className={cn("text-xs font-bold", distanceUnit === "km" ? "text-[#176B5A]" : "text-[#89938D]")}>km</span><Switch checked={distanceUnit === "mi"} onCheckedChange={checked => setDistanceUnit(checked ? "mi" : "km")} aria-labelledby="distance-unit-label" /><span className={cn("text-xs font-bold", distanceUnit === "mi" ? "text-[#176B5A]" : "text-[#89938D]")}>mi</span></div></div>
            <Button onClick={enableDistanceSort} variant="outline" className="mt-3 w-full rounded-full border-[#176B5A] text-[#176B5A] hover:bg-[#176B5A] hover:text-white"><LocateFixed size={16} /> Sort by distance</Button>
            <div className="mt-8 hidden border-l-2 border-[#C86134] pl-4 text-xs leading-5 text-[#53635E] lg:block"><strong className="text-[#40514C]">Map ratings are not hygiene ratings.</strong> Green pins are public listings; saffron pins are intentionally labelled area-level fieldwork targets.</div>
          </aside>
          <div>
            <div className="relative overflow-hidden border border-[#B7C7BF] bg-[#DCE5E4] shadow-[8px_8px_0_rgba(20,42,37,0.08)]">
              <div className="absolute left-5 top-5 z-10 max-w-[240px] border border-[#D9D6C8] bg-[#FFFDF7]/95 p-3.5 shadow-sm backdrop-blur-sm sm:left-6 sm:top-6"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#3F7890]">Maharashtra route layer</p><p className="mt-1 text-sm font-bold leading-5">{mapFacilities.length} {userLocation && distanceSortEnabled ? "nearest filtered" : "active"} marker{mapFacilities.length === 1 ? "" : "s"} across Raigad & Navi Mumbai.</p>{userLocation && <p className="mt-2 text-xs font-semibold text-[#176B5A]">Blue pin: your current location</p>}</div>
              <div className="route-map-overlay pointer-events-none absolute inset-0 z-[5]" aria-hidden="true">
                <svg viewBox="0 0 1000 520" preserveAspectRatio="none" className="h-full w-full">
                  <path d="M92 422 C155 352 202 435 280 340 S418 328 486 238 S640 203 705 144 S840 84 936 124" fill="none" stroke="#3F7890" strokeWidth="3" strokeDasharray="11 11" opacity="0.85" />
                  <path d="M92 422 C155 352 202 435 280 340 S418 328 486 238" fill="none" stroke="#176B5A" strokeWidth="5" opacity="0.95" />
                  <circle cx="92" cy="422" r="11" fill="#176B5A" stroke="#FFFDF7" strokeWidth="4" /><circle cx="280" cy="340" r="11" fill="#176B5A" stroke="#FFFDF7" strokeWidth="4" /><circle cx="486" cy="238" r="12" fill="#C86134" stroke="#FFFDF7" strokeWidth="4" /><circle cx="705" cy="144" r="11" fill="#176B5A" stroke="#FFFDF7" strokeWidth="4" /><circle cx="936" cy="124" r="11" fill="#176B5A" stroke="#FFFDF7" strokeWidth="4" />
                </svg>
                <span className="map-coordinate map-coordinate-a">KHOPOLI · 18.79 / 73.35</span><span className="map-coordinate map-coordinate-b">RASAYANI · 18.89 / 73.16</span><span className="map-coordinate map-coordinate-c">PANVEL · 19.00 / 73.12</span><span className="map-coordinate map-coordinate-d">NAVI MUMBAI · 19.06 / 73.00</span><span className="map-coordinate map-coordinate-e">AIROLI · 19.15 / 72.99</span>
              </div>
              <div className="pointer-events-none absolute bottom-4 right-4 z-10 flex items-center gap-3 border border-[#D9D6C8] bg-[#FFFDF7]/95 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#40514C]"><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#176B5A]" /> listing</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#A77720]" /> field target</span></div>
              <MapView initialCenter={{ lat: 19.011, lng: 73.052 }} initialZoom={10} onMapReady={onMapReady} className="h-[410px] sm:h-[520px]" />
            </div>
              <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"><div><div className="mb-4 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">{visibleFacilities.length} active result{visibleFacilities.length === 1 ? "" : "s"}</p><h3 className="mt-2 font-['Fraunces'] text-2xl font-semibold tracking-[-0.04em]">Toilet discovery records</h3></div><div className="flex items-center gap-3"><Button type="button" onClick={findNearMe} disabled={isLocating} variant="outline" className="h-9 rounded-full border-[#176B5A] px-3.5 text-xs text-[#176B5A] hover:bg-[#176B5A] hover:text-white"><RefreshCw className={cn("size-3.5", isLocating && "animate-spin")} /> Refresh location</Button>{(activeArea !== "all" || activeCategory !== "all" || query) && <button className="text-xs font-bold text-[#176B5A] hover:underline" onClick={() => { setActiveArea("all"); setActiveCategory("all"); setQuery(""); }}>Reset locator</button>}</div></div>
              {visibleFacilities.length ? <div className="grid gap-3 sm:grid-cols-2">{visibleFacilities.map((facility, index) => { const distance = userLocation ? distanceKm(userLocation, facility.coordinates) : null; return <button key={facility.id} type="button" onClick={() => selectFacility(facility)} className={cn("facility-card field-record-card text-left", selectedId === facility.id && "facility-card-selected")}><div className="flex items-start justify-between gap-3"><span className="tiny-category"><MapPin size={13} /> {facility.context}</span>{facility.publicListingRating === null ? <span className="rounded-full bg-[#E0E9ED] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#3F7890]">Not rated</span> : <span className="flex items-center gap-1 text-sm font-bold text-[#A77720]"><Star size={14} fill="currentColor" /> {facility.publicListingRating.toFixed(1)}</span>}</div><div className="mt-3 flex items-center justify-between gap-2"><span className="field-record-index">{String(index + 1).padStart(2, "0")} · {facility.area}</span><span className="field-record-source">SRC {facility.sourceKey}</span></div><h4 className="mt-3 font-['Fraunces'] text-xl font-semibold leading-5 tracking-[-0.035em]">{facility.name}</h4><p className="mt-2 text-xs leading-5 text-[#53635E]">{facility.locationPrecision === "Listing coordinate" ? "Listing coordinate" : "Approximate area target"}</p><div className="field-record-stamp mt-3"><span className={cn("inline-flex rounded-full px-2 py-1 text-[10px] font-bold leading-3", statusClass(facility.verificationStatus))}>{facility.verificationStatus}</span></div><div className="mt-4 flex items-center justify-between border-t border-dashed border-[#D5D1C3] pt-3 text-xs font-bold text-[#40514C]"><span>{distance === null ? facility.hours.replace(" listed", "") : formatDistance(distance, distanceUnit)}</span><ChevronRight size={15} className="text-[#176B5A]" /></div></button>; })}</div> : <div className="border border-dashed border-[#CFCBBB] bg-[#FFFDF7] p-7 sm:p-9"><Search className="text-[#176B5A]" size={28} aria-hidden="true" /><h4 className="mt-4 font-['Fraunces'] text-2xl font-semibold tracking-[-0.04em]">No matching discovery record.</h4><p className="mt-2 max-w-lg text-sm leading-6 text-[#53635E]">Try another area or search term. Confirmed women-friendly and step-free filters stay empty until field evidence is recorded.</p></div>}</div>
              <article className="border border-[#D9D6C8] bg-[#FFFDF7] p-5 shadow-sm sm:p-6">
                <div className="flex items-start justify-between gap-3"><StatusStamp icon={ClipboardCheck} label="Evidence card" tone="orientation" />{selectedFacility.sourceUrl && <a href={selectedFacility.sourceUrl} target="_blank" rel="noreferrer" className="text-[#176B5A] hover:text-[#0F5145]" aria-label={`Open source for ${selectedFacility.name}`}><ExternalLink size={17} /></a>}</div>
                <h3 className="mt-4 font-['Fraunces'] text-3xl font-semibold leading-8 tracking-[-0.045em]">{selectedFacility.name}</h3>
                <p className="mt-2 text-sm font-semibold text-[#176B5A]">{selectedFacility.area}, {selectedFacility.district}</p>
                <p className="mt-4 text-sm leading-6 text-[#53635E]">{selectedFacility.finding}</p>
                <div className="my-5 rounded-sm bg-[#EEF1EB] px-3.5 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#3F7890]">Location & verification</p><p className="mt-1 text-xs leading-5 text-[#40514C]">{selectedFacility.locationPrecision} · {selectedFacility.verificationStatus}</p></div>
                <div className="divide-y divide-dashed divide-[#D5D1C3] border-y border-dashed border-[#D5D1C3]"><EvidenceRow icon={Star} label="Hygiene" value={selectedFacility.hygieneRating === null ? "Not rated" : `${selectedFacility.hygieneRating}/5`} /><EvidenceRow icon={Droplets} label="Water" value={selectedFacility.waterStatus} /><EvidenceRow icon={ShieldCheck} label="Safety / lighting" value={selectedFacility.safetyStatus === selectedFacility.lightingStatus ? selectedFacility.safetyStatus : `${selectedFacility.safetyStatus} / ${selectedFacility.lightingStatus}`} /><EvidenceRow icon={Accessibility} label="Step-free access" value={selectedFacility.wheelchairAccess} /><EvidenceRow icon={CircleHelp} label="Women-friendly" value={selectedFacility.womenFriendly} /></div>
                <div className="mt-5 border-y border-dashed border-[#D5D1C3] py-3">
                  <div className="flex items-start justify-between gap-3"><p className="text-xs font-bold text-[#40514C]">Community reviews</p>{publishedReviewSummary.isLoading ? <span className="text-xs text-[#6B7771]">Loading…</span> : publishedReviewSummary.data?.ratingCount ? <span className="flex items-center gap-1 text-xs font-bold text-[#A77720]"><Star size={13} fill="currentColor" /> {publishedReviewSummary.data.averageRating?.toFixed(1)} · {publishedReviewSummary.data.ratingCount} community rating{publishedReviewSummary.data.ratingCount === 1 ? "" : "s"}</span> : <span className="text-xs text-[#6B7771]">No published ratings yet</span>}</div>
                  {publishedReviews.isLoading ? <p className="mt-2 text-xs text-[#6B7771]">Loading published reviews…</p> : publishedReviews.data?.length ? <div className="mt-3 space-y-3">{publishedReviews.data.map(({ review, author }) => <article key={review.id} className="border-l-2 border-[#C9D1C6] pl-3 text-xs leading-5 text-[#53635E]"><p><strong className="text-[#142A25]">{author || "Community member"}</strong> <span className="ml-1 inline-flex items-center gap-0.5 font-bold text-[#A77720]"><Star size={12} fill="currentColor" /> {review.rating}/5</span></p><p className="mt-1">{review.body || "Rating submitted"}</p></article>)}</div> : <p className="mt-2 text-xs leading-5 text-[#6B7771]">No published community reviews yet. New reviews appear here after moderation.</p>}
                </div>
                <p className="mt-5 text-xs leading-5 text-[#6B7771]">Hours: <strong className="text-[#40514C]">{selectedFacility.hours}</strong><br />Source: <strong className="text-[#40514C]">{selectedFacility.sourceKey}</strong><br />{selectedFacility.lastChecked}</p>
                {selectedFacility.evidencePhotoUrl && <img src={selectedFacility.evidencePhotoUrl} alt={`Evidence for ${selectedFacility.name}`} className="mt-4 h-32 w-full border border-[#D9D6C8] object-cover" />}
                <div className="mt-5 grid gap-2"><Button onClick={() => openDirections(selectedFacility)} className="w-full rounded-full bg-[#176B5A] text-white hover:bg-[#0F5145]">Get directions <Navigation size={15} /></Button><FacilityAdminActions isAdmin={administrator} facilityId={selectedFacility.id} onPerformFieldCheck={openOfficialFieldCheck} /><Button onClick={() => openAuthenticated(setReviewOpen)} variant="outline" className="w-full rounded-full border-[#176B5A] text-[#176B5A] hover:bg-[#176B5A] hover:text-white">Write a review <Star size={15} /></Button><Button onClick={() => openAuthenticated(setIssueOpen)} variant="outline" className="w-full rounded-full border-[#C86134] text-[#A05B2D] hover:bg-[#C86134] hover:text-white">Report an issue <TriangleAlert size={15} /></Button></div>
              </article></div>
          </div>
        </div>
      </section>

      <section id="findings" className="route-section scroll-mt-20 border-y border-[#D9D6C8] bg-[#E7ECE4]"><div className="mx-auto grid max-w-[1480px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10 lg:py-20"><div><p className="eyebrow">02 · Trust & update status</p><h2 className="mt-4 max-w-md font-['Fraunces'] text-4xl font-semibold leading-[1.02] tracking-[-0.045em]">Choose with clearer context.</h2><p className="mt-5 max-w-md text-sm leading-6 text-[#53635E]">CleanRoute brings location, accessibility, hygiene and update status into one place. Every record shows whether its details come from a public listing, field verification or community feedback.</p></div><div className="border border-[#C9D1C6] bg-[#F7F4EA] p-5 shadow-[8px_8px_0_rgba(23,107,90,0.08)] sm:p-7"><div className="mb-7 flex items-center justify-between gap-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#40514C]">Launch data · Maharashtra</p><StatusStamp icon={Check} label="Clearly labelled" tone="orientation" /></div><div className="space-y-5">{[{ label: "Available records", value: metrics.total, note: "current Maharashtra launch coverage", color: "#176B5A" }, { label: "Public listing locations", value: metrics.publicListings, note: "helpful for discovery, not field ratings", color: "#3F7890" }, { label: "Awaiting verification", value: metrics.fieldCheck, note: "shown transparently on each record", color: "#C86134" }, { label: "Hygiene details pending", value: metrics.notRated, note: "not yet confirmed on site", color: "#A77720" }].map(metric => <div key={metric.label}><div className="mb-2 flex items-end justify-between gap-4"><div><p className="text-sm font-bold text-[#142A25]">{metric.label}</p><p className="text-xs text-[#6B7771]">{metric.note}</p></div><span className="font-['Fraunces'] text-3xl font-semibold tracking-[-0.05em]" style={{ color: metric.color }}>{metric.value}</span></div><div className="h-3 overflow-hidden rounded-full bg-[#E2E0D7]"><div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${(metric.value / metrics.total) * 100}%`, backgroundColor: metric.color }} /></div></div>)}</div></div></div></section>

      <section id="method" className="route-section mx-auto max-w-[1480px] scroll-mt-20 px-5 py-16 sm:px-8 lg:px-10 lg:py-20"><div className="grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-center"><div className="relative min-h-[360px] overflow-hidden border border-[#D9D6C8] bg-[#DCE5D8] shadow-[8px_8px_0_rgba(20,42,37,0.08)]"><img src={fieldCheckUrl} alt="Field verifier checking a public restroom sign" className="h-full w-full object-cover" /><div className="absolute bottom-5 left-5 max-w-[260px] border border-[#D9D6C8] bg-[#FFFDF7]/95 p-4 shadow-sm backdrop-blur-sm"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#176B5A]">Verification standard</p><p className="mt-2 text-sm font-bold leading-5">Record what you observe, not what you expect.</p></div></div><div><p className="eyebrow">03 · Trust and verification</p><h2 className="mt-4 font-['Fraunces'] text-4xl font-semibold leading-[1.02] tracking-[-0.045em]">Helpful now, clearer with every update.</h2><p className="mt-5 max-w-xl text-sm leading-6 text-[#53635E]">Public listings support discovery. Official field checks and community reports help keep location, water, safety and access details current—and every toilet card shows its evidence status.</p><div className="mt-7 grid gap-3 sm:grid-cols-3"><StatusStamp icon={Droplets} label="Water status" tone="gap" /><StatusStamp icon={ShieldCheck} label="Safety & lighting" tone="gap" /><StatusStamp icon={Accessibility} label="Access route" tone="gap" /></div>{user?.role === "admin" ? <Button asChild className="mt-7 rounded-full bg-[#176B5A] text-white hover:bg-[#0F5145]"><a href="/admin/field-checks">Open field checks <ClipboardCheck size={16} /></a></Button> : <Button onClick={() => openAuthenticated(setIssueOpen)} variant="outline" className="mt-7 rounded-full border-[#176B5A] text-[#176B5A] hover:bg-[#176B5A] hover:text-white">Report an issue <TriangleAlert size={16} /></Button>}</div></div></section>

      <section className="route-section route-section-dark border-t border-[#D9D6C8] bg-[#142A25] text-[#F7F4EA]"><div className="mx-auto grid max-w-[1480px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A8CEBC]">Data sources & scope</p><h2 className="mt-4 font-['Fraunces'] text-3xl font-semibold tracking-[-0.04em]">Built for discovery, grounded in context.</h2><p className="mt-4 max-w-sm text-sm leading-6 text-[#C7D3CA]">CleanRoute currently launches with selected Maharashtra locations. Public listings support discovery; hygiene, water, safety and accessibility become verified only after documented field observation.</p></div><div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">{sources.map(source => source.url ? <a key={source.key} href={source.url} target="_blank" rel="noreferrer" className="group border-t border-[#41584F] pt-4 text-sm transition-colors hover:text-[#A8CEBC]"><span className="font-bold text-[#A8CEBC]">{source.key}</span><p className="mt-2 font-semibold leading-5">{source.title}</p><p className="mt-1 text-xs text-[#AAB9AF]">{source.publisher}</p><span className="mt-3 inline-flex items-center gap-1 text-xs font-bold">Open source <ExternalLink size={13} /></span></a> : <div key={source.key} className="border-t border-[#41584F] pt-4 text-sm"><span className="font-bold text-[#A8CEBC]">{source.key}</span><p className="mt-2 font-semibold leading-5">{source.title}</p><p className="mt-1 text-xs text-[#AAB9AF]">{source.publisher}</p></div>)}</div></div></section>
    </main>

    {surveyOpen && <div className="fixed inset-0 z-[60] flex items-end bg-[#142A25]/45 p-0 sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="survey-title"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto border border-[#D9D6C8] bg-[#FFFDF7] p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-5"><div><p className="eyebrow">Authenticated Maharashtra field check</p><h2 id="survey-title" className="mt-3 font-['Fraunces'] text-3xl font-semibold tracking-[-0.045em]">Record what you saw.</h2></div><button onClick={() => setSurveyOpen(false)} className="rounded-full p-2 text-[#53635E] hover:bg-[#EDF0E8]" aria-label="Close field check"><X size={19} /></button></div><p className="mt-4 text-sm leading-6 text-[#53635E]">Submit an observation for <strong className="text-[#142A25]">{selectedFacility.name}</strong>. Authorised submissions update its database-backed evidence card after saving.</p><div className="mt-6 grid gap-4 border-y border-dashed border-[#D5D1C3] py-5 sm:grid-cols-2"><label className="text-sm font-bold">Researcher name<input value={survey.researcher} onChange={event => setSurvey(current => ({ ...current, researcher: event.target.value }))} className="mt-2 w-full border border-[#CFCBBB] bg-white px-3 py-2 font-normal outline-none focus:border-[#176B5A]" placeholder="Name or initials" /></label><label className="text-sm font-bold">Location<input value={`${selectedFacility.area} · ${selectedFacility.name}`} readOnly className="mt-2 w-full border border-[#D9D6C8] bg-[#EEF1EB] px-3 py-2 font-normal text-[#53635E]" /></label><div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3"><span className="font-bold">Cleanliness</span><SurveyStars label="cleanliness" value={survey.cleanliness} onRate={value => setSurvey(current => ({ ...current, cleanliness: value }))} /></div>{[{ key: "water", label: "Water availability", options: ["Available", "Not available", "Intermittent", "Unknown"] }, { key: "safety", label: "Safety", options: ["Good", "Average", "Poor", "Unknown"] }, { key: "lighting", label: "Lighting", options: ["Good", "Average", "Poor", "Unknown"] }, { key: "access", label: "Accessibility", options: ["Wheelchair accessible", "Partially accessible", "Not accessible", "Unknown"] }, { key: "women", label: "Women-friendly", options: ["Yes", "No", "Needs verification"] }, { key: "operating", label: "Operating status", options: ["Open", "Closed", "Temporarily closed", "Unknown"] }].map(field => <label key={field.key} className="text-sm font-bold">{field.label}<select value={survey[field.key as keyof typeof survey] as string} onChange={event => setSurvey(current => ({ ...current, [field.key]: event.target.value }))} className="mt-2 w-full border border-[#CFCBBB] bg-white px-3 py-2 font-normal outline-none focus:border-[#176B5A]">{field.options.map(option => <option key={option}>{option}</option>)}</select></label>)}<label className="text-sm font-bold sm:col-span-2">Evidence photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={async event => { const file = event.target.files?.[0]; if (!file) return; try { const evidence = await readEvidenceImage(file); setSurvey(current => ({ ...current, evidenceDataUrl: evidence.dataUrl, evidenceFileName: evidence.fileName })); setSubmissionError(""); } catch (error) { setSubmissionError(error instanceof Error ? error.message : "The evidence photo could not be prepared."); } }} className="mt-2 block w-full text-xs font-normal" /><span className="mt-1 block text-xs font-normal text-[#6B7771]">{survey.evidenceFileName ? `${survey.evidenceFileName} is ready for upload.` : "PNG, JPEG, or WebP up to 5 MB."}</span></label><label className="text-sm font-bold sm:col-span-2">Notes<textarea value={survey.notes} onChange={event => setSurvey(current => ({ ...current, notes: event.target.value }))} className="mt-2 min-h-24 w-full border border-[#CFCBBB] bg-white px-3 py-2 font-normal outline-none focus:border-[#176B5A]" placeholder="What did you directly observe?" /></label></div>{submissionError && <p className="mt-4 text-sm font-bold text-[#A05B2D]">{submissionError}</p>}{surveySaved && <p className="mt-4 flex items-center gap-2 text-sm font-bold text-[#176B5A]"><Check size={16} /> {fieldCheckApplied ? "Field check saved successfully. The facility data was refreshed." : "Field check submitted for review. The public evidence card has not changed yet."}</p>}<div className="mt-7 flex flex-wrap gap-3"><Button onClick={saveSurvey} disabled={!survey.cleanliness || !survey.researcher.trim() || fieldCheckMutation.isPending} className="rounded-full bg-[#176B5A] text-white hover:bg-[#0F5145] disabled:bg-[#A8B8AF]">{fieldCheckMutation.isPending ? "Saving…" : "Submit field check"} <Check size={16} /></Button><Button variant="outline" onClick={() => setSurveyOpen(false)} className="rounded-full border-[#CFCBBB]">Close</Button></div></div></div>}
    {issueOpen && <div className="fixed inset-0 z-[65] flex items-end bg-[#142A25]/45 p-0 sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="issue-title"><div className="w-full max-w-lg border border-[#D9D6C8] bg-[#FFFDF7] p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-5"><div><p className="eyebrow">Community report</p><h2 id="issue-title" className="mt-3 font-['Fraunces'] text-3xl font-semibold tracking-[-0.045em]">Report an issue.</h2></div><button onClick={() => setIssueOpen(false)} className="rounded-full p-2 text-[#53635E] hover:bg-[#EDF0E8]" aria-label="Close issue report"><X size={19} /></button></div><p className="mt-4 text-sm leading-6 text-[#53635E]">Submit a persistent report about <strong className="text-[#142A25]">{selectedFacility.name}</strong>. It enters the review queue as <em>pending</em>; it does not change a verified fact automatically.</p><label className="mt-6 block text-sm font-bold">Issue type<select value={issue.type} onChange={event => setIssue(current => ({ ...current, type: event.target.value }))} className="mt-2 w-full border border-[#CFCBBB] bg-white px-3 py-2 font-normal outline-none focus:border-[#176B5A]">{["Wrong location", "Toilet closed", "Wrong operating hours", "Incorrect accessibility information", "Incorrect facility information", "Duplicate listing", "Inappropriate content", "Other"].map(option => <option key={option}>{option}</option>)}</select></label><label className="mt-5 block text-sm font-bold">Observation<textarea value={issue.note} onChange={event => setIssue(current => ({ ...current, note: event.target.value }))} className="mt-2 min-h-24 w-full border border-[#CFCBBB] bg-white px-3 py-2 font-normal outline-none focus:border-[#176B5A]" placeholder="Tell us what is incorrect…" /></label><label className="mt-5 block text-sm font-bold">Optional evidence photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={async event => { const file = event.target.files?.[0]; if (!file) return; try { const evidence = await readEvidenceImage(file); setIssue(current => ({ ...current, evidenceDataUrl: evidence.dataUrl, evidenceFileName: evidence.fileName })); setSubmissionError(""); } catch (error) { setSubmissionError(error instanceof Error ? error.message : "The evidence photo could not be prepared."); } }} className="mt-2 block w-full text-xs font-normal" /><span className="mt-1 block text-xs font-normal text-[#6B7771]">{issue.evidenceFileName ? `${issue.evidenceFileName} is ready for upload.` : "PNG, JPEG, or WebP up to 5 MB."}</span></label>{submissionError && <p className="mt-4 text-sm font-bold text-[#A05B2D]">{submissionError}</p>}{issueSaved && <p className="mt-4 flex items-center gap-2 text-sm font-bold text-[#176B5A]"><Check size={16} /> Thanks. Your report has been submitted and will be reviewed.</p>}<div className="mt-7 flex flex-wrap gap-3"><Button onClick={saveIssue} disabled={issueReportMutation.isPending} className="rounded-full bg-[#176B5A] text-white hover:bg-[#0F5145]">{issueReportMutation.isPending ? "Submitting…" : "Submit report"} <Check size={16} /></Button><Button variant="outline" onClick={() => setIssueOpen(false)} className="rounded-full border-[#CFCBBB]">Close</Button></div></div></div>}
    {reviewOpen && <div className="fixed inset-0 z-[66] flex items-end bg-[#142A25]/45 p-0 sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="review-title"><div className="w-full max-w-lg border border-[#D9D6C8] bg-[#FFFDF7] p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-5"><div><p className="eyebrow">Community review</p><h2 id="review-title" className="mt-3 font-['Fraunces'] text-3xl font-semibold tracking-[-0.045em]">Rate your experience.</h2></div><button onClick={() => setReviewOpen(false)} className="rounded-full p-2 text-[#53635E] hover:bg-[#EDF0E8]" aria-label="Close review"><X size={19} /></button></div><p className="mt-4 text-sm leading-6 text-[#53635E]">Your review for <strong className="text-[#142A25]">{selectedFacility.name}</strong> will remain pending until an administrator moderates it. It is not an official field check.</p><div className="mt-6"><SurveyStars label="review rating" value={review.rating} onRate={value => setReview(current => ({ ...current, rating: value }))} /><textarea value={review.body} onChange={event => setReview(current => ({ ...current, body: event.target.value }))} className="mt-5 min-h-24 w-full border border-[#CFCBBB] bg-white px-3 py-2 text-sm outline-none focus:border-[#176B5A]" placeholder="Optional experience note" /></div>{submissionError && <p className="mt-4 text-sm font-bold text-[#A05B2D]">{submissionError}</p>}{reviewSaved && <p className="mt-4 flex items-center gap-2 text-sm font-bold text-[#176B5A]"><Check size={16} /> Thanks. Your review is pending moderation.</p>}<div className="mt-7 flex flex-wrap gap-3"><Button onClick={saveReview} disabled={!review.rating || reviewMutation.isPending} className="rounded-full bg-[#176B5A] text-white hover:bg-[#0F5145]">{reviewMutation.isPending ? "Submitting…" : "Submit review"} <Check size={16} /></Button><Button variant="outline" onClick={() => setReviewOpen(false)} className="rounded-full border-[#CFCBBB]">Close</Button></div></div></div>}
  </div>;
}
