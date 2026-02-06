/**
 * LocalStorage Implementation
 *
 * MVP storage using browser localStorage.
 * Data persists across sessions but is browser-specific.
 */

import type { Job, JobFilters, FilterPreset, Theme } from '@/types';
import type { StorageProvider } from './types';
import { DEFAULT_PRESETS } from '@/types';

const STORAGE_KEYS = {
  JOBS: 'ljip_jobs',
  THEMES: 'ljip_themes',
  ACTIVE_THEME: 'ljip_active_theme',
  PRESETS: 'ljip_presets',
} as const;

export class LocalStorageProvider implements StorageProvider {
  readonly id = 'local-storage';
  readonly name = 'Browser Storage';

  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  // Job storage
  async getJobs(filters?: JobFilters): Promise<Job[]> {
    if (!this.isClient()) return [];

    const data = localStorage.getItem(STORAGE_KEYS.JOBS);
    let jobs: Job[] = data ? JSON.parse(data) : [];

    if (!filters) return jobs;

    // Apply filters client-side
    if (filters.exclude?.length) {
      jobs = jobs.filter(
        (job) =>
          !filters.exclude!.some((keyword) =>
            job.title.toLowerCase().includes(keyword.toLowerCase())
          )
      );
    }

    if (filters.companyExclude?.length) {
      jobs = jobs.filter(
        (job) =>
          !filters.companyExclude!.some((company) =>
            job.company.toLowerCase().includes(company.toLowerCase())
          )
      );
    }

    return jobs;
  }

  async saveJobs(jobs: Job[]): Promise<void> {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
  }

  async clearJobs(): Promise<void> {
    if (!this.isClient()) return;
    localStorage.removeItem(STORAGE_KEYS.JOBS);
  }

  // Theme storage
  async getThemes(): Promise<Theme[]> {
    if (!this.isClient()) return [];

    const data = localStorage.getItem(STORAGE_KEYS.THEMES);
    return data ? JSON.parse(data) : [];
  }

  async saveTheme(theme: Theme): Promise<void> {
    if (!this.isClient()) return;

    const themes = await this.getThemes();
    const index = themes.findIndex((t) => t.id === theme.id);

    if (index >= 0) {
      themes[index] = theme;
    } else {
      themes.push(theme);
    }

    localStorage.setItem(STORAGE_KEYS.THEMES, JSON.stringify(themes));
  }

  async deleteTheme(id: string): Promise<void> {
    if (!this.isClient()) return;

    const themes = await this.getThemes();
    const filtered = themes.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.THEMES, JSON.stringify(filtered));
  }

  async getActiveTheme(): Promise<Theme | null> {
    if (!this.isClient()) return null;

    const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_THEME);
    if (!id) return null;

    const themes = await this.getThemes();
    return themes.find((t) => t.id === id) || null;
  }

  async setActiveTheme(id: string): Promise<void> {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_THEME, id);
  }

  // Filter preset storage
  async getPresets(): Promise<FilterPreset[]> {
    if (!this.isClient()) return DEFAULT_PRESETS;

    const data = localStorage.getItem(STORAGE_KEYS.PRESETS);
    const customPresets: FilterPreset[] = data ? JSON.parse(data) : [];

    // Merge default presets with custom presets
    return [...DEFAULT_PRESETS, ...customPresets];
  }

  async savePreset(preset: FilterPreset): Promise<void> {
    if (!this.isClient()) return;

    const data = localStorage.getItem(STORAGE_KEYS.PRESETS);
    const presets: FilterPreset[] = data ? JSON.parse(data) : [];

    const index = presets.findIndex((p) => p.id === preset.id);
    if (index >= 0) {
      presets[index] = { ...preset, isCustom: true };
    } else {
      presets.push({ ...preset, isCustom: true });
    }

    localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
  }

  async deletePreset(id: string): Promise<void> {
    if (!this.isClient()) return;

    const data = localStorage.getItem(STORAGE_KEYS.PRESETS);
    const presets: FilterPreset[] = data ? JSON.parse(data) : [];
    const filtered = presets.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(filtered));
  }

  // Generic key-value storage
  async get<T>(key: string): Promise<T | null> {
    if (!this.isClient()) return null;

    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (!this.isClient()) return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    if (!this.isClient()) return;
    localStorage.removeItem(key);
  }
}
