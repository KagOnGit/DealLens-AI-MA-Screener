import { db } from './index';

async function seed() {
  console.log('🌱 Seeding database...');

  // Create sample companies
  const companies = await Promise.all([
    db.company.upsert({
      where: { ticker: 'AAPL' },
      update: {},
      create: {
        ticker: 'AAPL',
        name: 'Apple Inc.',
        description: 'Technology company that designs, develops, and sells consumer electronics, computer software, and online services.',
        industry: 'Technology Hardware & Equipment',
        sector: 'Technology',
        country: 'United States',
        marketCap: 2800000000000,
        employees: 161000,
        foundedYear: 1976,
        website: 'https://www.apple.com',
        headquarters: 'Cupertino, CA',
      },
    }),
    
    db.company.upsert({
      where: { ticker: 'MSFT' },
      update: {},
      create: {
        ticker: 'MSFT',
        name: 'Microsoft Corporation',
        description: 'Multinational technology company that develops, manufactures, licenses, supports, and sells computer software, consumer electronics, personal computers, and related services.',
        industry: 'Software',
        sector: 'Technology',
        country: 'United States',
        marketCap: 2500000000000,
        employees: 221000,
        foundedYear: 1975,
        website: 'https://www.microsoft.com',
        headquarters: 'Redmond, WA',
      },
    }),

    db.company.upsert({
      where: { ticker: 'GOOGL' },
      update: {},
      create: {
        ticker: 'GOOGL',
        name: 'Alphabet Inc.',
        description: 'Multinational conglomerate that specializes in Internet-related services and products.',
        industry: 'Interactive Media & Services',
        sector: 'Communication Services',
        country: 'United States',
        marketCap: 1600000000000,
        employees: 182000,
        foundedYear: 1998,
        website: 'https://abc.xyz',
        headquarters: 'Mountain View, CA',
      },
    }),

    db.company.upsert({
      where: { ticker: 'TSLA' },
      update: {},
      create: {
        ticker: 'TSLA',
        name: 'Tesla, Inc.',
        description: 'Electric vehicle and clean energy company.',
        industry: 'Automobiles',
        sector: 'Consumer Discretionary',
        country: 'United States',
        marketCap: 800000000000,
        employees: 140000,
        foundedYear: 2003,
        website: 'https://www.tesla.com',
        headquarters: 'Austin, TX',
      },
    }),
  ]);

  console.log(`✅ Created ${companies.length} companies`);

  // Create sample financial metrics
  for (const company of companies) {
    await db.financialMetric.upsert({
      where: {
        companyId_period_periodType: {
          companyId: company.id,
          period: 'Q3 2024',
          periodType: 'QUARTERLY',
        },
      },
      update: {},
      create: {
        companyId: company.id,
        period: 'Q3 2024',
        periodType: 'QUARTERLY',
        fiscalYear: 2024,
        fiscalQuarter: 3,
        revenue: Math.floor(Math.random() * 100000000000),
        grossProfit: Math.floor(Math.random() * 50000000000),
        netIncome: Math.floor(Math.random() * 25000000000),
        totalAssets: Math.floor(Math.random() * 500000000000),
        cash: Math.floor(Math.random() * 100000000000),
        peRatio: Math.random() * 50 + 10,
        roe: Math.random() * 0.3 + 0.05,
      },
    });
  }

  console.log('✅ Created sample financial metrics');

  // Create a sample deal
  const sampleDeal = await db.deal.upsert({
    where: {
      id: 'sample-deal-1',
    },
    update: {},
    create: {
      id: 'sample-deal-1',
      acquirerId: companies[0].id, // Apple
      targetId: companies[1].id,   // Microsoft (hypothetical)
      announcedDate: new Date('2024-01-15'),
      status: 'ANNOUNCED',
      dealValue: 50000000000,
      dealType: 'ACQUISITION',
      paymentMethod: 'MIXED',
      synopsis: 'Hypothetical acquisition to strengthen cloud services portfolio',
      rationale: 'Strategic acquisition to enhance enterprise software capabilities',
      premium: 25.5,
    },
  });

  console.log('✅ Created sample deal');

  // Create admin user
  const adminUser = await db.user.upsert({
    where: { email: 'admin@deallens.com' },
    update: {},
    create: {
      email: 'admin@deallens.com',
      name: 'Admin User',
      role: 'ADMIN',
      passwordHash: '$2a$12$dummy.hash.for.development',
    },
  });

  console.log('✅ Created admin user');

  // Create sample watchlist
  const watchlist = await db.watchlist.create({
    data: {
      userId: adminUser.id,
      name: 'Tech Giants',
      description: 'Major technology companies to monitor',
      isDefault: true,
      items: {
        create: companies.map(company => ({
          companyId: company.id,
          notes: `Monitoring ${company.name} for M&A opportunities`,
        })),
      },
    },
  });

  console.log('✅ Created sample watchlist');

  console.log('🎉 Database seeded successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
