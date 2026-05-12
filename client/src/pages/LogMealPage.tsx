import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Meal, HealthProfile } from "@shared/schema";

const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack", "Tea"];

const unitOptions = [
  { label: "g (grams)", value: "g" },
  { label: "kg", value: "kg" },
  { label: "ml", value: "ml" },
  { label: "bowl", value: "bowl" },
  { label: "katori", value: "katori" },
  { label: "plate", value: "plate" },
  { label: "cup", value: "cup" },
  { label: "piece", value: "piece" },
  { label: "slice", value: "slice" },
  { label: "whole", value: "whole" },
  { label: "tbsp", value: "tbsp" },
  { label: "tsp", value: "tsp" },
  { label: "handful", value: "handful" },
];

const commonIndianMeals = [
  { name: "Idli Sambar", type: "Breakfast", calories: 250, protein: 9, carbs: 42, fats: 4, fiber: 5, iron: 2.8, items: ["Idli", "Sambar", "Coconut Chutney"] },
  { name: "Poha", type: "Breakfast", calories: 200, protein: 5, carbs: 36, fats: 5, fiber: 3, iron: 2.1, items: ["Flattened Rice", "Onion", "Mustard Seeds", "Curry Leaves"] },
  { name: "Dal Tadka & Rice", type: "Lunch", calories: 450, protein: 18, carbs: 72, fats: 8, fiber: 9, iron: 4.5, items: ["Moong Dal", "Basmati Rice", "Ghee", "Jeera"] },
  { name: "Roti Sabzi", type: "Lunch", calories: 350, protein: 12, carbs: 55, fats: 9, fiber: 7, iron: 3.2, items: ["Whole Wheat Roti", "Mixed Vegetables", "Masala"] },
  { name: "Chicken Curry", type: "Dinner", calories: 380, protein: 32, carbs: 12, fats: 22, fiber: 2, iron: 1.9, items: ["Chicken", "Tomatoes", "Onions", "Garam Masala"] },
  { name: "Paneer Butter Masala", type: "Dinner", calories: 420, protein: 18, carbs: 22, fats: 30, fiber: 3, iron: 1.4, items: ["Paneer", "Butter", "Cream", "Tomato Gravy"] },
  { name: "Masala Chai", type: "Tea", calories: 80, protein: 3, carbs: 12, fats: 3, fiber: 0, iron: 0.2, items: ["Tea", "Milk", "Ginger", "Cardamom"] },
  { name: "Upma", type: "Breakfast", calories: 220, protein: 6, carbs: 38, fats: 6, fiber: 4, iron: 2.0, items: ["Semolina", "Vegetables", "Mustard Seeds"] },
];

const NutriBadge = ({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) => (
  <div className={`flex flex-col items-center rounded-2xl px-3 py-2 ${color}`}>
    <span className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-sm font-extrabold text-[#31332c]">{value}{unit}</span>
    <span className="[font-family:'Manrope',Helvetica] text-[10px] font-bold text-[#5d6058]">{label}</span>
  </div>
);

function groupMealsByDate(meals: Meal[]) {
  const groups: Record<string, Meal[]> = {};
  for (const meal of meals) {
    const date = new Date(meal.loggedAt!).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
    if (!groups[date]) groups[date] = [];
    groups[date].push(meal);
  }
  return groups;
}

async function imageToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({ base64: result.split(",")[1], mimeType: file.type });
    };
    reader.readAsDataURL(file);
  });
}

type NutritionValues = { calories: number; protein: number; carbs: number; fats: number; fiber: number; iron: number };

export function LogMealPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [allergyFlag, setAllergyFlag] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    mealType: "Lunch",
    quantity: "1",
    unit: "bowl",
    nutrition: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, iron: 0 } as NutritionValues,
    nutritionCalculated: false,
  });

  const { data: meals = [] } = useQuery<Meal[]>({ queryKey: ["/api/meals"] });
  const { data: profile } = useQuery<HealthProfile | null>({ queryKey: ["/api/profile/health"] });

  const calorieTarget = profile?.dailyCalorieTarget || 2000;
  const proteinTarget = Math.round(calorieTarget * 0.20 / 4);
  const carbTarget = Math.round(calorieTarget * 0.50 / 4);
  const fatTarget = Math.round(calorieTarget * 0.30 / 9);
  const ironTarget = 17;

  const todayMeals = meals.filter((m) => new Date(m.loggedAt!).toDateString() === new Date().toDateString());
  const todayCals = todayMeals.reduce((s, m) => s + (m.calories || 0), 0);
  const todayProtein = todayMeals.reduce((s, m) => s + Number(m.protein || 0), 0);
  const todayCarbs = todayMeals.reduce((s, m) => s + Number(m.carbs || 0), 0);
  const todayFats = todayMeals.reduce((s, m) => s + Number(m.fats || 0), 0);
  const todayFiber = todayMeals.reduce((s, m) => s + Number(m.fiber || 0), 0);

  const addMeal = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to log meal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      setOpen(false);
      resetForm();
      toast({ title: "Meal logged!", description: "Your meal has been saved." });
    },
    onError: () => toast({ title: "Error", description: "Could not log meal.", variant: "destructive" }),
  });

  const deleteMeal = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/meals/${id}`, { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/meals"] }),
  });

  const resetForm = () => {
    setForm({ name: "", mealType: "Lunch", quantity: "1", unit: "bowl", nutrition: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, iron: 0 }, nutritionCalculated: false });
    setScanPreview(null);
    setAllergyFlag(null);
  };

  const handleImageScan = async (file: File) => {
    setScanLoading(true);
    setScanPreview(URL.createObjectURL(file));
    try {
      const { base64, mimeType } = await imageToBase64(file);
      const res = await fetch("/api/ai/scan-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ base64, mimeType }),
      });
      const data = await res.json();
      if (data.name) {
        setForm((f) => ({
          ...f,
          name: data.name,
          quantity: data.defaultQty || "1",
          unit: data.defaultUnit || "bowl",
          nutrition: {
            calories: data.nutrition?.calories || 0,
            protein: data.nutrition?.protein || 0,
            carbs: data.nutrition?.carbs || 0,
            fats: data.nutrition?.fats || 0,
            fiber: data.nutrition?.fiber || 0,
            iron: data.nutrition?.iron || 0,
          },
          nutritionCalculated: true,
        }));
        if (data.allergyFlag) setAllergyFlag(data.allergyFlag);
        setScanOpen(false);
        setOpen(true);
        toast({ title: `Detected: ${data.name}`, description: data.servingSize ? `Serving: ${data.servingSize}` : "You can adjust the quantity." });
      } else {
        toast({ title: "Could not detect food", description: "Try a clearer photo or add manually.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Scan failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setScanLoading(false);
    }
  };

  const calculateNutrition = async () => {
    if (!form.name.trim()) return toast({ title: "Enter a meal name first", variant: "destructive" });
    setCalcLoading(true);
    try {
      const res = await fetch("/api/ai/calculate-nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ foodName: form.name, quantity: form.quantity, unit: form.unit }),
      });
      const data = await res.json();
      setForm((f) => ({
        ...f,
        nutrition: {
          calories: data.calories || 0,
          protein: data.protein || 0,
          carbs: data.carbs || 0,
          fats: data.fats || 0,
          fiber: data.fiber || 0,
          iron: data.iron || 0,
        },
        nutritionCalculated: true,
      }));
      toast({ title: "Nutrition calculated!", description: data.servingDescription || "" });
    } catch {
      toast({ title: "Could not calculate", description: "Enter values manually below.", variant: "destructive" });
    } finally {
      setCalcLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return toast({ title: "Please enter a meal name", variant: "destructive" });
    addMeal.mutate({
      name: form.name,
      mealType: form.mealType,
      calories: form.nutrition.calories || undefined,
      protein: form.nutrition.protein || undefined,
      carbs: form.nutrition.carbs || undefined,
      fats: form.nutrition.fats || undefined,
      fiber: form.nutrition.fiber || undefined,
    });
  };

  const handleQuickAdd = (preset: typeof commonIndianMeals[0]) => {
    addMeal.mutate({
      name: preset.name,
      mealType: preset.type,
      calories: preset.calories,
      protein: String(preset.protein),
      carbs: String(preset.carbs),
      fats: String(preset.fats),
      fiber: String(preset.fiber),
      items: preset.items,
    });
  };

  const grouped = groupMealsByDate(meals);

  const MiniBar = ({ val, max, color }: { val: number; max: number; color: string }) => (
    <div className="h-1.5 w-full rounded-full bg-[#e2e3d9] overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min((val / max) * 100, 100)}%` }} />
    </div>
  );

  return (
    <section className="relative w-full px-8 pt-12 pb-24">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleImageScan(e.target.files[0]); e.target.value = ""; }} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleImageScan(e.target.files[0]); e.target.value = ""; }} />

      {/* Scan Modal */}
      <Dialog open={scanOpen} onOpenChange={(o) => { setScanOpen(o); if (!o) setScanPreview(null); }}>
        <DialogContent className="rounded-3xl bg-[#fafaf3] border-0 max-w-sm">
          <DialogHeader>
            <DialogTitle className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c]">
              📷 Scan Your Meal
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {scanPreview && <img src={scanPreview} alt="Meal preview" className="w-full max-h-48 object-contain rounded-2xl bg-[#f4f4ec]" />}
            {scanLoading ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-10 h-10 border-4 border-[#1c6d25] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm [font-family:'Manrope',Helvetica] text-[#5d6058]">Identifying your meal...</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-[#5d6058] [font-family:'Manrope',Helvetica]">
                  Take a photo or upload an image of your food. AI will detect the dish and estimate nutrition automatically.
                </p>
                <Button onClick={() => cameraInputRef.current?.click()} className="w-full rounded-full bg-[#1c6d25] text-[#eaffe2] font-bold [font-family:'Manrope',Helvetica] hover:bg-[#185c20]">
                  📷 Use Camera
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} variant="ghost" className="w-full rounded-full border border-[#e2e3d9] text-[#31332c] font-bold [font-family:'Manrope',Helvetica] hover:bg-[#f4f4ec]">
                  🖼️ Upload Image
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Meal Modal */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="rounded-3xl bg-[#fafaf3] border-0 max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c]">Log a Meal</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {allergyFlag && (
              <div className="rounded-2xl bg-[#fff3cd] border border-[#ffc107] p-3 text-sm [font-family:'Manrope',Helvetica] font-bold text-[#856404]">
                ⚠️ This dish may contain {allergyFlag}, which you're allergic to. Proceed with caution.
              </div>
            )}

            {/* Meal Name */}
            <div>
              <Label className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">Meal Name *</Label>
              <Input className="mt-1 rounded-xl border-[#b1b3a9] bg-white" placeholder="e.g. Dal Tadka, Idli Sambar, Poha..."
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, nutritionCalculated: false })} />
            </div>

            {/* Meal Type */}
            <div>
              <Label className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">Meal Type</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {mealTypes.map((type) => (
                  <button key={type} type="button" onClick={() => setForm({ ...form, mealType: type })}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold [font-family:'Manrope',Helvetica] transition-colors ${
                      form.mealType === type ? "bg-[#1c6d25] text-[#eaffe2]" : "bg-[#e2e3d9] text-[#5d6058] hover:bg-[#d9dbcf]"}`}>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity + Unit */}
            <div>
              <Label className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">How much did you eat?</Label>
              <div className="mt-1 flex gap-2">
                <Input type="number" className="rounded-xl border-[#b1b3a9] bg-white w-24"
                  value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value, nutritionCalculated: false })} />
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value, nutritionCalculated: false })}
                  className="flex-1 rounded-xl border border-[#b1b3a9] bg-white px-3 text-sm [font-family:'Manrope',Helvetica] text-[#31332c]"
                >
                  {unitOptions.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calculate Nutrition Button */}
            <Button type="button" onClick={calculateNutrition} disabled={calcLoading || !form.name.trim()}
              variant="ghost"
              className="w-full rounded-full border-2 border-[#9df197] text-[#1c6d25] font-bold [font-family:'Manrope',Helvetica] hover:bg-[#eaffe2]">
              {calcLoading ? "Calculating..." : form.nutritionCalculated ? "✓ Nutrition Estimated — Recalculate" : "✨ Auto-Calculate Nutrition (AI)"}
            </Button>

            {/* Nutrition fields (editable) */}
            <div className="rounded-2xl bg-[#f4f4ec] p-4">
              <p className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058] mb-3">Nutrition (per serving — edit if needed)</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "calories", label: "Calories", unit: "kcal" },
                  { key: "protein", label: "Protein", unit: "g" },
                  { key: "carbs", label: "Carbs", unit: "g" },
                  { key: "fats", label: "Fats", unit: "g" },
                  { key: "fiber", label: "Fiber", unit: "g" },
                  { key: "iron", label: "Iron", unit: "mg" },
                ].map(({ key, label, unit }) => (
                  <div key={key}>
                    <Label className="[font-family:'Manrope',Helvetica] text-[10px] font-bold text-[#5d6058]">{label} ({unit})</Label>
                    <Input type="number" className="mt-0.5 rounded-lg border-[#b1b3a9] bg-white text-sm h-8 px-2"
                      value={(form.nutrition as any)[key] || ""}
                      onChange={(e) => setForm((f) => ({ ...f, nutrition: { ...f.nutrition, [key]: Number(e.target.value) } }))} />
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={addMeal.isPending}
              className="w-full rounded-full bg-[#1c6d25] text-[#eaffe2] font-bold [font-family:'Manrope',Helvetica] hover:bg-[#185c20]">
              {addMeal.isPending ? "Saving..." : "Save Meal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-10">
        {/* Header */}
        <header className="flex w-full flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-2">
            <p className="[font-family:'Manrope',Helvetica] text-sm font-bold tracking-[1.4px] text-[#b32d02]">TRACK YOUR NUTRITION</p>
            <h2 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-5xl font-extrabold tracking-tight text-[#31332c]">Log Meal</h2>
            <p className="[font-family:'Manrope',Helvetica] text-lg text-[#5d6058]">Track your daily meals with photo scan or manual entry.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => { setScanPreview(null); setScanOpen(true); }}
              variant="ghost" className="h-auto rounded-full bg-[#e2e3d9] px-6 py-3 font-bold text-[#31332c] [font-family:'Manrope',Helvetica] hover:bg-[#d9dbcf]">
              📷 Photo Log
            </Button>
            <Button onClick={() => { resetForm(); setOpen(true); }}
              className="h-auto rounded-full bg-[#1c6d25] px-6 py-3 font-bold text-[#eaffe2] [font-family:'Manrope',Helvetica] hover:bg-[#185c20]">
              + Manual Log
            </Button>
          </div>
        </header>

        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-12">
          <main className="flex flex-col gap-8 lg:col-span-8">
            {/* Quick Add */}
            <Card className="rounded-[48px] border-0 bg-[#f4f4ec] shadow-none">
              <CardContent className="p-8">
                <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c] mb-5">Quick Add — Common Indian Meals</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {commonIndianMeals.map((preset) => (
                    <button key={preset.name} onClick={() => handleQuickAdd(preset)} disabled={addMeal.isPending}
                      className="flex items-center justify-between rounded-2xl bg-white p-4 border border-[#b1b3a91a] hover:border-[#9df197] hover:bg-[#f0fff0] transition-colors text-left">
                      <div className="flex-1 min-w-0">
                        <p className="[font-family:'Manrope',Helvetica] font-bold text-sm text-[#31332c]">{preset.name}</p>
                        <p className="[font-family:'Manrope',Helvetica] text-xs text-[#5d6058]">{preset.type} · {preset.calories} kcal</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] [font-family:'Manrope',Helvetica] text-[#1c6d25] font-bold">P: {preset.protein}g</span>
                          <span className="text-[10px] [font-family:'Manrope',Helvetica] text-[#5d6058]">C: {preset.carbs}g</span>
                          <span className="text-[10px] [font-family:'Manrope',Helvetica] text-[#5d6058]">F: {preset.fats}g</span>
                          <span className="text-[10px] [font-family:'Manrope',Helvetica] text-[#aa371c]">Fe: {preset.iron}mg</span>
                        </div>
                      </div>
                      <span className="text-[#1c6d25] font-bold text-lg ml-3">+</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Meal History */}
            {Object.entries(grouped).map(([date, dayMeals]) => (
              <Card key={date} className="rounded-[48px] border-0 bg-[#f4f4ec] shadow-none">
                <CardContent className="p-8">
                  <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-lg font-bold text-[#31332c] mb-5">{date}</h3>
                  <div className="flex flex-col gap-3">
                    {dayMeals.map((meal) => (
                      <div key={meal.id} className="flex items-start justify-between rounded-2xl bg-white p-4 border border-[#b1b3a91a]">
                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="[font-family:'Manrope',Helvetica] font-bold text-[#31332c]">{meal.name}</p>
                            <Badge className="rounded-full bg-[#e2e3d9] px-2 py-0.5 text-[10px] font-bold text-[#5d6058] hover:bg-[#e2e3d9] [font-family:'Manrope',Helvetica]">{meal.mealType}</Badge>
                          </div>
                          <div className="flex gap-3 flex-wrap">
                            {meal.calories ? <span className="text-xs [font-family:'Manrope',Helvetica] font-bold text-[#31332c]">{meal.calories} kcal</span> : null}
                            {meal.protein ? <span className="text-xs [font-family:'Manrope',Helvetica] text-[#1c6d25]">P: {Number(meal.protein).toFixed(1)}g</span> : null}
                            {meal.carbs ? <span className="text-xs [font-family:'Manrope',Helvetica] text-[#5d6058]">C: {Number(meal.carbs).toFixed(1)}g</span> : null}
                            {meal.fats ? <span className="text-xs [font-family:'Manrope',Helvetica] text-[#5d6058]">F: {Number(meal.fats).toFixed(1)}g</span> : null}
                            {meal.fiber ? <span className="text-xs [font-family:'Manrope',Helvetica] text-[#5d6058]">Fiber: {Number(meal.fiber).toFixed(1)}g</span> : null}
                          </div>
                        </div>
                        <button onClick={() => deleteMeal.mutate(meal.id)} className="text-[#aa371c] text-sm font-bold [font-family:'Manrope',Helvetica] hover:underline ml-3 shrink-0">
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#b1b3a94c] flex items-center justify-between">
                    <span className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">Total calories</span>
                    <span className="[font-family:'Manrope',Helvetica] text-sm font-bold text-[#31332c]">
                      {dayMeals.reduce((s, m) => s + (m.calories || 0), 0)} kcal
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {meals.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <span className="text-6xl">🍽️</span>
                <p className="[font-family:'Manrope',Helvetica] text-[#5d6058]">No meals logged yet — tap Photo Log or Manual Log to start!</p>
              </div>
            )}
          </main>

          <aside className="flex flex-col gap-6 lg:col-span-4">
            {/* Today's Nutrient Progress */}
            <Card className="rounded-[48px] border-0 bg-[#ffdeac] shadow-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-base font-bold text-[#6e4b00]">Today's Progress</h3>
                  <span className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#7f5700]">{todayMeals.length} meals</span>
                </div>
                <div className="flex flex-col gap-3">
                  {/* Calories */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#7f5700]">Calories</span>
                      <span className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#6e4b00]">{todayCals} / {calorieTarget} kcal</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#f5c97b] overflow-hidden">
                      <div className="h-full rounded-full bg-[#6e4b00] transition-all" style={{ width: `${Math.min((todayCals / calorieTarget) * 100, 100)}%` }} />
                    </div>
                  </div>
                  {/* Protein */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#7f5700]">Protein</span>
                      <span className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#6e4b00]">{Math.round(todayProtein)}g / {proteinTarget}g</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#f5c97b] overflow-hidden">
                      <div className="h-full rounded-full bg-[#1c6d25] transition-all" style={{ width: `${Math.min((todayProtein / proteinTarget) * 100, 100)}%` }} />
                    </div>
                  </div>
                  {/* Carbs */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#7f5700]">Carbs</span>
                      <span className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#6e4b00]">{Math.round(todayCarbs)}g / {carbTarget}g</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#f5c97b] overflow-hidden">
                      <div className="h-full rounded-full bg-[#fa7150] transition-all" style={{ width: `${Math.min((todayCarbs / carbTarget) * 100, 100)}%` }} />
                    </div>
                  </div>
                  {/* Fats */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#7f5700]">Fats</span>
                      <span className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#6e4b00]">{Math.round(todayFats)}g / {fatTarget}g</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#f5c97b] overflow-hidden">
                      <div className="h-full rounded-full bg-[#b32d02] transition-all" style={{ width: `${Math.min((todayFats / fatTarget) * 100, 100)}%` }} />
                    </div>
                  </div>
                  {/* Fiber */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#7f5700]">Fiber</span>
                      <span className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#6e4b00]">{Math.round(todayFiber)}g / 25g</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#f5c97b] overflow-hidden">
                      <div className="h-full rounded-full bg-[#1c6d25] transition-all" style={{ width: `${Math.min((todayFiber / 25) * 100, 100)}%` }} />
                    </div>
                  </div>
                </div>
                {todayCals >= calorieTarget && (
                  <p className="mt-3 text-xs [font-family:'Manrope',Helvetica] font-bold text-[#6e4b00]">✅ Calorie target reached for today!</p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[48px] border-0 bg-[#e8e9df] shadow-none">
              <CardContent className="p-6">
                <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-base font-bold text-[#31332c] mb-3">Meal Tips</h3>
                <div className="flex flex-col gap-3 text-sm [font-family:'Manrope',Helvetica] text-[#5d6058]">
                  <p>📷 Use Photo Log for quick AI-powered meal detection</p>
                  <p>🌿 Include a green vegetable in every meal for iron</p>
                  <p>💧 Drink a glass of water before each meal</p>
                  <p>🥣 Dal provides excellent plant-based protein & iron</p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </section>
  );
}
