import { IsOptional, IsString } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  document_type?: string;

  @IsString()
  file_url!: string;

  @IsOptional()
  @IsString()
  client_id?: string;

  @IsOptional()
  @IsString()
  policy_id?: string;

  @IsOptional()
  @IsString()
  claim_id?: string;
}
