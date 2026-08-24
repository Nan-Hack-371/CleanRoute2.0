import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, ClipboardList, Loader2, ShieldAlert } from "lucide-react";
import { useState } from "react";

type ReportStatus = "pending" | "reviewing" | "resolved" | "rejected";

const statusStyle: Record<ReportStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  reviewing: "bg-sky-100 text-sky-900",
  resolved: "bg-emerald-100 text-emerald-900",
  rejected: "bg-stone-200 text-stone-800",
};

function ReviewQueue() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const utils = trpc.useUtils();
  const reportsQuery = trpc.admin.reports.useQuery(undefined, { retry: false });
  const updateReport = trpc.admin.updateReport.useMutation({
    onSuccess: () => utils.admin.reports.invalidate(),
  });
  const [notes, setNotes] = useState<Record<string, string>>({});

  if (user && user.role !== "admin") {
    return <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center"><ShieldAlert className="mx-auto text-amber-700" size={32} /><h1 className="mt-4 text-2xl font-semibold">Admin access required</h1><p className="mt-2 text-sm text-muted-foreground">Only the CleanRoute administrator can review or resolve submitted issue reports.</p><Button asChild className="mt-6"><a href="/">Return to locator</a></Button></div>;
  }

  if (reportsQuery.isLoading || !user) return <div className="flex min-h-[40vh] items-center justify-center gap-3"><Loader2 className="animate-spin" /> Loading review queue…</div>;
  if (reportsQuery.error) return <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center"><ShieldAlert className="mx-auto text-red-700" size={32} /><h1 className="mt-4 text-2xl font-semibold">Could not load reports</h1><p className="mt-2 text-sm text-muted-foreground">Try again after checking your administrator access.</p></div>;

  return <div className="mx-auto max-w-6xl space-y-6 p-2 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">CleanRoute administration</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Issue report review queue</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Reports stay pending until you review them. Resolving a report does not overwrite facility facts; use an authorised field check for evidence updates.</p></div><Button asChild variant="outline"><a href="/"><ArrowLeft size={16} /> Back to locator</a></Button></div>
    {reportsQuery.data?.length ? <div className="grid gap-4">{reportsQuery.data.map(({ report, facilityName, facilityArea }) => <article key={report.id} className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><Badge className={statusStyle[report.status]}>{report.status}</Badge><span className="text-xs font-semibold text-muted-foreground">{facilityArea}</span></div><h2 className="mt-3 text-xl font-semibold">{facilityName}</h2><p className="mt-1 text-sm text-muted-foreground">{report.reportType} · {new Date(report.createdAt).toLocaleString()}</p></div>{report.evidencePhotoUrl && <a href={report.evidencePhotoUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-emerald-700 hover:underline">View evidence photo</a>}</div><p className="mt-4 rounded-xl bg-muted/60 p-4 text-sm leading-6">{report.description || "No additional description supplied."}</p><div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]"><Textarea value={notes[report.id] ?? report.resolutionNotes ?? ""} onChange={event => setNotes(current => ({ ...current, [report.id]: event.target.value }))} placeholder="Internal review notes" /><select value={report.status} onChange={event => updateReport.mutate({ reportId: report.id, status: event.target.value as ReportStatus, resolutionNotes: notes[report.id] ?? report.resolutionNotes ?? undefined })} className="rounded-md border bg-background px-3 text-sm"><option value="pending">Pending</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="rejected">Rejected</option></select><Button disabled={updateReport.isPending} onClick={() => updateReport.mutate({ reportId: report.id, status: report.status, resolutionNotes: notes[report.id] ?? report.resolutionNotes ?? undefined })}>{updateReport.isPending ? "Saving…" : "Save review"}</Button></div></article>)}</div> : <div className="rounded-2xl border border-dashed p-12 text-center"><ClipboardList className="mx-auto text-emerald-700" size={34} /><h2 className="mt-4 text-xl font-semibold">No reports to review</h2><p className="mt-2 text-sm text-muted-foreground">New community reports will appear here with a pending status.</p></div>}
  </div>;
}

export default function AdminReports() {
  return <DashboardLayout><ReviewQueue /></DashboardLayout>;
}
