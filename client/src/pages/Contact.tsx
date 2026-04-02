import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { Mail, Clock } from "lucide-react";

export default function Contact() {
  const { colors } = useTheme();
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <AppHeader showAuth={false} />
      <main className="flex-1">
        <div className={`bg-gradient-to-br ${colors.from} ${colors.to} py-20`}>
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
            <h1 className="text-5xl font-display font-bold text-foreground mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-muted-foreground">
              We'd love to hear from you. Reach out to us anytime.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 py-16">
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="p-8 border-border">
              <div className="flex items-start gap-6">
                <Mail className="w-8 h-8 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold font-display text-foreground mb-2">
                    Email
                  </h3>
                  <p className="text-muted-foreground">
                    <a href="mailto:optimiselife365@gmail.com" className="hover:text-blue-500 transition">
                      optimiselife365@gmail.com
                    </a>
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-border">
              <div className="flex items-start gap-6">
                <Clock className="w-8 h-8 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold font-display text-foreground mb-2">
                    Response Time
                  </h3>
                  <p className="text-muted-foreground">
                    We typically respond within 24 hours
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className={`p-12 border-border bg-gradient-to-br ${colors.from} ${colors.to}`}>
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold font-display text-foreground mb-4">
                  Contact Form
                </h2>
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-border bg-white dark:bg-slate-950 text-foreground"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 rounded-lg border border-border bg-white dark:bg-slate-950 text-foreground"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Message
                    </label>
                    <textarea
                      rows={6}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-white dark:bg-slate-950 text-foreground"
                      placeholder="Your message..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </Card>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
