import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useProfiles, useAnalyticsSummary, useTransactions, useBudget, useDeleteTransaction, useDebts, useBillSplits } from "@/hooks/use-fin-track";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertCircle,
  ArrowRight,
  MoreHorizontal,
  Zap,
  CheckCircle2,
  ArrowUpCircle,
  ArrowDownCircle,
  Shield,
  Calendar,
  Pencil,
  Trash2,
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";
import { useLocation } from "wouter";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: profiles, isLoading: isProfilesLoading } = useProfiles();
  const isPro = (user as any)?.subscriptionStatus === 'paid';
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const monthOptions = useMemo(() => [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ], []);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  }, []);

  const activeProfileId = (user as any)?.activeProfileId as number | undefined;
  const activeProfile = profiles?.find((p: any) => p.id === activeProfileId) || profiles?.[0]; 

  const { data: summary, isLoading: isSummaryDataLoading } = useAnalyticsSummary(
    activeProfile?.id, 
    selectedMonth, 
    selectedYear
  );

  const { data: recentTransactions, isLoading: isTxDataLoading } = useTransactions(
    activeProfile?.id, 
    { month: selectedMonth, year: selectedYear }
  );

  const { data: debts, isLoading: isDebtsLoading } = useDebts(activeProfile?.id);
  const { data: billSplits, isLoading: isBillSplitsLoading } = useBillSplits(activeProfile?.id);

  const { data: budget } = useBudget(activeProfile?.id, selectedMonth, selectedYear);
  const { mutate: deleteTransaction } = useDeleteTransaction();

  const isSummaryLoading = isAuthLoading || isProfilesLoading || isSummaryDataLoading;
  const isTxLoading = isAuthLoading || isProfilesLoading || isTxDataLoading || isDebtsLoading || isBillSplitsLoading;

  const activeSplitBills = billSplits?.filter((b: any) => b.status !== 'settled') || [];
  const totalSplitAmount = activeSplitBills.reduce((acc: number, b: any) => acc + Number(b.amount), 0);

  if (!activeProfile) {
    return (
      <div className="p-8">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  const budgetProgress = summary && summary.expenses !== undefined && budget 
    ? Math.min((Number(summary.expenses) / Number(budget.amount)) * 100, 100)
    : 0;

  const pendingDebts = debts?.filter((d: any) => d.status === 'pending' && !d.note?.startsWith('Split:')) || [];
  const totalGave = pendingDebts.filter((d: any) => d.type === 'gave').reduce((acc: number, d: any) => acc + Number(d.amount), 0);
  const totalGot = pendingDebts.filter((d: any) => d.type === 'got').reduce((acc: number, d: any) => acc + Number(d.amount), 0);

  return (
    <div className="pb-24 md:pb-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Overview for <span className="font-medium text-foreground">{activeProfile.name}</span> • {monthOptions.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border">
            <Select 
              value={selectedMonth.toString()} 
              onValueChange={(val) => setSelectedMonth(parseInt(val))}
            >
              <SelectTrigger className="w-[130px] h-9 border-0 bg-transparent focus:ring-0">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={selectedYear.toString()} 
              onValueChange={(val) => setSelectedYear(parseInt(val))}
            >
              <SelectTrigger className="w-[100px] h-9 border-0 bg-transparent focus:ring-0">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AddTransactionDialog profileId={activeProfile.id} />
          {isPro && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-xl text-xs font-bold">
              <Zap className="h-3 w-3 fill-current" />
              PRO ACTIVE
            </div>
          )}
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Total Balance</span>
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-10 w-32" />
          ) : (
            <div className="text-3xl font-display font-bold text-foreground tracking-tight">
              ₹ {summary?.balance.toLocaleString('en-IN') ?? "0"}
            </div>
          )}
        </Card>

        <Card className="p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-green-50/30 dark:from-gray-900 dark:to-green-900/10">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Income</span>
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-10 w-32" />
          ) : (
            <div className="text-3xl font-display font-bold text-emerald-600 tracking-tight">
              + ₹ {summary?.income.toLocaleString('en-IN') ?? "0"}
            </div>
          )}
        </Card>

        <Card className="p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-red-50/30 dark:from-gray-900 dark:to-red-900/10">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <TrendingDown className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Expenses</span>
          </div>
          {isSummaryLoading ? (
            <Skeleton className="h-10 w-32" />
          ) : (
            <div className="text-3xl font-display font-bold text-red-600 tracking-tight">
              - ₹ {summary?.expenses.toLocaleString('en-IN') ?? "0"}
            </div>
          )}
        </Card>

        <Card className="p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-amber-50/30 dark:from-gray-900 dark:to-amber-900/10">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <HandCoins className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Udhari (Net)</span>
          </div>
          {isTxLoading ? (
            <Skeleton className="h-10 w-32" />
          ) : (
            <div className={cn(
              "text-3xl font-display font-bold tracking-tight",
              (totalGave - totalGot) >= 0 ? "text-emerald-600" : "text-red-600"
            )}>
              { (totalGave - totalGot) >= 0 ? "+" : "-" } ₹ {Math.abs(totalGave - totalGot).toLocaleString('en-IN')}
            </div>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Recent Transactions */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold font-display">Recent Activity</h3>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" onClick={() => setLocation("/transactions")}>
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              {isTxLoading ? (
                <div className="p-8 space-y-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : recentTransactions?.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <p>No transactions yet this month.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentTransactions?.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold",
                        tx.category?.color ? `text-white` : "bg-gray-100 text-gray-600"
                      )} style={{ backgroundColor: tx.category?.color || undefined }}>
                        {tx.category?.name.charAt(0) || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">{tx.category?.name || "Uncategorized"}</p>
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                            {format(new Date(tx.date), "MMM d, yyyy")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{tx.note || "No details"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "font-bold tabular-nums whitespace-nowrap",
                          tx.type === 'income' ? "text-emerald-600" : "text-foreground"
                        )}>
                          {tx.type === 'income' ? "+" : "-"} ₹ {Math.abs(Number(tx.amount)).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Udhari Widget */}
          <section className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold font-display">Udhari Khata</h3>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-primary" onClick={() => setLocation("/transactions")}>Manage</Button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">You will get</span>
                  <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">₹ {totalGave.toLocaleString('en-IN')}</p>
              </div>

              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-rose-700 dark:text-rose-400 uppercase tracking-wider">You will give</span>
                  <ArrowUpRight className="h-4 w-4 text-rose-600" />
                </div>
                <p className="text-xl font-bold text-rose-700 dark:text-rose-400">₹ {totalGot.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </section>

          {/* Split Bill Widget */}
          <section className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold font-display">Split Bills</h3>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-primary" onClick={() => setLocation("/transactions")}>Manage</Button>
            </div>
            
            <div className="space-y-4">
              {isTxLoading ? (
                <>
                  <Skeleton className="h-14 w-full rounded-xl" />
                  <Skeleton className="h-14 w-full rounded-xl" />
                </>
              ) : activeSplitBills.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No active split bills
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider">Active Splits</span>
                      <Badge variant="outline" className="text-blue-700 dark:text-blue-400">{activeSplitBills.length}</Badge>
                    </div>
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-400">₹ {totalSplitAmount.toLocaleString('en-IN')}</p>
                  </div>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {activeSplitBills.slice(0, 3).map((split: any) => (
                      <div key={split.id} className="p-3 rounded-lg bg-muted/30 border border-border text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{split.description || "Split Bill"}</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">₹ {Number(split.amount).toLocaleString('en-IN')}</span>
                        </div>
                        {split.participants?.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">{split.participants.length} participant{split.participants.length > 1 ? 's' : ''}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Budget Widget */}
          <section className="bg-card rounded-2xl border border-border shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold font-display">Monthly Budget</h3>
              {summary?.budgetStatus === 'exceeded' && (
                <span className="px-2 py-1 rounded-md bg-red-100 text-red-700 text-xs font-bold">Exceeded</span>
              )}
            </div>
            
            {budget ? (
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Spent</span>
                  <span className="font-medium">₹ {summary?.expenses.toLocaleString('en-IN')} / ₹ {Number(budget.amount).toLocaleString('en-IN')}</span>
                </div>
                <Progress value={budgetProgress} className={cn("h-3 rounded-full", summary?.budgetStatus === 'exceeded' ? "[&>div]:bg-red-500" : "[&>div]:bg-primary")} />
                <p className="text-xs text-muted-foreground text-center pt-2">
                  {summary?.remainingBudget && summary.remainingBudget > 0 
                    ? `You can spend ₹ ${summary.remainingBudget.toLocaleString('en-IN')} more.`
                    : "You have exceeded your monthly budget."}
                </p>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-4">No budget set for this month.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setLocation("/analytics")}
                >
                  Set Budget
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
