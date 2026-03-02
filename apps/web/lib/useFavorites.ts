"use client";

import { useState, useEffect, useCallback } from "react";

export function useFavorites() {
    const [favorites, setFavorites] = useState<string[]>([]);

    useEffect(() => {
        // Load from localStorage on mount
        const saved = localStorage.getItem("re_favorites");
        if (saved) {
            try {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setFavorites(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load favorites", e);
            }
        }
    }, []);

    const toggleFavorite = useCallback((id: string | number) => {
        const favoriteId = String(id);
        setFavorites(prev => {
            const next = prev.includes(favoriteId)
                ? prev.filter(f => f !== favoriteId)
                : [...prev, favoriteId];

            // Save to localStorage
            localStorage.setItem("re_favorites", JSON.stringify(next));
            return next;
        });
    }, []);

    const isFavorite = useCallback((id: string | number) => {
        return favorites.includes(String(id));
    }, [favorites]);

    return { favorites, toggleFavorite, isFavorite };
}
