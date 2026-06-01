export class CreateProspectDto {
  first_name!: string;
  last_name!: string;
  email!: string;
  phone!: string;
  company_name?: string;
  prospect_type?: string;
  status?: string;
  source?: string;
  assigned_to_id?: string;
  needs?: string;
  budget_estimate?: number;
  priority?: string;
  next_followup_date?: string;
  notes?: string;
}
