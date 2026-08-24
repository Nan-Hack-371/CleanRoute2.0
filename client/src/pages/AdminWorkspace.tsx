import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { isAdministrator } from "@shared/const";
import { ArrowLeft, ClipboardCheck, Loader2, MapPinned, ShieldAlert, Star, TextQuote, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

type PublicationStatus = "published" | "unpublished";
type FacilityInput = {
  name: string; area: string; district: string; context: string; latitude: number; longitude: number;
  locationPrecision: "Listing coordinate" | "Approximate area location"; hours: string; sourceKey: string; sourceUrl?: string; finding: string; publicationStatus: PublicationStatus;
};

const blankFacility: FacilityInput = { name: "", area: "", district: "", context: "Town", latitude: 19, longitude: 73, locationPrecision: "Listing coordinate", hours: "Hours to be checked", sourceKey: "Admin", finding: "Admin-created record pending field verification.", publicationStatus: "unpublished" };

function AccessDenied() {
  return <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center p-8 text-center"><ShieldAlert className="text-amber-700" size={36} /><h1 className="mt-4 text-3xl font-semibold">Administrator access required</h1><p className="mt-3 text-sm text-muted-foreground">This route is protected. Normal users can browse locations, submit a review, or report an issue from the public locator.</p><Button asChild className="mt-6"><Link href="/"><ArrowLeft size={16} /> Return to locator</Link></Button></div>;
}

function StatusSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return <select value={value} onChange={event => onChange(event.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">{options.map(option => <option key={option} value={option}>{option}</option>)}</select>;
}

function FacilityManagement() {
  const utils = trpc.useUtils();
  const facilities = trpc.admin.facilities.useQuery();
  const createFacility = trpc.admin.createFacility.useMutation({ onSuccess: () => utils.admin.facilities.invalidate() });
  const updateFacility = trpc.admin.updateFacility.useMutation({ onSuccess: () => utils.admin.facilities.invalidate() });
  const [form, setForm] = useState<FacilityInput>(blankFacility);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const save = async () => {
    setNotice("");
    try {
      if (editingId) await updateFacility.mutateAsync({ id: editingId, facility: form });
      else await createFacility.mutateAsync(form);
      setNotice(editingId ? "Facility record updated." : "Facility record created as an administrator-managed entry.");
      setForm(blankFacility); setEditingId(null);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Facility could not be saved."); }
  };
  const edit = (facility: any) => {
    setEditingId(facility.id);
    setForm({ name: facility.name, area: facility.area, district: facility.district, context: facility.context, latitude: facility.coordinates.lat, longitude: facility.coordinates.lng, locationPrecision: facility.locationPrecision, hours: facility.hours, sourceKey: facility.sourceKey, sourceUrl: facility.sourceUrl ?? undefined, finding: facility.finding, publicationStatus: facility.publicationStatus ?? "published" });
  };
  useEffect(() => {
    const editId = new URLSearchParams(window.location.search).get("edit");
    if (!editId || !facilities.data || editingId === editId) return;
    const requestedFacility = facilities.data.find(facility => facility.id === editId);
    if (requestedFacility) edit(requestedFacility);
  }, [editingId, facilities.data]);
  const togglePublication = (facility: any) => updateFacility.mutate({ id: facility.id, facility: { name: facility.name, area: facility.area, district: facility.district, context: facility.context, latitude: facility.coordinates.lat, longitude: facility.coordinates.lng, locationPrecision: facility.locationPrecision, hours: facility.hours, sourceKey: facility.sourceKey, sourceUrl: facility.sourceUrl ?? undefined, finding: facility.finding, publicationStatus: facility.publicationStatus === "published" ? "unpublished" : "published" } });

  return <section className="space-y-6"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Administrator tool</p><h1 className="mt-2 text-3xl font-semibold">Manage toilet listings</h1><p className="mt-2 text-sm text-muted-foreground">Only administrators can add, edit, publish, or unpublish official facility records.</p></div><div className="grid gap-6 xl:grid-cols-[390px_1fr]"><form onSubmit={event => { event.preventDefault(); void save(); }} className="rounded-2xl border bg-card p-5 shadow-sm"><h2 className="font-semibold">{editingId ? "Edit facility" : "Add facility"}</h2><div className="mt-4 grid gap-3"><input required value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="Facility name" className="rounded-md border bg-background px-3 py-2 text-sm" /><div className="grid grid-cols-2 gap-3"><input required value={form.area} onChange={event => setForm(current => ({ ...current, area: event.target.value }))} placeholder="Area" className="rounded-md border bg-background px-3 py-2 text-sm" /><input required value={form.district} onChange={event => setForm(current => ({ ...current, district: event.target.value }))} placeholder="District" className="rounded-md border bg-background px-3 py-2 text-sm" /></div><div className="grid grid-cols-2 gap-3"><input required type="number" step="any" value={form.latitude} onChange={event => setForm(current => ({ ...current, latitude: Number(event.target.value) }))} placeholder="Latitude" className="rounded-md border bg-background px-3 py-2 text-sm" /><input required type="number" step="any" value={form.longitude} onChange={event => setForm(current => ({ ...current, longitude: Number(event.target.value) }))} placeholder="Longitude" className="rounded-md border bg-background px-3 py-2 text-sm" /></div><input required value={form.context} onChange={event => setForm(current => ({ ...current, context: event.target.value }))} placeholder="Context" className="rounded-md border bg-background px-3 py-2 text-sm" /><input required value={form.hours} onChange={event => setForm(current => ({ ...current, hours: event.target.value }))} placeholder="Hours" className="rounded-md border bg-background px-3 py-2 text-sm" /><input required value={form.sourceKey} onChange={event => setForm(current => ({ ...current, sourceKey: event.target.value }))} placeholder="Source key" className="rounded-md border bg-background px-3 py-2 text-sm" /><input value={form.sourceUrl ?? ""} onChange={event => setForm(current => ({ ...current, sourceUrl: event.target.value || undefined }))} placeholder="Source URL (optional)" className="rounded-md border bg-background px-3 py-2 text-sm" /><textarea required value={form.finding} onChange={event => setForm(current => ({ ...current, finding: event.target.value }))} placeholder="Evidence note" className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm" /><StatusSelect value={form.publicationStatus} onChange={value => setForm(current => ({ ...current, publicationStatus: value as PublicationStatus }))} options={["unpublished", "published"]} /><div className="flex gap-2"><Button type="submit" disabled={createFacility.isPending || updateFacility.isPending}>{editingId ? "Save changes" : "Create facility"}</Button>{editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(blankFacility); }}>Cancel</Button>}</div>{notice && <p className="text-sm text-muted-foreground">{notice}</p>}</div></form><div className="space-y-3">{facilities.isLoading ? <p className="flex gap-2 text-sm"><Loader2 className="animate-spin" size={16} /> Loading facilities…</p> : facilities.data?.map(facility => <article key={facility.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4"><div><p className="font-semibold">{facility.name}</p><p className="mt-1 text-xs text-muted-foreground">{facility.area} · {facility.publicationStatus ?? "published"} · {facility.verificationStatus}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => edit(facility)}><MapPinned size={15} /> Edit</Button><Button size="sm" variant="outline" disabled={updateFacility.isPending} onClick={() => togglePublication(facility)}>{facility.publicationStatus === "published" ? "Unpublish" : "Publish"}</Button></div></article>)}</div></div></section>;
}

function FieldChecks() {
  const facilities = trpc.admin.facilities.useQuery();
  const fieldCheck = trpc.facilities.submitFieldCheck.useMutation();
  const [facilityId, setFacilityId] = useState("");
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [notice, setNotice] = useState("");
  const options = facilities.data ?? [];
  const selectedId = facilityId || options[0]?.id || "";
  const submit = async () => { setNotice(""); try { await fieldCheck.mutateAsync({ facilityId: selectedId, researcherName: name, hygieneRating: rating, waterStatus: "Available", safetyStatus: "Good", lightingStatus: "Good", accessibilityStatus: "Unknown", womenFriendly: "Needs verification", operatingStatus: "Open" }); setNotice("Verified field check saved; the official facility record was refreshed."); } catch (error) { setNotice(error instanceof Error ? error.message : "Field check could not be saved."); } };
  return <section className="max-w-2xl space-y-6"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Authorised verifier</p><h1 className="mt-2 text-3xl font-semibold">Official field check</h1><p className="mt-2 text-sm text-muted-foreground">This is the only workflow that can update verified facility information. Use genuine observations only.</p></div><form onSubmit={event => { event.preventDefault(); void submit(); }} className="rounded-2xl border bg-card p-6 shadow-sm"><div className="grid gap-4"><StatusSelect value={selectedId} onChange={setFacilityId} options={options.map(facility => facility.id)} /><input required value={name} onChange={event => setName(event.target.value)} placeholder="Verifier name" className="rounded-md border bg-background px-3 py-2 text-sm" /><label className="text-sm font-medium">Hygiene rating<input required type="number" min="1" max="5" value={rating || ""} onChange={event => setRating(Number(event.target.value))} className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm" /></label><Button type="submit" disabled={!selectedId || !name.trim() || !rating || fieldCheck.isPending}><ClipboardCheck size={16} /> {fieldCheck.isPending ? "Saving…" : "Save verified field check"}</Button>{notice && <p className="text-sm text-muted-foreground">{notice}</p>}</div></form></section>;
}

function ReviewModeration() {
  const utils = trpc.useUtils(); const reviews = trpc.admin.reviews.useQuery(); const update = trpc.admin.updateReview.useMutation({ onSuccess: () => utils.admin.reviews.invalidate() });
  return <section className="space-y-6"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Administrator tool</p><h1 className="mt-2 text-3xl font-semibold">Moderate community reviews</h1><p className="mt-2 text-sm text-muted-foreground">Only administrators may publish or reject user reviews.</p></div>{reviews.data?.length ? reviews.data.map(({ review, facilityName, author }) => <article key={review.id} className="rounded-xl border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{facilityName} · {review.rating}/5</p><p className="mt-1 text-xs text-muted-foreground">By {author || "Member"} · {review.status}</p></div><StatusSelect value={review.status} onChange={status => update.mutate({ reviewId: review.id, status: status as "pending" | "published" | "rejected" })} options={["pending", "published", "rejected"]} /></div><p className="mt-3 text-sm">{review.body || "No written review."}</p></article>) : <div className="rounded-xl border border-dashed p-10 text-center"><TextQuote className="mx-auto text-emerald-700" /><p className="mt-3 font-medium">No reviews are awaiting moderation.</p></div>}</section>;
}

function DashboardHome() {
  const stats = trpc.admin.stats.useQuery();
  const items = useMemo(() => [{ label: "Facilities", value: stats.data?.facilities ?? 0, icon: MapPinned }, { label: "Unpublished", value: stats.data?.unpublished ?? 0, icon: UploadCloud }, { label: "Pending reports", value: stats.data?.pendingReports ?? 0, icon: ShieldAlert }, { label: "Pending reviews", value: stats.data?.pendingReviews ?? 0, icon: Star }], [stats.data]);
  return <section><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">CleanRoute administration</p><h1 className="mt-2 text-3xl font-semibold">Verification operations</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Manage listings, official verification, publication, community review moderation, and issue reports without exposing administrative controls to normal users.</p><div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{items.map(item => <div key={item.label} className="rounded-2xl border bg-card p-5"><item.icon className="text-emerald-700" size={20} /><p className="mt-5 text-3xl font-semibold">{item.value}</p><p className="mt-1 text-sm text-muted-foreground">{item.label}</p></div>)}</div></section>;
}

function WorkspaceContent() {
  const [location] = useLocation();
  if (location.startsWith("/admin/toilets")) return <FacilityManagement />;
  if (location === "/admin/field-checks") return <FieldChecks />;
  if (location === "/admin/reviews") return <ReviewModeration />;
  if (location === "/admin/reports") return <AdminReportsLink />;
  return <DashboardHome />;
}

function AdminReportsLink() { return <div className="rounded-2xl border bg-card p-8"><h1 className="text-2xl font-semibold">Reports management</h1><p className="mt-3 text-sm text-muted-foreground">Open the dedicated report-review queue to triage, resolve, or reject submitted reports.</p><Button asChild className="mt-6"><Link href="/admin/reports">Open reports management</Link></Button></div>; }

export default function AdminWorkspace() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  if (loading) return <div className="flex min-h-screen items-center justify-center gap-2"><Loader2 className="animate-spin" /> Checking access…</div>;
  if (!isAdministrator(user)) return <AccessDenied />;
  return <DashboardLayout><main className="min-h-screen bg-background p-5 sm:p-8"><WorkspaceContent /></main></DashboardLayout>;
}
