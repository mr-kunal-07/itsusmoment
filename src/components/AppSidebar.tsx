import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderIcon, FolderPlus, ChevronRight, Pencil, Trash2, Home, Star, Hash, Heart, CalendarHeart, Play, Trophy, Link2, MessageCircleHeart, Crown, ShieldCheck, Settings, Activity } from "lucide-react";
import { usePlan, getStorageLimit, formatStorageLimit } from "@/hooks/useSubscription";
import { useIsAdmin } from "@/hooks/useAdmin";
import { DaysTogether } from "@/components/DaysTogether";
import { useFolders, useCreateFolder, useRenameFolder, useDeleteFolder, Folder } from "@/hooks/useFolders";
import { useMedia } from "@/hooks/useMedia";
import { useStorageUsage, useAllProfiles, useProfile } from "@/hooks/useProfile";
import { useOnThisDay } from "@/hooks/useMemories";
import { useMyCouple } from "@/hooks/useCouple";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn, formatSize } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type ViewType = "all" | "starred" | "recently-deleted" | "timeline" | "on-this-day" | "anniversaries" | "chat" | "activity" | "billing" | "settings" | string;

interface Props {
  selectedView: ViewType;
  onSelectView: (view: ViewType) => void;
  onStartSlideshow?: () => void;
}

export function AppSidebar({ selectedView, onSelectView, onStartSlideshow }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setOpenMobile } = useSidebar();
  const { data: isAdmin } = useIsAdmin();
  const { data: folders = [] } = useFolders();
  const { data: allMedia = [] } = useMedia();
  const { data: storageBytes = 0 } = useStorageUsage();
  const { data: onThisDayMedia = [] } = useOnThisDay();
  const { data: couple } = useMyCouple();
  const { data: profiles = [] } = useAllProfiles();
  const { data: myProfile } = useProfile();
  const createFolder = useCreateFolder();
  const renameFolder = useRenameFolder();
  const deleteFolder = useDeleteFolder();

  // Unread messages count
  const { data: messages = [] } = useMessages();
  const unreadCount = messages.filter(m => m.sender_id !== user?.id && !m.read_at).length;

  const selectView = (view: ViewType) => {
    setOpenMobile(false);
    onSelectView(view);
  };

  const partnerId = couple?.status === "active"
    ? (couple.user1_id === user?.id ? couple.user2_id : couple.user1_id)
    : null;
  const partnerProfile = partnerId ? profiles.find(p => p.user_id === partnerId) : null;
  const myInitials = (myProfile?.display_name ?? user?.email ?? "Me").slice(0, 2).toUpperCase();
  const partnerInitials = (partnerProfile?.display_name ?? "?").slice(0, 2).toUpperCase();

  const [creatingFolder, setCreatingFolder] = useState(false);
  const [creatingInParent, setCreatingInParent] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);

  const rootFolders = folders.filter(f => !f.parent_id);

  const folderCounts: Record<string, number> = {};
  allMedia.forEach(m => {
    const key = m.folder_id ?? "__unfiled__";
    folderCounts[key] = (folderCounts[key] ?? 0) + 1;
  });

  const handleCreate = async (parentId?: string | null) => {
    if (!newFolderName.trim()) return;
    await createFolder.mutateAsync({ name: newFolderName.trim(), parentId: parentId ?? null });
    setNewFolderName("");
    setCreatingFolder(false);
    setCreatingInParent(null);
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    await renameFolder.mutateAsync({ id, name: editName.trim() });
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (!deletingFolder) return;
    await deleteFolder.mutateAsync(deletingFolder.id);
    if (selectedView === deletingFolder.id) onSelectView("all");
    setDeletingFolder(null);
  };

  const navItems = [
    { id: "all" as const, label: "All Files", icon: Home, count: allMedia.length },
    { id: "starred" as const, label: "Starred", icon: Star, count: allMedia.filter(m => m.is_starred).length },
    { id: "recently-deleted" as const, label: "Recently Deleted", icon: Trash2, count: null },
  ];

  const specialItems = [
    { id: "chat" as const, label: "Chat with Partner", icon: MessageCircleHeart, badge: unreadCount },
    { id: "timeline" as const, label: "Memories Timeline", icon: CalendarHeart },
    { id: "anniversaries" as const, label: "Anniversaries", icon: Trophy },
    { id: "activity" as const, label: "Activity Feed", icon: Activity },
  ];

  const plan = usePlan();
  const storageLimit = getStorageLimit(plan);
  const storageLabel = formatStorageLimit(plan);

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Heart className="h-4 w-4 text-primary-foreground fill-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold font-heading tracking-tight gradient-text">OurVault</h2>
            <p className="text-[10px] text-muted-foreground">Shared Media</p>
          </div>
          {couple?.status === "active" ? (
            <span title="Partner linked" className="h-5 w-5 flex items-center justify-center rounded-full bg-primary/15 shrink-0">
              <Heart className="h-2.5 w-2.5 text-primary fill-primary" />
            </span>
          ) : (
            <span title="No partner linked" className="h-5 w-5 flex items-center justify-center rounded-full bg-muted shrink-0">
              <Link2 className="h-2.5 w-2.5 text-muted-foreground" />
            </span>
          )}
        </div>

        {couple?.status === "active" && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/8 border border-primary/15 px-2.5 py-2">
            <div className="flex items-center -space-x-1.5">
              <Avatar className="h-6 w-6 ring-2 ring-sidebar border-0">
                <AvatarImage src={myProfile?.avatar_url ?? undefined} />
                <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">{myInitials}</AvatarFallback>
              </Avatar>
              <Avatar className="h-6 w-6 ring-2 ring-sidebar border-0">
                <AvatarImage src={partnerProfile?.avatar_url ?? undefined} />
                <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">{partnerInitials}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-foreground truncate">
                {myProfile?.display_name ?? "You"} &amp; {partnerProfile?.display_name ?? "Partner"}
              </p>
              <p className="text-[9px] text-primary">● Connected</p>
            </div>
          </div>
        )}

        {couple?.status !== "active" && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/50 border border-border px-2.5 py-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={myProfile?.avatar_url ?? undefined} />
              <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">{myInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-foreground truncate">{myProfile?.display_name ?? user?.email?.split("@")[0] ?? "You"}</p>
              <p className="text-[9px] text-muted-foreground">No partner linked</p>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.id} className={cn(item.id === "all" && "sm:flex hidden")}>
                  <SidebarMenuButton
                    onClick={() => selectView(item.id)}
                    className={cn("justify-between", selectedView === item.id && "bg-accent text-accent-foreground")}
                  >
                    <span className="flex items-center">
                      <item.icon className="h-4 w-4 mr-2" />
                      <span>{item.label}</span>
                    </span>
                    {item.count !== null && item.count > 0 && (
                      <Badge variant="secondary" className="text-xs h-5 px-1.5 font-normal">{item.count}</Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── For Us ──────────────────────────────────────────────── */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-1.5">
            <Heart className="h-3 w-3 text-primary fill-primary" /> For Us
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {specialItems.map(item => (
                <SidebarMenuItem key={item.id} className={cn((item.id === "timeline" || item.id === "chat") && "sm:flex hidden")}>
                  <SidebarMenuButton
                    onClick={() => selectView(item.id)}
                    className={cn("justify-between", selectedView === item.id && "bg-accent text-accent-foreground")}
                  >
                    <span className="flex items-center">
                      <item.icon className="h-4 w-4 mr-2" />
                      <span>{item.label}</span>
                    </span>
                    {!!item.badge && item.badge > 0 && (
                      <Badge className="text-xs h-5 px-1.5 font-semibold bg-primary text-primary-foreground border-0">
                        {item.badge > 99 ? "99+" : item.badge}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {onThisDayMedia.length > 0 && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => selectView("on-this-day")}
                    className={cn("justify-between", selectedView === "on-this-day" && "bg-accent text-accent-foreground")}
                  >
                    <span className="flex items-center">
                      <span className="text-base mr-2">🗓️</span>
                      <span>On This Day</span>
                    </span>
                    <Badge variant="secondary" className="text-xs h-5 px-1.5 font-normal animate-pulse bg-primary/15 text-primary border-0">{onThisDayMedia.length}</Badge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {onStartSlideshow && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => { setOpenMobile(false); onStartSlideshow?.(); }} className="text-primary hover:text-primary">
                    <Play className="h-4 w-4 mr-2 fill-primary" />
                    <span>Slideshow</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Folders ──────────────────────────────────────────────── */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Folders</span>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setCreatingFolder(true); setCreatingInParent(null); }}>
              <FolderPlus className="h-3.5 w-3.5" />
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {creatingFolder && !creatingInParent && (
              <div className="px-2 pb-2">
                <Input
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={e => { if (e.key === "Enter") handleCreate(null); if (e.key === "Escape") { setCreatingFolder(false); setNewFolderName(""); } }}
                  onBlur={() => { if (!newFolderName.trim()) { setCreatingFolder(false); setNewFolderName(""); } }}
                />
              </div>
            )}
            <SidebarMenu>
              {rootFolders.map(folder => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  allFolders={folders}
                  folderCounts={folderCounts}
                  selectedView={selectedView}
                  onSelectView={selectView}
                  editingId={editingId}
                  editName={editName}
                  setEditingId={setEditingId}
                  setEditName={setEditName}
                  onRename={handleRename}
                  onDelete={setDeletingFolder}
                  creatingInParent={creatingInParent}
                  newFolderName={newFolderName}
                  setNewFolderName={setNewFolderName}
                  onCreateSubfolder={(parentId) => { setCreatingInParent(parentId); setCreatingFolder(true); setNewFolderName(""); }}
                  onSubmitCreate={handleCreate}
                  onCancelCreate={() => { setCreatingInParent(null); setCreatingFolder(false); setNewFolderName(""); }}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <SidebarFooter className="p-4 border-t space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Hash className="h-3 w-3" />
              {couple?.status === "active" ? "Shared storage" : "Storage used"}
            </span>
            <span className="font-medium text-foreground">{formatSize(storageBytes)}</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                storageBytes / storageLimit > 0.9 ? "bg-destructive" : "bg-primary"
              )}
              style={{ width: `${Math.min((storageBytes / storageLimit) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground/60">
            of {storageLabel}{couple?.status === "active" ? " shared between you two" : ""}
          </p>
        </div>

        <SidebarMenuButton
          onClick={() => selectView("settings")}
          className={cn(
            "w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground",
            selectedView === "settings" && "bg-accent text-accent-foreground"
          )}
        >
          <Settings className="h-3.5 w-3.5 shrink-0" />
          Settings
        </SidebarMenuButton>

        <SidebarMenuButton
          onClick={() => selectView("billing")}
          className={cn(
            "w-full justify-start gap-2 text-xs",
            plan === "soulmate" ? "text-primary hover:text-primary" : "text-muted-foreground hover:text-foreground",
            selectedView === "billing" && "bg-accent text-accent-foreground"
          )}
        >
          <Crown className="h-3.5 w-3.5 shrink-0" />
          {plan === "soulmate" ? "Soulmate plan active" : plan === "dating" ? "Dating plan active" : "Upgrade plan"}
        </SidebarMenuButton>

        {isAdmin && (
          <SidebarMenuButton
            onClick={() => { setOpenMobile(false); navigate("/admin"); }}
            className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
            Admin panel
          </SidebarMenuButton>
        )}

        <DaysTogether />
      </SidebarFooter>

      <AlertDialog open={!!deletingFolder} onOpenChange={open => !open && setDeletingFolder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingFolder?.name}" and remove files from this folder (files won't be deleted).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}

// ── FolderItem component (unchanged, copy from original) ──────────────

function FolderItem({
  folder, allFolders, folderCounts, selectedView, onSelectView,
  editingId, editName, setEditingId, setEditName, onRename, onDelete,
  creatingInParent, newFolderName, setNewFolderName, onCreateSubfolder, onSubmitCreate, onCancelCreate,
}: {
  folder: Folder; allFolders: Folder[];
  folderCounts: Record<string, number>;
  selectedView: string;
  onSelectView: (id: string) => void;
  editingId: string | null; editName: string;
  setEditingId: (id: string | null) => void; setEditName: (name: string) => void;
  onRename: (id: string) => void; onDelete: (f: Folder) => void;
  creatingInParent: string | null; newFolderName: string;
  setNewFolderName: (s: string) => void;
  onCreateSubfolder: (parentId: string) => void;
  onSubmitCreate: (parentId?: string | null) => void;
  onCancelCreate: () => void;
}) {
  const children = allFolders.filter(f => f.parent_id === folder.id);
  const count = folderCounts[folder.id] ?? 0;
  const isSelected = selectedView === folder.id;
  const [expanded, setExpanded] = useState(false);

  return (
    <SidebarMenuItem>
      {editingId === folder.id ? (
        <div className="px-2 pb-1">
          <Input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            className="h-7 text-sm"
            autoFocus
            onKeyDown={e => { if (e.key === "Enter") onRename(folder.id); if (e.key === "Escape") setEditingId(null); }}
            onBlur={() => { if (!editName.trim()) setEditingId(null); else onRename(folder.id); }}
          />
        </div>
      ) : (
        <div className={cn("flex items-center gap-1 rounded-md group", isSelected && "bg-accent")}>
          {children.length > 0 && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="p-1 rounded hover:bg-muted/50"
            >
              <ChevronRight className={cn("h-3 w-3 text-muted-foreground transition-transform", expanded && "rotate-90")} />
            </button>
          )}
          <SidebarMenuButton
            onClick={() => onSelectView(folder.id)}
            className={cn("flex-1 justify-between min-w-0", isSelected && "bg-accent text-accent-foreground")}
          >
            <span className="flex items-center min-w-0">
              <span className="mr-1.5 text-sm">{folder.emoji ?? ""}</span>
              <FolderIcon className="h-3.5 w-3.5 mr-1.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm">{folder.name}</span>
            </span>
            {count > 0 && <Badge variant="secondary" className="text-xs h-4 px-1 font-normal shrink-0">{count}</Badge>}
          </SidebarMenuButton>
          <div className="hidden group-hover:flex items-center gap-0.5 pr-1">
            <button
              onClick={() => { setEditingId(folder.id); setEditName(folder.name); }}
              className="p-1 rounded hover:bg-muted/50"
            >
              <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
            </button>
            <button onClick={() => onDelete(folder)} className="p-1 rounded hover:bg-destructive/10">
              <Trash2 className="h-2.5 w-2.5 text-destructive/70" />
            </button>
            <button onClick={() => onCreateSubfolder(folder.id)} className="p-1 rounded hover:bg-muted/50">
              <FolderPlus className="h-2.5 w-2.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Subfolder creation input */}
      {creatingInParent === folder.id && (
        <div className="pl-6 pr-2 pb-1">
          <Input
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            placeholder="Subfolder name"
            className="h-7 text-sm"
            autoFocus
            onKeyDown={e => { if (e.key === "Enter") onSubmitCreate(folder.id); if (e.key === "Escape") onCancelCreate(); }}
            onBlur={() => { if (!newFolderName.trim()) onCancelCreate(); }}
          />
        </div>
      )}

      {/* Children */}
      {expanded && children.length > 0 && (
        <div className="pl-4">
          {children.map(child => (
            <FolderItem
              key={child.id}
              folder={child}
              allFolders={allFolders}
              folderCounts={folderCounts}
              selectedView={selectedView}
              onSelectView={onSelectView}
              editingId={editingId}
              editName={editName}
              setEditingId={setEditingId}
              setEditName={setEditName}
              onRename={onRename}
              onDelete={onDelete}
              creatingInParent={creatingInParent}
              newFolderName={newFolderName}
              setNewFolderName={setNewFolderName}
              onCreateSubfolder={onCreateSubfolder}
              onSubmitCreate={onSubmitCreate}
              onCancelCreate={onCancelCreate}
            />
          ))}
        </div>
      )}
    </SidebarMenuItem>
  );
}
