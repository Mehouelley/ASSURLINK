import { IsString, IsNumber, IsPhoneNumber, IsOptional, Min } from 'class-validator';

export class CreatePolicyPaymentDto {
  @IsString()
  policyId!: string;

  @IsString()
  clientId!: string;

  @IsNumber()
  @Min(100, { message: 'Montant minimum: 100 XOF' })
  amount!: number;

  @IsString()
  phoneNumber!: string; // Format: +22900000000

  @IsOptional()
  @IsString()
  reference?: string;
}

export class CreateClaimReimbursementDto {
  @IsString()
  claimId!: string;

  @IsString()
  clientId!: string;

  @IsNumber()
  @Min(100, { message: 'Montant minimum: 100 XOF' })
  amount!: number;

  @IsString()
  phoneNumber!: string;

  @IsOptional()
  @IsString()
  reference?: string;
}
