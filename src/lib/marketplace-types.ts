// Tipos manuais das tabelas do marketplace
export type ProductKind = "product" | "service";
export type CategoryType = "product" | "service";
export type OrderStatus = "pending" | "confirmed" | "paid" | "delivered" | "cancelled";
export type DeliveryMethod = "pickup" | "whatsapp_shipping";
export type AppRole = "admin" | "customer";

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
  created_at: string;
}
