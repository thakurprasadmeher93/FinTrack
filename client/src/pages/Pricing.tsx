import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { Check } from "lucide-react";

const plans = [
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

export default function Pricing() {
  const { colors } = useTheme();
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <AppHeader showAuth={false} />
      <main className="flex-1">
        <div className={`bg-gradient-to-br ${colors.from} ${colors.to} py-20`}>
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center">
              <h1 className="text-5xl font-display font-bold text-foreground mb-6">
                Simple, Transparent Pricing
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Choose the plan that fits your needs. All plans include a 14-day free trial.
              </p>
            </div>
          </div>
        </div>
        
        <div className="py-16">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4 md:px-8">
            {plans.map((plan, idx) => (
              <Card
                key={idx}
                className={`p-8 flex flex-col h-full transition-all ${
                  plan.popular
                    ? "border-blue-500 dark:border-blue-500 shadow-lg md:scale-105"
                    : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="mb-4 inline-flex w-fit px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      Most Popular
                    </span>
                  </div>
                )}

                <h3 className="text-2xl font-bold font-display text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-muted-foreground mb-6">{plan.description}</p>

                <div className="mb-8">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>

                <Button
                  className="w-full mb-8"
                  variant={plan.popular ? "default" : "outline"}
                >
                  Get Started
                </Button>

                <div className="space-y-4 flex-1">
                  {plan.features.map((feature, fidx) => (
                    <div key={fidx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
