import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';

@ApiTags('Inventory')
@ApiBearerAuth('access-token')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}
}
