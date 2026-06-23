import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateSalesOrderDto } from './create-sales-order.dto';

export class UpdateSalesOrderDto extends PartialType(
  OmitType(CreateSalesOrderDto, ['items'] as const),
) {
  // Items can be updated separately or through the order update
}
