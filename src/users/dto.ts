import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
// creating new acccount
export class CreateUserDto {
  @IsString() @MaxLength(18) name!: string;
  @IsEmail() email!: string;
  @MinLength(6) password!: string;

  @IsOptional() @IsString() avatarSrc?: string;
  @IsOptional() @IsString() location?: string;
}

// update data about profile
export class UpdateUserDto {
  @IsOptional() @IsString() @MaxLength(18) name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @MinLength(6) password?: string;
  @IsOptional() @IsString() avatarSrc?: string;
  @IsOptional() @IsString() location?: string;
}

// src/users/dto/user-response.dto.ts
export class UserResponseDto {
  userId!: string;
  name!: string;
  email!: string;
  avatarSrc?: string | null;
  location?: string | null;
  unreadNotifications!: number;
  createdAt!: string;
}
