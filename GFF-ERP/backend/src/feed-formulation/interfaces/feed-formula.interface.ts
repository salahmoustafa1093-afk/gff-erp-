import { Decimal } from '@prisma/client/runtime/library';

export enum FeedType {
  BROILER_STARTER = 'BROILER_STARTER',
  BROILER_GROWER = 'BROILER_GROWER',
  BROILER_FINISHER = 'BROILER_FINISHER',
  LAYER = 'LAYER',
  BREEDER = 'BREEDER',
  PREMIX = 'PREMIX',
  OTHER = 'OTHER',
}

export enum FormulaStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export interface IFormulaIngredient {
  id?: string;
  productId: string;
  productName?: string;
  percentage: Decimal | number;
  minPercentage?: Decimal | number | null;
  maxPercentage?: Decimal | number | null;
  costPerKg?: Decimal | number | null;
  proteinContent?: Decimal | number | null;
  energyContent?: Decimal | number | null;
  fiberContent?: Decimal | number | null;
  calciumContent?: Decimal | number | null;
  phosphorusContent?: Decimal | number | null;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INutritionalTarget {
  id?: string;
  formulaId?: string;
  proteinTarget: Decimal | number | null;
  energyTarget: Decimal | number | null;
  fiberTarget: Decimal | number | null;
  calciumTarget: Decimal | number | null;
  phosphorusTarget: Decimal | number | null;
  moistureTarget: Decimal | number | null;
  fatTarget: Decimal | number | null;
  lysineTarget: Decimal | number | null;
  methionineTarget: Decimal | number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INutritionalActual {
  proteinActual: Decimal | number;
  energyActual: Decimal | number;
  fiberActual: Decimal | number;
  calciumActual: Decimal | number;
  phosphorusActual: Decimal | number;
  moistureActual: Decimal | number;
  fatActual: Decimal | number;
  lysineActual: Decimal | number;
  methionineActual: Decimal | number;
}

export interface INutritionalComparison {
  protein: { target: number | null; actual: number; variance: number | null };
  energy: { target: number | null; actual: number; variance: number | null };
  fiber: { target: number | null; actual: number; variance: number | null };
  calcium: { target: number | null; actual: number; variance: number | null };
  phosphorus: { target: number | null; actual: number; variance: number | null };
  moisture: { target: number | null; actual: number; variance: number | null };
  fat: { target: number | null; actual: number; variance: number | null };
  lysine: { target: number | null; actual: number; variance: number | null };
  methionine: { target: number | null; actual: number; variance: number | null };
}

export interface IFormulaCostBreakdown {
  ingredientId: string;
  productName: string;
  percentage: number;
  costPerKg: number;
  contributionPerKg: number;
  percentageOfTotalCost: number;
}

export interface IFormulaCostAnalysis {
  totalCostPerKg: number;
  breakdown: IFormulaCostBreakdown[];
  totalPercentage: number;
  isBalanced: boolean;
}

export interface IFormulaVersion {
  id: string;
  formulaId: string;
  versionNumber: number;
  versionNotes: string | null;
  code: string;
  name: string;
  feedType: FeedType;
  ingredientsJson: string;
  nutritionalTargetJson: string;
  totalCostPerKg: Decimal | number | null;
  createdBy: string;
  createdAt: Date;
}

export interface IFeedFormula {
  id: string;
  code: string;
  name: string;
  feedType: FeedType;
  description: string | null;
  status: FormulaStatus;
  versionNumber: number;
  isDefault: boolean;
  totalCostPerKg: Decimal | number | null;
  branchId: string | null;
  ingredients: IFormulaIngredient[];
  nutritionalTarget: INutritionalTarget | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFormulaComparisonResult {
  formulaId: string;
  formulaName: string;
  formulaCode: string;
  feedType: FeedType;
  totalCostPerKg: number;
  ingredients: Array<{
    productId: string;
    productName: string;
    percentage: number;
    costPerKg: number;
  }>;
  nutritionalActual: INutritionalActual;
}
