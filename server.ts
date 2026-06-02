import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Safe path helpers for CJS & ESM environments
let __filename = "";
let __dirname = "";
try {
  __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} catch (e) {
  // CommonJS fallback
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to dynamic perfumes database
const dynamicPerfumesPath = path.join(process.cwd(), "src", "dynamic_perfumes.json");

// Helper to load perfumes (combines standard static ones and custom added ones)
function getDynamicPerfumes() {
  try {
    if (fs.existsSync(dynamicPerfumesPath)) {
      const data = fs.readFileSync(dynamicPerfumesPath, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading dynamic perfumes file:", error);
  }
  return [];
}

// Helper to save perfumes
function saveDynamicPerfumes(perfumes: any[]) {
  try {
    fs.writeFileSync(dynamicPerfumesPath, JSON.stringify(perfumes, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing dynamic perfumes file:", error);
    return false;
  }
}

// Lazy initialization of Gemini client to prevent startup crashes if GEMINI_API_KEY is missing
let _ai: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!_ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined. Please verify your settings.");
    }
    _ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return _ai;
}

// Path to deleted perfume list
const deletedPerfumesPath = path.join(process.cwd(), "src", "deleted_perfume_ids.json");

// Helper to load deleted perfume IDs
function getDeletedPerfumeIds(): string[] {
  try {
    if (fs.existsSync(deletedPerfumesPath)) {
      const data = fs.readFileSync(deletedPerfumesPath, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading deleted perfumes path:", error);
  }
  return [];
}

// Helper to save deleted perfume IDs
function saveDeletedPerfumeIds(ids: string[]) {
  try {
    fs.writeFileSync(deletedPerfumesPath, JSON.stringify(ids, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing deleted perfumes path:", error);
    return false;
  }
}

// GET custom perfumes
app.get("/api/perfumes", (req, res) => {
  const dynamic = getDynamicPerfumes();
  const deletedIds = getDeletedPerfumeIds();
  res.json({ success: true, perfumes: dynamic, deletedIds });
});

// POST to save a new perfume
app.post("/api/perfumes", (req, res) => {
  const newPerfume = req.body;
  if (!newPerfume || !newPerfume.id || !newPerfume.name || !newPerfume.brand) {
    return res.status(400).json({ success: false, error: "Modèle ou marque invalide" });
  }

  const current = getDynamicPerfumes();
  // Avoid duplicates by checking id
  const index = current.findIndex((p: any) => p.id === newPerfume.id);
  if (index >= 0) {
    current[index] = newPerfume;
  } else {
    current.push(newPerfume);
  }

  const saved = saveDynamicPerfumes(current);

  // Remove is from deleted list if it is newly saved
  const deletedIds = getDeletedPerfumeIds();
  if (deletedIds.includes(newPerfume.id)) {
    const newDeleted = deletedIds.filter(id => id !== newPerfume.id);
    saveDeletedPerfumeIds(newDeleted);
  }

  res.json({ success: saved, perfume: newPerfume });
});

// DELETE a custom perfume (for admin easy cleanup & control)
app.delete("/api/perfumes/:id", (req, res) => {
  const id = req.params.id;
  
  // 1. Filter out from dynamic perfumes
  const current = getDynamicPerfumes();
  const filtered = current.filter((p: any) => p.id !== id);
  saveDynamicPerfumes(filtered);

  // 2. Track as deleted to hide standard/hardcoded perfumes
  const deletedIds = getDeletedPerfumeIds();
  if (!deletedIds.includes(id)) {
    deletedIds.push(id);
    saveDeletedPerfumeIds(deletedIds);
  }

  res.json({ success: true, deletedIds });
});

// Path to dynamic orders database
const ordersPath = path.join(process.cwd(), "src", "orders.json");

// Helper to load orders
function getOrders() {
  try {
    if (fs.existsSync(ordersPath)) {
      const data = fs.readFileSync(ordersPath, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading orders file:", error);
  }
  return [];
}

// Helper to save orders
function saveOrders(orders: any[]) {
  try {
    fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing orders file:", error);
    return false;
  }
}

// GET all orders
app.get("/api/orders", (req, res) => {
  const orders = getOrders();
  res.json({ success: true, orders });
});

// POST to create a new order
app.post("/api/orders", (req, res) => {
  const { customer, items, subtotal, shipping, total } = req.body;
  if (!customer || !customer.name || !customer.email || !items || !items.length) {
    return res.status(400).json({ success: false, error: "Informations de commande invalides" });
  }

  const orders = getOrders();
  const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder = {
    id: orderId,
    customer,
    items,
    subtotal: Number(subtotal) || 0,
    shipping: Number(shipping) || 0,
    total: Number(total) || 0,
    date: new Date().toISOString(),
    status: "En attente"
  };

  orders.unshift(newOrder); // Add to the beginning of list
  const saved = saveOrders(orders);
  res.json({ success: saved, order: newOrder });
});

// PUT to update an order status
app.put("/api/orders/:id", (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ success: false, error: "Statut manquant" });
  }

  const orders = getOrders();
  const index = orders.findIndex((o: any) => o.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Commande introuvable" });
  }

  orders[index].status = status;
  const saved = saveOrders(orders);
  res.json({ success: saved, order: orders[index] });
});

// DELETE an order
app.delete("/api/orders/:id", (req, res) => {
  const id = req.params.id;
  const orders = getOrders();
  const filtered = orders.filter((o: any) => o.id !== id);
  const saved = saveOrders(filtered);
  res.json({ success: saved });
});

const KNOWN_BRANDS_LOWER = [
  "armani", "dior", "chanel", "creed", "yves saint laurent", "ysl", "hermes", "guerlain",
  "kilian", "marly", "versace", "rabanne", "tom ford", "prada", "gaultier", "jpg", "lancome",
  "boss", "mugler", "givenchy", "montblanc", "jo malone", "byredo", "diptyque", "replica",
  "margiela", "cartier", "chloe", "l'artisan", "penhaligon", "baccarat", "kurkdjian", "rochas",
  "calvin klein", "ck", "davidoff", "azzaro", "diesel", "ralph lauren", "valentino", "balenciaga",
  "gucci", "bvlgari", "bulgari", "burberry", "kenzo", "lacoste", "nina ricci", "montale",
  "mancera", "nishane", "le labo", "van cleef", "coach", "ferragamo", "zadig", "l'occitane",
  "issey", "miyake", "joop", "roja", "xerjoff", "amouage", "initio"
];

function looksLikeGibberish(brand: string, model: string): boolean {
  const b = brand.trim().toLowerCase();
  const m = model.trim().toLowerCase();
  
  if (b.length === 0 || m.length === 0) return true;
  
  // Correctly block extremely obvious repetitive noise like "aaaaaaa"
  if (/^(.)\1{5,}$/.test(b) || /^(.)\1{5,}$/.test(m)) return true;

  return false;
}

const FAMOUS_PERFUMES: Record<string, {
  name: string;
  brand: string;
  category: "Homme" | "Femme" | "Unisexe";
  theme: "gold" | "pink" | "blue";
  description: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  image: string;
  accords: { name: string; value: number; color: string }[];
}> = {
  "sauvage": {
    name: "Sauvage",
    brand: "Dior",
    category: "Homme",
    theme: "blue",
    description: "Un sillage boisé aromatique d'une virilité noble et brute. L'éclat d'une bergamote de Calabre juteuse s'unit à la puissance sauvage de l'ambroxan et du poivre de Sichuan, évoquant un désert de roche baigné par le crépuscule.",
    topNotes: ["Bergamote de Calabre", "Poivre du Sichuan", "Poivre de Sichuan"],
    heartNotes: ["Lavande de Provence", "Patchouli d'Indonésie", "Géranium d'Égypte", "Élémi"],
    baseNotes: ["Ambroxan précieux", "Cèdre de l'Atlas", "Ladanum d'Espagne"],
    image: "https://fimgs.net/images/perfume/375x500.31861.jpg",
    accords: [
      { name: "frais épicé", value: 100, color: "#76933c" },
      { name: "agrume", value: 90, color: "#e5c158" },
      { name: "ambre", value: 85, color: "#aa7c11" },
      { name: "boisé", value: 80, color: "#825d38" },
      { name: "aromatique", value: 75, color: "#2d7a75" },
      { name: "musqué", value: 60, color: "#b5a494" }
    ]
  },
  "bleu de chanel": {
    name: "Bleu de Chanel",
    brand: "Chanel",
    category: "Homme",
    theme: "blue",
    description: "Éloge de la liberté masculine dans un sillage boisé aromatique captivant. Une fraîcheur tonique d'agrumes qui s'épanouit dans un accord chaleureux de cèdre de l'Atlas et d’encens mystique, affirmant une élégance indomptable.",
    topNotes: ["Pamplemousse vif", "Citron d'Italie", "Menthe Froissée", "Baies de Rose"],
    heartNotes: ["Gingembre du Nigeria", "Noix de Muscade", "Jasmin", "Melon"],
    baseNotes: ["Encens d'Oman", "Bois de Santal précieux", "Cèdre majestueux", "Ambre", "Patchouli"],
    image: "https://fimgs.net/images/perfume/375x500.25967.jpg",
    accords: [
      { name: "agrume", value: 100, color: "#e5c158" },
      { name: "boisé", value: 90, color: "#825d38" },
      { name: "frais épicé", value: 80, color: "#76933c" },
      { name: "aromatique", value: 75, color: "#2d7a75" },
      { name: "frais", value: 70, color: "#4facc8" },
      { name: "ambre", value: 65, color: "#aa7c11" }
    ]
  },
  "aventus": {
    name: "Aventus",
    brand: "Creed",
    category: "Homme",
    theme: "gold",
    description: "L’incarnation ultime du triomphe et de l'assurance masculine. Une harmonie royale aux accords d'ananas fruité fumé par le bois d'un bouleau grillé d'exception et la richesse de la mousse de chêne chic.",
    topNotes: ["Ananas Royal", "Cassis noir", "Pomme verte", "Bergamote"],
    heartNotes: ["Bouleau de Finlande", "Patchouli d'Indonésie", "Rose marocaine", "Jasmin de Grasse"],
    baseNotes: ["Mousse de Chêne", "Ambre gris précieux", "Vanille fine", "Musc blanc"],
    image: "https://fimgs.net/images/perfume/375x500.9828.jpg",
    accords: [
      { name: "fruité", value: 100, color: "#a93f55" },
      { name: "boisé", value: 90, color: "#825d38" },
      { name: "frais", value: 85, color: "#4facc8" },
      { name: "aromatique", value: 75, color: "#2d7a75" },
      { name: "musqué", value: 70, color: "#b5a494" }
    ]
  },
  "black opium": {
    name: "Black Opium",
    brand: "Yves Saint Laurent",
    category: "Femme",
    theme: "pink",
    description: "Un shot d'adrénaline au cœur d'une nuit électrique. Le contraste de l'intensité addictive du café noir, de l'éclat sensuel des fleurs blanches de jasmin et de l'enveloppement chaud d'une vanille gourmande.",
    topNotes: ["Poire juteuse", "Fleur d'Oranger", "Poivre Rose"],
    heartNotes: ["Café noir énergique", "Jasmin d'Arabie", "Amande amère", "Réglisse"],
    baseNotes: ["Vanille de Madagascar", "Patchouli velouté", "Cèdre blanc", "Bois de Cachemire"],
    image: "https://fimgs.net/images/perfume/375x500.25319.jpg",
    accords: [
      { name: "vanille", value: 100, color: "#cfb980" },
      { name: "café", value: 95, color: "#4b382a" },
      { name: "sucré", value: 90, color: "#bc517c" },
      { name: "chaud épicé", value: 80, color: "#b35a20" },
      { name: "fleurs blanches", value: 75, color: "#ded9ca" }
    ]
  },
  "libre": {
    name: "Libre",
    brand: "Yves Saint Laurent",
    category: "Femme",
    theme: "pink",
    description: "Le parfum de la liberté sans limites. La tension audacieuse d'une lavande de France historiquement masculine réécrite au féminin, fusionnée avec la sensualité brûlante de la fleur d'oranger du Maroc.",
    topNotes: ["Lavande de France", "Mandarine d'Italie", "Cassis", "Petit-grain"],
    heartNotes: ["Lavande", "Fleur d'Oranger du Maroc", "Jasmin Sambac"],
    baseNotes: ["Vanille de Madagascar", "Ambre gris minéral", "Musc blanc", "Cèdre blanc"],
    image: "https://fimgs.net/images/perfume/375x500.56306.jpg",
    accords: [
      { name: "fleurs blanches", value: 100, color: "#ded9ca" },
      { name: "aromatique", value: 95, color: "#2d7a75" },
      { name: "agrume", value: 90, color: "#e5c158" },
      { name: "vanille", value: 85, color: "#cfb980" },
      { name: "poudré", value: 75, color: "#caa7bc" }
    ]
  },
  "baccarat": {
    name: "Baccarat Rouge 540",
    brand: "Maison Francis Kurkdjian",
    category: "Unisexe",
    theme: "blue",
    description: "Une signature olfactive hautement poétique, aérienne et intensément concentrée. Un sillage minéral ambré et boisé unique où les notes de safran précieux et de jasmin embrasent un cœur d'ambre gris majestueux.",
    topNotes: ["Safran précieux d'Orient", "Jasmin de Grasse"],
    heartNotes: ["Bois d'Ambre", "Ambre gris minéral"],
    baseNotes: ["Résine de Sapin", "Bois de Cèdre poli"],
    image: "https://fimgs.net/images/perfume/375x500.33531.jpg",
    accords: [
      { name: "boisé", value: 100, color: "#825d38" },
      { name: "ambre", value: 95, color: "#aa7c11" },
      { name: "chaud épicé", value: 90, color: "#b35a20" },
      { name: "aromatique", value: 80, color: "#2d7a75" },
      { name: "sucré", value: 75, color: "#bc517c" }
    ]
  },
  "delina": {
    name: "Delina",
    brand: "Parfums de Marly",
    category: "Femme",
    theme: "pink",
    description: "Un bouquet floral sculpté, ode à une féminité royale et poudrée. La rose de Turquie s'exprime avec une sensualité magique, mêlée aux accents fruités de litchi et à la gourmandise de la vanille.",
    topNotes: ["Litchi de Chine", "Rhubarbe sauvage", "Bergamote d'Italie", "Noix de Muscade"],
    heartNotes: ["Rose de Turquie précieuse", "Pivoine printanière", "Pétales de Fleur", "Musc"],
    baseNotes: ["Vanille Bourbon", "Cashmeran", "Bois de Cèdre", "Encens d'Oman"],
    image: "https://fimgs.net/images/perfume/375x500.43093.jpg",
    accords: [
      { name: "rose", value: 100, color: "#e39bbb" },
      { name: "floral", value: 95, color: "#e39bbb" },
      { name: "fruité", value: 90, color: "#a93f55" },
      { name: "frais", value: 80, color: "#4facc8" },
      { name: "poudré", value: 75, color: "#caa7bc" }
    ]
  },
  "herm": {
    name: "Terre d'Hermès",
    brand: "Hermès",
    category: "Homme",
    theme: "gold",
    description: "Une métaphore olfactive reliant l'homme à ses origines terrestres. Un sillage vertical boisé et minéral, où l'éclat de l'orange de Sicile puise sa force dans un accord vibrant de silex et de cèdre noble.",
    topNotes: ["Orange amère de Sicile", "Pamplemousse vif"],
    heartNotes: ["Poivre noir", "Silex minéral", "Géranium"],
    baseNotes: ["Vétiver d'Haïti précieux", "Bois de Cèdre blanc", "Patchouli d'Indonésie", "Benjoin"],
    image: "https://fimgs.net/images/perfume/375x500.17.jpg",
    accords: [
      { name: "agrume", value: 100, color: "#e5c158" },
      { name: "boisé", value: 95, color: "#825d38" },
      { name: "frais épicé", value: 85, color: "#76933c" },
      { name: "aromatique", value: 80, color: "#2d7a75" },
      { name: "minéral", value: 75, color: "#7e8082" }
    ]
  },
  "la nuit de l'homme": {
    name: "La Nuit de l'Homme",
    brand: "Yves Saint Laurent",
    category: "Homme",
    theme: "gold",
    description: "Un oriental boisé d'une séduction ténébreuse et magnétique. La fraîcheur épicée de la cardamome s'unit à la douceur de la lavande et la force du cèdre pour créer un sillage de mystère.",
    topNotes: ["Cardamome noire", "Bergamote de Calabre"],
    heartNotes: ["Cèdre de Virginie", "Lavande de Grasse"],
    baseNotes: ["Vétiver d'Haïti", "Carvi", "Coumarine"],
    image: "https://fimgs.net/images/perfume/375x500.5521.jpg",
    accords: [
      { name: "chaud épicé", value: 100, color: "#b35a20" },
      { name: "aromatique", value: 85, color: "#2d7a75" },
      { name: "boisé", value: 80, color: "#825d38" },
      { name: "poudré", value: 70, color: "#caa7bc" },
      { name: "frais", value: 65, color: "#4facc8" }
    ]
  },
  "angels share": {
    name: "Angels' Share",
    brand: "Kilian",
    category: "Unisexe",
    theme: "gold",
    description: "Une création divine inspirée des caves de spiritueux de la prestigieuse maison Hennessy. L’essence pure du cognac d'exception mariée à la cannelle de Ceylan et aux douceurs boisées et pralinées.",
    topNotes: ["Cognac d'Exception"],
    heartNotes: ["Cannelle de Ceylan", "Fève de Tonka liquoreuse", "Bois de Chêne"],
    baseNotes: ["Praline fondante", "Vanille Bourbon", "Bois de Santal crémeux"],
    image: "https://fimgs.net/images/perfume/375x500.62615.jpg",
    accords: [
      { name: "boisé", value: 100, color: "#825d38" },
      { name: "sucré", value: 95, color: "#bc517c" },
      { name: "chaud épicé", value: 90, color: "#b35a20" },
      { name: "ambre", value: 85, color: "#aa7c11" },
      { name: "vanille", value: 80, color: "#cfb980" }
    ]
  },
  "shalimar": {
    name: "Shalimar",
    brand: "Guerlain",
    category: "Femme",
    theme: "pink",
    description: "Inspiré par l’histoire d'amour passionnée entre un empereur et une princesse indienne, Shalimar, qui signifie 'demeure de l'amour' en sanskrit, est le premier parfum oriental de l’histoire.",
    topNotes: ["Agrumes", "Bergamote de Calabre", "Citron de Sicile", "Mandarine"],
    heartNotes: ["Iris de Florence", "Jasmin de Grasse", "Rose de Mai", "Vétiver"],
    baseNotes: ["Vanille de Madagascar", "Encens Sacré", "Cuir", "Fève de Tonka", "Santal"],
    image: "https://fimgs.net/images/perfume/375x500.53.jpg",
    accords: [
      { name: "ambre", value: 100, color: "#aa7c11" },
      { name: "vanille", value: 95, color: "#cfb980" },
      { name: "agrume", value: 90, color: "#e5c158" },
      { name: "boisé", value: 80, color: "#825d38" },
      { name: "poudré", value: 75, color: "#caa7bc" }
    ]
  },
  "j'adore": {
    name: "J'adore",
    brand: "Dior",
    category: "Femme",
    theme: "pink",
    description: "Une fragrance florale iconique, infiniment féminine et lumineuse. Un bouquet sur mesure, mariant le jasmin d'Espagne et l'essence d'ylang-ylang avec la rose de Damas, sculptant un sillage voluptueux d'or liquide.",
    topNotes: ["Poire d'Anjou", "Melon mûr", "Pêche veloutée", "Mandarine"],
    heartNotes: ["Jasmin Sambac", "Muguet sauvage", "Tuberose d'Inde", "Rose de Damas"],
    baseNotes: ["Musc blanc", "Vanille fine", "Mûre sauvage", "Cèdre"],
    image: "https://fimgs.net/images/perfume/375x500.97.jpg",
    accords: [
      { name: "floral", value: 100, color: "#e39bbb" },
      { name: "fleurs blanches", value: 95, color: "#ded9ca" },
      { name: "fruité", value: 85, color: "#a93f55" },
      { name: "frais", value: 75, color: "#4facc8" },
      { name: "sucré", value: 70, color: "#bc517c" }
    ]
  },
  "le male": {
    name: "Le Male",
    brand: "Jean Paul Gaultier",
    category: "Homme",
    theme: "blue",
    description: "Aussi viril que sexy, un hommage à la figure rassurante et iconique du marin. Un parfum au sillage anticonformiste où la fraîcheur brute de la lavande et de la menthe s'allie à la sensualité d'une vanille rassurante.",
    topNotes: ["Menthe Froissée", "Lavande de Provence", "Cardamome", "Bergamote"],
    heartNotes: ["Fleur d'Oranger du Maroc", "Cannelle de Ceylan", "Carvi"],
    baseNotes: ["Vanille Bourbon", "Fève de Tonka liquoreuse", "Bois de Santal", "Cèdre"],
    image: "https://fimgs.net/images/perfume/375x500.430.jpg",
    accords: [
      { name: "vanille", value: 100, color: "#cfb980" },
      { name: "aromatique", value: 95, color: "#2d7a75" },
      { name: "frais épicé", value: 90, color: "#76933c" },
      { name: "poudré", value: 85, color: "#caa7bc" },
      { name: "lavande", value: 80, color: "#caa7bc" }
    ]
  },
  "layton": {
    name: "Layton",
    brand: "Parfums de Marly",
    category: "Unisexe",
    theme: "blue",
    description: "Une fragrance addictive et élégante qui incarne le faste et l'effervescence de la cour royale de Versailles. L'éclat d'une pomme caramélisée épicée se mêle à une lavande noble et un lit boisé-vanillé magnifique.",
    topNotes: ["Pomme verte juteuse", "Lavande", "Mandarine d'Italie", "Bergamote"],
    heartNotes: ["Géranium", "Violette", "Jasmin de Grasse"],
    baseNotes: ["Vanille de Madagascar", "Cardamome ambrée", "Bois de Santal", "Poivre noir", "Patchouli"],
    image: "https://fimgs.net/images/perfume/375x500.40660.jpg",
    accords: [
      { name: "vanille", value: 100, color: "#cfb980" },
      { name: "chaud épicé", value: 95, color: "#b35a20" },
      { name: "boisé", value: 90, color: "#825d38" },
      { name: "fruité", value: 85, color: "#a93f55" },
      { name: "aromatique", value: 80, color: "#2d7a75" }
    ]
  }
};

// Real-time offline fallback modeler in case Gemini API quota is exhausted
function generateNichePerfumeSvgDataUri(brand: string, name: string, category: string): string {
  // Determine gradient color depending on category
  let juiceGradient = "";
  let accentColor = "#D4AF37"; // gold
  if (category === "Femme") {
    juiceGradient = `
      <linearGradient id="juiceGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fff1f2"/>
        <stop offset="60%" stop-color="#fbcfe8"/>
        <stop offset="100%" stop-color="#f472b6"/>
      </linearGradient>
    `;
    accentColor = "#db2777";
  } else if (category === "Unisexe") {
    juiceGradient = `
      <linearGradient id="juiceGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f8fafc"/>
        <stop offset="60%" stop-color="#93c5fd"/>
        <stop offset="100%" stop-color="#2563eb"/>
      </linearGradient>
    `;
    accentColor = "#3b82f6";
  } else {
    juiceGradient = `
      <linearGradient id="juiceGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fef3c7"/>
        <stop offset="60%" stop-color="#f59e0b"/>
        <stop offset="100%" stop-color="#b45309"/>
      </linearGradient>
    `;
    accentColor = "#d97706";
  }

  const escapeXml = (str: string) => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  const escapedBrand = escapeXml(brand.toUpperCase());
  const escapedName = escapeXml(name.toUpperCase());

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
    <linearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15"/>
      <stop offset="30%" stop-color="#ffffff" stop-opacity="0.02"/>
      <stop offset="70%" stop-color="#000000" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.15"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#ca8a04"/>
      <stop offset="100%" stop-color="#eab308"/>
    </linearGradient>
    ${juiceGradient}
  </defs>

  <rect width="100%" height="100%" fill="url(#bgGrad)"/>
  
  <!-- Subtle back glow -->
  <circle cx="150" cy="230" r="110" fill="${accentColor}" fill-opacity="0.08" filter="blur(40px)"/>

  <!-- Bottle shadow -->
  <ellipse cx="150" cy="355" rx="60" ry="10" fill="#000000" fill-opacity="0.7" filter="blur(6px)"/>

  <!-- Metallic Cap -->
  <rect x="120" y="85" width="60" height="42" rx="6" fill="url(#goldGrad)" stroke="#18181b" stroke-width="1"/>
  <rect x="115" y="127" width="70" height="8" rx="2" fill="#151515"/>

  <!-- Collar -->
  <rect x="135" y="130" width="30" height="15" fill="url(#goldGrad)" stroke="#854d0e" stroke-width="0.5"/>

  <!-- Glass Bottle Container -->
  <rect x="85" y="145" width="130" height="200" rx="18" fill="url(#juiceGrad)" stroke="url(#goldGrad)" stroke-width="1.5"/>
  <rect x="85" y="145" width="130" height="200" rx="18" fill="url(#glassGrad)"/>

  <!-- Inner chamber -->
  <rect x="95" y="155" width="110" height="180" rx="12" fill="none" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1"/>

  <!-- White Minimal Label -->
  <rect x="100" y="185" width="100" height="110" rx="4" fill="#fafafa" stroke="#1c1917" stroke-width="1"/>
  <rect x="103" y="188" width="94" height="104" rx="2" fill="none" stroke="#e7e5e4" stroke-width="0.5"/>

  <!-- Label Content -->
  <text x="150" y="210" font-family="'Courier New', Courier, monospace" font-size="8" font-weight="900" fill="#78716c" text-anchor="middle" letter-spacing="2">MAISON LUXORA</text>
  <line x1="112" y1="218" x2="188" y2="218" stroke="#e7e5e4" stroke-width="1"/>
  
  <text x="150" y="235" font-family="'Times New Roman', Times, serif, sans-serif" font-size="11" font-style="italic" font-weight="bold" fill="#1c1917" text-anchor="middle" letter-spacing="0.5">${escapedBrand}</text>
  <text x="150" y="258" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="1.2">${escapedName}</text>
  
  <line x1="112" y1="268" x2="188" y2="268" stroke="#e7e5e4" stroke-width="1"/>
  
  <text x="150" y="282" font-family="Helvetica, Arial, sans-serif" font-size="6" font-weight="bold" fill="#78716c" text-anchor="middle" letter-spacing="1.5">EXTRAIT DE PARFUM</text>
  <text x="150" y="291" font-family="'Courier New', Courier, monospace" font-size="5" fill="#a8a29e" text-anchor="middle">PARIS — GRASSE</text>

  <!-- Highlight -->
  <path d="M 94 165 L 94 320" stroke="#ffffff" stroke-opacity="0.25" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;

  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

function getSmartFallbackPerfume(brand: string, model: string) {
  const normBrand = brand.toLowerCase();
  const normModel = model.toLowerCase();
  const combined = `${normBrand} ${normModel}`;

  if (looksLikeGibberish(brand, model)) {
    throw new Error("Saisie non conforme ou incohérente détectée.");
  }

  // 1. First, check if we have a famous perfume match
  let foundKey = "";
  for (const k of Object.keys(FAMOUS_PERFUMES)) {
    if (combined.includes(k) || k.includes(combined) || normModel.includes(k)) {
      foundKey = k;
      break;
    }
  }

  if (foundKey) {
    const data = FAMOUS_PERFUMES[foundKey];
    const basePrice = 145;
    return {
      id: `${data.brand.toLowerCase().replace(/\s+/g, "-")}-${data.name.toLowerCase().replace(/\s+/g, "-")}`,
      name: data.name,
      brand: data.brand,
      theme: data.theme,
      category: data.category,
      price: basePrice,
      sizes: [
        { ml: "50 ml", price: basePrice },
        { ml: "100 ml", price: Math.floor(basePrice * 1.45) }
      ],
      description: data.description,
      notes: [...data.topNotes, ...data.heartNotes, ...data.baseNotes].slice(0, 5),
      topNotes: data.topNotes,
      heartNotes: data.heartNotes,
      baseNotes: data.baseNotes,
      image: generateNichePerfumeSvgDataUri(data.brand, data.name, data.category),
      isBestSeller: true,
      accords: data.accords
    };
  }

  // 1. Determine public target (Homme, Femme, Unisexe) with high precision
  let category: "Homme" | "Femme" | "Unisexe" = "Unisexe";
  const maleKeywords = ["homme", "man", "men", "garcon", "boy", "male", "gentleman", "sport", "boss", "leather", "vetiver", "club", "intense", "noir", "blue", "bleu", "sauvage", "creed", "l'instant", "pour lui", "him", "mâle", "legend"];
  const femaleKeywords = ["femme", "woman", "women", "girl", "mademoiselle", "cherry", "jasmine", "rose", "donna", "flora", "bloom", "belle", "lady", "chloe", "opium", "libre", "nivea", "love", "her", "pour elle", "she", "delina", "sweet", "beauty"];

  if (maleKeywords.some(kw => combined.includes(kw))) {
    category = "Homme";
  } else if (femaleKeywords.some(kw => combined.includes(kw))) {
    category = "Femme";
  }

  // 2. Determine olfactory profile (boisé, floral, ambré/sucré, citrus)
  let profile: "boisé" | "floral" | "ambretabac" | "citrus" = "boisé";
  if (["fleur", "rose", "jasmin", "bloom", "flora", "bouquet", "chloe", "neroli", "tuberose", "orchid", "gardenia", "lily", "violet"].some(k => combined.includes(k))) {
    profile = "floral";
  } else if (["vanille", "ambre", "sweet", "sucre", "opium", "tonka", "epice", "warm", "spicy", "hot", "cherry", "caramel", "toffee", "chocolate"].some(k => combined.includes(k))) {
    profile = "ambretabac";
  } else if (["frais", "fresh", "sport", "blue", "bleu", "water", "eau", "citrus", "citron", "agrume", "mint", "menthe", "lime", "summer", "ocean", "marine"].some(k => combined.includes(k))) {
    profile = "citrus";
  }

  let description = "";
  let topNotes: string[] = [];
  let heartNotes: string[] = [];
  let baseNotes: string[] = [];
  let accords: { name: string; value: number; color: string }[] = [];

  if (profile === "floral") {
    description = `Une création sublime d'un romantisme absolu, évoquant un sillage frais de pétales de roses blanches et de jasmin précieux réchauffés par un timide soleil de printemps. Une délicieuse sensation poudrée et réconfortante qui rappelle de tendres draps de soie et la pureté d'une caresse florale sur la peau.`;
    topNotes = ["Mandarine d'Italie", "Poire juteuse", "Pivoine Blanche"];
    heartNotes = ["Rose Absolue de Grasse", "Jasmin Sambac", "Fleur d'Oranger"];
    baseNotes = ["Muscs Blancs Soyeux", "Bois de Santal crémeux", "Iris de Florence"];
    accords = [
      { name: "fleurs blanches", value: 95, color: "#ded9ca" },
      { name: "floral", value: 90, color: "#e39bbb" },
      { name: "poudré", value: 80, color: "#caa7bc" },
      { name: "musqué", value: 70, color: "#b5a494" },
      { name: "frais", value: 65, color: "#4facc8" }
    ];
  } else if (profile === "ambretabac") {
    description = `Un accord ambré gourmand intensément sensuel et envoûtant. Il fait instantanément penser à la douce lueur d'un boudoir capitonné, où se mêlent de volutes aériennes de tabac doré, de gousses de vanille de Madagascar et d'épices chaudes veloutées. Une odeur riche et mystique à la présence magnétique irrésistible.`;
    topNotes = ["Cannelle de Ceylan", "Safran de Perse", "Cardamome ambrée"];
    heartNotes = ["Tabac Blond", "Fève de Tonka liquoreuse", "Héliotrope"];
    baseNotes = ["Gousse de Vanille Bourbon", "Ambre Noir fondant", "Bois de Gaïac"];
    accords = [
      { name: "vanille", value: 95, color: "#cfb980" },
      { name: "ambre", value: 90, color: "#aa7c11" },
      { name: "chaud épicé", value: 85, color: "#b35a20" },
      { name: "sucré", value: 75, color: "#bc517c" },
      { name: "boisé", value: 60, color: "#825d38" }
    ];
  } else if (profile === "citrus") {
    description = `Un sillage énergétique de pure liberté, vif comme la mer et éclatant comme un verger d'Italie. Il rappelle l'odeur zestée des agrumes frais pressés au lever du jour et la brise océanique chargée de sel de mer. Une fraîcheur glacée et moderne qui s'installe dans un fond boisé-propre très noble.`;
    topNotes = ["Citron de Sicile", "Bergamote sauvage", "Menthe Froissée"];
    heartNotes = ["Thé Noir infusé", "Gingembre du Nigeria", "Géranium d'Égypte"];
    baseNotes = ["Ambroxan Pur", "Bois de Cèdre blanc", "Mousse de Chêne"];
    accords = [
      { name: "agrume", value: 100, color: "#e5c158" },
      { name: "frais", value: 90, color: "#4facc8" },
      { name: "frais épicé", value: 80, color: "#76933c" },
      { name: "aromatique", value: 75, color: "#2d7a75" },
      { name: "boisé", value: 60, color: "#825d38" }
    ];
  } else {
    // boisé / woody default
    description = `Une architecture boisée de caractère, majestueuse, profonde et très sophistiquée. Elle dessine l’image d'une forêt mystique au crépuscule d'où s'élèvent les senteurs riches de cèdre de l'Atlas et de bois de santal. Le poivre de Sichuan en tête apporte une clarté moderne à ce sillage fumé extrêmement sensuel.`;
    topNotes = ["Poivre de Sichuan", "Baies de Genévrier", "Pamplemousse Rose"];
    heartNotes = ["Cèdre de l'Atlas", "Vétiver d'Haïti", "Huile de Patchouli"];
    baseNotes = ["Bois de Santal précieux", "Encens Sacré", "Ambrette d'Orient"];
    accords = [
      { name: "boisé", value: 95, color: "#825d38" },
      { name: "aromatique", value: 80, color: "#2d7a75" },
      { name: "ambre", value: 75, color: "#aa7c11" },
      { name: "frais épicé", value: 70, color: "#76933c" },
      { name: "musqué", value: 60, color: "#b5a494" }
    ];
  }

  // Capitalize name/brand properly
  const finalName = model.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  const finalBrand = brand.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  // Consistent price generation based on characters' hash code
  let charSum = 0;
  for (let i = 0; i < combined.length; i++) charSum += combined.charCodeAt(i);
  const basePrice = (charSum % 70) + 115; // prices from 115€ to 184€
  
  const id = `${brand.toLowerCase().replace(/\s+/g, "-")}-${model.toLowerCase().replace(/\s+/g, "-")}`;
  
  let themeToSet: "gold" | "pink" | "blue" = "gold";
  if (category === "Femme") themeToSet = "pink";
  if (category === "Unisexe") themeToSet = "blue";

  return {
    id,
    name: finalName,
    brand: finalBrand,
    theme: themeToSet,
    category,
    price: basePrice,
    sizes: [
      { ml: "50 ml", price: basePrice },
      { ml: "100 ml", price: Math.floor(basePrice * 1.45) }
    ],
    description,
    notes: [...topNotes, ...heartNotes, ...baseNotes].slice(0, 5),
    topNotes,
    heartNotes,
    baseNotes,
    image: generateNichePerfumeSvgDataUri(finalBrand, finalName, category),
    isBestSeller: charSum % 10 > 6,
    accords
  };
}

// Helper function to extract elegant Fragrantica CDN images with numeric IDs
function findFragranticaCdnImage(text: string, chunks: any[]): string | null {
  // Direct fimgs regex matching
  const directFimgsRegex = /https?:\/\/[^\s"()]*?fimgs\.net\/images\/perfume\/[a-zA-Z0-9_/.-]*?(\d+)\.(?:jpg|jpeg|png|webp)/i;
  const directFimgsRegexSimple = /https?:\/\/[^\s"()]+\/(\d+)\.[a-zA-Z0-9]+/i;

  // 1. Search in chunks
  if (chunks && Array.isArray(chunks)) {
    for (const chunk of chunks) {
      const uri = chunk?.web?.uri || chunk?.web?.url;
      if (uri && typeof uri === "string") {
        let m = uri.match(directFimgsRegex) || uri.match(directFimgsRegexSimple);
        if (m && m[1]) {
          return `https://fimgs.net/images/perfume/375x500.${m[1]}.jpg`;
        }
        if (uri.toLowerCase().includes("fragrantica.")) {
          const matchHtml = uri.match(/-(\d+)\.html/i);
          if (matchHtml && matchHtml[1]) {
            return `https://fimgs.net/images/perfume/375x500.${matchHtml[1]}.jpg`;
          }
          const matchId = uri.match(/-(\d+)\b/i);
          if (matchId && matchId[1] && matchId[1].length >= 3) {
            return `https://fimgs.net/images/perfume/375x500.${matchId[1]}.jpg`;
          }
        }
      }
    }
  }

  // 2. Search in text content
  if (text && typeof text === "string") {
    const mText = text.match(directFimgsRegex) || text.match(directFimgsRegexSimple);
    if (mText && mText[0]) {
      const idMatch = mText[0].match(/(\d+)\.(?:jpg|jpeg|png|webp)/i) || mText[0].match(/(\d+)\b/);
      if (idMatch && idMatch[1]) {
        return `https://fimgs.net/images/perfume/375x500.${idMatch[1]}.jpg`;
      }
      return mText[0];
    }

    const fragMatch = text.match(/fragrantica\.[a-z.]{2,}\/[^"\s()]*?-(\d+)\.html/i) || text.match(/fragrantica\.[a-z.]{2,}\/[^"\s()]*?-(\d+)\b/i);
    if (fragMatch && fragMatch[1]) {
      return `https://fimgs.net/images/perfume/375x500.${fragMatch[1]}.jpg`;
    }

    const lines = text.split("\n");
    for (const line of lines) {
      if (line.toLowerCase().includes("fragrantica.")) {
        const idMatch = line.match(/-(\d+)\.html/i) || line.match(/-(\d+)\b/i);
        if (idMatch && idMatch[1] && idMatch[1].length >= 3) {
          return `https://fimgs.net/images/perfume/375x500.${idMatch[1]}.jpg`;
        }
      }
    }
  }

  return null;
}

// POST search-perfume logic (AI intelligent research)
app.post("/api/search-perfume", async (req, res) => {
  const { brand, model } = req.body;
  if (!brand || !model) {
    return res.status(400).json({ success: false, error: "La marque et le modèle sont requis." });
  }

  // Pre-validate for keyboard mash or nonsense queries
  if (looksLikeGibberish(brand, model)) {
    return res.status(404).json({
      success: false,
      error: "Ce parfum n'existe pas ou n'a pas pu être identifié. Veuillez vérifier la marque et le modèle."
    });
  }

  try {
    // STEP 1: Search grounding call targeting Fragrantica, Parfumo, and official sites or Google search
    const searchPrompt = `Tu agis comme une API de base de données de parfums unifiée haute fidélité. Recherche impérativement sur le site Fragrantica (site:fragrantica.com ou site:fragrantica.fr ou autre domaine régional) ainsi que sur Parfumo ou les sites officiels pour obtenir les meilleures notes réelles, les accords exacts et le lien de l'image de flacon le plus qualitatif possible pour :
Marque : "${brand}"
Modèle/Nom : "${model}"
Recherche de base de données ciblée : "site:fragrantica.com ${brand} ${model}" ou "site:parfumo.net ${brand} ${model}"

Trouve et rapporte très précisément les données factuelles de la base de données :
1. Les véritables notes de Tête (Top notes) en français.
2. Les véritables notes de Cœur (Heart/Middle notes) en français.
3. Les véritables notes de Fond (Base notes) en français.
4. Les accords olfactifs majeurs réels en français avec leurs forces (ex: boisé 100%, agrumes 90%, ambre 75%).
5. La catégorie cible exacte (Homme, Femme, ou Unisexe).
6. Une description poétique de 2 à 3 lignes pour l'ambiance olfactive en français.
7. L'URL réelle de l'image sur fimgs.net ou l'ID numérique de Fragrantica ou l'URL de l'image officielle sur Sephora/Dior/Chanel/etc. Compare toutes les sources de données de la recherche et sélectionne impérativement la meilleure image réelle du flacon de parfum (de préférence construite sous la forme : https://fimgs.net/images/perfume/375x500.[ID].jpg). Ne propose JAMAIS de lien Unsplash ou d'image générique !`;

    const searchResponse = await getAi().models.generateContent({
      model: "gemini-3.5-flash",
      contents: searchPrompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const factualContext = searchResponse.text;
    if (!factualContext) {
      throw new Error("L'outil de recherche n'a retourné aucun détail factuel.");
    }

    // Capture grounding chunks
    const groundingChunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webUrls = groundingChunks
      .map((c: any) => c?.web?.uri || c?.web?.url)
      .filter(Boolean);

    // Try to find a direct Fragrantica CDN image link using our regex matching
    const autoFragranticaImage = findFragranticaCdnImage(factualContext, groundingChunks);

    // STEP 2: Feed the factual context to a structured structure JSON producer
    const structuredStructurePrompt = `Tu es un expert parfumeur. Extrais rigoureusement les informations du contexte de recherche factuelle ci-dessous et formate-les dans le schéma JSON demandé.

Contexte factuel issu du web :
"""
${factualContext}
"""

Liens découverts lors de la recherche :
${webUrls.map((url: string) => `- ${url}`).join("\n")}

CONSIGNES PARTICULIÈRES :
1. Si le contexte certifie que ce parfum n'existe pas ou est imaginaire, mets "exists" à false. Sinon, mets-le à true.
2. Corrige l'orthographe officielle de la marque (ex: Dior, Chanel, Guerlain) et du modèle (ex: Sauvage, Shalimar) d'après les faits trouvés.
3. Pour l'image (image) :
   - Extrais impérativement l'URL directe du flacon sur fimgs.net ou trouve l'ID de la page Fragrantica découvers dans les liens ou dans le contexte.
   - Si tu as une URL Fragrantica (ex: https://www.fragrantica.com/perfume/Marque/Nom-<ID>.html), construis impérativement l'adresse de l'image : "https://fimgs.net/images/perfume/375x500.<ID>.jpg" avec l'ID numérique.
   - Ne crée/génère JAMAIS de base64/SVG et ne propose AUCUN lien provenant de "unsplash.com" (ceux-ci sont strictement proscrits). Si aucun lien fimgs.net ou ID n'est extrait, laisse une chaîne vide "".
4. Pour les accords (accords) : Propose les accords majeurs réels en français d'après Fragrantica / Parfumo et associe-leur des couleurs hexadécimales coordonnées à l'ambiance visuelle du parfum.
5. Traduis toutes les notes olfactives (notes, topNotes, heartNotes, baseNotes) fidèlement en français (ex: "Bergamote", "Vanille de Madagascar", "Cèdre de l'Atlas").`;

    const response = await getAi().models.generateContent({
      model: "gemini-3.5-flash",
      contents: structuredStructurePrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            exists: { type: Type.BOOLEAN, description: "Indique si ce parfum est réel et existe sur le marché (true) ou s'il est fictif, inventé ou inexistant (false)." },
            name: { type: Type.STRING, description: "Nom complet officiel du modèle trouvé (ex: Sauvage Elixir ou Black Opium)" },
            brand: { type: Type.STRING, description: "Nom officiel précis de la marque (ex: Dior ou Yves Saint Laurent)" },
            category: { type: Type.STRING, description: "Must be exactly 'Homme' or 'Femme' or 'Unisexe'" },
            description: { type: Type.STRING, description: "Description d'analogie de l'odeur et ce qu'elle évoque, à quoi elle ressemble ou fait penser en français (2-3 lignes)" },
            image: { type: Type.STRING, description: "URL d'image fimgs.net réelle ou identifiant construit de parfum, ou chaîne vide." },
            notes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "4 à 6 ingrédients/notes notables réelles du parfum." },
            topNotes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 ou 4 notes de tête réelles" },
            heartNotes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 ou 4 notes de cœur réelles" },
            baseNotes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 ou 4 notes de fond réelles" },
            accords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Nom de l'accord principal en français (ex: boisé, agrume, poudré...)" },
                  value: { type: Type.INTEGER, description: "Pourcentage de force de cet accord (ex: 95)" },
                  color: { type: Type.STRING, description: "Couleur hexadécimale associée conseillée pour l'affichage bar graph" }
                },
                required: ["name", "value", "color"]
              },
              description: "Une liste ordonnée des 5-7 accords olfactifs majeurs du parfum comme Fragrantica."
            }
          },
          required: ["exists", "name", "brand", "category", "description", "image", "notes", "topNotes", "heartNotes", "baseNotes", "accords"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("L'IA n'a retourné aucun contenu de structuration");
    }

    const perfumeData = JSON.parse(resultText);

    // If the perfume isn't verified as real, return 404
    if (perfumeData.exists === false) {
      return res.status(404).json({
        success: false,
        error: "Ce parfum n'existe pas ou n'a pas pu être identifié comme réel. Veuillez vérifier la marque et le modèle."
      });
    }

    // Formulate a clean ID
    const generatedId = `${perfumeData.brand.toLowerCase().replace(/\s+/g, "-")}-${perfumeData.name.toLowerCase().replace(/\s+/g, "-")}`;
    
    // Choose theme background according to category or brand or name
    let themeToSet: "gold" | "pink" | "blue" = "gold";
    if (perfumeData.category === "Femme") {
      themeToSet = "pink";
    } else if (perfumeData.category === "Unisexe") {
      themeToSet = "blue";
    }

    // Set prices and standard sizing
    const basePrice = Math.floor(Math.random() * 80) + 110; // premium range default 110 to 190€
    const sizes = [
      { ml: "50 ml", price: basePrice },
      { ml: "100 ml", price: Math.floor(basePrice * 1.45) }
    ];

    // Determine the beautiful image to use
    let finalImageUrl = perfumeData.image;

    // Check if autoFragranticaImage was found from STEP 1 grounding metadata / text description
    const fragranticaUrlFallback = autoFragranticaImage || findFragranticaCdnImage(perfumeData.image || "", groundingChunks);
    if (fragranticaUrlFallback) {
      finalImageUrl = fragranticaUrlFallback;
    }

    let isDirectImage = false;
    if (finalImageUrl && typeof finalImageUrl === "string") {
      const lowerUrl = finalImageUrl.toLowerCase().trim();
      const hasImageExtension = lowerUrl.endsWith(".jpg") || 
                               lowerUrl.endsWith(".jpeg") || 
                               lowerUrl.endsWith(".png") || 
                               lowerUrl.endsWith(".webp") || 
                               lowerUrl.endsWith(".gif") ||
                               lowerUrl.match(/\.(jpg|jpeg|png|webp|gif)/) !== null;
      const isKnownService = lowerUrl.includes("fimgs.net") ||
                             lowerUrl.includes("parfumo") ||
                             lowerUrl.includes("fragrantica") ||
                             lowerUrl.includes("sephora") ||
                             lowerUrl.includes("dior") ||
                             lowerUrl.includes("chanel") ||
                             lowerUrl.includes("cloudinary") ||
                             lowerUrl.includes("media") ||
                             lowerUrl.includes("cdn");
      const isSearchPage = lowerUrl.includes("google.com/search") || lowerUrl.includes("bing.com/search") || lowerUrl.includes("unsplash.com");
      
      if ((hasImageExtension || isKnownService) && !isSearchPage) {
        isDirectImage = true;
      }
    }

    if (!isDirectImage) {
      finalImageUrl = "";
    }

    // Build the final complete Perfume DB entry
    const finalPerfumeObj = {
      id: generatedId,
      name: perfumeData.name,
      brand: perfumeData.brand,
      theme: themeToSet,
      category: perfumeData.category,
      price: basePrice,
      sizes,
      description: perfumeData.description,
      notes: perfumeData.notes,
      topNotes: perfumeData.topNotes,
      heartNotes: perfumeData.heartNotes,
      baseNotes: perfumeData.baseNotes,
      image: finalImageUrl,
      isBestSeller: Math.random() > 0.6,
      accords: perfumeData.accords
    };

    res.json({ success: true, perfume: finalPerfumeObj });
  } catch (error: any) {
    console.warn("Gemini API error (likely quota limit reached). Running high-end offline fallback modeler:", error.message || error);
    try {
      const fallbackPerfume = getSmartFallbackPerfume(brand, model);
      res.json({
        success: true,
        perfume: fallbackPerfume,
        isFallback: true,
        fallbackNotice: "Limite d'API dépassée. Modélisation olfactive d’expert effectuée localement."
      });
    } catch (fallbackError: any) {
      console.error("Critical fallback generator failure:", fallbackError);
      res.status(500).json({ success: false, error: "Échec de la génération automatique du parfum." });
    }
  }
});

// Setup Vite dev server middleware or serve built app
async function initializeApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT}`);
  });
}

initializeApp().catch((err) => {
  console.error("Failed to start server:", err);
});
