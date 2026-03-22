import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useAppLock } from "@/hooks/useAppLock";
import { AppLockScreen } from "@/components/AppLockScreen";
import { Loader2 } from "lucide-react";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import Join from "./pages/Join";
import Admin from "./pages/Admin";
import Index from "./pages/Index";
import AuthCallback from "./pages/AuthCallback";

// ─── Query client ─────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ─── Shared loading screen ────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading…" />
    </div>
  );
}

// ─── Route guards ─────────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // FIX: was destructuring `user` and `loading` — useAuth now exports
  //      `session` and `bootstrapping` (renamed in the production rewrite).
  const { session, bootstrapping } = useAuth();
  const { locked, lockMethod, unlock } = useAppLock(!!session);

  // Still bootstrapping — don't redirect yet, just show spinner
  if (bootstrapping) return <LoadingScreen />;

  // No session → send to auth
  if (!session) return <Navigate to="/auth" replace />;

  // App-lock screen (PIN / biometric)
  if (locked) return <AppLockScreen lockMethod={lockMethod} onUnlock={unlock} />;

  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  // FIX: same — was using `user`/`loading`, now `session`/`bootstrapping`
  const { session, bootstrapping } = useAuth();

  // Still bootstrapping — render spinner instead of flash-redirecting
  if (bootstrapping) return <LoadingScreen />;

  // Already logged in → send to dashboard
  if (session) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

// ─── App ──────────────────────────────────────────────────────────────────────

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>

            {/* ── Public routes ── */}
            <Route path="/" element={<PublicOnlyRoute><Index /></PublicOnlyRoute>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/join" element={<Join />} />

            {/* ── Dashboard — folder route must come before :tab ── */}
            <Route path="/dashboard/folder/:folderId" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/:tab" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

            {/* ── Other protected ── */}
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

            {/* ── 404 ── */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;