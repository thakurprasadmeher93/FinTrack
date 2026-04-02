import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { Code2, Zap, Award } from "lucide-react";
import designerPhoto from "@assets/IMG_1994_1773297858230.PNG";

export default function AboutDesigner() {
  const { colors } = useTheme();
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <AppHeader showAuth={false} />
      <main className="flex-1">
        <div className={`bg-gradient-to-br ${colors.from} ${colors.to} py-20`}>
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <h1 className="text-5xl font-display font-bold text-foreground mb-6">
              About the Designer
            </h1>
            <p className="text-xl text-muted-foreground">
              Meet the mind behind FinTrack
            </p>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-16">

          <Card className="p-12 border-border bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 mb-12">
            <div className="grid md:grid-cols-3 gap-8 items-start">
              <div className="md:col-span-2 space-y-8">
                <div>
                  <h2 className="text-3xl font-bold font-display text-foreground mb-4">
                    Thakur Prasad Meher
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    Electrical Engineer | Full-Stack Developer | Financial Technology Innovator
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-bold font-display text-foreground">
                    Educational Background
                  </h3>
                  <div className="space-y-3 text-muted-foreground">
                    <p className="flex items-start gap-4">
                      <Award className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
                      <span><strong>B.Tech in Electrical Engineering</strong> - Completed with distinction</span>
                    </p>
                    <p className="flex items-start gap-4">
                      <Award className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
                      <span><strong>M.Tech in Power Engineering</strong> - Sardar Vallabhbhai National Institute of Technology (SVNIT), Surat</span>
                    </p>
                    <p className="flex items-start gap-4">
                      <Award className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
                      <span><strong>Ph.D (Dropout)</strong> - Power Engineering, Indian Institute of Technology (IIT) Kanpur</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <img 
                  src={designerPhoto} 
                  alt="Thakur Prasad Meher" 
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="p-8 border-border">
              <Code2 className="w-10 h-10 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold font-display text-foreground mb-4">
                Professional Expertise
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Full-Stack Web Development (React, Node.js, TypeScript)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Financial Technology & Data Analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>UI/UX Design & User Experience</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Cloud Architecture & Deployment</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 border-border">
              <Zap className="w-10 h-10 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold font-display text-foreground mb-4">
                Career Highlights
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>8+ years in Electrical Engineering & Research</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>3+ years in Full-Stack Software Development</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Creator of FinTrack - Revolutionary Financial App</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Published Research in Power Systems & Energy</span>
                </li>
              </ul>
            </Card>
          </div>

          <Card className="p-12 border-border">
            <h3 className="text-2xl font-bold font-display text-foreground mb-8">
              FinTrack Development Journey
            </h3>
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">1</div>
                  <div className="w-1 h-24 bg-blue-200 dark:bg-blue-800"></div>
                </div>
                <div>
                  <h4 className="text-lg font-bold font-display text-foreground mb-2">
                    Conception (2025)
                  </h4>
                  <p className="text-muted-foreground">
                    Identified the need for a simple yet powerful personal finance management tool tailored for Indian users. Combined expertise in electrical engineering with emerging fintech trends.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">2</div>
                  <div className="w-1 h-24 bg-blue-200 dark:bg-blue-800"></div>
                </div>
                <div>
                  <h4 className="text-lg font-bold font-display text-foreground mb-2">
                    Design & Architecture (Q1 2026)
                  </h4>
                  <p className="text-muted-foreground">
                    Designed comprehensive system architecture with React frontend, Node.js backend, and PostgreSQL database. Implemented security-first approach with encryption and data protection.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">3</div>
                  <div className="w-1 h-24 bg-blue-200 dark:bg-blue-800"></div>
                </div>
                <div>
                  <h4 className="text-lg font-bold font-display text-foreground mb-2">
                    Core Development (Q1-Q2 2026)
                  </h4>
                  <p className="text-muted-foreground">
                    Built foundational features: transaction tracking, budget management, expense categorization, and Udhari Khata (debt tracking) system. Implemented advanced analytics with real-time dashboards.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">4</div>
                  <div className="w-1 h-24 bg-blue-200 dark:bg-blue-800"></div>
                </div>
                <div>
                  <h4 className="text-lg font-bold font-display text-foreground mb-2">
                    Advanced Features (Q2 2026)
                  </h4>
                  <p className="text-muted-foreground">
                    Added split bill management, multi-profile support, PDF/CSV export with beautiful donut charts, and monthly/yearly trend analysis. Implemented theme customization with 8 color palettes and dark/light mode.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">5</div>
                </div>
                <div>
                  <h4 className="text-lg font-bold font-display text-foreground mb-2">
                    Launch & Beyond (Current)
                  </h4>
                  <p className="text-muted-foreground">
                    Launched FinTrack with comprehensive documentation, professional UI/UX, and enterprise-grade security. Continuous improvements based on user feedback and market demands.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
