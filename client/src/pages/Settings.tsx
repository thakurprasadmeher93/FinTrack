import { useAuth } from "@/hooks/use-auth";
import { useProfiles, useCategories, useCreateCategory, useSetBudget, useBudget, useCreateProfile, useSwitchProfile } from "@/hooks/use-fin-track";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, User, CreditCard, Tag, Check, Zap, Globe, Shield, PieChart, ArrowRight, Trash2, Building2, Users, Pencil, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export default function Settings() {
  const { user } = useAuth();
  const { data: profiles } = useProfiles();
  const { mutate: switchProfile } = useSwitchProfile();
  const [activeProfileId, setActiveProfileId] = useState<number | undefined>(undefined);
  
  useEffect(() => {
    if (user?.activeProfileId) {
      setActiveProfileId(user.activeProfileId);
    } else if (profiles?.length && activeProfileId === undefined) {
      setActiveProfileId(profiles[0].id);
    }
  }, [user?.activeProfileId, profiles, activeProfileId]);

  const activeProfile = profiles?.find(p => p.id === activeProfileId) || profiles?.[0];
  
  const { data: categories } = useCategories(activeProfile?.id);
  const { mutate: createCategory } = useCreateCategory();
  const { mutate: setBudget } = useSetBudget();
  const { mutate: createProfile } = useCreateProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [newCatName, setNewCatName] = useState("");
  const isPro = (user as any)?.subscriptionStatus === 'paid';
  const { data: currentBudget } = useBudget(activeProfile?.id, currentMonth, currentYear);
  const { data: rules } = useQuery({
    queryKey: [`/api/profiles/${activeProfile?.id}/rules`],
    enabled: !!activeProfile && isPro,
    queryFn: async () => {
      const res = await fetch(`/api/profiles/${activeProfile!.id}/rules`);
      return res.json();
    }
  });
  const [newCatType, setNewCatType] = useState<"income" | "expense">("expense");
  const [newCatColor, setNewCatColor] = useState("#6366f1");
  const [budgetAmount, setBudgetAmount] = useState("");

  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileType, setNewProfileType] = useState<"personal" | "family" | "business">("personal");

  const [editProfileName, setEditProfileName] = useState("");
  const [editProfileType, setEditProfileType] = useState<"personal" | "family" | "business">("personal");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPro && profiles && profiles.length >= 1) {
      toast({
        title: "Pro Feature",
        description: "Upgrade to Pro to create multiple profiles.",
        variant: "destructive"
      });
      return;
    }
    createProfile({
      name: newProfileName,
      type: newProfileType,
      currency: "INR"
    } as any, {
      onSuccess: () => {
        setNewProfileName("");
        toast({ title: "Profile Created", description: "Your new financial workspace is ready." });
      }
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile) return;
    try {
      await apiRequest("PATCH", `/api/profiles/${activeProfile.id}`, {
        name: editProfileName,
        type: editProfileType
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      setIsEditDialogOpen(false);
      toast({ title: "Profile Updated" });
    } catch (err) {
      toast({ title: "Update Failed", variant: "destructive" });
    }
  };

  const handleDeleteProfile = async () => {
    if (!activeProfile) return;
    try {
      await apiRequest("DELETE", `/api/profiles/${activeProfile.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      toast({ title: "Profile Deleted" });
      setActiveProfileId(undefined);
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/user/upgrade", { method: "POST" });
      if (!res.ok) throw new Error("Upgrade failed");
      
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Welcome to Pro!",
        description: "You've been upgraded. Enjoy unlimited profiles and premium insights.",
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to upgrade. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile) return;
    createCategory({
      profileId: activeProfile.id,
      name: newCatName,
      type: newCatType,
      color: newCatColor,
      isDefault: false
    });
    setNewCatName("");
  };

  const handleSetBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile) return;
    setBudget({
      profileId: activeProfile.id,
      month: currentMonth,
      year: currentYear,
      amount: budgetAmount
    });
  };

  return (
    <div className="pb-24 md:pb-8 space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground mt-1">Configure your financial workspace.</p>
      </header>

      <Tabs defaultValue="profiles" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 h-12 rounded-xl w-full md:w-auto flex overflow-x-auto">
          <TabsTrigger value="profiles" className="rounded-lg px-4 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">Profiles</TabsTrigger>
          <TabsTrigger value="categories" className="rounded-lg px-4 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">Categories</TabsTrigger>
          <TabsTrigger value="budgets" className="rounded-lg px-4 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">Budgets</TabsTrigger>
          <TabsTrigger value="rules" className="rounded-lg px-4 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">Smart Rules</TabsTrigger>
          <TabsTrigger value="subscription" className="rounded-lg px-4 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-6">
           <div className="grid md:grid-cols-2 gap-8">
            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-display">Your Profiles</CardTitle>
                    <CardDescription>Select a profile to configure it.</CardDescription>
                  </div>
                  {activeProfile && (
                    <div className="flex gap-2">
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => {
                            setEditProfileName(activeProfile.name);
                            setEditProfileType(activeProfile.type as any);
                          }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Profile</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label>Profile Name</Label>
                              <Input value={editProfileName} onChange={e => setEditProfileName(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                              <Label>Profile Type</Label>
                              <Select value={editProfileType} onValueChange={(v: any) => setEditProfileType(v)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="personal">Personal</SelectItem>
                                  <SelectItem value="family">Family</SelectItem>
                                  <SelectItem value="business">Business</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <DialogFooter>
                              <Button type="submit">Update Profile</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action will permanently delete the profile "{activeProfile.name}" and all its transactions, categories, and budgets. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteProfile} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
                              Delete Profile
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {profiles?.map(profile => (
                  <div key={profile.id} className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                    activeProfile?.id === profile.id ? "border-primary bg-primary/5 shadow-sm" : "border-transparent bg-muted/30 hover:border-border"
                  )} onClick={() => {
                    setActiveProfileId(profile.id);
                    switchProfile(profile.id);
                  }}>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center border border-border">
                        {profile.type === 'personal' && <User className="h-5 w-5 text-blue-500" />}
                        {profile.type === 'family' && <Users className="h-5 w-5 text-emerald-500" />}
                        {profile.type === 'business' && <Building2 className="h-5 w-5 text-purple-500" />}
                      </div>
                      <div>
                        <p className="font-medium">{profile.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{profile.type} Profile</p>
                      </div>
                    </div>
                    {activeProfile?.id === profile.id && <Check className="h-5 w-5 text-primary" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border shadow-sm h-fit">
              <CardHeader>
                <CardTitle className="font-display">Create New Profile</CardTitle>
                <CardDescription>Separate your personal, family, or business finances.</CardDescription>
              </CardHeader>
              <CardContent>
                {!isPro && profiles && profiles.length >= 1 ? (
                  <div className="p-6 text-center border-2 border-dashed rounded-2xl bg-muted/30">
                    <Zap className="h-10 w-10 text-primary mx-auto mb-4" />
                    <p className="font-medium">Multi-Profile is a Pro Feature</p>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">Upgrade to create Business or Family profiles.</p>
                    <Button onClick={handleUpgrade} size="sm" className="w-full">Upgrade to Pro</Button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Profile Name</Label>
                      <Input placeholder="e.g. My Startup" value={newProfileName} onChange={e => setNewProfileName(e.target.value)} className="rounded-xl" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Profile Type</Label>
                      <Select value={newProfileType} onValueChange={(v: any) => setNewProfileType(v)}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="family">Family</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full rounded-xl" disabled={!newProfileName}>Create Profile</Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="rounded-2xl border-border shadow-sm">
              <CardHeader>
                <CardTitle className="font-display">Categories for {activeProfile?.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {categories?.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-transparent hover:border-border transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color || '#ccc' }} />
                      <span className="font-medium">{cat.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground uppercase px-2 py-1 bg-muted rounded-md">{cat.type}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border shadow-sm h-fit">
              <CardHeader>
                <CardTitle className="font-display">Add Category</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input placeholder="e.g. Groceries" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="rounded-xl" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={newCatType} onValueChange={(v: any) => setNewCatType(v)}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Color Tag</Label>
                    <div className="flex gap-2 flex-wrap">
                      {['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'].map(color => (
                        <button
                          key={color}
                          type="button"
                          className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${newCatColor === color ? 'border-foreground' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewCatColor(color)}
                        />
                      ))}
                    </div>
                  </div>
                  <Button type="submit" className="w-full rounded-xl" disabled={!newCatName}>Add Category</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budgets" className="max-w-xl">
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader>
              <CardTitle className="font-display">Monthly Budget for {activeProfile?.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted/30 rounded-xl">
                <p className="text-sm text-muted-foreground mb-1">Current Limit ({format(new Date(), 'MMMM')})</p>
                <p className="text-3xl font-bold font-display text-foreground">
                  ₹ {currentBudget ? Number(currentBudget.amount).toLocaleString('en-IN') : 'Not Set'}
                </p>
              </div>

              <form onSubmit={handleSetBudget} className="space-y-4">
                <div className="space-y-2">
                  <Label>Update Budget Limit</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      className="pl-8 rounded-xl"
                      value={budgetAmount}
                      onChange={e => setBudgetAmount(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="rounded-xl">Save Budget</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rules" className="space-y-6">
          <Card className="rounded-2xl border-border shadow-sm max-w-2xl">
            <CardHeader>
              <CardTitle className="font-display">Smart Category Rules for {activeProfile?.name}</CardTitle>
              <CardDescription>Automatically assign categories based on transaction notes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isPro ? (
                <div className="p-8 text-center border-2 border-dashed rounded-2xl bg-muted/30">
                  <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <p className="font-medium">Smart Assignment is a Pro Feature</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">Upgrade to unlock automatic category detection.</p>
                  <Button onClick={handleUpgrade} size="sm">Upgrade to Pro</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const keyword = formData.get('keyword') as string;
                    const catId = formData.get('categoryId') as string;
                    const target = e.currentTarget;
                    if (!keyword || !catId || !activeProfile) return;
                    
                    fetch(`/api/profiles/${activeProfile.id}/rules`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ keyword, categoryId: parseInt(catId) })
                    }).then(() => {
                      toast({ title: "Rule Created", description: `"${keyword}" will now be auto-assigned.` });
                      queryClient.invalidateQueries({ queryKey: [`/api/profiles/${activeProfile.id}/rules`] });
                      target.reset();
                    });
                  }} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-muted/30 p-4 rounded-xl">
                    <div className="space-y-2">
                      <Label>If note contains</Label>
                      <Input name="keyword" placeholder="e.g. Uber" className="rounded-xl" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Assign to</Label>
                      <Select name="categoryId" required>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="rounded-xl">Add Rule</Button>
                  </form>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Active Rules</h4>
                      <Badge variant="outline" className="text-[10px]">{Array.isArray(rules) ? rules.length : 0} Rules</Badge>
                    </div>
                    <div className="space-y-2">
                      {Array.isArray(rules) && rules.map((rule: any) => (
                        <div key={rule.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                          <div className="flex items-center gap-3 text-sm">
                            <span className="font-medium">"{rule.keyword}"</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <Badge variant="secondary" className="rounded-md">{rule.category?.name}</Badge>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              fetch(`/api/rules/${rule.id}`, { method: 'DELETE' })
                                .then(() => {
                                  toast({ title: "Rule Deleted" });
                                  if (activeProfile) {
                                    queryClient.invalidateQueries({ queryKey: [`/api/profiles/${activeProfile.id}/rules`] });
                                  }
                                });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {(!Array.isArray(rules) || rules.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">No rules created yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="subscription" className="space-y-6">
           <Card className="rounded-2xl border-border shadow-sm max-w-xl">
             <CardHeader>
               <CardTitle className="font-display">Account Info</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                 <div className="flex items-center gap-4 p-4 rounded-xl border border-border">
                 <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                   {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                 </div>
                 <div>
                   <p className="font-medium">{user?.displayName}</p>
                   <p className="text-sm text-muted-foreground">{user?.email}</p>
                 </div>
               </div>
               
               {!isPro && (
                 <Button 
                   onClick={(e) => {
                     e.preventDefault();
                     handleUpgrade();
                   }}
                   className="w-full bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20 rounded-xl"
                 >
                   Upgrade to Pro
                 </Button>
               )}
             </CardContent>
           </Card>

           <div className="grid md:grid-cols-2 gap-6">
             <Card className={cn("rounded-2xl border-border shadow-sm overflow-hidden", !isPro && "opacity-60 grayscale")}>
               <CardHeader className="bg-primary/5 pb-4">
                 <div className="flex items-center justify-between">
                   <CardTitle className="font-display flex items-center gap-2">
                     <Zap className="h-5 w-5 text-primary" />
                     Pro Features
                   </CardTitle>
                   {isPro && <Check className="h-5 w-5 text-green-500" />}
                 </div>
                 <CardDescription>Advanced tools for financial mastery</CardDescription>
               </CardHeader>
               <CardContent className="pt-6 space-y-4">
                 {[
                   { icon: Globe, label: "Unlimited Profiles", desc: "Manage Business & Family separately" },
                   { icon: PieChart, label: "Advanced Analytics", desc: "Predictive spending & trend mapping" },
                   { icon: Shield, label: "Priority Support", desc: "24/7 dedicated help desk" },
                 ].map((feat, i) => (
                   <div key={i} className="flex gap-3">
                     <div className="mt-1 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                       <feat.icon className="h-4 w-4 text-primary" />
                     </div>
                     <div>
                       <p className="font-medium text-sm">{feat.label}</p>
                       <p className="text-xs text-muted-foreground">{feat.desc}</p>
                     </div>
                   </div>
                 ))}
               </CardContent>
             </Card>

             {!isPro && (
               <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-lg shadow-primary/5 flex flex-col justify-center p-8 text-center space-y-4">
                 <h4 className="text-xl font-bold font-display">Take Control of Your Wealth</h4>
                 <p className="text-sm text-muted-foreground">Unlock professional-grade tracking for only ₹499/month</p>
                 <Button 
                   onClick={(e) => {
                     e.preventDefault();
                     handleUpgrade();
                   }}
                   className="rounded-xl h-12 text-lg shadow-xl shadow-primary/20"
                 >
                   Get Pro Now
                 </Button>
               </Card>
             )}
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
