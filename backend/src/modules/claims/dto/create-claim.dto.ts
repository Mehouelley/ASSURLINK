import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateClaimDto {
  @IsString()
  client_id!: string;

  @IsString()
  policy_id!: string;

  @IsOptional()
  @IsIn(['new', 'analyzing', 'validated', 'refused', 'reimbursed', 'closed'])
  status?: 'new' | 'analyzing' | 'validated' | 'refused' | 'reimbursed' | 'closed';

  @IsOptional()
  @IsString()
  incident_date?: string;

  @IsOptional()
  @IsString()
  incident_description?: string;

  @IsOptional()
  @IsString()
  incident_location?: string;

  @IsOptional()
  @IsNumber()
  estimated_amount?: number;

  @IsOptional()
  @IsNumber()
  approved_amount?: number;

  @IsOptional()
  @IsString()
  expert_report?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
