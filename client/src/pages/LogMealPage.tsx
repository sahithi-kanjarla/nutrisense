import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Meal } from "@shared/schema";

const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack", "Tea"];

const commonIndianMeals: { name: string; type: string; calories: number; items: string[] }[] = [
  { name: "Idli Sambar", type: "Breakfast", calories: 250, items: ["Idli", "Sambar", "Coconut Chutney"] },
  { name: "Poha", type: "Breakfast", calories: 200, items: ["Flattened Rice", "Onion", "Mustard Seeds", "Curry Leaves"] },
  { name: "Dal Tadka & Rice", type: "Lunch", calories: 450, items: ["Moong Dal", "Basmati Rice", "Ghee", "Jeera"] },
  { name: "Roti Sabzi", type: "Lunch", calories: 350, items: ["Whole Wheat Roti", "Mixed Vegetables", "Masala"] },
  { name: "Chicken Curry", type: "Dinner", calories: 380, items: ["Chicken", "Tomatoes", "Onions", "Garam Masala"] },
  { name: "Paneer Butter Masala", type: "Dinner", calories: 420, items: ["Paneer", "Butter", "Cream", "Tomato Gravy"] },
  { name: "Masala Chai", type: "Tea", calories: 80, items: ["Tea", "Milk", "Ginger", "Cardamom"] },
  { name: "Upma", type: "Breakfast", calories: 220, items: ["Semolina", "Vegetables", "Mustard Seeds"] },
];

function groupMealsByDate(meals: Meal[]) {
  const groups: Record<string, Meal[]> = {};
  for (const meal of meals) {
    const date = new Date(meal.loggedAt!).toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "long",
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(meal);
  }
  return groups;
}

export function LogMealPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", mealType: "Lunch", calories: "", protein: "", carbs: "", fats: "" });

  const { data: meals = [] } = useQuery<Meal[]>({ queryKey: ["/api/meals"] });

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
      setForm({ name: "", mealType: "Lunch", calories: "", protein: "", carbs: "", fats: "" });
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

  const handleQuickAdd = (preset: typeof commonIndianMeals[0]) => {
    addMeal.mutate({
      name: preset.name,
      mealType: preset.type,
      calories: preset.calories,
      items: preset.items,
    });
  };

  const grouped = groupMealsByDate(meals);

  return (
    <section className="relative w-full px-8 pt-12 pb-24">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-10">
        {/* Header */}
        <header className="flex w-full flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-2">
            <p className="[font-family:'Manrope',Helvetica] text-sm font-bold tracking-[1.4px] text-[#b32d02]">
              TRACK YOUR NUTRITION
            </p>
            <h2 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-5xl font-extrabold tracking-tight text-[#31332c]">
              Log Meal
            </h2>
            <p className="[font-family:'Manrope',Helvetica] text-lg text-[#5d6058]">
              Keep track of your daily Indian meals and nutrition intake.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-auto rounded-full bg-[#1c6d25] px-6 py-3 font-bold text-[#eaffe2] [font-family:'Manrope',Helvetica] hover:bg-[#185c20]">
                + Log a Meal
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl bg-[#fafaf3] border-0 max-w-md">
              <DialogHeader>
                <DialogTitle className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c]">
                  Log a Meal
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div>
                  <Label className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">Meal Name *</Label>
                  <Input
                    className="mt-1 rounded-xl border-[#b1b3a9] bg-white"
                    placeholder="e.g. Dal Tadka, Idli Sambar..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">Meal Type</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {mealTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => setForm({ ...form, mealType: type })}
                        className={`rounded-full px-4 py-1.5 text-xs font-bold [font-family:'Manrope',Helvetica] transition-colors ${
                          form.mealType === type
                            ? "bg-[#1c6d25] text-[#eaffe2]"
                            : "bg-[#e2e3d9] text-[#5d6058] hover:bg-[#d9dbcf]"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">Calories</Label>
                    <Input
                      type="number"
                      className="mt-1 rounded-xl border-[#b1b3a9] bg-white"
                      placeholder="kcal"
                      value={form.calories}
                      onChange={(e) => setForm({ ...form, calories: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">Protein (g)</Label>
                    <Input
                      type="number"
                      className="mt-1 rounded-xl border-[#b1b3a9] bg-white"
                      placeholder="grams"
                      value={form.protein}
                      onChange={(e) => setForm({ ...form, protein: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => {
                    if (!form.name) return toast({ title: "Please enter a meal name", variant: "destructive" });
                    addMeal.mutate({
                      name: form.name,
                      mealType: form.mealType,
                      calories: form.calories ? Number(form.calories) : undefined,
                      protein: form.protein || undefined,
                    });
                  }}
                  disabled={addMeal.isPending}
                  className="w-full rounded-full bg-[#1c6d25] text-[#eaffe2] font-bold [font-family:'Manrope',Helvetica] hover:bg-[#185c20]"
                >
                  {addMeal.isPending ? "Saving..." : "Save Meal"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-12">
          <main className="flex flex-col gap-8 lg:col-span-8">
            {/* Quick Add */}
            <Card className="rounded-[48px] border-0 bg-[#f4f4ec] shadow-none">
              <CardContent className="p-8">
                <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c] mb-5">
                  Quick Add — Common Indian Meals
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {commonIndianMeals.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handleQuickAdd(preset)}
                      disabled={addMeal.isPending}
                      className="flex items-center justify-between rounded-2xl bg-white p-4 border border-[#b1b3a91a] hover:border-[#9df197] hover:bg-[#f0fff0] transition-colors text-left"
                    >
                      <div>
                        <p className="[font-family:'Manrope',Helvetica] font-bold text-sm text-[#31332c]">{preset.name}</p>
                        <p className="[font-family:'Manrope',Helvetica] text-xs text-[#5d6058]">{preset.type} · {preset.calories} kcal</p>
                      </div>
                      <span className="text-[#1c6d25] font-bold text-lg">+</span>
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
                      <div key={meal.id} className="flex items-center justify-between rounded-2xl bg-white p-4 border border-[#b1b3a91a]">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <p className="[font-family:'Manrope',Helvetica] font-bold text-[#31332c]">{meal.name}</p>
                            <Badge className="rounded-full bg-[#e2e3d9] px-2 py-0.5 text-[10px] font-bold text-[#5d6058] hover:bg-[#e2e3d9] [font-family:'Manrope',Helvetica]">
                              {meal.mealType}
                            </Badge>
                          </div>
                          {meal.calories && (
                            <p className="[font-family:'Manrope',Helvetica] text-xs text-[#5d6058]">{meal.calories} kcal</p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteMeal.mutate(meal.id)}
                          className="text-[#aa371c] text-sm font-bold [font-family:'Manrope',Helvetica] hover:underline"
                        >
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
                <p className="[font-family:'Manrope',Helvetica] text-[#5d6058]">No meals logged yet. Start adding your meals!</p>
              </div>
            )}
          </main>

          <aside className="flex flex-col gap-6 lg:col-span-4">
            <Card className="rounded-[48px] border-0 bg-[#ffdeac] shadow-none">
              <CardContent className="p-6">
                <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-base font-bold text-[#6e4b00] mb-3">
                  Today's Summary
                </h3>
                {(() => {
                  const todayMeals = meals.filter((m) => new Date(m.loggedAt!).toDateString() === new Date().toDateString());
                  const cals = todayMeals.reduce((s, m) => s + (m.calories || 0), 0);
                  return (
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between">
                        <span className="[font-family:'Manrope',Helvetica] text-sm text-[#7f5700]">Meals Logged</span>
                        <span className="[font-family:'Manrope',Helvetica] text-sm font-bold text-[#6e4b00]">{todayMeals.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="[font-family:'Manrope',Helvetica] text-sm text-[#7f5700]">Total Calories</span>
                        <span className="[font-family:'Manrope',Helvetica] text-sm font-bold text-[#6e4b00]">{cals} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="[font-family:'Manrope',Helvetica] text-sm text-[#7f5700]">Target</span>
                        <span className="[font-family:'Manrope',Helvetica] text-sm font-bold text-[#6e4b00]">2000 kcal</span>
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-[#f5c97b] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#6e4b00] transition-all"
                          style={{ width: `${Math.min((cals / 2000) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card className="rounded-[48px] border-0 bg-[#e8e9df] shadow-none">
              <CardContent className="p-6">
                <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-base font-bold text-[#31332c] mb-3">
                  Meal Tips
                </h3>
                <div className="flex flex-col gap-3 text-sm [font-family:'Manrope',Helvetica] text-[#5d6058]">
                  <p>🌿 Include a green vegetable in every meal for micronutrients.</p>
                  <p>💧 Drink a glass of water before each meal.</p>
                  <p>🥣 A bowl of dal provides excellent plant-based protein.</p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </section>
  );
}
