import { z } from 'zod';

const envSchema = z.object({
  // Core variables
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  
  // Database configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // External providers
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_MAPS_KEY: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY: z.string().optional(),
  
  // Email configuration
  EMAIL_PROVIDER_KEY: z.string().optional(),
  EMAIL_SENDER_ADDRESS: z.string().email().optional(),
  ADMIN_NOTIFICATION_ADDRESS: z.string().email().optional(),
});

const envParse = envSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  NEXT_PUBLIC_GOOGLE_MAPS_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY,
  NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  EMAIL_PROVIDER_KEY: process.env.EMAIL_PROVIDER_KEY,
  EMAIL_SENDER_ADDRESS: process.env.EMAIL_SENDER_ADDRESS,
  ADMIN_NOTIFICATION_ADDRESS: process.env.ADMIN_NOTIFICATION_ADDRESS,
});

if (!envParse.success) {
  console.error("❌ Invalid environment variables:", envParse.error.format());
}

export const env = envParse.success ? envParse.data : {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  NEXT_PUBLIC_GOOGLE_MAPS_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY,
  NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  EMAIL_PROVIDER_KEY: process.env.EMAIL_PROVIDER_KEY,
  EMAIL_SENDER_ADDRESS: process.env.EMAIL_SENDER_ADDRESS,
  ADMIN_NOTIFICATION_ADDRESS: process.env.ADMIN_NOTIFICATION_ADDRESS,
};
