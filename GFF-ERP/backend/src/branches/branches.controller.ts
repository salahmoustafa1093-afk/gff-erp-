import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { branchId: string; id: string; role: string };
}

@ApiTags('Branches')
@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a new branch' })
  @ApiResponse({ status: 201, description: 'Branch created successfully' })
  @ApiResponse({ status: 409, description: 'Branch already exists' })
  create(@Body() dto: CreateBranchDto, @Req() req: RequestWithUser) {
    return this.branchesService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all branches' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of branches' })
  findAll(
    @Query('includeInactive') includeInactive?: string,
    @Query('search') search?: string,
    @Req() req: RequestWithUser,
  ) {
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    return this.branchesService.findAll(
      isSuperAdmin ? undefined : req.user.branchId,
      includeInactive === 'true',
      search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch by ID' })
  @ApiResponse({ status: 200, description: 'Branch found' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    return this.branchesService.findOne(id, isSuperAdmin ? undefined : req.user.branchId);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get branch statistics' })
  @ApiResponse({ status: 200, description: 'Branch statistics' })
  getStatistics(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    return this.branchesService.getStatistics(id, isSuperAdmin ? undefined : req.user.branchId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update branch' })
  @ApiResponse({ status: 200, description: 'Branch updated' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBranchDto,
    @Req() req: RequestWithUser,
  ) {
    return this.branchesService.update(id, dto, req.user.id);
  }

  @Patch(':id/manager')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Assign branch manager' })
  @ApiResponse({ status: 200, description: 'Manager assigned' })
  assignManager(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('managerId', ParseUUIDPipe) managerId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.branchesService.assignManager(id, managerId, req.user.id);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete branch' })
  @ApiResponse({ status: 204, description: 'Branch deleted' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.branchesService.remove(id, req.user.id);
  }
}
