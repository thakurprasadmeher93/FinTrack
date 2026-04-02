import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { useTheme } from "@/hooks/use-theme";

export default function Disclaimer() {
  const { colors } = useTheme();
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <AppHeader showAuth={false} />
      <main className="flex-1">
        <div className={`bg-gradient-to-br ${colors.from} ${colors.to} py-16`}>
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <h1 className="text-5xl font-display font-bold text-foreground mb-4">
              Disclaimer
            </h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">

          <div className="prose prose-invert max-w-none text-muted-foreground space-y-6">
            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                General Disclaimer
              </h2>
              <p>
                FinTrack is provided "as is" without warranty of any kind, express or implied. The developers and maintainers of FinTrack make no representations or warranties about the accuracy, reliability, or completeness of any information contained within the application.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                Financial Advice Disclaimer
              </h2>
              <p>
                FinTrack is a personal finance management tool and is NOT a substitute for professional financial, investment, tax, or legal advice. The application provides tracking and analysis features for informational purposes only. Users should not rely solely on FinTrack for financial decisions.
              </p>
              <p>
                Please consult with qualified financial advisors, tax professionals, or legal experts before making any financial decisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                Accuracy of Information
              </h2>
              <p>
                While we strive to provide accurate and up-to-date information, we do not guarantee the accuracy, completeness, or timeliness of any content displayed in FinTrack. Users are responsible for verifying all financial information before making decisions based on such information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                Data Security
              </h2>
              <p>
                While FinTrack implements industry-standard security measures, no system is completely secure. We cannot guarantee absolute protection of your personal or financial information. Users are responsible for maintaining the confidentiality of their account credentials.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                Limitation of Liability
              </h2>
              <p>
                In no event shall the developers or maintainers of FinTrack be liable for any indirect, incidental, special, consequential, or punitive damages resulting from:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Use or inability to use FinTrack</li>
                <li>Any data loss or corruption</li>
                <li>Financial losses or incorrect calculations</li>
                <li>Unauthorized access to user accounts</li>
                <li>Any other cause related to FinTrack</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                Third-Party Services
              </h2>
              <p>
                FinTrack may integrate with or reference third-party services, APIs, or data sources. We are not responsible for the accuracy, completeness, or reliability of information from third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                Changes to the Application
              </h2>
              <p>
                We reserve the right to modify, suspend, or discontinue FinTrack at any time without notice. We are not liable for any consequences resulting from such modifications or discontinuation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                User Responsibility
              </h2>
              <p>
                By using FinTrack, you accept full responsibility for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Verifying all financial information</li>
                <li>Maintaining data backups</li>
                <li>Protecting your account credentials</li>
                <li>Complying with applicable laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                Contact
              </h2>
              <p>
                For questions about this disclaimer, please contact us at optimiselife365@gmail.com.
              </p>
            </section>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
