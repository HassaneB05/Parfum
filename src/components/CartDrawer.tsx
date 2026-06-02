import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Trash2, Plus, Minus, ShoppingBag, ShieldCheck, Truck, ArrowLeft, CreditCard, Loader } from "lucide-react";
import { Perfume } from "../data";

interface CartItem {
  perfume: Perfume;
  selectedSize: string;
  selectedPrice: number;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (index: number, change: number) => void;
  onRemoveItem: (index: number) => void;
  onCheckout: (order: any) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: CartDrawerProps) {
  const [step, setStep] = useState<"cart" | "shipping">("cart");
  
  // Shipping Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState("");

  const subtotal = cartItems.reduce((acc, item) => acc + item.selectedPrice * item.quantity, 0);
  const freeShippingThreshold = 150;
  const progressToFreeShipping = Math.min((subtotal / freeShippingThreshold) * 100, 100);
  const remainingForFreeShipping = freeShippingThreshold - subtotal;
  const shippingCost = subtotal >= freeShippingThreshold ? 0 : 15;
  const total = subtotal + shippingCost;

  // Reset step on close
  useEffect(() => {
    if (!isOpen) {
      setStep("cart");
      setError("");
    }
  }, [isOpen]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim() || !city.trim() || !zipCode.trim()) {
      setError("Veuillez remplir tous les champs requis.");
      return;
    }
    
    setIsPlacing(true);
    setError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            address: address.trim(),
            city: city.trim(),
            zipCode: zipCode.trim()
          },
          items: cartItems,
          subtotal,
          shipping: shippingCost,
          total
        })
      });

      const data = await response.json();
      if (data.success) {
        // Reset form
        setName("");
        setEmail("");
        setPhone("");
        setAddress("");
        setCity("");
        setZipCode("");
        // Trigger checkout success modal and clear cart
        onCheckout(data.order);
      } else {
        setError(data.error || "Une erreur est survenue lors de l'enregistrement de votre commande.");
      }
    } catch (err) {
      console.error("Error creating order:", err);
      setError("Impossible de contacter le serveur de commande.");
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            id="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50 backdrop-blur-xs"
          />

          {/* Drawer Panel */}
          <motion.div
            id="cart-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0e0e0e] border-l border-neutral-800 text-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {step === "shipping" ? (
                  <button
                    onClick={() => setStep("cart")}
                    className="p-1 px-[7px] hover:bg-neutral-800 rounded transition duration-200 text-neutral-400 hover:text-white mr-1"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
                  </button>
                ) : (
                  <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
                )}
                <h3 className="font-serif tracking-widest text-lg">
                  {step === "shipping" ? "LIVRAISON" : "VOTRE PANIER"}
                </h3>
                {step === "cart" && (
                  <span className="text-xs bg-[#2a2417] text-[#D4AF37] px-2.5 py-0.5 rounded-full font-serif font-bold">
                    {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                )}
              </div>
              <button
                id="close-cart-btn"
                onClick={onClose}
                className="p-1 px-[7px] hover:bg-neutral-800 rounded transition duration-200 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Progress (only in cart review) */}
            {step === "cart" && subtotal > 0 && (
              <div className="p-4 bg-[#141414] border-b border-neutral-800 px-6">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-neutral-400 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {remainingForFreeShipping > 0
                      ? `Plus que ${remainingForFreeShipping}€ pour la livraison offerte`
                      : "Félicitations ! Livraison standard offerte"}
                  </span>
                  <span className="font-bold text-[#D4AF37]">{freeShippingThreshold}€</span>
                </div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#D4AF37] transition-all duration-300"
                    style={{ width: `${progressToFreeShipping}%` }}
                  />
                </div>
              </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {step === "cart" ? (
                /* STEP 1: CART LIST */
                cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4">
                      <ShoppingBag className="w-6 h-6 text-neutral-600" />
                    </div>
                    <h4 className="font-serif tracking-wider text-neutral-300 mb-2">VOTRE PANIER EST VIDE</h4>
                    <p className="text-sm text-neutral-500 max-w-xs">
                      Parcourez nos collections et découvrez des parfums de luxe d'exception.
                    </p>
                    <button
                      id="back-to-shop"
                      onClick={onClose}
                      className="mt-6 border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 transition duration-300 text-xs tracking-widest uppercase py-3 px-6 rounded font-sans font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform"
                    >
                      Découvrir la Collection
                    </button>
                  </div>
                ) : (
                  cartItems.map((item, index) => (
                    <motion.div
                      key={`${item.perfume.id}-${item.selectedSize}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex bg-[#121212] p-3 rounded-lg border border-neutral-800/80 hover:border-neutral-700/80 transition duration-300 gap-4"
                    >
                      {/* Item Image */}
                      <div className="w-20 h-20 bg-neutral-900/50 rounded flex-shrink-0 relative overflow-hidden border border-neutral-800">
                        {item.perfume.image.startsWith("http") ? (
                          <img
                            src={item.perfume.image}
                            alt={item.perfume.name}
                            className="w-full h-full object-cover object-center"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-neutral-950 flex items-center justify-center relative">
                            <div className={`absolute inset-0 opacity-20 filter blur-xs ${
                              item.perfume.theme === 'pink' ? 'bg-[#E0115F]' :
                              item.perfume.theme === 'blue' ? 'bg-[#00F0FF]' : 'bg-[#D4AF37]'
                            }`} />
                            <img
                              src={item.perfume.image}
                              alt={item.perfume.name}
                              className="w-16 h-16 object-contain z-10"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
                                {item.perfume.brand}
                              </span>
                              <h4 className="text-sm font-medium tracking-wide text-white font-serif line-clamp-1">
                                {item.perfume.name}
                              </h4>
                            </div>
                            <button
                              id={`remove-item-${index}`}
                              onClick={() => onRemoveItem(index)}
                              className="text-neutral-500 hover:text-red-500 p-1 transition duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-xs text-[#D4AF37]/90 mt-1 block font-serif">
                            Format: {item.selectedSize}
                          </span>
                        </div>

                        {/* Quantity & Pricing details */}
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center space-x-1.5 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5">
                            <button
                              id={`qty-minus-${index}`}
                              disabled={item.quantity <= 1}
                              onClick={() => onUpdateQuantity(index, -1)}
                              className="p-1 hover:text-[#D4AF37] disabled:opacity-40 transition duration-150"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs px-2 w-4 text-center font-bold">
                              {item.quantity}
                            </span>
                            <button
                              id={`qty-plus-${index}`}
                              onClick={() => onUpdateQuantity(index, 1)}
                              className="p-1 hover:text-[#D4AF37] transition duration-150"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-sm font-serif font-medium text-neutral-200">
                            {item.selectedPrice * item.quantity}€
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )
              ) : (
                /* STEP 2: SHIPPING FORM */
                <form id="shipping-details-form" onSubmit={handleSubmitOrder} className="space-y-4 pt-2">
                  <div className="text-center pb-2">
                    <p className="text-xs text-neutral-400 font-sans">
                      Pour finaliser l'achat de vos pièces de luxe, complétez vos coordonnées de livraison par DHL Express.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-950/20 border border-red-900/40 rounded text-red-400 text-xs font-sans">
                      {error}
                    </div>
                  )}

                  <div className="space-y-3 font-sans">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-neutral-400 mb-1 font-semibold">Nom & Prénom *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ex: Jean Dupont"
                        className="w-full bg-[#121212] border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-neutral-400 mb-1 font-semibold">Adresse Email *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ex: jean.dupont@gmail.com"
                        className="w-full bg-[#121212] border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-neutral-400 mb-1 font-semibold">Numéro de Téléphone *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="ex: +33 6 12 34 56 78"
                        className="w-full bg-[#121212] border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-neutral-400 mb-1 font-semibold">Adresse Résidence/Rue *</label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="ex: 14 Avenue des Champs-Élysées"
                        className="w-full bg-[#121212] border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-neutral-400 mb-1 font-semibold">Ville *</label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="ex: Paris"
                          className="w-full bg-[#121212] border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-neutral-400 mb-1 font-semibold">Code Postal *</label>
                        <input
                          type="text"
                          required
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          placeholder="ex: 75008"
                          className="w-full bg-[#121212] border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#D4AF37] transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-800/60 mt-4">
                    <div className="flex items-center gap-2 text-[10px] text-[#D4AF37] justify-center bg-[#1c1a12]/50 py-2.5 rounded border border-[#D4AF37]/10">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Mode Démo : Paiement validé automatiquement</span>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Footer Summary & Action buttons */}
            {cartItems.length > 0 && (
              <div className="p-6 border-t border-neutral-800 bg-[#101010]">
                {/* Summary lines */}
                <div className="space-y-2.5 mb-6 text-sm">
                  <div className="flex justify-between text-neutral-400">
                    <span>Sous-total</span>
                    <span>{subtotal}€</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Livraison standard (par DHL)</span>
                    <span>{shippingCost === 0 ? "Gratuite" : `${shippingCost}€`}</span>
                  </div>
                  <div className="pt-2.5 border-t border-neutral-800 flex justify-between text-base font-serif font-semibold">
                    <span>Total</span>
                    <span className="text-[#D4AF37] font-bold">
                      {total}€
                    </span>
                  </div>
                </div>

                {step === "cart" ? (
                  <button
                    id="checkout-trigger-btn"
                    onClick={() => setStep("shipping")}
                    className="w-full bg-[#D4AF37] hover:bg-[#F3CD4F] active:bg-[#C29F2E] text-black text-xs font-serif font-bold py-3.5 px-4 rounded tracking-widest uppercase transition duration-300 shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] transition-transform"
                  >
                    <ShoppingBag className="w-4 h-4" /> Procéder au paiement
                  </button>
                ) : (
                  <button
                    id="confirm-shipping-btn"
                    form="shipping-details-form"
                    type="submit"
                    disabled={isPlacing}
                    className="w-full bg-[#D4AF37] hover:bg-[#F3CD4F] active:bg-[#C29F2E] disabled:bg-neutral-800 disabled:text-neutral-500 text-black text-xs font-serif font-bold py-3.5 px-4 rounded tracking-widest uppercase transition duration-300 shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] transition-transform"
                  >
                    {isPlacing ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" /> Traitement sécurisé...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" /> Confirmer €{total} de commande
                      </>
                    )}
                  </button>
                )}

                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-neutral-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Paiement 100% sécurisé crypté SSL</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
