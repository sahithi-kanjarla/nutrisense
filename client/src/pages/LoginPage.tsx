import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ email: "", password: "" });

  const login = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Login failed");
      }
      return res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      setLocation("/");
    },
    onError: (e: Error) => {
      toast({ title: "Login failed", description: e.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    login.mutate(form);
  };

  return (
    <div className="min-h-screen bg-[#fafaf3] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-[#9df197] flex items-center justify-center text-2xl">
            🌿
          </div>
          <h1 className="text-3xl font-extrabold text-[#1c6d25] [font-family:'Plus_Jakarta_Sans',Helvetica]">
            NutriSense
          </h1>
          <p className="text-sm font-bold tracking-[1.4px] text-[#b32d02] [font-family:'Manrope',Helvetica]">
            YOUR WELLNESS SANCTUARY
          </p>
        </div>

        <Card className="rounded-3xl border-0 bg-white shadow-sm">
          <CardContent className="p-8 flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-[#31332c] [font-family:'Plus_Jakarta_Sans',Helvetica]">
                Welcome back
              </h2>
              <p className="text-sm text-[#5d6058] [font-family:'Manrope',Helvetica] mt-1">
                Log in to your NutriSense account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-[#5d6058] [font-family:'Manrope',Helvetica]">
                  Email address
                </Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="rounded-xl border-[#e2e3d9] bg-[#fafaf3] focus:border-[#1c6d25]"
                  data-testid="input-email"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-[#5d6058] [font-family:'Manrope',Helvetica]">
                  Password
                </Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="rounded-xl border-[#e2e3d9] bg-[#fafaf3] focus:border-[#1c6d25]"
                  data-testid="input-password"
                />
              </div>
              <Button
                type="submit"
                disabled={login.isPending}
                className="w-full h-12 rounded-full bg-[#1c6d25] text-[#eaffe2] font-bold [font-family:'Manrope',Helvetica] hover:bg-[#185c20] mt-2"
                data-testid="button-login"
              >
                {login.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-sm text-[#5d6058] [font-family:'Manrope',Helvetica]">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setLocation("/register")}
                className="text-[#1c6d25] font-bold hover:underline"
              >
                Create one
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
