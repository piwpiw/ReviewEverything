"use client";

import { useState, useEffect, useCallback } from "react";

export function useFavorites() {
    const [favorites, setFavorites] = useState<number[]>([]);

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

    const toggleFavorite = useCallback((id: number) => {
        setFavorites(prev => {
            const next = prev.includes(id)
                ? prev.filter(f => f !== id)
                : [...prev, id];

            // Save to localStorage
            localStorage.setItem("re_favorites", JSON.stringify(next));
            return next;
        });
    }, []);

    const isFavorite = useCallback((id: number) => {
        return favorites.includes(id);
    }, [favorites]);

    return { favorites, toggleFavorite, isFavorite };
}
