import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile, useUploadAvatar } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Loader2, Save } from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? user?.email?.split("@")[0] ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentAvatarUrl = avatarUrl ?? profile?.avatar_url ?? null;
  const initials = (profile?.display_name ?? user?.email ?? "U").slice(0, 2).toUpperCase();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadAvatar.mutateAsync(file);
      setAvatarUrl(url);
      await updateProfile.mutateAsync({ avatarUrl: url });
      toast({ title: "Avatar updated" });
    } catch {
      toast({ title: "Error uploading avatar", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ displayName: displayName.trim() || undefined });
      toast({ title: "Profile saved" });
    } catch {
      toast({ title: "Error saving profile", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 h-14 flex items-center gap-3 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-base font-semibold">Profile Settings</h1>
      </header>

      <div className="max-w-lg mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Manage your display name and avatar photo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar className="h-24 w-24 ring-2 ring-border">
                  {currentAvatarUrl && <AvatarImage src={currentAvatarUrl} alt="Avatar" />}
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 rounded-full bg-primary text-primary-foreground p-1.5 shadow-md hover:bg-primary/90 transition-colors"
                >
                  {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <p className="text-xs text-muted-foreground">Click the camera icon to upload a photo</p>
            </div>

            {/* Display name */}
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled className="text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <Button onClick={handleSave} disabled={updateProfile.isPending} className="w-full">
              {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
