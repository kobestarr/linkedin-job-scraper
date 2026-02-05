'use client';

import { motion } from 'framer-motion';
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
          <motion.div
            key={`skeleton-${i}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: i * 0.05,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            <SkeletonCard />
          </motion.div>
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
