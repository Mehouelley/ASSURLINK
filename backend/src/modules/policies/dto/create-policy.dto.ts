import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePolicyDto {
  @IsString()
  client_id!: string;

  @IsIn(['automobile', 'sante', 'vie', 'habitation', 'voyage', 'entreprise', 'moto'])
  insurance_type!: 'automobile' | 'sante' | 'vie' | 'habitation' | 'voyage' | 'entreprise' | 'moto';

  @IsIn(['draft', 'active', 'suspended', 'expired', 'cancelled'])
  status!: 'draft' | 'active' | 'suspended' | 'expired' | 'cancelled';

  @IsNumber()
  premium_amount!: number;

  @IsOptional()
  @IsNumber()
  coverage_amount?: number;

  @IsOptional()
  @IsNumber()
  deductible?: number;

  @IsString()
  start_date!: string;

  @IsString()
  end_date!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
