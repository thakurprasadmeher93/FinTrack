import { Button } from "@/components/ui/button";
import { Moon, Sun, Palette } from "lucide-react";
import { useTheme, type ColorPalette } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

interface AppHeaderProps {
  showAuth?: boolean;
  onSignIn?: () => void;
  onSignUp?: () => void;
}

export function AppHeader({ showAuth = true, onSignIn, onSignUp }: AppHeaderProps) {
  const { isDark, colorPalette, toggleTheme, changeColorPalette, allPalettes } = useTheme();
  const { user } = useAuth();
  const [showPaletteMenu, setShowPaletteMenu] = useState(false);

  const paletteColors: Record<ColorPalette, string> = {
    blue: "bg-blue-500",
    pink: "bg-pink-500",
    yellow: "bg-yellow-500",
    purple: "bg-purple-500",
    green: "bg-green-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
    cyan: "bg-cyan-500"
  };

  function goTo(path: string) {
    window.location.href = path;
  }

  function handleLogoClick() {
    goTo(user ? "/dashboard-full" : "/");
  }

  return (
    <header className="border-b border-border sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={handleLogoClick}
        >
          <img
           src="/assets/FinTrack_Logo.png"
           alt="FinTrack Logo"
           className="h-10 w-auto"
           />
          <span className="text-2xl font-display font-bold text-foreground">FinTrack</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Colour Palette */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPaletteMenu(!showPaletteMenu)}
              title="Change color palette"
              data-testid="button-palette"
            >
              <Palette className="w-5 h-5" />
            </Button>

            {showPaletteMenu && (
              <>
                {/* Backdrop to close menu */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPaletteMenu(false)}
                />
                <div className="absolute right-0 mt-2 p-3 rounded-lg border border-border bg-white dark:bg-slate-950 shadow-xl grid grid-cols-4 gap-2 w-48 z-50">
                  {allPalettes.map((palette) => (
                    <button
                      key={palette}
                      type="button"
                      onClick={() => {
                        changeColorPalette(palette);
                        setShowPaletteMenu(false);
                        setTimeout(() => window.location.reload(), 300);
                      }}
                      className={`w-8 h-8 rounded-lg ${paletteColors[palette]} cursor-pointer transition-transform hover:scale-110 ${
                        colorPalette === palette ? "ring-2 ring-offset-2 ring-foreground" : ""
                      }`}
                      title={palette}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Dark/Light Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            data-testid="button-theme-toggle"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* Auth Buttons */}
          {showAuth && (
            <>
              <Button
                variant="ghost"
                onClick={() => onSignIn ? onSignIn() : goTo("/login")}
                data-testid="button-sign-in"
              >
                Sign In
              </Button>
              <Button
                onClick={() => onSignUp ? onSignUp() : goTo("/login?mode=signup")}
                data-testid="button-sign-up"
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
