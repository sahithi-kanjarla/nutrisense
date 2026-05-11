import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafaf3] flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full text-center flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-[#9df197] flex items-center justify-center text-3xl">
            🌿
          </div>
          <h1 className="text-4xl font-extrabold text-green-800 tracking-tight [font-family:'Plus_Jakarta_Sans',Helvetica]">
            NutriSense
          </h1>
          <p className="text-sm font-bold tracking-[1.4px] text-[#b32d02] [font-family:'Manrope',Helvetica]">
            YOUR WELLNESS SANCTUARY
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold text-[#31332c] [font-family:'Plus_Jakarta_Sans',Helvetica]">
            The Heart of Your Indian Kitchen
          </h2>
          <p className="text-[#5d6058] text-base leading-relaxed [font-family:'Manrope',Helvetica]">
            Track your pantry, log meals, get AI-powered nutrition insights — all designed for Indian households.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          {[
            { icon: "🥘", label: "Smart Pantry", desc: "Track dal, rice, masalas & more" },
            { icon: "🧠", label: "AI Nutrition", desc: "Personalised Indian meal plans" },
            { icon: "📊", label: "Health Insights", desc: "Understand your nutrition data" },
            { icon: "🕐", label: "Expiry Alerts", desc: "Never waste food again" },
          ].map((f) => (
            <Card key={f.label} className="rounded-2xl border-0 bg-[#f4f4ec] shadow-none">
              <CardContent className="p-4 flex flex-col gap-1">
                <span className="text-2xl">{f.icon}</span>
                <span className="font-bold text-sm text-[#31332c] [font-family:'Manrope',Helvetica]">{f.label}</span>
                <span className="text-xs text-[#5d6058] [font-family:'Manrope',Helvetica]">{f.desc}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          onClick={() => { window.location.href = "/api/login"; }}
          className="w-full h-14 rounded-full bg-[#1c6d25] text-[#eaffe2] text-base font-bold [font-family:'Manrope',Helvetica] hover:bg-[#185c20] shadow-lg"
        >
          Get Started — Log In
        </Button>

        <p className="text-xs text-[#5d6058] [font-family:'Manrope',Helvetica]">
          Free to use. Designed for Indian households.
        </p>
      </div>
    </div>
  );
}
