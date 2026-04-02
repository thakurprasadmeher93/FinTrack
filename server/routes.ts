import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated, loginCustom, registerCustom, forgotPassword, resetPassword } from "./replit_integrations/auth";
import { db } from "./db";
import { users, profiles, categories, transactions, debts, billSplits } from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

import { Parser } from 'json2csv';

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 1. Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  app.post("/api/login-custom", loginCustom);
  app.post("/api/register-custom", registerCustom);
  app.post("/api/forgot-password", forgotPassword);
  app.post("/api/reset-password", resetPassword);

  // 2. Middleware to sync auth user with App User and ensure profile exists
  app.use(async (req: any, res, next) => {
    try {
      const customAuthUsername = (req.session as any)?.customAuthUsername;
      const isCustomAuth = !!customAuthUsername;
      const isReplitAuth = !isCustomAuth && req.isAuthenticated() && !!req.user?.claims?.sub;

      const username = isCustomAuth ? customAuthUsername : (isReplitAuth ? req.user.claims.sub : null);

      if (!username) return next();

      let appUser = await storage.getUserByUsername(username);

      if (!appUser) {
        appUser = await storage.createUser({
          username,
          email: isReplitAuth ? req.user.claims.email || null : null,
          displayName: isReplitAuth ? req.user.claims.name || 'User' : 'User',
          subscriptionStatus: 'free',
        });
      }

      // Auto-create a default profile + categories for any user who doesn't have one
      if (!appUser.activeProfileId) {
        const existingProfiles = await storage.getProfiles(appUser.id);
        let profile = existingProfiles[0];

        if (!profile) {
          profile = await storage.createProfile({
            userId: appUser.id,
            name: 'Personal',
            type: 'personal',
            currency: 'INR',
          });

          const defaultCategories = [
            { name: 'Food', type: 'expense', icon: 'Utensils', color: '#ef4444' },
            { name: 'Groceries', type: 'expense', icon: 'ShoppingBasket', color: '#10b981' },
            { name: 'Transport', type: 'expense', icon: 'Car', color: '#f97316' },
            { name: 'Fuel', type: 'expense', icon: 'Fuel', color: '#f59e0b' },
            { name: 'Taxi', type: 'expense', icon: 'Taxi', color: '#0ea5e9' },
            { name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#8b5cf6' },
            { name: 'Clothes', type: 'expense', icon: 'Shirt', color: '#ec4899' },
            { name: 'Bills', type: 'expense', icon: 'Receipt', color: '#ef4444' },
            { name: 'Electricity', type: 'expense', icon: 'Zap', color: '#f59e0b' },
            { name: 'Gas', type: 'expense', icon: 'Flame', color: '#f97316' },
            { name: 'Internet', type: 'expense', icon: 'Wifi', color: '#0ea5e9' },
            { name: 'Water', type: 'expense', icon: 'Droplets', color: '#3b82f6' },
            { name: 'Rent', type: 'expense', icon: 'Home', color: '#6366f1' },
            { name: 'House', type: 'expense', icon: 'Home', color: '#64748b' },
            { name: 'Maid Salary', type: 'expense', icon: 'User', color: '#10b981' },
            { name: 'Entertainment', type: 'expense', icon: 'Play', color: '#ec4899' },
            { name: 'Drink', type: 'expense', icon: 'CupSoda', color: '#f43f5e' },
            { name: 'Gym', type: 'expense', icon: 'Dumbbell', color: '#06b6d4' },
            { name: 'Subscriptions', type: 'expense', icon: 'Library', color: '#8b5cf6' },
            { name: 'Beauty/Haircut', type: 'expense', icon: 'Scissors', color: '#d946ef' },
            { name: 'Healthcare', type: 'expense', icon: 'HeartPulse', color: '#10b981' },
            { name: 'Recharge', type: 'expense', icon: 'Zap', color: '#f59e0b' },
            { name: 'Other', type: 'expense', icon: 'Tag', color: '#64748b' },
            { name: 'Salary', type: 'income', icon: 'Banknote', color: '#22c55e' },
            { name: 'Bonus', type: 'income', icon: 'Sparkles', color: '#f59e0b' },
            { name: 'Rental Income', type: 'income', icon: 'Home', color: '#6366f1' },
            { name: 'Dividend', type: 'income', icon: 'PieChart', color: '#8b5cf6' },
            { name: 'Interest', type: 'income', icon: 'TrendingUp', color: '#10b981' },
            { name: 'Refund', type: 'income', icon: 'RotateCcw', color: '#f43f5e' },
            { name: 'Gift', type: 'income', icon: 'Gift', color: '#ec4899' },
            { name: 'Freelance', type: 'income', icon: 'Briefcase', color: '#0ea5e9' },
            { name: 'Investment', type: 'income', icon: 'TrendingUp', color: '#f59e0b' },
            { name: 'Other', type: 'income', icon: 'PlusCircle', color: '#10b981' },
          ];
          for (const cat of defaultCategories) {
            await storage.createCategory({ profileId: profile.id, ...cat, isDefault: true });
          }
        }

        await db.update(users).set({ activeProfileId: profile.id }).where(eq(users.id, appUser.id));
        appUser.activeProfileId = profile.id;
      }

      req.appUserId = appUser.id;
    } catch (err) {
      console.error('[auth-middleware] error:', err);
    }
    next();
  });

  // App Routes
  // Note: /api/auth/user is handled in replit_integrations/auth/routes.ts
  // but we should ensure the frontend is hitting the right one.


  // Profiles
  app.get(api.profiles.list.path, isAuthenticated, async (req: any, res) => {
    const profiles = await storage.getProfiles(req.appUserId);
    res.json(profiles);
  });

  app.post(api.profiles.create.path, isAuthenticated, async (req: any, res) => {
    // Plan enforcement logic could go here
    try {
      const input = api.profiles.create.input.parse(req.body);
      
      // Check limits for Free plan
      const userProfiles = await storage.getProfiles(req.appUserId);
      const [user] = await db.select().from(users).where(eq(users.id, req.appUserId));
      
      if (user?.subscriptionStatus === 'free' && userProfiles.length >= 1) {
        return res.status(403).json({ message: 'Free plan limited to 1 profile. Upgrade to create more.' });
      }

      const profile = await storage.createProfile({ ...input, userId: req.appUserId });
      
      // Create default categories for new profile
      const defaultCategories = [
        { name: 'Food', type: 'expense', icon: 'Utensils', color: '#ef4444' },
        { name: 'Groceries', type: 'expense', icon: 'ShoppingBasket', color: '#10b981' },
        { name: 'Transport', type: 'expense', icon: 'Car', color: '#f97316' },
        { name: 'Fuel', type: 'expense', icon: 'Fuel', color: '#f59e0b' },
        { name: 'Taxi', type: 'expense', icon: 'Taxi', color: '#0ea5e9' },
        { name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#8b5cf6' },
        { name: 'Clothes', type: 'expense', icon: 'Shirt', color: '#ec4899' },
        { name: 'Bills', type: 'expense', icon: 'Receipt', color: '#ef4444' },
        { name: 'Electricity', type: 'expense', icon: 'Zap', color: '#f59e0b' },
        { name: 'Gas', type: 'expense', icon: 'Flame', color: '#f97316' },
        { name: 'Internet', type: 'expense', icon: 'Wifi', color: '#0ea5e9' },
        { name: 'Water', type: 'expense', icon: 'Droplets', color: '#3b82f6' },
        { name: 'Rent', type: 'expense', icon: 'Home', color: '#6366f1' },
        { name: 'House', type: 'expense', icon: 'Home', color: '#64748b' },
        { name: 'Maid Salary', type: 'expense', icon: 'User', color: '#10b981' },
        { name: 'Entertainment', type: 'expense', icon: 'Play', color: '#ec4899' },
        { name: 'Drink', type: 'expense', icon: 'CupSoda', color: '#f43f5e' },
        { name: 'Gym', type: 'expense', icon: 'Dumbbell', color: '#06b6d4' },
        { name: 'Subscriptions', type: 'expense', icon: 'Library', color: '#8b5cf6' },
        { name: 'Beauty/Haircut', type: 'expense', icon: 'Scissors', color: '#d946ef' },
        { name: 'Healthcare', type: 'expense', icon: 'HeartPulse', color: '#10b981' },
        { name: 'Recharge', type: 'expense', icon: 'Zap', color: '#f59e0b' },
        { name: 'Other', type: 'expense', icon: 'Tag', color: '#64748b' },
        { name: 'Salary', type: 'income', icon: 'Banknote', color: '#22c55e' },
        { name: 'Bonus', type: 'income', icon: 'Sparkles', color: '#f59e0b' },
        { name: 'Rental Income', type: 'income', icon: 'Home', color: '#6366f1' },
        { name: 'Dividend', type: 'income', icon: 'PieChart', color: '#8b5cf6' },
        { name: 'Interest', type: 'income', icon: 'TrendingUp', color: '#10b981' },
        { name: 'Refund', type: 'income', icon: 'RotateCcw', color: '#f43f5e' },
        { name: 'Gift', type: 'income', icon: 'Gift', color: '#ec4899' },
        { name: 'Freelance', type: 'income', icon: 'Briefcase', color: '#0ea5e9' },
        { name: 'Investment', type: 'income', icon: 'TrendingUp', color: '#f59e0b' },
        { name: 'Other', type: 'income', icon: 'PlusCircle', color: '#10b981' },
      ];

      for (const cat of defaultCategories) {
        await storage.createCategory({
          profileId: profile.id,
          ...cat,
          isDefault: true
        });
      }

      res.status(201).json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: 'Internal Server Error' });
      }
    }
  });

  app.post(api.profiles.switch.path, isAuthenticated, async (req: any, res) => {
    try {
      const profileId = Number(req.params.id);
      const profile = await storage.getProfile(profileId);
      
      if (!profile || profile.userId !== req.appUserId) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      const [updatedUser] = await db.update(users)
        .set({ activeProfileId: profileId })
        .where(eq(users.id, req.appUserId))
        .returning();

      res.json(updatedUser);
    } catch (err) {
      res.status(500).json({ message: 'Failed to switch profile' });
    }
  });

  app.patch("/api/profiles/:id", isAuthenticated, async (req: any, res) => {
    try {
      const profileId = Number(req.params.id);
      const profile = await storage.getProfile(profileId);
      
      if (!profile || profile.userId !== req.appUserId) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      const updated = await storage.updateProfile(profileId, req.body);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });

  app.delete("/api/profiles/:id", isAuthenticated, async (req: any, res) => {
    try {
      const profileId = Number(req.params.id);
      const profile = await storage.getProfile(profileId);
      
      if (!profile || profile.userId !== req.appUserId) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      // Don't allow deleting the last profile
      const userProfiles = await storage.getProfiles(req.appUserId);
      if (userProfiles.length <= 1) {
        return res.status(400).json({ message: 'Cannot delete your only profile' });
      }

      await storage.deleteProfile(profileId);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: 'Failed to delete profile' });
    }
  });

  // Categories
  app.get(api.categories.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const profileId = Number(req.params.profileId);
      let categoriesList = await storage.getCategories(profileId);
      
      // If no categories, seed them (for existing users who didn't get them)
      if (categoriesList.length === 0) {
        const defaultCategories = [
          { name: 'Food', type: 'expense', icon: 'Utensils', color: '#ef4444' },
          { name: 'Groceries', type: 'expense', icon: 'ShoppingBasket', color: '#10b981' },
          { name: 'Transport', type: 'expense', icon: 'Car', color: '#f97316' },
          { name: 'Fuel', type: 'expense', icon: 'Fuel', color: '#f59e0b' },
          { name: 'Taxi', type: 'expense', icon: 'Taxi', color: '#0ea5e9' },
          { name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#8b5cf6' },
          { name: 'Clothes', type: 'expense', icon: 'Shirt', color: '#ec4899' },
          { name: 'Bills', type: 'expense', icon: 'Receipt', color: '#ef4444' },
          { name: 'Electricity', type: 'expense', icon: 'Zap', color: '#f59e0b' },
          { name: 'Gas', type: 'expense', icon: 'Flame', color: '#f97316' },
          { name: 'Internet', type: 'expense', icon: 'Wifi', color: '#0ea5e9' },
          { name: 'Water', type: 'expense', icon: 'Droplets', color: '#3b82f6' },
          { name: 'Rent', type: 'expense', icon: 'Home', color: '#6366f1' },
          { name: 'House', type: 'expense', icon: 'Home', color: '#64748b' },
          { name: 'Maid Salary', type: 'expense', icon: 'User', color: '#10b981' },
          { name: 'Entertainment', type: 'expense', icon: 'Play', color: '#ec4899' },
          { name: 'Drink', type: 'expense', icon: 'CupSoda', color: '#f43f5e' },
          { name: 'Gym', type: 'expense', icon: 'Dumbbell', color: '#06b6d4' },
          { name: 'Subscriptions', type: 'expense', icon: 'Library', color: '#8b5cf6' },
          { name: 'Beauty/Haircut', type: 'expense', icon: 'Scissors', color: '#d946ef' },
          { name: 'Healthcare', type: 'expense', icon: 'HeartPulse', color: '#10b981' },
          { name: 'Recharge', type: 'expense', icon: 'Zap', color: '#f59e0b' },
          { name: 'Other', type: 'expense', icon: 'Tag', color: '#64748b' },
          { name: 'Salary', type: 'income', icon: 'Banknote', color: '#22c55e' },
          { name: 'Bonus', type: 'income', icon: 'Sparkles', color: '#f59e0b' },
          { name: 'Rental Income', type: 'income', icon: 'Home', color: '#6366f1' },
          { name: 'Dividend', type: 'income', icon: 'PieChart', color: '#8b5cf6' },
          { name: 'Interest', type: 'income', icon: 'TrendingUp', color: '#10b981' },
          { name: 'Refund', type: 'income', icon: 'RotateCcw', color: '#f43f5e' },
          { name: 'Gift', type: 'income', icon: 'Gift', color: '#ec4899' },
          { name: 'Freelance', type: 'income', icon: 'Briefcase', color: '#0ea5e9' },
          { name: 'Investment', type: 'income', icon: 'TrendingUp', color: '#f59e0b' },
          { name: 'Side Hustle', type: 'income', icon: 'Coins', color: '#10b981' },
          { name: 'Business Profit', type: 'income', icon: 'Store', color: '#0ea5e9' },
          { name: 'Stock Sale', type: 'income', icon: 'BarChart3', color: '#f59e0b' },
          { name: 'Other', type: 'income', icon: 'PlusCircle', color: '#10b981' },
        ];
        for (const cat of defaultCategories) {
          await storage.createCategory({ ...cat, profileId, isDefault: true } as any);
        }
        categoriesList = await storage.getCategories(profileId);
      }
      res.json(categoriesList);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });

  app.post(api.categories.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.categories.create.input.parse(req.body);
      const category = await storage.createCategory({ ...input, profileId: Number(req.params.profileId) } as any);
      res.status(201).json(category);
    } catch (err) {
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  // Transactions
  app.get(api.transactions.list.path, isAuthenticated, async (req, res) => {
    const profileId = Number(req.params.profileId);
    // Parse query params manually since express parses them as strings
    const options = {
      month: req.query.month ? Number(req.query.month) : undefined,
      year: req.query.year ? Number(req.query.year) : undefined,
      categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
    };
    
    const txs = await storage.getTransactions(profileId, options);
    // res.json(txs);
    // Explicitly mapping to ensure amounts are numbers and category is included
    res.json(txs.map(tx => ({
      ...tx,
      amount: tx.amount.toString(), // Drizzle numeric can be string, frontend expects string in types but often works with number
    })));
  });

  app.post(api.transactions.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const profileId = Number(req.params.profileId);
      
      // Free plan transaction limit enforcement
      const [user] = await db.select().from(users).where(eq(users.id, req.appUserId));
      if (user?.subscriptionStatus === 'free') {
        const txs = await storage.getTransactions(profileId);
        if (txs.length >= 20) {
          return res.status(403).json({ message: "Free plan is limited to 20 transactions. Upgrade to Pro for unlimited entries." });
        }
      }

      // Coerce amount to string/number if needed
      const body = {
        ...req.body,
        amount: req.body.amount?.toString(),
        date: req.body.date ? new Date(req.body.date) : undefined
      };
      const input = api.transactions.create.input.parse(body);
      const tx = await storage.createTransaction({ ...input, profileId: Number(req.params.profileId) });
      res.status(201).json(tx);
    } catch (err) {
      console.error("Transaction Create Error:", err);
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(400).json({ message: 'Invalid input' });
      }
    }
  });

  app.delete(api.transactions.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteTransaction(Number(req.params.id));
    res.status(204).send();
  });

  app.patch("/api/transactions/:id", isAuthenticated, async (req, res) => {
    try {
      const body = {
        ...req.body,
        ...(req.body.amount !== undefined && { amount: req.body.amount.toString() }),
        ...(req.body.categoryId !== undefined && { categoryId: Number(req.body.categoryId) }),
        ...(req.body.date !== undefined && { date: new Date(req.body.date) }),
      };
      const tx = await storage.updateTransaction(Number(req.params.id), body);
      res.json(tx);
    } catch (err) {
      console.error("Patch transaction error:", err);
      res.status(400).json({ message: "Failed to update transaction" });
    }
  });

  // Budgets
  app.get(api.budgets.get.path, isAuthenticated, async (req, res) => {
    const budget = await storage.getBudget(
      Number(req.params.profileId), 
      Number(req.query.month), 
      Number(req.query.year)
    );
    res.json(budget || null);
  });

  app.post(api.budgets.set.path, isAuthenticated, async (req, res) => {
    try {
      const body = {
        ...req.body,
        amount: req.body.amount?.toString(),
        month: req.body.month ? Number(req.body.month) : undefined,
        year: req.body.year ? Number(req.body.year) : undefined
      };
      const input = api.budgets.set.input.parse(body);
      const budget = await storage.upsertBudget({ ...input, profileId: Number(req.params.profileId) });
      res.json(budget);
    } catch (err) {
      console.error("Budget Set Error:", err);
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  // Analytics
  app.get(api.analytics.summary.path, isAuthenticated, async (req, res) => {
    const profileId = Number(req.params.profileId);
    const month = Number(req.query.month);
    const year = Number(req.query.year);

    const summary = await storage.getTransactionSummary(profileId, month, year);
    const budget = await storage.getBudget(profileId, month, year);

    let budgetStatus: 'ok' | 'warning' | 'exceeded' = 'ok';
    let remainingBudget: number | null = null;

    if (budget) {
      const budgetAmt = Number(budget.amount);
      remainingBudget = budgetAmt - summary.expenses;
      if (remainingBudget < 0) budgetStatus = 'exceeded';
      else if (remainingBudget < budgetAmt * 0.2) budgetStatus = 'warning';
    }

    res.json({
      ...summary,
      remainingBudget,
      budgetStatus
    });
  });

  app.get(api.analytics.byCategory.path, isAuthenticated, async (req, res) => {
    const expenses = await storage.getCategoryAnalysis(
      Number(req.params.profileId),
      Number(req.query.month),
      Number(req.query.year)
    );
    const income = await storage.getIncomeCategoryAnalysis(
      Number(req.params.profileId),
      Number(req.query.month),
      Number(req.query.year)
    );
    res.json({ expenses, income });
  });

  app.get("/api/profiles/:profileId/analytics/debts", isAuthenticated, async (req, res) => {
    const data = await storage.getDebtAnalysis(
      Number(req.params.profileId),
      Number(req.query.month),
      Number(req.query.year)
    );
    res.json(data);
  });

  app.get("/api/profiles/:profileId/analytics/splits", isAuthenticated, async (req, res) => {
    const data = await storage.getSplitBillAnalysis(
      Number(req.params.profileId),
      Number(req.query.month),
      Number(req.query.year)
    );
    res.json(data);
  });

  app.get(api.analytics.trend.path, isAuthenticated, async (req, res) => {
    const profileId = Number(req.params.profileId);
    const type = req.query.type || 'monthly'; // 'monthly', 'yearly', '3y', '5y', 'alltime'
    
    let data;
    switch (type) {
      case 'yearly':
        data = await (storage as any).getYearlyTrend(profileId, 1);
        break;
      case '3y':
        data = await (storage as any).getThreeYearTrend(profileId);
        break;
      case '5y':
        data = await (storage as any).getFiveYearTrend(profileId);
        break;
      case 'alltime':
        data = await (storage as any).getAllTimeTrend(profileId);
        break;
      default:
        data = await storage.getMonthlyTrend(profileId);
    }
    
    res.json(data);
  });

  app.get("/api/profiles/:profileId/analytics/daily-spending", isAuthenticated, async (req, res) => {
    const profileId = Number(req.params.profileId);
    const type = req.query.type || 'monthly'; // 'monthly', 'yearly', '3y', '5y', 'alltime'
    
    const data = await (storage as any).getDailySpendingPattern(profileId, type);
    res.json(data);
  });

  app.get("/api/profiles/:profileId/rules", isAuthenticated, async (req: any, res) => {
    const rules = await (storage as any).getCategoryRules(Number(req.params.profileId));
    res.json(rules);
  });

  app.delete("/api/rules/:id", isAuthenticated, async (req: any, res) => {
    await (storage as any).deleteCategoryRule(Number(req.params.id));
    res.status(204).send();
  });

  app.get("/api/profiles/:profileId/export", isAuthenticated, async (req: any, res) => {
    try {
      const profileId = Number(req.params.profileId);
      const format = req.query.format || 'csv';
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const [user] = await db.select().from(users).where(eq(users.id, req.appUserId));
      
      if (user?.subscriptionStatus !== 'paid') {
        return res.status(403).json({ message: "Export is a Pro feature. Upgrade to unlock." });
      }

      let txs: any[];
      if (startDate && endDate) {
        // Get transactions within the date range
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the entire end date
        
        txs = await db.query.transactions.findMany({
          where: and(
            eq(transactions.profileId, profileId),
            sql`${transactions.date} >= ${start.toISOString()}`,
            sql`${transactions.date} <= ${end.toISOString()}`
          ),
          with: { category: true },
          orderBy: [desc(transactions.date)]
        });
      } else {
        txs = await storage.getTransactions(profileId);
      }
      
      await storage.createAuditLog({
        userId: req.appUserId,
        action: 'export',
        entityType: 'profile',
        entityId: profileId,
        details: `Exported transactions in ${format} format`
      });

      if (format === 'pdf') {
        // Also fetch debts and bill splits for the same date range
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? (() => { const d = new Date(endDate); d.setHours(23, 59, 59, 999); return d; })() : null;

        let debtRows: any[] = [];
        let splitRows: any[] = [];

        if (start && end) {
          debtRows = await db.select().from(debts).where(
            and(
              eq(debts.profileId, profileId),
              sql`${debts.date} >= ${start.toISOString()}`,
              sql`${debts.date} <= ${end.toISOString()}`
            )
          );

          splitRows = await db.query.billSplits.findMany({
            where: and(
              eq(billSplits.profileId, profileId),
              sql`${billSplits.date} >= ${start.toISOString()}`,
              sql`${billSplits.date} <= ${end.toISOString()}`
            ),
            with: { participants: true }
          });
        } else {
          debtRows = await db.select().from(debts).where(eq(debts.profileId, profileId));
          splitRows = await db.query.billSplits.findMany({
            where: eq(billSplits.profileId, profileId),
            with: { participants: true }
          });
        }

        return res.json({ transactions: txs, debts: debtRows, billSplits: splitRows });
      }

      const fields = ['date', 'amount', 'type', 'category.name', 'note'];
      const parser = new Parser({ fields });
      const csv = parser.parse(txs.map(tx => ({
        ...tx,
        date: new Date(tx.date).toLocaleDateString(),
        amount: `Rs. ${Math.abs(Number(tx.amount)).toLocaleString('en-IN')}`,
        type: tx.type.toUpperCase(),
        'category.name': tx.category?.name || 'Uncategorized'
      })));

      res.header('Content-Type', 'text/csv');
      res.attachment(`FinTrack-Report-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (err) {
      res.status(500).json({ message: "Export failed" });
    }
  });

  app.get("/api/audit-logs", isAuthenticated, async (req: any, res) => {
    const logs = await storage.getAuditLogs(req.appUserId);
    res.json(logs);
  });

  // Admin Routes (After req.appUserId middleware is set)
  const isAdmin = async (req: any, res: any, next: any) => {
    const [user] = await db.select().from(users).where(eq(users.id, req.appUserId));
    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req: any, res) => {
    const allUsers = await storage.getAllUsers();
    res.json(allUsers);
  });

  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req: any, res) => {
    const stats = await storage.getUserStats();
    res.json(stats);
  });

  app.get("/api/admin/transactions", isAuthenticated, isAdmin, async (req: any, res) => {
    const allTx = await storage.getAllTransactions();
    res.json(allTx);
  });

  app.get("/api/admin/debts", isAuthenticated, isAdmin, async (req: any, res) => {
    const allDebts = await storage.getAllDebts();
    res.json(allDebts);
  });

  app.get("/api/admin/split-bills", isAuthenticated, isAdmin, async (req: any, res) => {
    const allBills = await storage.getAllBillSplits();
    res.json(allBills);
  });

  // Debts (Udhari Khata)
  app.get("/api/profiles/:profileId/debts", isAuthenticated, async (req, res) => {
    const debts = await storage.getDebts(Number(req.params.profileId));
    const month = req.query.month ? Number(req.query.month) : null;
    const year = req.query.year ? Number(req.query.year) : null;
    
    if (month !== null && year !== null) {
      const filtered = debts.filter((d: any) => {
        const d_date = new Date(d.date);
        return d_date.getMonth() + 1 === month && d_date.getFullYear() === year;
      });
      return res.json(filtered);
    }
    
    res.json(debts);
  });

  app.post("/api/profiles/:profileId/debts", isAuthenticated, async (req: any, res) => {
    try {
      const profileId = Number(req.params.profileId);
      const body = {
        ...req.body,
        amount: req.body.amount?.toString(),
        date: req.body.date ? new Date(req.body.date) : new Date()
      };
      
      const debt = await storage.createDebt({ ...body, profileId });
      
      res.status(201).json(debt);
    } catch (err) {
      res.status(400).json({ message: 'Invalid input' });
    }
  });

  app.patch("/api/debts/:id", isAuthenticated, async (req, res) => {
    try {
      const body = {
        ...req.body,
        ...(req.body.amount !== undefined && { amount: req.body.amount.toString() }),
        ...(req.body.date !== undefined && { date: new Date(req.body.date) }),
      };
      const debt = await storage.updateDebt(Number(req.params.id), body);
      res.json(debt);
    } catch (err) {
      console.error("Patch debt error:", err);
      res.status(400).json({ message: "Failed to update debt record" });
    }
  });

  app.delete("/api/debts/:id", isAuthenticated, async (req, res) => {
    await storage.deleteDebt(Number(req.params.id));
    res.status(204).send();
  });

  // Split Bills
  app.get("/api/profiles/:profileId/bill-splits", isAuthenticated, async (req, res) => {
    const splits = await storage.getBillSplits(Number(req.params.profileId));
    const month = req.query.month ? Number(req.query.month) : null;
    const year = req.query.year ? Number(req.query.year) : null;
    
    if (month !== null && year !== null) {
      const filtered = splits.filter((s: any) => {
        const s_date = new Date(s.date);
        return s_date.getMonth() + 1 === month && s_date.getFullYear() === year;
      });
      return res.json(filtered);
    }
    
    res.json(splits);
  });

  app.post("/api/profiles/:profileId/bill-splits", isAuthenticated, async (req: any, res) => {
    try {
      const { split, participants } = req.body;
      const profileId = Number(req.params.profileId);
      
      const newSplit = await storage.createBillSplit(
        {
          profileId,
          description: split.description,
          totalAmount: String(split.amount)
        },
        participants
      );
      
      // Automatically create debt records for participants
      for (const p of participants) {
        await storage.createDebt({
          profileId,
          type: 'gave',
          contactName: p.contactName,
          contactPhone: p.contactPhone,
          amount: String(p.amount),
          note: `Split: ${split.description}`,
          date: new Date(),
          status: 'pending'
        });
      }

      // Add a category check to help user see categories
      const existingCategories = await storage.getCategories(profileId);
      if (existingCategories.length === 0) {
        console.log("No categories found for profile, creating defaults...");
        // This is a safety catch for existing users who might have missed the initial trigger
      }

      res.status(201).json(newSplit);
    } catch (err) {
      console.error("Split Create Error:", err);
      res.status(400).json({ message: 'Failed to create split' });
    }
  });

  app.delete("/api/bill-splits/:id", isAuthenticated, async (req, res) => {
    await storage.deleteBillSplit(Number(req.params.id));
    res.status(204).send();
  });

  app.post("/api/profiles/:profileId/rules", isAuthenticated, async (req: any, res) => {
    const input = req.body;
    const rule = await storage.createCategoryRule({ ...input, profileId: Number(req.params.profileId) });
    res.status(201).json(rule);
  });


  app.post("/api/user/upgrade", isAuthenticated, async (req: any, res) => {
    try {
      const [updated] = await db.update(users)
        .set({ subscriptionStatus: 'paid' })
        .where(eq(users.id, req.appUserId))
        .returning();
      console.log("User upgraded to Pro:", updated);
      res.json(updated);
    } catch (err) {
      console.error("Upgrade failed:", err);
      res.status(500).json({ message: 'Upgrade failed' });
    }
  });

  return httpServer;
}
