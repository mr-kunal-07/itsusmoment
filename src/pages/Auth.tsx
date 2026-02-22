import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

export default function Auth() {
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-primary">
            <Upload className="h-8 w-8" />
            <h1 className="text-2xl font-bold tracking-tight">Media Hub</h1>
          </div>
          <p className="text-sm text-muted-foreground">Team media management made simple</p>
        </div>
        {isLogin ? (
          <LoginForm onSwitch={() => setIsLogin(false)} />
        ) : (
          <SignUpForm onSwitch={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
}

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) toast({ title: "Login failed", description: error.message, variant: "destructive" });
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button type="button" onClick={onSwitch} className="text-primary underline-offset-4 hover:underline">Sign up</button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

function SignUpForm({ onSwitch }: { onSwitch: () => void }) {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, displayName);
    setLoading(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "We sent you a confirmation link to verify your account." });
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Join your team's media workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display name</Label>
            <Input id="name" value={displayName} onChange={e => setDisplayName(e.target.value)} required placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating account..." : "Sign up"}</Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button type="button" onClick={onSwitch} className="text-primary underline-offset-4 hover:underline">Sign in</button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
