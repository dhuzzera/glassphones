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
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
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
