import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Lock, ShieldCheck, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";

interface AdminGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminGateModal({ isOpen, onClose, onSuccess }: AdminGateModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate email & credentials securely
    if (email.toLowerCase() === "admin@luxora.fr" && password === "admin123") {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        onSuccess();
        onClose();
        setEmail("");
        setPassword("");
      }, 1000);
    } else {
      setError("Identifiants administratifs incorrects. Accès refusé.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#000000]/95 z-[70] backdrop-blur-md"
          />

          {/* Dialog Container */}
          <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-[#090909] border border-neutral-800 rounded-xl p-8 text-white shadow-2xl relative"
            >
              {/* Gold glow top spotlight */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-[#D4AF37]/5 filter blur-3xl pointer-events-none" />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-neutral-900 text-neutral-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-neutral-950 border border-neutral-800/80 flex items-center justify-center mx-auto text-[#D4AF37] shadow-lg shadow-black">
                  <Lock className="w-6 h-6 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] tracking-[0.3em] font-serif font-bold text-[#D4AF37] uppercase block">
                    Secured Back-Office Access
                  </span>
                  <h3 className="text-xl font-serif tracking-widest text-[#E5E5E5] uppercase font-bold">
                    PORTAIL DE SÉCURITÉ
                  </h3>
                  <p className="text-[11px] text-neutral-500 max-w-xs mx-auto leading-relaxed">
                    Saisissez vos clés de console pour administrer le catalogue et gérer le flux logistique DHL.
                  </p>
                </div>
              </div>

              {/* Form entries */}
              <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-xs font-sans">
                {error && (
                  <div className="p-3 bg-red-950/25 border border-red-900/40 rounded flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-neutral-400 tracking-wider">Identifiant Admin (Email)</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@luxora.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-[#D4AF37] transition font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-400 tracking-wider">Mot de Passe Admin</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 pr-10 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-[#D4AF37] transition font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-500 hover:text-neutral-300 rounded"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#D4AF37] hover:bg-[#F3CD4F] disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-serif font-bold text-xs py-3.5 px-4 tracking-widest uppercase rounded transition duration-200 mt-6 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/5"
                >
                  {isLoading ? "Authentification..." : "Déverrouiller la Console"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Development Mode Helper Tip */}
              <div className="mt-6 p-3.5 bg-neutral-950 border border-neutral-900/80 rounded-lg flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <div className="text-[10px] text-neutral-500 leading-normal">
                  <span className="text-neutral-300 font-bold block mb-0.5">Note de Développement :</span>
                  Identifiants démo autorisés : <span className="font-mono text-white">admin@luxora.fr</span> et mot de passe <span className="font-mono text-white">admin123</span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
