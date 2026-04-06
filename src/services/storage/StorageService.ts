import type { StorageProvider } from "./types";
import { SupabaseStorageProvider } from "./providers/supabase";
import { R2StorageProvider } from "./providers/r2";

const providerName = import.meta.env.VITE_STORAGE_PROVIDER || "supabase";

export const storageService: StorageProvider =
  providerName === "r2"
    ? new R2StorageProvider()
    : new SupabaseStorageProvider();
