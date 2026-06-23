export enum CostCenterType {
  BRANCH = 'BRANCH',
  DEPARTMENT = 'DEPARTMENT',
  PROJECT = 'PROJECT',
  OTHER = 'OTHER',
}

export enum CostCenterStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  nameAr: string | null;
  type: CostCenterType;
  parentId: string | null;
  branchId: string;
  description: string | null;
  budgetAmount: number | null;
  status: CostCenterStatus;
  level: number;
  path: string;
  children?: CostCenter[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface CostCenterAllocation {
  costCenterId: string;
  costCenterName: string;
  totalDebits: number;
  totalCredits: number;
  netAmount: number;
  percentageOfTotal: number;
}
