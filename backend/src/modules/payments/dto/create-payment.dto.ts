import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  client_id!: string;

  @IsOptional()
  @IsString()
  policy_id?: string;

  @IsOptional()
  @IsString()
  claim_id?: string;

  @IsIn(['premium', 'reimbursement', 'commission'])
  payment_type!: 'premium' | 'reimbursement' | 'commission';

  @IsOptional()
  @IsIn(['mobile_money', 'card', 'transfer', 'cash'])
  payment_method?: 'mobile_money' | 'card' | 'transfer' | 'cash';

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsIn(['pending', 'completed', 'failed', 'cancelled'])
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  payment_date!: string;

  @IsOptional()
  @IsString()
  fedapay_link?: string;

  @IsOptional()
  @IsString()
  fedapay_transaction_id?: string;
}
