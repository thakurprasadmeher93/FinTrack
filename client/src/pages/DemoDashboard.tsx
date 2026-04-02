import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  ArrowRight, 
  Zap, 
  BarChart3,
  CreditCard,
  DollarSign,
  PieChart,
  Download
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export default function DemoDashboard() {
  const { colors } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <AppHeader showAuth={true} />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-display font-bold text-foreground mb-2">
              Dashboard Demo
            </h1>
            <p className="text-muted-foreground">
              Explore FinTrack's powerful financial management features
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 border-border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
                  <p className="text-3xl font-bold text-foreground">₹1,45,230</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-xs text-blue-600">+12% from last month</p>
            </Card>

            <Card className="p-6 border-border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Income (Month)</p>
                  <p className="text-3xl font-bold text-foreground">₹85,000</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-xs text-green-600">Regular salary</p>
            </Card>

            <Card className="p-6 border-border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Expenses (Month)</p>
                  <p className="text-3xl font-bold text-foreground">₹32,450</p>
                </div>
                <Zap className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-xs text-orange-600">38% of income</p>
            </Card>

            <Card className="p-6 border-border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Savings (Month)</p>
                  <p className="text-3xl font-bold text-foreground">₹52,550</p>
                </div>
                <CreditCard className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-xs text-emerald-600">62% savings rate</p>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Expense Breakdown */}
            <Card className="p-8 border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-display text-foreground">
                  Expense Breakdown
                </h2>
                <PieChart className="w-6 h-6 text-blue-500" />
              </div>
              <div className="space-y-4">
                {[
                  { category: "Food & Dining", amount: 8450, percent: 26, color: "bg-blue-500" },
                  { category: "Transport", amount: 5200, percent: 16, color: "bg-purple-500" },
                  { category: "Shopping", amount: 7800, percent: 24, color: "bg-pink-500" },
                  { category: "Bills & Utilities", amount: 6500, percent: 20, color: "bg-green-500" },
                  { category: "Entertainment", amount: 4500, percent: 14, color: "bg-orange-500" },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-foreground">{item.category}</span>
                      <span className="text-muted-foreground">₹{item.amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${item.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Transactions */}
            <Card className="p-8 border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-display text-foreground">
                  Recent Transactions
                </h2>
                <BarChart3 className="w-6 h-6 text-blue-500" />
              </div>
              <div className="space-y-4">
                {[
                  { category: "Salary Credit", amount: "+₹85,000", date: "Mar 1", icon: "📊", type: "income" },
                  { category: "Grocery Shopping", amount: "-₹2,450", date: "Mar 10", icon: "🛒", type: "expense" },
                  { category: "Electricity Bill", amount: "-₹1,850", date: "Mar 12", icon: "⚡", type: "expense" },
                  { category: "Restaurant", amount: "-₹850", date: "Mar 13", icon: "🍽️", type: "expense" },
                  { category: "Amazon Purchase", amount: "-₹3,200", date: "Mar 14", icon: "📦", type: "expense" },
                  { category: "Transfer to Savings", amount: "-₹15,000", date: "Mar 15", icon: "🏦", type: "transfer" },
                ].map((txn, idx) => (
                  <div key={idx} className="flex items-center justify-between pb-4 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{txn.icon}</span>
                      <div>
                        <p className="font-medium text-foreground">{txn.category}</p>
                        <p className="text-sm text-muted-foreground">{txn.date}</p>
                      </div>
                    </div>
                    <span className={`font-semibold text-sm ${txn.type === "income" ? "text-green-500" : "text-red-500"}`}>
                      {txn.amount}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Key Features Demo */}
          <Card className="p-8 border-border mb-8">
            <h2 className="text-2xl font-bold font-display text-foreground mb-6">
              Key Features You'll Get
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex gap-4">
                <Zap className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Smart Analytics</h3>
                  <p className="text-sm text-muted-foreground">Real-time insights into your spending patterns</p>
                </div>
              </div>
              <div className="flex gap-4">
                <DollarSign className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Budget Management</h3>
                  <p className="text-sm text-muted-foreground">Set and track budgets across categories</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Download className="w-6 h-6 text-purple-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Export Reports</h3>
                  <p className="text-sm text-muted-foreground">Generate PDF/CSV reports with donut charts</p>
                </div>
              </div>
              <div className="flex gap-4">
                <CreditCard className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Debt Tracking</h3>
                  <p className="text-sm text-muted-foreground">Manage debts with Udhari Khata system</p>
                </div>
              </div>
              <div className="flex gap-4">
                <TrendingUp className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Trend Analysis</h3>
                  <p className="text-sm text-muted-foreground">Monthly and yearly expense trends</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Zap className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Split Bills</h3>
                  <p className="text-sm text-muted-foreground">Easily manage shared expenses</p>
                </div>
              </div>
            </div>
          </Card>

          {/* CTA Section */}
          <div className={`bg-gradient-to-r ${colors.from} ${colors.to} rounded-2xl p-12 text-center border border-border`}>
            <h2 className="text-3xl font-bold font-display text-white mb-4">
              Ready to Take Control of Your Finances?
            </h2>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto text-lg">
              Sign up now to get full access to all FinTrack features and start managing your money like a pro.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="h-12 text-base font-semibold"
                onClick={() => { window.location.href = "/login?mode=signup"; }}
              >
                Create Free Account
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="h-12 text-base font-semibold border-white/30 text-white hover:bg-white/10"
                onClick={() => { window.location.href = "/login"; }}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
