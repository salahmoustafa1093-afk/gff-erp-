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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { branchId: string; id: string };
}

@ApiTags('Categories')
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a new product category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 409, description: 'Category already exists' })
  create(@Body() dto: CreateCategoryDto, @Req() req: RequestWithUser) {
    return this.categoriesService.create(dto, req.user.branchId, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiQuery({ name: 'parentId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of categories' })
  findAll(
    @Query('includeInactive') includeInactive?: string,
    @Query('parentId') parentId?: string,
    @Query('search') search?: string,
    @Req() req: RequestWithUser,
  ) {
    return this.categoriesService.findAll(
      req.user.branchId,
      includeInactive === 'true',
      parentId,
      search,
    );
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get category tree structure' })
  @ApiResponse({ status: 200, description: 'Hierarchical category tree' })
  getTree(@Req() req: RequestWithUser) {
    return this.categoriesService.getTree(req.user.branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category found' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.categoriesService.findOne(id, req.user.branchId);
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'Get subcategories' })
  getChildren(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.categoriesService.getChildren(id, req.user.branchId);
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Get products in category (including subcategories)' })
  getProducts(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.categoriesService.getCategoryProducts(id, req.user.branchId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.categoriesService.update(id, dto, req.user.branchId, req.user.id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: 204, description: 'Category deleted' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.categoriesService.remove(id, req.user.branchId, req.user.id);
  }
}
