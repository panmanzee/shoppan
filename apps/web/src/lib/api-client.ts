// ---------------------------------------------------------------------------
// Typed API client for the Shoppan Express backend.
// All requests include credentials (httpOnly cookie) so auth works across
// localhost ports. Uses NEXT_PUBLIC_API_URL from .env.local.
// ---------------------------------------------------------------------------

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body?.error?.message ?? res.statusText);
  return body as T;
}

// ---------- Auth ----------
export const authApi = {
  signup: (data: { name: string; email: string; password: string; role: "BUYER" | "SELLER" }) =>
    req<{ user: User }>("/auth/signup", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    req<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  logout: () => req<void>("/auth/logout", { method: "POST" }),
};

// ---------- Users ----------
export const usersApi = {
  me: () => req<{ user: User & { sellerProfile: SellerProfile | null } }>("/users/me"),
  becomeSeller: (data: { storeName: string; bio?: string }) =>
    req<{ sellerProfile: SellerProfile }>("/users/me/become-seller", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateSellerProfile: (data: { storeName?: string; bio?: string; avatarUrl?: string; bannerUrl?: string }) =>
    req<{ sellerProfile: SellerProfile }>("/users/me/seller-profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ---------- Products ----------
export const productsApi = {
  list: (params?: { category?: string; page?: number; pageSize?: number }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.page) q.set("page", String(params.page));
    if (params?.pageSize) q.set("pageSize", String(params.pageSize));
    const qs = q.toString();
    return req<{ products: Product[]; pagination: Pagination }>(`/products${qs ? `?${qs}` : ""}`);
  },
  getOne: (id: string) => req<{ product: Product }>(`/products/${id}`),
  // Seller's own listings
  mine: () => req<{ products: Product[] }>("/products/mine"),
  create: (data: CreateProductInput) =>
    req<{ product: Product }>("/products", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateProductInput>) =>
    req<{ product: Product }>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => req<void>(`/products/${id}`, { method: "DELETE" }),
};

// ---------- Sellers ----------
export const sellersApi = {
  list: () => req<{ sellers: SellerProfile[] }>("/sellers"),
  getBySlug: (slug: string) =>
    req<{ seller: SellerProfile & { products: Product[] } }>(`/sellers/${slug}`),
};

// ---------- Categories ----------
export const categoriesApi = {
  list: () => req<{ categories: Category[] }>("/categories"),
};

// ---------- Checkout ----------
export const checkoutApi = {
  checkout: (items: { productId: string; quantity: number }[]) =>
    req<{ orders: Order[]; grandTotalCents: number }>("/checkout", {
      method: "POST",
      body: JSON.stringify({ items }),
    }),
};

// ---------- Orders ----------
export const ordersApi = {
  mine: () => req<{ orders: Order[] }>("/orders/mine"),
  selling: () => req<{ orders: Order[] }>("/orders/selling"),
  fulfill: (id: string) => req<{ order: Order }>(`/orders/${id}/fulfill`, { method: "PATCH" }),
};

// ---------- Reviews ----------
export const reviewsApi = {
  forProduct: (productId: string) => req<{ reviews: Review[] }>(`/products/${productId}/reviews`),
  createForProduct: (productId: string, data: { rating: number; comment?: string }) =>
    req<{ review: Review }>(`/products/${productId}/reviews`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ---------- Plans ----------
export const plansApi = {
  list: () => req<{ plans: Plan[] }>("/plans"),
};

// ---------- Subscriptions ----------
export const subscriptionsApi = {
  mine: () => req<{ subscriptions: Subscription[] }>("/subscriptions/mine"),
  subscribe: (planId: string) =>
    req<{ subscription: Subscription }>("/subscriptions", {
      method: "POST",
      body: JSON.stringify({ planId }),
    }),
  cancel: (id: string) => req<void>(`/subscriptions/${id}`, { method: "DELETE" }),
};

// ---------- Admin ----------
export const adminApi = {
  stats: () => req<{ stats: AdminStats; recentOrders: Order[] }>("/admin/stats"),
};

// ---------- Recommendations ----------
export const recommendationsApi = {
  forMe: () => req<{ products: Product[] }>("/recommendations/me"),
  similar: (productId: string) =>
    req<{ products: Product[] }>(`/products/${productId}/similar`),
};

// ---------------------------------------------------------------------------
// Types — mirror the Prisma schema shapes returned by the API
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  name: string;
  email: string;
  role: "BUYER" | "SELLER" | "ADMIN";
}

export interface SellerProfile {
  id: string;
  userId: string;
  storeName: string;
  slug: string;
  bio?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  verified: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  imageUrl?: string | null;
  stock: number;
  isActive: boolean;
  createdAt: string;
  seller: SellerProfile;
  category: Category;
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPriceCents: number;
  productId: string;
  product?: Product;
}

export interface Order {
  id: string;
  status: string;
  subtotalCents: number;
  discountCents: number;
  commissionCents: number;
  sellerPayoutCents: number;
  createdAt: string;
  sellerId: string;
  buyerId: string;
  items: OrderItem[];
  seller?: SellerProfile;
  buyer?: { id: string; name: string };
}

export interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  author: { id: string; name: string };
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  audience: "BUYER" | "SELLER";
  priceCents: number;
  billingPeriod: string;
  perks: Record<string, unknown>;
  isDefault: boolean;
}

export interface Subscription {
  id: string;
  status: "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING";
  currentPeriodEnd?: string | null;
  plan: Plan;
}

export interface AdminStats {
  userCount: number;
  productCount: number;
  orderCount: number;
  totalRevenueCents: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface CreateProductInput {
  title: string;
  description: string;
  priceCents: number;
  categorySlug: string;
  imageUrl?: string;
  stock: number;
  isActive?: boolean;
}

// ---------- Helpers ----------

/** Convert API priceCents to a formatted dollar string */
export function cents(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(2).replace(/\.00$/, "")}`;
}

/** Resolve a product image: use stored URL or fall back to picsum */
export function productImage(product: Product, size = 400): string {
  return product.imageUrl ?? `https://picsum.photos/seed/${product.id}/${size}/${size}`;
}

/** Resolve a seller avatar URL */
export function sellerAvatar(seller: SellerProfile): string {
  return (
    seller.avatarUrl ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.storeName)}&background=5B4FE8&color=fff`
  );
}

/** Resolve a seller banner URL */
export function sellerBanner(seller: SellerProfile): string {
  return seller.bannerUrl ?? `https://picsum.photos/seed/${seller.slug}-banner/1600/400`;
}
