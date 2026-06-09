import type { ClosetItem } from '@/hooks/use-closet-items';
import type { ClosetSectionRecord } from '@/hooks/use-closet-sections';

export type ClosetFilter = 'All' | 'Top' | 'Bottom' | 'Shoes' | 'Accessories' | 'Bag';
export type CapturedType = 'Top' | 'Bottom' | 'Shoes' | 'Accessories' | 'Bag';

export type DisplaySection = ClosetSectionRecord & {
  id: string;
  iconKey?: string;
  level: number;
  name: string;
  parentSectionId?: string;
  pathLabel: string;
  types: CapturedType[];
};

export type ClosetShelfGroup = {
  id: string;
  iconKey?: string;
  itemCount: number;
  items: ClosetItem[];
  label: string;
  pathLabel?: string;
};

export type SectionDialogMode = 'create' | 'edit';
export type ClosetViewMode = 'items' | 'outfits';
export type OutfitSourceFilter = 'My Closet' | 'Store' | 'Mixed';
