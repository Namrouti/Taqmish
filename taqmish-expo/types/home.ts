import type { WardrobeItem } from '@/hooks/use-wardrobe-items';

export type OutfitSlot = 'Tops' | 'Bottoms' | 'Shoes' | 'Accessories' | 'Bags' | 'Watch' | 'Hat';

export type HomeItem = WardrobeItem & {
  category?: string;
  titel?: string;
  type?: string;
};

export type DisplayHomeItem = HomeItem & {
  displayUri?: string;
  slot: OutfitSlot;
};

export type SelectedOutfit = Partial<Record<OutfitSlot, HomeItem | null>>;

export type OutfitPlacement = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type CanvasBounds = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type GenderMode = 'All' | 'Male' | 'Female';
export type CalendarTimeSlot = 'Morning' | 'Evening' | 'Night';
export type SourceFilter = 'Mixed' | 'My Closet' | 'Store';
export type StyleFilter = 'All' | string;
export type SeasonFilter = 'All' | string;
export type SizeFilter = 'All' | string;
export type AgeFilter = 'All' | string;

export type SuggestedOutfit = {
  colorSummary: string[];
  id: string;
  label: string;
  outfit: SelectedOutfit;
  score: number;
};
