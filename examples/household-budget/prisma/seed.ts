import { PrismaClient, CategoryType, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
  // Expense categories
  { name: '食費', type: CategoryType.EXPENSE, icon: '🍽️', color: '#FF6384' },
  { name: '交通費', type: CategoryType.EXPENSE, icon: '🚃', color: '#36A2EB' },
  { name: '住居費', type: CategoryType.EXPENSE, icon: '🏠', color: '#FFCE56' },
  { name: '光熱費', type: CategoryType.EXPENSE, icon: '💡', color: '#4BC0C0' },
  { name: '通信費', type: CategoryType.EXPENSE, icon: '📱', color: '#9966FF' },
  { name: '医療費', type: CategoryType.EXPENSE, icon: '🏥', color: '#FF9F40' },
  { name: '教育費', type: CategoryType.EXPENSE, icon: '📚', color: '#FF6384' },
  { name: '娯楽費', type: CategoryType.EXPENSE, icon: '🎮', color: '#C9CBCF' },
  { name: '衣服費', type: CategoryType.EXPENSE, icon: '👕', color: '#7C4DFF' },
  { name: 'その他', type: CategoryType.EXPENSE, icon: '📦', color: '#607D8B' },

  // Income categories
  { name: '給与', type: CategoryType.INCOME, icon: '💰', color: '#4CAF50' },
  { name: '副業', type: CategoryType.INCOME, icon: '💼', color: '#8BC34A' },
  { name: '投資', type: CategoryType.INCOME, icon: '📈', color: '#CDDC39' },
  { name: 'その他収入', type: CategoryType.INCOME, icon: '💵', color: '#009688' },
];

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      passwordHash: 'demo_hash', // In production, use proper hashing
    },
  });

  console.log(`Created user: ${user.email}`);

  // Create categories for user
  const categories: Record<string, string> = {};
  for (const cat of defaultCategories) {
    const category = await prisma.category.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: cat.name,
        },
      },
      update: {},
      create: {
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        userId: user.id,
      },
    });
    categories[cat.name] = category.id;
    console.log(`Created category: ${cat.name}`);
  }

  // Create sample transactions for the past 3 months
  const now = new Date();
  const transactions = [];

  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const month = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);

    // Income
    transactions.push({
      amount: 300000,
      type: TransactionType.INCOME,
      description: `${month.getMonth() + 1}月給与`,
      date: new Date(month.getFullYear(), month.getMonth(), 25),
      categoryId: categories['給与'],
      userId: user.id,
    });

    // Expenses
    const expenses = [
      { category: '食費', amount: 45000, day: 5 },
      { category: '食費', amount: 35000, day: 15 },
      { category: '交通費', amount: 12000, day: 10 },
      { category: '住居費', amount: 80000, day: 1 },
      { category: '光熱費', amount: 15000, day: 20 },
      { category: '通信費', amount: 8000, day: 25 },
      { category: '娯楽費', amount: 20000, day: 12 },
      { category: '衣服費', amount: 10000, day: 18 },
    ];

    for (const exp of expenses) {
      transactions.push({
        amount: exp.amount + Math.floor(Math.random() * 5000) - 2500, // Add some variation
        type: TransactionType.EXPENSE,
        description: `${exp.category}（${month.getMonth() + 1}月）`,
        date: new Date(month.getFullYear(), month.getMonth(), exp.day),
        categoryId: categories[exp.category],
        userId: user.id,
      });
    }
  }

  // Create transactions
  for (const tx of transactions) {
    await prisma.transaction.create({ data: tx });
  }

  console.log(`Created ${transactions.length} transactions`);

  // Create budgets for current month
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const budgets = [
    { category: '食費', amount: 80000 },
    { category: '交通費', amount: 15000 },
    { category: '光熱費', amount: 20000 },
    { category: '通信費', amount: 10000 },
    { category: '娯楽費', amount: 30000 },
    { category: '衣服費', amount: 15000 },
  ];

  for (const budget of budgets) {
    await prisma.budget.upsert({
      where: {
        userId_categoryId_month: {
          userId: user.id,
          categoryId: categories[budget.category],
          month: currentMonth,
        },
      },
      update: { amount: budget.amount },
      create: {
        amount: budget.amount,
        month: currentMonth,
        categoryId: categories[budget.category],
        userId: user.id,
      },
    });
    console.log(`Created budget for ${budget.category}: ${budget.amount}`);
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
