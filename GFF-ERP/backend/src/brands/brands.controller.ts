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
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { branchId: string; id: string };
}

@ApiTags('Brands')
@Controller('brands')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a new brand' })
  @ApiResponse({ status: 201, description: 'Brand created successfully' })
  @ApiResponse({ status: 409, description: 'Brand already exists' })
  create(@Body() dto: CreateBrandDto, @Req() req: RequestWithUser) {
    return this.brandsService.create(dto, req.user.branchId, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all brands' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of brands' })
  findAll(
    @Query('includeInactive') includeInactive?: string,
    @Query('search') search?: string,
    @Req() req: RequestWithUser,
  ) {
    return this.brandsService.findAll(
      req.user.branchId,
      includeInactive === 'true',
      search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get brand by ID' })
  @ApiResponse({ status: 200, description: 'Brand found' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.brandsService.findOne(id, req.user.branchId);
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Get products for a brand' })
  @ApiResponse({ status: 200, description: 'List of products' })
  getBrandProducts(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.brandsService.getBrandProducts(id, req.user.branchId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update brand' })
  @ApiResponse({ status: 200, description: 'Brand updated' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBrandDto,
    @Req() req: RequestWithUser,
  ) {
    return this.brandsService.update(id, dto, req.user.branchId, req.user.id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete brand' })
  @ApiResponse({ status: 204, description: 'Brand deleted' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.brandsService.remove(id, req.user.branchId, req.user.id);
  }
}
