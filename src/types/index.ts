export type UserRole = string;

export interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  country: string;
  currency: string;
  logo_url?: string;
  registration_number?: string;
  is_active: boolean;
  subscription_plan: string;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  subscription_expires_at?: string | null;
  access_reason?: 'active' | 'trial' | 'subscription' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  company_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  company?: Company;
}

export interface Client {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  address?: string;
  profession?: string;
  gender?: 'male' | 'female' | 'other';
  date_of_birth?: string;
  client_type: 'individual' | 'corporate';
  id_number?: string;
  photo_url?: string;
  is_active: boolean;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type InsuranceType = 'automobile' | 'sante' | 'vie' | 'habitation' | 'voyage' | 'entreprise' | 'moto';
export type PolicyStatus = 'draft' | 'active' | 'suspended' | 'expired' | 'cancelled';

export interface Policy {
  id: string;
  company_id: string;
  client_id: string;
  agent_id?: string;
  policy_number: string;
  insurance_type: InsuranceType;
  status: PolicyStatus;
  premium_amount: number;
  coverage_amount: number;
  deductible: number;
  start_date: string;
  end_date: string;
  description?: string;
  vehicle_info?: Record<string, unknown>;
  beneficiaries?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  client?: Client;
  agent?: Profile;
  payments?: Payment[];
}

export type ClaimStatus = 'new' | 'analyzing' | 'validated' | 'refused' | 'reimbursed' | 'closed';

export interface Claim {
  id: string;
  company_id: string;
  policy_id: string;
  client_id: string;
  claim_number: string;
  status: ClaimStatus;
  incident_date: string;
  incident_description: string;
  incident_location?: string;
  estimated_amount: number;
  approved_amount: number;
  expert_id?: string;
  expert_report?: string;
  latitude?: number;
  longitude?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  public_token?: string | null;
  public_token_expires_at?: string | null;
  public_submitted_at?: string | null;
  policy?: Policy;
  client?: Client;
  expert?: Profile;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type PaymentMethod = 'mobile_money' | 'card' | 'transfer' | 'cash';
export type PaymentType = 'premium' | 'reimbursement' | 'commission';

export interface Payment {
  id: string;
  company_id: string;
  policy_id?: string;
  client_id: string;
  claim_id?: string;
  payment_type: PaymentType;
  payment_method?: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  reference?: string;
  notes?: string;
  payment_date: string;
  created_by?: string;
  created_at: string;
  fedapay_link?: string | null;
  fedapay_transaction_id?: string | null;
  refunded_at?: string | null;
  refund_method?: string | null;
  refund_metadata?: Record<string, any> | null;
  client?: Client;
  policy?: Policy;
}

export interface Document {
  id: string;
  company_id: string;
  client_id?: string;
  policy_id?: string;
  claim_id?: string;
  name: string;
  document_type?: string;
  file_url: string;
  file_size: number;
  mime_type?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  company_id?: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  related_entity?: string;
  related_id?: string;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  label?: string | null;
  company_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type ProspectStatus = 'new' | 'contacted' | 'interested' | 'negotiating' | 'converted' | 'lost';
export type ProspectSource = 'referral' | 'cold_call' | 'web' | 'event' | 'existing_client' | 'partnership' | 'other';
export type ProspectType = 'individual' | 'corporate';

export interface Prospect {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name?: string | null;
  prospect_type: ProspectType;
  status: ProspectStatus;
  source: ProspectSource;
  assigned_to_id?: string | null;
  needs?: string | null;
  budget_estimate?: number | null;
  priority?: string | null;
  first_contact_date?: string | null;
  last_contact_date?: string | null;
  next_followup_date?: string | null;
  client_id?: string | null;
  conversion_date?: string | null;
  loss_reason?: string | null;
  notes?: string | null;
  interactions_count: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  company_id: string;
  prospect_id: string;
  quote_number: string;
  insurance_type: string;
  premium_amount: number;
  coverage_description?: string | null;
  valid_until: string;
  status?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProspectInteraction {
  id: string;
  prospect_id: string;
  type: string;
  status_before?: string | null;
  status_after?: string | null;
  summary: string;
  notes?: string | null;
  done_by_id?: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalClients: number;
  activePolicies: number;
  openClaims: number;
  monthlyRevenue: number;
  pendingPayments: number;
  totalPolicies: number;
  totalClaims: number;
  totalPayments: number;
}
