import { useState, useRef, useMemo } from "react";
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
  "Grains & Pulses", "Fresh Produce", "Spices & Condiments",
  "Dairy", "Superfoods", "Snacks", "Beverages", "Other",
];

const categoryColors: Record<string, string> = {
  "Grains & Pulses": "bg-[#ffdeac]", "Fresh Produce": "bg-[#9df197]",
  "Spices & Condiments": "bg-[#f4e8c1]", "Dairy": "bg-[#e8f4ff]",
  "Superfoods": "bg-[#d4edda]", "Snacks": "bg-[#fde8d8]",
  "Beverages": "bg-[#e8e9df]", "Other": "bg-[#f4f4ec]",
};

const categoryEmoji: Record<string, string> = {
  "Grains & Pulses": "🫘", "Fresh Produce": "🥬", "Spices & Condiments": "🌿",
  "Dairy": "🥛", "Superfoods": "🌱", "Snacks": "🍿", "Beverages": "☕", "Other": "🥗",
};

// Large pool of Indian kitchen items — includes spices, staples, snacks, packaged foods
const INDIAN_KITCHEN_POOL: { name: string; emoji: string; detail: string; category: string }[] = [
  // Spices & Condiments
  { name: "Jeera (Cumin Seeds)", emoji: "🌿", detail: "Aids digestion, anti-bloating", category: "Spices & Condiments" },
  { name: "Haldi (Turmeric)", emoji: "🌿", detail: "Anti-inflammatory, immunity boost", category: "Spices & Condiments" },
  { name: "Curry Leaves", emoji: "🌿", detail: "Rich in iron & antioxidants", category: "Spices & Condiments" },
  { name: "Mustard Seeds (Rai)", emoji: "🌿", detail: "High in selenium & omega-3", category: "Spices & Condiments" },
  { name: "Coriander Seeds (Dhania)", emoji: "🌿", detail: "Regulates blood sugar", category: "Spices & Condiments" },
  { name: "Hing (Asafoetida)", emoji: "🌿", detail: "Reduces gas, aids digestion", category: "Spices & Condiments" },
  { name: "Garam Masala", emoji: "🌿", detail: "Warming blend for flavour", category: "Spices & Condiments" },
  { name: "Red Chilli Powder", emoji: "🌶️", detail: "Boosts metabolism with capsaicin", category: "Spices & Condiments" },
  { name: "Cardamom (Elaichi)", emoji: "🌿", detail: "Freshens breath, aids digestion", category: "Spices & Condiments" },
  { name: "Cinnamon (Dalchini)", emoji: "🌿", detail: "Regulates blood sugar levels", category: "Spices & Condiments" },
  // Grains & Pulses
  { name: "Moong Dal", emoji: "🫘", detail: "High protein, easy to digest", category: "Grains & Pulses" },
  { name: "Toor Dal (Arhar)", emoji: "🫘", detail: "Rich in protein & folate", category: "Grains & Pulses" },
  { name: "Chana Dal", emoji: "🫘", detail: "Low glycemic, high fibre", category: "Grains & Pulses" },
  { name: "Rajma (Kidney Beans)", emoji: "🫘", detail: "Excellent protein & iron", category: "Grains & Pulses" },
  { name: "Basmati Rice", emoji: "🍚", detail: "Low glycemic index rice", category: "Grains & Pulses" },
  { name: "Whole Wheat Flour (Atta)", emoji: "🌾", detail: "High fibre, better than maida", category: "Grains & Pulses" },
  { name: "Besan (Chickpea Flour)", emoji: "🌾", detail: "High protein, gluten-free option", category: "Grains & Pulses" },
  { name: "Poha (Flattened Rice)", emoji: "🍚", detail: "Iron-fortified, quick energy", category: "Grains & Pulses" },
  { name: "Sooji (Semolina)", emoji: "🌾", detail: "Good source of B vitamins", category: "Grains & Pulses" },
  { name: "Oats", emoji: "🥣", detail: "Beta-glucan reduces cholesterol", category: "Grains & Pulses" },
  // Fresh Produce
  { name: "Onions", emoji: "🧅", detail: "Prebiotics, quercetin antioxidant", category: "Fresh Produce" },
  { name: "Tomatoes", emoji: "🍅", detail: "Lycopene for heart health", category: "Fresh Produce" },
  { name: "Garlic", emoji: "🧄", detail: "Antimicrobial, lowers blood pressure", category: "Fresh Produce" },
  { name: "Ginger (Adrak)", emoji: "🫚", detail: "Anti-nausea, anti-inflammatory", category: "Fresh Produce" },
  { name: "Green Chillies", emoji: "🌶️", detail: "Vitamin C, metabolism boost", category: "Fresh Produce" },
  { name: "Spinach (Palak)", emoji: "🥬", detail: "Iron 2.7mg/100g, folate rich", category: "Fresh Produce" },
  { name: "Methi (Fenugreek Leaves)", emoji: "🥬", detail: "Controls blood sugar, iron rich", category: "Fresh Produce" },
  { name: "Potatoes", emoji: "🥔", detail: "Potassium, vitamin B6", category: "Fresh Produce" },
  // Dairy
  { name: "Paneer", emoji: "🧀", detail: "High protein, calcium rich", category: "Dairy" },
  { name: "Curd (Dahi)", emoji: "🥛", detail: "Probiotics for gut health", category: "Dairy" },
  { name: "Ghee", emoji: "🧈", detail: "Healthy fats, vitamin A & D", category: "Dairy" },
  { name: "Amul Butter", emoji: "🧈", detail: "Vitamin A, energy dense", category: "Dairy" },
  // Superfoods
  { name: "Moringa Powder", emoji: "🌱", detail: "Iron 28mg/100g, complete protein", category: "Superfoods" },
  { name: "Flax Seeds (Alsi)", emoji: "🌱", detail: "Omega-3 fatty acids, fibre", category: "Superfoods" },
  { name: "Chia Seeds", emoji: "🌱", detail: "Calcium, protein, omega-3", category: "Superfoods" },
  { name: "Sesame Seeds (Til)", emoji: "🌱", detail: "Iron 14.6mg/100g, calcium", category: "Superfoods" },
  { name: "Pumpkin Seeds", emoji: "🌱", detail: "Zinc, magnesium, protein", category: "Superfoods" },
  // Snacks & Packaged
  { name: "Roasted Peanuts (Moongfali)", emoji: "🥜", detail: "Protein 26g/100g, healthy fats", category: "Snacks" },
  { name: "Fox Nuts (Makhana)", emoji: "🍿", detail: "Low calorie, high protein snack", category: "Snacks" },
  { name: "Murmura (Puffed Rice)", emoji: "🍿", detail: "Light, low calorie evening snack", category: "Snacks" },
  { name: "Chivda (Namkeen Mix)", emoji: "🍿", detail: "Quick energy snack", category: "Snacks" },
  { name: "Khakhra", emoji: "🍪", detail: "Whole wheat, low calorie crisp", category: "Snacks" },
  // Beverages
  { name: "Masala Chai Mix", emoji: "☕", detail: "Antioxidants from spice blend", category: "Beverages" },
  { name: "Haldi Doodh Mix", emoji: "🥛", detail: "Golden milk for immunity", category: "Beverages" },
  { name: "Sattu (Roasted Gram Flour)", emoji: "🥤", detail: "Protein 22g/100g, cooling drink", category: "Beverages" },
];

const staticPantrySections = [
  {
    title: "Grains & Pulses", itemCount: "4 ITEMS",
    items: [
      { name: "Moong Dal", detail: "850g remaining", imageBg: "bg-[#ffdeac]", emoji: "🫘" },
      { name: "Basmati Rice", detail: "2.4kg remaining", imageBg: "bg-[#ffdeac]", emoji: "🍚" },
    ],
  },
  {
    title: "Fresh & Superfoods", itemCount: "3 ITEMS",
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

async function imageToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({ base64: result.split(",")[1], mimeType: file.type });
    };
    reader.readAsDataURL(file);
  });
}

function pickSuggestions(pantryItems: PantryItem[], count = 4) {
  const pantryNames = pantryItems.map((p) => p.name.toLowerCase());
  const available = INDIAN_KITCHEN_POOL.filter(
    (item) => !pantryNames.some((n) => n.includes(item.name.toLowerCase().split(" ")[0].toLowerCase()) || item.name.toLowerCase().includes(n.split(" ")[0]))
  );
  // Shuffle and pick count items
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export const PantryOverviewSection = (): JSX.Element => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "", category: "Grains & Pulses", quantity: "", unit: "", notes: "", expiresAt: "",
  });

  const [scanOpen, setScanOpen] = useState(false);
  const [scanMode, setScanMode] = useState<"item" | "expiry">("item");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [expiryRetry, setExpiryRetry] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Quick scan state
  const [scanAnswers, setScanAnswers] = useState<boolean[]>([]);
  const [scanSubmitted, setScanSubmitted] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanLoading2, setScanLoading2] = useState(false);
  // Force re-pick when user clicks "Scan Again"
  const [scanSeed, setScanSeed] = useState(0);

  const { data: pantryItems = [] } = useQuery<PantryItem[]>({ queryKey: ["/api/pantry"] });
  const { data: expiringItems = [] } = useQuery<PantryItem[]>({ queryKey: ["/api/pantry/expiring"] });

  // Dynamic suggestions: 4 items NOT already in pantry
  const suggestedItems = useMemo(() => {
    return pickSuggestions(pantryItems, 4);
  }, [pantryItems, scanSeed]); // eslint-disable-line

  // Initialise answers when suggestions change
  const initAnswers = useMemo(() => new Array(suggestedItems.length).fill(false), [suggestedItems]);
  const [localAnswers, setLocalAnswers] = useState<boolean[]>(initAnswers);

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
    addItem.mutate({ ...addForm, expiresAt: addForm.expiresAt || undefined });
    setAddOpen(false);
    setAddForm({ name: "", category: "Grains & Pulses", quantity: "", unit: "", notes: "", expiresAt: "" });
  };

  const handleImageScan = async (file: File) => {
    setScanLoading(true);
    setExpiryRetry(false);
    setScanPreview(URL.createObjectURL(file));
    try {
      const { base64, mimeType } = await imageToBase64(file);
      const endpoint = scanMode === "item" ? "/api/ai/scan-item" : "/api/ai/scan-expiry";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ base64, mimeType }),
      });
      const data = await res.json();

      if (scanMode === "item") {
        if (data.name) {
          setAddForm((f) => ({
            ...f, name: data.name,
            category: data.category || f.category,
            quantity: data.quantity || f.quantity,
            unit: data.unit || f.unit,
          }));
          setScanOpen(false);
          setAddOpen(true);
          setScanPreview(null);
          toast({ title: "Item detected!", description: `Found: ${data.name}` });
        } else {
          toast({ title: "Could not detect item", description: "Try a clearer photo or add manually.", variant: "destructive" });
        }
      } else {
        if (data.expiresAt) {
          setAddForm((f) => ({ ...f, expiresAt: data.expiresAt }));
          setScanOpen(false);
          toast({ title: "Expiry date found!", description: `Expires: ${data.expiresAt}` });
        } else if (data.retryOtherSide) {
          setExpiryRetry(true);
          toast({ title: "Date not found on this side", description: "Try the other side of the box.", variant: "destructive" });
        } else {
          toast({ title: "No expiry date found", description: "Enter the date manually.", variant: "destructive" });
          setScanOpen(false);
        }
      }
    } catch {
      toast({ title: "Scan failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setScanLoading(false);
    }
  };

  const handleQuickScan = async () => {
    setScanLoading2(true);
    try {
      const confirmedItems = suggestedItems.filter((_, i) => localAnswers[i]).map((item) => item.name);
      const answers = localAnswers.map((v) => v ? "yes" : "no");
      const res = await fetch("/api/ai/quick-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ answers, items: suggestedItems.map((i) => i.name) }),
      });
      const data = await res.json();
      setScanResult(data.suggestions);
      setScanSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/pantry"] });
    } catch {
      toast({ title: "Error", description: "Could not process scan.", variant: "destructive" });
    } finally {
      setScanLoading2(false);
    }
  };

  const resetScan = () => {
    setScanSubmitted(false);
    setScanResult(null);
    setScanSeed((s) => s + 1);
    setLocalAnswers(new Array(4).fill(false));
  };

  const grouped = pantryItems.reduce<Record<string, PantryItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const hasRealData = pantryItems.length > 0;

  return (
    <section className="relative w-full px-8 pt-12 pb-24">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleImageScan(e.target.files[0]); e.target.value = ""; }} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleImageScan(e.target.files[0]); e.target.value = ""; }} />

      {/* Add Item Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-3xl bg-[#fafaf3] border-0 max-w-md">
          <DialogHeader>
            <DialogTitle className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c]">Add Pantry Item</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <Label className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">Item Name *</Label>
              <Input className="mt-1 rounded-xl border-[#b1b3a9] bg-white" placeholder="e.g. Moong Dal, Namkeen, Amul Butter..."
                value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
            </div>
            <div>
              <Label className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">Category</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {itemCategories.map((cat) => (
                  <button key={cat} type="button" onClick={() => setAddForm({ ...addForm, category: cat })}
                    className={`rounded-full px-3 py-1 text-xs font-bold [font-family:'Manrope',Helvetica] transition-colors ${
                      addForm.category === cat ? "bg-[#1c6d25] text-[#eaffe2]" : "bg-[#e2e3d9] text-[#5d6058] hover:bg-[#d9dbcf]"}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">Quantity</Label>
                <Input className="mt-1 rounded-xl border-[#b1b3a9] bg-white" placeholder="500, 2, 1..."
                  value={addForm.quantity} onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })} />
              </div>
              <div>
                <Label className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">Unit</Label>
                <Input className="mt-1 rounded-xl border-[#b1b3a9] bg-white" placeholder="g, kg, pieces..."
                  value={addForm.unit} onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="[font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058]">Expiry Date (optional)</Label>
              <div className="mt-1 flex gap-2">
                <Input type="date" className="rounded-xl border-[#b1b3a9] bg-white flex-1"
                  value={addForm.expiresAt} onChange={(e) => setAddForm({ ...addForm, expiresAt: e.target.value })} />
                <button type="button" onClick={() => { setScanMode("expiry"); setScanOpen(true); setScanPreview(null); }}
                  className="rounded-xl bg-[#e2e3d9] px-3 text-sm hover:bg-[#d9dbcf] [font-family:'Manrope',Helvetica] font-bold text-[#31332c] whitespace-nowrap">
                  📷 Scan
                </button>
              </div>
            </div>
            <Button type="button" onClick={handleAddSubmit} disabled={addItem.isPending}
              className="w-full rounded-full bg-[#1c6d25] text-[#eaffe2] font-bold [font-family:'Manrope',Helvetica] hover:bg-[#185c20]">
              {addItem.isPending ? "Adding..." : "Add to Pantry"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Scan Dialog */}
      <Dialog open={scanOpen} onOpenChange={(o) => { setScanOpen(o); if (!o) { setScanPreview(null); setExpiryRetry(false); } }}>
        <DialogContent className="rounded-3xl bg-[#fafaf3] border-0 max-w-sm">
          <DialogHeader>
            <DialogTitle className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c]">
              {scanMode === "item" ? "📷 Scan Pantry Item" : "📅 Scan Expiry Date"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {scanMode === "expiry" && expiryRetry && (
              <div className="rounded-2xl bg-[#fff5ee] border border-[#fa7150] p-4 text-sm [font-family:'Manrope',Helvetica] text-[#aa371c] font-bold">
                📦 Date not visible — try the other side of the box!
              </div>
            )}
            {scanPreview && <img src={scanPreview} alt="Scan preview" className="w-full max-h-48 object-contain rounded-2xl bg-[#f4f4ec]" />}
            {scanLoading ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-10 h-10 border-4 border-[#1c6d25] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm [font-family:'Manrope',Helvetica] text-[#5d6058]">
                  {scanMode === "item" ? "Identifying item..." : "Reading expiry date..."}
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-[#5d6058] [font-family:'Manrope',Helvetica]">
                  {scanMode === "item"
                    ? "Take a photo or upload an image. AI will identify the item and category."
                    : "Take a photo where the expiry date is printed. AI will read it for you."}
                </p>
                <Button type="button" onClick={() => cameraInputRef.current?.click()}
                  className="w-full rounded-full bg-[#1c6d25] text-[#eaffe2] font-bold [font-family:'Manrope',Helvetica] hover:bg-[#185c20]">
                  📷 Use Camera
                </Button>
                <Button type="button" onClick={() => fileInputRef.current?.click()} variant="ghost"
                  className="w-full rounded-full border border-[#e2e3d9] text-[#31332c] font-bold [font-family:'Manrope',Helvetica] hover:bg-[#f4f4ec]">
                  🖼️ Upload Image
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="mx-auto flex w-full max-w-screen-xl flex-col items-start gap-12">
        {/* Header */}
        <header className="flex w-full flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="flex max-w-2xl flex-col items-start gap-2">
            <p className="[font-family:'Manrope',Helvetica] text-sm font-bold tracking-[1.40px] text-[#b32d02]">THE HEART OF YOUR KITCHEN</p>
            <h2 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-5xl font-extrabold tracking-[-1.50px] text-[#31332c] sm:text-6xl">My Digital Pantry</h2>
            <p className="[font-family:'Manrope',Helvetica] text-lg text-[#5d6058]">Organized, organic, and life-giving. A curated look at your nutrition reservoir.</p>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <Button type="button" variant="ghost" className="h-auto rounded-full bg-[#e2e3d9] px-6 py-3 hover:bg-[#d9dbcf]"
              onClick={() => { setScanMode("item"); setScanOpen(true); setScanPreview(null); }} data-testid="button-scan-item">
              <span className="flex items-center gap-3">
                <span className="text-lg">📷</span>
                <span className="[font-family:'Manrope',Helvetica] text-sm font-bold text-[#31332c]">Scan Item</span>
              </span>
            </Button>
            <Button type="button" onClick={() => setAddOpen(true)}
              className="h-auto rounded-full bg-[#1c6d25] px-6 py-3 hover:bg-[#185c20] shadow-lg" data-testid="button-manual-entry">
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
                        <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c]">{category}</h3>
                        <Badge className="rounded-full bg-[#e2e3d9] px-3 py-1 [font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058] hover:bg-[#e2e3d9]">
                          {items.length} {items.length === 1 ? "ITEM" : "ITEMS"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {items.map((item) => {
                          const daysLeft = item.expiresAt
                            ? Math.ceil((new Date(item.expiresAt).getTime() - Date.now()) / 86400000)
                            : null;
                          return (
                            <article key={item.id} className="flex w-full items-center gap-4 rounded-[32px] border border-[#b1b3a91a] bg-white p-5 min-h-[106px]">
                              <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${categoryColors[item.category] || "bg-[#f4f4ec]"}`}>
                                <span className="text-2xl">{categoryEmoji[item.category] || "🥗"}</span>
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <h4 className="[font-family:'Manrope',Helvetica] text-base font-bold text-[#31332c]">{item.name}</h4>
                                <p className="[font-family:'Manrope',Helvetica] text-xs font-medium text-[#5d6058]">
                                  {item.quantity ? `${item.quantity}${item.unit ? ` ${item.unit}` : ""} remaining` : "In stock"}
                                </p>
                                {daysLeft !== null && daysLeft <= 7 && (
                                  <p className={`[font-family:'Manrope',Helvetica] text-xs font-bold ${daysLeft <= 2 ? "text-[#aa371c]" : "text-[#fa7150]"}`}>
                                    ⏰ {daysLeft <= 0 ? "Expired!" : `${daysLeft}d left`}
                                  </p>
                                )}
                              </div>
                              <button type="button" onClick={() => deleteItem.mutate(item.id)}
                                className="shrink-0 text-[#b1b3a9] hover:text-[#aa371c] transition-colors text-sm">✕</button>
                            </article>
                          );
                        })}
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
                          <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-xl font-bold text-[#31332c]">{section.title}</h3>
                          <Badge className="rounded-full bg-[#e2e3d9] px-3 py-1 [font-family:'Manrope',Helvetica] text-xs font-bold text-[#5d6058] hover:bg-[#e2e3d9]">{section.itemCount}</Badge>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {section.items.map((item) => (
                            <article key={item.name} className="flex w-full items-center gap-4 rounded-[32px] border border-[#b1b3a91a] bg-white p-5 min-h-[106px]">
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
                    These are sample items. Use "Scan Item" or "Manual Entry" to add your real pantry.
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
                    <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-base font-bold text-[#31332c]">About to Expire</h3>
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
                                  {daysLeft !== null ? (daysLeft === 0 ? "Today!" : `${daysLeft}d left`) : "Expiring soon"}
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

            {/* AI Quick Scan — DYNAMIC */}
            <Card className="relative overflow-hidden rounded-[48px] border-0 bg-[#1c6d25] shadow-[0px_25px_50px_-12px_#00000040]">
              <CardContent className="p-8">
                <div className="relative flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[#9df197] text-base">✨</span>
                    <p className="[font-family:'Manrope',Helvetica] text-xs font-bold tracking-[1.20px] text-[#9df197]">AI QUICK SCAN</p>
                  </div>

                  {scanSubmitted && scanResult ? (
                    <>
                      <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-base font-bold text-[#eaffe2]">🍽️ Recipe Ideas For You</h3>
                      <div className="max-h-72 overflow-y-auto">
                        <p className="[font-family:'Manrope',Helvetica] text-xs text-[#9df197cc] whitespace-pre-line leading-relaxed">{scanResult}</p>
                      </div>
                      <Button type="button" onClick={resetScan}
                        className="w-full rounded-full bg-[#096119] text-[#eaffe2] text-xs font-bold [font-family:'Manrope',Helvetica] hover:bg-[#074f14]">
                        🔄 Scan Different Items
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-lg font-bold text-[#eaffe2]">
                        Do you have any of these at home?
                      </h3>
                      <p className="[font-family:'Manrope',Helvetica] text-xs text-[#9df197cc]">
                        Mark what you have — we'll suggest recipes, filter your allergens, and show nutrition info.
                      </p>
                      <div className="flex flex-col gap-4">
                        {suggestedItems.map((item, i) => (
                          <div key={`${item.name}-${scanSeed}`}
                            className={`flex items-start justify-between gap-4 ${i < suggestedItems.length - 1 ? "border-b border-[#0961194c] pb-4" : ""}`}>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-base">{item.emoji}</span>
                                <h4 className="[font-family:'Manrope',Helvetica] text-sm font-bold text-[#eaffe2]">{item.name}</h4>
                              </div>
                              <p className="[font-family:'Manrope',Helvetica] text-[10px] text-[#9df197cc] mt-0.5">{item.detail}</p>
                              <Badge className="mt-1 w-fit rounded-full bg-[#074f14] px-2 py-0 text-[9px] font-bold text-[#9df197] hover:bg-[#074f14] [font-family:'Manrope',Helvetica]">
                                {item.category}
                              </Badge>
                            </div>
                            <ToggleGroup type="single" value={localAnswers[i] ? "yes" : "no"}
                              onValueChange={(v) => {
                                if (!v) return;
                                setLocalAnswers((prev) => {
                                  const next = [...prev];
                                  next[i] = v === "yes";
                                  return next;
                                });
                              }}
                              className="flex shrink-0 gap-1">
                              <ToggleGroupItem value="yes"
                                className="h-auto rounded-full border-0 px-2.5 py-1 text-xs data-[state=on]:bg-[#9df197] data-[state=on]:text-[#005c15] data-[state=off]:bg-[#096119] data-[state=off]:text-[#eaffe2]">
                                Yes
                              </ToggleGroupItem>
                              <ToggleGroupItem value="no"
                                className="h-auto rounded-full border-0 px-2.5 py-1 text-xs data-[state=on]:bg-[#aa371c] data-[state=on]:text-white data-[state=off]:bg-[#096119] data-[state=off]:text-[#eaffe2]">
                                No
                              </ToggleGroupItem>
                            </ToggleGroup>
                          </div>
                        ))}
                      </div>
                      <Button type="button" onClick={handleQuickScan} disabled={scanLoading2}
                        className="mt-1 w-full rounded-full bg-[#9df197] text-[#005c15] font-bold [font-family:'Manrope',Helvetica] hover:bg-[#7de877]">
                        {scanLoading2 ? "Getting recipes..." : "✨ Get Recipe Ideas"}
                      </Button>
                      <button type="button" onClick={resetScan}
                        className="text-center text-[10px] text-[#9df197cc] hover:text-[#9df197] [font-family:'Manrope',Helvetica]">
                        Show different items ↻
                      </button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pantry Labels */}
            <Card className="rounded-[48px] border-0 bg-[#ffdeac] shadow-none">
              <CardContent className="p-6">
                <h3 className="[font-family:'Plus_Jakarta_Sans',Helvetica] text-base font-bold text-[#6e4b00] mb-4">Pantry Labels</h3>
                <div className="flex flex-wrap gap-2">
                  {["High Fiber", "Protein Rich", "Iron Rich", "Gluten Free", "Organic", "Low Carb"].map((tag) => (
                    <Badge key={tag} className="rounded-full bg-white px-3 py-1 [font-family:'Manrope',Helvetica] text-xs font-bold text-[#7f5700] hover:bg-white">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </section>
  );
};
