import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  ShoppingBag,
  ShieldCheck,
  Globe,
  Lock,
  Truck,
  Gift,
  Headphones,
  Eye,
  Filter,
  ArrowDown,
  Sparkles,
  Award,
  LogOut,
  X,
  CreditCard,
  Menu,
  Calendar,
  Plus,
  Trash2,
  Wand2,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { SLIDES_DATA, PERFUMES_DB, BOUTIQUE_REVIEWS, Perfume } from "./data";
import CartDrawer from "./components/CartDrawer";
import ProductDetailModal from "./components/ProductDetailModal";
import SearchModal from "./components/SearchModal";
import AuthModal from "./components/AuthModal";
import AdminDashboard from "./components/AdminDashboard";
import AdminGateModal from "./components/AdminGateModal";

interface CartItem {
  perfume: Perfume;
  selectedSize: string;
  selectedPrice: number;
  quantity: number;
}

export default function App() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedPerfume, setSelectedPerfume] = useState<Perfume | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isCheckoutSuccess, setIsCheckoutSuccess] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<any | null>(null);
  const [filterBrand, setFilterBrand] = useState<string>("All");
  
  const [activeTab, setActiveTab] = useState<"accueil" | "parfums" | "marques" | "nouveautes" | "offres" | "apropos" | "admin">("accueil");
  const [isAdminVerified, setIsAdminVerified] = useState<boolean>(() => sessionStorage.getItem("luxora_admin_logged") === "true");
  const [isAdminGateOpen, setIsAdminGateOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [bookingName, setBookingName] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);

  // Custom added perfumes & admin states
  const [customPerfumes, setCustomPerfumes] = useState<Perfume[]>([]);
  const [deletedPerfumeIds, setDeletedPerfumeIds] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<"Tous" | "Femme" | "Homme" | "Unisexe">("Tous");
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminBrand, setAdminBrand] = useState("");
  const [adminModel, setAdminModel] = useState("");
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [aiResult, setAiResult] = useState<Perfume | null>(null);
  const [aiNotice, setAiNotice] = useState("");

  // .txt import query states & automation
  const [importedQueries, setImportedQueries] = useState<{ id: number; brand: string; model: string; status: "idle" | "loading" | "success" | "error" }[]>([]);
  const [importMessage, setImportMessage] = useState("");

  const handleTxtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMessage("");
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n");
        const list = lines
          .map((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) return null;
            let brandName = "";
            let modelName = "";
            if (trimmed.includes("-")) {
              const parts = trimmed.split("-");
              brandName = parts[0].trim();
              modelName = parts.slice(1).join("-").trim();
            } else if (trimmed.includes(":")) {
              const parts = trimmed.split(":");
              brandName = parts[0].trim();
              modelName = parts.slice(1).join(":").trim();
            } else {
              const parts = trimmed.split(" ");
              if (parts.length > 1) {
                brandName = parts[0].trim();
                modelName = parts.slice(1).join(" ").trim();
              } else {
                brandName = "Créateur";
                modelName = trimmed;
              }
            }
            return {
              id: index,
              brand: brandName,
              model: modelName,
              status: "idle" as const
            };
          })
          .filter(Boolean) as any[];

        if (list.length === 0) {
          setImportMessage("Le fichier est vide ou n'a pas de lignes valides.");
        } else {
          setImportedQueries(list);
          setImportMessage(`${list.length} parfums chargés avec succès.`);
        }
      } catch (err) {
        setImportMessage("Erreur pendant la lecture du fichier.");
      }
    };
    reader.readAsText(file);
  };

  const handleProcessImportedItem = async (index: number, brand: string, model: string) => {
    setImportedQueries(prev => prev.map(item => item.id === index ? { ...item, status: "loading" } : item));
    try {
      const response = await fetch("/api/search-perfume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, model })
      });
      const data = await response.json();
      if (data.success && data.perfume) {
        const saveRes = await fetch("/api/perfumes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data.perfume)
        });
        const saveData = await saveRes.json();
        if (saveData.success) {
          await fetchCustomPerfumes();
          setImportedQueries(prev => prev.map(item => item.id === index ? { ...item, status: "success" } : item));
        } else {
          setImportedQueries(prev => prev.map(item => item.id === index ? { ...item, status: "error" } : item));
        }
      } else {
        setImportedQueries(prev => prev.map(item => item.id === index ? { ...item, status: "error" } : item));
      }
    } catch (err) {
      console.error(err);
      setImportedQueries(prev => prev.map(item => item.id === index ? { ...item, status: "error" } : item));
    }
  };

  // Fetch custom-added perfumes from standard endpoint
  const fetchCustomPerfumes = async () => {
    try {
      const res = await fetch("/api/perfumes");
      const data = await res.json();
      if (data.success) {
        if (data.perfumes) {
          setCustomPerfumes(data.perfumes);
        }
        if (data.deletedIds) {
          setDeletedPerfumeIds(data.deletedIds);
        }
      }
    } catch (err) {
      console.error("Error fetching custom perfumes:", err);
    }
  };

  useEffect(() => {
    fetchCustomPerfumes();
  }, []);

  const handleSearchAI = async () => {
    if (!adminBrand.trim() || !adminModel.trim()) {
      setSearchError("Veuillez renseigner la marque et le modèle.");
      return;
    }
    setIsSearchingAI(true);
    setSearchError("");
    setAiNotice("");
    setAiResult(null);

    try {
      const response = await fetch("/api/search-perfume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: adminBrand, model: adminModel })
      });
      const data = await response.json();
      if (data.success && data.perfume) {
        setAiResult(data.perfume);
        if (data.fallbackNotice) {
          setAiNotice(data.fallbackNotice);
        }
      } else {
        setSearchError(data.error || "Aucune fragrance correspondante n'a été identifiée. Veuillez affiner les termes.");
      }
    } catch (err) {
      setSearchError("Une erreur est survenue lors de la communication avec l'IA. Veuillez vérifier que la clé API est configurée dans l'environnement.");
    } finally {
      setIsSearchingAI(false);
    }
  };

  const handleUpdateAiResultField = (field: string, value: any) => {
    setAiResult((prev: any) => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  };

  const handleUpdateAiResultNotes = (field: "topNotes" | "heartNotes" | "baseNotes", value: string) => {
    const arr = value.split(",").map(part => part.trim());
    setAiResult((prev: any) => {
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

  const handleConfirmAddPerfume = async () => {
    if (!aiResult) return;
    try {
      const priceNum = Number(aiResult.price) || 150;
      const finalPerfume = {
        ...aiResult,
        price: priceNum,
        topNotes: (aiResult.topNotes || []).map((n: string) => n.trim()).filter(Boolean),
        heartNotes: (aiResult.heartNotes || []).map((n: string) => n.trim()).filter(Boolean),
        baseNotes: (aiResult.baseNotes || []).map((n: string) => n.trim()).filter(Boolean),
        notes: (aiResult.notes || []).map((n: string) => n.trim()).filter(Boolean),
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
        await fetchCustomPerfumes();
        setAiResult(null);
        setAdminBrand("");
        setAdminModel("");
        // Autofilter to show the added database perfume
        setFilterCategory(data.perfume.category);
        setFilterBrand("All");
        setActiveTab("parfums");
        setIsAdminOpen(false);
      }
    } catch (err) {
      console.error("Error adding perfume to shop catalog:", err);
    }
  };

  const [perfumeToDelete, setPerfumeToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDeletePerfume = (id: string, name: string) => {
    setPerfumeToDelete({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!perfumeToDelete) return;
    try {
      const response = await fetch(`/api/perfumes/${perfumeToDelete.id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        await fetchCustomPerfumes();
      }
    } catch (err) {
      console.error("Error removing custom perfume:", err);
    } finally {
      setPerfumeToDelete(null);
    }
  };

  // Merge static DB with dynamic database and filter out deleted ones
  const allPerfumes = [...PERFUMES_DB, ...customPerfumes].filter(
    (perfume) => !deletedPerfumeIds.includes(perfume.id)
  );
  
  const catalogRef = useRef<HTMLDivElement>(null);

  // Auto-scrolling slides
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES_DATA.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % SLIDES_DATA.length);
  };

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + SLIDES_DATA.length) % SLIDES_DATA.length);
  };

  const handleAddToCart = (perfume: Perfume, size: string, price: number) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.perfume.id === perfume.id && item.selectedSize === size
      );

      if (existingIndex !== -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += 1;
        return updated;
      } else {
        return [...prevCart, { perfume, selectedSize: size, selectedPrice: price, quantity: 1 }];
      }
    });
    // Triggers open cart drawer to celebrate addition
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (index: number, change: number) => {
    setCart((prevCart) => {
      const updated = [...prevCart];
      const newQty = updated[index].quantity + change;
      if (newQty <= 0) {
        updated.splice(index, 1);
      } else {
        updated[index].quantity = newQty;
      }
      return updated;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index));
  };

  const handleCheckoutSuccess = (order: any) => {
    setIsCartOpen(false);
    setLastCreatedOrder(order);
    setIsCheckoutSuccess(true);
    setCart([]); // Clear cart
  };

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const activeSlideData = SLIDES_DATA[activeSlide];

  // Colors based on current theme to paint indicators
  const themeAccentColor = activeSlideData.accentColorHex;
  const themeHighlightTextClass = activeSlideData.titleHighlightColorClass;

  const renderAccueilView = () => (
    <div className="flex flex-col">
      {/* CORE HERO SECTION (SLIDESHOW DOCK) */}
      <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 md:py-12 flex flex-col justify-center min-h-[calc(100vh-170px)] z-10 overflow-hidden">
        
        {/* Absolute Slide Background Container (Full cover background with active transitions) */}
        <div className="absolute inset-0 z-0 select-none overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.9, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <motion.img
                animate={{ scale: [1, 1.015, 1], y: [0, -2, 0] }}
                transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                src={activeSlideData.image}
                alt={activeSlideData.productName}
                className="w-full h-full object-cover object-center opacity-100 brightness-100 transition duration-300"
              />
              
              {/* Soft, extremely subtle vignette overlays that leave the background image vibrant, bright and clear */}
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/45 via-transparent to-transparent select-none pointer-events-none" />
              <div className="absolute inset-0 bg-[#070707]/15 select-none pointer-events-none" />
            </motion.div>
          </AnimatePresence>

          {/* Large glowing aura theme background (glowing highlights behind text space) */}
          <div className="absolute inset-y-0 right-0 left-0 lg:left-1/3 flex items-center justify-center lg:justify-end lg:pr-24 pointer-events-none">
            <div
              style={{
                boxShadow: `0 0 160px 60px ${
                  activeSlideData.theme === "pink"
                    ? "rgba(224, 17, 95, 0.16)"
                    : activeSlideData.theme === "blue"
                    ? "rgba(0, 240, 255, 0.16)"
                    : "rgba(212, 175, 55, 0.16)"
                }`
              }}
              className="w-80 h-80 sm:w-96 sm:h-96 rounded-full transition-all duration-1000 blur-3xl opacity-40 animate-pulse bg-transparent"
            />
          </div>
        </div>

        {/* Carousel Side-Arrows embedded in layout space */}
        <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30">
          <button
            id="slide-prev-chevron"
            onClick={handlePrevSlide}
            className="w-11 h-11 border border-neutral-800 hover:border-[var(--accent-color)] rounded-full flex items-center justify-center bg-neutral-950/80 hover:bg-[#070707] text-neutral-450 hover:text-[var(--accent-color)] transition duration-300 shadow-lg active:scale-90"
          >
            <ChevronLeft className="w-5 h-5 transition-colors duration-350" />
          </button>
        </div>

        <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30">
          <button
            id="slide-next-chevron"
            onClick={handleNextSlide}
            className="w-11 h-11 border border-neutral-800 hover:border-[var(--accent-color)] rounded-full flex items-center justify-center bg-neutral-950/80 hover:bg-[#070707] text-neutral-450 hover:text-[var(--accent-color)] transition duration-300 shadow-lg active:scale-90"
          >
            <ChevronRight className="w-5 h-5 transition-colors duration-350" />
          </button>
        </div>

        {/* Responsive Content Columns Wrapper (Z-10 relative layout) */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center flex-1">
          
          {/* LEFT COLUMN: Text Info descriptions with dynamic luxury cards */}
          <div className="lg:col-span-6 xl:col-span-5 text-left space-y-6 md:space-y-8 z-10 select-none transition duration-500">
            
            {/* Elegant Subtitle with animation trigger */}
            <div className="space-y-2">
              <span className="text-[var(--accent-color)] text-[10px] sm:text-xs tracking-[0.25em] font-serif font-bold uppercase block transition duration-500">
                {activeSlideData.badgeText}
              </span>
              {/* Luxury thin border */}
              <div
                style={{ backgroundColor: `${themeAccentColor}4d` }}
                className="w-16 h-[1.5px] transition-colors duration-500"
              />
            </div>

            {/* Master Titles */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-extrabold tracking-wide uppercase text-white leading-[1.12]">
                {activeSlideData.titlePart1}
                <br />
                <motion.span
                  key={`${activeSlide}-span`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`${themeHighlightTextClass} font-black drop-shadow-[0_0_12px_rgba(212,175,55,0.1)] transition-colors duration-500`}
                >
                  {activeSlideData.titleHighlight}
                </motion.span>
              </h1>
            </div>

            {/* Descriptions paragraph */}
            <p className="text-xs sm:text-sm text-neutral-300 font-sans tracking-wide leading-relaxed max-w-lg transition-all duration-300">
              {activeSlideData.description}
            </p>

            {/* CTA explorer button */}
            <div className="pt-2">
              <button
                id="discover-collection-btn"
                onClick={() => {
                  setActiveTab("parfums");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                style={{ borderColor: themeAccentColor }}
                className="group border text-white text-[11px] tracking-[0.2em] uppercase py-3.5 px-7 rounded font-serif font-bold transition-all duration-500 flex items-center justify-center gap-2 hover:bg-white/[0.04] shadow-md hover:shadow-lg active:scale-95"
              >
                Explorer la collection
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                  <ChevronRight className="w-4 h-4 text-[var(--accent-color)] transition-colors duration-500" />
                </motion.span>
              </button>
            </div>

            {/* Custom Interactive features row for authenticity / design precision */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-left">
              <div className="bg-[#0f0f0f]/90 border border-neutral-800/80 rounded-lg p-4 group hover:border-[var(--accent-color)]/30 transition duration-300">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[var(--accent-color)] flex-shrink-0 mt-0.5 transition-colors duration-500" />
                  <div>
                    <h4 className="text-[11px] font-bold tracking-widest uppercase text-neutral-300 group-hover:text-white transition font-serif">100% Authentique</h4>
                    <p className="text-[10px] text-neutral-500 leading-normal mt-0.5">Parfums certifiés provenant de sources de confiance.</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#0f0f0f]/90 border border-neutral-800/80 rounded-lg p-4 group hover:border-[var(--accent-color)]/35 transition duration-300">
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-[var(--accent-color)] flex-shrink-0 mt-0.5 transition-colors duration-500" />
                  <div>
                    <h4 className="text-[11px] font-bold tracking-widest uppercase text-neutral-300 group-hover:text-white transition font-serif">Sélection Premium</h4>
                    <p className="text-[10px] text-neutral-500 leading-normal mt-0.5">Des fragrances rares choisies avec exigence et passion.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT GRID SPACE: Blank padding space so background flacon shines on desktop */}
          <div className="hidden lg:block lg:col-span-6 xl:col-span-7 h-10 pointer-events-none" />

        </div>

        {/* Slider bottom dots navigation indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-y-1/2 flex items-center space-x-2.5 z-30">
          {SLIDES_DATA.map((slideObj) => (
            <button
              key={slideObj.index}
              id={`dot-btn-${slideObj.index}`}
              onClick={() => setActiveSlide(slideObj.index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                activeSlide === slideObj.index
                  ? "w-7"
                  : "w-2.5 hover:bg-neutral-600"
              }`}
              style={{
                backgroundColor: activeSlide === slideObj.index ? themeAccentColor : "#444444"
              }}
              title={`Passer au thème ${slideObj.theme}`}
            />
          ))}
        </div>

      </div>

      {/* CORE BOTTOM TRUST BADGES CONTAINER BAR */}
      <section className="bg-neutral-950/80 backdrop-blur-xs border-y border-neutral-900/90 py-5 px-4 w-full z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          
          <div className="flex items-center space-x-3.5 pl-2 sm:pl-4">
            <div className="w-10 h-10 border border-[var(--accent-color)]/40 rounded flex items-center justify-center bg-neutral-900/50 transition-colors duration-500">
              <Lock className="w-4.5 h-4.5 text-[var(--accent-color)] transition-colors duration-500" />
            </div>
            <div>
              <h5 className="font-serif text-[10px] sm:text-xs font-bold tracking-widest uppercase text-neutral-200">Paiement Sécurisé</h5>
              <p className="text-[9px] sm:text-[10px] text-neutral-500 font-sans mt-0.5">Transactions sécurisées 3D Secure</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 border border-[var(--accent-color)]/40 rounded flex items-center justify-center bg-neutral-900/50 transition-colors duration-500">
              <Truck className="w-4.5 h-4.5 text-[var(--accent-color)] transition-colors duration-500" />
            </div>
            <div>
              <h5 className="font-serif text-[10px] sm:text-xs font-bold tracking-widest uppercase text-neutral-200">Livraison Rapide</h5>
              <p className="text-[9px] sm:text-[10px] text-neutral-500 font-sans mt-0.5">Expédition soignée et suivie</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 border border-[var(--accent-color)]/40 rounded flex items-center justify-center bg-neutral-900/50 transition-colors duration-500">
              <Gift className="w-4.5 h-4.5 text-[var(--accent-color)] transition-colors duration-500" />
            </div>
            <div>
              <h5 className="font-serif text-[10px] sm:text-xs font-bold tracking-widest uppercase text-neutral-200">Échantillons Offerts</h5>
              <p className="text-[9px] sm:text-[10px] text-neutral-500 font-sans mt-0.5">Pour chaque commande passée</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5 pr-2 sm:pr-4">
            <div className="w-10 h-10 border border-[var(--accent-color)]/40 rounded flex items-center justify-center bg-neutral-900/50 transition-colors duration-500">
              <Headphones className="w-4.5 h-4.5 text-[var(--accent-color)] transition-colors duration-500" />
            </div>
            <div>
              <h5 className="font-serif text-[10px] sm:text-xs font-bold tracking-widest uppercase text-neutral-200">Service Client Premium</h5>
              <p className="text-[9px] sm:text-[10px] text-neutral-500 font-sans mt-0.5">À votre écoute 7j/7 par rdv</p>
            </div>
          </div>

        </div>
      </section>

      {/* Boutique reviews */}
      <section className="bg-neutral-950 py-12 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto space-y-6 text-left">
          <h4 className="font-serif text-sm tracking-widest uppercase text-[var(--accent-color)] font-bold text-center transition-colors duration-500">
            Écho de l'excellence - l'avis de nos clients
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {BOUTIQUE_REVIEWS.map((r) => (
              <div key={r.id} className="p-5 bg-neutral-900/40 border border-neutral-800/60 rounded-lg space-y-3 shrink-0">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-serif font-bold text-neutral-200">{r.name}</span>
                  <span className="text-[var(--accent-color)] text-xs transition-colors duration-500">{"★".repeat(r.stars)}</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed font-sans italic">"{r.comment}"</p>
                <span className="text-[9px] uppercase text-neutral-500 tracking-wider block font-medium">Fragrance achetée : {r.perfumeName}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  const renderParfumsView = () => (
    <section className="bg-neutral-950 py-12 px-4 sm:px-8 border-b border-neutral-900 text-left relative min-h-[70vh]">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header titles */}
        <div className="text-center space-y-2">
          <span className="text-[var(--accent-color)] text-xs font-serif tracking-[0.4em] uppercase font-bold block transition-colors duration-500">La Collection</span>
          <h2 className="text-2xl sm:text-3xl font-serif tracking-widest uppercase text-white font-semibold">NOS PARFUMS D'EXCEPTION</h2>
          {/* Fine underline */}
          <div
            style={{ backgroundColor: themeAccentColor }}
            className="w-24 h-1 mx-auto rounded-full mt-3 transition-colors duration-500"
          />
        </div>

        {/* Categorization & Filter layout */}
        <div className="flex flex-col gap-6 border-b border-neutral-900 pb-8">
          {/* Creators / Brand Filters */}
          <div className="space-y-2.5">
            <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-sans block">CRÉATEURS</span>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-neutral-600 mr-1" />
              {brandsList.map((brandName) => {
                const isActive = filterBrand === brandName;
                return (
                  <button
                    key={brandName}
                    id={`brand-filter-${brandName}`}
                    onClick={() => setFilterBrand(brandName)}
                    style={isActive ? { backgroundColor: themeAccentColor } : undefined}
                    className={`py-1.5 px-4 rounded text-xs transition duration-300 ${
                      isActive
                        ? "text-black font-bold font-serif shadow-md"
                        : "bg-[#111111] hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    {brandName === "All" ? "Tous les créateurs" : brandName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catalogue Selector for (Femme, Homme, Unisex) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-neutral-900/40">
            <div className="space-y-2.5 flex-1">
              <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-sans block">LE CATALOGUE DES FRAGRANCES</span>
              <div className="flex flex-wrap items-center gap-2">
                {([
                  { id: "Tous", label: "Toutes les Collections", dot: "bg-[#D4AF37]" },
                  { id: "Femme", label: "Pour Femme", dot: "bg-[#E0115F]" },
                  { id: "Homme", label: "Pour Homme", dot: "bg-[#D4AF37]" },
                  { id: "Unisexe", label: "Unisexe / Partagées", dot: "bg-[#00F0FF]" }
                ] as const).map((catObj) => {
                  const isActive = filterCategory === catObj.id;
                  return (
                    <button
                      key={catObj.id}
                      id={`category-catalog-filter-${catObj.id}`}
                      onClick={() => setFilterCategory(catObj.id)}
                      className={`relative py-2 px-5 rounded-md text-xs transition-all duration-300 font-serif flex items-center space-x-2 border ${
                        isActive
                          ? "bg-[#111] text-white font-medium border-neutral-800 shadow-lg shadow-black/80"
                          : "bg-transparent hover:bg-neutral-900/30 border-transparent text-neutral-400 hover:text-white"
                      }`}
                    >
                      {/* Interactive slide indicator under active bubble */}
                      {isActive && (
                        <motion.span
                          layoutId="activeCatalogPillBorder"
                          style={{ borderColor: themeAccentColor }}
                          className="absolute inset-0 border rounded-md pointer-events-none"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      
                      {/* Scent category colored dot indicator */}
                      <span className={`w-2 h-2 rounded-full ${catObj.dot} inline-block animate-pulse`} />
                      <span>{catObj.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col items-end justify-center">
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-sans font-medium">
                {filteredCollection.length} fragrances filtrées
              </span>
              <button
                id="admin-panel-inline-trigger"
                onClick={() => setIsAdminOpen(true)}
                className="mt-1 text-[10px] text-[#D4AF37] hover:text-[#F3CD4F] font-serif uppercase tracking-widest transition duration-150 flex items-center space-x-1"
              >
                <Plus className="w-3 h-3 text-[#D4AF37] inline mr-1" />
                <span>Espace Créateur Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid bento showcase */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollection.map((perfume) => (
            <div
              key={perfume.id}
              id={`cart-item-card-${perfume.id}`}
              className="bg-[#0e0e0e] border border-neutral-900 rounded-lg hover:border-neutral-800/80 transition-all duration-300 overflow-hidden flex flex-col justify-between group relative"
            >
              {/* Visual glow element on active hover */}
              <div className={`absolute -top-12 -right-12 w-28 h-28 rounded-full opacity-0 group-hover:opacity-[0.06] filter blur-xl transition duration-500 ${
                perfume.theme === 'pink' ? 'bg-[#E0115F]' :
                perfume.theme === 'blue' ? 'bg-[#00F0FF]' : 'bg-[#D4AF37]'
              }`} />

              {/* Card Header Media content */}
              <div
                className="bg-[#090909] p-6 flex flex-col justify-center items-center h-52 relative border-b border-neutral-900/50 cursor-pointer overflow-hidden"
                onClick={() => setSelectedPerfume(perfume)}
              >
                {perfume.isBestSeller && (
                  <span
                    style={{ backgroundColor: themeAccentColor }}
                    className="absolute top-3 left-3 text-black font-bold uppercase tracking-widest text-[8px] py-0.5 px-2 rounded font-serif transition-colors duration-500"
                  >
                    Best-Seller
                  </span>
                )}
                <span className="absolute top-3 right-3 text-neutral-600 group-hover:text-[var(--accent-color)] font-serif text-[10px] tracking-widest transition duration-300">
                  {perfume.category}
                </span>

                {perfume.image && perfume.image.startsWith("http") ? (
                  <img
                    src={perfume.image}
                    alt={perfume.name}
                    className="max-h-40 max-w-[85%] object-contain scale-[0.95] group-hover:scale-100 transition duration-500"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as any).src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 130' width='100' height='130'><rect width='100%25' height='100%25' fill='%23121214'/><rect x='35' y='18' width='30' height='20' rx='4' fill='none' stroke='%23D4AF37' stroke-width='2'/><rect x='20' y='38' width='60' height='75' rx='12' fill='none' stroke='%23D4AF37' stroke-width='2'/><path d='M 24 50 L 76 50' stroke='%23D4AF37' stroke-width='0.5'/><text x='50' y='75' font-family='serif' font-size='7' fill='%23D4AF37' text-anchor='middle' letter-spacing='1'>LUXORA</text></svg>";
                    }}
                  />
                ) : perfume.image ? (
                  <div className="h-40 w-40 flex items-center justify-center relative select-none">
                    <div className="absolute bottom-1 w-24 h-5 rounded-full border border-dashed opacity-10 filter blur-xs group-hover:opacity-20 transition" />
                    <img
                      src={perfume.image}
                      alt={perfume.name}
                      className="max-h-[140px] opacity-95 group-hover:opacity-100 scale-95 group-hover:scale-100 group-hover:-translate-y-1 transition-all duration-500"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as any).src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 130' width='100' height='130'><rect width='100%25' height='100%25' fill='%23121214'/><rect x='35' y='18' width='30' height='20' rx='4' fill='none' stroke='%23D4AF37' stroke-width='2'/><rect x='20' y='38' width='60' height='75' rx='12' fill='none' stroke='%23D4AF37' stroke-width='2'/><path d='M 24 50 L 76 50' stroke='%23D4AF37' stroke-width='0.5'/><text x='50' y='75' font-family='serif' font-size='7' fill='%23D4AF37' text-anchor='middle' letter-spacing='1'>LUXORA</text></svg>";
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-40 w-40 flex items-center justify-center relative select-none">
                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 130' className="w-24 h-32 drop-shadow-lg">
                      <rect width='100%' height='100%' rx='6' fill='#121214' />
                      <rect x='35' y='18' width='30' height='20' rx='4' fill='none' stroke='#D4AF37' strokeWidth='2' />
                      <rect x='20' y='38' width='60' height='75' rx='12' fill='none' stroke='#D4AF37' strokeWidth='2' />
                      <path d='M 24 50 L 76 50' stroke='#D4AF37' strokeWidth='0.5' />
                      <text x='50' y='75' fontFamily='serif' fontSize='7' fill='#D4AF37' textAnchor='middle' letterSpacing='1'>LUXORA</text>
                    </svg>
                  </div>
                )}
              </div>

              {/* Info Text details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold block">
                    {perfume.brand}
                  </span>
                  <h3
                    onClick={() => setSelectedPerfume(perfume)}
                    className="font-serif text-base tracking-wide text-white font-semibold cursor-pointer group-hover:text-[var(--accent-color)] transition duration-200 line-clamp-1"
                  >
                    {perfume.name}
                  </h3>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                    {perfume.description}
                  </p>
                </div>

                {/* Scent notes pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {perfume.notes.slice(0, 3).map((note) => (
                    <span key={note} className="bg-neutral-900 border border-neutral-800 text-neutral-400 text-[9px] py-0.5 px-2 rounded-sm font-sans uppercase">
                      {note}
                    </span>
                  ))}
                </div>

                {/* Actions line */}
                <div className="pt-3 border-t border-neutral-900 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-neutral-500 block">Flacon</span>
                    <span className="text-sm font-semibold text-[var(--accent-color)] font-serif transition-colors duration-500">
                      {perfume.price}€ <span className="text-[10px] text-neutral-400">({perfume.sizes[0].ml})</span>
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      id={`quick-preview-btn-${perfume.id}`}
                      onClick={() => setSelectedPerfume(perfume)}
                      className="p-2 border border-neutral-800 hover:border-neutral-700 rounded bg-neutral-900/30 text-neutral-400 hover:text-white transition duration-200"
                      title="Aperçu rapide"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      id={`quick-add-btn-${perfume.id}`}
                      onClick={() => handleAddToCart(perfume, perfume.sizes[0].ml, perfume.price)}
                      style={{ backgroundColor: themeAccentColor }}
                      className="text-black font-semibold text-xs py-2 px-3.5 rounded font-serif tracking-wider hover:brightness-110 hover:shadow-lg transition-all duration-300"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const renderMarquesView = () => {
    const brandsDetails = [
      {
        name: "Louis Vuitton",
        origin: "Paris, France",
        heritage: "Malleterie d'Exception",
        accent: "#00F0FF",
        desc: "Créée sous la maîtrise absolue de parfumeurs visionnaires, la collection se distingue par des contrastes insolites d'ingrédients de haute noblesse, voyageant sur la peau avec éclat."
      },
      {
        name: "Valentino",
        origin: "Rome, Italie",
        heritage: "Chic & Audace Italienne",
        accent: "#E0115F",
        desc: "Une esthétique couture vibrante et rebelle. Les compositions de la maison Valentino allient élégance aristocratique et modernité indisciplinée par des extraits intenses."
      },
      {
        name: "Emporio Armani",
        origin: "Milan, Italie",
        heritage: "Sartorial & Magnétisme",
        accent: "#D4AF37",
        desc: "L'art de l'allure italienne éternelle. Ces créations capturent une sensualité boisée magnétique et moderne, s'exprimant à travers des épices raffinées et des baumes caressants."
      },
      {
        name: "Tom Ford",
        origin: "New York, USA",
        heritage: "Glamour Noir & Opulence",
        accent: "#E0115F",
        desc: "Profonds, somptueux et hautement séducteurs, les flacons Tom Ford marient des collisions gustatives de fruits liquoreux, d'amandes amères et de bois rares très précieux."
      },
      {
        name: "Creed",
        origin: "Londres, Royaume-Uni",
        heritage: "Dynastie Royale Impériale",
        accent: "#00F0FF",
        desc: "Fondée à Londres au XVIIIème siècle pour les souverains du vieux continent, Creed distille des essences uniques selon des protocoles manuels et secrets."
      },
      {
        name: "Maison Francis Kurkdjian",
        origin: "Paris, France",
        heritage: "Alchimie Contemporaine",
        accent: "#D4AF37",
        desc: "Des silhouettes d'un raffinement spirituel captivant. L'accord de jasmin lumineux, de résines dorées et de brises minérales compose de pures architectures d'émotions."
      }
    ];

    return (
      <section className="bg-neutral-950 py-12 px-4 sm:px-8 border-b border-neutral-900 text-left relative min-h-[70vh]">
        <div className="max-w-6xl mx-auto space-y-12 animate-fade-in">
          
          <div className="text-center space-y-2">
            <span className="text-[var(--accent-color)] text-xs font-serif tracking-[0.4em] uppercase font-bold block transition-colors duration-500">Portraits de Créateurs</span>
            <h2 className="text-2xl sm:text-3xl font-serif tracking-widest uppercase text-white font-semibold">NOS COMPAGNONS MAJEURS</h2>
            <div
              style={{ backgroundColor: themeAccentColor }}
              className="w-24 h-1 mx-auto rounded-full mt-3 transition-colors duration-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {brandsDetails.map((brand) => (
              <div
                key={brand.name}
                className="bg-[#0c0c0c] border border-neutral-900 rounded-xl p-6 sm:p-8 hover:border-neutral-800 transition-all duration-300 relative group flex flex-col justify-between"
              >
                <div
                  style={{ backgroundColor: brand.accent }}
                  className="absolute -top-16 -right-16 w-32 h-32 rounded-full opacity-[0.02] group-hover:opacity-[0.06] filter blur-xl transition duration-500"
                />

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-900 pb-3">
                    <div>
                      <span className="text-[9px] text-neutral-500 uppercase tracking-[0.2em] font-bold block">{brand.origin}</span>
                      <h3 className="text-xl font-serif font-bold text-white tracking-widest mt-0.5">{brand.name}</h3>
                    </div>
                    <span
                      style={{ color: brand.accent, borderColor: `${brand.accent}22` }}
                      className="text-[9px] border py-1 px-2.5 rounded text-center tracking-widest font-serif font-semibold h-fit"
                    >
                      {brand.heritage}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-450 font-sans leading-relaxed">
                    {brand.desc}
                  </p>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => {
                      setFilterBrand(brand.name);
                      setActiveTab("parfums");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    style={{ borderColor: brand.accent }}
                    className="border text-white text-[10px] tracking-wider font-serif uppercase py-2 px-5 rounded hover:bg-white/[0.04] transition duration-200"
                  >
                    Découvrir l'univers
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>
    );
  };

  const renderNouveautesView = () => {
    const bestSellers = allPerfumes.filter(p => p.isBestSeller);
    
    return (
      <section className="bg-neutral-950 py-12 px-4 sm:px-8 border-b border-neutral-900 text-left relative min-h-[70vh]">
        <div className="max-w-6xl mx-auto space-y-12 animate-fade-in">
          
          <div className="text-center space-y-2">
            <span className="text-[var(--accent-color)] text-xs font-serif tracking-[0.4em] uppercase font-bold block transition-colors duration-500">Sélection Privée</span>
            <h2 className="text-2xl sm:text-3xl font-serif tracking-widest uppercase text-white font-semibold">NOUVEAUTÉS & BEST-SELLERS</h2>
            <div
              style={{ backgroundColor: themeAccentColor }}
              className="w-24 h-1 mx-auto rounded-full mt-3 transition-colors duration-500"
            />
          </div>

          {/* Large spotlight banner of the top seasonal favorite */}
          <div className="bg-gradient-to-r from-neutral-900/65 to-neutral-950 border border-neutral-900 rounded-2xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4 flex items-center justify-center relative">
              <div className="absolute w-44 h-44 rounded-full bg-[var(--accent-color)]/5 blur-2xl animate-pulse" />
              <img
                src="/src/assets/images/3.png"
                alt="Imagination Louis Vuitton"
                className="max-h-56 object-contain z-10 filter drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)]"
              />
            </div>
            <div className="lg:col-span-8 text-left space-y-4">
              <div className="flex items-center gap-2">
                <span className="bg-cyan-500/10 text-cyan-400 text-[10px] font-bold tracking-widest uppercase py-1 px-2.5 rounded">Vedette de la Maison</span>
                <span className="text-neutral-500 text-xs">Maison Louis Vuitton</span>
              </div>
              <h3 className="text-2xl font-serif font-semibold text-white tracking-wide uppercase">IMAGINATION</h3>
              <p className="text-xs text-neutral-300 font-sans leading-relaxed max-w-xl">
                Un accord d'ambre d'exception et de thé noir de Chine qui évoque un horizon d'évasion sans limite. Une harmonie d'une fraîcheur éternelle et sensuelle adorée par les amoureux de haute parfumerie.
              </p>
              <div className="pt-2 flex items-center gap-4">
                <span className="text-lg font-serif font-bold text-cyan-400">À partir de 280€</span>
                <button
                  onClick={() => {
                    const target = PERFUMES_DB.find(p => p.id === "lv-imagination");
                    if (target) setSelectedPerfume(target);
                  }}
                  className="bg-white hover:bg-neutral-200 text-black text-[10px] font-bold font-serif tracking-widest uppercase py-2 px-5 rounded transition duration-200"
                >
                  Détails & Achat
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="font-serif text-lg tracking-wider text-neutral-200 uppercase mt-4">Nos Fragrances Signatures</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bestSellers.map((perfume) => (
                <div
                  key={perfume.id}
                  className="bg-[#0b0b0b] border border-neutral-900 rounded-lg p-5 flex flex-col justify-between hover:border-neutral-800 transition-all duration-300"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-sans">{perfume.brand}</span>
                        <h4 className="font-serif text-sm font-bold text-white tracking-wide">{perfume.name}</h4>
                      </div>
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 py-0.5 px-2 rounded uppercase tracking-wider font-semibold">Best-seller</span>
                    </div>

                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed font-sans">{perfume.description}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-neutral-900/60 flex justify-between items-center">
                    <span className="text-xs font-serif text-[var(--accent-color)] font-bold">{perfume.price}€</span>
                    <button
                      onClick={() => setSelectedPerfume(perfume)}
                      className="text-[10px] font-serif tracking-wider uppercase text-neutral-300 hover:text-white underline"
                    >
                      Explorer le Parfum
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </section>
    );
  };

  const renderOffresView = () => (
    <section className="bg-neutral-950 py-12 px-4 sm:px-8 border-b border-neutral-900 text-left relative min-h-[70vh]">
      <div className="max-w-5xl mx-auto space-y-12 animate-fade-in">
        
        <div className="text-center space-y-2">
          <span className="text-[var(--accent-color)] text-xs font-serif tracking-[0.4em] uppercase font-bold block transition-colors duration-500">Espace Privilèges</span>
          <h2 className="text-2xl sm:text-3xl font-serif tracking-widest uppercase text-white font-semibold">AVANTAGES EXCLUSIFS</h2>
          <div
            style={{ backgroundColor: themeAccentColor }}
            className="w-24 h-1 mx-auto rounded-full mt-3 transition-colors duration-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-[#0b0b0b] border border-neutral-900 p-6 sm:p-8 rounded-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Gift className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif tracking-widest text-white uppercase font-bold">3 Échantillons Offerts</h3>
            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              Pour toute commande sur notre boutique en ligne, bénéficiez de <strong>3 flacons d'essais exclusifs (2ml)</strong> au lieu de 2. L'art divin d'explorer nos assemblages de nectars depuis le confort de votre maison.
            </p>
            <span className="text-[10px] uppercase text-neutral-500 tracking-wider block font-serif font-semibold">✓ Aucun code requis — Ajout automatique</span>
          </div>

          <div className="bg-[#0b0b0b] border border-neutral-900 p-6 sm:p-8 rounded-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif tracking-widest text-white uppercase font-bold">Lettre d'Or d'Atelier</h3>
            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              L'excellence personnalisée. Pour tout achat d'une pièce de 100ml ou plus, notre maître graveur en gants blancs dessine vos <strong>initiales au feu d'or 24 carats</strong> de façon permanente sur le verre de votre flacon.
            </p>
            <span className="text-[10px] uppercase text-neutral-500 tracking-wider block font-serif font-semibold">✓ Option disponible lors des détails produit</span>
          </div>

        </div>

        {/* Interactive VIP Appointment booking section */}
        <div className="bg-[#080808] border border-neutral-900 rounded-xl p-6 sm:p-10 space-y-6">
          <div className="text-left space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500 animate-pulse" />
              <span className="text-[10px] text-amber-500 uppercase tracking-widest font-bold">Conciergerie Olfactive Royale</span>
            </div>
            <h3 className="text-xl font-serif text-white tracking-wider uppercase font-semibold">PLANIFIER UNE ENVOLÉE OLFACTIVE PRIVÉE</h3>
            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              Sollicitez un entretien virtuel de 15 minutes en tête-à-tête avec notre conseiller olfactif. Décrivez-nous vos affinités historiques et laissez-nous vous orienter vers votre future signature d'exception.
            </p>
          </div>

          <div className="border-t border-neutral-900 pt-6">
            {isBookingSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/5 border border-green-500/20 rounded-lg p-6 text-center space-y-2"
              >
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto text-green-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-serif text-sm tracking-widest text-green-400 uppercase font-bold">RENDEZ-VOUS ACCORDÉ</h4>
                <p className="text-xs text-neutral-300 font-sans">
                  Cher(e) <strong>{bookingName}</strong>, votre entretien olfactif d'excellence est planifié pour le <strong>{bookingDate}</strong> à <strong>{bookingTime}</strong>. Un lien d'accès crypté vous a été envoyé par e-mail.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsBookingSuccess(false);
                    setBookingName("");
                    setBookingDate("");
                    setBookingTime("");
                  }}
                  className="text-[10px] font-sans text-neutral-400 hover:text-white underline pt-2 block mx-auto"
                >
                  Choisir une autre heure
                </button>
              </motion.div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (bookingName && bookingDate && bookingTime) {
                    setIsBookingSuccess(true);
                  } else {
                    alert("Veuillez renseigner votre nom, date et heure souhaitée.");
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left font-sans"
              >
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider block font-medium">Nom complet</label>
                  <input
                    type="text"
                    required
                    placeholder="Christian Dior"
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500/40 outline-none text-xs rounded p-3 text-white placeholder-neutral-600 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider block font-medium">Date désirée</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500/40 outline-none text-xs rounded p-3 text-white transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider block font-medium">Heure (CET)</label>
                  <div className="flex gap-2">
                    <select
                      required
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500/40 outline-none text-xs rounded p-3 text-white transition"
                    >
                      <option value="">Choisir l'heure</option>
                      <option value="10h00">10h00 - Matin</option>
                      <option value="11h30">11h30 - Matin</option>
                      <option value="14h30">14h30 - Après-midi</option>
                      <option value="16h00">16h00 - Après-midi</option>
                      <option value="17h30">17h30 - Fin de journée</option>
                    </select>
                    <button
                      type="submit"
                      style={{ backgroundColor: themeAccentColor }}
                      className="text-black font-bold font-serif text-[11px] tracking-wider uppercase px-4 rounded hover:brightness-110 active:scale-95 transition"
                    >
                      Réserver
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </section>
  );

  const renderAProposView = () => (
    <section className="bg-neutral-950 py-12 px-4 sm:px-8 border-b border-neutral-900 text-left relative min-h-[70vh]">
      <div className="max-w-4xl mx-auto space-y-12 animate-fade-in text-neutral-300">
        
        <div className="text-center space-y-2">
          <span className="text-[var(--accent-color)] text-xs font-serif tracking-[0.4em] uppercase font-bold block transition-colors duration-500">Maison Luxora</span>
          <h2 className="text-2xl sm:text-3xl font-serif tracking-widest uppercase text-white font-semibold">L'HÉRITAGE LUXORA</h2>
          <div
            style={{ backgroundColor: themeAccentColor }}
            className="w-24 h-1 mx-auto rounded-full mt-3 transition-colors duration-500"
          />
        </div>

        <div className="space-y-8 font-sans leading-relaxed text-xs sm:text-sm">
          
          <div className="space-y-3">
            <h3 className="font-serif text-base text-white tracking-widest uppercase mb-1">NOTRE MAISON À VENDÔME</h3>
            <p>
              Maison Luxora est née de l'alliance entre de prestigieux maîtres nez parisiens et de fervents antiquaires de senteurs historiques. Depuis nos alcôves proches de la Place Vendôme, nous œuvrons à dénicher uniquement des fioles au prestige indéniable, issues de filières éthiques, courtes et certifiées souveraines.
            </p>
            <p>
              Chaque essence inscrite dans notre catalogue s'assimile à un voyage sensoriel exclusif : résines indonésiennes pures, thé fumé des hauteurs bouddhistes du Sichuan, ou vanille Bourbon d'un velouté incomparable. Une sélection intransigeante pour des signatures corporelles mémorables.
            </p>
          </div>

          <div className="border-t border-neutral-900 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-amber-500 font-serif text-lg font-bold">I.</div>
              <h4 className="text-[11px] text-white font-serif uppercase tracking-widest font-bold">Sécurité & Pureté</h4>
              <p className="text-[11px] text-neutral-400">
                La quête d'une intégrité absolue. Tous nos flacons parviennent protégés sous cellophane de scellés des marques d'origine, prémunis des contrefaçons.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-pink-500 font-serif text-lg font-bold">II.</div>
              <h4 className="text-[11px] text-white font-serif uppercase tracking-widest font-bold">Art de la Signature</h4>
              <p className="text-[11px] text-neutral-400">
                L'art d'imprimer une griffe charnelle éternelle dans la mémoire de vos interlocuteurs grâce à des parfums d'une persistance monumentale.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-cyan-500 font-serif text-lg font-bold">III.</div>
              <h4 className="text-[11px] text-white font-serif uppercase tracking-widest font-bold">Un Sillage d'Or</h4>
              <p className="text-[11px] text-neutral-400">
                De notre logistique minutieuse DHL au service après-commande disponible chaque jour par entretien de conciergerie personnalisé.
              </p>
            </div>
          </div>

          <div className="bg-[#0b0b0b] border border-neutral-900 rounded-lg p-6 text-center space-y-4 pt-8">
            <h4 className="font-serif text-base text-white tracking-widest uppercase font-semibold">"L'émotion de la fragrance survit aux années."</h4>
            <p className="text-neutral-400 italic font-sans text-xs">
              Maison Luxora mobilise de nobles circuits et d'actifs partenariats d'excellence pour vous soumettre les plus belles créations au monde en livraison suivie signature DHL.
            </p>
            <button
              onClick={() => {
                setActiveTab("parfums");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              style={{ backgroundColor: themeAccentColor }}
              className="text-black text-[10px] font-bold tracking-widest uppercase py-2.5 px-6 rounded font-serif mt-2"
            >
              Parcourir la Boutique
            </button>
          </div>

        </div>

      </div>
    </section>
  );
  
  // Sparkle particle definitions for visual immersion (changes based on active theme)
  const renderSparkles = () => {
    const colorMap = {
      gold: "bg-amber-500/20 shadow-amber-500/30",
      pink: "bg-pink-500/20 shadow-pink-500/30",
      blue: "bg-cyan-400/20 shadow-cyan-400/30"
    };
    const activeSparkleColor = colorMap[activeSlideData.theme];

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute top-1/4 left-1/4 w-32 h-32 rounded-full filter blur-3xl transition-all duration-1000 opacity-20 ${activeSlideData.theme === 'pink' ? 'bg-[#E0115F]' : activeSlideData.theme === 'blue' ? 'bg-[#00F0FF]' : 'bg-[#D4AF37]'}`} />
        <div className={`absolute bottom-1/3 right-1/4 w-40 h-40 rounded-full filter blur-3xl transition-all duration-1000 opacity-20 ${activeSlideData.theme === 'pink' ? 'bg-[#E0115F]' : activeSlideData.theme === 'blue' ? 'bg-[#00F0FF]' : 'bg-[#D4AF37]'}`} />
        
        {/* Particle circles floating background */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`${activeSlide}-${i}`}
            initial={{
              opacity: 0,
              y: Math.random() * 400 + 300,
              x: Math.random() * 1000
            }}
            animate={{
              opacity: [0, 0.7, 0],
              y: -100,
              scale: [0.5, 1.2, 0.5]
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut"
            }}
            className={`absolute w-3 h-3 rounded-full shadow-lg ${activeSparkleColor}`}
          />
        ))}
      </div>
    );
  };

  // Distinct brands list for categories dropdown filter, including custom brands
  const brandsList = [
    "All",
    "Emporio Armani",
    "Valentino",
    "Louis Vuitton",
    "Tom Ford",
    "Creed",
    "Maison Francis Kurkdjian",
    ...customPerfumes.map(p => p.brand).filter((b, i, self) => !["Emporio Armani", "Valentino", "Louis Vuitton", "Tom Ford", "Creed", "Maison Francis Kurkdjian"].includes(b) && self.indexOf(b) === i)
  ];

  const filteredCollection = allPerfumes.filter((perfume) => {
    const matchesBrand = filterBrand === "All" || perfume.brand === filterBrand;
    const matchesCategory = filterCategory === "Tous" || perfume.category === filterCategory;
    return matchesBrand && matchesCategory;
  });

  return (
    <div
      style={{
        "--accent-color": themeAccentColor,
        "--accent-hover": activeSlideData.hoverAccentColorHex
      } as React.CSSProperties}
      className="min-h-screen bg-[#070707] text-white flex flex-col justify-between selection:bg-[var(--accent-color)] selection:text-black transition-colors duration-700"
    >
      {/* Injected style tag to dynamically shift page-wide text selection colors according to active slide theme */}
      <style>{`
        ::selection {
          background-color: ${themeAccentColor} !important;
          color: #000000 !important;
        }
      `}</style>
      
      {/* Background visual atmosphere */}
      {renderSparkles()}

      {/* LUXURY STATUS ROW (Optional but highly premium - invisible helper context) */}
      <div className="hidden border-b border-white/[0.03] bg-black text-[9px] uppercase tracking-[0.3em] py-1.5 px-6 text-center text-neutral-400 font-sans md:flex justify-between items-center z-40">
        <span>PREMIUM CONCIERGERIE · LIVRAISON OFFERTE DÈS 150€</span>
        <span>LUXORA PARIS · BOUTIQUE EN LIGNE CERTIFIÉE</span>
      </div>

      {/* HEADER SECTION - glassmorphism navigation */}
      <header className="sticky top-0 bg-[#070707]/90 backdrop-blur-md border-b border-white/[0.04] py-4 px-4 sm:px-8 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo Brand with 'L' monogram */}
          <div className="flex items-center space-x-3.5 select-none cursor-pointer" onClick={() => { setActiveTab("accueil"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            <div
              style={{ borderColor: themeAccentColor }}
              className="w-10 h-10 border-2 border-double p-[1.5px] rounded flex items-center justify-center bg-black shadow-lg shadow-amber-500/5 hover:border-white transition-all duration-500"
            >
              <span
                style={{ color: themeAccentColor }}
                className="font-serif text-lg font-bold tracking-widest hover:text-white transition-colors duration-500"
              >
                L
              </span>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-serif text-lg sm:text-xl font-bold tracking-[0.35em] text-[#EBEBEB] leading-none">LUXORA</span>
              <span
                style={{ color: themeAccentColor }}
                className="font-serif text-[8px] sm:text-[9px] lowercase tracking-[0.25em] uppercase mt-[2px] leading-none transition-colors duration-500"
              >
                parfums d'exception
              </span>
            </div>
          </div>

          {/* Centered Navigation Items */}
          <nav className="hidden lg:flex items-center space-x-7 text-xs font-serif tracking-[0.2em] text-neutral-300">
            {[
              { id: "accueil", label: "ACCUEIL" },
              { id: "parfums", label: "PARFUMS" },
              { id: "marques", label: "MARQUES" },
              { id: "nouveautes", label: "NOUVEAUTÉS" },
              { id: "offres", label: "OFFRES & RDV" },
              { id: "apropos", label: "À PROPOS" },
              ...(isAdminVerified ? [{ id: "admin", label: "ADMIN" }] : [])
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-${tab.id}`}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={isActive ? { color: themeAccentColor } : {}}
                  className="hover:text-white uppercase relative py-1.5 transition-colors duration-300 font-medium cursor-pointer"
                >
                  {tab.label}
                  {isActive && (
                    <motion.span
                      layoutId="activeHeaderTabGlow"
                      style={{ backgroundColor: themeAccentColor }}
                      className="absolute bottom-0 left-0 w-full h-[1.5px] rounded-full shadow-glow"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Widgets */}
          <div className="flex items-center gap-3.5">
            {/* Search toggler */}
            <button
              id="header-search-btn"
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 hover:bg-neutral-800/60 rounded-full transition-all text-neutral-300 hover:text-white"
              title="Rechercher un parfum"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Profile authentication indicator */}
            {userEmail ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span style={{ color: themeAccentColor }} className="text-[9px] uppercase tracking-wider font-bold transition-colors duration-500">Membre Élite</span>
                  <span className="text-[10px] text-neutral-400 font-sans max-w-[120px] truncate">{userEmail}</span>
                </div>
                <button
                  id="auth-logout-btn"
                  onClick={() => setUserEmail(null)}
                  className="p-1.5 hover:bg-neutral-800/60 rounded-full transition text-neutral-400 hover:text-red-400"
                  title="Se déconnecter"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="header-profile-btn"
                onClick={() => setIsAuthOpen(true)}
                className="p-1.5 hover:bg-neutral-800/60 rounded-full transition text-neutral-300 hover:text-white"
                title="Accéder au club"
              >
                <User className="w-5 h-5" />
              </button>
            )}

            {/* Cart trigger block with count indicator */}
            <button
              id="header-cart-btn"
              onClick={() => setIsCartOpen(true)}
              className="p-1.5 hover:bg-neutral-800/60 rounded-full transition text-neutral-300 hover:text-white relative"
              title="Ouvrir le panier"
            >
              <ShoppingBag className="w-5 h-5 text-neutral-200" />
              {cart.length > 0 && (
                <span
                  style={{ backgroundColor: themeAccentColor }}
                  className="absolute -top-[1px] -right-[1px] text-black font-bold text-[9px] leading-none w-4 h-4 rounded-full flex items-center justify-center font-sans transition-colors duration-500"
                >
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>

            {/* Espace Createur / Admin Lock key button */}
            <button
              id="header-admin-key-btn"
              onClick={() => {
                if (isAdminVerified) {
                  setActiveTab(activeTab === "admin" ? "accueil" : "admin");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  setIsAdminGateOpen(true);
                }
              }}
              style={{ color: themeAccentColor }}
              className="p-1.5 hover:bg-neutral-800/60 rounded-full transition relative"
              title={isAdminVerified ? "Tableau de Bord Administrateur" : "Portail de Sécurité Admin"}
            >
              {isAdminVerified ? (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-black" />
                </>
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </button>

            {/* Elite connect text outline button */}
            <button
              id="connect-cta-btn"
              onClick={() => {
                if (userEmail) {
                  alert(`Espace Club Privé : Vous êtes connecté en tant que ${userEmail}. Votre statut membre Elite vous accorde la livraison prioritaire gratuite de tous vos achats !`);
                } else {
                  setIsAuthOpen(true);
                }
              }}
              style={{ borderColor: `${themeAccentColor}80`, color: themeAccentColor }}
              className="hidden sm:inline-block border hover:bg-white/[0.04] transition-all duration-500 text-[10px] font-serif tracking-widest font-bold uppercase rounded py-2 px-3.5 bg-transparent cursor-pointer"
            >
              {userEmail ? "CLUB ÉLITE ACTIVE" : "S'INSCRIRE / SE CONNECTER"}
            </button>

            {/* Mobile Menu Toggler burger */}
            <button
              id="mobile-menu-burger-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 hover:bg-neutral-800/60 rounded text-neutral-300 transition duration-200 cursor-pointer"
              title="Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-red-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="lg:hidden fixed inset-x-0 top-[73px] bg-[#070707] border-b border-neutral-900 z-50 p-6 flex flex-col space-y-4 shadow-2xl justify-start max-h-[80vh] overflow-y-auto"
          >
            {[
              { id: "accueil", label: "ACCUEIL" },
              { id: "parfums", label: "PARFUMS" },
              { id: "marques", label: "MARQUES" },
              { id: "nouveautes", label: "NOUVEAUTÉS" },
              { id: "offres", label: "OFFRES & RDV VIP" },
              { id: "apropos", label: "NOTRE HISTOIRE" },
              ...(isAdminVerified ? [{ id: "admin", label: "ADMIN" }] : [])
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setIsMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={isActive ? { color: themeAccentColor, borderColor: `${themeAccentColor}40` } : {}}
                  className={`py-3.5 px-4 rounded text-xs font-serif tracking-[0.25em] text-left border cursor-pointer ${
                    isActive ? "bg-neutral-950/80 font-bold" : "border-transparent text-neutral-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ANIMATED VIEWS DOCKER */}
      <main className="flex-1 relative z-10 w-full animate-fade-in">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="w-full"
          >
            {activeTab === "accueil" && renderAccueilView()}
            {activeTab === "parfums" && renderParfumsView()}
            {activeTab === "marques" && renderMarquesView()}
            {activeTab === "nouveautes" && renderNouveautesView()}
            {activeTab === "offres" && renderOffresView()}
            {activeTab === "apropos" && renderAProposView()}
            {activeTab === "admin" && (
              isAdminVerified ? (
                <AdminDashboard
                  perfumes={allPerfumes}
                  onRefreshCatalog={fetchCustomPerfumes}
                  themeAccentColor={themeAccentColor}
                  onDeletePerfume={handleDeletePerfume}
                  onSelectPerfume={setSelectedPerfume}
                  onLogout={() => {
                    setIsAdminVerified(false);
                    sessionStorage.removeItem("luxora_admin_logged");
                    setActiveTab("accueil");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              ) : (
                <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 bg-[#030303] border border-neutral-900 rounded-xl my-12 max-w-md mx-auto">
                  <Lock className="w-10 h-10 text-neutral-600 mb-4 animate-pulse" />
                  <h3 className="font-serif uppercase tracking-widest text-sm text-white mb-2 font-bold">ACCÈS ADMINISTRATIF SÉCURISÉ</h3>
                  <p className="text-xs text-neutral-500 font-sans leading-relaxed max-w-xs mb-6">
                    Cette console est réservée au personnel certifié de Luxora Paris. Veuillez vous authentifier.
                  </p>
                  <button 
                    onClick={() => {
                      setIsAdminGateOpen(true);
                    }}
                    style={{ backgroundColor: themeAccentColor }}
                    className="px-6 py-3 uppercase tracking-wider font-bold text-[10px] text-black font-serif rounded hover:brightness-110 active:scale-95 transition cursor-pointer"
                  >
                    DÉVERROUILLER LA CONSOLE
                  </button>
                </div>
              )
            )}
          </motion.div>
        </AnimatePresence>
      </main>



      {/* FOOTER AREA */}
      <footer className="bg-[#050505] border-t border-neutral-900/60 py-8 px-4 sm:px-8 text-neutral-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div
              style={{ borderColor: `${themeAccentColor}80` }}
              className="w-7 h-7 border rounded flex items-center justify-center bg-black transition-all duration-500"
            >
              <span style={{ color: themeAccentColor }} className="font-serif text-sm transition-colors duration-500">
                L
              </span>
            </div>
            <span className="font-serif tracking-widest text-[#f0f0f0] uppercase text-xs">Luxora Parfums</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-[10px] uppercase tracking-wider font-serif">
            <button className="hover:text-[var(--accent-color)] transition duration-200" onClick={() => alert("Politique de Confidentialité de Luxora. Vos données de profil sont strictement cryptées et ne feront jamais l'objet de partages publicitaires.")}>Confidentialité</button>
            <button className="hover:text-[var(--accent-color)] transition duration-200" onClick={() => alert("Mentions Légales :\nLuxora SAS\nRCS Paris B 123 456 789\nCapital social : 500 000 €\nTVA Intracommunautaire : FR 12 345 678 901")}>Mentions Légales</button>
            <button className="hover:text-[var(--accent-color)] transition duration-200" onClick={() => alert("Politique Expédition : Toute commande de parfum d'exception validée avant 14h sera remise au transporteur DHL Express le jour même pour livraison sous signature sous 24 à 48h.")}>Expéditions</button>
            <button className="hover:text-[var(--accent-color)] transition duration-200" onClick={() => alert("Contactez notre équipe de conciergerie VIP :\nStandard direct : +33 1 76 54 32 10\nEmail : conciergerie@luxora-parfums.com")}>Conciergerie</button>
            <button 
              className="transition duration-200 hover:text-white font-bold"
              style={{ color: isAdminVerified ? themeAccentColor : "#D4AF37" }}
              onClick={() => {
                if (isAdminVerified) {
                  setActiveTab(activeTab === "admin" ? "accueil" : "admin");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  setIsAdminGateOpen(true);
                }
              }}
            >
              {isAdminVerified ? "CONSEIL D'ADMIN (ACTIVE)" : "ACCÈS ADMIN SECURE"}
            </button>
          </div>

          <p className="text-[10px] font-sans">
            &copy; 2026 LUXORA Paris. Tous droits réservés.
          </p>
        </div>
      </footer>

      {/* AUXILIARY COMPONENT OVERLAYS */}
      
      {/* 1. Cart Sliding side-over Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={(order) => handleCheckoutSuccess(order)}
      />

      {/* 2. Detailed Scent Pyramid Sheet Modal */}
      <ProductDetailModal
        isOpen={selectedPerfume !== null}
        onClose={() => setSelectedPerfume(null)}
        perfume={selectedPerfume}
        onAddToCart={handleAddToCart}
      />

      {/* 3. Global Text-Search Dialog */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={(p) => setSelectedPerfume(p)}
        allPerfumes={allPerfumes}
      />

      {/* 4. Club Register & Signin forms */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(email) => setUserEmail(email)}
      />

      {/* 5. Secure Admin Gate Authentication Passcode Portal */}
      <AdminGateModal
        isOpen={isAdminGateOpen}
        onClose={() => setIsAdminGateOpen(false)}
        onSuccess={() => {
          setIsAdminVerified(true);
          sessionStorage.setItem("luxora_admin_logged", "true");
          setActiveTab("admin");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      {/* 6. Admin Panel Modal (Intelligent Fragrance Creator via Gemini AI) */}
      <AnimatePresence>
        {isAdminOpen && (
          <div 
            onClick={() => {
              if (!isSearchingAI) setIsAdminOpen(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-pointer"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-neutral-950 border border-neutral-900 rounded-xl p-6 sm:p-8 text-left space-y-6 shadow-2xl shadow-[#D4AF37]/5 font-sans cursor-default"
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b border-neutral-900 pb-4">
                <div>
                  <div className="flex items-center space-x-2 text-[#D4AF37]">
                    <ShieldCheck className="w-5 h-5 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-[0.3em] font-serif font-bold">ESPACE CRÉATEUR PREMIUM</span>
                  </div>
                  <h3 className="text-xl font-serif text-white tracking-wider mt-1 font-semibold">RECHERCHE OLFACTIVE INTELLIGENTE</h3>
                </div>
                <button
                  onClick={() => {
                    if (!isSearchingAI) setIsAdminOpen(false);
                  }}
                  className="p-1.5 hover:bg-neutral-900 rounded-full transition text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Instructions and Form */}
              <div className="space-y-4">
                <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                  Saisissez simplement une marque de haute joaillerie olfactive et un modèle de parfum. Notre intelligence recherche en temps réel sur <strong>Fragrantica</strong> pour modéliser instantanément la pyramide, l'histoire et les accords principaux.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold font-sans">Marque / Créateur (ex: Chanel)</label>
                    <input
                      type="text"
                      placeholder="e.g., Tom Ford, Dior, Creed..."
                      value={adminBrand}
                      onChange={(e) => setAdminBrand(e.target.value)}
                      disabled={isSearchingAI}
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#D4AF37] text-white rounded p-3 text-xs outline-none transition duration-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold font-sans">Modèle d'Exception (ex: No. 5)</label>
                    <input
                      type="text"
                      placeholder="e.g., Oud Wood, Sauvage..."
                      value={adminModel}
                      onChange={(e) => setAdminModel(e.target.value)}
                      disabled={isSearchingAI}
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#D4AF37] text-white rounded p-3 text-xs outline-none transition duration-200"
                    />
                  </div>
                </div>

                {searchError && (
                  <p className="text-xs text-red-450 bg-red-950/20 border border-red-900/30 p-3 rounded">
                    {searchError}
                  </p>
                )}

                <button
                  onClick={handleSearchAI}
                  disabled={isSearchingAI}
                  className="w-full h-11 bg-gradient-to-r from-[#D4AF37] to-[#F3CD4F] text-black font-bold text-xs uppercase tracking-widest rounded-md hover:brightness-110 active:scale-[0.99] transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  {isSearchingAI ? (
                    <div className="flex items-center space-x-2.5">
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>RECHERCHE OLFACTIVE EN COURS...</span>
                    </div>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 animate-bounce" />
                      <span>Rechercher & Modéliser via l'IA</span>
                    </>
                  )}
                </button>
              </div>

              {/* Divider / Txt Uploader */}
              <div className="pt-6 border-t border-neutral-900 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h4 className="text-xs uppercase font-serif tracking-[0.2em] text-[#D4AF37] font-bold flex items-center space-x-1">
                      <FileText className="w-3.5 h-3.5 text-[#D4AF37] inline mr-1" />
                      <span>IMPORTATION PAR LOT (.TXT)</span>
                    </h4>
                    <p className="text-[11px] text-neutral-500 font-sans mt-0.5">Chargez une liste de noms de parfums (format: "Créateur - Modèle" ou un par ligne).</p>
                  </div>
                  
                  {/* Styled Raw Input trigger */}
                  <label className="cursor-pointer bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 transition py-1.5 px-3 rounded text-[10px] text-neutral-300 font-serif inline-flex items-center space-x-1.5 flex-shrink-0 self-start sm:self-auto">
                    <Upload className="w-3 h-3 text-[#D4AF37]" />
                    <span>Sélectionner un fichier .txt</span>
                    <input
                      type="file"
                      accept=".txt"
                      onChange={handleTxtUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {importMessage && (
                  <p className="text-[11px] text-[#D4AF37] opacity-95">{importMessage}</p>
                )}

                {/* Loaded Queries List view */}
                {importedQueries.length > 0 && (
                  <div className="bg-[#0b0b0b] border border-neutral-900 rounded-lg p-3 space-y-2.5 max-h-56 overflow-y-auto">
                    <div className="flex justify-between items-center pb-2 border-b border-neutral-900">
                      <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-sans">PARFUMS IDENTIFIÉS ({importedQueries.length})</span>
                      <button
                        onClick={() => {
                          setImportedQueries([]);
                          setImportMessage("");
                        }}
                        className="text-[9px] text-red-400 hover:underline font-serif"
                      >
                        Vider la liste
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {importedQueries.map((item) => (
                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-neutral-900/30 rounded border border-neutral-905">
                          <div className="min-w-0 flex items-center space-x-2">
                            <span className="text-[11px] text-neutral-300 font-sans truncate">
                              <strong className="text-white font-semibold">{item.brand}</strong> — {item.model}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-auto">
                            {item.status === "idle" && (
                              <>
                                <button
                                  onClick={() => {
                                    setAdminBrand(item.brand);
                                    setAdminModel(item.model);
                                    setAiResult(null);
                                    setSearchError("");
                                  }}
                                  className="text-[9px] bg-neutral-900 hover:bg-neutral-800 border border-neutral-805 text-neutral-300 px-2.5 py-1 rounded transition font-serif"
                                  title="Pré-remplir la recherche manuelle"
                                >
                                  Sélectionner
                                </button>
                                <button
                                  onClick={() => handleProcessImportedItem(item.id, item.brand, item.model)}
                                  className="text-[9px] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 hover:border-[#D4AF37]/50 text-[#D4AF37] px-2.5 py-1 rounded transition font-bold"
                                  title="Modéliser automatiquement en tâche de fond"
                                >
                                  Modéliser d'un clic
                                </button>
                              </>
                            )}

                            {item.status === "loading" && (
                              <span className="text-[9px] text-[#D4AF37] flex items-center space-x-1.5 font-semibold animate-pulse">
                                <span className="w-2.5 h-2.5 rounded-full border border-[#D4AF37] border-t-transparent animate-spin inline-block" />
                                <span>Analyse par l'IA...</span>
                              </span>
                            )}

                            {item.status === "success" && (
                              <span className="text-[9.5px] text-green-400 flex items-center space-x-1 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                                <span>Ajouté avec succès !</span>
                              </span>
                            )}

                            {item.status === "error" && (
                              <div className="flex items-center space-x-1.5">
                                <span className="text-[9px] text-red-400 flex items-center space-x-1 font-semibold">
                                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                                  <span>Échec</span>
                                </span>
                                <button
                                  onClick={() => handleProcessImportedItem(item.id, item.brand, item.model)}
                                  className="text-[9px] underline text-neutral-400 hover:text-white"
                                >
                                  Réessayer
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AI result Preview & Live Editor section */}
              {aiResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-[#D4AF37]/35 bg-[#0a0a0a] rounded-xl p-5 space-y-4 shadow-2xl font-sans"
                >
                  {aiNotice && (
                    <div className="text-[10px] text-[#D4AF37] bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-2.5 rounded-lg flex items-center space-x-1.5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-[#D4AF37]" />
                      <span>{aiNotice}</span>
                    </div>
                  )}

                  <div className="border-b border-neutral-900 pb-3">
                    <span className="text-[9px] tracking-widest text-[#D4AF37] uppercase block font-bold font-serif">
                      FICHE FRAGRANCE DÉTECTÉE — AJUSTEURS DISPONIBLES
                    </span>
                  </div>

                  {/* Multi-field Inline Editor */}
                  <div className="space-y-3.5 text-xs text-neutral-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Marque du Parfumeur</label>
                        <input
                          type="text"
                          value={aiResult.brand || ""}
                          onChange={(e) => handleUpdateAiResultField("brand", e.target.value)}
                          className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-white outline-none focus:border-[#D4AF37] transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Nom de la Fragrance</label>
                        <input
                          type="text"
                          value={aiResult.name || ""}
                          onChange={(e) => handleUpdateAiResultField("name", e.target.value)}
                          className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-white outline-none focus:border-[#D4AF37] transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Catégorie Olfactive</label>
                        <select
                          value={aiResult.category || "Unisexe"}
                          onChange={(e) => handleUpdateAiResultField("category", e.target.value)}
                          className="w-full bg-black border border-neutral-800 rounded px-2.5 py-2 text-white outline-none focus:border-[#D4AF37] h-[36px] transition cursor-pointer"
                        >
                          <option value="Femme">Femme</option>
                          <option value="Homme">Homme</option>
                          <option value="Unisexe">Unisexe</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Prix Indicatif (€)</label>
                        <input
                          type="number"
                          value={aiResult.price !== undefined ? aiResult.price : 150}
                          onChange={(e) => handleUpdateAiResultField("price", Number(e.target.value))}
                          className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-white outline-none focus:border-[#D4AF37] transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Sillages et Description</label>
                      <textarea
                        rows={2}
                        value={aiResult.description || ""}
                        onChange={(e) => handleUpdateAiResultField("description", e.target.value)}
                        className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-white outline-none focus:border-[#D4AF37] transition leading-relaxed font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Lien du Flacon (URL de l'image)</label>
                      <input
                        type="text"
                        value={aiResult.image || ""}
                        onChange={(e) => handleUpdateAiResultField("image", e.target.value)}
                        className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-white outline-none focus:border-[#D4AF37] transition font-mono text-[10px]"
                        placeholder="Insérer l'URL de l'illustration"
                      />

                      {aiResult.image && (
                        <div className="mt-2.5 flex items-center gap-3 bg-neutral-950 p-2 border border-neutral-900 rounded-lg">
                          <img
                            src={aiResult.image}
                            alt={aiResult.name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-10 object-cover bg-neutral-900 rounded border border-neutral-800 flex-shrink-0"
                            onError={(e) => {
                              (e.target as any).src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 130' width='100' height='130'><rect width='100%25' height='100%25' fill='%23121214'/><rect x='35' y='18' width='30' height='20' rx='4' fill='none' stroke='%23D4AF37' stroke-width='2'/><rect x='20' y='38' width='60' height='75' rx='12' fill='none' stroke='%23D4AF37' stroke-width='2'/><path d='M 24 50 L 76 50' stroke='%23D4AF37' stroke-width='0.5'/><text x='50' y='75' font-family='serif' font-size='7' fill='%23D4AF37' text-anchor='middle' letter-spacing='1'>LUXORA</text></svg>";
                            }}
                          />
                          <div>
                            <span className="text-[9px] uppercase font-bold text-neutral-400 block font-serif tracking-widest">{aiResult.brand || "Maison"}</span>
                            <span className="text-[10px] text-neutral-500 block truncate">{aiResult.name}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-neutral-900">
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Notes de Tête (séparées par des virgules)</label>
                        <input
                          type="text"
                          value={(aiResult.topNotes || []).join(", ")}
                          onChange={(e) => handleUpdateAiResultNotes("topNotes", e.target.value)}
                          className="w-full bg-black border border-neutral-800 rounded px-3 py-1.5 text-white outline-none focus:border-[#D4AF37] transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Notes de Cœur (séparées par des virgules)</label>
                        <input
                          type="text"
                          value={(aiResult.heartNotes || []).join(", ")}
                          onChange={(e) => handleUpdateAiResultNotes("heartNotes", e.target.value)}
                          className="w-full bg-black border border-neutral-800 rounded px-3 py-1.5 text-white outline-none focus:border-[#D4AF37] transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Notes de Fond (séparées par des virgules)</label>
                        <input
                          type="text"
                          value={(aiResult.baseNotes || []).join(", ")}
                          onChange={(e) => handleUpdateAiResultNotes("baseNotes", e.target.value)}
                          className="w-full bg-black border border-neutral-800 rounded px-3 py-1.5 text-white outline-none focus:border-[#D4AF37] transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Scent Profile Accords graph */}
                  {aiResult.accords && aiResult.accords.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-neutral-900">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider font-serif">NOTES PRINCIPALES (Rapport d'Extrait)</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {aiResult.accords.map((accord, i) => (
                          <div key={i} className="flex flex-col space-y-1">
                            <div className="flex justify-between items-center text-[9px] text-neutral-500 font-mono px-0.5">
                              <span className="capitalize text-neutral-300 truncate">{accord.name}</span>
                              <span>{accord.value}%</span>
                            </div>
                            <div className="w-full bg-neutral-900 h-4.5 rounded overflow-hidden">
                              <div style={{ width: `${accord.value}%`, backgroundColor: accord.color }} className="h-full rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleConfirmAddPerfume}
                    className="w-full h-11 bg-white hover:bg-[#D4AF37] hover:text-black text-black font-bold text-xs uppercase tracking-widest rounded-md hover:shadow-xl active:scale-[0.99] transition duration-200 mt-2 font-serif"
                  >
                    Confirmer l'ajout au catalogue boutique
                  </button>
                </motion.div>
              )}

              {/* Custom perfumes list for removal & quick review */}
              {customPerfumes.length > 0 && (
                <div className="pt-6 border-t border-neutral-900 space-y-3">
                  <span className="text-[10px] uppercase font-serif tracking-[0.2em] text-neutral-500 font-bold block">
                    FRAGRANCES AJOUTÉES DEPUIS L'IA ({customPerfumes.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
                    {customPerfumes.map((perfume) => (
                      <div key={perfume.id} className="flex justify-between items-center p-2.5 bg-neutral-900/30 rounded border border-neutral-905">
                        <div className="min-w-0 pr-2">
                          <span className="text-[8px] uppercase tracking-wider text-neutral-500">{perfume.brand}</span>
                          <h5 className="text-[11px] font-semibold text-white truncate">{perfume.name}</h5>
                        </div>
                        <div className="flex items-center space-x-2.5">
                          <span className="text-[9px] font-mono text-neutral-500 capitalize">{perfume.category}</span>
                          <button
                            onClick={() => handleDeletePerfume(perfume.id, perfume.name)}
                            className="p-1 hover:bg-red-950/20 text-neutral-500 hover:text-red-400 rounded transition"
                            title="Retirer de la boutique"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Checkout payment mock success pop-up */}
      <AnimatePresence>
        {isCheckoutSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.92 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutSuccess(false)}
              className="fixed inset-0 bg-black/95 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              style={{ borderColor: `${themeAccentColor}40` }}
              className="relative bg-[#090909] border border-neutral-800 rounded-xl max-w-lg w-full z-10 text-white shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col font-sans"
            >
              {/* Gold glow top spotlight */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-[#D4AF37]/5 filter blur-3xl pointer-events-none" />

              {/* Sticky Header inside modal */}
              <div className="p-5 border-b border-neutral-900 flex justify-between items-center bg-[#090909] z-20 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] tracking-[0.3em] font-serif font-bold text-[#D4AF37] uppercase">
                    PAIEMENT VALIDÉ SECURE
                  </span>
                </div>
                <button
                  onClick={() => setIsCheckoutSuccess(false)}
                  className="p-1 px-[7px] bg-neutral-950 border border-neutral-800 hover:border-neutral-700/80 rounded transition duration-200 text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Receipt Body */}
              <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 pr-4 custom-scrollbar">
                
                {/* Header Logo Box */}
                <div className="text-center space-y-1">
                  <h3 className="text-xl tracking-[0.25em] font-serif font-semibold text-white uppercase">
                    LUXORA PARIS
                  </h3>
                  <p className="text-[11px] font-serif tracking-[0.15em] text-[#D4AF37] uppercase">
                    Maison de Haute Parfumerie
                  </p>
                  <p className="text-[10px] text-neutral-500 font-sans">
                    RCS Paris B 123 456 789 — Conciergerie VIP
                  </p>
                </div>

                {/* Simulated luxury physical receipt shape */}
                <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-5 font-sans space-y-4 shadow-inner">
                  
                  {/* Top Ticket Data */}
                  <div className="flex justify-between items-start border-b border-neutral-905 pb-3 text-[10px] text-neutral-400 font-mono">
                    <div className="space-y-1">
                      <div>TICKET N° : <span className="text-white font-bold">{lastCreatedOrder?.id || "LXR-98317-2026"}</span></div>
                      <div>DATE : <span className="text-white">
                        {lastCreatedOrder?.date 
                          ? new Date(lastCreatedOrder.date).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
                          : new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
                      </span></div>
                    </div>
                    <div className="space-y-1 text-right">
                      <div>HEURE : <span className="text-white">
                        {lastCreatedOrder?.date 
                          ? new Date(lastCreatedOrder.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                          : new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span></div>
                      <div>MODE : <span className="text-white">CB (3D-Secure)</span></div>
                    </div>
                  </div>

                  {/* Customer Information Section */}
                  <div className="space-y-1.5 border-b border-neutral-900 pb-3">
                    <span className="text-[10px] uppercase font-serif font-bold tracking-[0.15em] text-[#D4AF37] block">
                      DESTINATAIRE DE COMMANDE
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1 leading-normal">
                      <div>
                        <span className="text-neutral-500 block text-[9px] uppercase tracking-wider">Nom & Prénom</span>
                        <span className="text-neutral-200 font-semibold">{lastCreatedOrder?.customer?.name || "Membre Élite Luxora"}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[9px] uppercase tracking-wider">Téléphone</span>
                        <span className="text-neutral-200 font-mono">{lastCreatedOrder?.customer?.phone || "+33 6 00 00 00 00"}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-neutral-500 block text-[9px] uppercase tracking-wider">Adresse d'Expédition DHL</span>
                        <span className="text-neutral-200 block">
                          {lastCreatedOrder?.customer?.address || "1 Avenue des Champs-Élysées"}
                        </span>
                        <span className="text-neutral-400 font-medium">
                          {lastCreatedOrder?.customer?.zipCode || "75008"} {lastCreatedOrder?.customer?.city || "Paris"}, France
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Purchased Items List */}
                  <div className="space-y-2.5 border-b border-neutral-900 pb-4">
                    <span className="text-[10px] uppercase font-serif font-bold tracking-[0.15em] text-[#D4AF37] block">
                      DÉTAIL EXTRAIT DU PANIER
                    </span>
                    
                    <div className="space-y-3 pt-1">
                      {lastCreatedOrder?.items && lastCreatedOrder.items.length > 0 ? (
                        lastCreatedOrder.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-start text-xs font-sans">
                            <div className="space-y-0.5 min-w-0 pr-4">
                              <span className="text-[8px] uppercase tracking-wider text-neutral-500 font-serif block">
                                {item.perfume?.brand || "Luxora Paris"}
                              </span>
                              <p className="text-neutral-200 font-semibold truncate leading-none">
                                {item.perfume?.name || "Création sur Mesure"}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono mt-0.5">
                                <span className="bg-neutral-900 border border-neutral-800 px-1 py-0.5 rounded text-[8px] uppercase">{item.selectedSize || "100ml"}</span>
                                <span>× {item.quantity || 1}</span>
                              </div>
                            </div>
                            <div className="text-right font-mono font-medium text-neutral-200 whitespace-nowrap pt-1">
                              {(item.selectedPrice * (item.quantity || 1)).toLocaleString("fr-FR")} €
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-neutral-500 italic">Aucun article enregistré.</div>
                      )}
                    </div>
                  </div>

                  {/* Summary math block */}
                  <div className="space-y-1.5 text-xs font-sans pb-1">
                    <div className="flex justify-between text-neutral-400">
                      <span>Sous-Total</span>
                      <span className="font-mono text-neutral-200">{(lastCreatedOrder?.subtotal || 0).toLocaleString("fr-FR")} €</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Transport prioritaire DHL Express</span>
                      <span className="font-mono text-neutral-200 text-right">
                        {lastCreatedOrder?.shipping === 0 ? "Offert" : `${lastCreatedOrder?.shipping || 0} €`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-neutral-900 pt-3 mt-2">
                      <span className="font-serif font-bold tracking-wider text-white">TOTAL TRANSACTION</span>
                      <span className="font-serif font-bold text-base text-[#D4AF37] font-mono">
                        {(lastCreatedOrder?.total || 0).toLocaleString("fr-FR")} €
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional VIP Note */}
                <div className="p-4 bg-neutral-950/40 border border-neutral-900 rounded-lg text-center space-y-2">
                  <span className="text-[#D4AF37] text-[10px] tracking-widest font-bold uppercase font-serif block">
                    ★ Statut : Expédition Prioritaire ★
                  </span>
                  <p className="text-[10px] text-neutral-400 leading-relaxed font-sans">
                    Votre colis haut de gamme, scellé à la cire par notre maître cirier, sera pris en charge par DHL Express ce jour avant 16h. Il inclut vos <strong className="text-neutral-300">échantillons de courtoisie exclusifs</strong>.
                  </p>
                  <p className="text-[9px] text-neutral-500 font-sans">
                    Un email récapitulatif contenant le lien de traçabilité en temps réel a été transmis à : <span className="text-neutral-300 font-semibold">{lastCreatedOrder?.customer?.email || "votre adresse email"}</span>
                  </p>
                </div>

              </div>

              {/* Sticky footer action inside modal */}
              <div className="p-5 border-t border-neutral-900 bg-[#090909] flex flex-col gap-2 flex-shrink-0 z-20">
                <button
                  onClick={() => setIsCheckoutSuccess(false)}
                  style={{ backgroundColor: themeAccentColor }}
                  className="w-full text-black font-bold font-serif text-[11px] py-4 tracking-widest uppercase rounded cursor-pointer hover:brightness-115 active:scale-[0.99] transition duration-200 text-center flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Terminer mes Achats
                </button>
                <button
                  onClick={() => window.print()}
                  className="w-full text-neutral-400 hover:text-white border border-neutral-800 hover:bg-neutral-900 font-serif text-[10px] py-2.5 tracking-widest uppercase rounded transition cursor-pointer"
                >
                  Imprimer le reçu d'exception
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal for Perfume Deletion */}
      <AnimatePresence>
        {perfumeToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              onClick={() => setPerfumeToDelete(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-[#0b0b0b] border border-neutral-800 rounded-xl p-8 max-w-sm w-full text-center z-10 text-white shadow-2xl"
            >
              <button
                onClick={() => setPerfumeToDelete(null)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-neutral-900 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-full bg-red-950/20 border border-red-800/30 flex items-center justify-center mx-auto mb-4 text-red-500">
                <Trash2 className="w-5 h-5" />
              </div>

              <span className="font-serif tracking-[0.2em] text-[9px] uppercase font-bold text-red-400 block mb-1">
                Supprimer de la boutique
              </span>
              <h3 className="text-md font-serif uppercase text-white tracking-widest mb-3">
                Êtes-vous sûr ?
              </h3>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed mb-6">
                Voulez-vous supprimer définitivement la fragrance <strong className="text-white">"{perfumeToDelete.name}"</strong> du catalogue ? Cette action est irréversible.
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setPerfumeToDelete(null)}
                  className="flex-1 text-neutral-400 border border-neutral-800 font-serif text-[10px] px-4 py-2.5 tracking-wider uppercase rounded cursor-pointer hover:bg-neutral-900 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-serif text-[10px] px-4 py-2.5 tracking-wider uppercase rounded cursor-pointer transition shadow-lg shadow-red-950/20"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
