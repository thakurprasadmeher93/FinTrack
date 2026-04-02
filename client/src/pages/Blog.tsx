import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { Calendar } from "lucide-react";

const blogPosts = [
  {
    title: "10 Money-Saving Tips for Beginners",
    date: "March 10, 2026",
    excerpt: "Learn how to build better financial habits and start saving money today. Simple, actionable tips that actually work.",
    category: "Finance Tips"
  },
  {
    title: "How to Track Your Expenses Effectively",
    date: "March 5, 2026",
    excerpt: "A comprehensive guide to understanding your spending patterns and taking control of your finances.",
    category: "Tutorials"
  },
  {
    title: "The Importance of Emergency Funds",
    date: "February 28, 2026",
    excerpt: "Discover why having an emergency fund is crucial and how to build one without breaking the bank.",
    category: "Finance Tips"
  },
  {
    title: "Budget Planning for Families",
    date: "February 20, 2026",
    excerpt: "Master family budget management with practical strategies that everyone can benefit from.",
    category: "Tutorials"
  },
  {
    title: "Digital Security: Protecting Your Financial Data",
    date: "February 15, 2026",
    excerpt: "Learn best practices for keeping your financial information safe in the digital age.",
    category: "Security"
  },
  {
    title: "Investing 101: A Beginner's Guide",
    date: "February 10, 2026",
    excerpt: "Start your investment journey with this comprehensive guide to investment basics.",
    category: "Finance Tips"
  }
];

export default function Blog() {
  const { colors } = useTheme();
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <AppHeader showAuth={false} />
      <main className="flex-1">
        <div className={`bg-gradient-to-br ${colors.from} ${colors.to} py-20`}>
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <h1 className="text-5xl font-display font-bold text-foreground mb-6">
              FinTrack Blog
            </h1>
            <p className="text-xl text-muted-foreground">
              Tips, tricks, and insights for better financial management
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 py-16">
          <div className="space-y-6">
            {blogPosts.map((post, idx) => (
              <Card
                key={idx}
                className="p-8 border-border hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {post.category}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {post.date}
                  </div>
                </div>
                <h3 className="text-2xl font-bold font-display text-foreground mb-3">
                  {post.title}
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {post.excerpt}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
