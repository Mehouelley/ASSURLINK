import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  @IsString()
  first_name!: string;

  @IsString()
  last_name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  profession?: string;

  @IsOptional()
  @IsIn(['male', 'female', 'other'])
  gender?: 'male' | 'female' | 'other';

  @IsOptional()
  @IsString()
  date_of_birth?: string;

  @IsOptional()
  @IsIn(['individual', 'corporate'])
  client_type?: 'individual' | 'corporate';

  @IsOptional()
  @IsString()
  id_number?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
