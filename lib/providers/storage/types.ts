/**
 * StorageProvider Interface
 *
 * Abstracts data persistence. MVP uses localStorage, but can be swapped
 * to Supabase, Postgres, or any database without touching UI code.
 */

import type { Job, JobFilters, FilterPreset, Theme } from '@/types';

export interface StorageProvider {
  /**
   * Unique identifier for this provider
   */
  readonly id: string;

  /**
   * Human-readable name
   */
  readonly name: string;

  // Job storage
  getJobs(filters?: JobFilters): Promise<Job[]>;
  saveJobs(jobs: Job[]): Promise<void>;
  clearJobs(): Promise<void>;

  // Theme storage
  getThemes(): Promise<Theme[]>;
  saveTheme(theme: Theme): Promise<void>;
  deleteTheme(id: string): Promise<void>;
  getActiveTheme(): Promise<Theme | null>;
  setActiveTheme(id: string): Promise<void>;

  // Filter preset storage
  getPresets(): Promise<FilterPreset[]>;
  savePreset(preset: FilterPreset): Promise<void>;
  deletePreset(id: string): Promise<void>;

  // Generic key-value storage
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}
