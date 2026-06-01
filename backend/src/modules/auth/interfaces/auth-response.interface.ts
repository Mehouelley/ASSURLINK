// Role is stored as string (dynamic Role model)
export interface AuthUserPayload {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  companyId?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUserPayload;
}

export interface CompanyAccessStatus {
  is_active: boolean;
  trial_started_at?: Date | string | null;
  trial_ends_at?: Date | string | null;
  subscription_expires_at?: Date | string | null;
  access_reason?: 'active' | 'trial' | 'subscription' | 'expired';
}
