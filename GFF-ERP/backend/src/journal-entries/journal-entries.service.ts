import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import {
  JournalEntry,
  JournalEntryStatus,
  JournalEntryType,
  JournalEntryLine,
  JournalSource,
  JournalEntrySummary,
} from './interfaces/journal-entry.interface';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto';
import { ReverseJournalDto } from './dto/reverse-journal.dto';

@Injectable()
export class JournalEntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateJournalEntryDto, userId: string): Promise<JournalEntry> {
    this.validateJournalLines(dto.lines);

    const entryNumber = await this.generateEntryNumber(dto.branchId);

    const totalDebits = dto.lines.reduce(
      (sum, l) => sum.plus(new Decimal(l.debit.toString())),
      new Decimal(0),
    );
    const totalCredits = dto.lines.reduce(
      (sum, l) => sum.plus(new Decimal(l.credit.toString())),
      new Decimal(0),
    );

    const entry = await this.prisma.$transaction(async (tx) => {
      const je = await tx.journalEntry.create({
        data: {
          entryNumber,
          date: dto.date,
          description: dto.description,
          reference: dto.reference || null,
          source: dto.source || JournalSource.MANUAL_ENTRY,
          entryType: dto.entryType || JournalEntryType.MANUAL,
          status: JournalEntryStatus.DRAFT,
          totalDebits: new Prisma.Decimal(totalDebits.toString()),
          totalCredits: new Prisma.Decimal(totalCredits.toString()),
          branchId: dto.branchId,
          periodId: dto.periodId || null,
          sourceDocumentId: dto.sourceDocumentId || null,
          sourceDocumentType: dto.sourceDocumentType || null,
          notes: dto.notes || null,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      for (const line of dto.lines) {
        await tx.journalEntryLine.create({
          data: {
            journalEntryId: je.id,
            accountId: line.accountId,
            debit: new Prisma.Decimal(line.debit.toString()),
            credit: new Prisma.Decimal(line.credit.toString()),
            description: line.description || null,
            costCenterId: line.costCenterId || null,
            reference: line.reference || null,
            lineOrder: line.lineOrder,
          },
        });
      }

      return je;
    });

    const result = await this.prisma.journalEntry.findUnique({
      where: { id: entry.id },
      include: { lines: true },
    });

    await this.auditService.log({
      action: 'JOURNAL_ENTRY_CREATE',
      entity: 'JournalEntry',
      entityId: entry.id,
      userId,
      branchId: dto.branchId,
      details: { entryNumber, description: dto.description, totalDebits: totalDebits.toNumber() },
    });

    return this.mapToInterface(result!);
  }

  async findAll(params: {
    branchId?: string;
    status?: JournalEntryStatus;
    source?: JournalSource;
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
  }): Promise<{ data: JournalEntrySummary[]; total: number }> {
    const where: Prisma.JournalEntryWhereInput = {};

    if (params.branchId) where.branchId = params.branchId;
    if (params.status) where.status = params.status;
    if (params.source) where.source = params.source;
    if (params.startDate || params.endDate) {
      where.date = {};
      if (params.startDate) where.date.gte = params.startDate;
      if (params.endDate) where.date.lte = params.endDate;
    }

    const [entries, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where,
        skip: params.skip || 0,
        take: params.take || 50,
        orderBy: [{ date: 'desc' }, { entryNumber: 'desc' }],
        include: {
          _count: { select: { lines: true } },
        },
      }),
      this.prisma.journalEntry.count({ where }),
    ]);

    const data: JournalEntrySummary[] = entries.map((e) => ({
      id: e.id,
      entryNumber: e.entryNumber,
      date: e.date,
      description: e.description,
      status: e.status as JournalEntryStatus,
      totalDebits: new Decimal(e.totalDebits.toString()),
      totalCredits: new Decimal(e.totalCredits.toString()),
      lineCount: e._count.lines,
      source: e.source as JournalSource,
      createdBy: e.createdBy,
      createdAt: e.createdAt,
    }));

    return { data, total };
  }

  async findOne(id: string, branchId?: string): Promise<JournalEntry> {
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            account: { select: { code: true, name: true } },
            costCenter: { select: { name: true } },
          },
          orderBy: { lineOrder: 'asc' },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException(`Journal entry ${id} not found`);
    }
    if (branchId && entry.branchId !== branchId) {
      throw new ForbiddenException('Journal entry does not belong to this branch');
    }

    return this.mapToInterface(entry);
  }

  async update(
    id: string,
    dto: UpdateJournalEntryDto,
    userId: string,
  ): Promise<JournalEntry> {
    const existing = await this.prisma.journalEntry.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!existing) {
      throw new NotFoundException(`Journal entry ${id} not found`);
    }

    if (existing.status === JournalEntryStatus.POSTED) {
      throw new ForbiddenException('Cannot modify posted journal entries');
    }
    if (existing.status === JournalEntryStatus.REVERSED) {
      throw new ForbiddenException('Cannot modify reversed journal entries');
    }

    if (dto.lines) {
      this.validateJournalLines(dto.lines);
    }

    const entry = await this.prisma.$transaction(async (tx) => {
      const data: Prisma.JournalEntryUpdateInput = {
        updatedBy: userId,
      };

      if (dto.date !== undefined) data.date = dto.date;
      if (dto.description !== undefined) data.description = dto.description;
      if (dto.reference !== undefined) data.reference = dto.reference || null;
      if (dto.entryType !== undefined) data.entryType = dto.entryType;
      if (dto.notes !== undefined) data.notes = dto.notes || null;

      if (dto.lines) {
        const totalDebits = dto.lines.reduce(
          (sum, l) => sum.plus(new Decimal(l.debit.toString())),
          new Decimal(0),
        );
        const totalCredits = dto.lines.reduce(
          (sum, l) => sum.plus(new Decimal(l.credit.toString())),
          new Decimal(0),
        );

        data.totalDebits = new Prisma.Decimal(totalDebits.toString());
        data.totalCredits = new Prisma.Decimal(totalCredits.toString());

        await tx.journalEntryLine.deleteMany({
          where: { journalEntryId: id },
        });

        for (const line of dto.lines) {
          await tx.journalEntryLine.create({
            data: {
              journalEntryId: id,
              accountId: line.accountId,
              debit: new Prisma.Decimal(line.debit.toString()),
              credit: new Prisma.Decimal(line.credit.toString()),
              description: line.description || null,
              costCenterId: line.costCenterId || null,
              reference: line.reference || null,
              lineOrder: line.lineOrder,
            },
          });
        }
      }

      return tx.journalEntry.update({
        where: { id },
        data,
      });
    });

    const result = await this.prisma.journalEntry.findUnique({
      where: { id: entry.id },
      include: { lines: true },
    });

    await this.auditService.log({
      action: 'JOURNAL_ENTRY_UPDATE',
      entity: 'JournalEntry',
      entityId: id,
      userId,
      branchId: existing.branchId,
      details: { entryNumber: existing.entryNumber, changes: dto },
    });

    return this.mapToInterface(result!);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.journalEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Journal entry ${id} not found`);
    }

    if (existing.status === JournalEntryStatus.POSTED) {
      throw new ForbiddenException('Cannot delete posted journal entries');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.journalEntryLine.deleteMany({
        where: { journalEntryId: id },
      });
      await tx.journalEntry.delete({ where: { id } });
    });

    await this.auditService.log({
      action: 'JOURNAL_ENTRY_DELETE',
      entity: 'JournalEntry',
      entityId: id,
      userId,
      branchId: existing.branchId,
      details: { entryNumber: existing.entryNumber },
    });
  }

  async post(id: string, userId: string, approvalNotes?: string): Promise<JournalEntry> {
    const existing = await this.prisma.journalEntry.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!existing) {
      throw new NotFoundException(`Journal entry ${id} not found`);
    }

    if (existing.status === JournalEntryStatus.POSTED) {
      throw new ConflictException('Journal entry is already posted');
    }
    if (existing.status === JournalEntryStatus.REVERSED) {
      throw new ForbiddenException('Cannot post reversed journal entries');
    }
    if (existing.status === JournalEntryStatus.CANCELLED) {
      throw new ForbiddenException('Cannot post cancelled journal entries');
    }

    this.validateJournalLines(existing.lines.map((l) => ({
      accountId: l.accountId,
      debit: l.debit,
      credit: l.credit,
      lineOrder: l.lineOrder,
    })));

    const result = await this.prisma.$transaction(async (tx) => {
      for (const line of existing.lines) {
        const debit = new Decimal(line.debit.toString());
        const credit = new Decimal(line.credit.toString());
        const netAmount = debit.minus(credit);

        await tx.account.update({
          where: { id: line.accountId },
          data: {
            currentBalance: {
              increment: netAmount.toNumber(),
            },
          },
        });
      }

      const updated = await tx.journalEntry.update({
        where: { id },
        data: {
          status: JournalEntryStatus.POSTED,
          postedAt: new Date(),
          postedBy: userId,
          approvedBy: userId,
          approvedAt: new Date(),
          notes: approvalNotes || existing.notes,
          updatedBy: userId,
        },
        include: { lines: true },
      });

      return updated;
    });

    await this.auditService.log({
      action: 'JOURNAL_ENTRY_POST',
      entity: 'JournalEntry',
      entityId: id,
      userId,
      branchId: existing.branchId,
      details: { entryNumber: existing.entryNumber, approvalNotes },
    });

    return this.mapToInterface(result);
  }

  async reverse(id: string, dto: ReverseJournalDto, userId: string): Promise<JournalEntry> {
    const existing = await this.prisma.journalEntry.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!existing) {
      throw new NotFoundException(`Journal entry ${id} not found`);
    }

    if (existing.status !== JournalEntryStatus.POSTED) {
      throw new ForbiddenException('Only posted journal entries can be reversed');
    }

    const entryNumber = await this.generateEntryNumber(existing.branchId);

    const result = await this.prisma.$transaction(async (tx) => {
      const reversalEntry = await tx.journalEntry.create({
        data: {
          entryNumber,
          date: dto.reversalDate,
          description: `Reversal of ${existing.entryNumber}: ${existing.description}`,
          reference: `REV-${existing.entryNumber}`,
          source: JournalSource.MANUAL_ENTRY,
          entryType: JournalEntryType.REVERSING,
          status: JournalEntryStatus.POSTED,
          totalDebits: existing.totalDebits,
          totalCredits: existing.totalCredits,
          branchId: existing.branchId,
          periodId: existing.periodId,
          reversalOfId: existing.id,
          postedAt: new Date(),
          postedBy: userId,
          notes: dto.reason + (dto.notes ? ` - ${dto.notes}` : ''),
          createdBy: userId,
          updatedBy: userId,
        },
      });

      for (const line of existing.lines) {
        await tx.journalEntryLine.create({
          data: {
            journalEntryId: reversalEntry.id,
            accountId: line.accountId,
            debit: new Prisma.Decimal(line.credit.toString()),
            credit: new Prisma.Decimal(line.debit.toString()),
            description: `Reversal: ${line.description || existing.description}`,
            costCenterId: line.costCenterId,
            reference: line.reference,
            lineOrder: line.lineOrder,
          },
        });

        const revDebit = new Decimal(line.credit.toString());
        const revCredit = new Decimal(line.debit.toString());
        const netAmount = revDebit.minus(revCredit);

        await tx.account.update({
          where: { id: line.accountId },
          data: {
            currentBalance: {
              increment: netAmount.toNumber(),
            },
          },
        });
      }

      await tx.journalEntry.update({
        where: { id },
        data: {
          status: JournalEntryStatus.REVERSED,
          reversedById: reversalEntry.id,
          updatedBy: userId,
        },
      });

      return tx.journalEntry.findUnique({
        where: { id: reversalEntry.id },
        include: { lines: true },
      });
    });

    await this.auditService.log({
      action: 'JOURNAL_ENTRY_REVERSE',
      entity: 'JournalEntry',
      entityId: id,
      userId,
      branchId: existing.branchId,
      details: { entryNumber: existing.entryNumber, reversalEntryNumber: entryNumber, reason: dto.reason },
    });

    return this.mapToInterface(result!);
  }

  async createAutoJournal(params: {
    date: Date;
    description: string;
    reference?: string;
    source: JournalSource;
    entryType: JournalEntryType;
    branchId: string;
    periodId?: string;
    sourceDocumentId?: string;
    sourceDocumentType?: string;
    lines: { accountId: string; debit: number; credit: number; description?: string; costCenterId?: string; reference?: string }[];
    createdBy: string;
  }): Promise<JournalEntry> {
    const entryNumber = await this.generateEntryNumber(params.branchId);

    const totalDebits = params.lines.reduce(
      (sum, l) => sum.plus(new Decimal(l.debit)),
      new Decimal(0),
    );
    const totalCredits = params.lines.reduce(
      (sum, l) => sum.plus(new Decimal(l.credit)),
      new Decimal(0),
    );

    if (!totalDebits.equals(totalCredits)) {
      throw new BadRequestException(
        `Auto journal debits (${totalDebits}) do not equal credits (${totalCredits})`,
      );
    }

    const entry = await this.prisma.$transaction(async (tx) => {
      const je = await tx.journalEntry.create({
        data: {
          entryNumber,
          date: params.date,
          description: params.description,
          reference: params.reference || null,
          source: params.source,
          entryType: params.entryType,
          status: JournalEntryStatus.POSTED,
          totalDebits: new Prisma.Decimal(totalDebits.toString()),
          totalCredits: new Prisma.Decimal(totalCredits.toString()),
          branchId: params.branchId,
          periodId: params.periodId || null,
          sourceDocumentId: params.sourceDocumentId || null,
          sourceDocumentType: params.sourceDocumentType || null,
          postedAt: new Date(),
          postedBy: params.createdBy,
          createdBy: params.createdBy,
          updatedBy: params.createdBy,
        },
      });

      for (let i = 0; i < params.lines.length; i++) {
        const line = params.lines[i];
        await tx.journalEntryLine.create({
          data: {
            journalEntryId: je.id,
            accountId: line.accountId,
            debit: new Prisma.Decimal(line.debit),
            credit: new Prisma.Decimal(line.credit),
            description: line.description || null,
            costCenterId: line.costCenterId || null,
            reference: line.reference || null,
            lineOrder: i + 1,
          },
        });

        const netAmount = new Decimal(line.debit).minus(new Decimal(line.credit));
        await tx.account.update({
          where: { id: line.accountId },
          data: {
            currentBalance: {
              increment: netAmount.toNumber(),
            },
          },
        });
      }

      return je;
    });

    const result = await this.prisma.journalEntry.findUnique({
      where: { id: entry.id },
      include: { lines: true },
    });

    await this.auditService.log({
      action: 'JOURNAL_ENTRY_AUTO_CREATE',
      entity: 'JournalEntry',
      entityId: entry.id,
      userId: params.createdBy,
      branchId: params.branchId,
      details: { entryNumber, source: params.source, description: params.description },
    });

    return this.mapToInterface(result!);
  }

  private validateJournalLines(
    lines: { accountId: string; debit: Decimal | number | Prisma.Decimal; credit: Decimal | number | Prisma.Decimal; lineOrder: number }[],
  ): void {
    const totalDebits = lines.reduce(
      (sum, l) => sum.plus(new Decimal(l.debit.toString())),
      new Decimal(0),
    );
    const totalCredits = lines.reduce(
      (sum, l) => sum.plus(new Decimal(l.credit.toString())),
      new Decimal(0),
    );

    if (!totalDebits.equals(totalCredits)) {
      throw new BadRequestException(
        `Journal entry is not balanced. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}, Difference: ${totalDebits.minus(totalCredits).toFixed(2)}`,
      );
    }

    if (totalDebits.isZero()) {
      throw new BadRequestException('Journal entry cannot have zero total amount');
    }

    for (const line of lines) {
      const debit = new Decimal(line.debit.toString());
      const credit = new Decimal(line.credit.toString());

      if (!debit.isZero() && !credit.isZero()) {
        throw new BadRequestException(
          `Line ${line.lineOrder}: A journal line cannot have both debit and credit amounts`,
        );
      }

      if (debit.isZero() && credit.isZero()) {
        throw new BadRequestException(
          `Line ${line.lineOrder}: A journal line must have either debit or credit amount`,
        );
      }
    }
  }

  private async generateEntryNumber(branchId: string): Promise<string> {
    const prefix = 'JE';
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const pattern = `${prefix}-${branchId.substring(0, 8)}-${dateStr}-%`;

    const lastEntry = await this.prisma.journalEntry.findFirst({
      where: { entryNumber: { startsWith: `${prefix}-${branchId.substring(0, 8)}-${dateStr}-` } },
      orderBy: { entryNumber: 'desc' },
    });

    let sequence = 1;
    if (lastEntry) {
      const parts = lastEntry.entryNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `${prefix}-${branchId.substring(0, 8)}-${dateStr}-${String(sequence).padStart(5, '0')}`;
  }

  private mapToInterface(entry: {
    id: string;
    entryNumber: string;
    date: Date;
    description: string;
    reference: string | null;
    source: string;
    entryType: string;
    status: string;
    totalDebits: Prisma.Decimal;
    totalCredits: Prisma.Decimal;
    branchId: string;
    periodId: string | null;
    sourceDocumentId: string | null;
    sourceDocumentType: string | null;
    reversalOfId: string | null;
    reversedById: string | null;
    postedAt: Date | null;
    postedBy: string | null;
    approvedBy: string | null;
    approvedAt: Date | null;
    notes: string | null;
    lines: Array<{
      id: string;
      journalEntryId: string;
      accountId: string;
      debit: Prisma.Decimal;
      credit: Prisma.Decimal;
      description: string | null;
      costCenterId: string | null;
      reference: string | null;
      lineOrder: number;
      createdAt: Date;
      updatedAt: Date;
      account?: { code: string; name: string };
      costCenter?: { name: string } | null;
    }>;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
  }): JournalEntry {
    return {
      id: entry.id,
      entryNumber: entry.entryNumber,
      date: entry.date,
      description: entry.description,
      reference: entry.reference,
      source: entry.source as JournalSource,
      entryType: entry.entryType as JournalEntryType,
      status: entry.status as JournalEntryStatus,
      totalDebits: new Decimal(entry.totalDebits.toString()),
      totalCredits: new Decimal(entry.totalCredits.toString()),
      branchId: entry.branchId,
      periodId: entry.periodId || '',
      sourceDocumentId: entry.sourceDocumentId,
      sourceDocumentType: entry.sourceDocumentType,
      reversalOfId: entry.reversalOfId,
      reversedById: entry.reversedById,
      postedAt: entry.postedAt,
      postedBy: entry.postedBy,
      approvedBy: entry.approvedBy,
      approvedAt: entry.approvedAt,
      notes: entry.notes,
      lines: entry.lines.map((l) => ({
        id: l.id,
        journalEntryId: l.journalEntryId,
        accountId: l.accountId,
        accountCode: l.account?.code,
        accountName: l.account?.name,
        debit: new Decimal(l.debit.toString()),
        credit: new Decimal(l.credit.toString()),
        description: l.description,
        costCenterId: l.costCenterId,
        costCenterName: l.costCenter?.name,
        reference: l.reference,
        lineOrder: l.lineOrder,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
      })),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      createdBy: entry.createdBy,
      updatedBy: entry.updatedBy,
    };
  }
}
