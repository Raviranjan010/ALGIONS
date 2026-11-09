"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, UserCheck, Loader2, AlertCircle } from "lucide-react";
import { RydvantaLogo } from "@/components/brand/RydvantaLogo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("algions2026");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      router.push(data.redirectUrl || "/passenger/bookings");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("algions2026");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header with Rydvanta Logo */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <RydvantaLogo size="lg" showTagline={true} />
          </div>
          <h1 className="text-2xl font-black text-charcoal">
            Welcome Back
          </h1>
          <p className="text-xs text-charcoal-muted">
            Sign in to access your passenger reservations or operator management portal
          </p>
        </div>

        {/* Quick Demo Personas Pills */}
        <div className="p-4 rounded-2xl bg-ivory-soft border border-charcoal-border space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-forest block">
            Quick Demo Login Personas:
          </span>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => setDemoUser("passenger@algions.com")}
              className="px-3 py-1.5 bg-white hover:bg-ivory text-charcoal font-bold rounded-xl border border-charcoal-border shadow-xs transition-colors"
            >
              Passenger (Ravi)
            </button>
            <button
              type="button"
              onClick={() => setDemoUser("operator@royalexpress.in")}
              className="px-3 py-1.5 bg-white hover:bg-ivory text-forest font-bold rounded-xl border border-charcoal-border shadow-xs transition-colors"
            >
              Operator (Royal Express)
            </button>
            <button
              type="button"
              onClick={() => setDemoUser("admin@algions.com")}
              className="px-3 py-1.5 bg-white hover:bg-ivory text-terracotta font-bold rounded-xl border border-charcoal-border shadow-xs transition-colors"
            >
              Admin (Operations)
            </button>
          </div>
        </div>

        {/* Login Card */}
        <Card className="rounded-3xl border-charcoal-border/80 shadow-warm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-extrabold text-charcoal">
              Account Credentials
            </CardTitle>
            <CardDescription className="text-xs text-charcoal-muted">
              Enter your email and password to authenticate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-charcoal">Email Address</Label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-charcoal">Password</Label>
                  <span className="text-[11px] text-terracotta font-medium">
                    Demo: algions2026
                  </span>
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 text-xs font-semibold"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-xs font-bold bg-terracotta hover:bg-terracotta-hover text-white rounded-xl shadow-xs"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                  </span>
                ) : (
                  "Sign In to Account"
                )}
              </Button>
            </form>

            <div className="mt-5 pt-4 border-t border-charcoal-border/50 text-center text-xs text-charcoal-muted">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-bold text-terracotta hover:underline">
                Create Account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
