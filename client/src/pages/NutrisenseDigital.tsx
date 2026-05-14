import { SidebarNavigationSection } from "./sections/SidebarNavigationSection";
import { PantryOverviewSection } from "./sections/PantryOverviewSection";
import { DashboardPage } from "./DashboardPage";
import { LogMealPage } from "./LogMealPage";
import { InsightsPage } from "./InsightsPage";
import { ProfilePage } from "./ProfilePage";
import { ChatPage } from "./ChatPage";

interface Props {
  activePage?: "pantry" | "dashboard" | "log-meal" | "insights" | "profile" | "chat";
}

export const NutrisenseDigital = ({ activePage = "pantry" }: Props): JSX.Element => {
  return (
    <main className="bg-[#fafaf3] min-h-screen">
      <div className="grid grid-cols-[280px_1fr]">
        <aside className="border-r border-[#d9d9d1] bg-transparent sticky top-0 h-screen overflow-y-auto">
          <SidebarNavigationSection />
        </aside>
        <section className="min-w-0 overflow-y-auto">
          {activePage === "pantry" && <PantryOverviewSection />}
          {activePage === "dashboard" && <DashboardPage />}
          {activePage === "log-meal" && <LogMealPage />}
          {activePage === "insights" && <InsightsPage />}
          {activePage === "chat" && <ChatPage />}
          {activePage === "profile" && <ProfilePage />}
        </section>
      </div>
    </main>
  );
};
