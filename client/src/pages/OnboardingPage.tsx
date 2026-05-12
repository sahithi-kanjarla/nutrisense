import { useState, useMemo } from "react";
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
  { value: "Weight Loss", emoji: "⚖️", calorieOffset: -400 },
  { value: "Weight Gain", emoji: "💪", calorieOffset: 400 },
  { value: "Muscle Building", emoji: "🏋️", calorieOffset: 300 },
  { value: "Better Immunity", emoji: "🛡️", calorieOffset: 0 },
  { value: "Heart Health", emoji: "❤️", calorieOffset: -100 },
  { value: "Diabetes Management", emoji: "🩸", calorieOffset: -200 },
  { value: "General Wellness", emoji: "✨", calorieOffset: 0 },
  { value: "Better Digestion", emoji: "🌿", calorieOffset: 0 },
];

const allergyOptions = [
  "Gluten", "Dairy", "Nuts", "Soy", "Eggs", "Shellfish", "Peanuts", "Sesame",
];

const TOTAL_STEPS = 4;

function calcSuggestedCalories(age: string, weightKg: string, heightCm: string, goals: string[]): number | null {
  const a = parseInt(age), w = parseFloat(weightKg), h = parseFloat(heightCm);
  if (!a || !w || !h) return null;
  // Mifflin-St Jeor (gender-neutral average)
  const bmr = 10 * w + 6.25 * h - 5 * a;
  const tdee = Math.round(bmr * 1.4); // moderate activity
  const primaryGoal = goalOptions.find((g) => goals.includes(g.value));
  const offset = primaryGoal?.calorieOffset ?? 0;
  return Math.max(1200, Math.min(4000, tdee + offset));
}

export function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [customAllergy, setCustomAllergy] = useState("");
  const [form, setForm] = useState({
    age: "",
    weightKg: "",
    heightCm: "",
    dietType: "",
    healthGoals: [] as string[],
    allergies: [] as string[],
    waterIntakeLitres: "2.5",
  });

  const suggestedCalories = useMemo(
    () => calcSuggestedCalories(form.age, form.weightKg, form.heightCm, form.healthGoals),
    [form.age, form.weightKg, form.heightCm, form.healthGoals]
  );

  const saveProfile = useMutation({
    mutationFn: async (data: typeof form) => {
      const calories = suggestedCalories || 2000;
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
          dailyCalorieTarget: calories,
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

  const toggleGoal = (goal: string) =>
    setForm((f) => ({
      ...f,
      healthGoals: f.healthGoals.includes(goal)
        ? f.healthGoals.filter((g) => g !== goal)
        : [...f.healthGoals, goal],
    }));

  const toggleAllergy = (allergy: string) =>
    setForm((f) => ({
      ...f,
      allergies: f.allergies.includes(allergy)
        ? f.allergies.filter((a) => a !== allergy)
        : [...f.allergies, allergy],
    }));

  const addCustomAllergy = () => {
    const val = customAllergy.trim();
    if (!val) return;
    if (!form.allergies.includes(val)) {
      setForm((f) => ({ ...f, allergies: [...f.allergies, val] }));
    }
    setCustomAllergy("");
  };

  const removeAllergy = (a: string) =>
    setForm((f) => ({ ...f, allergies: f.allergies.filter((x) => x !== a) }));

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
          <h1 className="text-2xl font-extrabold text-[#1c6d25] [font-family:'Plus_Jakarta_Sans',Helvetica]">NutriSense</h1>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < step ? "bg-[#1c6d25]" : "bg-[#e2e3d9]"}`} />
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
                  <h2 className="text-xl font-bold text-[#31332c] [font-family:'Plus_Jakarta_Sans',Helvetica]">Tell us about yourself</h2>
                  <p className="text-sm text-[#5d6058] [font-family:'Manrope',Helvetica] mt-1">
                    We'll use this to calculate your ideal calorie and nutrition targets.
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
                      <Label className="text-xs font-bold text-[#5d6058] [font-family:'Manrope',Helvetica]">Weight (kg)</Label>
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
                      <Label className="text-xs font-bold text-[#5d6058] [font-family:'Manrope',Helvetica]">Height (cm)</Label>
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
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-bold text-[#5d6058] [font-family:'Manrope',Helvetica]">Water intake goal (L/day)</Label>
                    <Input
                      type="number"
                      placeholder="2.5"
                      value={form.waterIntakeLitres}
                      onChange={(e) => setForm({ ...form, waterIntakeLitres: e.target.value })}
                      className="rounded-xl border-[#e2e3d9] bg-[#fafaf3]"
                    />
                  </div>
                  <div className="rounded-2xl bg-[#f4f4ec] p-4 text-xs text-[#5d6058] [font-family:'Manrope',Helvetica]">
                    💡 Your daily calorie target will be automatically calculated based on your body stats and goals — no guesswork needed!
                  </div>
                </div>
              </>
            )}

            {/* ── Step 2: Diet Type ── */}
            {step === 2 && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-[#31332c] [font-family:'Plus_Jakarta_Sans',Helvetica]">What's your diet type?</h2>
                  <p className="text-sm text-[#5d6058] [font-family:'Manrope',Helvetica] mt-1">We'll tailor recipes and meal plans accordingly.</p>
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
                      {form.dietType === d.value && <span className="ml-auto text-[#1c6d25] font-bold text-lg">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ── Step 3: Health Goals ── */}
            {step === 3 && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-[#31332c] [font-family:'Plus_Jakarta_Sans',Helvetica]">What are your health goals?</h2>
                  <p className="text-sm text-[#5d6058] [font-family:'Manrope',Helvetica] mt-1">
                    Pick as many as apply — we'll calculate your calorie target and personalise your plan.
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

                {/* Smart calorie suggestion */}
                {suggestedCalories && form.healthGoals.length > 0 ? (
                  <div className="rounded-2xl bg-[#eaffe2] border border-[#9df197] p-4 flex items-center gap-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="text-xs font-bold text-[#1c6d25] [font-family:'Manrope',Helvetica]">RECOMMENDED FOR YOU</p>
                      <p className="text-xl font-extrabold text-[#1c6d25] [font-family:'Plus_Jakarta_Sans',Helvetica]">{suggestedCalories} kcal/day</p>
                      <p className="text-xs text-[#5d6058] [font-family:'Manrope',Helvetica]">
                        Based on your body stats + {form.healthGoals[0]}
                      </p>
                    </div>
                  </div>
                ) : form.healthGoals.length === 0 ? (
                  <p className="text-xs text-[#b32d02] [font-family:'Manrope',Helvetica]">Please select at least one goal to continue.</p>
                ) : (
                  <div className="rounded-2xl bg-[#f4f4ec] p-4 text-xs text-[#5d6058] [font-family:'Manrope',Helvetica]">
                    💡 Add your age, weight & height in Step 1 to get a personalised calorie recommendation.
                  </div>
                )}
              </>
            )}

            {/* ── Step 4: Allergies ── */}
            {step === 4 && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-[#31332c] [font-family:'Plus_Jakarta_Sans',Helvetica]">Any food allergies or intolerances?</h2>
                  <p className="text-sm text-[#5d6058] [font-family:'Manrope',Helvetica] mt-1">
                    Optional — we'll avoid these in your meal suggestions.
                  </p>
                </div>

                {/* Preset allergies */}
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

                {/* Custom allergy input */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-bold text-[#5d6058] [font-family:'Manrope',Helvetica]">Add your own (e.g. Mustard, Fish)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type allergy name..."
                      value={customAllergy}
                      onChange={(e) => setCustomAllergy(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCustomAllergy()}
                      className="rounded-xl border-[#e2e3d9] bg-[#fafaf3] flex-1"
                      data-testid="input-custom-allergy"
                    />
                    <Button
                      type="button"
                      onClick={addCustomAllergy}
                      className="rounded-xl bg-[#aa371c] text-white font-bold [font-family:'Manrope',Helvetica] hover:bg-[#8f2d17] px-4"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {/* All selected allergies (including custom) */}
                {form.allergies.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-bold text-[#5d6058] [font-family:'Manrope',Helvetica]">Selected allergies:</p>
                    <div className="flex flex-wrap gap-2">
                      {form.allergies.map((a) => (
                        <span
                          key={a}
                          className="flex items-center gap-1.5 rounded-full bg-[#aa371c] text-white px-3 py-1 text-xs font-bold [font-family:'Manrope',Helvetica]"
                        >
                          {a}
                          <button type="button" onClick={() => removeAllergy(a)} className="hover:opacity-70 text-sm leading-none">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

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
                {saveProfile.isPending ? "Saving..." : step === TOTAL_STEPS ? "Go to Dashboard →" : "Continue →"}
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
