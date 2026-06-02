import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, ShoppingBag, Eye, Star, Compass } from "lucide-react";
import { PERFUMES_DB, Perfume } from "../data";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (perfume: Perfume) => void;
  allPerfumes?: Perfume[];
}

export default function SearchModal({
  isOpen,
  onClose,
  onSelectProduct,
  allPerfumes
}: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"Tous" | "Homme" | "Femme" | "Unisexe">("Tous");

  const popularSearches = ["Vanille", "Cerise", "Thé Noir", "Armani", "Valentino", "Louis Vuitton"];

  const perfumeSource = allPerfumes || PERFUMES_DB;

  const filteredPerfumes = perfumeSource.filter((perfume) => {
    const matchesSearch =
      perfume.name.toLowerCase().includes(query.toLowerCase()) ||
      perfume.brand.toLowerCase().includes(query.toLowerCase()) ||
      perfume.notes.some((note) => note.toLowerCase().includes(query.toLowerCase())) ||
      perfume.description.toLowerCase().includes(query.toLowerCase());

    const matchesCategory = activeCategory === "Tous" || perfume.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const handleSuggestionClick = (searchWord: string) => {
    setQuery(searchWord);
  };

  const handleProductClick = (perfume: Perfume) => {
    onSelectProduct(perfume);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            id="search-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#000000]/95 z-50 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            id="search-overlay"
            initial={{ opacity: 0, scale: 1.02, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: -20 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-50 flex flex-col justify-start items-center pt-20 px-6 sm:px-12 md:px-24 cursor-pointer"
          >
            {/* Inner Content Area */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl flex flex-col h-[80vh] cursor-default"
            >
              {/* Header search bar */}
              <div className="relative border-b border-neutral-800 pb-4 flex items-center gap-4">
                <Search className="w-6 h-6 text-[#D4AF37]" />
                <input
                  id="search-input-field"
                  autoFocus
                  type="text"
                  placeholder="Rechercher par parfum, marque, ingrédients (vanille, agrumes...)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none text-white placeholder-neutral-500 font-sans focus:outline-hidden text-lg md:text-xl tracking-wide"
                />
                <button
                  id="search-close-top-btn"
                  onClick={onClose}
                  className="p-1.5 hover:bg-neutral-900 rounded-full transition duration-150 text-neutral-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Suggestions */}
              {query.length === 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-neutral-500 mr-2 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5" /> RECHERCHES TENDANCES :
                  </span>
                  {popularSearches.map((word) => (
                    <button
                      key={word}
                      id={`search-suggestion-${word}`}
                      onClick={() => handleSuggestionClick(word)}
                      className="bg-neutral-900 hover:bg-[#D4AF37]/10 border border-neutral-800 hover:border-[#D4AF37]/40 text-neutral-300 hover:text-[#D4AF37] py-1.5 px-3 rounded-full transition duration-300"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              )}

              {/* Filter pills */}
              <div className="mt-8 flex gap-2 border-b border-neutral-900 pb-3">
                {(["Tous", "Homme", "Femme", "Unisexe"] as const).map((cat) => (
                  <button
                    key={cat}
                    id={`search-pill-${cat}`}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs transition duration-300 ${
                      activeCategory === cat
                        ? "bg-[#D4AF37] text-black font-semibold"
                        : "bg-neutral-950 text-neutral-400 border border-neutral-800 hover:border-neutral-700 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Results Area */}
              <div className="flex-1 overflow-y-auto mt-6 pr-2 space-y-4">
                {filteredPerfumes.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-center">
                    <p className="text-neutral-500 text-sm">
                      Aucune fragrance ne correspond à votre recherche "{query}".
                    </p>
                    <button
                      id="search-reset-btn"
                      onClick={() => {
                        setQuery("");
                        setActiveCategory("Tous");
                      }}
                      className="mt-4 text-xs text-[#D4AF37] underline hover:text-[#F3CD4F]"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredPerfumes.map((perfume) => (
                      <div
                        key={perfume.id}
                        onClick={() => handleProductClick(perfume)}
                        className="flex items-center gap-4 bg-neutral-950 hover:bg-[#111] p-3 rounded-lg border border-neutral-900 hover:border-neutral-800 transition duration-300 cursor-pointer group"
                      >
                        {/* Thumbnail */}
                        <div className="w-16 h-16 bg-neutral-900 rounded-md flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                          {/* Accent light indicator for category */}
                          <div className={`absolute inset-0 opacity-10 filter blur-xs ${
                            perfume.theme === 'pink' ? 'bg-[#E0115F]' :
                            perfume.theme === 'blue' ? 'bg-[#00F0FF]' : 'bg-[#D4AF37]'
                          }`} />
                          <img
                            src={perfume.image}
                            alt={perfume.name}
                            className="w-12 h-12 object-contain relative z-10 transition duration-300 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold block">
                            {perfume.brand}
                          </span>
                          <h4 className="text-sm font-medium tracking-wide text-white font-serif line-clamp-1 group-hover:text-[#D4AF37] transition duration-200">
                            {perfume.name}
                          </h4>
                          <span className="text-xs text-[#D4AF37] font-semibold mt-1 block">
                            Dès {perfume.price}€
                          </span>
                        </div>

                        {/* Hover Action */}
                        <div className="p-2 rounded-full border border-neutral-900 group-hover:border-neutral-800 bg-neutral-950 group-hover:bg-neutral-900 transition-all duration-300 opacity-60 group-hover:opacity-100">
                          <Eye className="w-4 h-4 text-neutral-400 group-hover:text-[#D4AF37]" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
