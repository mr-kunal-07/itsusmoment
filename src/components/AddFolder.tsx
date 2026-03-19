import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface AddFolderProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (name: string) => Promise<void> | void;
    parentId?: string | null;
    loading?: boolean;
}

export function AddFolder({
    open,
    onOpenChange,
    onCreate,
    parentId = null,
    loading = false,
}: AddFolderProps) {
    const [name, setName] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;

        await onCreate(trimmed);
        setName("");
        onOpenChange(false);
    };

    const handleClose = () => {
        setName("");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-sm rounded-2xl border border-border/50 backdrop-blur-xl bg-background/80 shadow-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                        <FolderPlus className="h-4 w-4 text-primary" />
                        {parentId ? "New Subfolder" : "New Folder"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={parentId ? "Subfolder name" : "Folder name"}
                        autoFocus
                        maxLength={50}
                        className="h-10 rounded-xl bg-muted/40 focus-visible:ring-1"
                    />

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleClose}
                            className="rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!name.trim() || loading}
                            className="rounded-xl px-4"
                        >
                            {loading ? "Creating..." : "Create"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}