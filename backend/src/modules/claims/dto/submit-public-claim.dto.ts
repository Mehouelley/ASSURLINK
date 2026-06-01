import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SubmitPublicClaimDto {
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
  @IsString()
  expert_report?: string;
}
