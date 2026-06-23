import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FormulaCostDto {
  @ApiProperty({ description: 'Formula ID to calculate cost for' })
  @IsString()
  @IsNotEmpty()
  formulaId: string;

  @ApiProperty({ description: 'Quantity in KG to produce', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  quantityKg: number;
}

export class FormulaComparisonDto {
  @ApiProperty({ description: 'Array of formula IDs to compare', type: [String] })
  @IsString({ each: true })
  formulaIds: string[];
}

export class CopyFormulaDto {
  @ApiProperty({ description: 'Source formula ID to copy from' })
  @IsString()
  @IsNotEmpty()
  sourceFormulaId: string;

  @ApiProperty({ description: 'New formula code' })
  @IsString()
  @IsNotEmpty()
  newCode: string;

  @ApiProperty({ description: 'New formula name' })
  @IsString()
  @IsNotEmpty()
  newName: string;

  @ApiProperty({ description: 'Optional modification notes' })
  @IsString()
  notes?: string;
}
