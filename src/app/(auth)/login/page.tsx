"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bus, ShieldCheck, UserCheck, Loader2, AlertCircle } from "lucide-react";

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

      router.push(data.redirectUrl || "/passenger/dashboard");
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
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-md">
            <Bus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Sign In to ALGIONS
          </h1>
          <p className="text-xs text-slate-500">
            Access your passenger tickets or operator management portal
          </p>
        </div>

        {/* Quick Demo Personas Pills */}
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 block">
            Quick Demo Login Personas:
          </span>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => setDemoUser("passenger@algions.com")}
              className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-800 font-medium rounded-lg border border-blue-200 shadow-xs"
            >
              Passenger (Ravi)
            </button>
            <button
              type="button"
              onClick={() => setDemoUser("operator@royalexpress.in")}
              className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-800 font-medium rounded-lg border border-blue-200 shadow-xs"
            >
              Operator (Royal Express)
            </button>
            <button
              type="button"
              onClick={() => setDemoUser("admin@algions.com")}
              className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-800 font-medium rounded-lg border border-blue-200 shadow-xs"
            >
              System Admin
            </button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-xs font-semibold">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="pass" className="text-xs font-semibold">
                  Password
                </Label>
                <Input
                  id="pass"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-bold text-blue-600 hover:underline">
                Create Account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
