import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Lock, Mail, User, Check, ArrowRight, ShieldCheck, Heart } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isNewsletter, setIsNewsletter] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitted(true);
    setTimeout(() => {
      onSuccess(email);
      setIsSubmitted(false);
      setEmail("");
      setPassword("");
      setFullName("");
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            id="auth-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#000000]/90 z-50 backdrop-blur-xs"
          />

          {/* Modal */}
          <div 
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div
              id="auth-modal-panel"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.4, type: "spring" }}
              className="relative w-full max-w-md bg-[#0d0d0d] border border-neutral-800 rounded-xl overflow-hidden shadow-2xl p-8 text-white text-left cursor-default"
            >
              {/* Background amber lights */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-[#D4AF37]/5 filter blur-2xl pointer-events-none" />

              {/* Close Button */}
              <button
                id="close-auth-btn"
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 hover:bg-neutral-900 rounded-full transition duration-150 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content representation */}
              {isSubmitted ? (
                <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring" }}
                    className="w-12 h-12 rounded-full border border-[#D4AF37]/40 bg-[#121212] flex items-center justify-center text-[#D4AF37]"
                  >
                    <Check className="w-6 h-6" />
                  </motion.div>
                  <h3 className="font-serif tracking-widest text-lg uppercase">
                    {isLogin ? "CONEXION RÉUSSIE" : "INSCRIPTION APPROUVÉE"}
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-xs leading-relaxed font-sans">
                    Bienvenue dans la maison de haute parfumerie Luxora. L'élégance suprême vous accompagne.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Title Header */}
                  <div className="text-center space-y-1.5">
                    <span className="font-serif tracking-[0.4em] text-xs font-bold text-[#D4AF37]">
                      LUXORA
                    </span>
                    <h3 className="text-xl font-serif tracking-widest text-[#f5f5f5] uppercase">
                      {isLogin ? "SE CONNECTER" : "REJOINDRE LE CLUB"}
                    </h3>
                    <p className="text-[11px] text-neutral-500 max-w-xs mx-auto leading-relaxed font-sans">
                      {isLogin
                        ? "Entrez vos identifiants pour accéder à votre espace membre."
                        : "Inscrivez-vous pour bénéficier des avantages exclusifs du Club Privé Luxora."}
                    </p>
                  </div>

                  {/* Tab menu */}
                  <div className="grid grid-cols-2 border-b border-neutral-900 text-xs font-serif font-semibold tracking-widest">
                    <button
                      id="auth-tab-login-btn"
                      onClick={() => setIsLogin(true)}
                      className={`pb-3 text-center transition duration-200 ${
                        isLogin ? "border-b-2 border-[#D4AF37] text-white" : "text-neutral-500 hover:text-white"
                      }`}
                    >
                      CONNEXION
                    </button>
                    <button
                      id="auth-tab-register-btn"
                      onClick={() => setIsLogin(false)}
                      className={`pb-3 text-center transition duration-200 ${
                        !isLogin ? "border-b-2 border-[#D4AF37] text-white" : "text-neutral-500 hover:text-white"
                      }`}
                    >
                      INSCRIPTION
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
                    {!isLogin && (
                      <div className="space-y-1.5">
                        <label className="text-neutral-400 tracking-wider">Nom complet et civilité</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
                          <input
                            id="auth-register-name-input"
                            type="text"
                            required
                            placeholder="M. Sébastien Laurent"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded py-3 pl-11 pr-4 focus:border-[#D4AF37] text-white placeholder-neutral-700 outline-none transition duration-200"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-neutral-400 tracking-wider">Adresse Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
                        <input
                          id="auth-email-input"
                          type="email"
                          required
                          placeholder="client.elite@luxora.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded py-3 pl-11 pr-4 focus:border-[#D4AF37] text-white placeholder-neutral-700 outline-none transition duration-200"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <label className="text-neutral-400 tracking-wider">Mot de passe</label>
                        {isLogin && (
                          <button
                            id="auth-forgot-password-btn"
                            type="button"
                            className="text-[#D4AF37] hover:text-[#F3CD4F] font-medium transition duration-200 text-[10px]"
                          >
                            Mot de passe oublié ?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
                        <input
                          id="auth-password-input"
                          type="password"
                          required
                          placeholder="••••••••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded py-3 pl-11 pr-4 focus:border-[#D4AF37] text-white placeholder-neutral-700 outline-none transition duration-200"
                        />
                      </div>
                    </div>

                    {!isLogin && (
                      <div className="pt-2 flex items-start gap-2.5">
                        <input
                          id="auth-newsletter-checkbox"
                          type="checkbox"
                          checked={isNewsletter}
                          onChange={(e) => setIsNewsletter(e.target.checked)}
                          className="mt-0.5 rounded border-neutral-800 bg-neutral-950 text-[#D4AF37] checked:bg-[#D4AF37] focus:ring-0 cursor-pointer"
                        />
                        <span className="text-[10px] text-neutral-500 leading-relaxed">
                          Je souhaite m'abonner au magazine digital de Luxora et recevoir des invitations prioritaires aux avant-premières.
                        </span>
                      </div>
                    )}

                    <button
                      id="auth-submit-btn"
                      type="submit"
                      className="w-full mt-4 bg-[#D4AF37] hover:bg-[#F3CD4F] text-black font-serif font-bold py-3 px-4 rounded tracking-widest uppercase transition duration-300 flex items-center justify-center gap-2"
                    >
                      {isLogin ? "SE CONNECTER" : "S'INSCRIRE ET ADHÉRER"}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  {/* Footnote advantages */}
                  <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-lg flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-[#D4AF37] flex-shrink-0" />
                    <div className="text-[10px] text-neutral-500 leading-normal">
                      <span className="text-white font-semibold font-serif block">AVANTAGES CLIENT ÉLITE</span>
                      Livraison express gratuite automatique, accès illimité au catalogue de fragrances secrètes et 1 échantillon offert supplémentaire.
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
