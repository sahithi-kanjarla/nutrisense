import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const dietTypes = [
  { value: "Vegetarian", emoji: "🥦", desc: "No meat or fish" },
  { value: "Vegan", emoji: "🌱", desc: "No animal products" },
  { value: "Non-Vegetarian", emoji: "🍗", desc: "Includes meat & fish" },
  { value: "Eggetarian", emoji: "🥚", desc: "Veg + eggs only" },
  { value: "Jain", emoji: "🙏", desc: "No root vegetables" },
];

const goalOptions = [
  { value: "Weight Loss", emoji: "⚖️" },
  { value: "Weight Gain", emoji: "💪" },
  { value: "Muscle Building", emoji: "🏋️" },
  { value: "Better Immunity", emoji: "🛡️" },
  { value: "Heart Health", emoji: "❤️" },
  { value: "Diabetes Management", emoji: "🩸" },
  { value: "General Wellness", emoji: "✨" },
  { value: "Better Digestion", emoji: "🌿" },
];

const allergyOptions = [
  "Gluten", "Dairy", "Nuts", "Soy", "Eggs", "Shellfish", "Peanuts", "Sesame",
];

const TOTAL_STEPS = 4;

export function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    age: "",
    weightKg: "",
    heightCm: "",
    dietType: "",
    healthGoals: [] as string[],
    allergies: [] as string[],
    dailyCalorieTarget: "2000",
    waterIntakeLitres: "2.5",
  });

  const saveProfile = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/profile/health", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          age: data.age ? parseInt(data.age) : null,
          weightKg: data.weightKg || null,
          heightCm: data.heightCm || null,
          dietType: data.dietType || "Vegetarian",
          healthGoals: data.healthGoals,
          allergies: data.allergies,
          dailyCalorieTarget: parseInt(data.dailyCalorieTarget) || 2000,
          waterIntakeLitres: data.waterIntakeLitres || "2.5",
        }),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      return res.json();
    },
    onSuccess: () => setLocation("/"),
    onError: () => {
      toast({ title: "Could not save profile", description: "You can update it later in Profile settings.", variant: "destructive" });
      setLocation("/");
    },
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

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
    else saveProfile.mutate(form);
  };

  const canProceed = () => {
    if (step === 2 && !form.dietType) return false;
    if (step === 3 && form.healthGoals.length === 0) return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-[#fafaf3] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-full bg-[#9df197] flex items-center justify-center text-xl">🌿</div>
          <h1 className="text-2xl font-extrabold text-[#1c6d25] [font-family:'Plus_Jakarta_Sans',Helvetica]">
            NutriSense
          </h1>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < step ? "bg-[#1c6d25]" : "bg-[#e2e3d9]"
              }`}
            />
          ))}
        </div>
        <p className="text-center text-xs font-bold text-[#5d6058] [font-family:'Manrope',Helvetica] -mt-3">
          Step {step} of {TOTAL_STEPS}
        </p>

        <Card className="rounded-3xl border-0 bg-white shadow-sm">
          <CardContent className="p-8 flex flex-col gap-6">

            {/* ── Step 1: Basic Info ── */}
            {step === 1 && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-[#31332c] [font-family:'Plus_Jakarta_Sans',Helvetica]">
                    Tell us about yourself
                  </h2>
                  <p className="text-sm text-[#5d6058] [font-family:'Manrope',Helvetica] mt-1">
                    This helps us personalise your nutrition insights.
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-bold text-[#5d6058] [font-family:'Manrope',Helvetica]">Age</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 28"
                      value={form.age}
                      onChange={(e) => setForm({ ...form, age: e.target.value })}
                      className="rounded-xl border-[#e2e3d9] bg-[#fafaf3]"
                      data-testid="input-age"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-bold text-[#5d6058] [font-family:'Manrope',Helvetica]">
                        Weight (kg)
                      </Label>
                      <Input
                        type="number"
                        placeholder="e.g. 65"
                        value={form.weightKg}
                        onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                        className="rounded-xl border-[#e2e3d9] bg-[#fafaf3]"
                        data-testid="input-weight"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-bold text-[#5d6058] [font-family:'Manrope',Helvetica]">
                        Height (cm)
                      </Label>
                      <Input
                        type="number"
                        placeholder="e.g. 165"
                        value={form.heightCm}
                        onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                        className="rounded-xl border-[#e2e3d9] bg-[#fafaf3]"
                        data-testid="input-height"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-bold text-[#5d6058] [font-family:'Manrope',Helvetica]">
                        Daily calorie goal
                      </Label>
                      <Input
                        type="number"
                        placeholder="2000"
                        value={form.dailyCalorieTarget}
                        onChange={(e) => setForm({ ...form, dailyCalorieTarget: e.target.value })}
                        className="rounded-xl border-[#e2e3d9] bg-[#fafaf3]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-bold text-[#5d6058] [font-family:'Manrope',Helvetica]">
                        Water intake (L/day)
                      </Label>
                      <Input
                        type="number"
                        placeholder="2.5"
                        value={form.waterIntakeLitres}
                        onChange={(e) => setForm({ ...form, waterIntakeLitres: e.target.value })}
                        className="rounded-xl border-[#e2e3d9] bg-[#fafaf3]"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Step 2: Diet Type ── */}
            {step === 2 && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-[#31332c] [font-family:'Plus_Jakarta_Sans',Helvetica]">
                    What's your diet type?
                  </h2>
                  <p className="text-sm text-[#5d6058] [font-family:'Manrope',Helvetica] mt-1">
                    We'll tailor recipes and meal plans accordingly.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  {dietTypes.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setForm({ ...form, dietType: d.value })}
                      className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all ${
                        form.dietType === d.value
                          ? "border-[#1c6d25] bg-[#eaffe2]"
                          : "border-[#e2e3d9] bg-[#fafaf3] hover:border-[#b1b3a9]"
                      }`}
                      data-testid={`diet-${d.value}`}
                    >
                      <span className="text-2xl">{d.emoji}</span>
                      <div>
                        <p className="font-bold text-[#31332c] [font-family:'Manrope',Helvetica]">{d.value}</p>
                        <p className="text-xs text-[#5d6058] [font-family:'Manrope',Helvetica]">{d.desc}</p>
                      </div>
                      {form.dietType === d.value && (
                        <span className="ml-auto text-[#1c6d25] font-bold text-lg">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ── Step 3: Health Goals ── */}
            {step === 3 && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-[#31332c] [font-family:'Plus_Jakarta_Sans',Helvetica]">
                    What are your health goals?
                  </h2>
                  <p className="text-sm text-[#5d6058] [font-family:'Manrope',Helvetica] mt-1">
                    Pick as many as apply — we'll personalise your insights.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {goalOptions.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => toggleGoal(g.value)}
                      className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold [font-family:'Manrope',Helvetica] transition-all border-2 ${
                        form.healthGoals.includes(g.value)
                          ? "border-[#1c6d25] bg-[#1c6d25] text-[#eaffe2]"
                          : "border-[#e2e3d9] bg-[#fafaf3] text-[#5d6058] hover:border-[#b1b3a9]"
                      }`}
                      data-testid={`goal-${g.value}`}
                    >
                      <span>{g.emoji}</span>
                      <span>{g.value}</span>
                    </button>
                  ))}
                </div>
                {form.healthGoals.length === 0 && (
                  <p className="text-xs text-[#b32d02] [font-family:'Manrope',Helvetica]">
                    Please select at least one goal to continue.
                  </p>
                )}
              </>
            )}

            {/* ── Step 4: Allergies ── */}
            {step === 4 && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-[#31332c] [font-family:'Plus_Jakarta_Sans',Helvetica]">
                    Any food allergies or intolerances?
                  </h2>
                  <p className="text-sm text-[#5d6058] [font-family:'Manrope',Helvetica] mt-1">
                    Optional — we'll avoid these in your meal suggestions.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {allergyOptions.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAllergy(a)}
                      className={`rounded-full px-4 py-2.5 text-sm font-bold [font-family:'Manrope',Helvetica] transition-all border-2 ${
                        form.allergies.includes(a)
                          ? "border-[#aa371c] bg-[#aa371c] text-white"
                          : "border-[#e2e3d9] bg-[#fafaf3] text-[#5d6058] hover:border-[#b1b3a9]"
                      }`}
                      data-testid={`allergy-${a}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <div className="rounded-2xl bg-[#f4f4ec] p-4">
                  <p className="text-xs text-[#5d6058] [font-family:'Manrope',Helvetica]">
                    🎉 Almost there! After this, you'll land on your personalised NutriSense dashboard.
                  </p>
                </div>
              </>
            )}

            {/* Footer buttons */}
            <div className="flex gap-3 mt-2">
              {step > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 h-12 rounded-full border border-[#e2e3d9] text-[#5d6058] font-bold [font-family:'Manrope',Helvetica] hover:bg-[#f4f4ec]"
                >
                  Back
                </Button>
              )}
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed() || saveProfile.isPending}
                className="flex-1 h-12 rounded-full bg-[#1c6d25] text-[#eaffe2] font-bold [font-family:'Manrope',Helvetica] hover:bg-[#185c20] disabled:opacity-50"
                data-testid="button-next"
              >
                {saveProfile.isPending
                  ? "Saving..."
                  : step === TOTAL_STEPS
                  ? "Go to Dashboard →"
                  : "Continue →"}
              </Button>
            </div>

            {/* Skip option */}
            {step !== 3 && (
              <button
                type="button"
                onClick={() => {
                  if (step === TOTAL_STEPS) saveProfile.mutate(form);
                  else setStep(step + 1);
                }}
                className="text-center text-xs text-[#b1b3a9] hover:text-[#5d6058] [font-family:'Manrope',Helvetica] -mt-2"
              >
                Skip this step
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
