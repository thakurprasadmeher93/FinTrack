import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { Target, Users, Lightbulb } from "lucide-react";

export default function About() {
  const { colors } = useTheme();
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <AppHeader showAuth={false} />
      <main className="flex-1">
        <div className={`bg-gradient-to-br ${colors.from} ${colors.to} py-20`}>
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <h1 className="text-5xl font-display font-bold text-foreground mb-6">
              About FinTrack
            </h1>
            <p className="text-xl text-muted-foreground">
              Empowering financial awareness, one rupee at a time
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 py-16">
          <div className="space-y-12">
            <section>
              <h2 className="text-3xl font-bold font-display text-foreground mb-6">
                Our Mission
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                FinTrack is built with a simple yet powerful mission: to make personal finance management accessible to everyone. We believe that understanding where your money goes is the first step to financial freedom.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                In a world where financial complexity can be overwhelming, FinTrack simplifies expense tracking, budget management, and financial analysis into an intuitive, beautiful application.
              </p>
            </section>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 border-border">
                <Target className="w-12 h-12 text-blue-500 mb-4" />
                <h3 className="text-xl font-bold font-display text-foreground mb-4">
                  Our Vision
                </h3>
                <p className="text-muted-foreground">
                  To create a world where everyone has complete control and understanding of their personal finances.
                </p>
              </Card>

              <Card className="p-8 border-border">
                <Lightbulb className="w-12 h-12 text-blue-500 mb-4" />
                <h3 className="text-xl font-bold font-display text-foreground mb-4">
                  Our Values
                </h3>
                <p className="text-muted-foreground">
                  Simplicity, Security, and Empowerment. We're committed to building tools that genuinely help.
                </p>
              </Card>

              <Card className="p-8 border-border">
                <Users className="w-12 h-12 text-blue-500 mb-4" />
                <h3 className="text-xl font-bold font-display text-foreground mb-4">
                  Our Team
                </h3>
                <p className="text-muted-foreground">
                  Built by Optimise Life, powered by experts dedicated to financial inclusion.
                </p>
              </Card>
            </div>

            <section>
              <h2 className="text-3xl font-bold font-display text-foreground mb-6">
                Why FinTrack?
              </h2>
              <ul className="space-y-4 text-muted-foreground text-lg">
                <li className="flex items-start gap-4">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Designed specifically for Indian users with support for rupee tracking and local payment methods</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Beautiful, intuitive interface that makes financial management enjoyable</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Advanced features like Udhari Khata for debt tracking and bill splitting</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Enterprise-grade security with data encryption and regular backups</span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
