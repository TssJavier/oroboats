import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,

    // Admin
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || "NOT_SET",
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? "SET" : "NOT_SET",

    // Stripe
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? "SET" : "NOT_SET",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "SET" : "NOT_SET",
    STRIPE_SECRET_KEY_LIVE: process.env.STRIPE_SECRET_KEY_LIVE ? "SET" : "NOT_SET",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE ? "SET" : "NOT_SET",

    // Database
    DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT_SET",
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? "SET" : "NOT_SET",

    // Resend
    RESEND_API_KEY: process.env.RESEND_API_KEY ? "SET" : "NOT_SET",

    // JWT
    JWT_SECRET: process.env.JWT_SECRET ? "SET" : "NOT_SET",
  })
}
