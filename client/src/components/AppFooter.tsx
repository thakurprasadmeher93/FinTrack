import { useAuth } from "@/hooks/use-auth";

export function AppFooter() {
  const { user } = useAuth();

  return (
    <footer className="border-t border-border bg-white dark:bg-slate-950 py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {!user && (
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img 
                 src="/assets/FinTrack_Logo_1773295152942.png"
                 alt="FinTrack Logo" 
                 className="h-8 w-auto"
                />
                <span className="font-display font-bold text-foreground">FinTrack</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Track every rupee under your control.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/features" className="hover:text-foreground transition">Features</a></li>
                <li><a href="/pricing" className="hover:text-foreground transition">Pricing</a></li>
                <li><a href="/security" className="hover:text-foreground transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/about" className="hover:text-foreground transition">About</a></li>
                <li><a href="/about-designer" className="hover:text-foreground transition">About the Designer</a></li>
                <li><a href="/blog" className="hover:text-foreground transition">Blog</a></li>
                <li><a href="/contact" className="hover:text-foreground transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/privacy" className="hover:text-foreground transition">Privacy</a></li>
                <li><a href="/terms" className="hover:text-foreground transition">Terms</a></li>
                <li><a href="/disclaimer" className="hover:text-foreground transition">Disclaimer</a></li>
              </ul>
            </div>
          </div>
        )}
        
        {user && (
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <img 
                src={fintrackLogo} 
                alt="FinTrack Logo" 
                className="h-8 w-auto"
              />
              <span className="font-display font-bold text-foreground">FinTrack</span>
            </div>
          </div>
        )}

        <div className="border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground mb-4">
            A Product of Optimise Life · Powered by Simplicity
          </p>
          <p className="text-center text-xs text-muted-foreground">
            © 2026 FinTrack. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
