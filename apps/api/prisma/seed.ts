/**
 * Seeds the database with:
 *  1. Categories (matching apps/web/src/lib/mockData.ts)
 *  2. Plans (buyer + seller tiers)
 *  3. Demo sellers + products so the frontend has real data to display
 *
 * Run with: npm run prisma:seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, PlanAudience } from "@prisma/client";
import { slugify } from "../src/lib/slugify";

const prisma = new PrismaClient();

async function seedCategories() {
  const names = ["Ceramics", "Jewelry", "Candles & Home", "Leather Goods", "Art Prints", "Textiles"];
  for (const name of names) {
    const slug = slugify(name);
    await prisma.category.upsert({ where: { slug }, update: { name }, create: { name, slug } });
  }
  console.log(`Seeded ${names.length} categories.`);
}

async function seedPlans() {
  const plans = [
    {
      audience: PlanAudience.BUYER,
      name: "Free",
      slug: "buyer-free",
      priceCents: 0,
      isDefault: true,
      perks: { freeShipping: false, earlyAccess: false, discountPercent: 0, adFree: false },
    },
    {
      audience: PlanAudience.BUYER,
      name: "Shoppan+",
      slug: "buyer-plus",
      priceCents: 600,
      isDefault: false,
      perks: { freeShipping: true, earlyAccess: true, discountPercent: 10, adFree: true },
    },
    {
      audience: PlanAudience.SELLER,
      name: "Starter",
      slug: "seller-starter",
      priceCents: 0,
      isDefault: true,
      perks: { commissionPercent: 12, searchBoost: 0, analytics: "basic" },
    },
    {
      audience: PlanAudience.SELLER,
      name: "Pro",
      slug: "seller-pro",
      priceCents: 1500,
      isDefault: false,
      perks: { commissionPercent: 6, searchBoost: 1, analytics: "advanced" },
    },
  ];
  for (const plan of plans) {
    await prisma.plan.upsert({ where: { slug: plan.slug }, update: plan, create: plan });
  }
  console.log(`Seeded ${plans.length} plans.`);
}

async function seedDemoData() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  // Category lookup helper
  async function cat(name: string) {
    const slug = slugify(name);
    const c = await prisma.category.findUnique({ where: { slug } });
    if (!c) throw new Error(`Category not found: ${name}`);
    return c.id;
  }

  // Seller helper: upsert user + seller profile
  async function upsertSeller(opts: {
    email: string;
    name: string;
    storeName: string;
    bio: string;
    verified: boolean;
  }) {
    const slug = slugify(opts.storeName);
    let user = await prisma.user.findUnique({ where: { email: opts.email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: opts.email, name: opts.name, passwordHash, role: "SELLER" },
      });
    }
    const existing = await prisma.sellerProfile.findUnique({ where: { slug } });
    if (existing) return existing;
    return prisma.sellerProfile.create({
      data: { userId: user.id, storeName: opts.storeName, slug, bio: opts.bio, verified: opts.verified },
    });
  }

  // Product helper: upsert by title + sellerId
  async function upsertProduct(opts: {
    sellerId: string;
    categoryId: string;
    title: string;
    description: string;
    priceCents: number;
    imageUrl?: string;
    stock: number;
  }) {
    const existing = await prisma.product.findFirst({
      where: { sellerId: opts.sellerId, title: opts.title },
    });
    if (existing) return existing;
    return prisma.product.create({ data: { ...opts, isActive: true } });
  }

  // ---- Demo sellers ----
  const willow = await upsertSeller({
    email: "willow@demo.shoppan",
    name: "Willow Studio",
    storeName: "Willow & Clay Studio",
    bio: "Wheel-thrown stoneware, made in small batches in Chiang Mai.",
    verified: true,
  });

  const northRidge = await upsertSeller({
    email: "north@demo.shoppan",
    name: "North Ridge",
    storeName: "North Ridge Leather",
    bio: "Full-grain leather goods, hand-stitched to order in Portland.",
    verified: true,
  });

  const emberWick = await upsertSeller({
    email: "ember@demo.shoppan",
    name: "Ember Wick",
    storeName: "Ember & Wick",
    bio: "Small-batch soy candles with botanical scents, made in Bristol.",
    verified: false,
  });

  const paperFox = await upsertSeller({
    email: "fox@demo.shoppan",
    name: "Paper Fox",
    storeName: "Paper Fox Prints",
    bio: "Original linocut & riso prints from our studio in Kyoto.",
    verified: true,
  });

  // ---- Demo products ----
  const ceramicsId = await cat("Ceramics");
  const leatherId = await cat("Leather Goods");
  const candlesId = await cat("Candles & Home");
  const printsId = await cat("Art Prints");
  const jewelryId = await cat("Jewelry");
  const textilesId = await cat("Textiles");

  await Promise.all([
    upsertProduct({
      sellerId: willow.id, categoryId: ceramicsId,
      title: "Speckled Stoneware Mug",
      description: "A sturdy wheel-thrown mug with a natural speckle glaze. Dishwasher safe, holds 12 oz.",
      priceCents: 2800, stock: 24,
      imageUrl: "https://picsum.photos/seed/mug1/400/400",
    }),
    upsertProduct({
      sellerId: willow.id, categoryId: ceramicsId,
      title: "Matte Cream Dinner Bowl Set",
      description: "Set of two generously sized dinner bowls in a matte cream glaze. Microwave and dishwasher safe.",
      priceCents: 6400, stock: 12,
      imageUrl: "https://picsum.photos/seed/bowl1/400/400",
    }),
    upsertProduct({
      sellerId: willow.id, categoryId: ceramicsId,
      title: "Raw-Edge Ceramic Vase",
      description: "A sculptural vase with an unglazed raw edge and a smooth interior glaze. Perfect for dried florals.",
      priceCents: 5200, stock: 8,
      imageUrl: "https://picsum.photos/seed/vase1/400/400",
    }),
    upsertProduct({
      sellerId: willow.id, categoryId: jewelryId,
      title: "Hammered Brass Hoop Earrings",
      description: "Hand-hammered brass hoops with a warm antique finish. Hypoallergenic ear wires.",
      priceCents: 3600, stock: 20,
      imageUrl: "https://picsum.photos/seed/earrings1/400/400",
    }),
    upsertProduct({
      sellerId: northRidge.id, categoryId: leatherId,
      title: "Hand-Stitched Card Wallet",
      description: "Slim bifold wallet in full-grain vegetable-tanned leather. Fits 6 cards and folds flat.",
      priceCents: 4600, stock: 15,
      imageUrl: "https://picsum.photos/seed/wallet1/400/400",
    }),
    upsertProduct({
      sellerId: northRidge.id, categoryId: leatherId,
      title: "Weekender Leather Duffel",
      description: "A weekend bag in full-grain leather with brass hardware. Fits a 3-day trip comfortably.",
      priceCents: 21800, stock: 4,
      imageUrl: "https://picsum.photos/seed/duffel1/400/400",
    }),
    upsertProduct({
      sellerId: northRidge.id, categoryId: leatherId,
      title: "Minimal Leather Watch Strap",
      description: "22mm quick-release strap in natural tan leather. Fits most standard lug-width watches.",
      priceCents: 3400, stock: 30,
      imageUrl: "https://picsum.photos/seed/strap1/400/400",
    }),
    upsertProduct({
      sellerId: emberWick.id, categoryId: candlesId,
      title: "Cedar & Fig Soy Candle",
      description: "A 200g soy wax candle with notes of cedar wood, fig leaf, and warm amber. 40-hour burn.",
      priceCents: 2400, stock: 40,
      imageUrl: "https://picsum.photos/seed/candle1/400/400",
    }),
    upsertProduct({
      sellerId: emberWick.id, categoryId: candlesId,
      title: "Amber Glass Candle Trio",
      description: "Three 100g soy candles in amber glass vessels: eucalyptus, lemon verbena, and rosemary.",
      priceCents: 5800, stock: 18,
      imageUrl: "https://picsum.photos/seed/candle2/400/400",
    }),
    upsertProduct({
      sellerId: emberWick.id, categoryId: textilesId,
      title: "Chunky Wool Throw Blanket",
      description: "Hand-knitted in a merino-blend yarn. Oversized at 130×180 cm, machine washable on cold.",
      priceCents: 8900, stock: 6,
      imageUrl: "https://picsum.photos/seed/throw1/400/400",
    }),
    upsertProduct({
      sellerId: paperFox.id, categoryId: printsId,
      title: "Quiet Morning — Linocut Print",
      description: "A three-colour linocut print on 300gsm cold-pressed paper. Signed and numbered edition of 50.",
      priceCents: 3800, stock: 22,
      imageUrl: "https://picsum.photos/seed/print1/400/400",
    }),
    upsertProduct({
      sellerId: paperFox.id, categoryId: printsId,
      title: "Terraced Hills Riso Print, A3",
      description: "Two-colour risograph print of terraced rice fields at dusk. A3 size on uncoated stock.",
      priceCents: 3200, stock: 35,
      imageUrl: "https://picsum.photos/seed/print2/400/400",
    }),
  ]);

  // ---- Demo buyer account ----
  const buyerEmail = "buyer@demo.shoppan";
  const existingBuyer = await prisma.user.findUnique({ where: { email: buyerEmail } });
  if (!existingBuyer) {
    await prisma.user.create({
      data: { email: buyerEmail, name: "Demo Buyer", passwordHash, role: "BUYER" },
    });
  }

  console.log("Seeded 4 demo sellers, 12 demo products, and 1 demo buyer.");
  console.log("Demo login: buyer@demo.shoppan / demo1234");
  console.log("Seller logins: willow@demo.shoppan, north@demo.shoppan, ember@demo.shoppan, fox@demo.shoppan / demo1234");
}

async function main() {
  await seedCategories();
  await seedPlans();
  await seedDemoData();
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
