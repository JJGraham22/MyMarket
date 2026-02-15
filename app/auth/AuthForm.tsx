"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";

type AuthTab = "login" | "signup";

export function AuthForm() {
  const router = useRouter();
  const [tab, setTab] = useState<AuthTab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createBrowserSupabaseClient();

    if (tab === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setMessage(
          "Check your email for a confirmation link. Once confirmed you can log in."
        );
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    }

    setLoading(false);
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex rounded-lg p-1" style={{ background: "var(--brown-bg)", border: "1px solid rgba(168,137,104,0.2)" }}>
        <button
          type="button"
          onClick={() => {
            setTab("login");
            setError(null);
            setMessage(null);
          }}
          className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors ${tab === "login" ? "pill-active" : "text-[var(--cream-muted)] hover:text-[var(--cream)]"}`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("signup");
            setError(null);
            setMessage(null);
          }}
          className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors ${tab === "signup" ? "pill-active" : "text-[var(--cream-muted)] hover:text-[var(--cream)]"}`}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[var(--cream-muted)]">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[var(--cream-muted)]">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete={tab === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            minLength={6}
            className="input"
          />
        </div>
        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-lg px-3 py-2 text-sm" style={{ border: "1px solid rgba(107,158,58,0.4)", background: "var(--green-bg)", color: "var(--green-pale)" }}>
            {message}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? "Please wait…" : tab === "login" ? "Log in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
