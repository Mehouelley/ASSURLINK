import { IsEmail, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProspectDto {
  @IsString()
  first_name!: string;

  @IsString()
  last_name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsIn(['individual', 'corporate'])
  prospect_type?: string;

  @IsOptional()
  @IsIn(['new', 'contacted', 'interested', 'negotiating', 'converted', 'lost'])
  status?: string;

  @IsOptional()
  @IsIn(['referral', 'cold_call', 'web', 'event', 'existing_client', 'partnership', 'other'])
  source?: string;

  @IsOptional()
  @IsString()
  assigned_to_id?: string;

  @IsOptional()
  @IsString()
  needs?: string;

  @IsOptional()
  @IsNumber()
  budget_estimate?: number;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  next_followup_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
