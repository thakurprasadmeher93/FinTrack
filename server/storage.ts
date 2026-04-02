import { 
  users, profiles, categories, transactions, budgets, auditLogs, categoryRules, debts, billSplits, billSplitParticipants,
  type User, type InsertUser,
  type Profile, type InsertProfile, type UpdateProfileRequest,
  type Category, type InsertCategory,
  type Transaction, type InsertTransaction,
  type Budget, type InsertBudget,
  type TransactionSummary, type MonthlyAnalysis,
  type AuditLog, type InsertAuditLog,
  type CategoryRule, type InsertCategoryRule,
  type Debt, type InsertDebt, type UpdateDebtRequest,
  type BillSplit, type BillSplitParticipant, type InsertBillSplit, type InsertBillSplitParticipant
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, sum, ilike } from "drizzle-orm";

export class DatabaseStorage {
  // Audit Logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }

  async getAuditLogs(userId: number): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(desc(auditLogs.createdAt));
  }

  async getCategoryRules(profileId: number): Promise<(CategoryRule & { category: Category })[]> {
    return await db.query.categoryRules.findMany({
      where: eq(categoryRules.profileId, profileId),
      with: {
        category: true
      }
    });
  }

  async createCategoryRule(rule: InsertCategoryRule): Promise<CategoryRule> {
    const [newRule] = await db.insert(categoryRules).values(rule).returning();
    return newRule;
  }

  async deleteCategoryRule(id: number): Promise<void> {
    await db.delete(categoryRules).where(eq(categoryRules.id, id));
  }

  // Profiles
  async getProfiles(userId: number): Promise<Profile[]> {
    return await db.select().from(profiles).where(eq(profiles.userId, userId));
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getProfile(id: number): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [newProfile] = await db.insert(profiles).values(profile).returning();
    return newProfile;
  }

  async updateProfile(id: number, updates: UpdateProfileRequest): Promise<Profile> {
    const [updated] = await db.update(profiles).set(updates).where(eq(profiles.id, id)).returning();
    return updated;
  }

  async deleteProfile(id: number): Promise<void> {
    // Delete all related data first
    await db.delete(transactions).where(eq(transactions.profileId, id));
    await db.delete(budgets).where(eq(budgets.profileId, id));
    await db.delete(categories).where(eq(categories.profileId, id));
    await db.delete(categoryRules).where(eq(categoryRules.profileId, id));
    await db.delete(profiles).where(eq(profiles.id, id));
  }

  // Categories
  async getCategories(profileId: number): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.profileId, profileId));
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  // Transactions
  async getTransactions(profileId: number, options?: { month?: number, year?: number, categoryId?: number }): Promise<(Transaction & { category: Category | null })[]> {
    let conditions = eq(transactions.profileId, profileId);

    if (options?.categoryId) {
      conditions = and(conditions, eq(transactions.categoryId, options.categoryId))!;
    }

    if (options?.month && options?.year) {
      const startDate = new Date(options.year, options.month - 1, 1, 0, 0, 0, 0);
      const endDate = new Date(options.year, options.month, 0, 23, 59, 59, 999); 
      conditions = and(conditions, 
        sql`${transactions.date} >= ${startDate.toISOString()}`,
        sql`${transactions.date} <= ${endDate.toISOString()}`
      )!;
    }

    const txs = await db.query.transactions.findMany({
      where: conditions,
      orderBy: [desc(transactions.date)],
      with: {
        category: true
      }
    });

    return txs;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    // Smart Category Auto-Assignment Logic
    let categoryId = transaction.categoryId;
    
    if (!categoryId && transaction.note) {
      const rules = await this.getCategoryRules(transaction.profileId);
      for (const rule of rules) {
        if (transaction.note.toLowerCase().includes(rule.keyword.toLowerCase())) {
          categoryId = rule.categoryId;
          break;
        }
      }
    }

    const [newTx] = await db.insert(transactions).values({
      ...transaction,
      categoryId
    }).returning();

    await this.createAuditLog({
      userId: (await this.getProfile(transaction.profileId))?.userId || 0,
      action: 'create',
      entityType: 'transaction',
      entityId: newTx.id,
      details: `Created transaction: ${newTx.type} of ${newTx.amount}`
    });

    return newTx;
  }

  async updateTransaction(id: number, updates: any): Promise<Transaction> {
    const [updated] = await db.update(transactions).set(updates).where(eq(transactions.id, id)).returning();
    return updated;
  }

  async deleteTransaction(id: number): Promise<void> {
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id));
    if (tx) {
      const profile = await this.getProfile(tx.profileId);
      await db.delete(transactions).where(eq(transactions.id, id));
      
      if (profile) {
        await this.createAuditLog({
          userId: profile.userId,
          action: 'delete',
          entityType: 'transaction',
          entityId: id,
          details: `Deleted transaction of amount ${tx.amount}`
        });
      }
    }
  }

  // Budgets
  async getBudget(profileId: number, month: number, year: number): Promise<Budget | undefined> {
    const [budget] = await db.select().from(budgets).where(
      and(
        eq(budgets.profileId, profileId),
        eq(budgets.month, month),
        eq(budgets.year, year)
      )
    );
    return budget;
  }

  async upsertBudget(budget: InsertBudget): Promise<Budget> {
    // Check existing
    const existing = await this.getBudget(budget.profileId, budget.month, budget.year);
    
    if (existing) {
      const [updated] = await db.update(budgets)
        .set({ amount: budget.amount })
        .where(eq(budgets.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newBudget] = await db.insert(budgets).values(budget).returning();
      return newBudget;
    }
  }

  // Analytics
  async getTransactionSummary(profileId: number, month: number, year: number): Promise<TransactionSummary> {
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // End of month

    const txs = await db.select({
      amount: transactions.amount,
      type: transactions.type
    }).from(transactions).where(
      and(
        eq(transactions.profileId, profileId),
        sql`${transactions.date} >= ${startDate.toISOString()}`,
        sql`${transactions.date} <= ${endDate.toISOString()}`
      )
    );

    let income = 0;
    let expenses = 0;

    txs.forEach(t => {
      const amt = Math.abs(Number(t.amount));
      if (t.type === 'income') income += amt;
      else expenses += amt;
    });

    return {
      income,
      expenses,
      balance: income - expenses
    };
  }

  async getCategoryAnalysis(profileId: number, month: number, year: number): Promise<any[]> {
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const result = await db
      .select({
        name: categories.name,
        value: sql<number>`abs(sum(${transactions.amount}))`.mapWith(Number),
        color: categories.color,
        type: sql<string>`'expense'`.as('type'),
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.profileId, profileId),
          eq(transactions.type, 'expense'),
          sql`${transactions.date} >= ${startDate.toISOString()}`,
          sql`${transactions.date} <= ${endDate.toISOString()}`
        )
      )
      .groupBy(categories.name, categories.color);
      
    return result;
  }

  async getIncomeCategoryAnalysis(profileId: number, month: number, year: number): Promise<any[]> {
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const result = await db
      .select({
        name: categories.name,
        value: sql<number>`abs(sum(${transactions.amount}))`.mapWith(Number),
        color: categories.color,
        type: sql<string>`'income'`.as('type'),
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.profileId, profileId),
          eq(transactions.type, 'income'),
          sql`${transactions.date} >= ${startDate.toISOString()}`,
          sql`${transactions.date} <= ${endDate.toISOString()}`
        )
      )
      .groupBy(categories.name, categories.color);
      
    return result;
  }

  async getDebtAnalysis(profileId: number, month: number, year: number): Promise<any[]> {
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const result = await db
      .select({
        name: debts.contactName,
        value: sql<number>`sum(abs(${debts.amount}))`.mapWith(Number),
      })
      .from(debts)
      .where(
        and(
          eq(debts.profileId, profileId),
          sql`${debts.date} >= ${startDate.toISOString()}`,
          sql`${debts.date} <= ${endDate.toISOString()}`
        )
      )
      .groupBy(debts.contactName);
      
    return result;
  }

  async getSplitBillAnalysis(profileId: number, month: number, year: number): Promise<any[]> {
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const result = await db
      .select({
        description: billSplits.description,
        amount: billSplits.totalAmount,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(billSplits)
      .where(
        and(
          eq(billSplits.profileId, profileId),
          sql`${billSplits.date} >= ${startDate.toISOString()}`,
          sql`${billSplits.date} <= ${endDate.toISOString()}`
        )
      )
      .groupBy(billSplits.description, billSplits.totalAmount);
      
    return result;
  }
  
  async getMonthlyTrend(profileId: number): Promise<MonthlyAnalysis[]> {
    // Get last 6 months
    const result: MonthlyAnalysis[] = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const summary = await this.getTransactionSummary(profileId, month, year);
      
      result.push({
        month: d.toLocaleString('default', { month: 'short' }),
        income: summary.income,
        expenses: summary.expenses
      });
    }
    
    return result;
  }

  async getYearlyTrend(profileId: number, years: number = 1): Promise<MonthlyAnalysis[]> {
    // Get last N years of data
    const result: MonthlyAnalysis[] = [];
    const today = new Date();
    
    for (let i = (years * 12 - 1); i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const summary = await this.getTransactionSummary(profileId, month, year);
      
      result.push({
        month: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
        income: summary.income,
        expenses: summary.expenses
      });
    }
    
    return result;
  }

  async getThreeYearTrend(profileId: number): Promise<MonthlyAnalysis[]> {
    return this.getYearlyTrend(profileId, 3);
  }

  async getFiveYearTrend(profileId: number): Promise<MonthlyAnalysis[]> {
    return this.getYearlyTrend(profileId, 5);
  }

  async getAllTimeTrend(profileId: number): Promise<MonthlyAnalysis[]> {
    // Get all data, starting from first transaction
    const firstTx = await db
      .select({ date: transactions.date })
      .from(transactions)
      .where(eq(transactions.profileId, profileId))
      .orderBy(asc(transactions.date))
      .limit(1);
    
    if (firstTx.length === 0) return [];
    
    const startDate = new Date(firstTx[0].date);
    const endDate = new Date();
    const result: MonthlyAnalysis[] = [];
    
    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    
    while (current <= endDate) {
      const month = current.getMonth() + 1;
      const year = current.getFullYear();
      const summary = await this.getTransactionSummary(profileId, month, year);
      
      result.push({
        month: current.toLocaleString('default', { month: 'short', year: 'numeric' }),
        income: summary.income,
        expenses: summary.expenses
      });
      
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
    
    return result;
  }

  async getDailySpendingPattern(profileId: number, type: 'monthly' | 'yearly' | '3y' | '5y' | 'alltime' = 'monthly'): Promise<Array<{ date: string; amount: number }>> {
    const today = new Date();
    let startDate = new Date();
    
    switch (type) {
      case 'yearly':
        startDate = new Date(today.getFullYear() - 1, today.getMonth(), 1);
        break;
      case '3y':
        startDate = new Date(today.getFullYear() - 3, today.getMonth(), 1);
        break;
      case '5y':
        startDate = new Date(today.getFullYear() - 5, today.getMonth(), 1);
        break;
      case 'alltime':
        const firstTx = await db
          .select({ date: transactions.date })
          .from(transactions)
          .where(eq(transactions.profileId, profileId))
          .orderBy(asc(transactions.date))
          .limit(1);
        if (firstTx.length > 0) {
          startDate = new Date(firstTx[0].date.getFullYear(), firstTx[0].date.getMonth(), 1);
        }
        break;
      default: // 'monthly' - last 6 months
        startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    }

    const txs = await db.select({
      date: transactions.date,
      amount: transactions.amount,
      type: transactions.type
    }).from(transactions).where(
      and(
        eq(transactions.profileId, profileId),
        sql`${transactions.date} >= ${startDate.toISOString()}`,
        sql`${transactions.date} <= ${today.toISOString()}`
      )
    );

    // Group by day
    const dailyMap = new Map<string, number>();
    
    txs.forEach(tx => {
      if (tx.type === 'expense') {
        const dateKey = new Date(tx.date).toLocaleDateString('en-CA');
        const current = dailyMap.get(dateKey) || 0;
        dailyMap.set(dateKey, current + Math.abs(Number(tx.amount)));
      }
    });

    // Convert to sorted array
    const result = Array.from(dailyMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
        amount
      }));

    return result;
  }

  // Users (App Domain)
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    totalProUsers: number;
    totalTransactions: number;
    totalDebts: number;
    totalSplitBills: number;
    totalExpenses: number;
    totalIncome: number;
  }> {
    const userCount = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
    const proCount = await db.select({ count: sql<number>`COUNT(*)` }).from(users).where(eq(users.subscriptionStatus, 'paid'));
    const txCount = await db.select({ count: sql<number>`COUNT(*)` }).from(transactions);
    const debtCount = await db.select({ count: sql<number>`COUNT(*)` }).from(debts);
    const billCount = await db.select({ count: sql<number>`COUNT(*)` }).from(billSplits);
    const expenseSum = await db.select({ sum: sql<number>`COALESCE(SUM(CAST(${transactions.amount} as numeric)), 0)` }).from(transactions).where(eq(transactions.type, 'expense'));
    const incomeSum = await db.select({ sum: sql<number>`COALESCE(SUM(CAST(${transactions.amount} as numeric)), 0)` }).from(transactions).where(eq(transactions.type, 'income'));

    return {
      totalUsers: Number(userCount[0]?.count || 0),
      totalProUsers: Number(proCount[0]?.count || 0),
      totalTransactions: Number(txCount[0]?.count || 0),
      totalDebts: Number(debtCount[0]?.count || 0),
      totalSplitBills: Number(billCount[0]?.count || 0),
      totalExpenses: Number(expenseSum[0]?.sum || 0),
      totalIncome: Number(incomeSum[0]?.sum || 0),
    };
  }

  async getAllTransactions(): Promise<(Transaction & { category: Category | null; profile: Profile })[]> {
    return await db.query.transactions.findMany({
      with: { category: true, profile: true },
      orderBy: [desc(transactions.date)]
    });
  }

  async getAllDebts(): Promise<Debt[]> {
    return await db.select().from(debts).orderBy(desc(debts.date));
  }

  async getAllBillSplits(): Promise<any[]> {
    return await db.query.billSplits.findMany({
      with: { participants: true },
      orderBy: [desc(billSplits.date)]
    });
  }

  // Debts
  async getDebts(profileId: number): Promise<Debt[]> {
    return await db.select().from(debts).where(eq(debts.profileId, profileId)).orderBy(desc(debts.date));
  }

  async createDebt(debt: InsertDebt): Promise<Debt> {
    const [newDebt] = await db.insert(debts).values(debt).returning();
    
    // Create a transaction record as well for visibility in main ledger if desired
    // For "Udhari Khata", we'll keep it separate but visible.
    
    await this.createAuditLog({
      userId: (await this.getProfile(debt.profileId))?.userId || 0,
      action: 'create',
      entityType: 'debt',
      entityId: newDebt.id,
      details: `${debt.type === 'gave' ? 'Lent' : 'Borrowed'} ${debt.amount} to/from ${debt.contactName}`
    });
    
    return newDebt;
  }

  async updateDebt(id: number, updates: any): Promise<Debt> {
    const [updated] = await db.update(debts).set(updates).where(eq(debts.id, id)).returning();
    return updated;
  }

  async deleteDebt(id: number): Promise<void> {
    await db.delete(debts).where(eq(debts.id, id));
  }

  // Split Bills
  async getBillSplits(profileId: number): Promise<(BillSplit & { participants: BillSplitParticipant[] })[]> {
    return await db.query.billSplits.findMany({
      where: eq(billSplits.profileId, profileId),
      with: {
        participants: true
      },
      orderBy: [desc(billSplits.date)]
    });
  }

  async createBillSplit(split: InsertBillSplit, participants: InsertBillSplitParticipant[]): Promise<BillSplit> {
    const [newSplit] = await db.insert(billSplits).values(split).returning();
    if (participants.length > 0) {
      await db.insert(billSplitParticipants).values(
        participants.map(p => ({ ...p, billSplitId: newSplit.id }))
      );
    }
    return newSplit;
  }

  async deleteBillSplit(id: number): Promise<void> {
    await db.delete(billSplitParticipants).where(eq(billSplitParticipants.billSplitId, id));
    await db.delete(billSplits).where(eq(billSplits.id, id));
  }
}

export const storage = new DatabaseStorage();
