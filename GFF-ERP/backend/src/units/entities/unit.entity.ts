export interface Unit {
  id: string;
  name: string;
  abbreviation: string;
  code: string | null;
  conversionFactor: number;
  baseUnitId: string | null;
  isBaseUnit: boolean;
  type: string | null;
  decimalPlaces: number;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  branchId: string;
  baseUnit?: Unit | null;
  derivedUnits?: Unit[];
}
