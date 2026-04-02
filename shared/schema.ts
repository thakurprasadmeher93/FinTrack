import { sql, relations } from "drizzle-orm";
import { pgTable, text, serial, integer, boolean, timestamp, numeric, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === AUTH TABLES ===
// (IMPORTANT) These tables are mandatory for Replit Auth, don't drop them.

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

export const authUsers = pgTable("auth_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === APP TABLES ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // This will store email or phone
  password: text("password"), // Added for custom auth
  displayName: text("display_name"),
  email: text("email"),
  resetToken: text("reset_token"),
  resetExpires: timestamp("reset_expires"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  subscriptionStatus: text("subscription_status").default("free").notNull(), // 'free' | 'paid'
  activeProfileId: integer("active_profile_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(), // 'Personal', 'Family', 'Business'
  type: text("type").notNull(), // 'personal', 'family', 'business'
  currency: text("currency").default("INR").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull().references(() => profiles.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'income' | 'expense'
  icon: text("icon"), // Lucide icon name
  isDefault: boolean("is_default").default(false),
  color: text("color"), // Hex code or tailwind class
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull().references(() => profiles.id),
  categoryId: integer("category_id").references(() => categories.id),
  amount: numeric("amount").notNull(),
  date: timestamp("date").notNull(),
  note: text("note"),
  type: text("type").notNull(), // 'income' | 'expense'
  isRecurring: boolean("is_recurring").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull().references(() => profiles.id),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  amount: numeric("amount").notNull(), // Monthly limit
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const debts = pgTable("debts", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull().references(() => profiles.id),
  type: text("type").notNull(), // 'gave' | 'got'
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone"),
  amount: numeric("amount").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  note: text("note"),
  status: text("status").default("pending").notNull(), // 'pending' | 'settled'
  createdAt: timestamp("created_at").defaultNow(),
});

export const debtsRelations = relations(debts, ({ one }) => ({
  profile: one(profiles, {
    fields: [debts.profileId],
    references: [profiles.id],
  }),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  categories: many(categories),
  transactions: many(transactions),
  budgets: many(budgets),
  debts: many(debts),
}));

export const usersRelations = relations(users, ({ many }) => ({
  profiles: many(profiles),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [categories.profileId],
    references: [profiles.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  profile: one(profiles, {
    fields: [transactions.profileId],
    references: [profiles.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // 'create', 'update', 'delete', 'export'
  entityType: text("entity_type").notNull(), // 'transaction', 'profile', 'category'
  entityId: integer("entity_id"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categoryRules = pgTable("category_rules", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull().references(() => profiles.id),
  keyword: text("keyword").notNull(),
  categoryId: integer("category_id").notNull().references(() => categories.id),
});

export const categoryRulesRelations = relations(categoryRules, ({ one }) => ({
  profile: one(profiles, {
    fields: [categoryRules.profileId],
    references: [profiles.id],
  }),
  category: one(categories, {
    fields: [categoryRules.categoryId],
    references: [categories.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertCategoryRuleSchema = createInsertSchema(categoryRules).omit({ id: true });

export type AuditLog = typeof auditLogs.$inferSelect;
export type CategoryRule = typeof categoryRules.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type InsertCategoryRule = z.infer<typeof insertCategoryRuleSchema>;

export const billSplits = pgTable("bill_splits", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull().references(() => profiles.id),
  totalAmount: numeric("total_amount").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const billSplitParticipants = pgTable("bill_split_participants", {
  id: serial("id").primaryKey(),
  billSplitId: integer("bill_split_id").notNull().references(() => billSplits.id),
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone"),
  amount: numeric("amount").notNull(),
  isSettled: boolean("is_settled").default(false).notNull(),
});

export const billSplitsRelations = relations(billSplits, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [billSplits.profileId],
    references: [profiles.id],
  }),
  participants: many(billSplitParticipants),
}));

export const billSplitParticipantsRelations = relations(billSplitParticipants, ({ one }) => ({
  billSplit: one(billSplits, {
    fields: [billSplitParticipants.billSplitId],
    references: [billSplits.id],
  }),
}));

export const insertBillSplitSchema = createInsertSchema(billSplits).omit({ id: true, createdAt: true });
export const insertBillSplitParticipantSchema = createInsertSchema(billSplitParticipants).omit({ id: true });

export type BillSplit = typeof billSplits.$inferSelect;
export type BillSplitParticipant = typeof billSplitParticipants.$inferSelect;
export type InsertBillSplit = z.infer<typeof insertBillSplitSchema>;
export type InsertBillSplitParticipant = z.infer<typeof insertBillSplitParticipantSchema>;

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertBudgetSchema = createInsertSchema(budgets).omit({ id: true, createdAt: true });
export const insertDebtSchema = createInsertSchema(debts).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===

// Base types
export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type Debt = typeof debts.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type InsertDebt = z.infer<typeof insertDebtSchema>;

// Request types
export type CreateProfileRequest = InsertProfile;
export type UpdateProfileRequest = Partial<InsertProfile>;

export type CreateCategoryRequest = InsertCategory;
export type UpdateCategoryRequest = Partial<InsertCategory>;

export type CreateTransactionRequest = InsertTransaction;
export type UpdateTransactionRequest = Partial<InsertTransaction>;

export type CreateBudgetRequest = InsertBudget;
export type UpdateBudgetRequest = Partial<InsertBudget>;

export type CreateDebtRequest = InsertDebt;
export type UpdateDebtRequest = Partial<InsertDebt>;

// Response types
export type AuthUser = User & { profiles: Profile[] };

export interface TransactionSummary {
  income: number;
  expenses: number;
  balance: number;
}

export interface CategorySummary {
  categoryId: number;
  categoryName: string;
  total: number;
  color?: string;
}

export interface MonthlyAnalysis {
  month: string;
  income: number;
  expenses: number;
}
