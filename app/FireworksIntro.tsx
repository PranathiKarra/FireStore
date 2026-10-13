
"use client";

import { useEffect, useState } from "react";

export default function FireworksIntro() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("firestore-intro-seen")) return;
      sessionStorage.setItem("firestore-intro-seen", "true");
    } catch {
      // Continue if sessionStorage is unavailable.
    }

    setVisible(true);

    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#101a2e] text-center text-[#fffaf0]"
      style={{ animation: "intro-fade-out 2.5s ease forwards" }}
    >
      <style>{`
        @keyframes intro-fade-out {
          0%, 70% { opacity: 1; }
          100% { opacity: 0; visibility: hidden; pointer-events: none; }
        }

        @keyframes burst {
          0% { transform: scale(0.1); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>

      {[20, 50, 80].map((left, i) => (
        <div
          key={left}
          className="absolute h-2 w-2 rounded-full"
          style={{
            left: `${left}%`,
            top: `${30 + (i % 2) * 15}%`,
            background: "#f3ce78",
            boxShadow:
              "0 -35px #f3ce78, 0 35px #f3ce78, 35px 0 #fff0bd, -35px 0 #fff0bd, 25px 25px #d5b56b, -25px -25px #d5b56b, 25px -25px #fff0bd, -25px 25px #fff0bd",
            animation: `burst 1.4s ease-out ${i * 0.25}s both`,
          }}
        />
      ))}

      <div className="relative z-10 px-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.4em] text-[#d5b56b]">
          Celebrate beautifully
        </p>
        <h1 className="text-5xl font-bold sm:text-7xl">
          Fire<span className="text-[#d5b56b]">Store</span>
        </h1>
        <p className="mt-4 text-sm text-[#e8e3d8] sm:text-base">
          Light up your celebrations ✨
        </p>
      </div>

      <button
        onClick={() => setVisible(false)}
        className="absolute bottom-8 right-6 z-20 rounded-full border border-white/25 px-4 py-2 text-xs text-white"
      >
        Skip intro →
      </button>
    </div>
  );
}
