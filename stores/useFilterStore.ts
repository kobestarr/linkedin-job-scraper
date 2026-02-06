'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DateRange, CompanySize, Seniority, EmploymentType, PayRange, ViewMode, AutoRefreshInterval, SortOption } from '@/types';

interface FilterState {
  // Search
  searchQuery: string;
  location: string;

  // Filters
  dateRange: DateRange | null;
  companySizes: CompanySize[];
  seniorities: Seniority[];
  employmentTypes: EmploymentType[];
  payRanges: PayRange[];
  excludeRecruiters: boolean;
  excludeCompanies: string[];
  mustContainKeywords: boolean;

  // View
  viewMode: ViewMode;
  autoRefreshInterval: AutoRefreshInterval;
  sortBy: SortOption;

  // UI (not persisted)
  selectedJobId: string | null;

  // Actions
  setSearchQuery: (q: string) => void;
  setLocation: (loc: string) => void;
  setDateRange: (dr: DateRange | null) => void;
  toggleCompanySize: (cs: CompanySize) => void;
  toggleSeniority: (s: Seniority) => void;
  toggleEmploymentType: (et: EmploymentType) => void;
  togglePayRange: (pr: PayRange) => void;
  setExcludeRecruiters: (val: boolean) => void;
  setExcludeCompanies: (list: string[]) => void;
  setMustContainKeywords: (val: boolean) => void;
  setViewMode: (vm: ViewMode) => void;
  setAutoRefreshInterval: (ari: AutoRefreshInterval) => void;
  setSortBy: (s: SortOption) => void;
  setSelectedJobId: (id: string | null) => void;
  resetFilters: () => void;
  activeFilterCount: () => number;
}

const DEFAULT_FILTERS = {
  searchQuery: '',
  location: '',
  dateRange: null as DateRange | null,
  companySizes: [] as CompanySize[],
  seniorities: [] as Seniority[],
  employmentTypes: [] as EmploymentType[],
  payRanges: [] as PayRange[],
  excludeRecruiters: true,
  excludeCompanies: [] as string[],
  mustContainKeywords: true,
  viewMode: 'list' as ViewMode,
  autoRefreshInterval: 'off' as AutoRefreshInterval,
  sortBy: 'recent' as SortOption,
  selectedJobId: null as string | null,
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_FILTERS,

      setSearchQuery: (q) => set({ searchQuery: q }),
      setLocation: (loc) => set({ location: loc }),
      setDateRange: (dr) => set({ dateRange: dr }),

      toggleCompanySize: (cs) =>
        set((state) => ({
          companySizes: state.companySizes.includes(cs)
            ? state.companySizes.filter((s) => s !== cs)
            : [...state.companySizes, cs],
        })),

      toggleSeniority: (s) =>
        set((state) => ({
          seniorities: state.seniorities.includes(s)
            ? state.seniorities.filter((x) => x !== s)
            : [...state.seniorities, s],
        })),

      toggleEmploymentType: (et) =>
        set((state) => ({
          employmentTypes: state.employmentTypes.includes(et)
            ? state.employmentTypes.filter((x) => x !== et)
            : [...state.employmentTypes, et],
        })),

      togglePayRange: (pr) =>
        set((state) => ({
          payRanges: state.payRanges.includes(pr)
            ? state.payRanges.filter((x) => x !== pr)
            : [...state.payRanges, pr],
        })),

      setExcludeRecruiters: (val) => set({ excludeRecruiters: val }),
      setExcludeCompanies: (list) => set({ excludeCompanies: list }),
      setMustContainKeywords: (val) => set({ mustContainKeywords: val }),
      setViewMode: (vm) => set({ viewMode: vm }),
      setAutoRefreshInterval: (ari) => set({ autoRefreshInterval: ari }),
      setSortBy: (s) => set({ sortBy: s }),
      setSelectedJobId: (id) => set({ selectedJobId: id }),

      resetFilters: () =>
        set({
          location: DEFAULT_FILTERS.location,
          dateRange: DEFAULT_FILTERS.dateRange,
          companySizes: DEFAULT_FILTERS.companySizes,
          seniorities: DEFAULT_FILTERS.seniorities,
          employmentTypes: DEFAULT_FILTERS.employmentTypes,
          payRanges: DEFAULT_FILTERS.payRanges,
          excludeRecruiters: DEFAULT_FILTERS.excludeRecruiters,
          excludeCompanies: DEFAULT_FILTERS.excludeCompanies,
          mustContainKeywords: DEFAULT_FILTERS.mustContainKeywords,
          sortBy: DEFAULT_FILTERS.sortBy,
        }),

      activeFilterCount: () => {
        const state = get();
        let count = 0;
        if (state.location) count++;
        if (state.dateRange) count++;
        if (state.companySizes.length > 0) count++;
        if (state.seniorities.length > 0) count++;
        if (state.employmentTypes.length > 0) count++;
        if (state.payRanges.length > 0) count++;
        if (!state.excludeRecruiters) count++;
        if (!state.mustContainKeywords) count++;
        if (state.excludeCompanies.length > 0) count++;
        return count;
      },
    }),
    {
      name: 'ljip-filters',
      partialize: (state) => ({
        location: state.location,
        dateRange: state.dateRange,
        companySizes: state.companySizes,
        seniorities: state.seniorities,
        employmentTypes: state.employmentTypes,
        payRanges: state.payRanges,
        excludeRecruiters: state.excludeRecruiters,
        excludeCompanies: state.excludeCompanies,
        mustContainKeywords: state.mustContainKeywords,
        viewMode: state.viewMode,
        autoRefreshInterval: state.autoRefreshInterval,
        sortBy: state.sortBy,
      }),
      version: 3,
      migrate: () => DEFAULT_FILTERS,
    }
  )
);
