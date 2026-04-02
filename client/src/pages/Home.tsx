import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Zap, TrendingUp, BarChart3, Lock, DollarSign, BookOpen, Handshake, Users } from "lucide-react";
import fintrackLogo from "@assets/FinTrack_Logo_1773295152942.png";
import { useTheme } from "@/hooks/use-theme";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

export default function Home() {
  const { colors } = useTheme();
  const goTo = (path: string) => { window.location.href = path; };

  const features = [
    {
      icon: TrendingUp,
      title: "Smart Analytics",
      description: "Visualize spending patterns with intuitive charts and detailed insights"
    },
    {
      icon: Zap,
      title: "Real-time Tracking",
      description: "Instantly record transactions and monitor your financial health"
    },
    {
      icon: DollarSign,
      title: "Budget Management",
      description: "Set and track budgets across categories to control spending"
    },
    {
      icon: BookOpen,
      title: "Complete Ledger",
      description: "Maintain a digital ledger book to track all income and expenses with detailed categorization and notes"
    },
    {
      icon: Handshake,
      title: "Udhari Khata",
      description: "Track debts and money exchanges with friends and family. Keep detailed records of who owes whom with WhatsApp sharing"
    },
    {
      icon: Users,
      title: "Split Bills",
      description: "Easily split expenses among friends and family. Automatically calculate who pays whom with detailed participant tracking"
    },
    {
      icon: BarChart3,
      title: "Expense Reports",
      description: "Generate comprehensive reports with donut charts and breakdowns"
    },
    {
      icon: Lock,
      title: "Secure & Private",
      description: "Your financial data is encrypted and stored safely"
    }
  ];

  const pricingPlans = [
    {
      name: "Basic",
      price: "Free",
      description: "Perfect for getting started",
      features: [
        "Up to 100 transactions/month",
        "Basic expense tracking",
        "Monthly summary",
        "Limited analytics"
      ]
    },
    {
      name: "Pro",
      price: "₹99",
      period: "/month",
      description: "For serious savers",
      popular: true,
      features: [
        "Unlimited transactions",
        "Advanced analytics & reports",
        "PDF & CSV exports",
        "Udhari Khata (Debt tracking)",
        "Split bill management",
        "Budget planning tools",
        "Priority support"
      ]
    },
    {
      name: "Family",
      price: "₹199",
      period: "/month",
      description: "Manage family finances",
      features: [
        "Everything in Pro",
        "Multiple profiles",
        "Shared budgets",
        "Family reports",
        "Permission controls",
        "Collaborative tracking"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <AppHeader />

      <main className="flex-1">
      {/* Hero Section */}
      <section className={`bg-gradient-to-br ${colors.from} ${colors.to} py-20 md:py-32`}>
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <div className={`mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full ${colors.light} border border-current/10`}>
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">
              Trusted by thousands
            </span>
          </div>

          <div className="mb-10 flex justify-center">
            <img 
              src={fintrackLogo} 
              alt="FinTrack Logo" 
              className="h-40 md:h-52 w-auto"
            />
          </div>

          <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-2">
            FinTrack- Track Every Rupee Under Your Control
          </h1>

          <p className="text-sm md:text-base text-muted-foreground mb-12 font-medium">
            Optimise Life- Powered by Simplicity
          </p>

          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Smart financial management made simple. Monitor spending, analyze trends, manage budgets, and take control of your money.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              variant="outline"
              className="h-13 text-base font-semibold px-8"
              onClick={() => goTo("/dashboard")}
              data-testid="button-try-demo"
            >
              Try Without Login
            </Button>
          </div>
        </div>
      </section>

      {/* Beta Testing Banner */}
      <section className="py-6 md:py-8 bg-blue-50 dark:bg-blue-950/30 border-t border-b border-blue-200 dark:border-blue-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-start gap-4">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-1">
                Free Testing Phase
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                FinTrack is currently free to use during the testing phase. This website is being developed and refined. Please note: User data may not be retained after the final publication or if the service transitions to a paid model in the future. Enjoy exploring all features at no cost while it's available!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
              Powerful Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your finances effectively
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="p-8 hover:shadow-lg transition-shadow border-border">
                  <Icon className={`w-12 h-12 mb-4 ${colors.accent.replace('bg-', 'text-')}`} />
                  <h3 className="text-xl font-bold font-display text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, idx) => (
              <Card
                key={idx}
                className={`p-8 flex flex-col h-full transition-all ${
                  plan.popular
                    ? `${colors.accent} text-white shadow-lg md:scale-105`
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="mb-4 inline-flex w-fit px-3 py-1 rounded-full bg-white/20 border border-white/30">
                    <span className="text-sm font-semibold text-white">
                      Most Popular
                    </span>
                  </div>
                )}

                <h3 className={`text-2xl font-bold font-display mb-2 ${plan.popular ? "text-white" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                <p className={`mb-6 ${plan.popular ? "text-white/80" : "text-muted-foreground"}`}>{plan.description}</p>

                <div className="mb-8">
                  <span className={`text-4xl font-bold ${plan.popular ? "text-white" : "text-foreground"}`}>{plan.price}</span>
                  {plan.period && (
                    <span className={plan.popular ? "text-white/70" : "text-muted-foreground"}>{plan.period}</span>
                  )}
                </div>

                <Button
                  className="w-full mb-8"
                  variant={plan.popular ? "secondary" : "outline"}
                  onClick={() => goTo("/login?mode=signup")}
                  data-testid="button-pricing-signup"
                >
                  Get Started
                </Button>

                <div className="space-y-4 flex-1">
                  {plan.features.map((feature, fidx) => (
                    <div key={fidx} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? "text-white" : "text-green-500"}`} />
                      <span className={`text-sm ${plan.popular ? "text-white" : "text-foreground"}`}>{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <p className="text-center text-muted-foreground text-sm mt-12">
            All plans include 14-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-20 md:py-32 bg-gradient-to-r ${colors.from} ${colors.to}`}>
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-10 md:p-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-white">
              Ready to Take Control?
            </h2>
            <p className="text-lg md:text-xl mb-10 text-white">
              Join thousands of users who've transformed their financial habits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="h-13 text-base font-semibold px-8"
                onClick={() => goTo("/login?mode=signup")}
                data-testid="button-free-trial"
              >
                Start Free Trial
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="h-13 text-base font-semibold px-8 text-white hover:bg-white/20 border border-white/30"
                onClick={() => goTo("/dashboard")}
                data-testid="button-explore-demo"
              >
                Explore Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      </main>
      
      <AppFooter />
    </div>
  );
}
