import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  ParseDatePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JournalEntriesService } from './journal-entries.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto';
import { PostJournalDto } from './dto/post-journal.dto';
import { ReverseJournalDto } from './dto/reverse-journal.dto';
import {
  JournalEntry,
  JournalEntryStatus,
  JournalSource,
} from './interfaces/journal-entry.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchGuard } from '../branch/branch.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';

@ApiTags('Journal Entries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BranchGuard)
@Controller('journal-entries')
export class JournalEntriesController {
  constructor(private readonly journalService: JournalEntriesService) {}

  @Post()
  @RequirePermission('journalEntries.create')
  @ApiOperation({ summary: 'Create journal entry' })
  @ApiResponse({ status: 201, description: 'Journal entry created' })
  @ApiResponse({ status: 400, description: 'Journal entry is not balanced' })
  async create(
    @Body() dto: CreateJournalEntryDto,
    @Request() req,
  ): Promise<JournalEntry> {
    return this.journalService.create(dto, req.user.userId);
  }

  @Get()
  @RequirePermission('journalEntries.read')
  @ApiOperation({ summary: 'List journal entries' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'status', enum: JournalEntryStatus, required: false })
  @ApiQuery({ name: 'source', enum: JournalSource, required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  async findAll(
    @Query('branchId') branchId?: string,
    @Query('status') status?: JournalEntryStatus,
    @Query('source') source?: JournalSource,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number,
    @Query('take', new DefaultValuePipe(50), ParseIntPipe) take?: number,
  ) {
    return this.journalService.findAll({
      branchId,
      status,
      source,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      skip,
      take,
    });
  }

  @Get(':id')
  @RequirePermission('journalEntries.read')
  @ApiOperation({ summary: 'Get journal entry by ID' })
  @ApiParam({ name: 'id' })
  async findOne(
    @Param('id') id: string,
    @Query('branchId') branchId?: string,
  ): Promise<JournalEntry> {
    return this.journalService.findOne(id, branchId);
  }

  @Patch(':id')
  @RequirePermission('journalEntries.update')
  @ApiOperation({ summary: 'Update journal entry (draft only)' })
  @ApiParam({ name: 'id' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateJournalEntryDto,
    @Request() req,
  ): Promise<JournalEntry> {
    return this.journalService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  @RequirePermission('journalEntries.delete')
  @ApiOperation({ summary: 'Delete journal entry (draft only)' })
  @ApiParam({ name: 'id' })
  async remove(
    @Param('id') id: string,
    @Request() req,
  ): Promise<void> {
    return this.journalService.remove(id, req.user.userId);
  }

  @Post(':id/post')
  @RequirePermission('journalEntries.post')
  @ApiOperation({ summary: 'Post journal entry' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Journal entry posted' })
  async post(
    @Param('id') id: string,
    @Body() dto: PostJournalDto,
    @Request() req,
  ): Promise<JournalEntry> {
    return this.journalService.post(id, req.user.userId, dto.approvalNotes);
  }

  @Post(':id/reverse')
  @RequirePermission('journalEntries.reverse')
  @ApiOperation({ summary: 'Reverse posted journal entry' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 201, description: 'Reversal journal entry created' })
  async reverse(
    @Param('id') id: string,
    @Body() dto: ReverseJournalDto,
    @Request() req,
  ): Promise<JournalEntry> {
    return this.journalService.reverse(id, dto, req.user.userId);
  }
}
