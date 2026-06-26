"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-2xl text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400">
            <span className="text-2xl">✉</span>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-slate-100">Check your email</h2>
        <p className="mt-2 text-sm text-slate-400">
          We&apos;ve sent a password reset link to{" "}
          <strong className="text-slate-200">{email}</strong>.
        </p>
        <Link
          href="/login"
          className="mt-6 block text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-100">Reset password</h1>
        <p className="mt-1 text-sm text-slate-400">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
          />
        </div>

        {error && (
          <p className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
