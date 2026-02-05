'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface GlassPanelProps extends Omit<HTMLMotionProps<'div'>, 'ref' | 'children'> {
  variant?: 'default' | 'subtle' | 'card';
  animate?: boolean;
  delay?: number;
  children?: React.ReactNode;
}

/**
 * GlassPanel - Core glassmorphism container component
 *
 * Variants:
 * - default: Standard glass panel with blur and border
 * - subtle: Lighter glass effect for nested elements
 * - card: Interactive card with hover lift effect
 */
export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, variant = 'default', animate = true, delay = 0, children, initial, animate: animateProp, transition, ...props }, ref) => {
    const baseClasses = {
      default: 'glass',
      subtle: 'glass-subtle',
      card: 'glass-card',
    };

    const content = (
      <div
        ref={ref}
        className={cn(baseClasses[variant], className)}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      >
        {children}
      </div>
    );

    if (!animate) {
      return content;
    }

    return (
      <motion.div
        // Apply user-provided animation props first (as fallbacks), then our defaults
        initial={initial ?? { opacity: 0, y: 20 }}
        animate={animateProp ?? { opacity: 1, y: 0 }}
        transition={transition ?? {
          duration: 0.4,
          delay,
          ease: [0.34, 1.56, 0.64, 1], // Spring-like easing
        }}
        className={cn(baseClasses[variant], className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassPanel.displayName = 'GlassPanel';

/**
 * GlassCard - Interactive glass card with hover effects
 */
export function GlassCard({
  className,
  children,
  onClick,
  whileHover,
  whileTap,
  ...props
}: GlassPanelProps & { onClick?: () => void }) {
  return (
    <motion.div
      className={cn('glass-card cursor-pointer', className)}
      whileHover={whileHover ?? { scale: 1.01, y: -4 }}
      whileTap={whileTap ?? { scale: 0.99 }}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Skeleton loader with shimmer effect
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

/**
 * SkeletonCard - Job card loading state
 */
export function SkeletonCard() {
  return (
    <div className="glass p-5">
      <div className="flex items-start gap-4">
        {/* Logo placeholder */}
        <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />

        <div className="flex-1 min-w-0">
          {/* Company name */}
          <Skeleton className="h-4 w-32 mb-2" />
          {/* Job title */}
          <Skeleton className="h-5 w-48 mb-3" />
          {/* Location & date */}
          <div className="flex gap-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
