import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  DollarSign,
  Package,
  TrendingUp,
  Search,
  Trash2,
  Sparkles,
  Check,
  Truck,
  User,
  Mail,
  MapPin,
  Phone,
  Calendar,
  ChevronRight,
  X,
  Plus,
  Loader,
  RefreshCcw,
  Eye,
  Info,
  FileText,
  Upload
} from "lucide-react";
import { Perfume } from "../data";

interface AdminDashboardProps {
  perfumes: Perfume[];
  onRefreshCatalog: () => Promise<void>;
  themeAccentColor?: string;
  onLogout?: () => void;
  onDeletePerfume?: (id: string, name: string) => void;
  onSelectPerfume?: (perfume: Perfume) => void;
}

interface Order {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zipCode: string;
  };
  items: Array<{
    perfume: Perfume;
    selectedSize: string;
    selectedPrice: number;
    quantity: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  date: string;
  status: "En attente" | "En cours" | "Expédié" | "Livré";
}

export default function AdminDashboard({
  perfumes,
  onRefreshCatalog,
  themeAccentColor = "#D4AF37",
  onLogout,
  onDeletePerfume,
  onSelectPerfume
}: AdminDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<"orders" | "catalog">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderQuery, setOrderQuery] = useState("");
  const [catalogQuery, setCatalogQuery] = useState("");

  // AI Creator State
  const [aiBrand, setAiBrand] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiStatus, setAiStatus] = useState("");
  const [aiError, setAiError] = useState("");
  const [suggestedPerfume, setSuggestedPerfume] = useState<any | null>(null);

  // Batch Import State
  const [catalogMode, setCatalogMode] = useState<"single" | "batch">("single");
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [batchLines, setBatchLines] = useState<Array<{
    numero: number;
    original: string;
    dupe1: string | null;
    dupe2: string | null;
    saison: "ete" | "hiver" | "mi-saison" | "dubai" | "autre";
    genre: "homme" | "femme" | "unisexe";
    brand: string;
    model: string;
    theme: "gold" | "pink" | "blue";
    category: "Homme" | "Femme" | "Unisexe";
    status: "pending" | "processing" | "success" | "error";
    error?: string;
  }>>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const FAMOUS_BRANDS = [
    "Tom Ford", "Jean Paul Gaultier", "Yves Saint Laurent", "Maison Francis Kurkdjian",
    "Parfums de Marly", "Dolce & Gabbana", "Van Cleef & Arpels", "Acqua di Parma",
    "Comme des Garçons", "Victor & Rolf", "Viktor & Rolf", "Estée Lauder", "Estee Lauder",
    "Bath & Body Works", "Victoria's Secret", "Penhaligon's", "L'Artisan Parfumeur",
    "Dior", "Chanel", "Guerlain", "Creed", "Hermès", "Hermes", "Prada", "Versace",
    "Roja", "Xerjoff", "Byredo", "Le Labo", "Diptyque", "Kilian", "Gisada", "Montale",
    "Mancera", "Azzaro", "Lancôme", "Lancome", "Bvlgari", "Givenchy", "YSL", "MFK",
    "PdM", "JPG", "Armani", "Cartier", "Chloé", "Chloe", "Lalique", "Mugler", "Amouage",
    "Nishane", "Initio", "Jo Malone"
  ];

  const parsePerfumeLine = (line: string) => {
    // Remove list bullets and trim
    const cleanLine = line.replace(/^\s*[-*+•]\s*/, '').trim();
    if (!cleanLine) return null;

    // Try splitters: - : / ; \t
    const splitters = [" - ", " – ", " — ", " : ", " :", ": ", " / ", " | ", " ; ", ";"];
    for (const splitter of splitters) {
      if (cleanLine.includes(splitter)) {
        const parts = cleanLine.split(splitter);
        const brand = parts[0].trim();
        const model = parts.slice(1).join(splitter).trim();
        if (brand && model) return { brand, model };
      }
    }

    // Check famous brands
    const lowerLine = cleanLine.toLowerCase();
    for (const brand of FAMOUS_BRANDS) {
      if (lowerLine.startsWith(brand.toLowerCase())) {
        const brandLen = brand.length;
        if (lowerLine.length === brandLen) {
          return { brand, model: brand };
        }
        if (lowerLine[brandLen] === ' ' || lowerLine[brandLen] === ',' || lowerLine[brandLen] === '-') {
          const model = cleanLine.substring(brandLen).replace(/^[\s,-]+/, '').trim();
          if (model) {
            return { brand, model };
          }
        }
      }
    }

    // Split by first space
    const firstSpaceIdx = cleanLine.indexOf(' ');
    if (firstSpaceIdx > -1) {
      return {
        brand: cleanLine.substring(0, firstSpaceIdx).trim(),
        model: cleanLine.substring(firstSpaceIdx + 1).trim()
      };
    }

    // Fallback
    return { brand: cleanLine, model: cleanLine };
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === "text/plain" || file.name.endsWith(".txt"))) {
      processSelectedFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    setBatchFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const lines = text.split("\n");
        const parsed: Array<{
          numero: number;
          original: string;
          dupe1: string | null;
          dupe2: string | null;
          saison: "ete" | "hiver" | "mi-saison" | "dubai" | "autre";
          genre: "homme" | "femme" | "unisexe";
          brand: string;
          model: string;
          theme: "gold" | "pink" | "blue";
          category: "Homme" | "Femme" | "Unisexe";
          status: "pending";
        }> = [];

        let currentSaison: "ete" | "hiver" | "mi-saison" | "dubai" | "autre" = "ete";
        let currentGenre: "homme" | "femme" | "unisexe" = "homme";
        let currentCategory: "Homme" | "Femme" | "Unisexe" = "Homme";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          const upperLine = trimmed.toUpperCase();
          const startsWithDigit = /^\d+/.test(trimmed);

          // Detect Section Header Line
          if (!startsWithDigit && (upperLine.includes("—") || upperLine.includes(" - ") || upperLine.includes("HOMME") || upperLine.includes("FEMME") || upperLine.includes("UNISEXE") || upperLine.includes("DUBAO") || upperLine.includes("DUBAÏ") || upperLine.includes("DUBAI") || upperLine.includes("SAISON"))) {
            // Saison Extraction
            if (upperLine.includes("HIVER")) {
              currentSaison = "hiver";
            } else if (upperLine.includes("ÉTÉ") || upperLine.includes("ETE")) {
              currentSaison = "ete";
            } else if (upperLine.includes("PRINTEMPS") || upperLine.includes("AUTOMNE") || upperLine.includes("MI-SAISON")) {
              currentSaison = "mi-saison";
            } else if (upperLine.includes("DUBAÏ") || upperLine.includes("DUBAI")) {
              currentSaison = "dubai";
            } else {
              currentSaison = "autre";
            }

            // Genre / Category Extraction
            if (upperLine.includes("FEMME")) {
              currentGenre = "femme";
              currentCategory = "Femme";
            } else if (upperLine.includes("UNISEXE")) {
              currentGenre = "unisexe";
              currentCategory = "Unisexe";
            } else if (upperLine.includes("HOMME")) {
              currentGenre = "homme";
              currentCategory = "Homme";
            }
            continue;
          }

          // Parse ordinary numeric-prefixed perfume line, e.g. "1. Creed Aventus = Club de Nuit = Supremacy"
          const match = trimmed.match(/^(\d+)[\s.]*([^]*)$/);
          let numero = parsed.length + 1;
          let content = trimmed;
          if (match) {
            numero = parseInt(match[1], 10);
            content = match[2].trim();
          }

          // Split on " = " string representation
          const parts = content.split(/\s*=\s*/).map(p => p.trim());
          const original = parts[0] || "";
          if (!original) continue;

          const dupe1 = parts[1] || null;
          const dupe2 = parts[2] || null;

          // Extrapolate Brand + Model
          const parsedOrig = parsePerfumeLine(original);
          const brand = parsedOrig ? parsedOrig.brand : original;
          const model = parsedOrig ? parsedOrig.model : original;

          // Assign color theme according to specifications
          let theme: "gold" | "pink" | "blue" = "gold";
          if (currentCategory === "Femme") {
            theme = "pink";
          } else if (currentCategory === "Unisexe") {
            theme = "blue";
          } else {
            // All male fragrances default to gold theme, except marine/fresh which get blue theme
            const lowerOrig = original.toLowerCase();
            if (["sport", "fresh", "frais", "blue", "bleu", "water", "eau", "marine", "ocean", "aquatic"].some(k => lowerOrig.includes(k))) {
              theme = "blue";
            } else {
              theme = "gold";
            }
          }

          parsed.push({
            numero,
            original,
            dupe1,
            dupe2,
            saison: currentSaison,
            genre: currentGenre,
            brand,
            model,
            theme,
            category: currentCategory,
            status: "pending"
          });
        }

        setBatchLines(parsed);
        setBatchProgress(0);
      }
    };
    reader.readAsText(file);
  };

  const startBatchImport = async () => {
    if (batchLines.length === 0 || isBatchProcessing) return;

    setIsBatchProcessing(true);
    let successCount = 0;

    for (let i = 0; i < batchLines.length; i++) {
      const current = batchLines[i];
      if (current.status !== "pending") continue;

      // Update item state to "processing"
      setBatchLines(prev => prev.map((item, idx) => idx === i ? { ...item, status: "processing" } : item));

      try {
        // Step 1: Search details on API
        const searchRes = await fetch("/api/search-perfume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brand: current.brand, model: current.model })
        });
        const searchData = await searchRes.json();

        if (!searchData.success || !searchData.perfume) {
          throw new Error(searchData.error || "Recherche Gemini infructueuse");
        }

        const suggested = searchData.perfume;
        const priceNum = Number(suggested.price) || 150;
        const finalPerfume = {
          ...suggested,
          price: priceNum,
          topNotes: (suggested.topNotes || []).map((n: string) => n.trim()).filter(Boolean),
          heartNotes: (suggested.heartNotes || []).map((n: string) => n.trim()).filter(Boolean),
          baseNotes: (suggested.baseNotes || []).map((n: string) => n.trim()).filter(Boolean),
          notes: (suggested.notes || []).map((n: string) => n.trim()).filter(Boolean),
          sizes: [
            { ml: "100ml", price: priceNum },
            { ml: "50ml", price: Math.round(priceNum * 0.65) }
          ],
          // Keep all parsed TXT file attributes
          numero: current.numero,
          original: current.original,
          dupe1: current.dupe1,
          dupe2: current.dupe2,
          saison: current.saison,
          genre: current.genre,
          theme: current.theme,
          category: current.category
        };

        // Step 2: Post to catalog
        const saveRes = await fetch("/api/perfumes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalPerfume)
        });
        const saveData = await saveRes.json();

        if (saveData.success) {
          successCount++;
          setBatchLines(prev => prev.map((item, idx) => idx === i ? { ...item, status: "success" } : item));
          // Refresh catalog as we go so the list immediately shows updates
          await onRefreshCatalog();
        } else {
          throw new Error("L'intégration au catalogue a échoué");
        }
      } catch (err: any) {
        console.error("Batch Import Error:", err);
        setBatchLines(prev => prev.map((item, idx) => idx === i ? { ...item, status: "error", error: err.message || "Erreur" } : item));
      }

      // Update progress meter
      setBatchProgress(Math.round(((i + 1) / batchLines.length) * 100));
    }

    setIsBatchProcessing(false);
  };
  
  // Dynamic order stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    averageOrder: 0,
    deliveredCount: 0,
    pendingCount: 0
  });

  // Fetch orders
  const fetchOrders = async () => {
    setIsOrdersLoading(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
        calculateStats(data.orders);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setIsOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const calculateStats = (loadedOrders: Order[]) => {
    const totalRev = loadedOrders.reduce((sum, o) => sum + o.total, 0);
    const avgOrder = loadedOrders.length ? Math.round(totalRev / loadedOrders.length) : 0;
    const delivered = loadedOrders.filter(o => o.status === "Livré").length;
    const pending = loadedOrders.filter(o => o.status === "En attente").length;

    setStats({
      totalRevenue: totalRev,
      averageOrder: avgOrder,
      deliveredCount: delivered,
      pendingCount: pending
    });
  };

  // Change Order Status
  const handleUpdateOrderStatus = async (orderId: string, currentStatus: string) => {
    const statusOrder: Array<Order["status"]> = ["En attente", "En cours", "Expédié", "Livré"];
    const currentIndex = statusOrder.indexOf(currentStatus as any);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const nextStatus = statusOrder[nextIndex];

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: nextStatus } : o);
        setOrders(updatedOrders);
        calculateStats(updatedOrders);
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: nextStatus });
        }
      }
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };

  // Delete Order
  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Voulez-vous supprimer définitivement cette commande de l'historique ?")) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        const updatedOrders = orders.filter(o => o.id !== orderId);
        setOrders(updatedOrders);
        calculateStats(updatedOrders);
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(null);
        }
      }
    } catch (err) {
      console.error("Error deleting order:", err);
    }
  };

  // Run Gemini AI search to find and complete perfume details
  const triggerAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiBrand.trim() || !aiModel.trim()) return;

    setIsAiSearching(true);
    setAiError("");
    setSuggestedPerfume(null);
    setAiStatus("Recherche en cours sur Fragrantica et Parfumo...");

    try {
      // Step 1: Query API
      const response = await fetch("/api/search-perfume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: aiBrand.trim(), model: aiModel.trim() })
      });
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Une erreur inconnue est survenue.");
      }

      setAiStatus("Analyse olfactive et structuration des notes...");
      setSuggestedPerfume(data.perfume);
      setAiStatus("");
    } catch (err: any) {
      console.error("AI Creation Error:", err);
      setAiError(err.message || "Impossible de récupérer les notes. Essayez une autre fragrance.");
      setAiStatus("");
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleUpdateSuggestedField = (field: string, value: any) => {
    setSuggestedPerfume((prev: any) => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  };

  const handleUpdateSuggestedNotes = (field: "topNotes" | "heartNotes" | "baseNotes", value: string) => {
    const arr = value.split(",").map(part => part.trim());
    setSuggestedPerfume((prev: any) => {
      if (!prev) return null;
      const updated = { ...prev, [field]: arr };
      const mergedNotes = Array.from(new Set([
        ...(updated.topNotes || []),
        ...(updated.heartNotes || []),
        ...(updated.baseNotes || [])
      ])).filter(Boolean);
      updated.notes = mergedNotes;
      return updated;
    });
  };

  // Save parsed perfume directly to active catalog
  const handleSavePerfumeToCatalog = async () => {
    if (!suggestedPerfume) return;
    try {
      setAiStatus("Enregistrement dans le catalogue officiel...");
      
      const priceNum = Number(suggestedPerfume.price) || 150;
      const finalPerfume = {
        ...suggestedPerfume,
        price: priceNum,
        topNotes: (suggestedPerfume.topNotes || []).map((n: string) => n.trim()).filter(Boolean),
        heartNotes: (suggestedPerfume.heartNotes || []).map((n: string) => n.trim()).filter(Boolean),
        baseNotes: (suggestedPerfume.baseNotes || []).map((n: string) => n.trim()).filter(Boolean),
        notes: (suggestedPerfume.notes || []).map((n: string) => n.trim()).filter(Boolean),
        sizes: [
          { ml: "100ml", price: priceNum },
          { ml: "50ml", price: Math.round(priceNum * 0.65) }
        ]
      };

      const response = await fetch("/api/perfumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPerfume)
      });
      const data = await response.json();
      if (data.success) {
        await onRefreshCatalog();
        setSuggestedPerfume(null);
        setAiBrand("");
        setAiModel("");
        setAiStatus("Succès ! Fragrance ajoutée au catalogue.");
        setTimeout(() => setAiStatus(""), 3000);
      } else {
        setAiError("Impossible d'ajouter le parfum au catalogue.");
      }
    } catch (err) {
      console.error("Error saving perfume:", err);
      setAiError("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setIsAiSearching(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const q = orderQuery.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.customer.name.toLowerCase().includes(q) ||
      o.customer.email.toLowerCase().includes(q) ||
      o.customer.city.toLowerCase().includes(q)
    );
  });

  const filteredCatalog = perfumes.filter(p => {
    const q = catalogQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
  });

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "En attente":
        return "bg-amber-950/40 text-amber-400 border-amber-800/40";
      case "En cours":
        return "bg-blue-950/40 text-blue-400 border-blue-900/40";
      case "Expédié":
        return "bg-purple-950/40 text-purple-400 border-purple-900/40";
      case "Livré":
        return "bg-green-950/40 text-green-400 border-green-900/40";
      default:
        return "bg-neutral-900 text-neutral-400 border-neutral-800";
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#060606] text-white py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Dashboard Title Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-900 pb-6 gap-4">
          <div>
            <span className="text-[10px] tracking-[0.3em] font-bold text-neutral-500 uppercase font-serif">
              CONTRÔLE ADMINISTRATIF
            </span>
            <h1 className="text-3xl font-serif tracking-widest text-[#E5E5E5] mt-1">
              LUXORA CONSOLE
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-neutral-950 p-1 border border-neutral-800 rounded">
              <button
                onClick={() => setActiveSubTab("orders")}
                className={`px-4 py-2 font-serif text-[10px] tracking-wider uppercase rounded transition ${
                  activeSubTab === "orders"
                    ? "bg-[#D4AF37] text-black font-bold"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                COMMANDES ({orders.length})
              </button>
              <button
                onClick={() => setActiveSubTab("catalog")}
                className={`px-4 py-2 font-serif text-[10px] tracking-wider uppercase rounded transition ${
                  activeSubTab === "catalog"
                    ? "bg-[#D4AF37] text-black font-bold"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                CATALOGUE ({perfumes.length})
              </button>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-4 py-[11px] font-serif text-[10px] tracking-widest border border-red-500/20 hover:bg-red-500/10 text-red-400 uppercase rounded transition cursor-pointer font-bold"
              >
                Déconnexion
              </button>
            )}
          </div>
        </div>

        {/* STATS OVERVIEW DECK */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-[#0b0b0b] border border-neutral-900 rounded-lg p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Chiffre d'Affaire</p>
              <h3 className="text-2xl font-serif text-white font-bold tracking-tight mt-1">{stats.totalRevenue} €</h3>
              <span className="text-[10px] text-green-500 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +100% réel démo
              </span>
            </div>
            <div className="w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-[#D4AF37]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0b0b0b] border border-neutral-900 rounded-lg p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Commandes Totales</p>
              <h3 className="text-2xl font-serif text-white font-bold tracking-tight mt-1">{orders.length}</h3>
              <p className="text-[10px] text-neutral-500 mt-1">
                {stats.pendingCount} en attente de traitement
              </p>
            </div>
            <div className="w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-[#D4AF37]">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0b0b0b] border border-neutral-900 rounded-lg p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Panier Moyen</p>
              <h3 className="text-2xl font-serif text-white font-bold tracking-tight mt-1">{stats.averageOrder} €</h3>
              <p className="text-[10px] text-neutral-500 mt-1">Par commande de luxe</p>
            </div>
            <div className="w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-[#D4AF37]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0b0b0b] border border-neutral-900 rounded-lg p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Flacons en Vitrine</p>
              <h3 className="text-2xl font-serif text-white font-bold tracking-tight mt-1">{perfumes.length}</h3>
              <p className="text-[10px] text-neutral-500 mt-1">Actif en recherche IA</p>
            </div>
            <div className="w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-[#D4AF37]">
              <Package className="w-5 h-5" />
            </div>
          </div>

        </div>

        {/* SUBTAB 1: ORDERS DASHBOARD */}
        {activeSubTab === "orders" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Orders list panel */}
            <div className="lg:col-span-2 bg-[#0a0a0a] border border-neutral-900 rounded-xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-neutral-900 flex justify-between items-center bg-[#0d0d0d]">
                <h4 className="font-serif text-xs tracking-widest text-neutral-300">LISTE DES COMMANDES</h4>
                <button
                  onClick={fetchOrders}
                  className="p-1 px-2.5 rounded hover:bg-neutral-900 text-neutral-400 hover:text-white transition flex items-center gap-1.5 text-[10px] font-serif tracking-wider uppercase border border-neutral-800"
                >
                  <RefreshCcw className="w-3 h-3" />
                  Actualiser
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 bg-[#0a0a0a] border-b border-neutral-900">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-600" />
                  <input
                    type="text"
                    value={orderQuery}
                    onChange={(e) => setOrderQuery(e.target.value)}
                    placeholder="Filtrer par n° commande, nom du client, email, ville..."
                    className="w-full bg-[#121212] border border-neutral-800 rounded px-9 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] transition font-mono"
                  />
                </div>
              </div>

              {isOrdersLoading ? (
                <div className="p-12 text-center text-neutral-500">
                  <Loader className="w-6 h-6 animate-spin mx-auto text-[#D4AF37] mb-2" />
                  <span className="text-xs font-serif tracking-widest">CHARGEMENT DES FACTURES...</span>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-12 text-center text-neutral-500 font-serif">
                  <span className="text-xs uppercase tracking-widest">Aucune commande enregistrée</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-[#0b0b0b] border-b border-neutral-900 text-neutral-500 font-serif text-[9px] uppercase tracking-widest">
                      <tr>
                        <th className="p-4">Identifiant</th>
                        <th className="p-4">Client</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Total</th>
                        <th className="p-4 text-center">Statut</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900/60">
                      {filteredOrders.map((o) => (
                        <tr
                          key={o.id}
                          className={`hover:bg-neutral-950/60 transition cursor-pointer ${
                            selectedOrder?.id === o.id ? "bg-neutral-900/40" : ""
                          }`}
                          onClick={() => setSelectedOrder(o)}
                        >
                          <td className="p-4 font-mono font-bold text-[#D4AF37] hover:underline">
                            #{o.id}
                          </td>
                          <td className="p-4">
                            <span className="font-medium text-white block">{o.customer.name}</span>
                            <span className="text-[10px] text-neutral-500 tracking-tight font-mono">{o.customer.email}</span>
                          </td>
                          <td className="p-4 font-mono text-neutral-500">
                            {new Date(o.date).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </td>
                          <td className="p-4 font-serif font-bold text-neutral-300">
                            {o.total} €
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateOrderStatus(o.id, o.status);
                                }}
                                className={`px-2.5 py-1 rounded text-[9px] font-bold font-serif uppercase tracking-wider border transition-all ${getStatusColor(
                                  o.status
                                )} hover:scale-105`}
                                title="Cliquez pour changer d'étape"
                              >
                                {o.status}
                              </button>
                            </div>
                          </td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setSelectedOrder(o)}
                                className="p-1 px-2 border border-neutral-800 hover:border-[#D4AF37] text-neutral-400 hover:text-[#D4AF37] rounded"
                                title="Voir la commande"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteOrder(o.id)}
                                className="p-1 px-2 border border-neutral-800 hover:border-red-900 text-neutral-400 hover:text-red-500 rounded"
                                title="Supprimer la fiche"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Order details panel */}
            <div className="lg:col-span-1 bg-[#0a0a0a] border border-neutral-900 rounded-xl p-6 shadow-xl relative min-h-[400px]">
              <AnimatePresence mode="wait">
                {selectedOrder ? (
                  <motion.div
                    key={selectedOrder.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-neutral-900 pb-4">
                      <div>
                        <span className="text-[10px] tracking-widest text-[#D4AF37] font-mono font-bold">
                          COMMANDE #{selectedOrder.id}
                        </span>
                        <h4 className="text-sm font-serif text-white tracking-widest mt-1 uppercase">
                          DÉTAILS DU COLIS
                        </h4>
                      </div>
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="text-neutral-500 hover:text-white p-1 rounded hover:bg-neutral-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Status progress dropdown */}
                    <div className="bg-[#121212] border border-neutral-800/80 p-3.5 rounded-lg">
                      <span className="text-[8px] tracking-widest text-neutral-500 font-bold uppercase block mb-2">
                        CHANGEMENT DES ÉTAPES DE LIVRAISON
                      </span>
                      <div className="flex justify-between items-center">
                        <span className={`px-3 py-1 bg-neutral-950/80 rounded border font-serif text-[10px] uppercase font-bold tracking-wider ${getStatusColor(selectedOrder.status)}`}>
                          {selectedOrder.status}
                        </span>
                        <button
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, selectedOrder.status)}
                          className="text-[#D4AF37] hover:underline font-serif text-[10px] tracking-wider uppercase font-bold flex items-center gap-1"
                        >
                          Étape suivante <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Customer coordinates */}
                    <div className="space-y-2.5 bg-neutral-950/50 p-3.5 border border-neutral-900 rounded-lg">
                      <span className="text-[8px] tracking-widest text-neutral-500 font-bold uppercase block pb-1 border-b border-neutral-900">
                        COORDONNÉES ACHETEUR
                      </span>
                      
                      <div className="flex items-center gap-2 text-xs">
                        <User className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                        <span className="text-white font-medium">{selectedOrder.customer.name}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                        <Mail className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                        <span className="truncate">{selectedOrder.customer.email}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                        <Phone className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                        <span>{selectedOrder.customer.phone}</span>
                      </div>

                      <div className="flex items-start gap-2 text-xs text-neutral-400">
                        <MapPin className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                        <div>
                          <p>{selectedOrder.customer.address}</p>
                          <p className="font-semibold text-white mt-0.5">
                            {selectedOrder.customer.zipCode} {selectedOrder.customer.city}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Items inside order */}
                    <div className="space-y-2.5">
                      <span className="text-[8px] tracking-widest text-neutral-500 font-bold uppercase block pb-1 border-b border-neutral-900">
                        ARTICLES COMMANDÉS
                      </span>

                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                        {selectedOrder.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 bg-[#111] p-2 border border-neutral-800 rounded"
                          >
                            <img
                              src={item.perfume.image}
                              alt={item.perfume.name}
                              className="w-10 h-10 object-cover rounded bg-neutral-900 border border-neutral-800 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold block leading-none">
                                {item.perfume.brand}
                              </span>
                              <h5 className="text-xs text-white font-serif tracking-wide truncate mt-0.5 leading-none">
                                {item.perfume.name}
                              </h5>
                              <span className="text-[10px] text-[#D4AF37] mt-1 block">
                                Format: {item.selectedSize} (Qté: {item.quantity})
                              </span>
                            </div>
                            <span className="text-xs text-neutral-300 font-serif font-semibold font-mono">
                              {item.selectedPrice * item.quantity} €
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Summary cost */}
                    <div className="border-t border-neutral-900 pt-3 space-y-1.5 text-xs text-neutral-400">
                      <div className="flex justify-between">
                        <span>Sous-total de luxe</span>
                        <span className="font-mono">{selectedOrder.subtotal} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Frais DHL Express</span>
                        <span className="font-mono">{selectedOrder.shipping === 0 ? "Offerts" : `${selectedOrder.shipping} €`}</span>
                      </div>
                      <div className="flex justify-between text-white font-bold font-serif text-sm pt-2 border-t border-neutral-900">
                        <span>Montant Total</span>
                        <span className="text-[#D4AF37] font-mono">{selectedOrder.total} €</span>
                      </div>
                    </div>

                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-neutral-800 rounded-xl">
                    <Info className="w-8 h-8 text-neutral-700 mb-2" />
                    <h5 className="font-serif text-xs text-neutral-400 tracking-widest uppercase mb-1">
                      Sélectionnez une commande
                    </h5>
                    <p className="text-[10px] text-neutral-500 font-sans max-w-xs leading-relaxed">
                      Cliquez sur le numéro d'une commande dans le tableau pour examiner la facture et en changer l'état logistique.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>

          </div>
        )}

        {/* SUBTAB 2: CATALOG MANAGEMENT */}
        {activeSubTab === "catalog" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Gemini Creation Engine Panel */}
            <div className="lg:col-span-1 bg-[#0a0a0a] border border-neutral-900 rounded-xl p-6 shadow-xl space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-900">
                <div className="p-1 px-1.5 bg-indigo-950/40 text-indigo-400 border border-indigo-800/40 rounded">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-serif text-xs uppercase tracking-widest">GEMINI INDEXER</h4>
                  <p className="text-[9px] text-neutral-500 font-sans tracking-tight">Recherche et extraction de notes Fragrantica</p>
                </div>
              </div>

              <div className="flex bg-neutral-950 p-1 border border-neutral-900 rounded text-[10px] uppercase font-serif tracking-widest">
                <button
                  type="button"
                  onClick={() => setCatalogMode("single")}
                  className={`flex-1 py-1.5 rounded transition font-bold text-center ${
                    catalogMode === "single"
                      ? "bg-indigo-600/30 text-indigo-400 border border-indigo-850/30"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  Unitaire
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogMode("batch")}
                  className={`flex-1 py-1.5 rounded transition font-bold text-center ${
                    catalogMode === "batch"
                      ? "bg-indigo-600/30 text-[#D4AF37] border border-[#D4AF37]/30"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  Fichier .txt
                </button>
              </div>

              {catalogMode === "single" ? (
                <>
                  <form onSubmit={triggerAiSearch} className="space-y-3 font-sans">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-neutral-400 mb-1 font-semibold">Marque du Parfum *</label>
                      <input
                        type="text"
                        required
                        value={aiBrand}
                        onChange={(e) => setAiBrand(e.target.value)}
                        placeholder="ex: Dior, Chanel, Creed"
                        className="w-full bg-[#121212] border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-neutral-400 mb-1 font-semibold">Nom / Modèle *</label>
                      <input
                        type="text"
                        required
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        placeholder="ex: Sauvage, No 5, Bleu, Aventus"
                        className="w-full bg-[#121212] border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isAiSearching || !aiBrand || !aiModel}
                      className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-500 text-white text-[10px] font-serif font-bold py-3 px-4 rounded tracking-widest uppercase transition duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-950/10"
                    >
                      {isAiSearching ? (
                        <>
                          <Loader className="w-3.5 h-3.5 animate-spin" /> Analyse AI en cours...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" /> Rechercher avec l'IA
                        </>
                      )}
                    </button>
                  </form>

                  {/* Status and Output Feedback logs */}
                  {aiStatus && (
                    <div className="p-3.5 bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400 font-serif leading-relaxed rounded flex items-center gap-2">
                      <Loader className="w-3.5 h-3.5 animate-spin text-[#D4AF37] flex-shrink-0" />
                      <span>{aiStatus}</span>
                    </div>
                  )}

                  {aiError && (
                    <div className="p-3.5 bg-red-950/20 border border-red-900/30 text-xs text-red-400 font-sans rounded">
                      {aiError}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleFileDrop}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
                      isDragOver
                        ? "border-[#D4AF37] bg-neutral-900/40"
                        : "border-neutral-800 hover:border-neutral-700 bg-neutral-900/10"
                    }`}
                  >
                    <input
                      type="file"
                      id="batch-file-input"
                      accept=".txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="batch-file-input" className="cursor-pointer block space-y-2">
                      <div className="mx-auto w-10 h-10 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-400">
                        <Upload className="w-5 h-5 animate-pulse" />
                      </div>
                      <div className="text-xs text-white font-medium">
                        Glissez-déposez un fichier <span className="text-[#D4AF37] font-semibold font-serif">.txt</span>
                      </div>
                      <p className="text-[10px] text-neutral-500 leading-relaxed max-w-[220px] mx-auto">
                        ou cliquez pour parcourir. Un parfum par ligne. Format conseillé : <span className="font-mono">Marque - Modèle</span>
                      </p>
                    </label>
                  </div>

                  {batchFile && (
                    <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-lg flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-indigo-450 flex-shrink-0" />
                        <span className="text-white truncate" title={batchFile.name}>{batchFile.name}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-sans font-medium flex-shrink-0">{batchLines.length} lignes</span>
                    </div>
                  )}

                  {batchLines.length > 0 && (
                    <div className="space-y-3">
                      {/* Batch Control Info & Actions */}
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-neutral-400 font-bold tracking-wider uppercase font-serif">PARFUMS DÉTECTÉS ({batchLines.length})</span>
                        {isBatchProcessing && (
                          <span className="text-[#D4AF37] font-mono">{batchProgress}%</span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {isBatchProcessing && (
                        <div className="w-full bg-neutral-950 border border-neutral-900 h-1.5 rounded overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full transition-all duration-300"
                            style={{ width: `${batchProgress}%` }}
                          />
                        </div>
                      )}

                      {/* Parsed List */}
                      <div className="max-h-[190px] overflow-y-auto space-y-1.5 pr-1 border border-neutral-950 p-2 rounded bg-neutral-950/20">
                        {batchLines.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col gap-1 text-[11px] p-2 bg-neutral-950/40 rounded border border-neutral-900/40"
                          >
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 pr-2 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-mono text-[#D4AF37] bg-[#D4AF37]/10 px-1 rounded">#{item.numero}</span>
                                  <span className="text-[8px] uppercase tracking-wider text-neutral-500 font-bold block leading-none">{item.brand}</span>
                                </div>
                                <span className="text-white font-medium truncate block mt-0.5 leading-none">{item.model}</span>
                              </div>

                              <div className="flex items-center flex-shrink-0 gap-1.5">
                                {item.status === "pending" && (
                                  <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                                    Prêt
                                  </span>
                                )}
                                {item.status === "processing" && (
                                  <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider bg-indigo-950/20 px-1.5 py-0.5 rounded border border-indigo-950 flex items-center gap-1">
                                    <Loader className="w-2.5 h-2.5 animate-spin" /> IA...
                                  </span>
                                )}
                                {item.status === "success" && (
                                  <span className="text-[9px] text-green-400 font-bold uppercase tracking-wider bg-green-950/20 px-1.5 py-0.5 rounded border border-green-900/20">
                                    Ajouté
                                  </span>
                                )}
                                {item.status === "error" && (
                                  <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider bg-red-950/20 px-1.5 py-0.5 rounded border border-red-900/20" title={item.error}>
                                    Échec
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 text-[8px] mt-1 text-neutral-500 font-mono">
                              <span className="bg-neutral-900 px-1 py-0.5 rounded uppercase border border-neutral-850">
                                Saison: {item.saison}
                              </span>
                              <span className="bg-neutral-900 px-1 py-0.5 rounded uppercase border border-neutral-850">
                                Cat: {item.category}
                              </span>
                              {item.dupe1 && (
                                <span className="bg-neutral-900/60 px-1 py-0.5 rounded text-indigo-450 border border-neutral-850 max-w-[125px] truncate" title={`Dupe 1: ${item.dupe1}`}>
                                  Dup: {item.dupe1}
                                </span>
                              )}
                              {item.dupe2 && (
                                <span className="bg-neutral-900/60 px-1 py-0.5 rounded text-indigo-455 border border-neutral-850 max-w-[125px] truncate" title={`Dupe 2: ${item.dupe2}`}>
                                  Dup2: {item.dupe2}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Start Batch Import trigger */}
                      <button
                        type="button"
                        onClick={startBatchImport}
                        disabled={isBatchProcessing || batchLines.filter(l => l.status === "pending").length === 0}
                        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-500 text-white text-[10px] font-serif font-bold py-3 px-4 rounded tracking-widest uppercase transition duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-950/10"
                      >
                        {isBatchProcessing ? (
                          <>
                            <Loader className="w-3.5 h-3.5 animate-spin" /> Batch en cours ({batchLines.filter(l => l.status === "success").length}/{batchLines.length})...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" /> Lancer l'import automatique
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Render suggestions for user approval with inline editing */}
              <AnimatePresence>
                {suggestedPerfume && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="p-4 bg-[#121212] border border-neutral-800 rounded-lg space-y-4 font-sans text-neutral-200"
                  >
                    <span className="text-[9px] tracking-widest text-[#D4AF37] uppercase block font-bold font-serif pb-1.5 border-b border-neutral-800/60 flex items-center justify-between">
                      <span>REVUE DE LA CONCIERGERIE</span>
                      <span className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-400 text-[8px] rounded uppercase">Modifiable</span>
                    </span>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider text-neutral-500 font-bold mb-1 font-sans">Marque</label>
                          <input
                            type="text"
                            value={suggestedPerfume.brand || ""}
                            onChange={(e) => handleUpdateSuggestedField("brand", e.target.value)}
                            className="w-full bg-black border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#D4AF37] transition"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider text-neutral-500 font-bold mb-1 font-sans">Nom / Modèle</label>
                          <input
                            type="text"
                            value={suggestedPerfume.name || ""}
                            onChange={(e) => handleUpdateSuggestedField("name", e.target.value)}
                            className="w-full bg-black border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#D4AF37] transition"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider text-neutral-500 font-bold mb-1 font-sans">Catégorie</label>
                          <select
                            value={suggestedPerfume.category || "Unisexe"}
                            onChange={(e) => handleUpdateSuggestedField("category", e.target.value)}
                            className="w-full bg-black border border-neutral-800 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-[#D4AF37] h-[34px] transition cursor-pointer"
                          >
                            <option value="Femme">Femme</option>
                            <option value="Homme">Homme</option>
                            <option value="Unisexe">Unisexe</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider text-neutral-500 font-bold mb-1 font-sans">Prix de Vente (€)</label>
                          <input
                            type="number"
                            value={suggestedPerfume.price !== undefined ? suggestedPerfume.price : 150}
                            onChange={(e) => handleUpdateSuggestedField("price", Number(e.target.value))}
                            className="w-full bg-black border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#D4AF37] transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-neutral-500 font-bold mb-1 font-sans">Description Poétique</label>
                        <textarea
                          rows={2}
                          value={suggestedPerfume.description || ""}
                          onChange={(e) => handleUpdateSuggestedField("description", e.target.value)}
                          className="w-full bg-black border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#D4AF37] transition leading-normal font-sans"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-neutral-500 font-bold mb-1 font-sans">Adresse de l'image (URL)</label>
                        <input
                          type="text"
                          value={suggestedPerfume.image || ""}
                          onChange={(e) => handleUpdateSuggestedField("image", e.target.value)}
                          className="w-full bg-black border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#D4AF37] transition font-mono text-[10px]"
                          placeholder="Collez l'URL de l'image du flacon"
                        />

                        {/* Image Preview Window (supports error fallback gracefully) */}
                        {suggestedPerfume.image && (
                          <div className="mt-2.5 flex items-center gap-3 bg-neutral-950 p-2 border border-neutral-900 rounded-lg">
                            <img
                              src={suggestedPerfume.image}
                              alt={suggestedPerfume.name}
                              referrerPolicy="no-referrer"
                              className="w-8 h-10 object-cover bg-neutral-900 rounded border border-neutral-800 flex-shrink-0"
                              onError={(e) => {
                                // Elegant fallback image if the URL is broken
                                (e.target as any).src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 130' width='100' height='130'><rect width='100%25' height='100%25' fill='%23121214'/><rect x='35' y='18' width='30' height='20' rx='4' fill='none' stroke='%23D4AF37' stroke-width='2'/><rect x='20' y='38' width='60' height='75' rx='12' fill='none' stroke='%23D4AF37' stroke-width='2'/><path d='M 24 50 L 76 50' stroke='%23D4AF37' stroke-width='0.5'/><text x='50' y='75' font-family='serif' font-size='7' fill='%23D4AF37' text-anchor='middle' letter-spacing='1'>LUXORA</text></svg>";
                              }}
                            />
                            <div className="min-w-0">
                              <span className="text-[9px] uppercase font-bold text-neutral-400 block font-serif tracking-widest">{suggestedPerfume.brand}</span>
                              <span className="text-[10px] text-neutral-500 block truncate">{suggestedPerfume.name}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 pt-2 border-t border-neutral-900/60">
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider text-neutral-500 font-bold mb-1 font-sans">Notes de Tête (séparées par virgule)</label>
                          <input
                            type="text"
                            value={(suggestedPerfume.topNotes || []).join(", ")}
                            onChange={(e) => handleUpdateSuggestedNotes("topNotes", e.target.value)}
                            className="w-full bg-black border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#D4AF37] transition"
                            placeholder="ex: Mandarine, Bergamote, Citron"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider text-neutral-500 font-bold mb-1 font-sans">Notes de Cœur (séparées par virgule)</label>
                          <input
                            type="text"
                            value={(suggestedPerfume.heartNotes || []).join(", ")}
                            onChange={(e) => handleUpdateSuggestedNotes("heartNotes", e.target.value)}
                            className="w-full bg-black border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#D4AF37] transition"
                            placeholder="ex: Jasmin, Accord Salé, Rose"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider text-neutral-500 font-bold mb-1 font-sans">Notes de Fond (séparées par virgule)</label>
                          <input
                            type="text"
                            value={(suggestedPerfume.baseNotes || []).join(", ")}
                            onChange={(e) => handleUpdateSuggestedNotes("baseNotes", e.target.value)}
                            className="w-full bg-black border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#D4AF37] transition"
                            placeholder="ex: Patchouli, Ambre, Bois de Cèdre"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-900/60">
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectPerfume) {
                            const priceNum = Number(suggestedPerfume.price) || 150;
                            const completePerfume: any = {
                              id: suggestedPerfume.id || "suggested",
                              name: suggestedPerfume.name,
                              brand: suggestedPerfume.brand,
                              description: suggestedPerfume.description || "",
                              price: priceNum,
                              image: suggestedPerfume.image || "",
                              category: suggestedPerfume.category || "Unisexe",
                              theme: suggestedPerfume.theme || "gold",
                              notes: suggestedPerfume.notes || [],
                              sizes: suggestedPerfume.sizes || [
                                { ml: "100ml", price: priceNum },
                                { ml: "50ml", price: Math.round(priceNum * 0.65) }
                              ],
                              accords: suggestedPerfume.accords || [],
                              inspiration: suggestedPerfume.inspiration || "",
                              topNotes: suggestedPerfume.topNotes || [],
                              heartNotes: suggestedPerfume.heartNotes || [],
                              baseNotes: suggestedPerfume.baseNotes || []
                            };
                            onSelectPerfume(completePerfume);
                          }
                        }}
                        className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-serif text-[10px] font-bold py-2.5 px-3 tracking-widest uppercase rounded cursor-pointer transition flex items-center justify-center gap-1"
                        title="Prévisualiser la Fiche Complète"
                      >
                        <Eye className="w-3.5 h-3.5" /> Fiche Parfum
                      </button>

                      <button
                        type="button"
                        onClick={handleSavePerfumeToCatalog}
                        className="bg-[#D4AF37] hover:bg-[#F3CD4F] text-black font-serif text-[10px] font-bold py-2.5 px-3 tracking-widest uppercase rounded cursor-pointer transition flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" /> Intégrer au catalogue
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Catalog list panel */}
            <div className="lg:col-span-2 bg-[#0a0a0a] border border-neutral-900 rounded-xl overflow-hidden shadow-xl flex flex-col">
              <div className="p-4 border-b border-neutral-900 bg-[#0d0d0d]">
                <h4 className="font-serif text-xs tracking-widest text-neutral-300">VOS BOUTEILLES EN VITRINE</h4>
              </div>

              {/* Search catalog bar */}
              <div className="p-4 border-b border-neutral-900 bg-[#0a0a0a]">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-600" />
                  <input
                    type="text"
                    value={catalogQuery}
                    onChange={(e) => setCatalogQuery(e.target.value)}
                    placeholder="Rechercher par nom ou marque dans la vitrine..."
                    className="w-full bg-[#121212] border border-neutral-800 rounded px-9 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] transition"
                  />
                </div>
              </div>

              <div className="divide-y divide-neutral-900 overflow-y-auto max-h-[600px] flex-1">
                {filteredCatalog.length === 0 ? (
                  <div className="p-12 text-center text-neutral-500 font-serif">
                    <span className="text-xs uppercase tracking-widest">Aucun flacon trouvé</span>
                  </div>
                ) : (
                  filteredCatalog.map((perfume) => (
                    <div
                      key={perfume.id}
                      className="p-4 flex items-center justify-between hover:bg-neutral-900/30 transition text-xs font-sans"
                    >
                      <div 
                        onClick={() => onSelectPerfume?.(perfume)}
                        className="flex items-center gap-4 cursor-pointer hover:bg-neutral-900/10 hover:opacity-90 rounded p-1.5 transition duration-155 group flex-1"
                        title="Cliquer pour afficher la fiche parfum de cette fragrance"
                      >
                        <img
                          src={perfume.image}
                          alt={perfume.name}
                          className="w-10 h-12 object-cover bg-neutral-950 border border-neutral-800 rounded group-hover:scale-105 transition duration-200"
                        />
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold block">
                            {perfume.brand}
                          </span>
                          <h5 className="font-serif uppercase tracking-widest text-white group-hover:text-[#D4AF37] text-xs mt-0.5 select-none text-medium transition">
                            {perfume.name}
                          </h5>
                          <span className="text-[10px] text-neutral-400 italic block mt-0.5 line-clamp-1">
                            {perfume.notes.join(" • ")}
                          </span>
                        </div>
                      </div>

                      {/* Deletion / details controls */}
                      <div className="flex gap-2">
                        <span className="px-2.5 py-1 bg-neutral-950 font-serif font-bold text-[#D4AF37] border border-neutral-800 text-[10px] rounded flex items-center">
                          {perfume.price} €
                        </span>
                        <button
                          onClick={() => {
                            if (onDeletePerfume) {
                              onDeletePerfume(perfume.id, perfume.name);
                            } else {
                              // Fallback in case the prop is not defined
                              if (window.confirm(`Supprimer définitivement "${perfume.name}" du catalogue ?`)) {
                                fetch(`/api/perfumes/${perfume.id}`, { method: "DELETE" })
                                  .then(res => res.json())
                                  .then(data => {
                                    if (data.success) {
                                      onRefreshCatalog();
                                    }
                                  })
                                  .catch(err => console.error(err));
                              }
                            }
                          }}
                          className="p-1 px-2 border border-neutral-800 hover:border-red-900/80 text-neutral-500 hover:text-red-400 rounded transition"
                          title="Supprimer la bouteille"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
