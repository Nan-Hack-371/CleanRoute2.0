import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { KeyRound, Loader2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminPasswordSetup() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const setup = trpc.auth.setupAdminPassword.useMutation();
  useEffect(() => { if (!loading && !user) setLocation("/admin/login"); }, [loading, setLocation, user]);
  if (loading) return <main className="grid min-h-screen place-items-center bg-[#F7F4EA] text-sm text-[#53635E]">Checking administrator access…</main>;
  if (!user || user.role !== "admin") return <main className="grid min-h-screen place-items-center bg-[#F7F4EA] p-6 text-center"><div><h1 className="font-['Fraunces'] text-3xl font-semibold">Access denied</h1><p className="mt-3 text-sm text-[#53635E]">Only an existing administrator can set an administrator password.</p></div></main>;
  async function submit(event: FormEvent) { event.preventDefault(); setError(""); if (password !== confirm) return setError("Passwords do not match."); try { await setup.mutateAsync({ password }); setLocation("/admin"); } catch (reason: any) { setError(reason?.message || "We couldn't save the password. Please try again."); } }
  return <main className="grid min-h-screen place-items-center bg-[#F7F4EA] p-5"><form onSubmit={submit} className="w-full max-w-md border border-[#D9D6C8] bg-[#FFFDF7] p-7 shadow-[8px_8px_0_rgba(20,42,37,0.09)] sm:p-9"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176B5A]">Existing administrator</p><h1 className="mt-3 font-['Fraunces'] text-3xl font-semibold tracking-[-0.05em]">Set local admin password</h1><p className="mt-3 text-sm leading-6 text-[#53635E]">This creates a CleanRoute password for this existing administrator account. It does not change your role.</p><div className="mt-6 space-y-4"><div className="space-y-2"><Label htmlFor="admin-password">New password</Label><Input id="admin-password" type="password" minLength={10} value={password} onChange={event => setPassword(event.target.value)} className="h-11 border-[#D5D1C3]" required /></div><div className="space-y-2"><Label htmlFor="admin-confirm">Confirm password</Label><Input id="admin-confirm" type="password" minLength={10} value={confirm} onChange={event => setConfirm(event.target.value)} className="h-11 border-[#D5D1C3]" required /></div></div>{error ? <p role="alert" className="mt-4 text-sm text-[#9F4329]">{error}</p> : null}<Button disabled={setup.isPending} className="mt-6 h-11 w-full rounded-full bg-[#176B5A] text-white hover:bg-[#0F5145]">{setup.isPending ? <Loader2 className="animate-spin" size={17} /> : <KeyRound size={17} />} Save local admin password</Button></form></main>;
}
