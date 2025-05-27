import { pgTable, serial, text, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core"

// Tabla de vehículos (completamente gestionable por admin)
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'jetski' | 'boat'
  capacity: integer("capacity").notNull(),
  pricing: jsonb("pricing").notNull(), // Array de PricingOption
  includes: jsonb("includes").notNull(), // Array de strings
  fuelIncluded: boolean("fuel_included").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  available: boolean("available").default(true),
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
  bookingDate: timestamp("booking_date").notNull(),
  timeSlot: text("time_slot").notNull(), // "09:00-10:00"
  duration: text("duration").notNull(), // '30min', '1hour', 'halfday', 'fullday'
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending"), // 'pending', 'confirmed', 'cancelled', 'completed'
  paymentStatus: text("payment_status").default("pending"), // 'pending', 'paid', 'failed', 'refunded'
  paymentId: text("payment_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Tipos TypeScript
export type Vehicle = typeof vehicles.$inferSelect
export type NewVehicle = typeof vehicles.$inferInsert
export type Booking = typeof bookings.$inferSelect
export type NewBooking = typeof bookings.$inferInsert
export type User = typeof users.$inferSelect
export type Payment = typeof payments.$inferSelect
export type Setting = typeof settings.$inferSelect
