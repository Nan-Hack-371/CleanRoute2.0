import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildLoginPath, buildRegistrationPath, safeInternalPath } from "@/lib/authNavigation";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, KeyRound, Loader2, LockKeyhole, Mail, MapPinned, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";

type AuthMode = "login" | "register" | "admin";

function searchValue(key: string) {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const returnTo = safeInternalPath(searchValue("returnTo"), "/");
  const intent = searchValue("intent");

  const register = trpc.auth.register.useMutation();
  const login = trpc.auth.login.useMutation();
  const adminLogin = trpc.auth.adminLogin.useMutation();
  const pending = register.isPending || login.isPending || adminLogin.isPending;
  const isRegister = mode === "register";
  const isAdmin = mode === "admin";
  const title = isRegister ? "Create your account" : isAdmin ? "Admin sign in" : "Welcome back";
  const supporting = isRegister
    ? "Save your contributions, reports, and reviews to your own CleanRoute account."
    : isAdmin
      ? "Use an administrator account to manage official CleanRoute records."
      : "Sign in to contribute an update, write a review, or manage your own submissions.";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      if (isRegister) await register.mutateAsync({ name, email, password });
      else if (isAdmin) await adminLogin.mutateAsync({ email, password });
      else await login.mutateAsync({ email, password });
      await utils.auth.me.invalidate();
      setLocation(isAdmin ? "/admin" : returnTo);
    } catch (reason: any) {
      setError(reason?.message || "We couldn't sign you in. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F4EA] px-5 py-8 text-[#142A25] sm:px-8 sm:py-12">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl overflow-hidden border border-[#D9D6C8] bg-[#FFFDF7] shadow-[12px_12px_0_rgba(20,42,37,0.10)] lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="relative overflow-hidden bg-[#176B5A] p-7 text-[#F7F4EA] sm:p-10">
          <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,#D8E7DA_1px,transparent_0)] [background-size:18px_18px]" />
          <div className="relative flex h-full flex-col"><Link href="/" className="inline-flex items-center gap-3 font-['Fraunces'] text-2xl font-semibold"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#F7F4EA] text-[#176B5A]"><MapPinned size={20} /></span>CleanRoute</Link><div className="my-auto"><p className="text-xs font-bold uppercase tracking-[0.17em] text-[#C8E0CE]">Public toilet locator</p><h1 className="mt-4 max-w-sm font-['Fraunces'] text-4xl font-semibold leading-[0.98] tracking-[-0.05em]">Find places. Share what’s useful.</h1><p className="mt-5 max-w-sm text-sm leading-6 text-[#E2EFE3]">Your account keeps personal reviews and issue reports connected to you—not to a public profile.</p></div><p className="text-xs leading-5 text-[#C8E0CE]">Public search, filters, directions and evidence labels stay available without an account.</p></div>
        </aside>
        <section className="p-7 sm:p-10 lg:p-14">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#176B5A] hover:underline"><ArrowLeft size={15} /> Back to locator</Link>
          <div className="mt-12 max-w-md"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176B5A]">{isAdmin ? "Protected workspace" : "Your CleanRoute account"}</p><h2 className="mt-3 font-['Fraunces'] text-4xl font-semibold tracking-[-0.05em]">{title}</h2><p className="mt-4 text-sm leading-6 text-[#53635E]">{supporting}</p>{intent && !isAdmin ? <p className="mt-4 rounded-sm border border-[#C7D8CC] bg-[#EEF5EF] px-3 py-2 text-xs font-semibold text-[#176B5A]">After signing in, we’ll return you to your selected toilet and open the {intent === "review" ? "review" : "issue report"} form.</p> : null}</div>
          <form onSubmit={submit} className="mt-8 max-w-md space-y-5" noValidate>
            {isRegister ? <div className="space-y-2"><Label htmlFor="name">Name</Label><div className="relative"><UserRound className="absolute left-3 top-3 text-[#6B7771]" size={17} /><Input id="name" value={name} onChange={event => setName(event.target.value)} autoComplete="name" className="h-11 border-[#D5D1C3] pl-10" required /></div></div> : null}
            <div className="space-y-2"><Label htmlFor="email">Email</Label><div className="relative"><Mail className="absolute left-3 top-3 text-[#6B7771]" size={17} /><Input id="email" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" className="h-11 border-[#D5D1C3] pl-10" required /></div></div>
            <div className="space-y-2"><Label htmlFor="password">Password</Label><div className="relative"><LockKeyhole className="absolute left-3 top-3 text-[#6B7771]" size={17} /><Input id="password" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={isRegister ? "new-password" : "current-password"} minLength={isRegister ? 10 : 1} className="h-11 border-[#D5D1C3] pl-10" required /></div>{isRegister ? <p className="text-xs text-[#6B7771]">Use at least 10 characters.</p> : null}</div>
            {isRegister ? <div className="space-y-2"><Label htmlFor="confirm-password">Confirm password</Label><div className="relative"><KeyRound className="absolute left-3 top-3 text-[#6B7771]" size={17} /><Input id="confirm-password" type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={10} className="h-11 border-[#D5D1C3] pl-10" required /></div></div> : null}
            {error ? <p role="alert" className="rounded-sm border border-[#E8C9BE] bg-[#FFF2ED] px-3 py-2 text-sm text-[#9F4329]">{error}</p> : null}
            <Button type="submit" disabled={pending} className="h-11 w-full rounded-full bg-[#176B5A] text-white hover:bg-[#0F5145]">{pending ? <><Loader2 className="animate-spin" size={17} /> Please wait</> : isRegister ? "Create account" : "Sign in"}</Button>
          </form>
          {!isAdmin ? <p className="mt-7 max-w-md text-center text-sm text-[#53635E]">{isRegister ? "Already have an account?" : "Don't have an account?"} <Link href={isRegister ? buildLoginPath({ returnTo, intent: intent === "review" || intent === "report" ? intent : undefined }) : buildRegistrationPath({ returnTo, intent: intent === "review" || intent === "report" ? intent : undefined })} className="font-bold text-[#176B5A] hover:underline">{isRegister ? "Sign in" : "Create account"}</Link></p> : <p className="mt-7 max-w-md text-center text-xs leading-5 text-[#6B7771]">Administrator access is verified on the server after sign-in. A normal account cannot become an administrator from this page.</p>}
        </section>
      </div>
    </main>
  );
}
