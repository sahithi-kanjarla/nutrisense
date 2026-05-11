import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Meal, PantryItem } from "@shared/schema";

function NutritionBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs [font-family:'Manrope',Helvetica]">
        <span className="font-bold text-[#31332c]">{label}</span>
        <span className="text-[#5d6058]">{value}g</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#e2e3d9] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function InsightsPage() {
  const [aiPlan, setAiPlan] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  const { data: meals = [] } = useQuery<Meal[]>({ queryKey: ["/api/meals"] });
  const { data: pantry = [] } = useQuery<PantryItem[]>({ queryKey: ["/api/pantry"] });

  const last7Days = meals.filter((m) => {
    const mealDate = new Date(m.loggedAt!);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return mealDate >= sevenDaysAgo;
  });

  const totalCals = last7Days.reduce((s, m) => s + (m.calories || 0), 0);
  const avgCals = last7Days.length > 0 ? Math.round(totalCals / 7) : 0;
  const totalProtein = last7Days.reduce((s, m) => s + Number(m.protein || 0), 0);
  const totalCarbs = last7Days.reduce((s, m) => s + Number(m.carbs || 0), 0);
  const totalFats = last7Days.reduce((s, m) => s + Number(m.fats || 0), 0);

  const mealTypeBreakdown = last7Days.reduce<Record<string, number>>((acc, m) => {
    acc[m.mealType] = (acc[m.mealType] || 0) + 1;
    return acc;
  }, {});

  const pantryTagCounts = pantry.reduce<Record<string, number>>((acc, item) => {
    for (const tag of item.tags || []) {
      acc[tag] = (acc[tag] || 0) + 1;
    }
    return acc;
  }, {});

  const fetchNutritionPlan = async () => {
    setLoadingPlan(true);
    try {
      const res = await fetch("/api/ai/nutrition-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      setAiPlan(data.plan);
    } catch {
      setAiPlan("Could not fetch plan. Please try again.");
    } finally {
      setLoadingPlan(false);
    }
  };

  return (
    <section className="relative w-full px-8 pt-12 pb-24">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-10">
        {/* Header */}
        <header className="flex flex-col gap-2">
          <p className="[font-family:'Manrope',Helvetica] text-sm font-bold tracking-[1.4px] text-[#b32d02]">
            YOUR WELLNESS DATA
          </p>
          <h2 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-5xl font-extrabold tracking-tight text-[#31332c]">
            Insights
          </h2>
          <p className="[font-family:'Manrope',Helvetica] text-lg text-[#5d6058]">
            Understand your nutrition patterns over the last 7 days.
          </p>
        </header>

        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-12">
          <main className="flex flex-col gap-8 lg:col-span-8">
            {/* Weekly Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Avg Daily Calories", value: avgCals, unit: "kcal", bg: "bg-[#9df197]" },
                { label: "Meals Logged", value: last7Days.length, unit: "", bg: "bg-[#ffdeac]" },
                { label: "Pantry Items", value: pantry.length, unit: "", bg: "bg-[#f4f4ec]" },
                { label: "Unique Dishes", value: new Set(last7Days.map((m) => m.name)).size, unit: "", bg: "bg-[#e8e9df]" },
              ].map((s) => (
                <Card key={s.label} className={`rounded-3xl border-0 shadow-none ${s.bg}`}>
                  <CardContent className="p-5 flex flex-col gap-1">
                    <span className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-3xl font-extrabold text-[#31332c]">
                      {s.value}
                    </span>
                    <span className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">
                      {s.label} {s.unit && <span className="font-normal">({s.unit})</span>}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Macros */}
            <Card className="rounded-[48px] border-0 bg-[#f4f4ec] shadow-none">
              <CardContent className="p-8">
                <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c] mb-6">
                  Weekly Macros (Last 7 Days)
                </h3>
                {last7Days.length === 0 ? (
                  <p className="[font-family:'Manrope',Helvetica] text-sm text-[#5d6058]">Log some meals to see your macro breakdown.</p>
                ) : (
                  <div className="flex flex-col gap-5">
                    <NutritionBar label="Protein" value={Math.round(totalProtein)} max={350} color="bg-[#1c6d25]" />
                    <NutritionBar label="Carbohydrates" value={Math.round(totalCarbs)} max={1400} color="bg-[#9df197]" />
                    <NutritionBar label="Fats" value={Math.round(totalFats)} max={490} color="bg-[#ffdeac]" />
                    <div className="mt-2 pt-4 border-t border-[#b1b3a94c]">
                      <p className="[font-family:'Manrope',Helvetica] text-xs text-[#5d6058]">
                        * Targets based on 2000 kcal/day. Protein: 50g/day, Carbs: 200g/day, Fats: 70g/day.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Meal Type Distribution */}
            <Card className="rounded-[48px] border-0 bg-[#f4f4ec] shadow-none">
              <CardContent className="p-8">
                <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c] mb-6">
                  Meal Distribution
                </h3>
                {Object.keys(mealTypeBreakdown).length === 0 ? (
                  <p className="[font-family:'Manrope',Helvetica] text-sm text-[#5d6058]">No meal data yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(mealTypeBreakdown).map(([type, count]) => (
                      <div key={type} className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 border border-[#b1b3a91a]">
                        <span className="[font-family:'Manrope',Helvetica] text-sm font-bold text-[#31332c]">{type}</span>
                        <Badge className="rounded-full bg-[#9df197] px-2 py-0.5 text-[10px] font-bold text-[#005c15] hover:bg-[#9df197] [font-family:'Manrope',Helvetica]">
                          {count}×
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pantry Tags */}
            {Object.keys(pantryTagCounts).length > 0 && (
              <Card className="rounded-[48px] border-0 bg-[#ffdeac] shadow-none">
                <CardContent className="p-8">
                  <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#6e4b00] mb-5">
                    Pantry Nutrition Tags
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(pantryTagCounts).map(([tag, count]) => (
                      <Badge key={tag} className="rounded-full bg-white px-4 py-2 text-xs font-bold text-[#7f5700] hover:bg-white [font-family:'Manrope',Helvetica]">
                        {tag} ({count})
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </main>

          <aside className="flex flex-col gap-6 lg:col-span-4">
            {/* AI Nutrition Plan */}
            <Card className="rounded-[48px] border-0 bg-[#1c6d25] shadow-[0px_25px_50px_-12px_#00000040]">
              <CardContent className="p-8">
                <div className="flex flex-col gap-4">
                  <p className="[font-family:'Manrope',Helvetica] text-xs font-bold tracking-[1.2px] text-[#9df197]">
                    AI SUGGESTION
                  </p>
                  <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-lg font-bold text-[#eaffe2]">
                    Get a personalised meal plan from your pantry
                  </h3>
                  <Button
                    onClick={fetchNutritionPlan}
                    disabled={loadingPlan}
                    className="w-full rounded-full bg-[#9df197] text-[#005c15] font-bold [font-family:'Manrope',Helvetica] hover:bg-[#7de877]"
                  >
                    {loadingPlan ? "Generating..." : "Generate Plan"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {aiPlan && (
              <Card className="rounded-[48px] border-0 bg-[#f4f4ec] shadow-none">
                <CardContent className="p-6">
                  <p className="[font-family:'Manrope',Helvetica] text-xs font-bold tracking-[1.2px] text-[#1c6d25] mb-3">
                    YOUR AI PLAN
                  </p>
                  <p className="[font-family:'Manrope',Helvetica] text-sm text-[#31332c] whitespace-pre-line leading-relaxed">
                    {aiPlan}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-[48px] border-0 bg-[#e8e9df] shadow-none">
              <CardContent className="p-6">
                <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-base font-bold text-[#31332c] mb-3">
                  Nutrition Tips
                </h3>
                <div className="flex flex-col gap-3 text-sm [font-family:'Manrope',Helvetica] text-[#5d6058]">
                  <p>🫘 Include dal in at least one meal daily for protein.</p>
                  <p>🌿 Add fresh greens like palak or methi for iron.</p>
                  <p>🌾 Choose whole grains like brown rice or multigrain roti.</p>
                  <p>🥛 A glass of buttermilk aids digestion beautifully.</p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </section>
  );
}
