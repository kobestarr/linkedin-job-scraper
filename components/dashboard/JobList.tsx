'use client';

import { JobCard } from './JobCard';
import { SkeletonCard } from '@/components/ui/GlassPanel';
import type { Job } from '@/types';

interface JobListProps {
  jobs: Job[];
  isLoading: boolean;
  skeletonCount?: number;
}

export function JobList({ jobs, isLoading, skeletonCount = 6 }: JobListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="animate-slide-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <SkeletonCard />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {jobs.map((job, index) => (
        <JobCard key={job.id} job={job} index={index} />
      ))}
    </div>
  );
}
