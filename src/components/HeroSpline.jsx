import React from 'react';
import Spline from '@splinetool/react-spline';

export default function HeroSpline() {
  return (
    <section className="relative h-[320px] w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
      <Spline 
        scene="https://prod.spline.design/IKzHtP5ThSO83edK/scene.splinecode" 
        style={{ width: '100%', height: '100%' }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/40 dark:from-neutral-950 dark:to-neutral-950/40" />
      <div className="pointer-events-none absolute inset-0 flex items-end justify-between p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Your Finances, Simplified</h1>
          <p className="mt-1 max-w-xl text-sm text-neutral-600 dark:text-neutral-400">Offline-first personal finance tracker with budgets, goals, and rich insights. Import/export to move data across devices for free.</p>
        </div>
        <div className="hidden rounded-full bg-white/70 px-3 py-1 text-xs backdrop-blur md:block dark:bg-neutral-900/60 dark:text-neutral-300">3D cover by Spline</div>
      </div>
    </section>
  );
}
