import { useState, useEffect, useCallback } from "react";

/**
 * useFavorites options
 * お気に入り管理オプション
 */
export interface UseFavoritesOptions {
  /** LocalStorage key (default: "liqueur:favorites") */
  storageKey?: string;

  /** Callback when favorites change */
  onChange?: (favorites: Set<string>) => void;
}

/**
 * useFavorites return type
 * お気に入り管理戻り値型
 */
export interface UseFavoritesReturn {
  /** お気に入りダッシュボードIDのセット */
  favorites: Set<string>;

  /** お気に入りトグル関数 */
  toggleFavorite: (id: string) => void;

  /** お気に入り判定関数 */
  isFavorite: (id: string) => boolean;
}

/**
 * Load favorites from localStorage
 * LocalStorageからお気に入りを読み込み
 */
function loadFavorites(storageKey: string): Set<string> {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Set(Array.isArray(parsed) ? parsed : []);
    }
  } catch (error) {
    console.warn("Failed to load favorites from localStorage:", error);
  }
  return new Set();
}

/**
 * Save favorites to localStorage
 * お気に入りをLocalStorageに保存
 */
function saveFavorites(favorites: Set<string>, storageKey: string): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(Array.from(favorites)));
  } catch (error) {
    console.warn("Failed to save favorites to localStorage:", error);
  }
}

/**
 * useFavorites hook
 * ダッシュボードお気に入り管理カスタムフック
 *
 * @param options - オプション
 * @returns お気に入り管理関数と状態
 *
 * @example
 * ```tsx
 * const { favorites, toggleFavorite, isFavorite } = useFavorites();
 *
 * // Check if a dashboard is favorite
 * if (isFavorite("dashboard-id")) {
 *   console.log("This dashboard is a favorite!");
 * }
 *
 * // Toggle favorite
 * toggleFavorite("dashboard-id");
 *
 * // Get all favorites
 * console.log("Favorites:", Array.from(favorites));
 * ```
 */
export function useFavorites(options: UseFavoritesOptions = {}): UseFavoritesReturn {
  const { storageKey = "liqueur:favorites", onChange } = options;

  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites(storageKey));

  // Sync to localStorage when favorites change
  useEffect(() => {
    saveFavorites(favorites, storageKey);
    onChange?.(favorites);
  }, [favorites, storageKey, onChange]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (id: string) => {
      return favorites.has(id);
    },
    [favorites]
  );

  return {
    favorites,
    toggleFavorite,
    isFavorite,
  };
}
