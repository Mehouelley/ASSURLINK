import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.resolve(__dirname, '../backend/.env'));
loadEnvFile(path.resolve(__dirname, '../.env'));

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Nettoyage pour rendre le seed réexécutable sans erreur de doublon
  await prisma.document.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.client.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.company.deleteMany();

  // Create company
  const company = await prisma.company.create({
    data: {
      id: crypto.randomUUID(),
      name: 'AssurLink Insurance Co',
      email: 'contact@assurlink.local',
      phone: '+225 01 02 03 04 05',
      country: 'Côte d\'Ivoire',
      address: 'Avenue Marchand, Plateau',
      currency: 'XOF',
      logo_url: 'https://via.placeholder.com/150',
      is_active: true,
    },
  });

  console.log(`✅ Company created: ${company.name}`);

  // Hash passwords
  const superAdminPassword = await bcrypt.hash('SuperAdmin123!', 10);
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const agentPassword = await bcrypt.hash('Agent123!', 10);

  // Create Super Admin
  const superAdmin = await prisma.profile.create({
    data: {
      id: crypto.randomUUID(),
      email: 'superadmin@assurlink.local',
      first_name: 'Super',
      last_name: 'Admin',
      password_hash: superAdminPassword,
      role: 'super_admin',
      company_id: company.id,
      is_active: true,
    },
  });

  console.log(`✅ Super Admin created: ${superAdmin.email}`);

  // Create Admin
  const admin = await prisma.profile.create({
    data: {
      id: crypto.randomUUID(),
      email: 'admin@assurlink.local',
      first_name: 'Admin',
      last_name: 'User',
      password_hash: adminPassword,
      role: 'admin',
      company_id: company.id,
      is_active: true,
    },
  });

  console.log(`✅ Admin created: ${admin.email}`);

  // Create Agents
  const agent1 = await prisma.profile.create({
    data: {
      id: crypto.randomUUID(),
      email: 'agent1@assurlink.local',
      first_name: 'Jean',
      last_name: 'Dupont',
      password_hash: agentPassword,
      role: 'agent',
      company_id: company.id,
      is_active: true,
      phone: '+225 01 02 03 04',
    },
  });

  const agent2 = await prisma.profile.create({
    data: {
      id: crypto.randomUUID(),
      email: 'agent2@assurlink.local',
      first_name: 'Marie',
      last_name: 'Martin',
      password_hash: agentPassword,
      role: 'agent',
      company_id: company.id,
      is_active: true,
      phone: '+225 05 06 07 08',
    },
  });

  console.log(`✅ Agents created: ${agent1.first_name} & ${agent2.first_name}`);

  // Create Expert
  const expert = await prisma.profile.create({
    data: {
      id: crypto.randomUUID(),
      email: 'expert@assurlink.local',
      first_name: 'Dr.',
      last_name: 'Expert',
      password_hash: agentPassword,
      role: 'expert',
      company_id: company.id,
      is_active: true,
    },
  });

  console.log(`✅ Expert created: ${expert.email}`);

  // Create Clients
  const client1 = await prisma.client.create({
    data: {
      id: crypto.randomUUID(),
      client_type: 'individual',
      first_name: 'Michel',
      last_name: 'Kouame',
      email: 'michel.kouame@email.com',
      phone: '+225 40 11 22 33',
      company_id: company.id,
      is_active: true,
    },
  });

  const client2 = await prisma.client.create({
    data: {
      id: crypto.randomUUID(),
      client_type: 'corporate',
      first_name: 'Tech',
      last_name: 'Solutions SARL',
      email: 'contact@techsolutions.ci',
      phone: '+225 40 44 55 66',
      company_id: company.id,
      is_active: true,
    },
  });

  console.log(`✅ Clients created: ${client1.first_name} & ${client2.last_name}`);

  // Create Policies
  const policy1 = await prisma.policy.create({
    data: {
      id: crypto.randomUUID(),
      policy_number: `POL-${Date.now()}-001`,
      client_id: client1.id,
      insurance_type: 'Auto',
      coverage_amount: 50000000,
      premium_amount: 450000,
      start_date: new Date('2026-01-01'),
      end_date: new Date('2027-01-01'),
      status: 'active',
      company_id: company.id,
    },
  });

  const policy2 = await prisma.policy.create({
    data: {
      id: crypto.randomUUID(),
      policy_number: `POL-${Date.now()}-002`,
      client_id: client2.id,
      insurance_type: 'Health',
      coverage_amount: 100000000,
      premium_amount: 950000,
      start_date: new Date('2026-02-15'),
      end_date: new Date('2027-02-15'),
      status: 'active',
      company_id: company.id,
    },
  });

  console.log(`✅ Policies created: ${policy1.policy_number} & ${policy2.policy_number}`);

  // Create Claims
  const claim1 = await prisma.claim.create({
    data: {
      id: crypto.randomUUID(),
      claim_number: `SIN-${Date.now()}-001`,
      policy_id: policy1.id,
      client_id: client1.id,
      incident_date: new Date('2026-05-15'),
      incident_description: 'Car accident on the highway',
      status: 'analyzing',
      company_id: company.id,
    },
  });

  console.log(`✅ Claim created: ${claim1.claim_number}`);

  // Create Payments
  const payment1 = await prisma.payment.create({
    data: {
      id: crypto.randomUUID(),
      policy_id: policy1.id,
      client_id: client1.id,
      amount: 450000,
      payment_type: 'premium',
      payment_method: 'mobile_money',
      status: 'completed',
       payment_date: new Date(),
      updated_at: new Date(),
      reference: `TRX-${Date.now()}-001`,
      company_id: company.id,
    },
  });

  const payment2 = await prisma.payment.create({
    data: {
      id: crypto.randomUUID(),
      policy_id: policy2.id,
      client_id: client2.id,
      amount: 950000,
      payment_type: 'premium',
      payment_method: 'card',
      status: 'pending',
       payment_date: new Date(),
      updated_at: new Date(),
      reference: `TRX-${Date.now()}-002`,
      company_id: company.id,
    },
  });

  console.log(`✅ Payments created: ${payment1.reference} & ${payment2.reference}`);

  // Create Documents
  const doc1 = await prisma.document.create({
    data: {
      id: crypto.randomUUID(),
      name: 'policy-scan.pdf',
      file_url: 'https://via.placeholder.com/files/policy.pdf',
      file_size: 2048,
      document_type: 'pdf',
      updated_at: new Date(),
      policy_id: policy1.id,
      client_id: client1.id,
      company_id: company.id,
      uploaded_by: agent1.id,
    },
  });

  console.log(`✅ Document created: ${doc1.name}`);

  // Create Notifications
  await prisma.notification.create({
    data: {
      id: crypto.randomUUID(),
      title: 'Welcome to AssurLink',
      message: 'Your account has been created successfully',
      company_id: company.id,
      user_id: admin.id,
      type: 'system',
      updated_at: new Date(),
      is_read: false,
    },
  });

  await prisma.notification.create({
    data: {
      id: crypto.randomUUID(),
      title: 'New Claim',
      message: 'A new insurance claim has been filed',
      company_id: company.id,
      type: 'alert',
      updated_at: new Date(),
      is_read: false,
    },
  });

  console.log(`✅ Notifications created`);

  // Create Agent record
  const agentRecord = await prisma.agent.create({
    data: {
      id: crypto.randomUUID(),
      profile_id: agent1.id,
      company_id: company.id,
      commission_rate: 5.5,
      updated_at: new Date(),
    },
  });

  console.log(`✅ Agent record created for: ${agent1.first_name}`);

  console.log('✨ Seeding completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('  Super Admin: superadmin@assurlink.local / SuperAdmin123!');
  console.log('  Admin: admin@assurlink.local / Admin123!');
  console.log('  Agent: agent1@assurlink.local / Agent123!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
