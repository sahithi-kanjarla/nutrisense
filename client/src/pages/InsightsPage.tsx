import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Meal, PantryItem, HealthProfile } from "@shared/schema";

type ChatMessage = { role: "user" | "ai"; text: string };

function NutritionBar({
  label, consumed, target, unit, color, emoji,
}: {
  label: string; consumed: number; target: number; unit: string; color: string; emoji: string;
}) {
  const pct = Math.min((consumed / target) * 100, 100);
  const status = pct >= 90 ? "✅" : pct >= 50 ? "🟡" : "🔴";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center text-xs [font-family:'Manrope',Helvetica]">
        <span className="font-bold text-[#31332c] flex items-center gap-1.5">
          <span>{emoji}</span>{label}
        </span>
        <span className="text-[#5d6058] flex items-center gap-1">
          {status} <span className="font-bold text-[#31332c]">{Math.round(consumed)}{unit}</span>
          <span className="text-[#b1b3a9]"> / {target}{unit}</span>
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-[#e2e3d9] overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function InsightsPage() {
  const [aiPlan, setAiPlan] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: meals = [] } = useQuery<Meal[]>({ queryKey: ["/api/meals"] });
  const { data: pantry = [] } = useQuery<PantryItem[]>({ queryKey: ["/api/pantry"] });
  const { data: profile } = useQuery<HealthProfile | null>({ queryKey: ["/api/profile/health"] });

  const calorieTarget = profile?.dailyCalorieTarget || 2000;
  const proteinTarget = Math.round(calorieTarget * 0.20 / 4);
  const carbTarget = Math.round(calorieTarget * 0.50 / 4);
  const fatTarget = Math.round(calorieTarget * 0.30 / 9);

  const last7Days = meals.filter((m) => new Date(m.loggedAt!) >= new Date(Date.now() - 7 * 86400000));
  const today = meals.filter((m) => new Date(m.loggedAt!).toDateString() === new Date().toDateString());

  const totalCals = last7Days.reduce((s, m) => s + (m.calories || 0), 0);
  const avgCals = last7Days.length > 0 ? Math.round(totalCals / 7) : 0;
  const totalProtein = last7Days.reduce((s, m) => s + Number(m.protein || 0), 0);
  const totalCarbs = last7Days.reduce((s, m) => s + Number(m.carbs || 0), 0);
  const totalFats = last7Days.reduce((s, m) => s + Number(m.fats || 0), 0);
  const totalFiber = last7Days.reduce((s, m) => s + Number(m.fiber || 0), 0);

  const todayCals = today.reduce((s, m) => s + (m.calories || 0), 0);
  const todayProtein = today.reduce((s, m) => s + Number(m.protein || 0), 0);
  const todayCarbs = today.reduce((s, m) => s + Number(m.carbs || 0), 0);
  const todayFats = today.reduce((s, m) => s + Number(m.fats || 0), 0);
  const todayFiber = today.reduce((s, m) => s + Number(m.fiber || 0), 0);

  const mealTypeBreakdown = last7Days.reduce<Record<string, number>>((acc, m) => {
    acc[m.mealType] = (acc[m.mealType] || 0) + 1;
    return acc;
  }, {});

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const fetchNutritionPlan = async () => {
    setLoadingPlan(true);
    setChatMessages([]);
    try {
      const res = await fetch("/api/ai/nutrition-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      setAiPlan(data.plan);
    } catch {
      setAiPlan("Could not generate plan. Please try again.");
    } finally {
      setLoadingPlan(false);
    }
  };

  const sendFollowUp = async () => {
    const q = chatInput.trim();
    if (!q || !aiPlan) return;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: q }]);
    setChatLoading(true);
    try {
      const res = await fetch("/api/ai/plan-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: aiPlan, question: q }),
      });
      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: "ai", text: data.answer }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "ai", text: "Sorry, I couldn't answer that. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <section className="relative w-full px-8 pt-12 pb-24">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-10">
        {/* Header */}
        <header className="flex flex-col gap-2">
          <p className="[font-family:'Manrope',Helvetica] text-sm font-bold tracking-[1.4px] text-[#b32d02]">YOUR WELLNESS DATA</p>
          <h2 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-5xl font-extrabold tracking-tight text-[#31332c]">Insights</h2>
          <p className="[font-family:'Manrope',Helvetica] text-lg text-[#5d6058]">Your nutrition patterns, daily targets, and AI meal planning — all in one place.</p>
        </header>

        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-12">
          <main className="flex flex-col gap-8 lg:col-span-8">
            {/* Weekly Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Avg Daily Calories", value: avgCals, unit: "kcal", bg: "bg-[#9df197]" },
                { label: "Meals Logged", value: last7Days.length, unit: "7 days", bg: "bg-[#ffdeac]" },
                { label: "Pantry Items", value: pantry.length, unit: "", bg: "bg-[#f4f4ec]" },
                { label: "Unique Dishes", value: new Set(last7Days.map((m) => m.name)).size, unit: "", bg: "bg-[#e8e9df]" },
              ].map((s) => (
                <Card key={s.label} className={`rounded-3xl border-0 shadow-none ${s.bg}`}>
                  <CardContent className="p-5 flex flex-col gap-1">
                    <span className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-3xl font-extrabold text-[#31332c]">{s.value}</span>
                    <span className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">{s.label} {s.unit && <span className="font-normal opacity-70">({s.unit})</span>}</span>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Today's Nutrients */}
            <Card className="rounded-[48px] border-0 bg-[#eaffe2] shadow-none">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#1c6d25]">Today's Nutrition</h3>
                  <span className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058] bg-white rounded-full px-3 py-1">{today.length} meals</span>
                </div>
                {today.length === 0 ? (
                  <p className="[font-family:'Manrope',Helvetica] text-sm text-[#5d6058]">Log your first meal today to see your progress here.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    <NutritionBar label="Calories" consumed={todayCals} target={calorieTarget} unit="kcal" color="bg-[#1c6d25]" emoji="🔥" />
                    <NutritionBar label="Protein" consumed={todayProtein} target={proteinTarget} unit="g" color="bg-[#1c6d25]" emoji="💪" />
                    <NutritionBar label="Carbohydrates" consumed={todayCarbs} target={carbTarget} unit="g" color="bg-[#fa7150]" emoji="🌾" />
                    <NutritionBar label="Fats" consumed={todayFats} target={fatTarget} unit="g" color="bg-[#ffdeac]" emoji="🥑" />
                    <NutritionBar label="Fiber" consumed={todayFiber} target={25} unit="g" color="bg-[#096119]" emoji="🥬" />
                    <div className="mt-2 pt-4 border-t border-[#9df19740]">
                      <p className="[font-family:'Manrope',Helvetica] text-xs text-[#5d6058]">
                        Daily targets calculated from your profile ({calorieTarget} kcal goal).
                        For iron: aim for ~17mg/day from foods like spinach, dal, and sesame seeds.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly Macros */}
            <Card className="rounded-[48px] border-0 bg-[#f4f4ec] shadow-none">
              <CardContent className="p-8">
                <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c] mb-6">Weekly Macros (Last 7 Days)</h3>
                {last7Days.length === 0 ? (
                  <p className="[font-family:'Manrope',Helvetica] text-sm text-[#5d6058]">Log some meals to see your macro breakdown.</p>
                ) : (
                  <div className="flex flex-col gap-5">
                    <NutritionBar label="Protein" consumed={Math.round(totalProtein)} target={proteinTarget * 7} unit="g" color="bg-[#1c6d25]" emoji="💪" />
                    <NutritionBar label="Carbohydrates" consumed={Math.round(totalCarbs)} target={carbTarget * 7} unit="g" color="bg-[#9df197]" emoji="🌾" />
                    <NutritionBar label="Fats" consumed={Math.round(totalFats)} target={fatTarget * 7} unit="g" color="bg-[#ffdeac]" emoji="🥑" />
                    <NutritionBar label="Fiber" consumed={Math.round(totalFiber)} target={175} unit="g" color="bg-[#096119]" emoji="🥬" />
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className="rounded-2xl bg-white p-3 text-center">
                        <p className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-extrabold text-[#31332c]">{Math.round(avgCals)}</p>
                        <p className="[font-family:'Manrope',Helvetica] text-xs text-[#5d6058]">avg kcal/day</p>
                        <p className="[font-family:'Manrope',Helvetica] text-[10px] font-bold mt-0.5 text-[#1c6d25]">Target: {calorieTarget}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-3 text-center">
                        <p className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-extrabold text-[#31332c]">{Math.round(totalProtein / 7)}</p>
                        <p className="[font-family:'Manrope',Helvetica] text-xs text-[#5d6058]">avg protein g/day</p>
                        <p className="[font-family:'Manrope',Helvetica] text-[10px] font-bold mt-0.5 text-[#1c6d25]">Target: {proteinTarget}g</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Meal Plan (main content area) */}
            <Card className="rounded-[48px] border-0 bg-[#1c6d25] shadow-[0px_25px_50px_-12px_#00000040]">
              <CardContent className="p-8">
                <div className="flex flex-col gap-4">
                  <p className="[font-family:'Manrope',Helvetica] text-xs font-bold tracking-[1.2px] text-[#9df197]">✨ AI MEAL PLANNER</p>
                  <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#eaffe2]">
                    Personalised meal plan from your pantry
                  </h3>
                  <p className="[font-family:'Manrope',Helvetica] text-sm text-[#9df197cc]">
                    AI builds a full-day plan using your pantry items, diet type ({profile?.dietType || "Vegetarian"}),
                    health goals, and {profile?.allergies?.length ? `avoids ${profile.allergies.join(", ")}` : "your allergy preferences"}.
                  </p>
                  <Button onClick={fetchNutritionPlan} disabled={loadingPlan}
                    className="w-full rounded-full bg-[#9df197] text-[#005c15] font-bold [font-family:'Manrope',Helvetica] hover:bg-[#7de877]">
                    {loadingPlan ? "Generating your plan..." : aiPlan ? "Regenerate Plan" : "Generate My Meal Plan"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Plan display */}
            {aiPlan && (
              <Card className="rounded-[48px] border-0 bg-[#f4f4ec] shadow-none">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-5">
                    <p className="[font-family:'Manrope',Helvetica] text-xs font-bold tracking-[1.2px] text-[#1c6d25]">YOUR AI MEAL PLAN</p>
                    <button onClick={() => { setAiPlan(null); setChatMessages([]); }}
                      className="text-xs [font-family:'Manrope',Helvetica] text-[#b1b3a9] hover:text-[#aa371c]">Dismiss</button>
                  </div>
                  <div className="[font-family:'Manrope',Helvetica] text-sm text-[#31332c] whitespace-pre-line leading-relaxed">
                    {aiPlan}
                  </div>

                  {/* Chat follow-up */}
                  <div className="mt-8 border-t border-[#b1b3a94c] pt-6">
                    <p className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#1c6d25] mb-4">💬 Ask about this plan</p>

                    {chatMessages.length > 0 && (
                      <div className="flex flex-col gap-3 mb-4 max-h-64 overflow-y-auto">
                        {chatMessages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm [font-family:'Manrope',Helvetica] ${
                              msg.role === "user"
                                ? "bg-[#1c6d25] text-[#eaffe2]"
                                : "bg-white text-[#31332c] border border-[#e2e3d9]"
                            }`}>
                              <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                            </div>
                          </div>
                        ))}
                        {chatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-white border border-[#e2e3d9] rounded-2xl px-4 py-2.5">
                              <div className="flex gap-1">
                                <span className="w-2 h-2 bg-[#1c6d25] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-2 h-2 bg-[#1c6d25] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="w-2 h-2 bg-[#1c6d25] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. Can you change dinner? More protein options?"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !chatLoading && sendFollowUp()}
                        className="rounded-xl border-[#b1b3a9] bg-white flex-1 text-sm"
                        disabled={chatLoading}
                      />
                      <Button onClick={sendFollowUp} disabled={chatLoading || !chatInput.trim()}
                        className="rounded-xl bg-[#1c6d25] text-[#eaffe2] font-bold [font-family:'Manrope',Helvetica] hover:bg-[#185c20] px-4">
                        Send
                      </Button>
                    </div>
                    <p className="mt-2 text-[10px] [font-family:'Manrope',Helvetica] text-[#b1b3a9]">
                      Ask for modifications, alternatives, nutrient details, or cooking tips.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Meal Type Distribution */}
            <Card className="rounded-[48px] border-0 bg-[#f4f4ec] shadow-none">
              <CardContent className="p-8">
                <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c] mb-6">Meal Distribution (7 days)</h3>
                {Object.keys(mealTypeBreakdown).length === 0 ? (
                  <p className="[font-family:'Manrope',Helvetica] text-sm text-[#5d6058]">No meal data yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(mealTypeBreakdown).map(([type, count]) => (
                      <div key={type} className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 border border-[#b1b3a91a]">
                        <span className="[font-family:'Manrope',Helvetica] text-sm font-bold text-[#31332c]">{type}</span>
                        <Badge className="rounded-full bg-[#9df197] px-2 py-0.5 text-[10px] font-bold text-[#005c15] hover:bg-[#9df197] [font-family:'Manrope',Helvetica]">{count}×</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>

          <aside className="flex flex-col gap-6 lg:col-span-4">
            {/* Nutrient Goals Summary */}
            <Card className="rounded-[48px] border-0 bg-[#ffdeac] shadow-none">
              <CardContent className="p-6">
                <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-base font-bold text-[#6e4b00] mb-4">Daily Targets</h3>
                <div className="flex flex-col gap-2 text-sm [font-family:'Manrope',Helvetica]">
                  {[
                    { label: "Calories", val: `${calorieTarget} kcal`, emoji: "🔥" },
                    { label: "Protein", val: `${proteinTarget}g`, emoji: "💪" },
                    { label: "Carbs", val: `${carbTarget}g`, emoji: "🌾" },
                    { label: "Fats", val: `${fatTarget}g`, emoji: "🥑" },
                    { label: "Fiber", val: "25g", emoji: "🥬" },
                    { label: "Iron", val: "17mg", emoji: "🩸" },
                  ].map((t) => (
                    <div key={t.label} className="flex justify-between items-center">
                      <span className="text-[#7f5700] flex items-center gap-1.5"><span>{t.emoji}</span>{t.label}</span>
                      <span className="font-bold text-[#6e4b00]">{t.val}</span>
                    </div>
                  ))}
                </div>
                {profile?.healthGoals && profile.healthGoals.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.healthGoals.map((g) => (
                      <Badge key={g} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#7f5700] hover:bg-white [font-family:'Manrope',Helvetica]">{g}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Iron-rich foods tip */}
            <Card className="rounded-[48px] border-0 bg-[#e8e9df] shadow-none">
              <CardContent className="p-6">
                <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-base font-bold text-[#31332c] mb-3">🩸 Iron-Rich Indian Foods</h3>
                <div className="flex flex-col gap-2 text-sm [font-family:'Manrope',Helvetica] text-[#5d6058]">
                  {[
                    ["Spinach (palak)", "2.7mg/100g"],
                    ["Rajma (kidney beans)", "6.7mg/100g"],
                    ["Sesame seeds (til)", "14.6mg/100g"],
                    ["Moong Dal", "3.0mg/100g"],
                    ["Jaggery (gur)", "11mg/100g"],
                  ].map(([food, iron]) => (
                    <div key={food} className="flex justify-between">
                      <span>{food}</span>
                      <span className="font-bold text-[#aa371c]">{iron}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[48px] border-0 bg-[#f4f4ec] shadow-none">
              <CardContent className="p-6">
                <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-base font-bold text-[#31332c] mb-3">Nutrition Tips</h3>
                <div className="flex flex-col gap-3 text-sm [font-family:'Manrope',Helvetica] text-[#5d6058]">
                  <p>🫘 Include dal in at least one meal daily for protein & iron.</p>
                  <p>🌿 Pair iron-rich foods with vitamin C (lemon) to boost absorption.</p>
                  <p>🌾 Choose multigrain roti over maida for better fibre.</p>
                  <p>🥛 A glass of buttermilk (chaas) aids digestion beautifully.</p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </section>
  );
}
