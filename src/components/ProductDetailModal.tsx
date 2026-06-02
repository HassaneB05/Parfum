import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, ShoppingBag, Eye, Heart, Sparkles, Feather, Flame, Award } from "lucide-react";
import { Perfume } from "../data";

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  perfume: Perfume | null;
  onAddToCart: (perfume: Perfume, size: string, price: number) => void;
}

export default function ProductDetailModal({
  isOpen,
  onClose,
  perfume,
  onAddToCart
}: ProductDetailModalProps) {
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "notes" | "accords">("accords");

  useEffect(() => {
    if (perfume) {
      // Default select first size and reset tab view to NOTES (accords) first
      const defaultSizeObj = perfume.sizes[0];
      setSelectedSize(defaultSizeObj.ml);
      setSelectedPrice(defaultSizeObj.price);
      setAdded(false);
      setActiveTab("accords");
    }
  }, [perfume]);

  if (!perfume) return null;

  const handleSizeSelect = (size: string, price: number) => {
    setSelectedSize(size);
    setSelectedPrice(price);
  };

  const handleAdd = () => {
    onAddToCart(perfume, selectedSize, selectedPrice);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Set accent colors based on theme product
  const accentColorClass =
    perfume.theme === "pink"
      ? "text-[#E0115F]"
      : perfume.theme === "blue"
      ? "text-[#00F0FF]"
      : "text-[#D4AF37]";

  const accentBgClass =
    perfume.theme === "pink"
      ? "bg-[#E0115F]"
      : perfume.theme === "blue"
      ? "bg-[#00F0FF]"
      : "bg-[#D4AF37]";

  const accentBorderClass =
    perfume.theme === "pink"
      ? "border-[#E0115F]"
      : perfume.theme === "blue"
      ? "border-[#00F0FF]"
      : "border-[#D4AF37]";

  const accentRingGlow =
    perfume.theme === "pink"
      ? "shadow-[#E0115F]/20"
      : perfume.theme === "blue"
      ? "shadow-[#00F0FF]/25"
      : "shadow-[#D4AF37]/25";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            id="detail-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 z-50 backdrop-blur-md"
          />

          {/* Modal Content */}
          <div 
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto cursor-pointer"
          >
            <motion.div
              id="detail-container"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-4xl bg-[#0c0c0c] border border-neutral-800 rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row text-white text-left cursor-default"
            >
              {/* Close Button */}
              <button
                id="close-detail-btn"
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-1.5 hover:bg-neutral-800/80 rounded-full transition duration-150 text-neutral-400 hover:text-white border border-neutral-800/50 bg-neutral-900/60"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Left Column: Visual presentation with glowing 3D pedestal */}
              <div className="md:w-1/2 bg-[#080808] border-b md:border-b-0 md:border-r border-neutral-800 flex flex-col items-center justify-center p-8 relative min-h-[350px] md:min-h-[480px] overflow-hidden">
                {/* Visual dynamic lights */}
                <div className={`absolute w-72 h-72 rounded-full opacity-10 filter blur-3xl luxury-glow ${
                  perfume.theme === 'pink' ? 'bg-[#E0115F]' :
                  perfume.theme === 'blue' ? 'bg-[#00F0FF]' : 'bg-[#D4AF37]'
                }`} />

                {perfume.image && perfume.image.startsWith("http") ? (
                  <div className="w-full h-64 flex items-center justify-center">
                    <img
                      src={perfume.image}
                      alt={perfume.name}
                      className="max-h-full max-w-[80%] object-contain drop-shadow-2xl"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as any).src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 130' width='100' height='130'><rect width='100%25' height='100%25' fill='%23121214'/><rect x='35' y='18' width='30' height='20' rx='4' fill='none' stroke='%23D4AF37' stroke-width='2'/><rect x='20' y='38' width='60' height='75' rx='12' fill='none' stroke='%23D4AF37' stroke-width='2'/><path d='M 24 50 L 76 50' stroke='%23D4AF37' stroke-width='0.5'/><text x='50' y='75' font-family='serif' font-size='7' fill='%23D4AF37' text-anchor='middle' letter-spacing='1'>LUXORA</text></svg>";
                      }}
                    />
                  </div>
                ) : (
                  <div className="relative w-full h-full min-h-[250px] md:min-h-[380px] flex items-center justify-center z-10 select-none overflow-hidden rounded-l-lg">
                    {perfume.image && (perfume.image.includes("1.png") || perfume.image.includes("2.png") || perfume.image.includes("3.png")) ? (
                      /* Since user uploaded beautiful background layouts for these, display them as full-bleed backgrounds inside the modal's visual column */
                      <img
                        src={perfume.image}
                        alt={perfume.name}
                        className="absolute inset-0 w-full h-full object-cover brightness-95"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <>
                        {/* Concentric pedestal ring background */}
                        <div className={`absolute bottom-6 w-44 h-12 rounded-full border border-dashed opacity-25 filter blur-xs ${accentBorderClass} animate-pulse`} />
                        <div className="absolute bottom-4 w-56 h-16 rounded-[100%] border border-neutral-800 bg-[#000000]/60 flex items-center justify-center">
                          <div className={`w-40 h-8 rounded-full border border-neutral-700/50 opacity-50 ${accentBorderClass}`} />
                        </div>

                        {perfume.image ? (
                          <motion.img
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            src={perfume.image}
                            alt={perfume.name}
                            className="h-56 w-56 object-contain drop-shadow-3xl z-10"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as any).src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 130' width='100' height='130'><rect width='100%25' height='100%25' fill='%23121214'/><rect x='35' y='18' width='30' height='20' rx='4' fill='none' stroke='%23D4AF37' stroke-width='2'/><rect x='20' y='38' width='60' height='75' rx='12' fill='none' stroke='%23D4AF37' stroke-width='2'/><path d='M 24 50 L 76 50' stroke='%23D4AF37' stroke-width='0.5'/><text x='50' y='75' font-family='serif' font-size='7' fill='%23D4AF37' text-anchor='middle' letter-spacing='1'>LUXORA</text></svg>";
                            }}
                          />
                        ) : (
                          <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            className="z-10"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 130" className="w-48 h-48 drop-shadow-3xl">
                              <rect width="100%" height="100%" rx="8" fill="#121214" />
                              <rect x="35" y="18" width="30" height="20" rx="4" fill="none" stroke="#D4AF37" strokeWidth="2" />
                              <rect x="20" y="38" width="60" height="75" rx="12" fill="none" stroke="#D4AF37" strokeWidth="2" />
                              <path d="M 24 50 L 76 50" stroke="#D4AF37" strokeWidth="0.5" />
                              <text x="50" y="75" fontFamily="serif" fontSize="7" fill="#D4AF37" textAnchor="middle" letterSpacing="1">LUXORA</text>
                            </svg>
                          </motion.div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Tags */}
                <div className="mt-6 flex flex-wrap gap-2 z-10 justify-center">
                  <span className="text-[10px] tracking-widest font-serif font-bold border border-neutral-800 bg-[#121212] px-3 py-1 rounded text-neutral-400">
                    SÉLECTION EXCLUSIVE
                  </span>
                  {perfume.isBestSeller && (
                    <span className={`text-[10px] tracking-widest font-serif font-bold border ${accentBorderClass} bg-[#141414] px-3 py-1 rounded ${accentColorClass} flex items-center gap-1`}>
                      <Award className="w-3 h-3" /> BEST-SELLER
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Descriptions & Custom Size Picker */}
              <div className="md:w-1/2 p-8 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-5">
                  <div>
                    <span className={`text-xs uppercase tracking-[0.25em] font-bold ${accentColorClass}`}>
                      {perfume.brand}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-serif tracking-wide mt-1 text-white uppercase font-semibold">
                      {perfume.name}
                    </h2>
                    <span className="text-xs text-neutral-500 tracking-wider mt-1 block">
                      Fragrance Haute Parfumerie · {perfume.category}
                    </span>
                  </div>

                  {/* Rating showcase */}
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-[#D4AF37]">★</span>
                      ))}
                    </div>
                    <span className="font-serif">4.9/5 (148 avis)</span>
                  </div>

                  {/* Pricing block */}
                  <div className="py-2.5 px-4 bg-[#111] border border-neutral-900 rounded-lg flex justify-between items-center">
                    <span className="text-xs text-neutral-400 uppercase tracking-widest">
                      Prix recommandé
                    </span>
                    <span className="text-2xl font-serif font-bold text-[#D4AF37]">
                      {selectedPrice}€
                    </span>
                  </div>

                  {/* Sizes Tab Navigation */}
                  <div>
                    <span className="text-xs text-neutral-400 uppercase tracking-wider block mb-2 font-medium">
                      Sélectionner le format :
                    </span>
                    <div className="flex gap-2">
                      {perfume.sizes.map((sizeObj) => (
                        <button
                          key={sizeObj.ml}
                          id={`size-btn-${sizeObj.ml}`}
                          onClick={() => handleSizeSelect(sizeObj.ml, sizeObj.price)}
                          className={`flex-1 py-2 px-3 text-xs tracking-wider font-semibold border rounded transition-all duration-300 ${
                            selectedSize === sizeObj.ml
                              ? `${accentBorderClass} bg-neutral-950 text-white ${accentColorClass}`
                              : "border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700 hover:text-white"
                          }`}
                        >
                          <span className="block text-xs">{sizeObj.ml}</span>
                          <span className="text-[10px] text-neutral-500 mt-0.5 block">
                            {sizeObj.price}€
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Tab menu: Notes, Profil, or Pyramide */}
                  <div className="border-b border-neutral-800 flex gap-4 text-xs font-serif tracking-widest">
                    {(perfume.accords && perfume.accords.length > 0) && (
                      <button
                        id="tab-accords-btn"
                        onClick={() => setActiveTab("accords")}
                        className={`pb-2.5 border-b-2 transition duration-200 ${
                          activeTab === "accords"
                            ? `${accentBorderClass} text-white`
                            : "border-transparent text-neutral-400 hover:text-white"
                        }`}
                      >
                        NOTES
                      </button>
                    )}
                    <button
                      id="tab-desc-btn"
                      onClick={() => setActiveTab("description")}
                      className={`pb-2.5 border-b-2 transition duration-200 ${
                        activeTab === "description"
                          ? `${accentBorderClass} text-white`
                          : "border-transparent text-neutral-400 hover:text-white"
                      }`}
                    >
                      PROFIL & ANALOGIES
                    </button>
                    <button
                      id="tab-notes-btn"
                      onClick={() => setActiveTab("notes")}
                      className={`pb-2.5 border-b-2 transition duration-200 ${
                        activeTab === "notes"
                          ? `${accentBorderClass} text-white`
                          : "border-transparent text-neutral-400 hover:text-white"
                      }`}
                    >
                      PYRAMIDE OLFACTIVE
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="min-h-[140px] text-xs leading-relaxed text-neutral-300">
                    {activeTab === "description" && (
                      <p className="font-sans leading-relaxed tracking-wide">
                        {perfume.description}
                      </p>
                    )}

                    {activeTab === "notes" && (
                      <div className="space-y-3 font-sans">
                        {/* Notes breakdown pyramid */}
                        <div className="flex gap-4 p-2 bg-[#0e0e0e] border border-neutral-900 rounded">
                          <Feather className={`w-4 h-4 flex-shrink-0 mt-0.5 ${accentColorClass}`} />
                          <div>
                            <span className="text-[10px] uppercase font-serif tracking-wide text-neutral-500 block">
                              Notes de Tête (les premières impressions)
                            </span>
                            <span className="text-white text-xs font-semibold">
                              {perfume.topNotes?.join(", ") || perfume.notes.slice(0, 2).join(", ")}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-4 p-2 bg-[#0e0e0e] border border-neutral-900 rounded">
                          <Flame className={`w-4 h-4 flex-shrink-0 mt-0.5 ${accentColorClass}`} />
                          <div>
                            <span className="text-[10px] uppercase font-serif tracking-wide text-neutral-500 block">
                              Notes de Cœur (l'âme du parfum)
                            </span>
                            <span className="text-white text-xs font-semibold">
                              {perfume.heartNotes?.join(", ") || perfume.notes.slice(1, 3).join(", ")}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-4 p-2 bg-[#0e0e0e] border border-neutral-900 rounded">
                          <Sparkles className={`w-4 h-4 flex-shrink-0 mt-0.5 ${accentColorClass}`} />
                          <div>
                            <span className="text-[10px] uppercase font-serif tracking-wide text-neutral-500 block">
                              Notes de Fond (le sillage persistant)
                            </span>
                            <span className="text-white text-xs font-semibold">
                              {perfume.baseNotes?.join(", ") || perfume.notes.slice(2, 5).join(", ")}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "accords" && perfume.accords && (
                      <div className="space-y-2 mt-1">
                        <span className="text-[10.5px] uppercase font-medium text-neutral-400 mb-2.5 block tracking-widest text-center font-serif">
                          notes (accords principaux)
                        </span>
                        <div className="space-y-2">
                          {perfume.accords.map((accord, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between items-center text-[10px] text-neutral-400 capitalize px-1 font-mono">
                                <span className="tracking-wider">{accord.name}</span>
                                <span>{accord.value}%</span>
                              </div>
                              <div className="w-full bg-neutral-900/50 h-6.5 rounded overflow-hidden border border-neutral-900 flex">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${accord.value}%` }}
                                  transition={{ type: "spring", stiffness: 45, delay: idx * 0.05 }}
                                  style={{ backgroundColor: accord.color }}
                                  className="h-full flex items-center px-3"
                                >
                                  <span className="text-black font-extrabold text-[9px] tracking-widest uppercase truncate select-none">
                                    {accord.name}
                                  </span>
                                </motion.div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="mt-6 flex flex-col gap-3">
                  <button
                    id="add-to-bag-detail-btn"
                    onClick={handleAdd}
                    className={`w-full py-4 text-xs font-bold font-serif tracking-widest uppercase rounded shadow-lg ${accentRingGlow} text-black font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] ${accentBgClass}`}
                  >
                    {added ? (
                      <>
                        <Check className="w-4 h-4" /> AJOUTÉ AU PANIER
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" /> AJOUTER AU PANIER · {selectedPrice}€
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-neutral-500">
                    Livraison offerte dès 150€ · Retours gratuits sous 14 jours
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
