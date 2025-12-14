// Product database - shared across components

export interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  originalPrice?: string;
  onSale?: boolean;
  image: string; // Main thumbnail image
  images: string[]; // All product images for detail page
  description: string;
  sku: string;
  category: string;
  tags: string[];
  additionalInfo: {
    weight: string;
    dimensions: string;
    material: string;
    care: string;
  };
}

// Helper function to create slug from name
const createSlug = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

// All products database - 15 entries
export const allProducts: Product[] = [
  {
    id: 1,
    name: "Bowl For Lunch",
    slug: "bowl-for-lunch",
    price: "$165.00",
    image: "/images/product-3-300x300.jpg",
    images: [
      "/images/product-3.jpg",
      "/images/product-3-img-1.jpg",
      "/images/product-3-img-2.jpg",
      "/images/product-3-img-3.jpg",
    ],
    description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus.",
    sku: "026-1",
    category: "DINNERWEAR",
    tags: ["GADGETS", "MINIMALIST"],
    additionalInfo: {
      weight: "0.5 kg",
      dimensions: "20 x 15 x 10 cm",
      material: "Ceramic",
      care: "Hand wash only",
    },
  },
  {
    id: 2,
    name: "Brown Jar",
    slug: "brown-jar",
    price: "$60.00",
    originalPrice: "$65.00",
    onSale: true,
    image: "/images/product-5-300x300.jpg",
    images: [
      "/images/product-5.jpg",
      "/images/product-5-img-1.jpg",
      "/images/product-5-img-2.jpg",
      "/images/product-5-img-3.jpg",
    ],
    description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem.",
    sku: "027-2",
    category: "STORAGE",
    tags: ["JARS", "ORGANIC"],
    additionalInfo: {
      weight: "0.3 kg",
      dimensions: "15 x 15 x 20 cm",
      material: "Clay",
      care: "Hand wash only",
    },
  },
  {
    id: 3,
    name: "Ceramic Plate",
    slug: "ceramic-plate",
    price: "$65.00",
    image: "/images/product-6-300x300.jpg",
    images: [
      "/images/product-6.jpg",
      "/images/product-6-img-1.jpg",
      "/images/product-6-img-2.jpg",
      "/images/product-6-img-3.jpg",
    ],
    description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.",
    sku: "028-3",
    category: "DINNERWEAR",
    tags: ["PLATES", "CERAMIC"],
    additionalInfo: {
      weight: "0.4 kg",
      dimensions: "25 x 25 x 3 cm",
      material: "Ceramic",
      care: "Dishwasher safe",
    },
  },
  {
    id: 4,
    name: "Clay Mug",
    slug: "clay-mug",
    price: "$265.00",
    image: "/images/product-7-300x300.jpg",
    images: [
      "/images/product-7.jpg",
      "/images/product-7-img-1.jpg",
      "/images/product-7-img-2.jpg",
      "/images/product-7-img-3.jpg",
    ],
    description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa.",
    sku: "029-4",
    category: "DRINKWEAR",
    tags: ["MUGS", "HANDMADE"],
    additionalInfo: {
      weight: "0.3 kg",
      dimensions: "10 x 10 x 12 cm",
      material: "Clay",
      care: "Hand wash only",
    },
  },
  {
    id: 5,
    name: "Clay Plate",
    slug: "clay-plate",
    price: "$65.00",
    image: "/images/product-8-300x300.jpg",
    images: [
      "/images/product-8.jpg",
      "/images/product-8-img-1.jpg",
      "/images/product-8-img-2.jpg",
      "/images/product-8-img-3.jpg",
    ],
    description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.",
    sku: "030-5",
    category: "DINNERWEAR",
    tags: ["PLATES", "CLAY"],
    additionalInfo: {
      weight: "0.4 kg",
      dimensions: "22 x 22 x 2 cm",
      material: "Clay",
      care: "Hand wash only",
    },
  },
  {
    id: 6,
    name: "Cutting Board",
    slug: "cutting-board",
    price: "$65.00",
    image: "/images/product-9-300x300.jpg",
    images: [
      "/images/product-9.jpg",
      "/images/product-9-img-1.jpg",
      "/images/product-9-img-2.jpg",
      "/images/product-9-img-3.jpg",
    ],
    description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa.",
    sku: "031-6",
    category: "KITCHEN",
    tags: ["BOARDS", "WOODEN"],
    additionalInfo: {
      weight: "0.6 kg",
      dimensions: "30 x 20 x 2 cm",
      material: "Wood",
      care: "Hand wash and oil regularly",
    },
  },
  {
    id: 7,
    name: "Designed Plate",
    slug: "designed-plate",
    price: "$165.00",
    image: "/images/product-10-300x300.jpg",
    images: [
      "/images/product-10.jpg",
      "/images/product-10-img-1.jpg",
      "/images/product-10-img-2.jpg",
      "/images/product-10-img-3.jpg",
    ],
    description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.",
    sku: "032-7",
    category: "DINNERWEAR",
    tags: ["PLATES", "DESIGN"],
    additionalInfo: {
      weight: "0.5 kg",
      dimensions: "28 x 28 x 3 cm",
      material: "Ceramic",
      care: "Dishwasher safe",
    },
  },
  {
    id: 8,
    name: "Dessert Blue Plate",
    slug: "dessert-blue-plate",
    price: "$120.00",
    image: "/images/product-14-1-300x300.jpg",
    images: [
      "/images/product-14-1.jpg",
      "/images/product-14-img-1.jpg",
      "/images/product-14-img-3.jpg",
      "/images/product-14-img-4.jpg",
    ],
    description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.",
    sku: "034-9",
    category: "DINNERWEAR",
    tags: ["PLATES", "BLUE"],
    additionalInfo: {
      weight: "0.3 kg",
      dimensions: "20 x 20 x 2 cm",
      material: "Ceramic",
      care: "Dishwasher safe",
    },
  },
  {
    id: 9,
    name: "Dessert Plate",
    slug: "dessert-plate",
    price: "$65.00",
    image: "/images/product-16-300x300.jpg",
    images: [
      "/images/product-16.jpg",
      "/images/product-16-img-1.jpg",
      "/images/product-16-img-2.jpg",
      "/images/product-16-img-3.jpg",
    ],
    description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit.",
    sku: "035-10",
    category: "DINNERWEAR",
    tags: ["PLATES", "DESSERT"],
    additionalInfo: {
      weight: "0.3 kg",
      dimensions: "18 x 18 x 2 cm",
      material: "Ceramic",
      care: "Dishwasher safe",
    },
  },
  {
    id: 10,
    name: "Golden Decor",
    slug: "golden-decor",
    price: "$250.00",
    image: "/images/product-5-300x300.jpg",
    images: [
      "/images/product-5.jpg",
      "/images/product-5-img-1.jpg",
      "/images/product-5-img-2.jpg",
      "/images/product-5-img-3.jpg",
    ],
    description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa.",
    sku: "036-11",
    category: "DECOR",
    tags: ["GOLDEN", "DECORATIVE"],
    additionalInfo: {
      weight: "0.4 kg",
      dimensions: "15 x 15 x 15 cm",
      material: "Ceramic",
      care: "Hand wash only",
    },
  },
  {
    id: 11,
    name: "Golden Plate",
    slug: "golden-plate",
    price: "$250.00",
    image: "/images/product-23-img-1-300x300.jpg",
    images: [
      "/images/product-23-img-1.jpg",
      "/images/product-23-img-2.jpg",
      "/images/product-23-img-3.jpg",
      "/images/product-23-img-4.jpg",
    ],
    description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit.",
    sku: "037-12",
    category: "DINNERWEAR",
    tags: ["PLATES", "GOLDEN"],
    additionalInfo: {
      weight: "0.5 kg",
      dimensions: "26 x 26 x 3 cm",
      material: "Ceramic",
      care: "Hand wash only",
    },
  },
  {
    id: 12,
    name: "Rose Oval Plate",
    slug: "rose-oval-plate",
    price: "$300.00",
    image: "/images/product-3-300x300.jpg",
    images: [
      "/images/product-3.jpg",
      "/images/product-3-img-1.jpg",
      "/images/product-3-img-2.jpg",
      "/images/product-3-img-3.jpg",
    ],
    description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.",
    sku: "038-13",
    category: "DINNERWEAR",
    tags: ["PLATES", "ROSE"],
    additionalInfo: {
      weight: "0.6 kg",
      dimensions: "30 x 25 x 3 cm",
      material: "Ceramic",
      care: "Dishwasher safe",
    },
  },
  {
    id: 13,
    name: "Ocean Plate",
    slug: "ocean-plate",
    price: "$280.00",
    image: "/images/product-6-300x300.jpg",
    images: [
      "/images/product-6.jpg",
      "/images/product-6-img-1.jpg",
      "/images/product-6-img-2.jpg",
      "/images/product-6-img-3.jpg",
    ],
    description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.",
    sku: "039-14",
    category: "DINNERWEAR",
    tags: ["PLATES", "OCEAN"],
    additionalInfo: {
      weight: "0.5 kg",
      dimensions: "28 x 28 x 3 cm",
      material: "Ceramic",
      care: "Dishwasher safe",
    },
  },
  {
    id: 14,
    name: "Ceramic Bowl",
    slug: "ceramic-bowl",
    price: "$195.00",
    image: "/images/product-7-300x300.jpg",
    images: [
      "/images/product-7.jpg",
      "/images/product-7-img-1.jpg",
      "/images/product-7-img-2.jpg",
      "/images/product-7-img-3.jpg",
    ],
    description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa.",
    sku: "040-15",
    category: "DINNERWEAR",
    tags: ["BOWLS", "CERAMIC"],
    additionalInfo: {
      weight: "0.4 kg",
      dimensions: "18 x 18 x 10 cm",
      material: "Ceramic",
      care: "Dishwasher safe",
    },
  },
  {
    id: 15,
    name: "Modern Vase",
    slug: "modern-vase",
    price: "$320.00",
    image: "/images/product-18-300x300.jpg",
    images: [
      "/images/product-18.jpg",
      "/images/product-18-img-1.jpg",
      "/images/product-18-img-2.jpg",
      "/images/product-18-img-3.jpg",
    ],
    description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit.",
    sku: "041-16",
    category: "DECOR",
    tags: ["VASES", "MODERN"],
    additionalInfo: {
      weight: "0.7 kg",
      dimensions: "12 x 12 x 25 cm",
      material: "Ceramic",
      care: "Hand wash only",
    },
  },
];

// Helper functions
export const getProductBySlug = (slug: string): Product | null => {
  return allProducts.find((p) => p.slug === slug) || null;
};

export const getProductById = (id: number): Product | null => {
  return allProducts.find((p) => p.id === id) || null;
};

// Home page featured products (first 6)
export const featuredProducts = allProducts.slice(0, 6);

