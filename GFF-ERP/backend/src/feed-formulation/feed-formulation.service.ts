import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { AuditService } from '../audit/audit.service';
import { CreateFormulaDto } from './dto/create-formula.dto';
import { UpdateFormulaDto } from './dto/update-formula.dto';
import { FormulaFilterDto } from './dto/formula-filter.dto';
import { FormulaComparisonDto, CopyFormulaDto } from './dto/formula-cost.dto';
import {
  FeedType,
  FormulaStatus,
  IFeedFormula,
  IFormulaCostAnalysis,
  IFormulaCostBreakdown,
  INutritionalActual,
  INutritionalComparison,
  IFormulaComparisonResult,
} from './interfaces/feed-formula.interface';

@Injectable()
export class FeedFormulationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─────────────────────────────────────────────
  // CRUD Operations
  // ─────────────────────────────────────────────

  async create(dto: CreateFormulaDto, userId: string): Promise<IFeedFormula> {
    // Validate formula code uniqueness
    const existing = await this.prisma.feedFormula.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Formula code '${dto.code}' already exists`);
    }

    // Validate ingredients sum to 100%
    const totalPercentage = dto.ingredients.reduce(
      (sum, ing) => sum + ing.percentage,
      0,
    );
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new BadRequestException(
        `Ingredient percentages must sum to 100%, current sum: ${totalPercentage.toFixed(4)}%`,
      );
    }

    // Fetch product costs and nutritional data
    const enrichedIngredients = await this.enrichIngredients(dto.ingredients);

    // Calculate nutritional actuals
    const nutritionalActual = this.calculateNutritionalActual(enrichedIngredients);

    // Calculate total cost per KG
    const costAnalysis = this.calculateCostAnalysis(enrichedIngredients);

    const result = await this.prisma.$transaction(async (tx) => {
      // If setting as default, unset any existing default for this feed type
      if (dto.isDefault) {
        await tx.feedFormula.updateMany({
          where: {
            feedType: dto.feedType,
            isDefault: true,
            branchId: dto.branchId || null,
          },
          data: { isDefault: false },
        });
      }

      const formula = await tx.feedFormula.create({
        data: {
          code: dto.code,
          name: dto.name,
          feedType: dto.feedType,
          description: dto.description || null,
          status: FormulaStatus.ACTIVE,
          versionNumber: 1,
          isDefault: dto.isDefault || false,
          totalCostPerKg: new Decimal(costAnalysis.totalCostPerKg),
          branchId: dto.branchId || null,
          createdBy: userId,
          proteinActual: nutritionalActual.proteinActual,
          energyActual: nutritionalActual.energyActual,
          fiberActual: nutritionalActual.fiberActual,
          calciumActual: nutritionalActual.calciumActual,
          phosphorusActual: nutritionalActual.phosphorusActual,
          moistureActual: nutritionalActual.moistureActual,
          fatActual: nutritionalActual.fatActual,
          lysineActual: nutritionalActual.lysineActual,
          methionineActual: nutritionalActual.methionineActual,
          ingredients: {
            create: enrichedIngredients.map((ing, idx) => ({
              productId: ing.productId,
              percentage: new Decimal(ing.percentage),
              minPercentage: ing.minPercentage ? new Decimal(ing.minPercentage) : null,
              maxPercentage: ing.maxPercentage ? new Decimal(ing.maxPercentage) : null,
              costPerKg: ing.costPerKg ? new Decimal(ing.costPerKg) : null,
              proteinContent: ing.proteinContent ? new Decimal(ing.proteinContent) : null,
              energyContent: ing.energyContent ? new Decimal(ing.energyContent) : null,
              fiberContent: ing.fiberContent ? new Decimal(ing.fiberContent) : null,
              calciumContent: ing.calciumContent ? new Decimal(ing.calciumContent) : null,
              phosphorusContent: ing.phosphorusContent ? new Decimal(ing.phosphorusContent) : null,
              sortOrder: ing.sortOrder ?? idx,
            })),
          },
          nutritionalTarget: dto.nutritionalTarget
            ? {
                create: {
                  proteinTarget: dto.nutritionalTarget.proteinTarget
                    ? new Decimal(dto.nutritionalTarget.proteinTarget)
                    : null,
                  energyTarget: dto.nutritionalTarget.energyTarget
                    ? new Decimal(dto.nutritionalTarget.energyTarget)
                    : null,
                  fiberTarget: dto.nutritionalTarget.fiberTarget
                    ? new Decimal(dto.nutritionalTarget.fiberTarget)
                    : null,
                  calciumTarget: dto.nutritionalTarget.calciumTarget
                    ? new Decimal(dto.nutritionalTarget.calciumTarget)
                    : null,
                  phosphorusTarget: dto.nutritionalTarget.phosphorusTarget
                    ? new Decimal(dto.nutritionalTarget.phosphorusTarget)
                    : null,
                  moistureTarget: dto.nutritionalTarget.moistureTarget
                    ? new Decimal(dto.nutritionalTarget.moistureTarget)
                    : null,
                  fatTarget: dto.nutritionalTarget.fatTarget
                    ? new Decimal(dto.nutritionalTarget.fatTarget)
                    : null,
                  lysineTarget: dto.nutritionalTarget.lysineTarget
                    ? new Decimal(dto.nutritionalTarget.lysineTarget)
                    : null,
                  methionineTarget: dto.nutritionalTarget.methionineTarget
                    ? new Decimal(dto.nutritionalTarget.methionineTarget)
                    : null,
                },
              }
            : undefined,
        },
        include: {
          ingredients: { orderBy: { sortOrder: 'asc' } },
          nutritionalTarget: true,
        },
      });

      // Create initial version snapshot
      await tx.formulaVersion.create({
        data: {
          formulaId: formula.id,
          versionNumber: 1,
          versionNotes: 'Initial version',
          code: formula.code,
          name: formula.name,
          feedType: formula.feedType,
          ingredientsJson: JSON.stringify(enrichedIngredients),
          nutritionalTargetJson: JSON.stringify(dto.nutritionalTarget || {}),
          totalCostPerKg: formula.totalCostPerKg,
          createdBy: userId,
        },
      });

      return formula;
    });

    await this.audit.log({
      action: 'FEED_FORMULA_CREATED',
      entity: 'FeedFormula',
      entityId: result.id,
      userId,
      details: { code: result.code, name: result.name, feedType: result.feedType },
    });

    return this.mapToInterface(result);
  }

  async findAll(filter: FormulaFilterDto): Promise<{ data: IFeedFormula[]; total: number }> {
    const {
      search,
      feedType,
      status,
      branchId,
      isDefault,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filter;

    const where: any = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (feedType) where.feedType = feedType;
    if (status) where.status = status;
    if (branchId) where.branchId = branchId;
    if (isDefault !== undefined) where.isDefault = isDefault;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.feedFormula.findMany({
        where,
        include: {
          ingredients: { orderBy: { sortOrder: 'asc' } },
          nutritionalTarget: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.feedFormula.count({ where }),
    ]);

    return {
      data: data.map((f) => this.mapToInterface(f)),
      total,
    };
  }

  async findOne(id: string): Promise<IFeedFormula> {
    const formula = await this.prisma.feedFormula.findUnique({
      where: { id },
      include: {
        ingredients: { orderBy: { sortOrder: 'asc' } },
        nutritionalTarget: true,
        versions: { orderBy: { versionNumber: 'desc' }, take: 10 },
      },
    });

    if (!formula) {
      throw new NotFoundException(`Feed formula with ID '${id}' not found`);
    }

    return this.mapToInterface(formula);
  }

  async findByFeedType(feedType: FeedType, branchId?: string): Promise<IFeedFormula[]> {
    const formulas = await this.prisma.feedFormula.findMany({
      where: {
        feedType,
        status: FormulaStatus.ACTIVE,
        branchId: branchId || null,
      },
      include: {
        ingredients: { orderBy: { sortOrder: 'asc' } },
        nutritionalTarget: true,
      },
      orderBy: { isDefault: 'desc' },
    });

    return formulas.map((f) => this.mapToInterface(f));
  }

  async update(id: string, dto: UpdateFormulaDto, userId: string): Promise<IFeedFormula> {
    const existing = await this.prisma.feedFormula.findUnique({
      where: { id },
      include: { ingredients: true, nutritionalTarget: true },
    });

    if (!existing) {
      throw new NotFoundException(`Feed formula with ID '${id}' not found`);
    }

    if (existing.status === FormulaStatus.ARCHIVED) {
      throw new BadRequestException('Cannot update an archived formula');
    }

    // Check code uniqueness if changing code
    if (dto.code && dto.code !== existing.code) {
      const dup = await this.prisma.feedFormula.findUnique({
        where: { code: dto.code },
      });
      if (dup) {
        throw new ConflictException(`Formula code '${dto.code}' already exists`);
      }
    }

    let enrichedIngredients = existing.ingredients.map((i) => ({
      productId: i.productId,
      productName: '',
      percentage: Number(i.percentage),
      minPercentage: i.minPercentage ? Number(i.minPercentage) : undefined,
      maxPercentage: i.maxPercentage ? Number(i.maxPercentage) : undefined,
      costPerKg: i.costPerKg ? Number(i.costPerKg) : undefined,
      proteinContent: i.proteinContent ? Number(i.proteinContent) : undefined,
      energyContent: i.energyContent ? Number(i.energyContent) : undefined,
      fiberContent: i.fiberContent ? Number(i.fiberContent) : undefined,
      calciumContent: i.calciumContent ? Number(i.calciumContent) : undefined,
      phosphorusContent: i.phosphorusContent ? Number(i.phosphorusContent) : undefined,
      sortOrder: i.sortOrder,
    }));

    // If ingredients are being updated
    if (dto.ingredients && dto.ingredients.length > 0) {
      const totalPercentage = dto.ingredients.reduce((sum, ing) => sum + ing.percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new BadRequestException(
          `Ingredient percentages must sum to 100%, current sum: ${totalPercentage.toFixed(4)}%`,
        );
      }
      enrichedIngredients = await this.enrichIngredients(dto.ingredients);
    }

    const nutritionalActual = this.calculateNutritionalActual(enrichedIngredients);
    const costAnalysis = this.calculateCostAnalysis(enrichedIngredients);
    const newVersionNumber = existing.versionNumber + 1;

    const result = await this.prisma.$transaction(async (tx) => {
      // Handle isDefault change
      if (dto.isDefault && !existing.isDefault) {
        await tx.feedFormula.updateMany({
          where: {
            feedType: dto.feedType || existing.feedType,
            isDefault: true,
            branchId: existing.branchId,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }

      // Delete existing ingredients if replacing
      if (dto.ingredients && dto.ingredients.length > 0) {
        await tx.formulaIngredient.deleteMany({ where: { formulaId: id } });
      }

      // Delete existing nutritional target if replacing
      if (dto.nutritionalTarget) {
        await tx.nutritionalTarget.deleteMany({ where: { formulaId: id } });
      }

      const updateData: any = {
        code: dto.code,
        name: dto.name,
        feedType: dto.feedType,
        description: dto.description,
        isDefault: dto.isDefault,
        versionNumber: newVersionNumber,
        totalCostPerKg: new Decimal(costAnalysis.totalCostPerKg),
        proteinActual: nutritionalActual.proteinActual,
        energyActual: nutritionalActual.energyActual,
        fiberActual: nutritionalActual.fiberActual,
        calciumActual: nutritionalActual.calciumActual,
        phosphorusActual: nutritionalActual.phosphorusActual,
        moistureActual: nutritionalActual.moistureActual,
        fatActual: nutritionalActual.fatActual,
        lysineActual: nutritionalActual.lysineActual,
        methionineActual: nutritionalActual.methionineActual,
      };

      // Only update ingredients if provided
      if (dto.ingredients && dto.ingredients.length > 0) {
        updateData.ingredients = {
          create: enrichedIngredients.map((ing, idx) => ({
            productId: ing.productId,
            percentage: new Decimal(ing.percentage),
            minPercentage: ing.minPercentage ? new Decimal(ing.minPercentage) : null,
            maxPercentage: ing.maxPercentage ? new Decimal(ing.maxPercentage) : null,
            costPerKg: ing.costPerKg ? new Decimal(ing.costPerKg) : null,
            proteinContent: ing.proteinContent ? new Decimal(ing.proteinContent) : null,
            energyContent: ing.energyContent ? new Decimal(ing.energyContent) : null,
            fiberContent: ing.fiberContent ? new Decimal(ing.fiberContent) : null,
            calciumContent: ing.calciumContent ? new Decimal(ing.calciumContent) : null,
            phosphorusContent: ing.phosphorusContent ? new Decimal(ing.phosphorusContent) : null,
            sortOrder: ing.sortOrder ?? idx,
          })),
        };
      }

      // Only update nutritional target if provided
      if (dto.nutritionalTarget) {
        updateData.nutritionalTarget = {
          create: {
            proteinTarget: dto.nutritionalTarget.proteinTarget
              ? new Decimal(dto.nutritionalTarget.proteinTarget)
              : null,
            energyTarget: dto.nutritionalTarget.energyTarget
              ? new Decimal(dto.nutritionalTarget.energyTarget)
              : null,
            fiberTarget: dto.nutritionalTarget.fiberTarget
              ? new Decimal(dto.nutritionalTarget.fiberTarget)
              : null,
            calciumTarget: dto.nutritionalTarget.calciumTarget
              ? new Decimal(dto.nutritionalTarget.calciumTarget)
              : null,
            phosphorusTarget: dto.nutritionalTarget.phosphorusTarget
              ? new Decimal(dto.nutritionalTarget.phosphorusTarget)
              : null,
            moistureTarget: dto.nutritionalTarget.moistureTarget
              ? new Decimal(dto.nutritionalTarget.moistureTarget)
              : null,
            fatTarget: dto.nutritionalTarget.fatTarget
              ? new Decimal(dto.nutritionalTarget.fatTarget)
              : null,
            lysineTarget: dto.nutritionalTarget.lysineTarget
              ? new Decimal(dto.nutritionalTarget.lysineTarget)
              : null,
            methionineTarget: dto.nutritionalTarget.methionineTarget
              ? new Decimal(dto.nutritionalTarget.methionineTarget)
              : null,
          },
        };
      }

      const updated = await tx.feedFormula.update({
        where: { id },
        data: updateData,
        include: {
          ingredients: { orderBy: { sortOrder: 'asc' } },
          nutritionalTarget: true,
        },
      });

      // Create version snapshot
      await tx.formulaVersion.create({
        data: {
          formulaId: id,
          versionNumber: newVersionNumber,
          versionNotes: dto.versionNotes || `Version ${newVersionNumber}`,
          code: updated.code,
          name: updated.name,
          feedType: updated.feedType,
          ingredientsJson: JSON.stringify(enrichedIngredients),
          nutritionalTargetJson: JSON.stringify(dto.nutritionalTarget || {}),
          totalCostPerKg: updated.totalCostPerKg,
          createdBy: userId,
        },
      });

      return updated;
    });

    await this.audit.log({
      action: 'FEED_FORMULA_UPDATED',
      entity: 'FeedFormula',
      entityId: result.id,
      userId,
      details: { code: result.code, version: result.versionNumber },
    });

    return this.mapToInterface(result);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.feedFormula.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Feed formula with ID '${id}' not found`);
    }

    // Check if formula is used in manufacturing orders
    const moCount = await this.prisma.manufacturingOrder.count({
      where: { feedFormulaId: id },
    });
    if (moCount > 0) {
      throw new BadRequestException(
        `Cannot delete formula: used in ${moCount} manufacturing order(s). Archive instead.`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.formulaVersion.deleteMany({ where: { formulaId: id } }),
      this.prisma.formulaIngredient.deleteMany({ where: { formulaId: id } }),
      this.prisma.nutritionalTarget.deleteMany({ where: { formulaId: id } }),
      this.prisma.feedFormula.delete({ where: { id } }),
    ]);

    await this.audit.log({
      action: 'FEED_FORMULA_DELETED',
      entity: 'FeedFormula',
      entityId: id,
      userId,
      details: { code: existing.code },
    });
  }

  async archive(id: string, userId: string): Promise<IFeedFormula> {
    const existing = await this.prisma.feedFormula.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Feed formula with ID '${id}' not found`);
    }

    const result = await this.prisma.feedFormula.update({
      where: { id },
      data: { status: FormulaStatus.ARCHIVED },
      include: {
        ingredients: { orderBy: { sortOrder: 'asc' } },
        nutritionalTarget: true,
      },
    });

    await this.audit.log({
      action: 'FEED_FORMULA_ARCHIVED',
      entity: 'FeedFormula',
      entityId: id,
      userId,
      details: { code: existing.code },
    });

    return this.mapToInterface(result);
  }

  // ─────────────────────────────────────────────
  // Formula Copy / Clone
  // ─────────────────────────────────────────────

  async copyFormula(dto: CopyFormulaDto, userId: string): Promise<IFeedFormula> {
    const source = await this.prisma.feedFormula.findUnique({
      where: { id: dto.sourceFormulaId },
      include: {
        ingredients: { orderBy: { sortOrder: 'asc' } },
        nutritionalTarget: true,
      },
    });

    if (!source) {
      throw new NotFoundException(
        `Source formula with ID '${dto.sourceFormulaId}' not found`,
      );
    }

    const createDto: CreateFormulaDto = {
      code: dto.newCode,
      name: dto.newName,
      feedType: source.feedType as FeedType,
      description: source.description
        ? `${source.description} (Copy${dto.notes ? `: ${dto.notes}` : ''})`
        : `Copied from ${source.code}`,
      ingredients: source.ingredients.map((ing) => ({
        productId: ing.productId,
        percentage: Number(ing.percentage),
        minPercentage: ing.minPercentage ? Number(ing.minPercentage) : undefined,
        maxPercentage: ing.maxPercentage ? Number(ing.maxPercentage) : undefined,
        proteinContent: ing.proteinContent ? Number(ing.proteinContent) : undefined,
        energyContent: ing.energyContent ? Number(ing.energyContent) : undefined,
        fiberContent: ing.fiberContent ? Number(ing.fiberContent) : undefined,
        calciumContent: ing.calciumContent ? Number(ing.calciumContent) : undefined,
        phosphorusContent: ing.phosphorusContent ? Number(ing.phosphorusContent) : undefined,
        sortOrder: ing.sortOrder,
      })),
      nutritionalTarget: source.nutritionalTarget
        ? {
            proteinTarget: source.nutritionalTarget.proteinTarget
              ? Number(source.nutritionalTarget.proteinTarget)
              : undefined,
            energyTarget: source.nutritionalTarget.energyTarget
              ? Number(source.nutritionalTarget.energyTarget)
              : undefined,
            fiberTarget: source.nutritionalTarget.fiberTarget
              ? Number(source.nutritionalTarget.fiberTarget)
              : undefined,
            calciumTarget: source.nutritionalTarget.calciumTarget
              ? Number(source.nutritionalTarget.calciumTarget)
              : undefined,
            phosphorusTarget: source.nutritionalTarget.phosphorusTarget
              ? Number(source.nutritionalTarget.phosphorusTarget)
              : undefined,
            moistureTarget: source.nutritionalTarget.moistureTarget
              ? Number(source.nutritionalTarget.moistureTarget)
              : undefined,
            fatTarget: source.nutritionalTarget.fatTarget
              ? Number(source.nutritionalTarget.fatTarget)
              : undefined,
            lysineTarget: source.nutritionalTarget.lysineTarget
              ? Number(source.nutritionalTarget.lysineTarget)
              : undefined,
            methionineTarget: source.nutritionalTarget.methionineTarget
              ? Number(source.nutritionalTarget.methionineTarget)
              : undefined,
          }
        : undefined,
      isDefault: false,
    };

    return this.create(createDto, userId);
  }

  // ─────────────────────────────────────────────
  // Formula Comparison
  // ─────────────────────────────────────────────

  async compareFormulas(dto: FormulaComparisonDto): Promise<IFormulaComparisonResult[]> {
    if (dto.formulaIds.length < 2) {
      throw new BadRequestException('Select at least 2 formulas to compare');
    }

    const formulas = await this.prisma.feedFormula.findMany({
      where: {
        id: { in: dto.formulaIds },
      },
      include: {
        ingredients: { orderBy: { sortOrder: 'asc' } },
        nutritionalTarget: true,
      },
    });

    if (formulas.length !== dto.formulaIds.length) {
      throw new NotFoundException('One or more formulas not found');
    }

    return formulas.map((formula) => {
      const nutritionalActual = this.calculateNutritionalActual(
        formula.ingredients.map((ing) => ({
          productId: ing.productId,
          productName: '',
          percentage: Number(ing.percentage),
          proteinContent: ing.proteinContent ? Number(ing.proteinContent) : 0,
          energyContent: ing.energyContent ? Number(ing.energyContent) : 0,
          fiberContent: ing.fiberContent ? Number(ing.fiberContent) : 0,
          calciumContent: ing.calciumContent ? Number(ing.calciumContent) : 0,
          phosphorusContent: ing.phosphorusContent ? Number(ing.phosphorusContent) : 0,
          costPerKg: ing.costPerKg ? Number(ing.costPerKg) : 0,
          sortOrder: ing.sortOrder,
        })),
      );

      return {
        formulaId: formula.id,
        formulaName: formula.name,
        formulaCode: formula.code,
        feedType: formula.feedType as FeedType,
        totalCostPerKg: Number(formula.totalCostPerKg) || 0,
        ingredients: formula.ingredients.map((ing) => ({
          productId: ing.productId,
          productName: '',
          percentage: Number(ing.percentage),
          costPerKg: Number(ing.costPerKg) || 0,
        })),
        nutritionalActual,
      };
    });
  }

  // ─────────────────────────────────────────────
  // Cost & Nutritional Calculations
  // ─────────────────────────────────────────────

  async getCostAnalysis(formulaId: string): Promise<IFormulaCostAnalysis> {
    const formula = await this.prisma.feedFormula.findUnique({
      where: { id: formulaId },
      include: { ingredients: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!formula) {
      throw new NotFoundException(`Formula with ID '${formulaId}' not found`);
    }

    const ingredients = await this.enrichIngredients(
      formula.ingredients.map((ing) => ({
        productId: ing.productId,
        percentage: Number(ing.percentage),
        proteinContent: ing.proteinContent ? Number(ing.proteinContent) : undefined,
        energyContent: ing.energyContent ? Number(ing.energyContent) : undefined,
        fiberContent: ing.fiberContent ? Number(ing.fiberContent) : undefined,
        calciumContent: ing.calciumContent ? Number(ing.calciumContent) : undefined,
        phosphorusContent: ing.phosphorusContent ? Number(ing.phosphorusContent) : undefined,
        sortOrder: ing.sortOrder,
      })),
    );

    return this.calculateCostAnalysis(ingredients);
  }

  async getNutritionalComparison(formulaId: string): Promise<INutritionalComparison> {
    const formula = await this.prisma.feedFormula.findUnique({
      where: { id: formulaId },
      include: {
        ingredients: true,
        nutritionalTarget: true,
      },
    });

    if (!formula) {
      throw new NotFoundException(`Formula with ID '${formulaId}' not found`);
    }

    const ingredients = formula.ingredients.map((ing) => ({
      productId: ing.productId,
      percentage: Number(ing.percentage),
      proteinContent: ing.proteinContent ? Number(ing.proteinContent) : 0,
      energyContent: ing.energyContent ? Number(ing.energyContent) : 0,
      fiberContent: ing.fiberContent ? Number(ing.fiberContent) : 0,
      calciumContent: ing.calciumContent ? Number(ing.calciumContent) : 0,
      phosphorusContent: ing.phosphorusContent ? Number(ing.phosphorusContent) : 0,
      costPerKg: 0,
      sortOrder: ing.sortOrder,
    }));

    const actual = this.calculateNutritionalActual(ingredients);
    const target = formula.nutritionalTarget;

    const makeComp = (key: keyof INutritionalActual, targetKey: string) => ({
      target: target && (target as any)[targetKey] ? Number((target as any)[targetKey]) : null,
      actual: (actual as any)[key] as number,
      variance:
        target && (target as any)[targetKey]
          ? Number((actual as any)[key]) - Number((target as any)[targetKey])
          : null,
    });

    return {
      protein: makeComp('proteinActual', 'proteinTarget'),
      energy: makeComp('energyActual', 'energyTarget'),
      fiber: makeComp('fiberActual', 'fiberTarget'),
      calcium: makeComp('calciumActual', 'calciumTarget'),
      phosphorus: makeComp('phosphorusActual', 'phosphorusTarget'),
      moisture: makeComp('moistureActual', 'moistureTarget'),
      fat: makeComp('fatActual', 'fatTarget'),
      lysine: makeComp('lysineActual', 'lysineTarget'),
      methionine: makeComp('methionineActual', 'methionineTarget'),
    };
  }

  // ─────────────────────────────────────────────
  // Calculation Helpers
  // ─────────────────────────────────────────────

  private async enrichIngredients(
    ingredients: Array<{
      productId: string;
      percentage: number;
      [key: string]: any;
    }>,
  ): Promise<
    Array<{
      productId: string;
      productName: string;
      percentage: number;
      costPerKg: number;
      proteinContent: number;
      energyContent: number;
      fiberContent: number;
      calciumContent: number;
      phosphorusContent: number;
      [key: string]: any;
    }>
  > {
    const productIds = ingredients.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { unit: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return ingredients.map((ing) => {
      const product = productMap.get(ing.productId);
      return {
        ...ing,
        productName: product?.name || 'Unknown',
        costPerKg: product?.costPrice ? Number(product.costPrice) : ing.costPerKg || 0,
        proteinContent: ing.proteinContent || 0,
        energyContent: ing.energyContent || 0,
        fiberContent: ing.fiberContent || 0,
        calciumContent: ing.calciumContent || 0,
        phosphorusContent: ing.phosphorusContent || 0,
      };
    });
  }

  private calculateNutritionalActual(
    ingredients: Array<{
      percentage: number;
      proteinContent: number;
      energyContent: number;
      fiberContent: number;
      calciumContent: number;
      phosphorusContent: number;
      [key: string]: any;
    }>,
  ): INutritionalActual {
    const totalPercentage = ingredients.reduce((sum, i) => sum + i.percentage, 0);
    if (totalPercentage === 0) {
      return {
        proteinActual: 0,
        energyActual: 0,
        fiberActual: 0,
        calciumActual: 0,
        phosphorusActual: 0,
        moistureActual: 0,
        fatActual: 0,
        lysineActual: 0,
        methionineActual: 0,
      };
    }

    // Weighted average for percentage-based nutrients
    const weightedAvg = (contentKey: string) =>
      ingredients.reduce((sum, ing) => sum + (ing[contentKey] || 0) * (ing.percentage / 100), 0);

    return {
      proteinActual: Math.round(weightedAvg('proteinContent') * 10000) / 10000,
      energyActual: Math.round(weightedAvg('energyContent') * 10000) / 10000,
      fiberActual: Math.round(weightedAvg('fiberContent') * 10000) / 10000,
      calciumActual: Math.round(weightedAvg('calciumContent') * 10000) / 10000,
      phosphorusActual: Math.round(weightedAvg('phosphorusContent') * 10000) / 10000,
      moistureActual: Math.round(weightedAvg('moistureContent') * 10000) / 10000,
      fatActual: Math.round(weightedAvg('fatContent') * 10000) / 10000,
      lysineActual: Math.round(weightedAvg('lysineContent') * 10000) / 10000,
      methionineActual: Math.round(weightedAvg('methionineContent') * 10000) / 10000,
    };
  }

  private calculateCostAnalysis(
    ingredients: Array<{
      productId: string;
      productName: string;
      percentage: number;
      costPerKg: number;
    }>,
  ): IFormulaCostAnalysis {
    const totalPercentage = ingredients.reduce((sum, i) => sum + i.percentage, 0);
    const totalCostPerKg = ingredients.reduce(
      (sum, ing) => sum + (ing.percentage / 100) * ing.costPerKg,
      0,
    );

    const breakdown: IFormulaCostBreakdown[] = ingredients.map((ing) => ({
      ingredientId: ing.productId,
      productName: ing.productName,
      percentage: ing.percentage,
      costPerKg: ing.costPerKg,
      contributionPerKg: (ing.percentage / 100) * ing.costPerKg,
      percentageOfTotalCost:
        totalCostPerKg > 0
          ? Math.round((((ing.percentage / 100) * ing.costPerKg) / totalCostPerKg) * 10000) / 100
          : 0,
    }));

    return {
      totalCostPerKg: Math.round(totalCostPerKg * 10000) / 10000,
      breakdown,
      totalPercentage: Math.round(totalPercentage * 10000) / 10000,
      isBalanced: Math.abs(totalPercentage - 100) <= 0.01,
    };
  }

  // ─────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────

  async validateFormula(formulaId: string): Promise<{
    isValid: boolean;
    percentageSum: number;
    isBalanced: boolean;
    costAnalysis: IFormulaCostAnalysis;
    nutritionalComparison: INutritionalComparison;
    issues: string[];
  }> {
    const formula = await this.prisma.feedFormula.findUnique({
      where: { id: formulaId },
      include: { ingredients: true, nutritionalTarget: true },
    });

    if (!formula) {
      throw new NotFoundException(`Formula with ID '${formulaId}' not found`);
    }

    const issues: string[] = [];
    const totalPercentage = formula.ingredients.reduce(
      (sum, i) => sum + Number(i.percentage),
      0,
    );

    if (Math.abs(totalPercentage - 100) > 0.01) {
      issues.push(`Ingredient percentages sum to ${totalPercentage.toFixed(4)}%, expected 100%`);
    }

    const costAnalysis = await this.getCostAnalysis(formulaId);
    if (!costAnalysis.isBalanced) {
      issues.push('Formula is not cost-balanced');
    }

    const nutritionalComparison = await this.getNutritionalComparison(formulaId);
    const checkNutrient = (label: string, comp: { target: number | null; actual: number }) => {
      if (comp.target !== null && Math.abs(comp.actual - comp.target) > 0.5) {
        issues.push(`${label} variance: actual ${comp.actual.toFixed(2)} vs target ${comp.target.toFixed(2)}`);
      }
    };

    checkNutrient('Protein', nutritionalComparison.protein);
    checkNutrient('Energy', nutritionalComparison.energy);
    checkNutrient('Fiber', nutritionalComparison.fiber);
    checkNutrient('Calcium', nutritionalComparison.calcium);
    checkNutrient('Phosphorus', nutritionalComparison.phosphorus);

    return {
      isValid: issues.length === 0,
      percentageSum: Math.round(totalPercentage * 10000) / 10000,
      isBalanced: Math.abs(totalPercentage - 100) <= 0.01,
      costAnalysis,
      nutritionalComparison,
      issues,
    };
  }

  // ─────────────────────────────────────────────
  // Mapper
  // ─────────────────────────────────────────────

  private mapToInterface(formula: any): IFeedFormula {
    return {
      id: formula.id,
      code: formula.code,
      name: formula.name,
      feedType: formula.feedType as FeedType,
      description: formula.description,
      status: formula.status as FormulaStatus,
      versionNumber: formula.versionNumber,
      isDefault: formula.isDefault,
      totalCostPerKg: formula.totalCostPerKg ? Number(formula.totalCostPerKg) : null,
      branchId: formula.branchId,
      ingredients: formula.ingredients?.map((ing: any) => ({
        id: ing.id,
        productId: ing.productId,
        percentage: Number(ing.percentage),
        minPercentage: ing.minPercentage ? Number(ing.minPercentage) : null,
        maxPercentage: ing.maxPercentage ? Number(ing.maxPercentage) : null,
        costPerKg: ing.costPerKg ? Number(ing.costPerKg) : null,
        proteinContent: ing.proteinContent ? Number(ing.proteinContent) : null,
        energyContent: ing.energyContent ? Number(ing.energyContent) : null,
        fiberContent: ing.fiberContent ? Number(ing.fiberContent) : null,
        calciumContent: ing.calciumContent ? Number(ing.calciumContent) : null,
        phosphorusContent: ing.phosphorusContent ? Number(ing.phosphorusContent) : null,
        sortOrder: ing.sortOrder,
        createdAt: ing.createdAt,
        updatedAt: ing.updatedAt,
      })) || [],
      nutritionalTarget: formula.nutritionalTarget
        ? {
            id: formula.nutritionalTarget.id,
            proteinTarget: formula.nutritionalTarget.proteinTarget
              ? Number(formula.nutritionalTarget.proteinTarget)
              : null,
            energyTarget: formula.nutritionalTarget.energyTarget
              ? Number(formula.nutritionalTarget.energyTarget)
              : null,
            fiberTarget: formula.nutritionalTarget.fiberTarget
              ? Number(formula.nutritionalTarget.fiberTarget)
              : null,
            calciumTarget: formula.nutritionalTarget.calciumTarget
              ? Number(formula.nutritionalTarget.calciumTarget)
              : null,
            phosphorusTarget: formula.nutritionalTarget.phosphorusTarget
              ? Number(formula.nutritionalTarget.phosphorusTarget)
              : null,
            moistureTarget: formula.nutritionalTarget.moistureTarget
              ? Number(formula.nutritionalTarget.moistureTarget)
              : null,
            fatTarget: formula.nutritionalTarget.fatTarget
              ? Number(formula.nutritionalTarget.fatTarget)
              : null,
            lysineTarget: formula.nutritionalTarget.lysineTarget
              ? Number(formula.nutritionalTarget.lysineTarget)
              : null,
            methionineTarget: formula.nutritionalTarget.methionineTarget
              ? Number(formula.nutritionalTarget.methionineTarget)
              : null,
            createdAt: formula.nutritionalTarget.createdAt,
            updatedAt: formula.nutritionalTarget.updatedAt,
          }
        : null,
      createdBy: formula.createdBy,
      createdAt: formula.createdAt,
      updatedAt: formula.updatedAt,
    };
  }
}
