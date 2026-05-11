import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import type { PantryItem, Meal } from "@shared/schema";

export function DashboardPage() {
  const { user } = useAuth();

  const { data: pantryItems = [] } = useQuery<PantryItem[]>({
    queryKey: ["/api/pantry"],
  });

  const { data: meals = [] } = useQuery<Meal[]>({
    queryKey: ["/api/meals"],
  });

  const { data: expiringItems = [] } = useQuery<PantryItem[]>({
    queryKey: ["/api/pantry/expiring"],
  });

  const todayMeals = meals.filter((m) => {
    const today = new Date();
    const mealDate = new Date(m.loggedAt!);
    return mealDate.toDateString() === today.toDateString();
  });

  const totalCalories = todayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);

  const categories = [...new Set(pantryItems.map((p) => p.category))];

  const firstName = user?.firstName || "there";

  return (
    <section className="relative w-full px-8 pt-12 pb-24">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col items-start gap-10">
        {/* Header */}
        <header className="flex w-full flex-col gap-2">
          <p className="[font-family:'Manrope',Helvetica] text-sm font-bold tracking-[1.4px] text-[#b32d02]">
            WELCOME BACK
          </p>
          <h2 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-4xl font-extrabold tracking-tight text-[#31332c]">
            Namaste, {firstName} 🙏
          </h2>
          <p className="[font-family:'Manrope',Helvetica] text-[#5d6058]">
            Here's your wellness overview for today
          </p>
        </header>

        {/* Stats Row */}
        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Pantry Items", value: pantryItems.length, color: "bg-[#9df197]", icon: "🥗" },
            { label: "Expiring Soon", value: expiringItems.length, color: "bg-[#ffdeac]", icon: "⏰" },
            { label: "Meals Today", value: todayMeals.length, color: "bg-[#f4f4ec]", icon: "🍽️" },
            { label: "Calories Today", value: totalCalories, color: "bg-[#e8e9df]", icon: "🔥" },
          ].map((stat) => (
            <Card key={stat.label} className={`rounded-3xl border-0 shadow-none ${stat.color}`}>
              <CardContent className="p-6 flex flex-col gap-2">
                <span className="text-2xl">{stat.icon}</span>
                <span className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-3xl font-extrabold text-[#31332c]">
                  {stat.value}
                </span>
                <span className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">
                  {stat.label}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-12">
          <main className="flex flex-col gap-8 lg:col-span-8">
            {/* Pantry Categories */}
            <Card className="rounded-[48px] border-0 bg-[#f4f4ec] shadow-none">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c]">
                    Pantry Overview
                  </h3>
                  <Badge className="rounded-full bg-[#e2e3d9] px-3 py-1 text-xs font-bold text-[#5d6058] hover:bg-[#e2e3d9] [font-family:'Manrope',Helvetica]">
                    {pantryItems.length} ITEMS
                  </Badge>
                </div>
                {categories.length === 0 ? (
                  <p className="text-[#5d6058] [font-family:'Manrope',Helvetica] text-sm">
                    No pantry items yet. Head to the Pantry to add some!
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {categories.map((cat) => {
                      const count = pantryItems.filter((p) => p.category === cat).length;
                      return (
                        <div key={cat} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 border border-[#b1b3a91a]">
                          <span className="[font-family:'Manrope',Helvetica] text-sm font-bold text-[#31332c]">{cat}</span>
                          <Badge className="rounded-full bg-[#9df197] px-2 py-0.5 text-[10px] font-bold text-[#005c15] hover:bg-[#9df197] [font-family:'Manrope',Helvetica]">
                            {count}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Today's Meals */}
            <Card className="rounded-[48px] border-0 bg-[#f4f4ec] shadow-none">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c]">
                    Today's Meals
                  </h3>
                  <Badge className="rounded-full bg-[#e2e3d9] px-3 py-1 text-xs font-bold text-[#5d6058] hover:bg-[#e2e3d9] [font-family:'Manrope',Helvetica]">
                    {todayMeals.length} LOGGED
                  </Badge>
                </div>
                {todayMeals.length === 0 ? (
                  <p className="text-[#5d6058] [font-family:'Manrope',Helvetica] text-sm">
                    No meals logged today. Go to Log Meal to start tracking.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {todayMeals.map((meal) => (
                      <div key={meal.id} className="flex items-center justify-between rounded-2xl bg-white p-4 border border-[#b1b3a91a]">
                        <div>
                          <p className="[font-family:'Manrope',Helvetica] font-bold text-[#31332c]">{meal.name}</p>
                          <p className="[font-family:'Manrope',Helvetica] text-xs text-[#5d6058]">{meal.mealType}</p>
                        </div>
                        {meal.calories && (
                          <Badge className="rounded-full bg-[#ffdeac] px-3 py-1 text-xs font-bold text-[#7f5700] hover:bg-[#ffdeac] [font-family:'Manrope',Helvetica]">
                            {meal.calories} kcal
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>

          <aside className="flex flex-col gap-6 lg:col-span-4">
            {/* Expiring Items */}
            <Card className="relative overflow-hidden rounded-[48px] border-0 bg-[#e8e9df] shadow-none">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">⚠️</span>
                  <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-base font-bold text-[#31332c]">
                    Expiring This Week
                  </h3>
                </div>
                {expiringItems.length === 0 ? (
                  <p className="[font-family:'Manrope',Helvetica] text-sm text-[#5d6058]">All good! Nothing expiring soon.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {expiringItems.slice(0, 3).map((item) => {
                      const daysLeft = item.expiresAt
                        ? Math.ceil((new Date(item.expiresAt).getTime() - Date.now()) / 86400000)
                        : null;
                      return (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className={`h-10 w-2 shrink-0 rounded-full ${daysLeft !== null && daysLeft <= 1 ? "bg-[#aa371c]" : "bg-[#fa7150]"}`} />
                          <div>
                            <p className="[font-family:'Manrope',Helvetica] text-sm font-bold text-[#31332c]">{item.name}</p>
                            <p className={`[font-family:'Manrope',Helvetica] text-xs font-bold ${daysLeft !== null && daysLeft <= 1 ? "text-[#aa371c]" : "text-[#671200]"}`}>
                              {daysLeft !== null ? `${daysLeft === 0 ? "Today" : `${daysLeft}d left`}` : "Expiring soon"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Suggestion Card */}
            <Card className="rounded-[48px] border-0 bg-[#1c6d25] shadow-[0px_25px_50px_-12px_#00000040]">
              <CardContent className="p-8">
                <div className="flex flex-col gap-4">
                  <p className="[font-family:'Manrope',Helvetica] text-xs font-bold tracking-[1.2px] text-[#9df197]">
                    AI SUGGESTION
                  </p>
                  <p className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-lg font-bold text-[#eaffe2]">
                    Get a personalised nutrition plan based on your pantry!
                  </p>
                  <Button
                    onClick={() => { window.location.href = "/insights"; }}
                    className="w-full rounded-full bg-[#9df197] text-[#005c15] font-bold [font-family:'Manrope',Helvetica] hover:bg-[#7de877]"
                  >
                    View Insights →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </section>
  );
}
