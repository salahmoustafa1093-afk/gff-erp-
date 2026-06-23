import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';

@Injectable()
export class ParseEnumPipe<T extends Record<string, unknown>>
  implements PipeTransform
{
  constructor(private readonly enumType: T) {}

  transform(value: unknown, metadata: ArgumentMetadata): T[keyof T] {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(
        `Validation failed: ${metadata.data || 'parameter'} is required`,
      );
    }

    const enumValues = Object.values(this.enumType);

    if (!enumValues.includes(value as T[keyof T])) {
      throw new BadRequestException(
        `Validation failed: "${value}" is not a valid ${metadata.data || 'enum value'}. Allowed values: ${enumValues.join(', ')}`,
      );
    }

    return value as T[keyof T];
  }
}
