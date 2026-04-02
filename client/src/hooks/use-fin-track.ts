import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { 
  type CreateProfileRequest, 
  type CreateCategoryRequest, 
  type CreateTransactionRequest, 
  type CreateBudgetRequest,
  type UpdateBudgetRequest,
  type Transaction,
  type Category,
  type Budget,
  type MonthlyAnalysis,
  type CategorySummary,
  type TransactionSummary
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// --- Profiles ---
export function useProfiles() {
  return useQuery({
    queryKey: [api.profiles.list.path],
    queryFn: async () => {
      const res = await fetch(api.profiles.list.path);
      if (!res.ok) throw new Error("Failed to fetch profiles");
      return api.profiles.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: CreateProfileRequest) => {
      const res = await fetch(api.profiles.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create profile");
      return api.profiles.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.profiles.list.path] });
      toast({ title: "Profile created", description: "You can now switch to this profile." });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}

export function useSwitchProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.profiles.switch.path, { id });
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error("Failed to switch profile");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate everything as profile context changed
      queryClient.invalidateQueries(); 
      queryClient.refetchQueries({ queryKey: ["/api/auth/user"] }).then(() => {
        toast({ title: "Profile switched", description: "Dashboard updated." });
      });
    }
  });
}

// --- Categories ---
export function useCategories(profileId?: number) {
  return useQuery({
    queryKey: [api.categories.list.path, profileId],
    enabled: !!profileId,
    queryFn: async () => {
      if (!profileId) return [];
      const url = buildUrl(api.categories.list.path, { profileId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return api.categories.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ profileId, ...data }: CreateCategoryRequest & { profileId: number }) => {
      const url = buildUrl(api.categories.create.path, { profileId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create category");
      return api.categories.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.categories.list.path, variables.profileId] });
      toast({ title: "Category added", description: "New category is ready to use." });
    }
  });
}

// --- Transactions ---
export function useTransactions(profileId?: number, filters?: { month?: number, year?: number, categoryId?: number }) {
  return useQuery({
    queryKey: [api.transactions.list.path, profileId, filters],
    enabled: !!profileId,
    queryFn: async () => {
      if (!profileId) return [];
      let url = buildUrl(api.transactions.list.path, { profileId });
      
      const params = new URLSearchParams();
      if (filters?.month !== undefined) params.append("month", filters.month.toString());
      if (filters?.year !== undefined) params.append("year", filters.year.toString());
      if (filters?.categoryId !== undefined) params.append("categoryId", filters.categoryId.toString());
      
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return api.transactions.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ profileId, ...data }: CreateTransactionRequest & { profileId: number }) => {
      // Ensure amount and date are properly coerced if coming from raw form inputs
      const validated = api.transactions.create.input.parse(data);
      const url = buildUrl(api.transactions.create.path, { profileId });
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      
      if (!res.ok) throw new Error("Failed to create transaction");
      return api.transactions.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path, variables.profileId] });
      queryClient.invalidateQueries({ queryKey: [api.analytics.summary.path, variables.profileId] });
      queryClient.invalidateQueries({ queryKey: [api.analytics.byCategory.path, variables.profileId] });
      queryClient.invalidateQueries({ queryKey: [api.analytics.trend.path, variables.profileId] });
      toast({ title: "Transaction added", description: "Your records have been updated." });
    }
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.transactions.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete transaction");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.analytics.summary.path] });
      toast({ title: "Transaction deleted", description: "Record removed successfully." });
    }
  });
}

// --- Budgets ---
export function useBudget(profileId?: number, month?: number, year?: number) {
  return useQuery({
    queryKey: [api.budgets.get.path, profileId, month, year],
    enabled: !!profileId && month !== undefined && year !== undefined,
    queryFn: async () => {
      if (!profileId || month === undefined || year === undefined) return null;
      const url = buildUrl(api.budgets.get.path, { profileId });
      const params = new URLSearchParams({ month: month.toString(), year: year.toString() });
      const res = await fetch(`${url}?${params}`);
      
      if (!res.ok) throw new Error("Failed to fetch budget");
      return api.budgets.get.responses[200].parse(await res.json());
    }
  });
}

export function useSetBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ profileId, ...data }: CreateBudgetRequest & { profileId: number }) => {
      const url = buildUrl(api.budgets.set.path, { profileId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to set budget");
      return api.budgets.set.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.budgets.get.path, variables.profileId] });
      queryClient.invalidateQueries({ queryKey: [api.analytics.summary.path, variables.profileId] });
      toast({ title: "Budget updated", description: "Monthly limit set successfully." });
    }
  });
}

// --- Analytics ---
export function useAnalyticsSummary(profileId?: number, month?: number, year?: number) {
  return useQuery({
    queryKey: [api.analytics.summary.path, profileId, month, year],
    enabled: !!profileId && month !== undefined && year !== undefined,
    queryFn: async () => {
      if (!profileId || month === undefined || year === undefined) return null;
      const url = buildUrl(api.analytics.summary.path, { profileId });
      const params = new URLSearchParams({ month: month.toString(), year: year.toString() });
      const res = await fetch(`${url}?${params}`);
      
      if (!res.ok) throw new Error("Failed to fetch analytics summary");
      return api.analytics.summary.responses[200].parse(await res.json());
    }
  });
}

export function useDebts(profileId?: number) {
  return useQuery({
    queryKey: ['/api/profiles', profileId, 'debts'],
    enabled: !!profileId,
    queryFn: async () => {
      if (!profileId) return [];
      const res = await fetch(`/api/profiles/${profileId}/debts`);
      if (!res.ok) throw new Error("Failed to fetch debts");
      return res.json();
    }
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ profileId, ...data }: any) => {
      const res = await fetch(`/api/profiles/${profileId}/debts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create debt record");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', variables.profileId, 'debts'] });
      toast({ title: "Success", description: "Udhari record added and SMS simulated." });
    }
  });
}

export function useCategoryAnalytics(profileId?: number, month?: number, year?: number) {
  return useQuery({
    queryKey: [api.analytics.byCategory.path, profileId, month, year],
    enabled: !!profileId && month !== undefined && year !== undefined,
    queryFn: async () => {
      if (!profileId || month === undefined || year === undefined) return [];
      const url = buildUrl(api.analytics.byCategory.path, { profileId });
      const params = new URLSearchParams({ month: month.toString(), year: year.toString() });
      const res = await fetch(`${url}?${params}`);
      
      if (!res.ok) throw new Error("Failed to fetch category analytics");
      return api.analytics.byCategory.responses[200].parse(await res.json());
    }
  });
}

export function useTrendAnalytics(profileId?: number, type: 'monthly' | 'yearly' | '3y' | '5y' | 'alltime' = 'monthly') {
  return useQuery({
    queryKey: [api.analytics.trend.path, profileId, type],
    enabled: !!profileId,
    queryFn: async () => {
      if (!profileId) return [];
      const url = buildUrl(api.analytics.trend.path, { profileId });
      const res = await fetch(`${url}?type=${type}`);
      if (!res.ok) throw new Error("Failed to fetch trend analytics");
      return api.analytics.trend.responses[200].parse(await res.json());
    }
  });
}

export function useDailySpendingPattern(profileId?: number, type: 'monthly' | 'yearly' | '3y' | '5y' | 'alltime' = 'monthly') {
  return useQuery({
    queryKey: [`/api/profiles/${profileId}/analytics/daily-spending`, profileId, type],
    enabled: !!profileId,
    queryFn: async () => {
      if (!profileId) return [];
      const url = `/api/profiles/${profileId}/analytics/daily-spending`;
      const params = new URLSearchParams({ type });
      const res = await fetch(`${url}?${params}`);
      if (!res.ok) throw new Error("Failed to fetch daily spending pattern");
      return (await res.json()) as Array<{ date: string; amount: number }>;
    }
  });
}

export function useDebtAnalytics(profileId?: number, month?: number, year?: number) {
  return useQuery({
    queryKey: ['/api/profiles/:profileId/analytics/debts', profileId, month, year],
    enabled: !!profileId && month !== undefined && year !== undefined,
    queryFn: async () => {
      if (!profileId || month === undefined || year === undefined) return [];
      const res = await fetch(`/api/profiles/${profileId}/analytics/debts?month=${month}&year=${year}`);
      if (!res.ok) throw new Error("Failed to fetch debt analytics");
      return res.json();
    }
  });
}

export function useSplitBillAnalytics(profileId?: number, month?: number, year?: number) {
  return useQuery({
    queryKey: ['/api/profiles/:profileId/analytics/splits', profileId, month, year],
    enabled: !!profileId && month !== undefined && year !== undefined,
    queryFn: async () => {
      if (!profileId || month === undefined || year === undefined) return [];
      const res = await fetch(`/api/profiles/${profileId}/analytics/splits?month=${month}&year=${year}`);
      if (!res.ok) throw new Error("Failed to fetch split bill analytics");
      return res.json();
    }
  });
}

export function useBillSplits(profileId?: number) {
  return useQuery({
    queryKey: ['/api/profiles', profileId, 'bill-splits'],
    enabled: !!profileId,
    queryFn: async () => {
      if (!profileId) return [];
      const res = await fetch(`/api/profiles/${profileId}/bill-splits`);
      if (!res.ok) throw new Error("Failed to fetch bill splits");
      return res.json();
    }
  });
}

export function useDeleteBillSplit(profileId?: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (splitId: number) => {
      const res = await fetch(`/api/bill-splits/${splitId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete split bill");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', profileId, 'bill-splits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bill-splits'] });
      toast({ title: "Split bill deleted" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}
