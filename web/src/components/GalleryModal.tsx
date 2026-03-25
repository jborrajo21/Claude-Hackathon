"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";

interface GalleryModalProps {
  listingImages: string[];
  userPhotos: string[];
  initialIndex?: number;
  onClose: () => void;
  onUpload: (dataUrl: string) => void;
  onRemoveUserPhoto: (index: number) => void;
}

export default function GalleryModal({
  listingImages,
  userPhotos,
  initialIndex = 0,
  onClose,
  onUpload,
  onRemoveUserPhoto,
}: GalleryModalProps) {
  const allImages = [...listingImages, ...userPhotos];
  const [index, setIndex] = useState(initialIndex);
  const fileRef = useRef<HTMLInputElement>(null);

  const isUserPhoto = index >= listingImages.length;
  const userPhotoIndex = index - listingImages.length;

  function prev() {
    setIndex((i) => (i > 0 ? i - 1 : allImages.length - 1));
  }
  function next() {
    setIndex((i) => (i < allImages.length - 1 ? i + 1 : 0));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          onUpload(reader.result);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] py-3">
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="text-white/60 text-sm font-medium">
            {index + 1} / {allImages.length}
            {isUserPhoto && (
              <span className="ml-2 text-violet-400 text-xs">Your photo</span>
            )}
          </span>
          <div className="flex gap-2">
            {isUserPhoto && (
              <button
                onClick={() => {
                  onRemoveUserPhoto(userPhotoIndex);
                  if (index >= allImages.length - 1) setIndex(Math.max(0, index - 1));
                }}
                className="text-red-400/80 hover:text-red-400 p-1"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="text-violet-400/80 hover:text-violet-400 p-1"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Image area */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {/* Tap zones */}
          <button
            onClick={prev}
            className="absolute left-0 top-0 bottom-0 w-1/4 z-10"
            aria-label="Previous"
          />
          <button
            onClick={next}
            className="absolute right-0 top-0 bottom-0 w-1/4 z-10"
            aria-label="Next"
          />

          {/* Arrow buttons */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white/80 backdrop-blur-sm hover:bg-white/25 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white/80 backdrop-blur-sm hover:bg-white/25 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {allImages.length > 0 && (
            <motion.img
              key={index}
              src={allImages[index]}
              alt={`Photo ${index + 1}`}
              className="max-h-full max-w-full object-contain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </div>

        {/* Thumbnail strip */}
        <div className="px-4 pb-[env(safe-area-inset-bottom)] py-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {allImages.map((src, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`relative flex-shrink-0 h-14 w-14 rounded-lg overflow-hidden transition-all ${
                  i === index ? "ring-2 ring-violet-500 opacity-100" : "opacity-50"
                }`}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
                {i >= listingImages.length && (
                  <div className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-violet-500" />
                )}
              </button>
            ))}
            {/* Upload button in strip */}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-shrink-0 h-14 w-14 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center hover:border-violet-400 transition-colors"
            >
              <svg className="h-5 w-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </motion.div>
    </AnimatePresence>
  );
}
