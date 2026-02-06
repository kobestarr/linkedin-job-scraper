'use client';

import { JobCard } from './JobCard';
import { JobCardRich } from './JobCardRich';
import { SkeletonCard } from '@/components/ui/GlassPanel';
import { useSelectionStore } from '@/stores/useSelectionStore';
import type { Job, ViewMode } from '@/types';

interface JobListProps {
  jobs: Job[];
  isLoading: boolean;
  skeletonCount?: number;
  viewMode?: ViewMode;
  selectedJobId?: string | null;
  onSelectJob?: (id: string) => void;
}

export function JobList({
  jobs,
  isLoading,
  skeletonCount = 6,
  viewMode = 'list',
  selectedJobId,
  onSelectJob,
}: JobListProps) {
  const { selectedIds, lastSelectedId, toggleSelection, selectRange } = useSelectionStore();

  const allIds = jobs.map((j) => j.id);

  const handleCheck = (id: string, shiftKey: boolean) => {
    if (shiftKey && lastSelectedId) {
      selectRange(lastSelectedId, id, allIds);
    } else {
      toggleSelection(id);
    }
  };

  if (isLoading) {
    return (
      <div className={viewMode === 'card' ? 'job-card-grid' : 'space-y-3 sm:space-y-4'}>
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

  if (viewMode === 'card') {
    return (
      <div className="job-card-grid">
        {jobs.map((job, index) => (
          <JobCardRich
            key={job.id}
            job={job}
            index={index}
            onSelect={onSelectJob}
            isSelected={selectedJobId === job.id}
            isChecked={selectedIds.has(job.id)}
            onCheck={handleCheck}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {jobs.map((job, index) => (
        <JobCard
          key={job.id}
          job={job}
          index={index}
          onSelect={onSelectJob}
          isSelected={selectedJobId === job.id}
          isChecked={selectedIds.has(job.id)}
          onCheck={handleCheck}
        />
      ))}
    </div>
  );
}
