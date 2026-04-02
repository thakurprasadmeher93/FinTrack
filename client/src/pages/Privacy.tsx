import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { useTheme } from "@/hooks/use-theme";

export default function Privacy() {
  const { colors } = useTheme();
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <AppHeader showAuth={false} />
      <main className="flex-1">
        <div className={`bg-gradient-to-br ${colors.from} ${colors.to} py-16`}>
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <h1 className="text-5xl font-display font-bold text-foreground mb-4">
              Privacy Policy
            </h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">

          <div className="prose prose-invert max-w-none text-muted-foreground space-y-6">
            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                1. Information We Collect
              </h2>
              <p>
                We collect information you provide directly to us, such as when you create an account, upload documents, or contact us. This includes your name, email address, phone number, and financial information you choose to enter.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                2. How We Use Your Information
              </h2>
              <p>
                We use the information we collect to provide, improve, and personalize our services. We may also use it to communicate with you, respond to your inquiries, and comply with legal obligations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                3. Data Security
              </h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All data is encrypted using industry-standard encryption protocols.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                4. Data Sharing
              </h2>
              <p>
                We do not sell, trade, or share your personal information with third parties for their marketing purposes. We may share information when required by law or to protect our rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                5. Your Rights
              </h2>
              <p>
                You have the right to access, correct, or delete your personal information at any time. You can manage your privacy preferences in your account settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                6. Cookies
              </h2>
              <p>
                We use cookies to improve your experience. You can control cookie settings through your browser. We use essential cookies for functionality and optional cookies for analytics and personalization.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                7. Changes to This Policy
              </h2>
              <p>
                We may update this privacy policy from time to time. We will notify you of any significant changes by posting the new policy on our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                8. Contact Us
              </h2>
              <p>
                If you have questions about this privacy policy, please contact us at optimiselife365@gmail.com.
              </p>
            </section>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
