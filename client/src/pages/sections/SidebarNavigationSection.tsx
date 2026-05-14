import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

const primaryNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Log Meal", href: "/log-meal", icon: "🍽️" },
  { label: "Pantry", href: "/", icon: "🥗" },
  { label: "Insights", href: "/insights", icon: "📈" },
  { label: "AI Chat", href: "/chat", icon: "💬" },
  { label: "Profile", href: "/profile", icon: "👤" },
];

export const SidebarNavigationSection = (): JSX.Element => {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();

  const firstName = user?.firstName || "there";

  return (
    <aside className="flex h-full min-h-screen w-full max-w-72 flex-col gap-2 overflow-y-auto border-r border-[#b1b3a94c] bg-[#fafaf3] p-6">
      <header className="flex flex-col px-4 pb-10">
        <h2 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-2xl font-bold leading-8 tracking-[-0.60px] text-green-800">
          NutriSense
        </h2>
        <div className="pt-5">
          <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-extrabold leading-7 text-green-900">
            Namaste, {firstName}
          </h3>
        </div>
        <p className="[font-family:'Manrope',Helvetica] text-xs font-bold leading-4 tracking-[1.20px] text-stone-500">
          YOUR WELLNESS SANCTUARY
        </p>
      </header>

      <nav aria-label="Primary" className="flex flex-col gap-2">
        {primaryNavItems.map((item) => {
          const isActive =
            item.href === "/"
              ? location === "/" || location === ""
              : location.startsWith(item.href);
          return (
            <Button
              key={item.label}
              type="button"
              variant="ghost"
              onClick={() => navigate(item.href)}
              className={`h-auto w-full justify-start gap-3 rounded-full px-5 py-3.5 hover:bg-[#eef0e8] ${
                isActive
                  ? "bg-[#9df197] text-[#005c15] shadow-[0px_1px_2px_#0000000d] hover:bg-[#9df197]"
                  : "text-[#5d6058]"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span
                className={`[font-family:'Plus_Jakarta_Sans',Helvetica] text-base leading-6 ${
                  isActive ? "font-bold text-[#005c15]" : "font-semibold text-[#5d6058]"
                }`}
              >
                {item.label}
              </span>
            </Button>
          );
        })}
      </nav>

      <section className="flex flex-col pb-4 pt-8">
        <div className="border-t border-[#b1b3a94c] pt-4 flex flex-col gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/profile")}
            className="h-auto w-full justify-start gap-3 rounded-full px-5 py-3.5 text-[#5d6058] hover:bg-[#eef0e8]"
          >
            <span className="text-lg">⚙️</span>
            <span className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-base font-semibold leading-6 text-[#5d6058]">
              Settings
            </span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={logout}
            className="h-auto w-full justify-start gap-3 rounded-full px-5 py-3.5 text-[#aa371c] hover:bg-[#fff0ec]"
          >
            <span className="text-lg">🚪</span>
            <span className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-base font-semibold leading-6 text-[#aa371c]">
              Logout
            </span>
          </Button>
        </div>
      </section>

      <div className="mt-auto flex min-h-[150px] flex-col justify-end pt-8">
        <Card className="rounded-2xl border border-[#9df197] bg-[#9df19766] shadow-none">
          <CardContent className="flex flex-col gap-2 p-5">
            <div className="flex items-center gap-2">
              <span className="text-base">✨</span>
              <span className="[font-family:'Manrope',Helvetica] text-[10px] font-bold leading-[15px] tracking-[0.50px] text-[#005c15]">
                AI SUGGESTION
              </span>
            </div>
            <p className="[font-family:'Manrope',Helvetica] pb-1 text-xs font-medium leading-4 text-[#5d6058]">
              Ready for your personalised
              <br />
              nutrition plan?
            </p>
            <Button
              type="button"
              onClick={() => navigate("/insights")}
              className="h-auto w-full rounded-full bg-[#1c6d25] px-4 py-2.5 [font-family:'Manrope',Helvetica] text-xs font-bold leading-4 text-[#eaffe2] shadow-[0px_2px_4px_-2px_#0000001a,0px_4px_6px_-1px_#0000001a] hover:bg-[#16591e]"
            >
              Get AI Suggestion
            </Button>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
};
