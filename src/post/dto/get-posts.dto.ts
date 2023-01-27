import {
  IsOptional,
  IsString,
  IsNumber,
  IsBase64,
  IsEnum,
  IsBoolean,
  IsPositive,
} from 'class-validator';
import { PostOrderBy, PostOrderType } from 'post/interfaces/post.interface';

export class GetPostsDto {
  @IsOptional()
  @IsString()
  @IsEnum(['userName', 'email', 'createdAt'])
  orderBy: PostOrderBy;

  @IsOptional()
  @IsString()
  @IsEnum(['asc', 'desc'])
  orderType: PostOrderType;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  limit: number;

  @IsOptional()
  @IsBase64()
  cursor: string;

  @IsOptional()
  @IsBoolean()
  reverse: boolean;
}
