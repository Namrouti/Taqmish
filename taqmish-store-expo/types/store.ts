export type StoreProfile = {
  address?: string;
  city?: string;
  description?: string;
  inventoryCount?: number;
  logoUrl?: string;
  ownerEmail?: string;
  ownerId: string;
  phone?: string;
  status?: 'draft' | 'pending' | 'approved';
  storeName: string;
  storeType?: 'clothing' | 'shoes' | 'accessories' | 'mixed';
  website?: string;
};

export type StoreSection = {
  iconKey?: string;
  id: string;
  name: string;
  ownerId: string;
  parentSectionId?: string | null;
  parentSectionName?: string | null;
  pathLabel?: string;
  types?: string[];
};

export type StoreItem = {
  bodyPart?: string;
  bodyPartKey?: string;
  colors?: string[];
  createdAt?: string;
  currency?: string;
  description?: string;
  filePath?: string;
  genderKey?: string;
  id: string;
  images?: string[];
  ownerId: string;
  price?: number;
  seasonTags?: string[];
  sectionId?: string;
  sectionName?: string;
  sectionPath?: string;
  sizeOptions?: string[];
  sku?: string;
  source: 'store';
  status?: 'draft' | 'published';
  stock?: number;
  storeId: string;
  storeName?: string;
  styleTags?: string[];
  subParts?: string;
  subType?: string;
  title: string;
};

export type StoreOrder = {
  createdAt?: string;
  customerName?: string;
  id: string;
  itemCount?: number;
  status?: 'new' | 'confirmed' | 'shipped' | 'completed';
  total?: number;
};
