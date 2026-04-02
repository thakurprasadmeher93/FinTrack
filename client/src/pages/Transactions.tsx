import { useState, useEffect } from "react";
import { useTransactions, useProfiles, useCategories, useDeleteTransaction, useBillSplits, useDeleteBillSplit } from "@/hooks/use-fin-track";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@shared/routes";
import { format } from "date-fns";
import { Trash2, Search, Filter, Pencil, FileText, ArrowUpRight, ArrowDownLeft, User as UserIcon, Share2, Users } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTransactionSchema, insertDebtSchema } from "@shared/schema";
import { Form, FormControl,FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function Transactions() {
  const { user, isLoading: isAuthLoading, refetch: refetchAuth } = useAuth();
  const { data: profiles, isLoading: isProfilesLoading } = useProfiles();
  const [editingTx, setEditingTx] = useState<any>(null);
  const [editingDebt, setEditingDebt] = useState<any>(null);
  const [editingSplit, setEditingSplit] = useState<any>(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const activeProfileId = (user as any)?.activeProfileId as number | undefined;
  const activeProfile = profiles?.find((p: any) => p.id === activeProfileId) || profiles?.[0];
  const { data: categories } = useCategories(activeProfile?.id);
  const { toast } = useToast();
  
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: transactions, isLoading: isTxDataLoading } = useTransactions(activeProfile?.id, {
    month: filterMonth,
    year: new Date().getFullYear(),
    categoryId: filterCategory !== "all" ? Number(filterCategory) : undefined
  });

  const { data: debts, isLoading: isDebtsLoading } = useQuery({
    queryKey: ['/api/profiles', activeProfile?.id, 'debts', filterMonth, new Date().getFullYear()],
    queryFn: async () => {
      if (!activeProfile?.id) return [];
      const res = await fetch(`/api/profiles/${activeProfile.id}/debts?month=${filterMonth}&year=${new Date().getFullYear()}`);
      if (!res.ok) throw new Error("Failed to fetch debts");
      return res.json();
    },
    enabled: !!activeProfile?.id
  });

  const { data: billSplits, isLoading: isBillSplitsLoading } = useQuery({
    queryKey: ['/api/profiles', activeProfile?.id, 'bill-splits', filterMonth, new Date().getFullYear()],
    enabled: !!activeProfile?.id,
    queryFn: async () => {
      if (!activeProfile?.id) return [];
      const res = await fetch(`/api/profiles/${activeProfile.id}/bill-splits?month=${filterMonth}&year=${new Date().getFullYear()}`);
      if (!res.ok) throw new Error("Failed to fetch bill splits");
      return res.json();
    }
  });

  const { mutate: deleteTx } = useDeleteTransaction();
  const { mutate: deleteSplit } = useDeleteBillSplit(activeProfileId);

  const deleteDebtMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/debts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', activeProfile?.id, 'debts'] });
      toast({ title: "Success", description: "Debt record deleted" });
    }
  });

  const isLoading = isAuthLoading || isProfilesLoading || isTxDataLoading || isDebtsLoading;

  const filteredTransactions = transactions?.filter(tx => 
    search ? (tx.note?.toLowerCase().includes(search.toLowerCase()) || tx.category?.name.toLowerCase().includes(search.toLowerCase())) : true
  );

  const nonSplitDebts = debts?.filter((d: any) => !d.note?.startsWith('Split:')) || [];

  const filteredDebts = nonSplitDebts?.filter((d: any) => 
    search ? (d.contactName.toLowerCase().includes(search.toLowerCase()) || d.note?.toLowerCase().includes(search.toLowerCase())) : true
  );

  const groupedDebts = nonSplitDebts?.reduce((acc: any, d: any) => {
    // Group by phone number if available, otherwise fallback to name
    const key = d.contactPhone || d.contactName;
    if (!acc[key]) {
      acc[key] = { name: d.contactName, phone: d.contactPhone, net: 0, items: [] };
    }
    const amt = Number(d.amount);
    acc[key].net += (d.type === 'gave' ? amt : -amt);
    acc[key].items.push(d);
    // Keep the most recent name if it changed
    acc[key].name = d.contactName;
    return acc;
  }, {});

  const contactList = Object.values(groupedDebts || {}).sort((a: any, b: any) => Math.abs(b.net) - Math.abs(a.net));

  const deleteDebtItem = (debtId: number) => {
    deleteDebtMutation.mutate(debtId);
  };

  return (
    <div className="pb-24 md:pb-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">Transactions</h2>
          <p className="text-muted-foreground mt-1">Review and manage your financial records.</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={filterMonth.toString()} onValueChange={(v) => setFilterMonth(Number(v))}>
            <SelectTrigger className="w-[140px] rounded-xl bg-card">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({length: 12}).map((_, i) => (
                <SelectItem key={i+1} value={(i+1).toString()}>
                  {format(new Date(2024, i, 1), 'MMMM')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
           <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px] rounded-xl bg-card">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {<SelectItem value="all">All Categories</SelectItem>}
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="bg-card border border-border rounded-2xl shadow-sm p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search transactions or contacts..." 
            className="pl-9 bg-muted/30 border-0 h-10 rounded-xl focus-visible:ring-1" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Tabs defaultValue="ledger" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-xl h-12 p-1 bg-muted/50">
            <TabsTrigger value="ledger" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Ledger</TabsTrigger>
            <TabsTrigger value="udhari" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Udhari Khata</TabsTrigger>
            <TabsTrigger value="splitbill" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Split Bill</TabsTrigger>
          </TabsList>

          <TabsContent value="ledger" className="mt-4">
            {isLoading ? (
              <div className="space-y-4 pt-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
              </div>
            ) : filteredTransactions?.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                 No transactions found matching your filters.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTransactions?.map((tx) => (
                  <div key={tx.id} className="group flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm",
                        tx.category?.color ? `text-white` : "bg-gray-100 text-gray-600"
                      )} style={{ backgroundColor: tx.category?.color || undefined }}>
                        {tx.category?.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-foreground truncate">{tx.category?.name || "Uncategorized"}</p>
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                            {format(new Date(tx.date), "MMM d, yyyy")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{tx.note || "No details"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "font-bold tabular-nums",
                        tx.type === 'income' ? "text-emerald-600" : "text-foreground"
                      )}>
                        {tx.type === 'income' ? "+" : "-"} ₹ {Math.abs(Number(tx.amount)).toLocaleString('en-IN')}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setEditingTx(tx)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently remove this record from your account.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteTx(tx.id)} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="udhari" className="mt-4">
            {isLoading ? (
              <div className="space-y-4 pt-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
              </div>
            ) : contactList.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                 No debt records found. Use the "+" button to add your first Udhari entry.
              </div>
            ) : (
              <div className="space-y-4">
                {contactList.map((contact: any) => (
                  <Card key={contact.name} className="rounded-xl border border-border shadow-none overflow-hidden">
                    <CardHeader className="bg-muted/30 p-4 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {contact.name.charAt(0)}
                          </div>
                          <div>
                            <CardTitle className="text-base font-bold">{contact.name}</CardTitle>
                            <CardDescription className="text-xs">{contact.phone || "No phone"}</CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "text-lg font-bold",
                            contact.net > 0 ? "text-emerald-600" : contact.net < 0 ? "text-red-600" : "text-muted-foreground"
                          )}>
                            {contact.net > 0 ? "Get: " : contact.net < 0 ? "Give: " : ""}₹ {Math.abs(contact.net).toLocaleString('en-IN')}
                          </p>
                          <p className="text-[10px] uppercase font-bold tracking-tighter text-muted-foreground">Net Balance</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border">
                        {contact.items.map((debt: any) => (
                          <div key={debt.id} className="p-3 flex items-center justify-between text-sm group hover:bg-muted/20">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "h-2 w-2 rounded-full",
                                debt.type === 'gave' ? "bg-emerald-500" : "bg-red-500"
                              )} />
                              <div>
                                <p className="font-medium">{debt.type === 'gave' ? "You Gave" : "You Got"}</p>
                                <p className="text-[10px] text-muted-foreground">{format(new Date(debt.date), "MMM d, yyyy")}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="font-bold tabular-nums block">₹ {Number(debt.amount).toLocaleString('en-IN')}</span>
                                {debt.note && <p className="text-[10px] text-muted-foreground italic truncate max-w-[100px]">{debt.note}</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100"
                                  onClick={() => setEditingDebt(debt)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-emerald-600 opacity-0 group-hover:opacity-100"
                                  onClick={() => {
                                    const message = `FinTrack: ${debt.type === 'gave' ? 'You received' : 'You gave'} Rs. ${debt.amount} ${debt.type === 'gave' ? 'from' : 'to'} me. Balance updated. Note: ${debt.note || 'N/A'}`;
                                    const url = `https://wa.me/${debt.contactPhone ? (debt.contactPhone.startsWith('+') ? debt.contactPhone : '91' + debt.contactPhone) : ''}?text=${encodeURIComponent(message)}`;
                                    window.open(url, '_blank');
                                  }}
                                >
                                  <SiWhatsapp className="h-3.5 w-3.5" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="rounded-2xl">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Record?</AlertDialogTitle>
                                      <AlertDialogDescription>Delete this entry for {contact.name}?</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteDebtMutation.mutate(debt.id)} className="rounded-xl bg-destructive">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="splitbill" className="mt-4">
            {isLoading || isBillSplitsLoading ? (
              <div className="space-y-4 pt-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
              </div>
            ) : billSplits?.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                 No split bills found. Use the "Split Bill" button above to create one.
              </div>
            ) : (
              <div className="space-y-4">
                {billSplits?.map((split: any) => (
                  <Card key={split.id} className="rounded-xl border border-border shadow-none overflow-hidden">
                    <CardHeader className="bg-muted/30 p-4 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-blue-600">
                            $
                          </div>
                          <div>
                            <CardTitle className="text-base font-bold">{split.description}</CardTitle>
                            <CardDescription className="text-xs">{format(new Date(split.date), "MMM d, yyyy")}</CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">₹ {Number(split.totalAmount).toLocaleString('en-IN')}</p>
                          <p className="text-[10px] uppercase font-bold tracking-tighter text-muted-foreground">{split.participants?.length || 0} Participant(s)</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border">
                        {split.participants?.map((p: any, idx: number) => (
                          <div key={idx} className="p-3 flex items-center justify-between text-sm group hover:bg-muted/20">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                              <div>
                                <p className="font-medium">{p.contactName}</p>
                                <p className="text-[10px] text-muted-foreground">{p.contactPhone || "No phone"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-bold tabular-nums">₹ {Number(p.amount).toLocaleString('en-IN')}</span>
                              <div className="flex items-center gap-1">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-7 w-7 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => setEditingSplit(split)}
                                  data-testid={`button-edit-split-${split.id}`}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    const message = `FinTrack: Split bill "${split.description}" - I owe you ₹${p.amount}. Total amount: ₹${split.totalAmount}`;
                                    const url = `https://wa.me/${p.contactPhone ? (p.contactPhone.startsWith('+') ? p.contactPhone : '91' + p.contactPhone) : ''}?text=${encodeURIComponent(message)}`;
                                    window.open(url, '_blank');
                                  }}
                                  data-testid={`button-whatsapp-split-${split.id}`}
                                >
                                  <SiWhatsapp className="h-3.5 w-3.5" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`button-delete-split-${split.id}`}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="rounded-2xl">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Split Bill?</AlertDialogTitle>
                                      <AlertDialogDescription>This will remove this split bill record permanently.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteSplit(split.id)} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!editingTx} onOpenChange={(open) => !open && setEditingTx(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editingTx && (
            <TransactionEditForm 
              transaction={editingTx} 
              categories={categories || []} 
              onSuccess={() => setEditingTx(null)} 
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingDebt} onOpenChange={(open) => !open && setEditingDebt(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Udhari Entry</DialogTitle>
          </DialogHeader>
          {editingDebt && (
            <DebtEditForm 
              debt={editingDebt} 
              onSuccess={() => setEditingDebt(null)} 
              profileId={activeProfile?.id}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingSplit} onOpenChange={(open) => !open && setEditingSplit(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Split Bill Details</DialogTitle>
            <DialogDescription>{editingSplit?.description}</DialogDescription>
          </DialogHeader>
          {editingSplit && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">₹ {Number(editingSplit.totalAmount).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Participants ({editingSplit.participants?.length})</p>
                <div className="space-y-2">
                  {editingSplit.participants?.map((p: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                      <div>
                        <p className="text-sm font-medium">{p.contactName}</p>
                        <p className="text-xs text-muted-foreground">{p.contactPhone || "No phone"}</p>
                      </div>
                      <p className="font-bold">₹ {Number(p.amount).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={() => setEditingSplit(null)} className="w-full">Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SplitBillModal 
        open={isSplitModalOpen} 
        onOpenChange={setIsSplitModalOpen}
        profileId={activeProfile?.id}
      />
    </div>
  );
}

function TransactionEditForm({ transaction, categories, onSuccess }: { transaction: any, categories: any[], onSuccess: () => void }) {
  const { toast } = useToast();
  const txDate = new Date(transaction.date);
  const form = useForm({
    defaultValues: {
      amount: transaction.amount.toString(),
      type: transaction.type,
      categoryId: transaction.categoryId.toString(),
      note: transaction.note || "",
      date: format(txDate, "yyyy-MM-dd"),
      time: format(txDate, "HH:mm")
    }
  });

  const filteredCategories = categories?.filter(c => c.type === transaction.type) || [];

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const [year, month, day] = values.date.split("-").map(Number);
      const [hours, minutes] = values.time.split(":").map(Number);
      const transactionDate = new Date(year, month - 1, day, hours, minutes);
      
      const payload = { 
        ...values, 
        amount: values.amount.toString(),
        categoryId: Number(values.categoryId),
        date: transactionDate
      };
      await apiRequest("PATCH", `/api/transactions/${transaction.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path], exact: false });
      queryClient.invalidateQueries({ queryKey: [api.analytics.summary.path], exact: false });
      queryClient.invalidateQueries({ queryKey: [api.analytics.byCategory.path], exact: false });
      queryClient.invalidateQueries({ queryKey: [api.analytics.trend.path], exact: false });
      toast({ title: "Success", description: "Transaction updated" });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update transaction", variant: "destructive" });
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10 rounded-lg">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}

function DebtEditForm({ debt, onSuccess, profileId }: { debt: any, onSuccess: () => void, profileId?: number }) {
  const { toast } = useToast();
  const form = useForm({
    defaultValues: {
      amount: debt.amount.toString(),
      type: debt.type,
      contactName: debt.contactName,
      note: debt.note || "",
      date: new Date(debt.date)
    }
  });

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = { ...values, amount: values.amount.toString() };
      await apiRequest("PATCH", `/api/debts/${debt.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', profileId, 'debts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/debts'] });
      toast({ title: "Success", description: "Debt record updated" });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update debt record", variant: "destructive" });
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}

function SplitBillModal({ open, onOpenChange, profileId }: { open: boolean, onOpenChange: (open: boolean) => void, profileId?: number }) {
  const { toast } = useToast();
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [splitType, setSplitType] = useState<"equal" | "manual">("equal");
  const [participants, setParticipants] = useState<{ name: string, phone: string, amount: string }[]>([
    { name: "", phone: "", amount: "" }
  ]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", `/api/profiles/${profileId}/bill-splits`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', profileId, 'bill-splits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', profileId, 'debts'] });
      toast({ title: "Success", description: "Bill split and debts created" });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create split", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setDescription("");
    setTotalAmount("");
    setParticipants([{ name: "", phone: "", amount: "" }]);
  };

  const addParticipant = () => {
    setParticipants([...participants, { name: "", phone: "", amount: "" }]);
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const updateParticipant = (index: number, field: string, value: string) => {
    const newParticipants = [...participants];
    (newParticipants[index] as any)[field] = value;
    setParticipants(newParticipants);
  };

  const calculateSplits = () => {
    const amount = parseFloat(totalAmount) || 0;
    const count = participants.length + 1; // Include self
    if (splitType === 'equal') {
      const share = (amount / count).toFixed(2);
      return participants.map(p => ({ ...p, amount: share }));
    }
    return participants;
  };

  const handleSubmit = () => {
    if (!description || !totalAmount) return;
    const finalParticipants = calculateSplits();
    mutation.mutate({
      split: {
        description,
        amount: parseFloat(totalAmount),
        date: new Date()
      },
      participants: finalParticipants.map(p => ({
        contactName: p.name,
        contactPhone: p.phone,
        amount: parseFloat(p.amount) || 0
      }))
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Split a Bill</DialogTitle>
          <DialogDescription>Divide expenses with friends easily.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold ml-1">What is this for?</label>
            <Input 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="e.g. Dinner, Movie, Rent" 
              className="rounded-xl bg-muted/30 border-0 h-11"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Total Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                <Input 
                  type="number" 
                  value={totalAmount} 
                  onChange={(e) => setTotalAmount(e.target.value)} 
                  placeholder="0.00" 
                  className="pl-7 rounded-xl bg-muted/30 border-0 h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">Split Method</label>
              <Select value={splitType} onValueChange={(v: any) => setSplitType(v)}>
                <SelectTrigger className="rounded-xl bg-muted/30 border-0 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="equal">Split Equally</SelectItem>
                  <SelectItem value="manual">Manual Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-sm font-semibold text-primary">Friends (Excluding you)</label>
              <Button variant="ghost" size="sm" onClick={addParticipant} className="h-8 text-xs font-bold bg-primary/5 hover:bg-primary/10 text-primary rounded-full px-3">
                + Add Person
              </Button>
            </div>
            <div className="space-y-3">
              {participants.map((p, i) => (
                <div key={i} className="flex gap-3 items-start bg-muted/20 p-3 rounded-2xl relative group">
                  <div className="flex-1 space-y-2">
                    <Input 
                      value={p.name} 
                      onChange={(e) => updateParticipant(i, 'name', e.target.value)} 
                      placeholder="Name" 
                      className="h-9 text-xs rounded-lg border-muted-foreground/20"
                    />
                    <Input 
                      value={p.phone} 
                      onChange={(e) => updateParticipant(i, 'phone', e.target.value)} 
                      placeholder="Phone (Optional)" 
                      className="h-9 text-xs rounded-lg border-muted-foreground/20"
                    />
                  </div>
                  {splitType === 'manual' && (
                    <div className="w-24 space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground ml-1">Their Share</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">₹</span>
                        <Input 
                          type="number" 
                          value={p.amount} 
                          onChange={(e) => updateParticipant(i, 'amount', e.target.value)} 
                          placeholder="0" 
                          className="h-9 pl-5 text-xs rounded-lg border-muted-foreground/20"
                        />
                      </div>
                    </div>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeParticipant(i)} 
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full shrink-0 mt-0.5"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button onClick={handleSubmit} className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating Records..." : "Confirm & Split Bill"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
