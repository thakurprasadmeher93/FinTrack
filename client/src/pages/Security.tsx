import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { Shield, Lock, Eye, Server } from "lucide-react";

export default function Security() {
  const { colors } = useTheme();
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <AppHeader showAuth={false} />
      <main className="flex-1">
        <div className={`bg-gradient-to-br ${colors.from} ${colors.to} py-20`}>
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <h1 className="text-5xl font-display font-bold text-foreground mb-6">
              Security & Privacy
            </h1>
            <p className="text-xl text-muted-foreground">
              Your financial data is our top priority
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 py-16">
          <div className="space-y-12">
            <Card className="p-8 border-border">
              <div className="flex items-start gap-6">
                <Shield className="w-12 h-12 text-blue-500 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                    Encryption
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    All your financial data is encrypted using industry-standard AES-256 encryption. Your sensitive information is protected both in transit and at rest.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-border">
              <div className="flex items-start gap-6">
                <Lock className="w-12 h-12 text-blue-500 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                    Access Control
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    We implement strict access controls and multi-factor authentication options. Only authorized personnel can access your data, and all access is logged and monitored.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-border">
              <div className="flex items-start gap-6">
                <Eye className="w-12 h-12 text-blue-500 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                    Privacy Policy
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    We never sell your data to third parties. Your information is used solely to improve your experience with FinTrack. We comply with GDPR, CCPA, and other privacy regulations.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-border">
              <div className="flex items-start gap-6">
                <Server className="w-12 h-12 text-blue-500 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                    Regular Backups
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Your data is backed up regularly on secure servers with redundancy. We perform regular security audits and penetration testing to ensure the highest standards.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
