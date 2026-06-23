export interface Brand {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  logoUrl: string | null;
  countryOfOrigin: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  branchId: string;
  _count?: { products: number };
}
