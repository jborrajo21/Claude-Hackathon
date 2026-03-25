"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Listing } from "@/types/listing";
import { useState } from "react";

interface NoteModalProps {
  listing: Listing;
  onSubmit: (note: string) => void;
  onSkip: () => void;
}

export default function NoteModal({ listing, onSubmit, onSkip }: NoteModalProps) {
  const [note, setNote] = useState("");

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-md mx-4 mb-4 sm:mb-0 rounded-3xl bg-white p-6 shadow-2xl"
          initial={{ y: 100, scale: 0.95 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 100, opacity: 0 }}
        >
          {/* Success header */}
          <div className="text-center mb-5">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <span className="text-2xl">💜</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Liked!</h3>
            <p className="text-sm text-gray-500 mt-1">
              {listing.title}
            </p>
          </div>

          {/* Contact reveal */}
          <div className="rounded-2xl bg-violet-50 p-4 mb-5">
            <h4 className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">
              Contact Details
            </h4>
            <p className="text-sm font-medium text-gray-900">{listing.landlordName}</p>
            <p className="text-sm text-gray-600">{listing.landlordEmail}</p>
            <p className="text-sm text-gray-600">{listing.landlordPhone}</p>
          </div>

          {/* Note input */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Add a note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Great location, ask about move-in date..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onSkip}
              className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
            >
              Skip
            </button>
            <button
              onClick={() => onSubmit(note)}
              className="flex-1 rounded-2xl bg-violet-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
            >
              Save Note
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
