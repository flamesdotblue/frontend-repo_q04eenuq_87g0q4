import React from 'react';
import Spline from '@splinetool/react-spline';

const HeroSpline = () => {
  return (
    <section className="relative w-full h-[360px] sm:h-[420px] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Spline
        scene="https://prod.spline.design/41MGRk-UDPKO-l6W/scene.splinecode"
        style={{ width: '100%', height: '100%' }}
      />

      {/* gradient overlay that doesn't block interactions with the 3D scene */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/20 to-transparent" />

      <div className="absolute inset-0 flex flex-col items-start justify-end p-6 sm:p-10">
        <span className="inline-flex items-center gap-2 text-xs sm:text-sm bg-white/10 backdrop-blur px-3 py-1.5 rounded-full border border-white/15 shadow">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          Offline-first • Private by design
        </span>
        <h1 className="mt-3 text-2xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
          Your Personal Finance, Simplified
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-2xl">
          Track income, expenses, and investments locally. Installable PWA that works entirely offline.
        </p>
      </div>
    </section>
  );
};

export default HeroSpline;
