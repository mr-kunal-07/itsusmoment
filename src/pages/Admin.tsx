import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIsAdmin, useAdminUsers, useAdminManageUser, AdminUser } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Search, Users, TrendingUp, HardDrive, Crown,
  MoreHorizontal, RefreshCw, ShieldCheck, ShieldOff, Trash2,
  Sprout, HeartHandshake, Gem, UserCircle2, Heart, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";

function formatBytes(b: number) {
  if (b === 0) return "0 B";
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  if (b < 1073741824) return (b / 1048576).toFixed(1) + " MB";
  return (b / 1073741824).toFixed(2) + " GB";
}

const PLAN_CONFIG: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  single:   { label: "Single",   Icon: Sprout,         color: "text-muted-foreground" },
  dating:   { label: "Dating",   Icon: HeartHandshake, color: "text-primary" },
  soulmate: { label: "Soulmate", Icon: Gem,            color: "text-primary" },
};

function PlanBadge({ plan }: { plan: string }) {
  const cfg = PLAN_CONFIG[plan] ?? PLAN_CONFIG.single;
  return (
    <Badge
      variant={plan === "single" ? "secondary" : "outline"}
      className={cn("gap-1 text-xs font-medium", cfg.color, plan !== "single" && "border-primary/30")}
    >
      <cfg.Icon className="h-3 w-3" strokeWidth={1.75} />
      {cfg.label}
    </Badge>
  );
}

function StatCard({
  label, value, sub, Icon, highlight,
}: {
  label: string; value: string | number; sub?: string;
  Icon: React.ElementType; highlight?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-xl border p-5 flex items-start gap-4",
      highlight ? "border-primary/30 bg-primary/5" : "border-border bg-card"
    )}>
      <div className={cn(
        "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
        highlight ? "bg-primary/15" : "bg-muted"
      )}>
        <Icon className={cn("h-5 w-5", highlight ? "text-primary" : "text-muted-foreground")} strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-2xl font-bold font-heading text-foreground">{value}</p>
        <p className="text-xs font-medium text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: users = [], isLoading: usersLoading, refetch } = useAdminUsers();
  const manageUser = useAdminManageUser();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  if (adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <ShieldOff className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-bold font-heading text-foreground">Access denied</h1>
        <p className="text-sm text-muted-foreground">You don't have admin privileges.</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>Go back</Button>
      </div>
    );
  }

  // Stats
  const totalUsers    = users.length;
  const singleCount   = users.filter(u => u.plan === "single" || !u.plan).length;
  const datingCount   = users.filter(u => u.plan === "dating").length;
  const soulmateCount = users.filter(u => u.plan === "soulmate").length;
  const paidCount     = datingCount + soulmateCount;
  const totalStorage  = users.reduce((acc, u) => acc + u.storage_used, 0);
  const couplesCount  = users.filter(u => u.has_partner).length;

  // Filter
  const filtered = users.filter(u => {
    const matchSearch =
      !search ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === "all" || u.plan === planFilter;
    return matchSearch && matchPlan;
  });

  const handlePlanChange = async (userId: string, plan: string) => {
    try {
      await manageUser.mutateAsync({ target_user_id: userId, action: "update_plan", plan });
      toast({ title: `Plan updated to ${plan}` });
    } catch (e) {
      toast({ title: "Failed to update plan", variant: "destructive" });
    }
  };

  const handleToggleAdmin = async (u: AdminUser, makeAdmin: boolean) => {
    try {
      await manageUser.mutateAsync({ target_user_id: u.id, action: "toggle_admin", add: makeAdmin });
      toast({ title: makeAdmin ? `${u.display_name ?? u.email} is now admin` : "Admin role removed" });
    } catch (e) {
      toast({ title: "Failed to update role", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await manageUser.mutateAsync({ target_user_id: deleteTarget.id, action: "delete_user" });
      toast({ title: "User deleted" });
    } catch (e) {
      toast({ title: "Failed to delete user", variant: "destructive" });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 sm:px-8 h-14 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-primary/15 flex items-center justify-center">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-bold font-heading text-sm text-foreground">Admin Panel</span>
        </div>
        <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
          {user?.email}
        </Badge>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetch()} title="Refresh">
            <RefreshCw className={cn("h-3.5 w-3.5", usersLoading && "animate-spin")} />
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        <Tabs defaultValue="overview">
          <TabsList className="mb-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users ({totalUsers})</TabsTrigger>
          </TabsList>

          {/* ── Overview ── */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Total users"   value={totalUsers}  Icon={Users}       />
              <StatCard label="Paid users"    value={paidCount}   sub={`${Math.round(paidCount/totalUsers*100||0)}% conversion`} Icon={TrendingUp} highlight />
              <StatCard label="Total storage" value={formatBytes(totalStorage)} Icon={HardDrive} />
              <StatCard label="Coupled users" value={couplesCount} Icon={Heart} />
            </div>

            {/* Plan breakdown */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h3 className="text-sm font-semibold font-heading text-foreground">Plan breakdown</h3>
              <div className="space-y-3">
                {[
                  { plan: "single",   count: singleCount,   Icon: Sprout,         label: "Single — Free" },
                  { plan: "dating",   count: datingCount,   Icon: HeartHandshake, label: "Dating — ₹9/mo" },
                  { plan: "soulmate", count: soulmateCount, Icon: Gem,            label: "Soulmate — ₹99/mo" },
                ].map(({ plan, count, Icon, label }) => (
                  <div key={plan} className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
                    <span className="text-sm text-muted-foreground w-40 shrink-0">{label}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${totalUsers ? (count / totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-foreground w-8 text-right shrink-0">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent signups */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-sm font-semibold font-heading text-foreground">Recent signups</h3>
              </div>
              <div className="divide-y divide-border">
                {[...users]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 5)
                  .map(u => (
                    <div key={u.id} className="flex items-center gap-3 px-6 py-3">
                      <Avatar className="h-7 w-7 shrink-0">
                        {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                        <AvatarFallback className="text-[10px]">
                          {(u.display_name ?? u.email ?? "?").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{u.display_name ?? u.email}</p>
                        <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}</p>
                      </div>
                      <PlanBadge plan={u.plan} />
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>

          {/* ── Users table ── */}
          <TabsContent value="users" className="mt-6 space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email…"
                  className="pl-9 h-9 text-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted shrink-0">
                {["all", "single", "dating", "soulmate"].map(f => (
                  <button
                    key={f}
                    onClick={() => setPlanFilter(f)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors",
                      planFilter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f === "all" ? "All" : f}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-border bg-muted/30">
                {["User", "Plan", "Storage", "Uploads", "Joined", ""].map((h, i) => (
                  <p key={i} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</p>
                ))}
              </div>

              {usersLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
                  <UserCircle2 className="h-8 w-8" />
                  <p className="text-sm">No users found</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filtered.map(u => (
                    <div
                      key={u.id}
                      className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3.5 items-center hover:bg-muted/20 transition-colors"
                    >
                      {/* User */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-7 w-7 shrink-0">
                          {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                          <AvatarFallback className="text-[10px]">
                            {(u.display_name ?? u.email ?? "?").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {u.display_name ?? <span className="italic text-muted-foreground">No name</span>}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                        </div>
                        {u.has_partner && (
                          <Heart className="h-3 w-3 text-primary fill-primary shrink-0" />
                        )}
                      </div>

                      {/* Plan */}
                      <div><PlanBadge plan={u.plan} /></div>

                      {/* Storage */}
                      <p className="text-xs text-muted-foreground">{formatBytes(u.storage_used)}</p>

                      {/* Uploads */}
                      <div className="flex items-center gap-1">
                        <Upload className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{u.upload_count}</p>
                      </div>

                      {/* Joined */}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(u.created_at), "MMM d, yyyy")}
                      </p>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <p className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Change plan</p>
                          {["single", "dating", "soulmate"].map(p => {
                            const cfg = PLAN_CONFIG[p];
                            return (
                              <DropdownMenuItem
                                key={p}
                                onClick={() => handlePlanChange(u.id, p)}
                                className={cn("gap-2 text-xs capitalize", u.plan === p && "text-primary font-medium")}
                              >
                                <cfg.Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                                {cfg.label}
                                {u.plan === p && " (current)"}
                              </DropdownMenuItem>
                            );
                          })}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 text-xs"
                            onClick={() => handleToggleAdmin(u, true)}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" /> Make admin
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 text-xs text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(u)}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete user
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="px-5 py-3 border-t border-border bg-muted/10">
                <p className="text-[11px] text-muted-foreground">
                  Showing {filtered.length} of {totalUsers} users
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete confirm dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.display_name ?? deleteTarget?.email}</strong> and all their data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
