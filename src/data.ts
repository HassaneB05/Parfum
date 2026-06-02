export interface Perfume {
  id: string;
  name: string;
  brand: string;
  theme: "gold" | "pink" | "blue";
  category: "Homme" | "Femme" | "Unisexe";
  price: number; // Base price for smallest size
  sizes: { ml: string; price: number }[];
  description: string;
  notes: string[];
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  image: string;
  isBestSeller?: boolean;
  accords?: { name: string; value: number; color: string }[];
}

export interface SlideData {
  index: number;
  theme: "gold" | "pink" | "blue";
  brand: string;
  productName: string;
  titlePart1: string;
  titleHighlight: string;
  titleHighlightColorClass: string;
  bgGlowClass: string;
  accentColorHex: string;
  hoverAccentColorHex: string;
  badgeText: string;
  description: string;
  image: string;
  floatingElementsColor: string;
  perfumeId: string; // link to corresponding perfume in database
}

export const PERFUMES_DB: Perfume[] = [
  {
    id: "armani-swy",
    name: "Stronger With You Intensely",
    brand: "Emporio Armani",
    theme: "gold",
    category: "Homme",
    price: 110,
    sizes: [
      { ml: "50 ml", price: 110 },
      { ml: "100 ml", price: 155 },
      { ml: "150 ml", price: 195 }
    ],
    description: "Un parfum oriental fougère captivant infusé de notes de poivre rose, de cannelle et d'accord de daim marron vanillé. Une signature d'amour intense incarnant la force de la passion.",
    notes: ["Poivre Rose", "Cannelle", "Vanille de Madagascar", "Daim", "Toffee"],
    topNotes: ["Poivre Rose", "Genièvre", "Violette"],
    heartNotes: ["Cannelle", "Sauge", "Lavande", "Toffee"],
    baseNotes: ["Vanille", "Suède", "Ambre", "Fève de Tonka"],
    image: "/src/assets/images/1.png",
    isBestSeller: true,
    accords: [
      { name: "épicé chaud", value: 95, color: "#b35a20" },
      { name: "vanille", value: 85, color: "#cfb980" },
      { name: "boisé", value: 75, color: "#825d38" },
      { name: "sucré", value: 70, color: "#bc517c" },
      { name: "ambre", value: 65, color: "#aa7c11" }
    ]
  },
  {
    id: "valentino-extradose",
    name: "Donna Born In Roma Extradose",
    brand: "Valentino",
    theme: "pink",
    category: "Femme",
    price: 135,
    sizes: [
      { ml: "50 ml", price: 135 },
      { ml: "100 ml", price: 185 }
    ],
    description: "Une fragrance couture florale et boisée repoussant les limites de l'intensité. Une explosion magnétique de jasmin grandiflorum, drapée dans l'opulence d'une vanille Bourbon charnelle et rythmée par un thé noir fumé.",
    notes: ["Jasmin Grandiflorum", "Vanille Bourbon", "Thé Noir Fumé", "Bois de Gaïac"],
    topNotes: ["Bergamote de Calabre", "Thé Noir d'Inde"],
    heartNotes: ["Jasmin Grandiflorum", "Fleur d'Oranger"],
    baseNotes: ["Vanille Bourbon", "Bois de Gaïac", "Ambrette"],
    image: "/src/assets/images/2.png",
    isBestSeller: true,
    accords: [
      { name: "vanille", value: 95, color: "#cfb980" },
      { name: "fleurs blanches", value: 90, color: "#ded9ca" },
      { name: "aromatique", value: 80, color: "#2d7a75" },
      { name: "boisé", value: 70, color: "#825d38" },
      { name: "frais", value: 55, color: "#4facc8" }
    ]
  },
  {
    id: "lv-imagination",
    name: "Imagination",
    brand: "Louis Vuitton",
    theme: "blue",
    category: "Unisexe",
    price: 280,
    sizes: [
      { ml: "100 ml", price: 280 },
      { ml: "200 ml", price: 420 }
    ],
    description: "Une envolée d'agrumes nobles associés à l'or gris de l'ambrox et la sensualité du thé noir de Chine. Une fragrance exceptionnelle qui pousse l'esprit à voyager vers les horizons créatifs les plus infinis.",
    notes: ["Ambrox", "Thé Noir de Chine", "Néroli de Tunisie", "Gingembre", "Cédrat de Sicile"],
    topNotes: ["Cédrat de Sicile", "Bergamote de Calabre", "Orange Douce"],
    heartNotes: ["Néroli de Tunisie", "Gingembre du Nigeria", "Cannelle de Ceylan"],
    baseNotes: ["Thé Noir", "Ambrox", "Gaïac", "Encens"],
    image: "/src/assets/images/3.png",
    isBestSeller: true,
    accords: [
      { name: "agrume", value: 100, color: "#e5c158" },
      { name: "ambre", value: 85, color: "#aa7c11" },
      { name: "épicé frais", value: 80, color: "#76933c" },
      { name: "frais", value: 75, color: "#4facc8" },
      { name: "boisé", value: 60, color: "#825d38" }
    ]
  },
  {
    id: "tf-lost-cherry",
    name: "Lost Cherry",
    brand: "Tom Ford",
    theme: "pink",
    category: "Unisexe",
    price: 320,
    sizes: [
      { ml: "50 ml", price: 320 },
      { ml: "100 ml", price: 460 }
    ],
    description: "Un voyage corsé dans le autrefois interdit ; un parfum d'une douceur contrastante. Cerise noire juteuse s'entremêlant à la liqueur de cerise délicieusement amère et aux amandes tièdes.",
    notes: ["Cerise Noire", "Liqueur de Cerise", "Amande Amère", "Rose de Turquie", "Fève de Tonka"],
    topNotes: ["Cerise Noire", "Liqueur de Cerise", "Amande Amère"],
    heartNotes: ["Sirops de Griotte", "Rose de Turquie", "Jasmin Sambac"],
    baseNotes: ["Fève de Tonka", "Bois de Santal", "Vétiver", "Cèdre"],
    image: "https://fimgs.net/images/perfume/375x500.43003.jpg",
    isBestSeller: false,
    accords: [
      { name: "fruité", value: 100, color: "#a93f55" },
      { name: "amande", value: 90, color: "#cfb980" },
      { name: "sucré", value: 85, color: "#bc517c" },
      { name: "épicé chaud", value: 70, color: "#b35a20" },
      { name: "boisé", value: 65, color: "#825d38" }
    ]
  },
  {
    id: "creed-aventus",
    name: "Aventus",
    brand: "Creed",
    theme: "blue",
    category: "Homme",
    price: 295,
    sizes: [
      { ml: "50 ml", price: 215 },
      { ml: "100 ml", price: 295 }
    ],
    description: "Célébration de la force, de la puissance et du succès. Ce parfum d'exception marie des accords fruités de cassis et de pomme à de riches sous-notes boisées de bouleau grillé et de mousse de chêne chic.",
    notes: ["Cassis", "Ananas", "Bois de Bouleau", "Patchouli", "Mousse de Chêne"],
    topNotes: ["Ananas", "Bergamote", "Feuilles de Cassis", "Pomme"],
    heartNotes: ["Bouleau", "Patchouli", "Baies de Rose", "Jasmin"],
    baseNotes: ["Mousse de Chêne", "Ambre Gris", "Vanille", "Musc"],
    image: "https://fimgs.net/images/perfume/375x500.9828.jpg",
    isBestSeller: false,
    accords: [
      { name: "fruité", value: 95, color: "#a93f55" },
      { name: "boisé", value: 85, color: "#825d38" },
      { name: "frais", value: 80, color: "#4facc8" },
      { name: "agrume", value: 75, color: "#e5c158" },
      { name: "musqué", value: 70, color: "#b5a494" }
    ]
  },
  {
    id: "mfk-br540",
    name: "Baccarat Rouge 540 Extrait",
    brand: "Maison Francis Kurkdjian",
    theme: "gold",
    category: "Unisexe",
    price: 340,
    sizes: [
      { ml: "70 ml", price: 340 },
      { ml: "200 ml", price: 690 }
    ],
    description: "Une alchimie poétique où les notes de jasmin aérien et l'éclat du safran s'associent aux facettes minérales de l'ambre gris et aux tonalités boisées d'un cèdre fraîchement coupé.",
    notes: ["Safran d'Iran", "Jasmin Égyptien", "Ambre Gris", "Cèdre rouge", "Amande Amère"],
    topNotes: ["Amande Amère", "Safran"],
    heartNotes: ["Jasmin d'Égypte", "Cèdre de Virginie"],
    baseNotes: ["Ambre Gris", "Bois", "Musc"],
    image: "https://fimgs.net/images/perfume/375x500.41871.jpg",
    isBestSeller: true,
    accords: [
      { name: "boisé", value: 95, color: "#825d38" },
      { name: "ambre", value: 90, color: "#aa7c11" },
      { name: "épicé chaud", value: 80, color: "#b35a20" },
      { name: "poudré", value: 70, color: "#caa7bc" },
      { name: "fleurs blanches", value: 60, color: "#ded9ca" }
    ]
  }
];

export const SLIDES_DATA: SlideData[] = [
  {
    index: 0,
    theme: "gold",
    brand: "EMPORIO ARMANI",
    productName: "Stronger With You Intensely",
    titlePart1: "L'ESSENCE DU LUXE,",
    titleHighlight: "POUR VOUS.",
    titleHighlightColorClass: "text-[#D4AF37]",
    bgGlowClass: "from-[#D4AF37]/10 to-transparent",
    accentColorHex: "#D4AF37",
    hoverAccentColorHex: "#F3CD4F",
    badgeText: "100% AUTHENTIQUE",
    description: "Des parfums rares et authentiques, soigneusement sélectionnés auprès de sources de confiance à travers le monde. Parce que le vrai luxe réside dans l'authenticité.",
    image: "/src/assets/images/1.png",
    floatingElementsColor: "text-amber-500/20",
    perfumeId: "armani-swy"
  },
  {
    index: 1,
    theme: "pink",
    brand: "VALENTINO",
    productName: "EXTRADOSE",
    titlePart1: "L'ESSENCE DU LUXE,",
    titleHighlight: "POUR VOUS.",
    titleHighlightColorClass: "text-[#E0115F]",
    bgGlowClass: "from-[#E0115F]/10 to-transparent",
    accentColorHex: "#E0115F",
    hoverAccentColorHex: "#FF3B88",
    badgeText: "100% AUTHENTIQUE",
    description: "Des parfums rares et authentiques, soigneusement sélectionnés auprès de sources de confiance à travers le monde. Parce que le vrai luxe réside dans l'authenticité.",
    image: "/src/assets/images/2.png",
    floatingElementsColor: "text-pink-500/20",
    perfumeId: "valentino-extradose"
  },
  {
    index: 2,
    theme: "blue",
    brand: "LOUIS VUITTON",
    productName: "IMAGINATION",
    titlePart1: "L'ESSENCE DU LUXE,",
    titleHighlight: "POUR VOUS.",
    titleHighlightColorClass: "text-[#00F0FF]",
    bgGlowClass: "from-[#00F0FF]/10 to-transparent",
    accentColorHex: "#00F0FF",
    hoverAccentColorHex: "#3DF7FF",
    badgeText: "100% AUTHENTIQUE",
    description: "Des parfums rares et authentiques, soigneusement sélectionnés auprès de sources de confiance à travers le monde. Parce que le vrai luxe réside dans l'authenticité.",
    image: "/src/assets/images/3.png",
    floatingElementsColor: "text-cyan-500/20",
    perfumeId: "lv-imagination"
  }
];

export const BOUTIQUE_REVIEWS = [
  {
    id: 1,
    name: "Alexandre G.",
    stars: 5,
    comment: "Service d'une excellence rare. La bouteille Louis Vuitton Imagination est arrivée sous signature dans un coffret capitonné magnifique. Frais et authentique.",
    perfumeName: "Imagination - Louis Vuitton"
  },
  {
    id: 2,
    name: "Élisabeth M.",
    stars: 5,
    comment: "Valentino Extradose est un chef d'œuvre. Luxora respecte ses promesses : des fragrances introuvables ailleurs, un envoi rapide et trois généreux échantillons gratuits !",
    perfumeName: "Donna Born In Roma Extradose"
  }
];
