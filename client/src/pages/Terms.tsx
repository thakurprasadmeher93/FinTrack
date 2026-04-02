import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { useTheme } from "@/hooks/use-theme";

export default function Terms() {
  const { colors } = useTheme();
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <AppHeader showAuth={false} />
      <main className="flex-1">
        <div className={`bg-gradient-to-br ${colors.from} ${colors.to} py-16`}>
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <h1 className="text-5xl font-display font-bold text-foreground mb-4">
              Terms of Service
            </h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">

          <div className="prose prose-invert max-w-none text-muted-foreground space-y-6">
            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing and using FinTrack, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                2. License
              </h2>
              <p>
                FinTrack grants you a personal, non-exclusive, non-transferable license to use the application. You agree not to reverse engineer, decompile, or disassemble the application.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                3. User Responsibilities
              </h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and password and for restricting access to your account. You agree to accept responsibility for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                4. Prohibited Conduct
              </h2>
              <p>
                You agree not to engage in any of the following: accessing the application without authorization, using automated tools to scrape data, or using the service for illegal purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                5. Disclaimer of Warranties
              </h2>
              <p>
                FinTrack is provided "as is" without warranty of any kind, express or implied. We do not guarantee that the service will be uninterrupted or error-free.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                6. Limitation of Liability
              </h2>
              <p>
                In no event shall FinTrack be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                7. Termination
              </h2>
              <p>
                We reserve the right to terminate your account and access to the service at any time, for any reason, without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                8. Governing Law
              </h2>
              <p>
                These terms are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts located in India.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                9. Contact Information
              </h2>
              <p>
                If you have any questions about these terms, please contact us at optimiselife365@gmail.com.
              </p>
            </section>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
