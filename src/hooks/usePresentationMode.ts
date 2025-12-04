/**
 * @file usePresentationMode.ts
 * @description Hook pour gérer le mode présentateur avec navigation clavier,
 * gestion du plein écran et contrôle des slides.
 */

import { useState, useEffect, useCallback } from "react";

interface UsePresentationModeOptions {
  totalSlides: number;
  onExit?: () => void;
}

export const usePresentationMode = ({ totalSlides, onExit }: UsePresentationModeOptions) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Navigation vers le slide suivant
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);

  // Navigation vers le slide précédent
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  // Navigation vers un slide spécifique
  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentIndex(index);
    }
  }, [totalSlides]);

  // Basculer le mode plein écran
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Erreur lors du basculement plein écran:", error);
    }
  }, []);

  // Quitter le mode plein écran
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Erreur lors de la sortie du plein écran:", error);
    }
  }, []);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si on est dans un champ de saisie
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case "ArrowRight":
        case "Space":
        case "PageDown":
          e.preventDefault();
          goToNext();
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          goToPrevious();
          break;
        case "Home":
          e.preventDefault();
          goToIndex(0);
          break;
        case "End":
          e.preventDefault();
          goToIndex(totalSlides - 1);
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "Escape":
          if (isFullscreen) {
            // Le navigateur gère la sortie du plein écran avec Escape
          } else if (onExit) {
            onExit();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrevious, goToIndex, toggleFullscreen, isFullscreen, onExit, totalSlides]);

  // Écouter les changements d'état du plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return {
    currentIndex,
    isFullscreen,
    goToNext,
    goToPrevious,
    goToIndex,
    toggleFullscreen,
    exitFullscreen,
    isFirstSlide: currentIndex === 0,
    isLastSlide: currentIndex === totalSlides - 1,
    progress: totalSlides > 0 ? ((currentIndex + 1) / totalSlides) * 100 : 0,
  };
};
