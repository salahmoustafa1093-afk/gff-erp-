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
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { branchId: string; id: string };
}

@ApiTags('Units')
@Controller('units')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a new unit of measurement' })
  @ApiResponse({ status: 201, description: 'Unit created successfully' })
  @ApiResponse({ status: 409, description: 'Unit with this name already exists' })
  create(@Body() dto: CreateUnitDto, @Req() req: RequestWithUser) {
    return this.unitsService.create(dto, req.user.branchId, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all units' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of units' })
  findAll(
    @Query('includeInactive') includeInactive?: string,
    @Query('type') type?: string,
    @Req() req: RequestWithUser,
  ) {
    return this.unitsService.findAll(
      req.user.branchId,
      includeInactive === 'true',
      type,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get unit by ID' })
  @ApiResponse({ status: 200, description: 'Unit found' })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.unitsService.findOne(id, req.user.branchId);
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Get unit by code' })
  findByCode(@Param('code') code: string, @Req() req: RequestWithUser) {
    return this.unitsService.findByCode(code, req.user.branchId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update unit' })
  @ApiResponse({ status: 200, description: 'Unit updated' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUnitDto,
    @Req() req: RequestWithUser,
  ) {
    return this.unitsService.update(id, dto, req.user.branchId, req.user.id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete unit (soft delete by deactivating)' })
  @ApiResponse({ status: 204, description: 'Unit deleted' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.unitsService.remove(id, req.user.branchId, req.user.id);
  }

  @Get('base-units/list')
  @ApiOperation({ summary: 'Get all base units' })
  getBaseUnits(@Req() req: RequestWithUser) {
    return this.unitsService.getBaseUnits(req.user.branchId);
  }
}
