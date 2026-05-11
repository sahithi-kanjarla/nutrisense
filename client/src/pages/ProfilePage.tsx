import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { HealthProfile } from "@shared/schema";

const dietTypes = ["Vegetarian", "Vegan", "Non-Vegetarian", "Jain", "Eggetarian"];
const goalOptions = ["Weight Loss", "Weight Gain", "Muscle Building", "Better Immunity", "Heart Health", "Diabetes Management", "General Wellness"];
const commonAllergies = ["Gluten", "Dairy", "Nuts", "Soy", "Eggs", "Shellfish"];

export function ProfilePage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery<HealthProfile | null>({ queryKey: ["/api/profile/health"] });

  const [form, setForm] = useState({
    age: "",
    weightKg: "",
    heightCm: "",
    dietType: "Vegetarian",
    dailyCalorieTarget: "2000",
    waterIntakeLitres: "2.5",
    healthGoals: [] as string[],
    allergies: [] as string[],
  });

  useEffect(() => {
    if (profile) {
      setForm({
        age: String(profile.age || ""),
        weightKg: String(profile.weightKg || ""),
        heightCm: String(profile.heightCm || ""),
        dietType: profile.dietType || "Vegetarian",
        dailyCalorieTarget: String(profile.dailyCalorieTarget || "2000"),
        waterIntakeLitres: String(profile.waterIntakeLitres || "2.5"),
        healthGoals: profile.healthGoals || [],
        allergies: profile.allergies || [],
      });
    }
  }, [profile]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/profile/health", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: user?.id,
          age: form.age ? Number(form.age) : undefined,
          weightKg: form.weightKg || undefined,
          heightCm: form.heightCm || undefined,
          dietType: form.dietType,
          dailyCalorieTarget: Number(form.dailyCalorieTarget),
          waterIntakeLitres: form.waterIntakeLitres || undefined,
          healthGoals: form.healthGoals,
          allergies: form.allergies,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile/health"] });
      toast({ title: "Profile saved!", description: "Your health profile has been updated." });
    },
    onError: () => toast({ title: "Error", description: "Could not save profile.", variant: "destructive" }),
  });

  const toggleGoal = (goal: string) => {
    setForm((f) => ({
      ...f,
      healthGoals: f.healthGoals.includes(goal)
        ? f.healthGoals.filter((g) => g !== goal)
        : [...f.healthGoals, goal],
    }));
  };

  const toggleAllergy = (allergy: string) => {
    setForm((f) => ({
      ...f,
      allergies: f.allergies.includes(allergy)
        ? f.allergies.filter((a) => a !== allergy)
        : [...f.allergies, allergy],
    }));
  };

  const bmi =
    form.weightKg && form.heightCm
      ? (Number(form.weightKg) / Math.pow(Number(form.heightCm) / 100, 2)).toFixed(1)
      : null;

  return (
    <section className="relative w-full px-8 pt-12 pb-24">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-10">
        {/* Header */}
        <header className="flex w-full flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-2">
            <p className="[font-family:'Manrope',Helvetica] text-sm font-bold tracking-[1.4px] text-[#b32d02]">
              YOUR WELLNESS PROFILE
            </p>
            <h2 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-5xl font-extrabold tracking-tight text-[#31332c]">
              Profile
            </h2>
            <p className="[font-family:'Manrope',Helvetica] text-lg text-[#5d6058]">
              Personalise NutriSense to your dietary needs and health goals.
            </p>
          </div>
          <Button
            onClick={() => logout()}
            variant="ghost"
            className="h-auto rounded-full bg-[#e2e3d9] px-6 py-3 font-bold text-[#aa371c] [font-family:'Manrope',Helvetica] hover:bg-[#d9dbcf]"
          >
            Log Out
          </Button>
        </header>

        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-12">
          <main className="flex flex-col gap-8 lg:col-span-8">
            {/* User Info */}
            <Card className="rounded-[48px] border-0 bg-[#f4f4ec] shadow-none">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  {user?.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#9df197] flex items-center justify-center text-2xl font-bold text-[#1c6d25] [font-family:'Plus_Jakarta_Sans',Helvetica]">
                      {user?.firstName?.[0] || "U"}
                    </div>
                  )}
                  <div>
                    <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c]">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="[font-family:'Manrope',Helvetica] text-sm text-[#5d6058]">{user?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Body Stats */}
            <Card className="rounded-[48px] border-0 bg-[#f4f4ec] shadow-none">
              <CardContent className="p-8">
                <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c] mb-6">
                  Body Stats
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div>
                    <Label className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">Age</Label>
                    <Input
                      type="number"
                      className="mt-1 rounded-xl border-[#b1b3a9] bg-white"
                      placeholder="Years"
                      value={form.age}
                      onChange={(e) => setForm({ ...form, age: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">Weight (kg)</Label>
                    <Input
                      type="number"
                      className="mt-1 rounded-xl border-[#b1b3a9] bg-white"
                      placeholder="kg"
                      value={form.weightKg}
                      onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">Height (cm)</Label>
                    <Input
                      type="number"
                      className="mt-1 rounded-xl border-[#b1b3a9] bg-white"
                      placeholder="cm"
                      value={form.heightCm}
                      onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                    />
                  </div>
                </div>
                {bmi && (
                  <div className="mt-4 rounded-2xl bg-[#9df197] px-5 py-3 inline-flex items-center gap-2">
                    <span className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#005c15]">BMI</span>
                    <span className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-lg font-extrabold text-[#1c6d25]">{bmi}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Diet Type */}
            <Card className="rounded-[48px] border-0 bg-[#f4f4ec] shadow-none">
              <CardContent className="p-8">
                <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c] mb-5">
                  Diet Type
                </h3>
                <div className="flex flex-wrap gap-3">
                  {dietTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setForm({ ...form, dietType: type })}
                      className={`rounded-full px-5 py-2 text-sm font-bold [font-family:'Manrope',Helvetica] transition-colors ${
                        form.dietType === type
                          ? "bg-[#1c6d25] text-[#eaffe2]"
                          : "bg-white text-[#5d6058] border border-[#b1b3a91a] hover:bg-[#f4f4ec]"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Health Goals */}
            <Card className="rounded-[48px] border-0 bg-[#f4f4ec] shadow-none">
              <CardContent className="p-8">
                <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c] mb-5">
                  Health Goals
                </h3>
                <div className="flex flex-wrap gap-3">
                  {goalOptions.map((goal) => (
                    <button
                      key={goal}
                      onClick={() => toggleGoal(goal)}
                      className={`rounded-full px-4 py-2 text-sm font-bold [font-family:'Manrope',Helvetica] transition-colors ${
                        form.healthGoals.includes(goal)
                          ? "bg-[#9df197] text-[#005c15]"
                          : "bg-white text-[#5d6058] border border-[#b1b3a91a] hover:bg-[#f0fff0]"
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Allergies */}
            <Card className="rounded-[48px] border-0 bg-[#f4f4ec] shadow-none">
              <CardContent className="p-8">
                <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c] mb-5">
                  Food Allergies & Intolerances
                </h3>
                <div className="flex flex-wrap gap-3">
                  {commonAllergies.map((allergy) => (
                    <button
                      key={allergy}
                      onClick={() => toggleAllergy(allergy)}
                      className={`rounded-full px-4 py-2 text-sm font-bold [font-family:'Manrope',Helvetica] transition-colors ${
                        form.allergies.includes(allergy)
                          ? "bg-[#aa371c] text-white"
                          : "bg-white text-[#5d6058] border border-[#b1b3a91a] hover:bg-[#fff5f3]"
                      }`}
                    >
                      {allergy}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Calorie Target */}
            <Card className="rounded-[48px] border-0 bg-[#f4f4ec] shadow-none">
              <CardContent className="p-8">
                <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c] mb-5">
                  Daily Targets
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">Daily Calorie Target (kcal)</Label>
                    <Input
                      type="number"
                      className="mt-1 rounded-xl border-[#b1b3a9] bg-white"
                      value={form.dailyCalorieTarget}
                      onChange={(e) => setForm({ ...form, dailyCalorieTarget: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">Daily Water Target (litres)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      className="mt-1 rounded-xl border-[#b1b3a9] bg-white"
                      value={form.waterIntakeLitres}
                      onChange={(e) => setForm({ ...form, waterIntakeLitres: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={() => saveProfile.mutate()}
              disabled={saveProfile.isPending}
              className="w-full h-14 rounded-full bg-[#1c6d25] text-[#eaffe2] text-base font-bold [font-family:'Manrope',Helvetica] hover:bg-[#185c20]"
            >
              {saveProfile.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </main>

          <aside className="flex flex-col gap-6 lg:col-span-4">
            <Card className="rounded-[48px] border-0 bg-[#ffdeac] shadow-none">
              <CardContent className="p-6">
                <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-base font-bold text-[#6e4b00] mb-3">
                  Your Summary
                </h3>
                <div className="flex flex-col gap-3 text-sm [font-family:'Manrope',Helvetica]">
                  <div className="flex justify-between">
                    <span className="text-[#7f5700]">Diet Type</span>
                    <span className="font-bold text-[#6e4b00]">{form.dietType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7f5700]">Calorie Target</span>
                    <span className="font-bold text-[#6e4b00]">{form.dailyCalorieTarget} kcal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7f5700]">Water Goal</span>
                    <span className="font-bold text-[#6e4b00]">{form.waterIntakeLitres}L</span>
                  </div>
                  {bmi && (
                    <div className="flex justify-between">
                      <span className="text-[#7f5700]">BMI</span>
                      <span className="font-bold text-[#6e4b00]">{bmi}</span>
                    </div>
                  )}
                </div>
                {form.healthGoals.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {form.healthGoals.map((g) => (
                      <Badge key={g} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#7f5700] hover:bg-white [font-family:'Manrope',Helvetica]">
                        {g}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[48px] border-0 bg-[#e8e9df] shadow-none">
              <CardContent className="p-6">
                <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-base font-bold text-[#31332c] mb-3">
                  Why this matters
                </h3>
                <p className="[font-family:'Manrope',Helvetica] text-sm text-[#5d6058] leading-relaxed">
                  NutriSense uses your profile to personalise AI meal plans, expiry alerts, and nutrition insights specifically for your diet type and health goals.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </section>
  );
}
