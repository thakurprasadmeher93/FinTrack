import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WalletMinimal, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";

export default function Login() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const initialMode = (): "login" | "register" => {
    const params = new URLSearchParams(window.location.search);
    return params.get("mode") === "signup" ? "register" : "login";
  };

  const [mode, setMode] = useState<"login" | "register" | "forgot" | "reset">(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    displayName: "",
    email: "",
    token: ""
  });

  // Don't auto-redirect authenticated users from login page
  // They may be here intentionally to manage their account

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (mode === "login") {
        await apiRequest("POST", "/api/login-custom", { username: formData.username, password: formData.password });
        toast({ title: "Success", description: "Logged in successfully" });
        window.location.href = "/dashboard-full";
        return;
      } else if (mode === "register") {
        await apiRequest("POST", "/api/register-custom", formData);
        toast({ title: "Success", description: "Account created! Welcome to FinTrack." });
        window.location.href = "/dashboard-full";
        return;
      } else if (mode === "forgot") {
        const res = await apiRequest("POST", "/api/forgot-password", { email: formData.username });
        const data = await res.json();
        toast({ title: "Success", description: data.message });
        if (data.token) {
          setFormData({ ...formData, token: data.token });
          setMode("reset");
        }
      } else if (mode === "reset") {
        await apiRequest("POST", "/api/reset-password", { token: formData.token, password: formData.password });
        toast({ title: "Success", description: "Password reset successful" });
        setMode("login");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <AppHeader showAuth={false} />
      <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
            <WalletMinimal className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-display font-bold">FinTrack</h1>
          <p className="text-muted-foreground mt-2">Track every rupee under your control</p>
        </div>

        <Card className="border-border shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">
              {mode === "login" && "Welcome Back"}
              {mode === "register" && "Create Account"}
              {mode === "forgot" && "Reset Password"}
              {mode === "reset" && "Enter New Password"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode !== "reset" && (
                <div className="space-y-2">
                  <Label htmlFor="username">{mode === "forgot" ? "Email Address" : "Email or Phone"}</Label>
                  <Input 
                    id="username" 
                    required 
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
              )}
              
              {mode === "register" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Name</Label>
                    <Input 
                      id="displayName" 
                      required 
                      value={formData.displayName}
                      onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </>
              )}

              {(mode === "login" || mode === "register" || mode === "reset") && (
                <div className="space-y-2">
                  <Label htmlFor="password">{mode === "reset" ? "New Password" : "Password"}</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              )}

              {mode === "reset" && (
                <div className="space-y-2">
                  <Label htmlFor="token">Reset Token (from email)</Label>
                  <Input 
                    id="token" 
                    required 
                    value={formData.token}
                    onChange={(e) => setFormData({...formData, token: e.target.value})}
                  />
                </div>
              )}

              <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  mode === "login" ? "Login" : 
                  mode === "register" ? "Register" : 
                  mode === "forgot" ? "Send Reset Link" : "Reset Password"
                )}
              </Button>
            </form>

            <div className="mt-6 flex flex-col gap-2 items-center text-sm">
              {mode === "login" && (
                <>
                  <div className="flex gap-1">
                    <span className="text-muted-foreground">Don't have an account?</span>
                    <Button variant="link" className="p-0 h-auto" onClick={() => setMode("register")}>Register here</Button>
                  </div>
                  <Button variant="link" className="p-0 h-auto" onClick={() => setMode("forgot")}>Forgot Password?</Button>
                </>
              )}
              {mode === "register" && (
                <div className="flex gap-1">
                  <span className="text-muted-foreground">Already have an account?</span>
                  <Button variant="link" className="p-0 h-auto" onClick={() => setMode("login")}>Login here</Button>
                </div>
              )}
              {(mode === "forgot" || mode === "reset") && (
                <Button variant="link" className="p-0 h-auto" onClick={() => setMode("login")}>Back to Login</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
      
      <AppFooter />
    </div>
  );
}
