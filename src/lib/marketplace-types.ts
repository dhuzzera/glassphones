// Tipos manuais das tabelas do marketplace
export type ProductKind = "product" | "service";
export type CategoryType = "product" | "service";
export type OrderStatus = "pending" | "confirmed" | "paid" | "delivered" | "cancelled";
export type DeliveryMethod = "pickup" | "whatsapp_shipping";
export type AppRole = "admin" | "customer";
export type ProductCondition = "novo" | "semi-novo" | "usado";
export type OrderSource = "site" | "whatsapp" | "trade-in" | "loja-fisica";
export type LeadStatus = "new" | "contacted" | "negotiating" | "won" | "lost";

export interface Category {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  sort_order: number;
  created_at: string;
  image_url: string | null;
  featured: boolean;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  kind: ProductKind;
  image_urls: string[];
  featured: boolean;
  active: boolean;
  stock: number | null;
  battery_health: number | null;
  condition: ProductCondition | null;
  specs: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

// attributes: { [attrName]: value }  ex.: { "Cor": "Preto", "Capacidade": "128GB" }
export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string | null;
  attributes: Record<string, string>;
  price_cents: number | null; // null = herda de products.price_cents
  stock: number | null;
  image_url: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
  variant_id?: string | null;
  variant_label?: string | null;
  name: string;
  price_cents: number;
  quantity: number;
  kind: ProductKind;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  items: OrderItem[];
  total_cents: number;
  delivery_method: DeliveryMethod;
  notes: string | null;
  status: OrderStatus;
  source: OrderSource | null;
  created_at: string;
}

export interface TradeInLead {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  marca: string;
  modelo: string;
  estado: "perfeito" | "bom" | "regular" | "danificado";
  bateria: number;
  estimativa_min: number;
  estimativa_max: number;
  cidade_origem: string | null;
  produto_origem: string | null;
  origem: string | null;
  referrer: string | null;
  status: LeadStatus;
  notes: string | null;
}

export interface Review {
  id: string;
  author_name: string;
  city: string | null;
  rating: number;
  comment: string;
  approved: boolean;
  product_id: string | null;
  photo_url: string | null;
  created_at: string;
}
