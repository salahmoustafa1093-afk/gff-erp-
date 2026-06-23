import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Req,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags,
} from '@nestjs/swagger';
import { CrmService } from './crm.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ActivityFilterDto } from './dto/activity-filter.dto';

@ApiTags('CRM Activities')
@ApiBearerAuth()
@Controller('crm/activities')
export class CrmController {
  constructor(private readonly service: CrmService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new activity' })
  createActivity(@Body() dto: CreateActivityDto, @Req() req) {
    return this.service.createActivity(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'List activities with filters' })
  findAllActivities(@Query() filter: ActivityFilterDto) {
    return this.service.findAllActivities(filter);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue activities' })
  @ApiQuery({ name: 'assignedToId', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  getOverdue(
    @Query('assignedToId') assignedToId?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.service.getOverdueActivities(assignedToId, branchId);
  }

  @Get('my-activities')
  @ApiOperation({ summary: 'Get activities for current user' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getMyActivities(@Req() req, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.service.getActivitiesByUser(req.user?.id, startDate, endDate);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get activity calendar view' })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'year', required: true, type: Number })
  getCalendar(@Req() req, @Query('month') month: string, @Query('year') year: string) {
    return this.service.getActivityCalendar(req.user?.id, parseInt(month), parseInt(year));
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get activity summary for current user' })
  getSummary(@Req() req) {
    return this.service.getActivitySummary(req.user?.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get activity by ID' })
  @ApiParam({ name: 'id' })
  findOneActivity(@Param('id') id: string) {
    return this.service.findOneActivity(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update activity' })
  updateActivity(@Param('id') id: string, @Body() dto: UpdateActivityDto, @Req() req) {
    return this.service.updateActivity(id, dto, req.user?.id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark activity as completed' })
  completeActivity(@Param('id') id: string, @Body('result') result: string, @Req() req) {
    return this.service.completeActivity(id, result, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete activity' })
  removeActivity(@Param('id') id: string, @Req() req) {
    return this.service.removeActivity(id, req.user?.id);
  }
}
