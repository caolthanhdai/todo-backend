import {
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
} from 'class-validator';
import isEmail from 'validator/lib/isEmail';
import { UserResponseDto } from '../users/dto';
// data when createting new account
export class RegisterDto {
  @IsString() @MaxLength(18) name!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(6) password!: string;
}

// receiving data when user logs in
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/; // cho username dạng phổ biến

@ValidatorConstraint({ name: 'EmailOrUsername', async: false })
class EmailOrName implements ValidatorConstraintInterface {
  validate(value: any) {
    if (typeof value !== 'string') return false;
    const v = value.trim();
    return isEmail(v) || USERNAME_REGEX.test(v);
  }

  defaultMessage() {
    return 'Trường đăng nhập phải là email hợp lệ hoặc name.';
  }
}
export class LoginDto {
  @IsString()
  @Validate(EmailOrName)
  identifier!: string;
  @IsString() password!: string;
}

// data response after login/register
export class AuthResponseDto {
  accessToken!: string;
  user!: AuthUserResponseDto;
}

export class AuthResponseHaveRefreshTokenDto {
  accessToken!: string;
  refreshToken!: string;
  user!: AuthUserResponseDto;
}

export class AuthUserResponseDto {
  userId!: number;
  email!: string;
}
