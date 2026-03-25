"use client";

import { useStore } from "@/lib/store";
import { convertPrice, priceLabel } from "@/lib/pricing";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GalleryModal from "@/components/GalleryModal";

const transportIcons: Record<string, string> = {
  tube: "🚇",
  bus: "🚌",
  bike: "🚲",
  walk: "🚶",
};

export default function LikedPage() {
  const { likes, removeLike, updateNote, addUserPhoto, removeUserPhoto, pricingMode } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [galleryListingId, setGalleryListingId] = useState<string | null>(null);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const galleryItem = galleryListingId ? likes.find((l) => l.listing.id === galleryListingId) : null;

  function handleFileUpload(listingId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          addUserPhoto(listingId, reader.result);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  if (likes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-50">
          <svg className="h-8 w-8 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">No likes yet</h2>
        <p className="text-sm text-gray-400 max-w-xs">
          Swipe right on listings you like. They&apos;ll appear here with contact details and your notes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4">
      <div className="space-y-3">
        <AnimatePresence>
          {likes.map((item) => {
            const l = item.listing;
            const isExpanded = expandedId === l.id;
            const isEditingNote = editingNoteId === l.id;
            const userPhotos = item.userPhotos ?? [];

            return (
              <motion.div
                key={l.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -200 }}
                className="overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm"
              >
                {/* Main row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : l.id)}
                  className="flex w-full items-start gap-3 p-4 text-left"
                >
                  {/* Thumbnail — opens gallery */}
                  <div
                    className="relative h-16 w-16 rounded-xl overflow-hidden flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGalleryListingId(l.id);
                      setGalleryInitialIndex(0);
                    }}
                  >
                    <img
                      src={l.images[0]}
                      alt={l.title}
                      className="h-full w-full object-cover"
                    />
                    {l.images.length > 1 && (
                      <div className="absolute bottom-0.5 right-0.5 rounded-sm bg-black/60 px-1 text-[9px] font-bold text-white">
                        {l.images.length + userPhotos.length}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {l.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      £{convertPrice(l.price, pricingMode, l.bedrooms)}{priceLabel(pricingMode)} · {l.location}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="inline-block rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600">
                        {l.type === "hall" ? "Student Hall" : l.type.charAt(0).toUpperCase() + l.type.slice(1)}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {l.bedrooms === 0 ? "Studio" : `${l.bedrooms} bed`} · {l.bathrooms} bath
                      </span>
                    </div>
                    {item.note && !isExpanded && (
                      <p className="mt-1.5 text-[11px] text-violet-500 truncate">
                        📝 {item.note}
                      </p>
                    )}
                  </div>
                  <svg
                    className={`h-4 w-4 text-gray-300 flex-shrink-0 mt-1 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="border-t border-gray-50 px-4 pb-4"
                  >
                    {/* Image strip */}
                    <div className="flex gap-2 overflow-x-auto pt-3 pb-2 -mx-1 px-1">
                      {l.images.map((src, i) => (
                        <button
                          key={`listing-${i}`}
                          onClick={() => {
                            setGalleryListingId(l.id);
                            setGalleryInitialIndex(i);
                          }}
                          className="flex-shrink-0 h-20 w-20 rounded-xl overflow-hidden"
                        >
                          <img src={src} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                      {userPhotos.map((src, i) => (
                        <button
                          key={`user-${i}`}
                          onClick={() => {
                            setGalleryListingId(l.id);
                            setGalleryInitialIndex(l.images.length + i);
                          }}
                          className="relative flex-shrink-0 h-20 w-20 rounded-xl overflow-hidden"
                        >
                          <img src={src} alt="" className="h-full w-full object-cover" />
                          <div className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-violet-500 border border-white" />
                        </button>
                      ))}
                      {/* Upload button */}
                      <button
                        onClick={() => fileRefs.current[l.id]?.click()}
                        className="flex-shrink-0 h-20 w-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-violet-400 hover:text-violet-500 transition-colors text-gray-300"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-[9px] font-medium">Upload</span>
                      </button>
                      <input
                        ref={(el) => { fileRefs.current[l.id] = el; }}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={(e) => handleFileUpload(l.id, e)}
                        className="hidden"
                      />
                    </div>

                    {/* Transport */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1 mb-3">
                      {l.transport.map((t) => (
                        <div
                          key={t.mode}
                          className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2"
                        >
                          <span className="text-sm">{transportIcons[t.mode]}</span>
                          <div>
                            <span className="text-xs font-semibold text-gray-800">{t.duration}</span>
                            {t.station && (
                              <span className="block text-[10px] text-gray-400 truncate">{t.station}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">
                      {l.description}
                    </p>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {l.amenities.map((a) => (
                        <span
                          key={a}
                          className="rounded-full border border-gray-200 px-2 py-0.5 text-[10px] text-gray-500"
                        >
                          {a}
                        </span>
                      ))}
                    </div>

                    {/* Contact */}
                    <div className="rounded-xl bg-violet-50 p-3 mb-3">
                      <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider mb-1">
                        Contact
                      </p>
                      <p className="text-sm font-medium text-gray-900">{l.landlordName}</p>
                      <p className="text-xs text-gray-600">{l.landlordEmail}</p>
                      <p className="text-xs text-gray-600">{l.landlordPhone}</p>
                    </div>

                    {/* Note */}
                    <div className="mb-3">
                      {isEditingNote ? (
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
                          className="w-full text-left rounded-xl border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-400 hover:border-violet-300 hover:text-violet-500 transition-colors"
                        >
                          {item.note ? `📝 ${item.note}` : "+ Add a note..."}
                        </button>
                      )}
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeLike(l.id)}
                      className="w-full rounded-xl border border-red-100 py-2 text-xs font-medium text-red-400 hover:bg-red-50 transition-colors"
                    >
                      Remove from liked
                    </button>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Fullscreen gallery */}
      {galleryItem && (
        <GalleryModal
          listingImages={galleryItem.listing.images}
          userPhotos={galleryItem.userPhotos ?? []}
          initialIndex={galleryInitialIndex}
          onClose={() => setGalleryListingId(null)}
          onUpload={(dataUrl) => addUserPhoto(galleryItem.listing.id, dataUrl)}
          onRemoveUserPhoto={(i) => removeUserPhoto(galleryItem.listing.id, i)}
        />
      )}
    </div>
  );
}
