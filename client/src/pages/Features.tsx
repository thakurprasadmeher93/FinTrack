import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { TrendingUp, Zap, DollarSign, BarChart3, Lock, BookOpen, Bell, Handshake, Users } from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Smart Analytics",
    description: "Visualize spending patterns with intuitive charts and detailed insights. Monitor your financial health in real-time with interactive dashboards."
  },
  {
    icon: Zap,
    title: "Real-time Tracking",
    description: "Instantly record transactions and monitor your financial health. Get immediate feedback on your spending habits and trends."
  },
  {
    icon: DollarSign,
    title: "Budget Management",
    description: "Set and track budgets across categories to control spending. Receive alerts when approaching budget limits."
  },
  {
    icon: BookOpen,
    title: "Digital Ledger",
    description: "Maintain a complete ledger book of all your financial transactions. Track income and expenses with detailed categorization, notes, and timestamps for perfect record-keeping."
  },
  {
    icon: Handshake,
    title: "Udhari Khata - Debt Tracking",
    description: "Track personal debts and money exchanges with detailed records. Keep accurate accounts of who owes whom with transaction dates and amounts. Share updates instantly via WhatsApp."
  },
  {
    icon: Users,
    title: "Split Bills - Group Expenses",
    description: "Split shared expenses seamlessly among friends and family. Automatically calculate individual shares with both equal and custom split options. Track complex multi-person expenses effortlessly."
  },
  {
    icon: BarChart3,
    title: "Comprehensive Reports",
    description: "Generate detailed reports with donut charts and breakdowns. Export to PDF and CSV for sharing and analysis."
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description: "Your financial data is encrypted and stored safely. Enterprise-grade security with regular backups."
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Get alerts for important financial events. Customize notifications based on your preferences."
  }
];

export default function Features() {
  const { colors } = useTheme();
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <AppHeader showAuth={false} />
      <main className="flex-1">
        <div className={`bg-gradient-to-br ${colors.from} ${colors.to} py-20`}>
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center">
              <h1 className="text-5xl font-display font-bold text-foreground mb-6">
                Powerful Features
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to manage your finances effectively and take control of your money.
              </p>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="p-6 hover:shadow-lg transition-shadow border-border">
                  <Icon className="w-10 h-10 text-blue-500 mb-4" />
                  <h3 className="text-lg font-bold font-display text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
