import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Zap, TrendingUp, BarChart3, Mail, Calendar } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface User {
  id: number;
  username: string;
  displayName: string;
  email: string;
  subscriptionStatus: "free" | "paid";
  createdAt: string;
  isAdmin: boolean;
}

interface Stats {
  totalUsers: number;
  totalProUsers: number;
  totalTransactions: number;
  totalExpenses: number;
  totalIncome: number;
}

export default function Admin() {
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/admin/stats"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  if (usersLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-display font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage users and view platform analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-border bg-card hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats?.totalUsers || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Active accounts</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pro Users</CardTitle>
              <Zap className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats?.totalProUsers || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Paid subscriptions</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
              <BarChart3 className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats?.totalTransactions || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Platform-wide</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">₹{Number(stats?.totalIncome || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Tracked income</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              <TrendingUp className="h-5 w-5 text-red-500 transform -rotate-180" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">₹{Number(stats?.totalExpenses || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Tracked expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-xl">Registered Users</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">Overview of all platform users</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Email/Phone</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Plan</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users?.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {user.displayName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.displayName}</p>
                          {user.isAdmin && <Badge variant="outline" className="text-xs mt-1">Admin</Badge>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {user.username}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.subscriptionStatus === "paid" ? (
                          <>
                            <Zap className="h-4 w-4 text-amber-500" />
                            <span className="text-amber-600 font-medium">Pro</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">Free</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-700">
                        Active
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(user.createdAt), "MMM dd, yyyy")}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!users?.length && (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
