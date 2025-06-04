import { pgTable, serial, text, integer, boolean, timestamp, decimal, jsonb, date, time } from "drizzle-orm/pg-core"

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
  createdAt: timestamp("created_at").defaultNow(),
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

// Tipos TypeScript
export type Vehicle = typeof vehicles.$inferSelect
export type NewVehicle = typeof vehicles.$inferInsert
export type Booking = typeof bookings.$inferSelect
export type NewBooking = typeof bookings.$inferInsert
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
