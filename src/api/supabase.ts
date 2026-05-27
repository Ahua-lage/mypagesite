import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase environment variables are not set");
}

export interface Postcard {
  id: number;
  author: string;
  body: string;
  date: string;
  isPublished: boolean;
  marginBottom?: number | null;
  marginRight?: number | null;
  rotation?: number | null;
  penColor?: string | null;
  paperColor?: string | null;
  fontSizeFactor?: number | null;
  lineHeight?: number | null;
  authorLeftOffset?: number | null;
  authorTopOffset?: number | null;
  authorRotation?: number | null;
  dateLeftOffset?: number | null;
  dateTopOffset?: number | null;
  dateRotation?: number | null;
  bodyLeftOffset?: number | null;
  bodyTopOffset?: number | null;
  bodyRotation?: number | null;
  stampSvg?: string | null;
  country?: string | null;
  province?: string | null;
  websiteUrl?: string | null;
  postOfficeStampTop?: number | null;
  postOfficeStampRight?: number | null;
  postOfficeStampRotation?: number | null;
  wavyStampTop?: number | null;
  wavyStampRight?: number | null;
  wavyStampRotation?: number | null;
}

export interface NewPostcard {
  author: string;
  body: string;
  date: string | Date;
  isPublished: boolean;
  marginBottom?: number;
  marginRight?: number;
  rotation?: number;
  penColor?: string;
  paperColor?: string;
  fontSizeFactor?: number;
  lineHeight?: number;
  authorLeftOffset?: number;
  authorTopOffset?: number;
  authorRotation?: number;
  dateLeftOffset?: number;
  dateTopOffset?: number;
  dateRotation?: number;
  bodyLeftOffset?: number;
  bodyTopOffset?: number;
  bodyRotation?: number;
  stampSvg?: string;
  country?: string;
  province?: string;
  websiteUrl?: string;
  postOfficeStampTop?: number;
  postOfficeStampRight?: number;
  postOfficeStampRotation?: number;
  wavyStampTop?: number;
  wavyStampRight?: number;
  wavyStampRotation?: number;
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseInstance) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn("Supabase environment variables are not configured, returning null");
      return null;
    }
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
      },
    });
  }
  return supabaseInstance;
}

export async function getPostcards(
  options: { limit?: number; country?: string; onlyPublished?: boolean } = {},
): Promise<Postcard[]> {
  const { limit, country, onlyPublished = true } = options;
  const supabase = getSupabaseClient();

  if (!supabase) {
    console.warn("No Supabase client available, returning empty postcards");
    return [];
  }

  let query = supabase.from("Postcard").select("*");

  if (onlyPublished) {
    query = query.eq("isPublished", true);
  }

  if (country) {
    query = query.eq("country", country);
  }

  query = query.order("date", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching postcards:", error);
    return [];
  }

  return data as Postcard[];
}

export async function insertPostcard(
  postcard: NewPostcard,
): Promise<Postcard | null> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    console.warn("No Supabase client available, cannot insert postcard");
    return null;
  }

  const { data, error } = await supabase
    .from("Postcard")
    .insert({
      ...postcard,
      date:
        postcard.date instanceof Date
          ? postcard.date.toISOString().split("T")[0]
          : postcard.date,
    })
    .select()
    .single();

  if (error) {
    console.error("Error inserting postcard:", error);
    return null;
  }

  return data as Postcard;
}

export async function checkDuplicatePostcard(
  author: string,
  body: string,
  sinceDate: Date,
): Promise<boolean> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    console.warn("No Supabase client available, skipping duplicate check");
    return false;
  }

  const { data, error } = await supabase
    .from("Postcard")
    .select("id")
    .eq("author", author)
    .eq("body", body)
    .gt("date", sinceDate.toISOString().split("T")[0])
    .limit(1);

  if (error) {
    console.error("Error checking for duplicate postcard:", error);
    return false;
  }

  return data && data.length > 0;
}

export async function getUniqueCountries(): Promise<string[]> {
  const postcards = await getPostcards({ onlyPublished: true });
  const countries = [
    ...new Set(
      postcards
        .map((p) => p.country)
        .filter((c): c is string => c !== null && c !== undefined && c !== ""),
    ),
  ];
  return countries;
}
