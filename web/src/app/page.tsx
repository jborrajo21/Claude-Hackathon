import SwipeDeck from "@/components/SwipeDeck";

export default function Home() {
  return (
    <div className="flex h-full flex-col bg-[#f8f7ff]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600">
            <span className="text-lg font-bold text-white">S</span>
          </div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">
            SwipeStay
          </h1>
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100">
          <svg
            className="h-4 w-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
        </button>
      </header>

      {/* Swipe area */}
      <main className="flex-1 relative overflow-hidden">
        <SwipeDeck />
      </main>
    </div>
  );
}
