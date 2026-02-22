import { useState } from "react";
import { FolderIcon, FolderPlus, ChevronRight, Pencil, Trash2, Home } from "lucide-react";
import { useFolders, useCreateFolder, useRenameFolder, useDeleteFolder, Folder } from "@/hooks/useFolders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface Props {
  selectedFolderId: string | null | undefined;
  onSelectFolder: (id: string | null | undefined) => void;
}

export function AppSidebar({ selectedFolderId, onSelectFolder }: Props) {
  const { data: folders = [] } = useFolders();
  const createFolder = useCreateFolder();
  const renameFolder = useRenameFolder();
  const deleteFolder = useDeleteFolder();

  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);

  const rootFolders = folders.filter(f => !f.parent_id);

  const handleCreate = async () => {
    if (!newFolderName.trim()) return;
    await createFolder.mutateAsync({ name: newFolderName.trim() });
    setNewFolderName("");
    setCreatingFolder(false);
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    await renameFolder.mutateAsync({ id, name: editName.trim() });
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (!deletingFolder) return;
    await deleteFolder.mutateAsync(deletingFolder.id);
    if (selectedFolderId === deletingFolder.id) onSelectFolder(undefined);
    setDeletingFolder(null);
  };

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-4">
        <h2 className="text-lg font-semibold tracking-tight">Media Hub</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSelectFolder(undefined)}
                  className={cn(selectedFolderId === undefined && "bg-accent text-accent-foreground")}
                >
                  <Home className="h-4 w-4 mr-2" />
                  <span>All Files</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onSelectFolder(null)}
                  className={cn(selectedFolderId === null && "bg-accent text-accent-foreground")}
                >
                  <FolderIcon className="h-4 w-4 mr-2" />
                  <span>Unfiled</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Folders</span>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setCreatingFolder(true)}>
              <FolderPlus className="h-3.5 w-3.5" />
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {creatingFolder && (
              <div className="px-2 pb-2">
                <Input
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreatingFolder(false); }}
                  onBlur={() => { if (!newFolderName.trim()) setCreatingFolder(false); }}
                />
              </div>
            )}
            <SidebarMenu>
              {rootFolders.map(folder => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  allFolders={folders}
                  selectedFolderId={selectedFolderId}
                  onSelectFolder={onSelectFolder}
                  editingId={editingId}
                  editName={editName}
                  setEditingId={setEditingId}
                  setEditName={setEditName}
                  onRename={handleRename}
                  onDelete={setDeletingFolder}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

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

function FolderItem({
  folder, allFolders, selectedFolderId, onSelectFolder,
  editingId, editName, setEditingId, setEditName, onRename, onDelete,
}: {
  folder: Folder; allFolders: Folder[];
  selectedFolderId: string | null | undefined;
  onSelectFolder: (id: string | null | undefined) => void;
  editingId: string | null; editName: string;
  setEditingId: (id: string | null) => void; setEditName: (name: string) => void;
  onRename: (id: string) => void; onDelete: (f: Folder) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const children = allFolders.filter(f => f.parent_id === folder.id);

  return (
    <SidebarMenuItem>
      {editingId === folder.id ? (
        <div className="px-2 py-1">
          <Input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            className="h-7 text-sm"
            autoFocus
            onKeyDown={e => { if (e.key === "Enter") onRename(folder.id); if (e.key === "Escape") setEditingId(null); }}
          />
        </div>
      ) : (
        <SidebarMenuButton
          onClick={() => onSelectFolder(folder.id)}
          className={cn("group justify-between", selectedFolderId === folder.id && "bg-accent text-accent-foreground")}
        >
          <span className="flex items-center gap-2">
            {children.length > 0 && (
              <ChevronRight
                className={cn("h-3 w-3 transition-transform", expanded && "rotate-90")}
                onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
              />
            )}
            <FolderIcon className="h-4 w-4" />
            <span className="truncate">{folder.name}</span>
          </span>
          <span className="hidden group-hover:flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); setEditName(folder.name); setEditingId(folder.id); }}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); onDelete(folder); }}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </span>
        </SidebarMenuButton>
      )}
      {expanded && children.length > 0 && (
        <SidebarMenu className="ml-4">
          {children.map(child => (
            <FolderItem
              key={child.id}
              folder={child}
              allFolders={allFolders}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              editingId={editingId}
              editName={editName}
              setEditingId={setEditingId}
              setEditName={setEditName}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </SidebarMenu>
      )}
    </SidebarMenuItem>
  );
}
