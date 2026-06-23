import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { JournalEntriesService } from '../journal-entries/journal-entries.service';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import { FixedAsset, AssetStatus, DepreciationMethod, AssetDisposal, DepreciationScheduleEntry, DepreciationBatchResult, AssetRegisterItem } from './interfaces/asset.interface';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { DepreciateDto } from './dto/depreciate.dto';
import { JournalSource, JournalEntryType } from '../journal-entries/interfaces/journal-entry.interface';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService, private readonly journalService: JournalEntriesService) {}

  async create(dto: CreateAssetDto, userId: string): Promise<FixedAsset> {
    const rate = this.calculateDepreciationRate(dto.depreciationMethod, dto.usefulLifeMonths, dto.acquisitionCost);
    const nbv = new Decimal(dto.acquisitionCost.toString()).minus(new Decimal(dto.salvageValue?.toString() || 0));
    const asset = await this.prisma.fixedAsset.create({ data: {
      assetCode: dto.assetCode, name: dto.name, description: dto.description || null, categoryId: dto.categoryId,
      branchId: dto.branchId, costCenterId: dto.costCenterId || null, acquisitionDate: dto.acquisitionDate,
      acquisitionCost: new Prisma.Decimal(dto.acquisitionCost.toString()), salvageValue: new Prisma.Decimal(dto.salvageValue?.toString() || 0),
      usefulLifeMonths: dto.usefulLifeMonths, depreciationMethod: dto.depreciationMethod, depreciationRate: new Prisma.Decimal(rate.toString()),
      accumulatedDepreciation: new Prisma.Decimal(0), netBookValue: new Prisma.Decimal(nbv.toString()),
      assetAccountId: dto.assetAccountId, depreciationAccountId: dto.depreciationAccountId, expenseAccountId: dto.expenseAccountId,
      status: AssetStatus.DEPRECIATING, location: dto.location || null, serialNumber: dto.serialNumber || null,
      supplierName: dto.supplierName || null, warrantyExpiry: dto.warrantyExpiry || null, createdBy: userId, updatedBy: userId,
    }});
    await this.auditService.log({ action: 'ASSET_CREATE', entity: 'FixedAsset', entityId: asset.id, userId, branchId: dto.branchId, details: { code: dto.assetCode, name: dto.name, cost: dto.acquisitionCost.toString() } });
    return this.mapToInterface(asset);
  }

  async findAll(branchId?: string): Promise<FixedAsset[]> {
    const where = branchId ? { branchId } : {};
    const assets = await this.prisma.fixedAsset.findMany({ where, orderBy: { assetCode: 'asc' } });
    return assets.map(a => this.mapToInterface(a));
  }

  async findOne(id: string, branchId?: string): Promise<FixedAsset> {
    const asset = await this.prisma.fixedAsset.findUnique({ where: { id }, include: { category: true } });
    if (!asset) throw new NotFoundException(`Asset ${id} not found`);
    if (branchId && asset.branchId !== branchId) throw new BadRequestException('Asset not in branch');
    return this.mapToInterface(asset);
  }

  async update(id: string, dto: UpdateAssetDto, userId: string): Promise<FixedAsset> {
    const existing = await this.prisma.fixedAsset.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Asset ${id} not found`);
    const data: Prisma.FixedAssetUpdateInput = { updatedBy: userId };
    if (dto.name) data.name = dto.name; if (dto.description !== undefined) data.description = dto.description || null;
    if (dto.location !== undefined) data.location = dto.location || null; if (dto.serialNumber !== undefined) data.serialNumber = dto.serialNumber || null;
    if (dto.status) data.status = dto.status;
    const updated = await this.prisma.fixedAsset.update({ where: { id }, data });
    await this.auditService.log({ action: 'ASSET_UPDATE', entity: 'FixedAsset', entityId: id, userId, branchId: existing.branchId, details: dto });
    return this.mapToInterface(updated);
  }

  async calculateDepreciationSchedule(id: string): Promise<DepreciationScheduleEntry[]> {
    const asset = await this.prisma.fixedAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException(`Asset ${id} not found`);
    return this.generateSchedule(asset);
  }

  private generateSchedule(asset: { acquisitionCost: Prisma.Decimal; salvageValue: Prisma.Decimal; usefulLifeMonths: number; depreciationMethod: string; accumulatedDepreciation: Prisma.Decimal }): DepreciationScheduleEntry[] {
    const cost = new Decimal(asset.acquisitionCost.toString());
    const salvage = new Decimal(asset.salvageValue.toString());
    const life = asset.usefulLifeMonths;
    const depreciableBase = cost.minus(salvage);
    const schedule: DepreciationScheduleEntry[] = [];
    let bookValue = cost;
    let accumDep = new Decimal(asset.accumulatedDepreciation.toString());
    const now = new Date();

    if (asset.depreciationMethod === DepreciationMethod.STRAIGHT_LINE) {
      const monthlyDep = depreciableBase.dividedBy(life);
      for (let i = 0; i < life; i++) {
        const periodStart = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
        const dep = Decimal.min(monthlyDep, bookValue.minus(salvage));
        if (dep.lessThanOrEqualTo(0)) break;
        accumDep = accumDep.plus(dep); bookValue = bookValue.minus(dep);
        schedule.push({ period: `${periodStart.toISOString().slice(0,7)}`, periodStart, periodEnd, beginningBookValue: new Decimal(bookValue.plus(dep).toString()), depreciationAmount: dep, accumulatedDepreciation: new Decimal(accumDep.toString()), endingBookValue: new Decimal(bookValue.toString()) });
      }
    } else {
      const rate = new Decimal(2).dividedBy(life);
      for (let i = 0; i < life; i++) {
        const periodStart = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
        const dep = Decimal.min(bookValue.times(rate), bookValue.minus(salvage));
        if (dep.lessThanOrEqualTo(0)) break;
        accumDep = accumDep.plus(dep); bookValue = bookValue.minus(dep);
        schedule.push({ period: `${periodStart.toISOString().slice(0,7)}`, periodStart, periodEnd, beginningBookValue: new Decimal(bookValue.plus(dep).toString()), depreciationAmount: dep, accumulatedDepreciation: new Decimal(accumDep.toString()), endingBookValue: new Decimal(bookValue.toString()) });
      }
    }
    return schedule;
  }

  async depreciate(dto: DepreciateDto, userId: string): Promise<DepreciationBatchResult> {
    const assets = await this.prisma.fixedAsset.findMany({
      where: { branchId: dto.branchId, status: AssetStatus.DEPRECIATING, netBookValue: { gt: 0 } },
    });
    if (assets.length === 0) return { period: dto.period, entriesProcessed: 0, totalDepreciation: new Decimal(0), journalEntryId: null };

    let totalDepreciation = new Decimal(0);
    const journalLines: { accountId: string; debit: number; credit: number; description?: string }[] = [];

    for (const asset of assets) {
      const schedule = this.generateSchedule(asset);
      const entry = schedule.find(s => s.period === dto.period);
      if (!entry || entry.depreciationAmount.isZero()) continue;
      totalDepreciation = totalDepreciation.plus(entry.depreciationAmount);
      await this.prisma.fixedAsset.update({
        where: { id: asset.id },
        data: { accumulatedDepreciation: { increment: entry.depreciationAmount.toNumber() }, netBookValue: { decrement: entry.depreciationAmount.toNumber() } },
      });
      journalLines.push({ accountId: asset.expenseAccountId, debit: entry.depreciationAmount.toNumber(), credit: 0, description: `Depreciation: ${asset.name}` });
      journalLines.push({ accountId: asset.depreciationAccountId, debit: 0, credit: entry.depreciationAmount.toNumber(), description: `Depreciation: ${asset.name}` });
    }

    let jeId: string | null = null;
    if (journalLines.length > 0) {
      const je = await this.journalService.createAutoJournal({
        date: dto.date || new Date(), description: `Monthly depreciation - ${dto.period}`, reference: `DEPR-${dto.period}`,
        source: JournalSource.ASSET_DEPRECIATION, entryType: JournalEntryType.AUTOMATIC, branchId: dto.branchId,
        lines: journalLines.map((l, i) => ({ ...l, lineOrder: i + 1 })), createdBy: userId,
      });
      jeId = je.id;
    }

    await this.auditService.log({ action: 'ASSET_DEPRECIATE_BATCH', entity: 'FixedAsset', entityId: 'batch', userId, branchId: dto.branchId, details: { period: dto.period, assets: assets.length, totalDepreciation: totalDepreciation.toNumber() } });
    return { period: dto.period, entriesProcessed: assets.length, totalDepreciation, journalEntryId: jeId };
  }

  async dispose(id: string, dto: { disposalDate: Date; disposalMethod: string; saleProceeds: number; notes?: string }, userId: string): Promise<AssetDisposal> {
    const asset = await this.prisma.fixedAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException(`Asset ${id} not found`);
    if (asset.status === AssetStatus.DISPOSED) throw new BadRequestException('Asset already disposed');
    const nbv = new Decimal(asset.netBookValue.toString());
    const proceeds = new Decimal(dto.saleProceeds);
    const gainLoss = proceeds.minus(nbv);
    const je = await this.journalService.createAutoJournal({
      date: dto.disposalDate, description: `Asset disposal: ${asset.name}`, reference: asset.assetCode,
      source: JournalSource.ASSET_DEPRECIATION, entryType: JournalEntryType.ADJUSTING, branchId: asset.branchId,
      lines: [
        { accountId: asset.depreciationAccountId, debit: new Decimal(asset.accumulatedDepreciation.toString()).toNumber(), credit: 0, description: `Remove accum dep: ${asset.name}` },
        { accountId: 'gain-loss-account', debit: gainLoss.lessThan(0) ? gainLoss.abs().toNumber() : 0, credit: gainLoss.greaterThan(0) ? gainLoss.toNumber() : 0, description: `Gain/Loss on disposal: ${asset.name}` },
        { accountId: asset.assetAccountId, debit: 0, credit: new Decimal(asset.acquisitionCost.toString()).toNumber(), description: `Remove asset: ${asset.name}` },
        { accountId: 'cash-or-receivable', debit: proceeds.greaterThan(0) ? proceeds.toNumber() : 0, credit: 0, description: `Proceeds: ${asset.name}` },
      ], createdBy: userId,
    });
    await this.prisma.fixedAsset.update({ where: { id }, data: { status: AssetStatus.DISPOSED, netBookValue: 0, updatedBy: userId } });
    await this.auditService.log({ action: 'ASSET_DISPOSE', entity: 'FixedAsset', entityId: id, userId, branchId: asset.branchId, details: { method: dto.disposalMethod, proceeds, nbv, gainLoss: gainLoss.toNumber() } });
    return { assetId: id, disposalDate: dto.disposalDate, disposalMethod: dto.disposalMethod as any, saleProceeds: proceeds, netBookValue: nbv, gainOrLoss: gainLoss, journalEntryId: je.id, notes: dto.notes || null };
  }

  async getAssetRegister(branchId?: string): Promise<AssetRegisterItem[]> {
    const where = branchId ? { branchId } : {};
    const assets = await this.prisma.fixedAsset.findMany({ where, orderBy: { assetCode: 'asc' }, include: { category: true } });
    return assets.map(a => {
      const annualDep = this.calculateAnnualDepreciation(a);
      const monthsUsed = Math.max(0, Math.floor((Date.now() - a.acquisitionDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
      const remainingLife = Math.max(0, a.usefulLifeMonths - monthsUsed);
      return { asset: this.mapToInterface(a), annualDepreciation: annualDep, remainingLife, monthlyDepreciation: annualDep.dividedBy(12) };
    });
  }

  private calculateAnnualDepreciation(asset: { acquisitionCost: Prisma.Decimal; salvageValue: Prisma.Decimal; usefulLifeMonths: number; depreciationMethod: string }): Decimal {
    const depreciableBase = new Decimal(asset.acquisitionCost.toString()).minus(new Decimal(asset.salvageValue.toString()));
    if (asset.depreciationMethod === DepreciationMethod.STRAIGHT_LINE) {
      return depreciableBase.dividedBy(asset.usefulLifeMonths).times(12);
    }
    return new Decimal(asset.acquisitionCost.toString()).times(new Decimal(2).dividedBy(asset.usefulLifeMonths)).times(12);
  }

  private calculateDepreciationRate(method: DepreciationMethod, lifeMonths: number, cost: Decimal): Decimal {
    if (method === DepreciationMethod.STRAIGHT_LINE) return new Decimal(100).dividedBy(lifeMonths / 12);
    return new Decimal(200).dividedBy(lifeMonths / 12);
  }

  private mapToInterface(a: any): FixedAsset {
    return { id: a.id, assetCode: a.assetCode, name: a.name, description: a.description, categoryId: a.categoryId, categoryName: a.category?.name, branchId: a.branchId, costCenterId: a.costCenterId, acquisitionDate: a.acquisitionDate, acquisitionCost: new Decimal(a.acquisitionCost.toString()), salvageValue: new Decimal(a.salvageValue.toString()), usefulLifeMonths: a.usefulLifeMonths, depreciationMethod: a.depreciationMethod as DepreciationMethod, depreciationRate: new Decimal(a.depreciationRate.toString()), accumulatedDepreciation: new Decimal(a.accumulatedDepreciation.toString()), netBookValue: new Decimal(a.netBookValue.toString()), assetAccountId: a.assetAccountId, depreciationAccountId: a.depreciationAccountId, expenseAccountId: a.expenseAccountId, status: a.status as AssetStatus, location: a.location, serialNumber: a.serialNumber, supplierName: a.supplierName, warrantyExpiry: a.warrantyExpiry, createdAt: a.createdAt, updatedAt: a.updatedAt, createdBy: a.createdBy, updatedBy: a.updatedBy };
  }
}
