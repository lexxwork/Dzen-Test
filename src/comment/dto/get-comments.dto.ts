import {
  IsOptional,
  IsString,
  IsNumber,
  IsBase64,
  IsEnum,
  IsBoolean,
  IsPositive,
} from 'class-validator';
import { CommentOrderBy, CommentOrderType } from 'comment/interfaces/comment.interface';

export class GetCommentsDto {
  @IsOptional()
  @IsString()
  @IsEnum(['userName', 'email', 'createdAt'])
  orderBy: CommentOrderBy;

  @IsOptional()
  @IsString()
  @IsEnum(['asc', 'desc'])
  orderType: CommentOrderType;

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
