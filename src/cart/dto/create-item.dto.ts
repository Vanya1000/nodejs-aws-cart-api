import { IsInt, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductDto } from './product.dto';

export class CartItemDto {
  @ValidateNested()
  @Type(() => ProductDto)
  product: ProductDto;

  @IsInt()
  @IsNotEmpty()
  count: number;
}
