import React from "react";
import { ClipboardCheck, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

type FacilityAdminActionsProps = {
  isAdmin: boolean;
  facilityId: string;
  onPerformFieldCheck: () => void;
};

/** Official verification controls are intentionally absent for public and normal-user views. */
export function FacilityAdminActions({ isAdmin, facilityId, onPerformFieldCheck }: FacilityAdminActionsProps) {
  if (!isAdmin) return null;

  return <section className="rounded-xl border border-dashed border-[#A8C5B5] bg-[#EEF5EF] p-4" aria-label="Administrator field verification actions"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#176B5A]">Administrator / field verifier</p><div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2"><Button onClick={onPerformFieldCheck} className="h-11 min-w-0 w-full justify-center whitespace-nowrap rounded-full bg-[#176B5A] px-4 text-sm font-semibold text-white shadow-none hover:bg-[#0F5145] focus-visible:ring-[#176B5A]"><ClipboardCheck className="shrink-0" size={16} /> Perform field check</Button><Button asChild variant="outline" className="h-11 min-w-0 w-full justify-center whitespace-nowrap rounded-full border-[#176B5A] bg-[#FFFDF7] px-4 text-sm font-semibold text-[#176B5A] shadow-none hover:bg-[#176B5A] hover:text-white focus-visible:ring-[#176B5A]"><a href={`/admin/toilets?edit=${encodeURIComponent(facilityId)}`}><Pencil className="shrink-0" size={16} /> Edit toilet</a></Button></div></section>;
}
