"use client";

import { useStore } from "@/lib/store";
import { convertPrice, priceLabel } from "@/lib/pricing";
import { ApplicationStatus } from "@/types/listing";
import { motion } from "framer-motion";
import { useState } from "react";

const statusConfig: Record<
  ApplicationStatus,
  { label: string; color: string; bg: string; step: number }
> = {
  saved: { label: "Saved", color: "text-gray-500", bg: "bg-gray-100", step: 0 },
  contacted: { label: "Contacted", color: "text-blue-600", bg: "bg-blue-50", step: 1 },
  viewing_booked: { label: "Viewing Booked", color: "text-amber-600", bg: "bg-amber-50", step: 2 },
  applied: { label: "Applied", color: "text-violet-600", bg: "bg-violet-50", step: 3 },
  accepted: { label: "Accepted", color: "text-emerald-600", bg: "bg-emerald-50", step: 4 },
  rejected: { label: "Rejected", color: "text-red-500", bg: "bg-red-50", step: -1 },
};

const statusOrder: ApplicationStatus[] = [
  "saved",
  "contacted",
  "viewing_booked",
  "applied",
  "accepted",
  "rejected",
];

const pipeline: ApplicationStatus[] = [
  "saved",
  "contacted",
  "viewing_booked",
  "applied",
  "accepted",
];

export default function ProgressPage() {
  const { likes, updateStatus, updateNote, pricingMode } = useStore();
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  if (likes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-50">
          <svg className="h-8 w-8 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">No applications yet</h2>
        <p className="text-sm text-gray-400 max-w-xs">
          Like some listings first, then track your application progress here.
        </p>
      </div>
    );
  }

  // Summary stats
  const counts = statusOrder.reduce((acc, s) => {
    acc[s] = likes.filter((l) => l.status === s).length;
    return acc;
  }, {} as Record<ApplicationStatus, number>);

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Saved", count: counts.saved, color: "bg-gray-400" },
          { label: "In Progress", count: counts.contacted + counts.viewing_booked + counts.applied, color: "bg-violet-500" },
          { label: "Decided", count: counts.accepted + counts.rejected, color: "bg-emerald-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white border border-gray-100 p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{s.count}</p>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <div className={`h-1.5 w-1.5 rounded-full ${s.color}`} />
              <p className="text-[11px] text-gray-400 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Listing cards with pipeline */}
      <div className="space-y-3">
        {likes.map((item) => {
          const l = item.listing;
          const cfg = statusConfig[item.status];
          const currentStep = cfg.step;

          return (
            <motion.div
              key={l.id}
              layout
              className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm"
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <img
                  src={l.images[0]}
                  alt={l.title}
                  className="h-12 w-12 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{l.title}</p>
                  <p className="text-xs text-gray-500">
                    £{convertPrice(l.price, pricingMode, l.bedrooms)}{priceLabel(pricingMode)} · {l.location}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${cfg.color} ${cfg.bg}`}>
                  {cfg.label}
                </span>
              </div>

              {/* Pipeline steps */}
              <div className="flex items-center gap-1 mb-3">
                {pipeline.map((step, i) => {
                  const stepNum = statusConfig[step].step;
                  const isActive = item.status !== "rejected" && stepNum <= currentStep;
                  const isCurrent = item.status === step;
                  return (
                    <div key={step} className="flex flex-1 items-center">
                      <div
                        className={`h-1.5 w-full rounded-full transition-colors ${
                          isActive ? "bg-violet-500" : "bg-gray-100"
                        } ${isCurrent ? "ring-2 ring-violet-200" : ""}`}
                      />
                      {i < pipeline.length - 1 && <div className="w-0.5" />}
                    </div>
                  );
                })}
              </div>

              {/* Step labels */}
              <div className="flex justify-between mb-3">
                {pipeline.map((step) => {
                  const stepNum = statusConfig[step].step;
                  const isActive = item.status !== "rejected" && stepNum <= currentStep;
                  return (
                    <span
                      key={step}
                      className={`text-[9px] font-medium ${isActive ? "text-violet-600" : "text-gray-300"}`}
                    >
                      {statusConfig[step].label}
                    </span>
                  );
                })}
              </div>

              {/* Status actions */}
              <div className="flex flex-wrap gap-1.5">
                {statusOrder.map((s) => {
                  const active = item.status === s;
                  const sc = statusConfig[s];
                  return (
                    <button
                      key={s}
                      onClick={() => updateStatus(l.id, s)}
                      className={`rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-all ${
                        active
                          ? `${sc.bg} ${sc.color} ring-1 ring-current`
                          : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                      }`}
                    >
                      {sc.label}
                    </button>
                  );
                })}
              </div>

              {/* Note */}
              <div className="mt-3">
                {editingNoteId === l.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add a note..."
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          updateNote(l.id, noteText);
                          setEditingNoteId(null);
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        updateNote(l.id, noteText);
                        setEditingNoteId(null);
                      }}
                      className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-medium text-white"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setNoteText(item.note ?? "");
                      setEditingNoteId(l.id);
                    }}
                    className="w-full text-left rounded-xl border border-dashed border-gray-200 px-3 py-2 text-[11px] text-gray-400 hover:border-violet-300 hover:text-violet-500 transition-colors"
                  >
                    {item.note ? `📝 ${item.note}` : "+ Add a note..."}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
