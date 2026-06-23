import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { Decimal } from 'decimal.js';

@Injectable()
export class ParseDecimalPipe implements PipeTransform {
  constructor(
    private readonly options: {
      min?: number;
      max?: number;
      required?: boolean;
    } = {},
  ) {}

  transform(value: unknown, metadata: ArgumentMetadata): Decimal | undefined {
    if (value === undefined || value === null || value === '') {
      if (this.options.required !== false) {
        throw new BadRequestException(
          `Validation failed: ${metadata.data || 'value'} is required and must be a valid number`,
        );
      }
      return undefined;
    }

    let stringValue: string;

    if (typeof value === 'number') {
      if (isNaN(value) || !isFinite(value)) {
        throw new BadRequestException(
          `Validation failed: ${metadata.data || 'value'} must be a valid finite number`,
        );
      }
      stringValue = value.toString();
    } else if (typeof value === 'string') {
      stringValue = value.trim();
      if (!/^-?\d+(\.\d+)?$/.test(stringValue)) {
        throw new BadRequestException(
          `Validation failed: "${value}" is not a valid decimal number for ${metadata.data || 'value'}`,
        );
      }
    } else {
      throw new BadRequestException(
        `Validation failed: ${metadata.data || 'value'} must be a string or number representing a decimal`,
      );
    }

    let decimal: Decimal;
    try {
      decimal = new Decimal(stringValue);
    } catch {
      throw new BadRequestException(
        `Validation failed: "${value}" could not be parsed as a valid decimal`,
      );
    }

    if (this.options.min !== undefined && decimal.lessThan(this.options.min)) {
      throw new BadRequestException(
        `Validation failed: ${metadata.data || 'value'} must be at least ${this.options.min}`,
      );
    }

    if (this.options.max !== undefined && decimal.greaterThan(this.options.max)) {
      throw new BadRequestException(
        `Validation failed: ${metadata.data || 'value'} must be at most ${this.options.max}`,
      );
    }

    return decimal;
  }
}
