import {
  createContext, useContext, useEffect, useRef,
  useState, useCallback, useReducer,
  type ReactNode,
} from "react";
import {
  type User,
  type Session,
  type AuthError,
  type AuthChangeEvent,
  type Provider,
} from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────────────────────────────────────────────────────────
// § UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

// ── [21] Structured logger ────────────────────────────────────────────────────

type LogCtx = Record<string, unknown>;

export const authLog = {
  info: (msg: string, ctx?: LogCtx) => {
    if (process.env.NODE_ENV !== "production") console.info(`[auth] ${msg}`, ctx ?? "");
  },
  warn: (msg: string, ctx?: LogCtx) => console.warn(`[auth] ${msg}`, ctx ?? ""),
  error: (msg: string, ctx?: LogCtx) => console.error(`[auth] ${msg}`, ctx ?? ""),
};

// ── [18] SSR-safe environment helpers ────────────────────────────────────────

export const isBrowser = typeof window !== "undefined";
export const getOrigin = () => (isBrowser ? window.location.origin : "");
export const getPathname = () => (isBrowser ? window.location.pathname : "/");

// ── [7, 13] Safe storage factory ─────────────────────────────────────────────
// [13] Supabase owns localStorage — we use sessionStorage only for ephemeral
//      pre-auth payloads. Zero overlap, zero conflict.
// [7]  Wrapped so Safari Private Browsing never crashes auth.

type SafeStore = {
  get: (k: string) => string | null;
  set: (k: string, v: string) => void;
  remove: (k: string) => void;
};

function makeSafeStorage(pick: () => Storage | null): SafeStore {
  const store = (): Storage | null => {
    try { return isBrowser ? pick() : null; } catch { return null; }
  };
  return {
    get: k => { try { return store()?.getItem(k) ?? null; } catch { return null; } },
    set: (k, v) => { try { store()?.setItem(k, v); } catch { /* ignore */ } },
    remove: k => { try { store()?.removeItem(k); } catch { /* ignore */ } },
  };
}

// [A3] Single source of truth — Auth.tsx imports from here, no local redefinition
export const ephemeralStorage = makeSafeStorage(() => window.sessionStorage);
export const PARTNER_CODE_KEY = "usMoment:pending_partner_code";
export const JOIN_REDIRECT_KEY = "usMoment:join_redirect";

// ── [5, 6, 17] Redirect sanitisation ─────────────────────────────────────────

const REDIRECT_ALLOWLIST = ["/chat", "/memories", "/map", "/profile", "/join", "/"] as const;

export function sanitiseRedirect(raw: string | null): string | null {
  if (!raw || !isBrowser) return null;
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    const allowed = REDIRECT_ALLOWLIST.some(
      p => url.pathname === p || url.pathname.startsWith(`${p}/`)
    );
    if (!allowed) return null;
    return url.pathname; // strip query params + hash
  } catch {
    return null;
  }
}

// ── [22] Retry helper ─────────────────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 600,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (err) {
      lastError = err;
      if (i < attempts - 1)
        await new Promise(r => setTimeout(r, baseDelayMs * 2 ** i));
    }
  }
  throw lastError;
}

// ── Partner code validation ───────────────────────────────────────────────────
// [A3, S2] Central validation so both the UI and storage layer use the same rules.

const PARTNER_CODE_RE = /^[A-Z0-9]{6,8}$/;

export function normalisePartnerCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

export function isValidPartnerCode(code: string): boolean {
  return PARTNER_CODE_RE.test(code);
}

// ─────────────────────────────────────────────────────────────────────────────
// § TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthResult<D = Session | null> {
  data: D | null;
  error: AuthError | null;
}

// [A2] Added "googleOAuth" key so Auth.tsx can read actionLoading.googleOAuth
export type AuthActionKey =
  | "signIn"
  | "signUp"
  | "signOut"
  | "resetPassword"
  | "googleOAuth";

export interface AuthContextType {
  // State
  user: User | null;
  session: Session | null;   // [12] prefer session over user
  bootstrapping: boolean;          // true only during initial load
  sessionExpired: boolean;          // [23] server-side expiry detected

  // Action state
  actionLoading: Partial<Record<AuthActionKey, boolean>>;
  authError: AuthError | null;
  clearAuthError: () => void;

  // Actions
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, displayName: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<AuthResult<null>>;
  // [A1] OAuth through context — no direct supabase import needed in pages
  signInWithOAuth: (provider: Provider) => Promise<AuthResult<null>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// § AUTH STATE REDUCER
// ─────────────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  session: Session | null;
  bootstrapping: boolean;
  sessionExpired: boolean;
}

type ReducerAction =
  | { type: "BOOTSTRAP"; session: Session | null }
  | { type: "SIGNED_IN"; session: Session }
  | { type: "TOKEN_REFRESHED"; session: Session }
  | { type: "USER_UPDATED"; session: Session }
  | { type: "SIGNED_OUT"; expired: boolean }
  | { type: "PASSWORD_RECOVERY" };

function authReducer(state: AuthState, action: ReducerAction): AuthState {
  switch (action.type) {
    case "BOOTSTRAP":
      return {
        user: action.session?.user ?? null,
        session: action.session,
        bootstrapping: false,
        sessionExpired: false,
      };
    case "SIGNED_IN":
    case "TOKEN_REFRESHED":
    case "USER_UPDATED":
      // [12] user and session always updated atomically
      return { ...state, user: action.session.user, session: action.session, sessionExpired: false };
    case "SIGNED_OUT":
      return { user: null, session: null, bootstrapping: false, sessionExpired: action.expired };
    case "PASSWORD_RECOVERY":
      return state;
    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § POST-AUTH ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

function usePostAuthActions() {
  const done = useRef(new Set<string>());

  const run = useCallback(async (session: Session): Promise<void> => {
    const userId = session.user.id;
    if (done.current.has(userId)) return;
    done.current.add(userId);

    // 1. Partner invite code
    const rawCode = ephemeralStorage.get(PARTNER_CODE_KEY);
    if (rawCode) {
      const code = normalisePartnerCode(rawCode);
      if (isValidPartnerCode(code)) {
        try {
          await withRetry(async () => {
            return await supabase
              .rpc("accept_couple_invite", { _invite_code: code })
              .throwOnError();
          });
          ephemeralStorage.remove(PARTNER_CODE_KEY); // [14] remove only on success
          authLog.info("Partner invite accepted", { userId });
        } catch (err) {
          // [4] Code stays so the join page can surface feedback
          authLog.error("accept_couple_invite failed", { err });
        }
      } else {
        // Malformed code — discard silently rather than hitting the DB
        ephemeralStorage.remove(PARTNER_CODE_KEY);
        authLog.warn("Discarded invalid partner code", { rawCode });
      }
    }

    // 2. Post-login redirect
    const rawRedirect = ephemeralStorage.get(JOIN_REDIRECT_KEY);
    if (rawRedirect) {
      ephemeralStorage.remove(JOIN_REDIRECT_KEY);
      const safePath = sanitiseRedirect(rawRedirect);
      if (safePath && isBrowser) {
        authLog.info("Post-auth redirect", { safePath });
        window.location.replace(safePath);
      }
    }
  }, []);

  const clearForUser = useCallback((userId: string) => {
    done.current.delete(userId);
  }, []);

  return { run, clearForUser };
}

// ─────────────────────────────────────────────────────────────────────────────
// § AUTH PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null, session: null, bootstrapping: true, sessionExpired: false,
  });
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [actionLoading, setActionLoading] = useState<Partial<Record<AuthActionKey, boolean>>>({});
  const inFlight = useRef<Partial<Record<AuthActionKey, boolean>>>({});
  const hadSession = useRef(false);

  const { run: runPostAuth, clearForUser } = usePostAuthActions();

  if (state.session) hadSession.current = true;

  // ── [1, 3, 8, 11, 16] Single session source ──────────────────────────────
  useEffect(() => {
    let bootstrapped = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        authLog.info("auth event", { event, userId: session?.user.id });

        switch (event) {
          case "INITIAL_SESSION":
            bootstrapped = true;
            dispatch({ type: "BOOTSTRAP", session });
            if (session) runPostAuth(session);
            break;
          case "SIGNED_IN":
            dispatch({ type: "SIGNED_IN", session: session! });
            runPostAuth(session!);
            break;
          case "TOKEN_REFRESHED":
            dispatch({ type: "TOKEN_REFRESHED", session: session! });
            break;
          case "USER_UPDATED":
            dispatch({ type: "USER_UPDATED", session: session! });
            break;
          case "SIGNED_OUT": {
            const expired = hadSession.current && !inFlight.current.signOut;
            dispatch({ type: "SIGNED_OUT", expired });
            break;
          }
          case "PASSWORD_RECOVERY":
            dispatch({ type: "PASSWORD_RECOVERY" });
            break;
        }
      }
    );

    // [8] Safety net — unblock if INITIAL_SESSION never fires
    const timeout = setTimeout(() => {
      if (!bootstrapped) {
        authLog.warn("INITIAL_SESSION did not fire — forcing bootstrap");
        dispatch({ type: "BOOTSTRAP", session: null });
      }
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [runPostAuth]);

  // ── Action helpers ────────────────────────────────────────────────────────

  const startAction = useCallback((key: AuthActionKey) => {
    inFlight.current[key] = true;
    setActionLoading(p => ({ ...p, [key]: true }));
    setAuthError(null);
  }, []);

  const endAction = useCallback((key: AuthActionKey, err: AuthError | null) => {
    inFlight.current[key] = false;
    setActionLoading(p => ({ ...p, [key]: false }));
    if (err) setAuthError(err);
  }, []);

  const isInFlight = (key: AuthActionKey) => !!inFlight.current[key];

  const clearAuthError = useCallback(() => setAuthError(null), []);

  // ── signIn ────────────────────────────────────────────────────────────────
  const signIn = useCallback(async (
    email: string,
    password: string,
  ): Promise<AuthResult> => {
    if (isInFlight("signIn")) return { data: null, error: null };
    startAction("signIn");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      endAction("signIn", error);
      return { data: data.session, error };
    } catch (e) {
      const err = e as AuthError;
      endAction("signIn", err);
      return { data: null, error: err };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startAction, endAction]);

  // ── signUp ────────────────────────────────────────────────────────────────
  const signUp = useCallback(async (
    email: string,
    password: string,
    displayName: string,
  ): Promise<AuthResult> => {
    if (isInFlight("signUp")) return { data: null, error: null };
    startAction("signUp");
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: `${getOrigin()}/auth/callback`,
        },
      });
      endAction("signUp", error);
      return { data: data.session, error };
    } catch (e) {
      const err = e as AuthError;
      endAction("signUp", err);
      return { data: null, error: err };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startAction, endAction]);

  // ── signOut ───────────────────────────────────────────────────────────────
  const signOut = useCallback(async (): Promise<void> => {
    if (isInFlight("signOut")) return;
    startAction("signOut");
    if (state.user?.id) clearForUser(state.user.id);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      endAction("signOut", e as AuthError);
      return;
    }
    endAction("signOut", null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startAction, endAction, clearForUser, state.user?.id]);

  // ── resetPasswordForEmail ─────────────────────────────────────────────────
  const resetPasswordForEmail = useCallback(async (
    email: string,
  ): Promise<AuthResult<null>> => {
    if (isInFlight("resetPassword")) return { data: null, error: null };
    startAction("resetPassword");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getOrigin()}/reset-password`,
      });
      endAction("resetPassword", error);
      return { data: null, error };
    } catch (e) {
      const err = e as AuthError;
      endAction("resetPassword", err);
      return { data: null, error: err };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startAction, endAction]);

  // ── [A1] signInWithOAuth — abstracted through context ────────────────────
  // [A2] Tracked under "googleOAuth" key — no manual state needed in Auth.tsx
  // [S1] redirectTo correctly points to /auth/callback for PKCE code exchange
  const signInWithOAuth = useCallback(async (
    provider: Provider,
  ): Promise<AuthResult<null>> => {
    if (isInFlight("googleOAuth")) return { data: null, error: null };
    startAction("googleOAuth");
    // Store current path so post-auth redirect can return the user here
    const current = getPathname();
    if (current && current !== "/login" && current !== "/auth") {
      ephemeralStorage.set(JOIN_REDIRECT_KEY, current);
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${getOrigin()}/auth/callback`,
        },
      });
      // On success the browser redirects — endAction won't run.
      // On error we clean up.
      if (error) {
        endAction("googleOAuth", error);
        return { data: null, error };
      }
      // Loading stays true until redirect — intentional.
      return { data: null, error: null };
    } catch (e) {
      const err = e as AuthError;
      endAction("googleOAuth", err);
      return { data: null, error: err };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startAction, endAction]);

  const value: AuthContextType = {
    user: state.user,
    session: state.session,
    bootstrapping: state.bootstrapping,
    sessionExpired: state.sessionExpired,
    actionLoading,
    authError,
    clearAuthError,
    signIn,
    signUp,
    signOut,
    resetPasswordForEmail,
    signInWithOAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─────────────────────────────────────────────────────────────────────────────
// § HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error(
    "[useAuth] must be called inside <AuthProvider>. " +
    "Ensure AuthProvider wraps your app in App.tsx."
  );
  return ctx;
}

export function useAuthOptional(): AuthContextType | undefined {
  return useContext(AuthContext);
}

export function useRequireAuth(loginPath = "/login"): AuthContextType {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.bootstrapping) return;
    if (!auth.session) {
      const current = getPathname();
      if (current !== loginPath) ephemeralStorage.set(JOIN_REDIRECT_KEY, current);
      navigate(loginPath, { replace: true });
    }
  }, [auth.bootstrapping, auth.session, navigate, loginPath]);

  return auth;
}

export function useSessionExpired(): boolean {
  return useAuthOptional()?.sessionExpired ?? false;
}