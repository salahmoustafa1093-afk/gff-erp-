export interface Branch {
  id: string;
  name: string;
  code: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  managerId: string | null;
  isActive: boolean;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  _count?: {
    warehouses: number;
    employees: number;
    salesOrders: number;
  };
}
