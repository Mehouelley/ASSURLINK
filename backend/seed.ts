import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'Password123!';

type SeedUserRole = 'super_admin' | 'admin' | 'director' | 'commercial' | 'hr' | 'accountant' | 'agent' | 'expert' | 'client';

async function ensureProfile(params: {
  email: string;
  firstName: string;
  lastName: string;
  role: SeedUserRole;
  companyId: string;
  createAgent?: boolean;
}) {
  const existing = await prisma.profile.findUnique({ where: { email: params.email } });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const profile = await prisma.profile.create({
    data: {
      email: params.email,
      password_hash: passwordHash,
      first_name: params.firstName,
      last_name: params.lastName,
      role: params.role,
      company_id: params.companyId,
      is_active: true,
    },
  });

  if (params.createAgent) {
    await prisma.agent.upsert({
      where: { profile_id: profile.id },
      update: {},
      create: {
        profile_id: profile.id,
        company_id: params.companyId,
        commission_rate: 0.05,
        is_active: true,
      },
    });
  }

  return profile;
}

async function main() {
  console.log('🌱 Seeding demo data...');

  const admin = await prisma.profile.findUnique({ where: { email: 'superadmin@assurlink.local' } });
  if (!admin || !admin.company_id) {
    console.log('❌ Super admin not found. Run migrations first.');
    process.exit(1);
  }

  const companyId = admin.company_id;

  const director = await ensureProfile({
    email: 'director@assurlink.local',
    firstName: 'Jean',
    lastName: 'Director',
    role: 'director',
    companyId,
  });
  const commercialAlice = await ensureProfile({
    email: 'alice.commercial@assurlink.local',
    firstName: 'Alice',
    lastName: 'Commercial',
    role: 'commercial',
    companyId,
    createAgent: true,
  });
  const commercialBob = await ensureProfile({
    email: 'bob.commercial@assurlink.local',
    firstName: 'Bob',
    lastName: 'Commercial',
    role: 'commercial',
    companyId,
    createAgent: true,
  });
  const expert = await ensureProfile({
    email: 'carla.expert@assurlink.local',
    firstName: 'Carla',
    lastName: 'Expert',
    role: 'expert',
    companyId,
  });
  await ensureProfile({
    email: 'david.hr@assurlink.local',
    firstName: 'David',
    lastName: 'HR',
    role: 'hr',
    companyId,
  });
  const accountant = await ensureProfile({
    email: 'eve.accountant@assurlink.local',
    firstName: 'Eve',
    lastName: 'Accountant',
    role: 'accountant',
    companyId,
  });

  console.log('✅ Demo profiles ready');

  const clients = await Promise.all([
    prisma.client.upsert({
      where: { email: 'jean.dupont@example.com' },
      update: {},
      create: {
        company_id: companyId,
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@example.com',
        phone: '+225 01 02 03 04',
        profession: 'Ingénieur',
        gender: 'male',
        client_type: 'individual',
        is_active: true,
      },
    }),
    prisma.client.upsert({
      where: { email: 'marie.martin@example.com' },
      update: {},
      create: {
        company_id: companyId,
        first_name: 'Marie',
        last_name: 'Martin',
        email: 'marie.martin@example.com',
        phone: '+225 05 06 07 08',
        profession: 'Médecin',
        gender: 'female',
        client_type: 'individual',
        is_active: true,
      },
    }),
    prisma.client.upsert({
      where: { email: 'contact@acme.ci' },
      update: {},
      create: {
        company_id: companyId,
        first_name: 'ACME',
        last_name: 'Corp',
        email: 'contact@acme.ci',
        phone: '+225 09 10 11 12',
        client_type: 'corporate',
        is_active: true,
      },
    }),
  ]);
  console.log(`✅ Created ${clients.length} demo clients`);

  const policies = await Promise.all([
    prisma.policy.upsert({
      where: { policy_number: 'POL-2026-001' },
      update: {},
      create: {
        company_id: companyId,
        client_id: clients[0].id,
        agent_id: commercialAlice.id,
        policy_number: 'POL-2026-001',
        insurance_type: 'automobile',
        status: 'active',
        premium_amount: 150000,
        coverage_amount: 10000000,
        deductible: 50000,
        start_date: new Date('2026-01-01'),
        end_date: new Date('2026-12-31'),
        description: 'Assurance automobile tous risques',
      },
    }),
    prisma.policy.upsert({
      where: { policy_number: 'POL-2026-002' },
      update: {},
      create: {
        company_id: companyId,
        client_id: clients[1].id,
        agent_id: commercialBob.id,
        policy_number: 'POL-2026-002',
        insurance_type: 'sante',
        status: 'active',
        premium_amount: 200000,
        coverage_amount: 50000000,
        deductible: 100000,
        start_date: new Date('2026-02-01'),
        end_date: new Date('2027-02-01'),
        description: 'Assurance santé complète',
      },
    }),
    prisma.policy.upsert({
      where: { policy_number: 'POL-2026-003' },
      update: {},
      create: {
        company_id: companyId,
        client_id: clients[2].id,
        agent_id: commercialAlice.id,
        policy_number: 'POL-2026-003',
        insurance_type: 'entreprise',
        status: 'active',
        premium_amount: 500000,
        coverage_amount: 100000000,
        deductible: 500000,
        start_date: new Date('2026-01-15'),
        end_date: new Date('2027-01-15'),
        description: 'Assurance responsabilité civile entreprise',
      },
    }),
  ]);
  console.log(`✅ Created ${policies.length} demo policies`);

  const claims = await Promise.all([
    prisma.claim.upsert({
      where: { claim_number: 'CLM-2026-001' },
      update: {},
      create: {
        company_id: companyId,
        policy_id: policies[0].id,
        client_id: clients[0].id,
        claim_number: 'CLM-2026-001',
        status: 'new',
        incident_date: new Date('2026-05-20'),
        incident_description: 'Collision avec tiers',
        estimated_amount: 1500000,
        approved_amount: 0,
        created_by: director.id,
      },
    }),
    prisma.claim.upsert({
      where: { claim_number: 'CLM-2026-002' },
      update: {},
      create: {
        company_id: companyId,
        policy_id: policies[1].id,
        client_id: clients[1].id,
        expert_id: expert.id,
        claim_number: 'CLM-2026-002',
        status: 'analyzing',
        incident_date: new Date('2026-05-24'),
        incident_description: 'Hospitalisation suite à accident',
        estimated_amount: 2500000,
        approved_amount: 2000000,
        created_by: director.id,
      },
    }),
  ]);
  console.log(`✅ Created ${claims.length} demo claims`);

  const payments = await Promise.all([
    prisma.payment.upsert({
      where: { reference: 'REF-001' },
      update: {},
      create: {
        company_id: companyId,
        policy_id: policies[0].id,
        client_id: clients[0].id,
        payment_type: 'premium',
        payment_method: 'card',
        amount: 150000,
        status: 'completed',
        payment_date: new Date('2026-05-01'),
        reference: 'REF-001',
        created_by: accountant.id,
      },
    }),
    prisma.payment.upsert({
      where: { reference: 'REF-002' },
      update: {},
      create: {
        company_id: companyId,
        policy_id: policies[1].id,
        client_id: clients[1].id,
        payment_type: 'premium',
        payment_method: 'transfer',
        amount: 200000,
        status: 'completed',
        payment_date: new Date('2026-05-02'),
        reference: 'REF-002',
        created_by: accountant.id,
      },
    }),
    prisma.payment.upsert({
      where: { reference: 'REF-REIM-001' },
      update: {},
      create: {
        company_id: companyId,
        claim_id: claims[1].id,
        client_id: clients[1].id,
        payment_type: 'reimbursement',
        amount: 2000000,
        status: 'pending',
        payment_date: new Date('2026-05-26'),
        reference: 'REF-REIM-001',
        created_by: accountant.id,
      },
    }),
  ]);
  console.log(`✅ Created ${payments.length} demo payments`);

  const prospectSeeds = [
    {
      email: 'prospect.auto@exemple.ci',
      first_name: 'Koffi',
      last_name: 'Adjo',
      phone: '+225 07 11 22 33 44',
      company_name: null,
      prospect_type: 'individual' as const,
      status: 'contacted' as const,
      source: 'web' as const,
      assigned_to_id: commercialAlice.id,
      needs: 'Assurance automobile',
      budget_estimate: 180000,
      priority: 'high' as const,
      notes: 'Demande via formulaire web, relance prévue demain.',
    },
    {
      email: 'prospect.sante@exemple.ci',
      first_name: 'Awa',
      last_name: 'Traoré',
      phone: '+225 05 55 66 77 88',
      company_name: null,
      prospect_type: 'individual' as const,
      status: 'interested' as const,
      source: 'referral' as const,
      assigned_to_id: commercialBob.id,
      needs: 'Assurance santé famille',
      budget_estimate: 250000,
      priority: 'medium' as const,
      notes: 'Intéressée par une offre famille avec option dentaire.',
    },
    {
      email: 'prospect.pro@exemple.ci',
      first_name: 'Tech',
      last_name: 'Solutions',
      phone: '+225 01 99 88 77 66',
      company_name: 'Tech Solutions CI',
      prospect_type: 'corporate' as const,
      status: 'negotiating' as const,
      source: 'partnership' as const,
      assigned_to_id: commercialAlice.id,
      needs: 'Responsabilité civile professionnelle + flotte',
      budget_estimate: 850000,
      priority: 'high' as const,
      notes: 'Devis envoyé, attente validation direction.',
    },
    {
      email: 'prospect.logistique@exemple.ci',
      first_name: 'Mamadou',
      last_name: 'Koné',
      phone: '+225 03 22 44 55 66',
      company_name: 'Trans Log CI',
      prospect_type: 'corporate' as const,
      status: 'lost' as const,
      source: 'cold_call' as const,
      assigned_to_id: commercialBob.id,
      needs: 'Assurance transport',
      budget_estimate: 600000,
      priority: 'low' as const,
      notes: 'Perdu sur budget, suivi requalification Q3.',
    },
  ];

  for (const p of prospectSeeds) {
    const existing = await prisma.prospect.findUnique({ where: { email: p.email } });
    if (!existing) {
      await prisma.prospect.create({
        data: {
          company_id: companyId,
          first_name: p.first_name,
          last_name: p.last_name,
          email: p.email,
          phone: p.phone,
          company_name: p.company_name ?? undefined,
          prospect_type: p.prospect_type,
          status: p.status,
          source: p.source,
          assigned_to_id: p.assigned_to_id,
          needs: p.needs,
          budget_estimate: p.budget_estimate,
          priority: p.priority,
          first_contact_date: new Date('2026-05-10'),
          last_contact_date: new Date('2026-05-26'),
          next_followup_date: p.status === 'negotiating' ? new Date('2026-05-30') : undefined,
          notes: p.notes,
          created_by: director.id,
        },
      });
    }
  }

  const prospectAuto = await prisma.prospect.findUnique({ where: { email: 'prospect.auto@exemple.ci' } });
  const prospectSante = await prisma.prospect.findUnique({ where: { email: 'prospect.sante@exemple.ci' } });
  const prospectPro = await prisma.prospect.findUnique({ where: { email: 'prospect.pro@exemple.ci' } });

  if (prospectAuto) {
    const existingQuote = await prisma.quote.findUnique({ where: { quote_number: 'QTE-2026-001' } });
    if (!existingQuote) {
      await prisma.quote.create({
        data: {
          company_id: companyId,
          prospect_id: prospectAuto.id,
          quote_number: 'QTE-2026-001',
          insurance_type: 'automobile',
          premium_amount: 180000,
          coverage_description: 'Couverture tous risques + assistance routière',
          valid_until: new Date('2026-06-15'),
          status: 'sent',
          created_by: commercialAlice.id,
        },
      });
    }
  }

  if (prospectSante) {
    const existingQuote = await prisma.quote.findUnique({ where: { quote_number: 'QTE-2026-002' } });
    if (!existingQuote) {
      await prisma.quote.create({
        data: {
          company_id: companyId,
          prospect_id: prospectSante.id,
          quote_number: 'QTE-2026-002',
          insurance_type: 'sante',
          premium_amount: 250000,
          coverage_description: 'Pack famille + dentaire + hospitalisation',
          valid_until: new Date('2026-06-20'),
          status: 'draft',
          created_by: commercialBob.id,
        },
      });
    }
  }

  if (prospectPro) {
    const existingQuote = await prisma.quote.findUnique({ where: { quote_number: 'QTE-2026-003' } });
    if (!existingQuote) {
      await prisma.quote.create({
        data: {
          company_id: companyId,
          prospect_id: prospectPro.id,
          quote_number: 'QTE-2026-003',
          insurance_type: 'professionnelle',
          premium_amount: 850000,
          coverage_description: 'RC pro + flotte + dommages aux biens',
          valid_until: new Date('2026-06-25'),
          status: 'sent',
          created_by: commercialAlice.id,
        },
      });
    }
  }

  console.log('✅ Created demo prospects and quotes');
  console.log('✨ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
