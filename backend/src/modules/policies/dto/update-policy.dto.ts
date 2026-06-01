import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePolicyDto {
  @IsOptional()
  @IsString()
  client_id?: string;

  @IsOptional()
  @IsIn(['automobile', 'sante', 'vie', 'habitation', 'voyage', 'entreprise', 'moto'])
  insurance_type?: 'automobile' | 'sante' | 'vie' | 'habitation' | 'voyage' | 'entreprise' | 'moto';

  @IsOptional()
  @IsIn(['draft', 'active', 'suspended', 'expired', 'cancelled'])
  status?: 'draft' | 'active' | 'suspended' | 'expired' | 'cancelled';

  @IsOptional()
  @IsNumber()
  premium_amount?: number;

  @IsOptional()
  @IsNumber()
  coverage_amount?: number;

  @IsOptional()
  @IsNumber()
  deductible?: number;

  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  end_date?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
