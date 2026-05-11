import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { PantryItem } from "@shared/schema";

const itemCategories = [
  "Grains & Pulses",
  "Fresh Produce",
  "Spices & Condiments",
  "Dairy",
  "Superfoods",
  "Snacks",
  "Beverages",
  "Other",
];

const categoryColors: Record<string, string> = {
  "Grains & Pulses": "bg-[#ffdeac]",
  "Fresh Produce": "bg-[#9df197]",
  "Spices & Condiments": "bg-[#f4e8c1]",
  "Dairy": "bg-[#e8f4ff]",
  "Superfoods": "bg-[#d4edda]",
  "Snacks": "bg-[#fde8d8]",
  "Beverages": "bg-[#e8e9df]",
  "Other": "bg-[#f4f4ec]",
};

const categoryEmoji: Record<string, string> = {
  "Grains & Pulses": "🫘",
  "Fresh Produce": "🥬",
  "Spices & Condiments": "🌿",
  "Dairy": "🥛",
  "Superfoods": "🌱",
  "Snacks": "🍿",
  "Beverages": "☕",
  "Other": "🥗",
};

const quickScanItems = [
  { id: "jeera", name: "Jeera (Cumin\nSeeds)", detail: "Essential for digestion" },
  { id: "haldi", name: "Haldi (Turmeric)", detail: "Anti-inflammatory gold" },
  { id: "curry-leaves", name: "Curry Leaves", detail: "Fresh aromatic greens" },
  { id: "moringa", name: "Moringa Powder", detail: "Superfood nutrient\nboost" },
];

const inventoryTags = ["High Fiber", "Protein Rich", "Gluten Free", "Organic", "Low Carb"];

const staticPantrySections = [
  {
    title: "Grains & Pulses",
    itemCount: "4 ITEMS",
    items: [
      { name: "Moong Dal", detail: "850g remaining", imageBg: "bg-[#ffdeac]", emoji: "🫘" },
      { name: "Basmati Rice", detail: "2.4kg remaining", imageBg: "bg-[#ffdeac]", emoji: "🍚" },
    ],
  },
  {
    title: "Fresh & Superfoods",
    itemCount: "3 ITEMS",
    items: [
      { name: "Fresh Spinach", detail: "1 Bunch (Eat soon)", imageBg: "bg-[#9df197]", emoji: "🥬" },
      { name: "Flax Seeds", detail: "200g remaining", imageBg: "bg-[#ffdeac]", emoji: "🌱" },
      { name: "Country Eggs", detail: "6 Left", imageBg: "bg-[#ffdeac]", emoji: "🥚" },
    ],
  },
];

const staticExpiringItems = [
  { name: "Full Cream Milk", detail: "Expires in 2 days", barColor: "bg-[#aa371c]", detailColor: "text-[#aa371c]" },
  { name: "Coriander Bunches", detail: "Use by tomorrow", barColor: "bg-[#fa7150]", detailColor: "text-[#671200]" },
];

export const PantryOverviewSection = (): JSX.Element => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "", category: "Grains & Pulses", quantity: "", unit: "", notes: "",
  });

  const [scanAnswers, setScanAnswers] = useState<Record<string, string>>({
    jeera: "yes", haldi: "yes", "curry-leaves": "yes", moringa: "yes",
  });
  const [scanSubmitted, setScanSubmitted] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanLoading, setScanLoading] = useState(false);

  const { data: pantryItems = [] } = useQuery<PantryItem[]>({ queryKey: ["/api/pantry"] });
  const { data: expiringItems = [] } = useQuery<PantryItem[]>({ queryKey: ["/api/pantry/expiring"] });

  const addItem = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/pantry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pantry"] });
      toast({ title: "Item added!", description: "Added to your pantry." });
    },
    onError: () => toast({ title: "Error", description: "Could not add item.", variant: "destructive" }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/pantry/${id}`, { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/pantry"] }),
  });

  const handleAddSubmit = () => {
    if (!addForm.name.trim()) return toast({ title: "Please enter an item name", variant: "destructive" });
    addItem.mutate(addForm);
    setAddOpen(false);
    setAddForm({ name: "", category: "Grains & Pulses", quantity: "", unit: "", notes: "" });
  };

  const handleQuickScan = async () => {
    setScanLoading(true);
    try {
      const res = await fetch("/api/ai/quick-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ answers: scanAnswers }),
      });
      const data = await res.json();
      setScanResult(data.suggestions);
      setScanSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/pantry"] });
    } catch {
      toast({ title: "Error", description: "Could not process scan.", variant: "destructive" });
    } finally {
      setScanLoading(false);
    }
  };

  const grouped = pantryItems.reduce<Record<string, PantryItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const hasRealData = pantryItems.length > 0;

  return (
    <section className="relative w-full px-8 pt-12 pb-24">
      {/* Add Item Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-3xl bg-[#fafaf3] border-0 max-w-md">
          <DialogHeader>
            <DialogTitle className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c]">
              Add Pantry Item
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <Label className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">Item Name *</Label>
              <Input
                className="mt-1 rounded-xl border-[#b1b3a9] bg-white"
                placeholder="e.g. Moong Dal, Basmati Rice..."
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">Category</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {itemCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAddForm({ ...addForm, category: cat })}
                    className={`rounded-full px-3 py-1 text-xs font-bold [font-family:'Manrope',Helvetica] transition-colors ${
                      addForm.category === cat
                        ? "bg-[#1c6d25] text-[#eaffe2]"
                        : "bg-[#e2e3d9] text-[#5d6058] hover:bg-[#d9dbcf]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">Quantity</Label>
                <Input
                  className="mt-1 rounded-xl border-[#b1b3a9] bg-white"
                  placeholder="500, 2, 1..."
                  value={addForm.quantity}
                  onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
                />
              </div>
              <div>
                <Label className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">Unit</Label>
                <Input
                  className="mt-1 rounded-xl border-[#b1b3a9] bg-white"
                  placeholder="g, kg, litres..."
                  value={addForm.unit}
                  onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={handleAddSubmit}
              disabled={addItem.isPending}
              className="w-full rounded-full bg-[#1c6d25] text-[#eaffe2] font-bold [font-family:'Manrope',Helvetica] hover:bg-[#185c20]"
            >
              {addItem.isPending ? "Adding..." : "Add to Pantry"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mx-auto flex w-full max-w-screen-xl flex-col items-start gap-12">
        {/* Header */}
        <header className="flex w-full flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex max-w-2xl flex-col items-start gap-2">
            <p className="[font-family:'Manrope',Helvetica] text-sm font-bold tracking-[1.40px] text-[#b32d02]">
              THE HEART OF YOUR KITCHEN
            </p>
            <h2 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-5xl font-extrabold tracking-[-1.50px] text-[#31332c] sm:text-6xl">
              My Digital Pantry
            </h2>
            <p className="[font-family:'Manrope',Helvetica] text-lg text-[#5d6058]">
              Organized, organic, and life-giving. A curated look at your nutrition reservoir.
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <Button
              type="button"
              variant="ghost"
              className="h-auto rounded-full bg-[#e2e3d9] px-6 py-3 hover:bg-[#d9dbcf]"
              onClick={() => toast({ title: "Coming Soon", description: "Camera scan feature coming soon!" })}
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">📷</span>
                <span className="[font-family:'Manrope',Helvetica] text-sm font-bold text-[#31332c]">Scan Item</span>
              </span>
            </Button>
            <Button
              type="button"
              onClick={() => setAddOpen(true)}
              className="h-auto rounded-full bg-[#1c6d25] px-6 py-3 hover:bg-[#185c20] shadow-lg"
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">+</span>
                <span className="[font-family:'Manrope',Helvetica] text-sm font-bold text-[#eaffe2]">Manual Entry</span>
              </span>
            </Button>
          </div>
        </header>

        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left: Pantry Items */}
          <main className="flex flex-col gap-8 lg:col-span-8">
            {hasRealData ? (
              Object.entries(grouped).map(([category, items]) => (
                <Card key={category} className="rounded-[48px] border-0 bg-[#f4f4ec] shadow-none">
                  <CardContent className="p-8">
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c]">
                          {category}
                        </h3>
                        <Badge className="rounded-full bg-[#e2e3d9] px-3 py-1 [font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058] hover:bg-[#e2e3d9]">
                          {items.length} {items.length === 1 ? "ITEM" : "ITEMS"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {items.map((item) => (
                          <article
                            key={item.id}
                            className="flex w-full items-center gap-4 rounded-[32px] border border-[#b1b3a91a] bg-white p-5 min-h-[106px]"
                          >
                            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${categoryColors[item.category] || "bg-[#f4f4ec]"}`}>
                              <span className="text-2xl">{categoryEmoji[item.category] || "🥗"}</span>
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <h4 className="[font-family:'Manrope',Helvetica] text-base font-bold text-[#31332c]">{item.name}</h4>
                              <p className="[font-family:'Manrope',Helvetica] text-xs font-medium text-[#5d6058]">
                                {item.quantity ? `${item.quantity}${item.unit ? ` ${item.unit}` : ""} remaining` : "In stock"}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteItem.mutate(item.id)}
                              className="shrink-0 text-[#b1b3a9] hover:text-[#aa371c] transition-colors text-sm"
                              aria-label="Remove item"
                            >
                              ✕
                            </button>
                          </article>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                {staticPantrySections.map((section) => (
                  <Card key={section.title} className="rounded-[48px] border-0 bg-[#f4f4ec] shadow-none">
                    <CardContent className="p-8">
                      <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between gap-4">
                          <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c]">
                            {section.title}
                          </h3>
                          <Badge className="rounded-full bg-[#e2e3d9] px-3 py-1 [font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058] hover:bg-[#e2e3d9]">
                            {section.itemCount}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {section.items.map((item) => (
                            <article
                              key={item.name}
                              className="flex w-full items-center gap-4 rounded-[32px] border border-[#b1b3a91a] bg-white p-5 min-h-[106px]"
                            >
                              <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${item.imageBg}`}>
                                <span className="text-2xl">{item.emoji}</span>
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <h4 className="[font-family:'Manrope',Helvetica] text-base font-bold text-[#31332c]">{item.name}</h4>
                                <p className="[font-family:'Manrope',Helvetica] text-xs font-medium text-[#5d6058]">{item.detail}</p>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="rounded-[32px] border-2 border-dashed border-[#b1b3a94c] p-6 text-center">
                  <p className="[font-family:'Manrope',Helvetica] text-sm text-[#5d6058]">
                    These are sample items. Use "Manual Entry" to add your own pantry items.
                  </p>
                </div>
              </>
            )}
          </main>

          {/* Right: Widgets */}
          <aside className="flex flex-col gap-8 lg:col-span-4">
            {/* About to Expire */}
            <Card className="relative overflow-hidden rounded-[48px] border-0 bg-[#e8e9df] shadow-none">
              <CardContent className="p-6">
                <div className="relative flex flex-col gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-base font-bold text-[#31332c]">
                      About to Expire
                    </h3>
                  </div>
                  <div className="flex flex-col gap-4">
                    {expiringItems.length > 0
                      ? expiringItems.map((item) => {
                          const daysLeft = item.expiresAt
                            ? Math.ceil((new Date(item.expiresAt).getTime() - Date.now()) / 86400000)
                            : null;
                          return (
                            <div key={item.id} className="flex items-center gap-4">
                              <div className={`h-12 w-2 shrink-0 rounded-full ${daysLeft !== null && daysLeft <= 1 ? "bg-[#aa371c]" : "bg-[#fa7150]"}`} />
                              <div>
                                <p className="[font-family:'Manrope',Helvetica] text-sm font-bold text-[#31332c]">{item.name}</p>
                                <p className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#671200]">
                                  {daysLeft !== null ? `${daysLeft === 0 ? "Today!" : `${daysLeft}d left`}` : "Expiring soon"}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      : staticExpiringItems.map((item) => (
                          <div key={item.name} className="flex items-center gap-4">
                            <div className={`h-12 w-2 shrink-0 rounded-full ${item.barColor}`} />
                            <div>
                              <p className="[font-family:'Manrope',Helvetica] text-sm font-bold text-[#31332c]">{item.name}</p>
                              <p className={`[font-family:'Manrope',Helvetica] text-xs font-bold ${item.detailColor}`}>{item.detail}</p>
                            </div>
                          </div>
                        ))}
                  </div>
                  <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#aa371c] opacity-5" />
                </div>
              </CardContent>
            </Card>

            {/* AI Quick Scan */}
            <Card className="relative overflow-hidden rounded-[48px] border-0 bg-[#1c6d25] shadow-[0px_25px_50px_-12px_#00000040]">
              <CardContent className="p-8">
                <div className="relative flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[#9df197] text-base">✨</span>
                    <p className="[font-family:'Manrope',Helvetica] text-xs font-bold tracking-[1.20px] text-[#9df197]">
                      AI QUICK SCAN
                    </p>
                  </div>

                  {scanSubmitted && scanResult ? (
                    <>
                      <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-base font-bold text-[#eaffe2]">
                        Recipe Suggestions
                      </h3>
                      <p className="[font-family:'Manrope',Helvetica] text-xs text-[#9df197cc] whitespace-pre-line leading-relaxed">
                        {scanResult}
                      </p>
                      <Button
                        type="button"
                        onClick={() => { setScanSubmitted(false); setScanResult(null); }}
                        className="w-full rounded-full bg-[#096119] text-[#eaffe2] text-xs font-bold [font-family:'Manrope',Helvetica] hover:bg-[#074f14]"
                      >
                        Scan Again
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#eaffe2]">
                        Most Indian kitchens have these — do you have any at home?
                      </h3>
                      <div className="flex flex-col gap-6">
                        {quickScanItems.map((item, i) => (
                          <div
                            key={item.id}
                            className={`flex items-start justify-between gap-4 ${i < quickScanItems.length - 1 ? "border-b border-[#0961194c] pb-4" : ""}`}
                          >
                            <div className="flex flex-col">
                              <h4 className="whitespace-pre-line [font-family:'Manrope',Helvetica] text-base font-bold text-[#eaffe2]">
                                {item.name}
                              </h4>
                              <p className="whitespace-pre-line [font-family:'Manrope',Helvetica] text-xs text-[#9df197cc]">
                                {item.detail}
                              </p>
                            </div>
                            <ToggleGroup
                              type="single"
                              value={scanAnswers[item.id]}
                              onValueChange={(value) => {
                                if (value) setScanAnswers((prev) => ({ ...prev, [item.id]: value }));
                              }}
                              className="flex shrink-0 gap-2"
                            >
                              <ToggleGroupItem
                                value="yes"
                                className="h-auto rounded-full border-0 px-3 py-1 data-[state=on]:bg-[#9df197] data-[state=on]:text-[#005c15] data-[state=off]:bg-[#096119] data-[state=off]:text-[#eaffe2]"
                              >
                                <span className="[font-family:'Manrope',Helvetica] text-xs font-bold">Yes</span>
                              </ToggleGroupItem>
                              <ToggleGroupItem
                                value="no"
                                className="h-auto rounded-full border-0 px-3 py-1 data-[state=on]:bg-[#9df197] data-[state=on]:text-[#005c15] data-[state=off]:bg-[#096119] data-[state=off]:text-[#eaffe2]"
                              >
                                <span className="[font-family:'Manrope',Helvetica] text-xs font-bold">No</span>
                              </ToggleGroupItem>
                            </ToggleGroup>
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        onClick={handleQuickScan}
                        disabled={scanLoading}
                        className="mt-2 w-full rounded-full bg-[#9df197] text-[#005c15] font-bold [font-family:'Manrope',Helvetica] hover:bg-[#7de877]"
                      >
                        {scanLoading ? "Scanning..." : "Get Recipe Ideas"}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Inventory Tags */}
            <Card className="rounded-[48px] border-0 bg-[#ffdeac] shadow-none">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏷️</span>
                    <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-base font-bold text-[#6e4b00]">
                      Inventory Tags
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {inventoryTags.map((tag) => (
                      <Badge
                        key={tag}
                        className="rounded-full bg-white px-4 py-2 [font-family:'Manrope',Helvetica] text-xs font-bold text-[#7f5700] hover:bg-white"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </section>
  );
};
