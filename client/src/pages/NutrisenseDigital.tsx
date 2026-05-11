import { PantryOverviewSection } from "./sections/PantryOverviewSection";
import { SidebarNavigationSection } from "./sections/SidebarNavigationSection";

export const NutrisenseDigital = (): JSX.Element => {
  return (
    <main className="bg-[linear-gradient(0deg,rgba(250,250,243,1)_0%,rgba(250,250,243,1)_100%),linear-gradient(0deg,rgba(255,255,255,1)_0%,rgba(255,255,255,1)_100%)]">
      <div className="grid grid-cols-[22%_78%]">
        <aside className="border-r border-[#d9d9d1] bg-transparent">
          <SidebarNavigationSection />
        </aside>
        <section className="min-w-0">
          <PantryOverviewSection />
        </section>
      </div>
    </main>
  );
};
