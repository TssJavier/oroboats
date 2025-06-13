import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  jsonb,
  date,
  time,
  varchar,
} from "drizzle-orm/pg-core"

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
  // ✅ NUEVAS COLUMNAS AÑADIDAS
  extraFeatures: jsonb("extra_features").default([]), // Array de ExtraFeature
  securityDeposit: decimal("security_deposit", { precision: 10, scale: 2 }).default("0"), // Fianza en euros
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// ✅ TABLA DE CÓDIGOS DE DESCUENTO
export const discountCodes = pgTable("discount_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  description: text("description").notNull(),
  discountType: varchar("discount_type", { length: 20 }).notNull(), // 'percentage' | 'fixed'
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minAmount: decimal("min_amount", { precision: 10, scale: 2 }).default("0"),
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
  bookingDate: date("booking_date").notNull(), // Solo fecha
  startTime: time("start_time").notNull(), // Hora inicio
  endTime: time("end_time").notNull(), // Hora fin
  duration: text("duration").notNull(), // '30min', '1hour', 'halfday', 'fullday'
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending"), // 'pending', 'confirmed', 'cancelled', 'completed'
  paymentStatus: text("payment_status").default("pending"), // 'pending', 'paid', 'failed', 'refunded'
  paymentId: text("payment_id"),
  notes: text("notes"),
  // ✅ NUEVAS COLUMNAS PARA DESCUENTOS Y PAGOS
  discountCode: varchar("discount_code", { length: 50 }),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  depositPaymentIntentId: varchar("deposit_payment_intent_id", { length: 255 }),
  securityDeposit: decimal("security_deposit", { precision: 10, scale: 2 }).default("0"),
  inspectionStatus: varchar("inspection_status", { length: 50 }).default("pending"),
  damageDescription: text("damage_description"),
  damageCost: decimal("damage_cost", { precision: 10, scale: 2 }).default("0"),
  liabilityWaiverId: integer("liability_waiver_id"), // Referencia sin foreign key para evitar circular
  isTestBooking: boolean("is_test_booking").default(false), // ✅ AÑADIDO: Indicador de reserva de prueba
  // ✅ NUEVOS CAMPOS PARA PAGO PARCIAL
  paymentType: varchar("payment_type", { length: 20 }).default("full_payment"), // 'full_payment' | 'partial_payment'
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }),
  amountPending: decimal("amount_pending", { precision: 10, scale: 2 }).default("0"),
  paymentLocation: varchar("payment_location", { length: 20 }).default("online"), // 'online' | 'on_site' | 'mixed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// ✅ NUEVA TABLA: Exenciones de responsabilidad
export const liabilityWaivers = pgTable("liability_waivers", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id"), // Referencia sin foreign key para evitar circular
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  signatureDate: timestamp("signature_date").defaultNow(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  waiverContent: text("waiver_content").notNull(),
  signedAt: timestamp("signed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
})

// Ahora añadimos las referencias después de definir todas las tablas
// para evitar referencias circulares
// Esto no afecta al esquema SQL, solo a los tipos de TypeScript

// ✅ TABLA DE USO DE CÓDIGOS DE DESCUENTO
export const discountUsage = pgTable("discount_usage", {
  id: serial("id").primaryKey(),
  discountCodeId: integer("discount_code_id").references(() => discountCodes.id),
  bookingId: integer("booking_id").references(() => bookings.id),
  customerEmail: varchar("customer_email", { length: 255 }),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
  usedAt: timestamp("used_at").defaultNow(),
})

// ✅ TABLA DE CONFIGURACIÓN DE EMAILS
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Tabla de pagos
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
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
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  label: text("label").notNull(), // Texto visible para el cliente
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// ✅ TIPOS TYPESCRIPT ACTUALIZADOS
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
