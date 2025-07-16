import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  jsonb,
  date,
  time,
  varchar,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Tabla de ubicaciones de playa
export const locations = pgTable("locations", {
  id: text("id").primaryKey(), // Usaremos slugs como 'la-herradura-granada'
  name: text("name").notNull(), // Nombre legible como 'La Herradura, Granada'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Tabla de vehículos (completamente gestionable por admin)
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'jetski' | 'boat'
  category: text("category").notNull(), // 'boat_no_license' | 'boat_with_license' | 'jetski_no_license' | 'jetski_with_license'
  requiresLicense: boolean("requires_license").default(false),
  capacity: integer("capacity").notNull(),
  pricing: jsonb("pricing").notNull(), // Array de PricingOption
  availableDurations: jsonb("available_durations").notNull(), // ["30min", "1hour", "halfday", "fullday"]
  includes: jsonb("includes").notNull(), // Array de strings
  fuelIncluded: boolean("fuel_included").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  available: boolean("available").default(true),
  customDurationEnabled: boolean("custom_duration_enabled").default(true),
  extraFeatures: jsonb("extra_features").default([]), // Array de ExtraFeature
  securityDeposit: numeric("security_deposit"), // Fianza en euros, ahora nullable
  manualDeposit: numeric("manual_deposit"), // Mapea a 'manual_deposit', ahora nullable
  stock: integer("stock").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  beachLocationId: text("beach_location_id").references(() => locations.id),
})

// Tabla de códigos de descuento
export const discountCodes = pgTable("discount_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  description: text("description").notNull(),
  discountType: varchar("discount_type", { length: 20 }).notNull(), // 'percentage' | 'fixed'
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
  minAmount: numeric("min_amount", { precision: 10, scale: 2 }).default("0"),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  active: boolean("active").default(true),
  createdBy: varchar("created_by", { length: 100 }).default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Tabla de reservas (sin registro obligatorio)
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerDni: text("customer_dni"), // Añadido DNI
  bookingDate: date("booking_date").notNull(), // Solo fecha
  timeSlot: text("time_slot"), // Añadido timeSlot
  duration: text("duration").notNull(), // '30min', '1hour', 'halfday', 'fullday'
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending"), // 'pending', 'confirmed', 'cancelled', 'completed'
  paymentStatus: text("payment_status").default("pending"), // 'pending', 'paid', 'failed', 'refunded'
  paymentId: text("payment_id"),
  notes: text("notes"),
  discountCode: varchar("discount_code", { length: 50 }),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).default("0"),
  originalPrice: numeric("original_price", { precision: 10, scale: 2 }),
  depositPaymentIntentId: varchar("deposit_payment_intent_id", { length: 255 }),
  securityDeposit: numeric("security_deposit"), // Fianza en euros, ahora nullable
  manualDeposit: numeric("manual_deposit"), // Mapea a 'manual_deposit', ahora nullable
  inspectionStatus: varchar("inspection_status", { length: 50 }).default("pending"),
  damageDescription: text("damage_description"),
  damageCost: numeric("damage_cost", { precision: 10, scale: 2 }).default("0"),
  liabilityWaiverId: integer("liability_waiver_id"), // Referencia sin foreign key para evitar circular
  isTestBooking: boolean("is_test_booking").default(false), // Indicador de reserva de prueba
  isManualBooking: boolean("is_manual_booking").default(false), // Indicador de reserva manual
  salesPerson: text("sales_person"), // Añadido salesPerson
  paymentType: varchar("payment_type", { length: 20 }).default("full_payment"), // 'full_payment' | 'partial_payment'
  amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }),
  amountPending: numeric("amount_pending", { precision: 10, scale: 2 }).default("0"),
  paymentLocation: varchar("payment_location", { length: 20 }).default("online"), // 'online' | 'on_site' | 'mixed'
  paymentMethod: varchar("payment_method", { length: 20 }), // 'cash' | 'card'
  beachLocationId: text("beach_location_id").references(() => locations.id), // Añadido beachLocationId
  hotelCode: text("hotel_code"), // ✅ NUEVO: Código de hotel
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Nueva tabla: Exenciones de responsabilidad
export const liabilityWaivers = pgTable("liability_waivers", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id"), // Referencia sin foreign key para evitar circular
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerDni: text("customer_dni"), // Añadido DNI
  signatureDate: timestamp("signature_date").defaultNow(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  waiverContent: text("waiver_content").notNull(),
  signedAt: timestamp("signed_at").defaultNow(),
  signatureData: text("signature_data"), // Campo para la imagen de la firma
  manualDeposit: numeric("manual_deposit"), // Añadir esta línea si no existe
  createdAt: timestamp("created_at").defaultNow(),
})

// ✅ NUEVA TABLA: Hoteles
export const hotels = pgTable("hotels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// ✅ NUEVA TABLA: Posts del blog
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(), // URL amigable
  excerpt: text("excerpt").notNull(), // Resumen corto
  content: text("content").notNull(), // Contenido completo en markdown/HTML
  featuredImage: text("featured_image"), // URL de imagen destacada
  language: varchar("language", { length: 2 }).notNull().default("es"), // 'es' | 'en'
  isFeatured: boolean("is_featured").default(false), // Solo uno puede ser featured por idioma
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  metaTitle: text("meta_title"), // SEO
  metaDescription: text("meta_description"), // SEO
  tags: jsonb("tags").default([]), // Array de tags
  readingTime: integer("reading_time").default(5), // Tiempo estimado de lectura en minutos
  views: integer("views").default(0), // Contador de vistas
  authorName: text("author_name").default("Oro Boats"),
  authorEmail: text("author_email"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Tabla de uso de códigos de descuento
export const discountUsage = pgTable("discount_usage", {
  id: serial("id").primaryKey(),
  discountCodeId: integer("discount_code_id").references(() => discountCodes.id),
  bookingId: integer("booking_id").references(() => bookings.id),
  customerEmail: varchar("customer_email", { length: 255 }),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }),
  usedAt: timestamp("used_at").defaultNow(),
})

// Tabla de configuración de emails
export const emailSettings = pgTable("email_settings", {
  id: serial("id").primaryKey(),
  settingKey: varchar("setting_key", { length: 100 }).unique().notNull(),
  settingValue: text("setting_value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Configuración de horarios por vehículo
export const vehicleAvailability = pgTable("vehicle_availability", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Domingo, 1=Lunes, etc.
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Días bloqueados globalmente (vacaciones, mantenimiento, etc.)
export const blockedDates = pgTable("blocked_dates", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  reason: text("reason").notNull(), // 'vacation', 'maintenance', 'weather', 'custom'
  description: text("description"),
  vehicleId: integer("vehicle_id").references(() => vehicles.id), // null = todos los vehículos
  createdAt: timestamp("created_at").defaultNow(),
})

// Tabla de usuarios opcionales (para clientes frecuentes)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  totalBookings: integer("total_bookings").default(0),
  loyaltyPoints: integer("loyalty_points").default(0),
  isAdmin: boolean("is_admin").default(false),
  role: varchar("role", { length: 20 }).default("comercial"), // 'admin' | 'comercial'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Tabla de pagos
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("EUR"),
  stripePaymentId: text("stripe_payment_id"),
  status: text("status").notNull(), // 'pending', 'succeeded', 'failed', 'cancelled'
  paymentMethod: text("payment_method"), // 'card', 'bizum', 'transfer'
  createdAt: timestamp("created_at").defaultNow(),
})

// Tabla de configuración del negocio (precios base, horarios, etc.)
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").unique().notNull(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Tabla de reglas de precios por vehículo
export const pricingRules = pgTable("pricing_rules", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id")
    .references(() => vehicles.id)
    .notNull(),
  duration: text("duration").notNull(), // '30min', '1hour', 'halfday', 'fullday'
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  label: text("label").notNull(), // Texto visible para el cliente
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// RELACIONES DE DRIZZLE ORM
export const vehiclesRelations = relations(vehicles, ({ many, one }) => ({
  bookings: many(bookings),
  location: one(locations, {
    fields: [vehicles.beachLocationId],
    references: [locations.id],
  }),
  vehicleAvailability: many(vehicleAvailability),
  blockedDates: many(blockedDates),
  pricingRules: many(pricingRules),
}))

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [bookings.vehicleId],
    references: [vehicles.id],
  }),
  location: one(locations, {
    fields: [bookings.beachLocationId],
    references: [locations.id],
  }),
  payments: many(payments),
  discountUsage: many(discountUsage),
  liabilityWaiver: one(liabilityWaivers, {
    fields: [bookings.liabilityWaiverId],
    references: [liabilityWaivers.id],
  }),
}))

export const locationsRelations = relations(locations, ({ many }) => ({
  vehicles: many(vehicles),
  bookings: many(bookings),
}))

export const discountCodesRelations = relations(discountCodes, ({ many }) => ({
  discountUsage: many(discountUsage),
}))

export const discountUsageRelations = relations(discountUsage, ({ one }) => ({
  discountCode: one(discountCodes, {
    fields: [discountUsage.discountCodeId],
    references: [discountCodes.id],
  }),
  booking: one(bookings, {
    fields: [discountUsage.bookingId],
    references: [bookings.id],
  }),
}))

export const liabilityWaiversRelations = relations(liabilityWaivers, ({ one }) => ({
  booking: one(bookings, {
    fields: [liabilityWaivers.bookingId],
    references: [bookings.id],
  }),
}))

// ✅ NUEVA RELACIÓN: Hoteles
export const hotelsRelations = relations(hotels, ({ many }) => ({
  // Si en el futuro se quisiera vincular bookings a hoteles, se haría aquí
}))

// ✅ NUEVA RELACIÓN: Blog Posts
export const blogPostsRelations = relations(blogPosts, ({ many }) => ({
  // Futuras relaciones con comentarios o categorías
}))

export const vehicleAvailabilityRelations = relations(vehicleAvailability, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [vehicleAvailability.vehicleId],
    references: [vehicles.id],
  }),
}))

export const blockedDatesRelations = relations(blockedDates, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [blockedDates.vehicleId],
    references: [vehicles.id],
  }),
}))

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}))

export const pricingRulesRelations = relations(pricingRules, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [pricingRules.vehicleId],
    references: [vehicles.id],
  }),
}))

// TIPOS TYPESCRIPT ACTUALIZADOS
export type Vehicle = typeof vehicles.$inferSelect
export type NewVehicle = typeof vehicles.$inferInsert
export type Booking = typeof bookings.$inferSelect
export type NewBooking = typeof bookings.$inferInsert
export type LiabilityWaiver = typeof liabilityWaivers.$inferSelect
export type NewLiabilityWaiver = typeof liabilityWaivers.$inferInsert
export type DiscountCode = typeof discountCodes.$inferSelect
export type NewDiscountCode = typeof discountCodes.$inferInsert
export type DiscountUsage = typeof discountUsage.$inferSelect
export type NewDiscountUsage = typeof discountUsage.$inferInsert
export type EmailSetting = typeof emailSettings.$inferSelect
export type NewEmailSetting = typeof emailSettings.$inferInsert
export type VehicleAvailability = typeof vehicleAvailability.$inferSelect
export type NewVehicleAvailability = typeof vehicleAvailability.$inferInsert
export type BlockedDate = typeof blockedDates.$inferSelect
export type NewBlockedDate = typeof blockedDates.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert
export type Setting = typeof settings.$inferSelect
export type NewSetting = typeof settings.$inferInsert
export type PricingRule = typeof pricingRules.$inferSelect
export type NewPricingRule = typeof pricingRules.$inferInsert
export type Location = typeof locations.$inferSelect
export type NewLocation = typeof locations.$inferInsert

// ✅ NUEVO TIPO: Hotel
export type Hotel = typeof hotels.$inferSelect
export type NewHotel = typeof hotels.$inferInsert

// ✅ NUEVO TIPO: Blog Post
export type BlogPost = typeof blogPosts.$inferSelect
export type NewBlogPost = typeof blogPosts.$inferInsert
