import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const pantrySections = [
  {
    title: "Grains & Pulses",
    itemCount: "4 ITEMS",
    columns: 2,
    items: [
      {
        name: "Moong Dal",
        detail: "850g remaining",
        image: "/figmaAssets/yellow-lentils.png",
        imageBg: "bg-[#ffdeac]",
        height: "min-h-[106px]",
      },
      {
        name: "Basmati Rice",
        detail: "2.4kg remaining",
        image: "/figmaAssets/basmati-rice.png",
        imageBg: "bg-[#ffdeac]",
        height: "min-h-[106px]",
      },
    ],
  },
  {
    title: "Fresh & Superfoods",
    itemCount: "3 ITEMS",
    columns: 2,
    items: [
      {
        name: "Fresh\nSpinach",
        detail: "1 Bunch (Eat\nsoon)",
        image: "/figmaAssets/fresh-spinach.png",
        imageBg: "bg-[#9df197]",
        height: "min-h-[122px]",
      },
      {
        name: "Flax Seeds",
        detail: "200g remaining",
        image: "/figmaAssets/flax-seeds.png",
        imageBg: "bg-[#ffdeac]",
        height: "min-h-[122px]",
      },
      {
        name: "Country\nEggs",
        detail: "6 Left",
        image: "/figmaAssets/farm-eggs.png",
        imageBg: "bg-[#ffdeac]",
        height: "min-h-[106px]",
      },
    ],
  },
];

const expiringItems = [
  {
    name: "Full Cream Milk",
    detail: "Expires in 2 days",
    barColor: "bg-[#aa371c]",
    detailColor: "text-[#aa371c]",
  },
  {
    name: "Coriander Bunches",
    detail: "Use by tomorrow",
    barColor: "bg-[#fa7150]",
    detailColor: "text-[#671200]",
  },
];

const quickScanItems = [
  {
    id: "jeera",
    name: "Jeera (Cumin\nSeeds)",
    detail: "Essential for digestion",
    defaultValue: "yes",
    bordered: true,
  },
  {
    id: "haldi",
    name: "Haldi (Turmeric)",
    detail: "Anti-inflammatory gold",
    defaultValue: "yes",
    bordered: true,
  },
  {
    id: "curry-leaves",
    name: "Curry Leaves",
    detail: "Fresh aromatic greens",
    defaultValue: "yes",
    bordered: true,
  },
  {
    id: "moringa",
    name: "Moringa Powder",
    detail: "Superfood nutrient\nboost",
    defaultValue: "yes",
    bordered: false,
  },
];

const inventoryTags = [
  "High Fiber",
  "Protein Rich",
  "Gluten Free",
  "Organic",
  "Low Carb",
];

export const PantryOverviewSection = (): JSX.Element => {
  const [scanAnswers, setScanAnswers] = useState<Record<string, string>>({
    jeera: "yes",
    haldi: "yes",
    "curry-leaves": "yes",
    moringa: "yes",
  });

  return (
    <section className="relative w-full px-8 pt-12 pb-24">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col items-start gap-12">
        <header className="flex w-full flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex max-w-2xl flex-col items-start gap-2">
            <p className="flex items-center [font-family:'Manrope',Helvetica] text-sm font-bold leading-5 tracking-[1.40px] text-[#b32d02]">
              THE HEART OF YOUR KITCHEN
            </p>
            <div className="flex w-full flex-col items-start">
              <h2 className="flex items-center [font-family:'Plus_Jakarta_Sans',Helvetica] text-5xl font-extrabold leading-[52px] tracking-[-1.50px] text-[#31332c] sm:text-6xl sm:leading-[60px]">
                My Digital Pantry
              </h2>
            </div>
            <div className="flex w-full flex-col items-start pt-[7.12px]">
              <p className="[font-family:'Manrope',Helvetica] text-lg font-normal leading-[29.2px] tracking-[0] text-[#5d6058]">
                Organized, organic, and life-giving. A curated look at your
                nutrition
                <br />
                reservoir.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <Button
              type="button"
              variant="ghost"
              className="h-auto rounded-full bg-[#e2e3d9] px-6 py-3 text-left hover:bg-[#d9dbcf]"
            >
              <span className="flex items-center gap-[21.61px]">
                <img
                  className="relative shrink-0"
                  alt="Scan item"
                  src="/figmaAssets/container-12.svg"
                />
                <span className="[font-family:'Manrope',Helvetica] text-center text-sm font-bold leading-5 tracking-[0] text-[#31332c]">
                  Scan
                  <br />
                  Item
                </span>
              </span>
            </Button>
            <Button
              type="button"
              className="h-auto rounded-full bg-[#1c6d25] px-6 py-3 shadow-[0px_4px_6px_-4px_#0000001a,0px_10px_15px_-3px_#0000001a] hover:bg-[#185c20]"
            >
              <span className="flex items-center gap-[23.84px]">
                <img
                  className="relative shrink-0"
                  alt="Manual entry"
                  src="/figmaAssets/container-17.svg"
                />
                <span className="[font-family:'Manrope',Helvetica] text-center text-sm font-bold leading-5 tracking-[0] text-[#eaffe2]">
                  Manual
                  <br />
                  Entry
                </span>
              </span>
            </Button>
          </div>
        </header>
        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-12">
          <main className="flex flex-col gap-8 lg:col-span-8">
            {pantrySections.map((section) => (
              <Card
                key={section.title}
                className="rounded-[48px] border-0 bg-[#f4f4ec] shadow-none"
              >
                <CardContent className="p-8">
                  <section className="flex flex-col gap-6">
                    <header className="flex items-center justify-between gap-4">
                      <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold leading-7 tracking-[0] text-[#31332c]">
                        {section.title}
                      </h3>
                      <Badge className="rounded-full bg-[#e2e3d9] px-3 py-1 [font-family:'Manrope',Helvetica] text-xs font-bold leading-4 tracking-[0] text-[#5d6058] hover:bg-[#e2e3d9]">
                        {section.itemCount}
                      </Badge>
                    </header>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {section.items.map((item) => (
                        <article
                          key={`${section.title}-${item.name}`}
                          className={`flex w-full items-center gap-4 rounded-[32px] border border-solid border-[#b1b3a91a] bg-white p-5 ${item.height}`}
                        >
                          <div
                            className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full ${item.imageBg}`}
                          >
                            <div
                              className="h-full w-full bg-cover bg-[50%_50%]"
                              style={{ backgroundImage: `url(${item.image})` }}
                              aria-hidden="true"
                            />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col items-start">
                            <h4 className="self-stretch whitespace-pre-line [font-family:'Manrope',Helvetica] text-base font-bold leading-6 tracking-[0] text-[#31332c]">
                              {item.name}
                            </h4>
                            <p className="self-stretch whitespace-pre-line [font-family:'Manrope',Helvetica] text-xs font-medium leading-4 tracking-[0] text-[#5d6058]">
                              {item.detail}
                            </p>
                          </div>
                          <img
                            className="relative shrink-0"
                            alt="Item actions"
                            src="/figmaAssets/container-3.svg"
                          />
                        </article>
                      ))}
                    </div>
                  </section>
                </CardContent>
              </Card>
            ))}
          </main>
          <aside className="flex flex-col gap-8 lg:col-span-4">
            <Card className="relative overflow-hidden rounded-[48px] border-0 bg-[#e8e9df] shadow-none">
              <CardContent className="p-6">
                <section className="relative flex flex-col gap-6">
                  <header className="flex items-center gap-2">
                    <img
                      className="relative shrink-0"
                      alt="About to expire"
                      src="/figmaAssets/container-8.svg"
                    />
                    <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-base font-bold leading-6 tracking-[0] text-[#31332c]">
                      About to Expire
                    </h3>
                  </header>
                  <div className="flex flex-col gap-4">
                    {expiringItems.map((item) => (
                      <article
                        key={item.name}
                        className="flex items-center gap-4"
                      >
                        <div
                          className={`h-12 w-2 shrink-0 rounded-full ${item.barColor}`}
                        />
                        <div className="flex flex-col items-start">
                          <h4 className="[font-family:'Manrope',Helvetica] text-sm font-bold leading-5 tracking-[0] text-[#31332c]">
                            {item.name}
                          </h4>
                          <p
                            className={`[font-family:'Manrope',Helvetica] text-xs font-bold leading-4 tracking-[0] ${item.detailColor}`}
                          >
                            {item.detail}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                  <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#aa371c] opacity-5" />
                </section>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden rounded-[48px] border-0 bg-[#1c6d25] shadow-[0px_25px_50px_-12px_#00000040]">
              <CardContent className="p-8">
                <section className="relative flex flex-col gap-4">
                  <img
                    className="pointer-events-none absolute -right-10 -bottom-10 h-[73px] w-[74px]"
                    alt="Decorative shape"
                    src="/figmaAssets/container-10.svg"
                  />
                  <header className="flex items-center gap-2">
                    <img
                      className="relative shrink-0"
                      alt="AI quick scan"
                      src="/figmaAssets/container-9.svg"
                    />
                    <p className="[font-family:'Manrope',Helvetica] text-xs font-bold leading-4 tracking-[1.20px] text-[#9df197]">
                      AI QUICK SCAN
                    </p>
                  </header>
                  <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold leading-7 tracking-[0] text-[#eaffe2]">
                    Most Indian kitchens
                    <br />
                    have these — do you
                    <br />
                    have any of these at
                    <br />
                    home?
                  </h3>
                  <div className="flex flex-col gap-6">
                    {quickScanItems.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-start justify-between gap-4 ${
                          item.bordered
                            ? "border-b border-[#0961194c] pb-4"
                            : ""
                        }`}
                      >
                        <div className="flex flex-col items-start">
                          <h4 className="whitespace-pre-line [font-family:'Manrope',Helvetica] text-base font-bold leading-6 tracking-[0] text-[#eaffe2]">
                            {item.name}
                          </h4>
                          <p className="whitespace-pre-line [font-family:'Manrope',Helvetica] text-xs font-normal leading-4 tracking-[0] text-[#9df197cc]">
                            {item.detail}
                          </p>
                        </div>
                        <ToggleGroup
                          type="single"
                          value={scanAnswers[item.id]}
                          onValueChange={(value) => {
                            if (value) {
                              setScanAnswers((prev) => ({
                                ...prev,
                                [item.id]: value,
                              }));
                            }
                          }}
                          className="flex shrink-0 items-start gap-2"
                        >
                          <ToggleGroupItem
                            value="yes"
                            aria-label={`Yes for ${item.name.replace(/\n/g, " ")}`}
                            className="h-auto rounded-full border-0 bg-[#096119] px-3 py-1 data-[state=on]:bg-[#9df197] data-[state=on]:text-[#005c15] data-[state=off]:bg-[#096119] data-[state=off]:text-[#eaffe2]"
                          >
                            <span className="[font-family:'Manrope',Helvetica] text-xs font-bold leading-4 tracking-[0]">
                              Yes
                            </span>
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="no"
                            aria-label={`No for ${item.name.replace(/\n/g, " ")}`}
                            className="h-auto rounded-full border-0 bg-[#096119] px-3 py-1 data-[state=on]:bg-[#9df197] data-[state=on]:text-[#005c15] data-[state=off]:bg-[#096119] data-[state=off]:text-[#eaffe2]"
                          >
                            <span className="[font-family:'Manrope',Helvetica] text-xs font-bold leading-4 tracking-[0]">
                              No
                            </span>
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    ))}
                  </div>
                </section>
              </CardContent>
            </Card>
            <Card className="rounded-[48px] border-0 bg-[#ffdeac] shadow-none">
              <CardContent className="p-6">
                <section className="flex flex-col gap-4">
                  <header className="flex items-center gap-2">
                    <img
                      className="relative shrink-0"
                      alt="Inventory tags"
                      src="/figmaAssets/container-19.svg"
                    />
                    <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-base font-bold leading-6 tracking-[0] text-[#6e4b00]">
                      Inventory Tags
                    </h3>
                  </header>
                  <div className="flex flex-wrap gap-3">
                    {inventoryTags.map((tag) => (
                      <Badge
                        key={tag}
                        className="rounded-full bg-white px-4 py-2 [font-family:'Manrope',Helvetica] text-xs font-bold leading-4 tracking-[0] text-[#7f5700] hover:bg-white"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </section>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </section>
  );
};
