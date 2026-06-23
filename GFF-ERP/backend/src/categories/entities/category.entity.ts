export interface Category {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  parentId: string | null;
  level: number;
  sortOrder: number;
  imageUrl: string | null;
  colorCode: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  branchId: string;
  parent?: Category | null;
  children?: Category[];
  _count?: { products: number; children: number };
}
