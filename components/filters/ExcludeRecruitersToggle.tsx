'use client';

import { useFilterStore } from '@/stores/useFilterStore';

export function ExcludeRecruitersToggle() {
  const excludeRecruiters = useFilterStore((s) => s.excludeRecruiters);
  const setExcludeRecruiters = useFilterStore((s) => s.setExcludeRecruiters);

  return (
    <button
      onClick={() => setExcludeRecruiters(!excludeRecruiters)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        excludeRecruiters
          ? 'bg-primary/20 border border-primary/40 text-primary-200'
          : 'bg-white/5 border border-white/10 text-white/40'
      }`}
      aria-pressed={excludeRecruiters}
      title={excludeRecruiters ? 'Recruiters are excluded' : 'Showing recruiter posts'}
    >
      {/* Toggle indicator */}
      <div
        className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${
          excludeRecruiters ? 'bg-primary/40' : 'bg-white/10'
        }`}
      >
        <div
          className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${
            excludeRecruiters ? 'translate-x-[18px]' : 'translate-x-[2px]'
          }`}
        />
      </div>
      <span>Exclude Recruiters</span>
    </button>
  );
}
