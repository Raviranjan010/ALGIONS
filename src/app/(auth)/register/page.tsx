"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { RydvantaLogo } from "@/components/brand/RydvantaLogo";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"passenger" | "operator">("passenger");
  const [phone, setPhone] = useState("+91 ");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, role, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      router.push(data.redirectUrl || "/passenger/bookings");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <RydvantaLogo size="lg" showTagline={true} />
          </div>
          <h1 className="text-2xl font-black text-charcoal">
            Create an Account
          </h1>
          <p className="text-xs text-charcoal-muted">
            Join Rydvanta for reliable passenger bookings or fleet management
          </p>
        </div>

        <Card className="rounded-3xl border-charcoal-border/80 shadow-warm">
          <CardContent className="pt-6">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Account Role Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-charcoal">Account Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("passenger")}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      role === "passenger"
                        ? "bg-terracotta text-white border-terracotta shadow-xs"
                        : "bg-ivory-soft text-charcoal border-charcoal-border hover:bg-ivory"
                    }`}
                  >
                    Passenger
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("operator")}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      role === "operator"
                        ? "bg-forest text-white border-forest shadow-xs"
                        : "bg-ivory-soft text-charcoal border-charcoal-border hover:bg-ivory"
                    }`}
                  >
                    Bus Operator
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-charcoal">Full Name</Label>
                <Input
                  placeholder="e.g. Ravi Ranjan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-11 text-xs font-semibold"
                />
              </div>

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
                <Label className="text-xs font-bold text-charcoal">Phone Number</Label>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="h-11 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-charcoal">Password</Label>
                <Input
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
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
                    <Loader2 className="w-4 h-4 animate-spin" /> Creating Account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-5 pt-4 border-t border-charcoal-border/50 text-center text-xs text-charcoal-muted">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-terracotta hover:underline">
                Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
