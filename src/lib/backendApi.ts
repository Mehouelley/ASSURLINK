type BackendSession = {
	access_token: string;
	refresh_token: string;
	user: {
		id: string;
		email: string;
		role: string;
		companyId?: string | null;
	};
};

type BackendAuthResponse = {
	accessToken?: string;
	refreshToken?: string;
	access_token?: string;
	refresh_token?: string;
	user?: {
		id?: string;
		email?: string;
		role?: string;
		company_id?: string | null;
		companyId?: string | null;
	};
	company?: unknown;
};

type FedapayPolicyPaymentPayload = {
	policyId: string;
	clientId: string;
	amount: number;
	phoneNumber: string;
	reference?: string;
};

type FedapayClaimReimbursementPayload = {
	claimId: string;
	clientId: string;
	amount: number;
	phoneNumber: string;
	reference?: string;
};

type SendPaymentLinkResponse = {
	success: boolean;
	message?: string;
	email_sent?: boolean;
	whatsapp_sent?: boolean;
};

type PublicClaimResponse = {
	id: string;
	claim_number: string;
	status: string;
	incident_date: string;
	incident_description: string;
	incident_location?: string | null;
	estimated_amount?: number | null;
	client?: { first_name?: string; last_name?: string; email?: string; phone?: string } | null;
	policy?: { policy_number?: string; insurance_type?: string } | null;
	company?: { name?: string; email?: string; phone?: string } | null;
};

type SubmitPublicClaimPayload = {
	incident_date?: string;
	incident_description?: string;
	incident_location?: string;
	estimated_amount?: number;
	expert_report?: string;
};

type GeneratePublicClaimLinkResponse = {
	token: string;
	url: string;
};

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
const SESSION_KEY = 'assurlink.session';

function readSession(): BackendSession | null {
	const raw = localStorage.getItem(SESSION_KEY);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as BackendSession;
	} catch {
		return null;
	}
}

function writeSession(session: BackendSession | null) {
	if (session) {
		localStorage.setItem(SESSION_KEY, JSON.stringify(session));
	} else {
		localStorage.removeItem(SESSION_KEY);
	}
}

function authHeaders(): Record<string, string> {
	const session = readSession();
	return session?.access_token
		? { Authorization: `Bearer ${session.access_token}` }
		: {};
}

async function parseResponse<T>(response: Response): Promise<{ data: T | null; error: Error | null }> {
	const contentType = response.headers.get('content-type') ?? '';
	const payload = contentType.includes('application/json') ? await response.json().catch(() => null) : await response.text().catch(() => null);

	if (!response.ok) {
		const message = typeof payload === 'string'
			? payload
			: payload?.message ?? payload?.error ?? response.statusText ?? 'Request failed';
		return { data: null, error: new Error(message) };
	}

	return { data: payload as T, error: null };
}

async function backendRequest<T>(path: string, init?: RequestInit): Promise<{ data: T | null; error: Error | null }> {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		...init,
		headers: {
			'Content-Type': 'application/json',
			...authHeaders(),
			...(init?.headers ?? {}),
		},
	});

	return parseResponse<T>(response);
}

function normalizeAuthResponse(data: BackendAuthResponse) {
	const accessToken = data.accessToken ?? data.access_token ?? '';
	const refreshToken = data.refreshToken ?? data.refresh_token ?? '';

	return {
		access_token: accessToken,
		refresh_token: refreshToken,
		user: {
			id: data.user?.id ?? '',
			email: data.user?.email ?? '',
			role: data.user?.role ?? 'client',
			company_id: data.user?.company_id ?? data.user?.companyId ?? null,
			first_name: (data.user as any)?.firstName ?? (data.user as any)?.first_name ?? null,
			last_name: (data.user as any)?.lastName ?? (data.user as any)?.last_name ?? null,
		},
	};
}

function tablePath(table: string) {
	const map: Record<string, string> = {
		profiles: '/users',
		users: '/users',
		companies: '/companies',
		clients: '/clients',
		prospects: '/prospects',
		quotes: '/quotes',
		prospect_interactions: '/prospect-interactions',
		policies: '/policies',
		claims: '/claims',
		payments: '/payments',
		documents: '/documents',
		notifications: '/notifications',
		agents: '/agents',
		roles: '/roles',
	};

	return map[table] ?? `/${table}`;
}

async function getPublicClaim(token: string) {
	return backendRequest<PublicClaimResponse>(`/public/claims/${token}`);
}

async function submitPublicClaim(token: string, payload: SubmitPublicClaimPayload) {
	return backendRequest(`/public/claims/${token}/submit`, {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

async function generatePublicClaimLink(claimId: string) {
	return backendRequest<GeneratePublicClaimLinkResponse>(`/claims/${claimId}/public-link`, {
		method: 'POST',
	});
}

function singularPath(table: string, id: string) {
	return `${tablePath(table)}/${id}`;
}

class BackendQueryBuilder<T = any> {
	private filters: Array<{ type: 'eq' | 'in'; column: string; value: unknown }> = [];
	private orGroups: Array<Array<{ column: string; value: string }>> = [];
	private orderBy: { column: string; ascending: boolean } | null = null;
	private limitCount: number | null = null;
	private mode: 'select' | 'insert' | 'update' | 'delete' = 'select';
	private payload: Record<string, unknown> | Record<string, unknown>[] | null = null;
	private returning = false;

	constructor(private readonly table: string) {}

	select(_columns = '*', _options?: { count?: 'exact' }) {
		if (this.mode === 'insert' || this.mode === 'update') {
			this.returning = true;
			return this;
		}

		this.mode = 'select';
		return this;
	}

	insert(values: Record<string, unknown> | Record<string, unknown>[], _options?: { returning?: 'representation' }) {
		this.mode = 'insert';
		this.payload = values;
		return this;
	}

	update(values: Record<string, unknown>) {
		this.mode = 'update';
		this.payload = values;
		return this;
	}

	delete() {
		this.mode = 'delete';
		return this;
	}

	eq(column: string, value: unknown) {
		this.filters.push({ type: 'eq', column, value });
		return this;
	}

	in(column: string, values: unknown[]) {
		this.filters.push({ type: 'in', column, value: values });
		return this;
	}

	or(expression: string) {
		const groups = expression
			.split(',')
			.map((part) => part.trim())
			.filter(Boolean)
			.map((part) => {
				const [column, operator, ...rest] = part.split('.');
				const value = rest.join('.');
				if (operator !== 'eq') return null;
				return { column, value };
			})
			.filter((item): item is { column: string; value: string } => item !== null);

		if (groups.length > 0) {
			this.orGroups.push(groups);
		}

		return this;
	}

	order(column: string, options?: { ascending?: boolean }) {
		this.orderBy = { column, ascending: options?.ascending ?? true };
		return this;
	}

	limit(count: number) {
		this.limitCount = count;
		return this;
	}

	single() {
		this.returning = true;
		return this;
	}

	maybeSingle() {
		this.returning = true;
		return this;
	}

	then<TResult1 = { data: T | null; error: Error | null; count?: number | null }, TResult2 = never>(
		onfulfilled?: ((value: { data: T | null; error: Error | null; count?: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
		onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
	) {
		return this.execute().then(onfulfilled, onrejected);
	}

	private async fetchCollection(): Promise<any[]> {
		const { data, error } = await backendRequest<any[]>(tablePath(this.table));
		if (error) throw error;
		return Array.isArray(data) ? data : [];
	}

	private applyFilters(items: any[]) {
		let result = [...items];

		for (const filter of this.filters) {
			if (filter.type === 'eq') {
				result = result.filter((item) => item?.[filter.column] === filter.value);
			} else if (filter.type === 'in') {
				const set = new Set(filter.value as unknown[]);
				result = result.filter((item) => set.has(item?.[filter.column]));
			}
		}

		if (this.orGroups.length > 0) {
			result = result.filter((item) =>
				this.orGroups.some((group) =>
					group.some((condition) => String(item?.[condition.column]) === String(condition.value)),
				),
			);
		}

		if (this.orderBy) {
			const { column, ascending } = this.orderBy;
			result.sort((a, b) => {
				const av = a?.[column];
				const bv = b?.[column];
				if (av === bv) return 0;
				const comparison = av > bv ? 1 : -1;
				return ascending ? comparison : -comparison;
			});
		}

		if (this.limitCount !== null) {
			result = result.slice(0, this.limitCount);
		}

		return result;
	}

	private async execute() {
		if (this.mode === 'select') {
			const items = this.applyFilters(await this.fetchCollection());
			const data = this.returning ? (items[0] ?? null) : items;
			return { data: data as T | null, error: null, count: items.length };
		}

		const idFilter = this.filters.find((f) => f.type === 'eq' && f.column === 'id');

		if (this.mode === 'insert') {
			const body = this.payload ?? {};
			const { data, error } = await backendRequest<T>(tablePath(this.table), {
				method: 'POST',
				body: JSON.stringify(body),
			});
			return { data, error };
		}

		if (!idFilter || typeof idFilter.value !== 'string') {
			return { data: null, error: new Error(`Missing id filter for ${this.mode} on ${this.table}`) };
		}

		const id = idFilter.value;

		if (this.table === 'notifications' && this.mode === 'update') {
			const { data, error } = await backendRequest<T>(`/notifications/${id}/read`, {
				method: 'PATCH',
			});
			return { data, error };
		}

		if (this.mode === 'delete') {
			const { data, error } = await backendRequest<T>(singularPath(this.table, id), { method: 'DELETE' });
			return { data, error };
		}

		const { data, error } = await backendRequest<T>(singularPath(this.table, id), {
			method: 'PATCH',
			body: JSON.stringify(this.payload ?? {}),
		});
		return { data, error };
	}
}

async function signInWithPassword({ email, password }: { email: string; password: string }) {
	const { data, error } = await backendRequest<BackendAuthResponse>('/auth/login', {
		method: 'POST',
		body: JSON.stringify({ email, password }),
	});

	if (data) {
		const session = normalizeAuthResponse(data);
		writeSession({
			access_token: session.access_token,
			refresh_token: session.refresh_token,
			user: session.user,
		});
	}

	return { data, error };
}

async function signUp({
	email,
	password,
	options,
}: {
	email: string;
	password: string;
	options?: { data?: Record<string, unknown> };
}) {
	const payload = options?.data ?? {};
	const { data, error } = await backendRequest<BackendAuthResponse>('/auth/register', {
		method: 'POST',
		body: JSON.stringify({
			email,
			password,
			firstName: String(payload.first_name ?? payload.firstName ?? ''),
			lastName: String(payload.last_name ?? payload.lastName ?? ''),
			companyName: String(payload.company_name ?? payload.companyName ?? 'ASSURLINK'),
			phone: payload.phone ? String(payload.phone) : undefined,
		}),
	});

	if (data) {
		const session = normalizeAuthResponse(data);
		writeSession({
			access_token: session.access_token,
			refresh_token: session.refresh_token,
			user: session.user,
		});
	}

	return { data, error };
}

async function signOut() {
	writeSession(null);
	return { error: null };
}

async function getSession() {
	const session = readSession();
	if (!session) {
		return { data: { session: null } };
	}

	return {
		data: {
			session: {
				access_token: session.access_token,
				refresh_token: session.refresh_token,
				user: session.user,
			},
		},
	};
}

function onAuthStateChange(callback: (event: string, session: unknown) => void) {
	const handler = () => {
		const session = readSession();
		callback('TOKEN_CHANGED', session ? { access_token: session.access_token, refresh_token: session.refresh_token, user: session.user } : null);
	};

	window.addEventListener('storage', handler);
	return {
		data: {
			subscription: {
				unsubscribe: () => window.removeEventListener('storage', handler),
			},
		},
	};
}

async function me() {
	const { data, error } = await backendRequest<BackendAuthResponse>('/auth/me');
	if (error || !data) return { data: null, error };

	// backend /auth/me returns { user, company }
	const normalized = {
		user: {
			id: data.user?.id ?? '',
			email: data.user?.email ?? '',
			role: data.user?.role ?? 'client',
			company_id: data.user?.company_id ?? data.user?.companyId ?? null,
			first_name: (data.user as any)?.firstName ?? (data.user as any)?.first_name ?? null,
			last_name: (data.user as any)?.lastName ?? (data.user as any)?.last_name ?? null,
		  },
		company: data.company ?? null,
	};

	return { data: normalized as any, error: null };
}

async function activateTrial() {
	return backendRequest('/auth/activate-trial', {
		method: 'POST',
	});
}

async function createFedapayPolicyPayment(payload: FedapayPolicyPaymentPayload) {
	return backendRequest('/payments/fedapay/policy-payment', {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

async function createFedapayClaimReimbursement(payload: FedapayClaimReimbursementPayload) {
	return backendRequest('/payments/fedapay/claim-reimbursement', {
		method: 'POST',
		body: JSON.stringify(payload),
	});
}

async function getFedapayTransactionStatus(transactionId: string) {
	return backendRequest(`/payments/fedapay/${transactionId}/status`);
}

async function sendPaymentLink(paymentId: string) {
	return backendRequest<SendPaymentLinkResponse>(`/payments/${paymentId}/send-link`, {
		method: 'POST',
	});
}

async function refundPayment(paymentId: string) {
	return backendRequest(`/payments/${paymentId}/refund`, { method: 'POST' });
}

export const backendApi = {
	auth: {
		signInWithPassword,
		signUp,
		signOut,
		getSession,
		onAuthStateChange,
		me,
		activateTrial,
		admin: {
			createUser: async () => ({
				data: null,
				error: new Error('La création directe d’utilisateurs se fait via le backend.'),
			}),
		},
	},
	payments: {
		createFedapayPolicyPayment,
		createFedapayClaimReimbursement,
		getFedapayTransactionStatus,
		refundPayment,
		sendPaymentLink,
	},
	claims: {
		getPublicClaim,
		submitPublicClaim,
		generatePublicClaimLink,
	},
	from<T = any>(table: string) {
		return new BackendQueryBuilder<T>(table);
	},
};