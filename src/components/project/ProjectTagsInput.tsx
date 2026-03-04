/**
 * Composant de saisie de tags pour les projets.
 * Supporte l'autocomplétion basée sur les tags existants,
 * la validation par Entrée ou virgule, et la suppression par clic.
 */

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAllTags, getTagColor, getTagBgColor } from "@/hooks/useProjectTags";

interface ProjectTagsInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export const ProjectTagsInput = ({ tags, onChange }: ProjectTagsInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { data: allTags = [] } = useAllTags();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Suggestions filtrées : tags existants qui ne sont pas déjà sélectionnés
  const suggestions = inputValue.trim()
    ? allTags.filter(
        (t) =>
          t.toLowerCase().includes(inputValue.toLowerCase()) &&
          !tags.includes(t)
      )
    : [];

  /** Ajoute un tag s'il n'existe pas déjà */
  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue("");
    setShowSuggestions(false);
  };

  /** Supprime un tag par son index */
  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  // Fermer les suggestions au clic externe
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">Tags</label>
      <div ref={containerRef} className="relative">
        {/* Badges des tags sélectionnés */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag, index) => (
              <Badge
                key={tag}
                variant="secondary"
                className="px-2 py-0.5 text-xs cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: getTagBgColor(tag),
                  color: getTagColor(tag),
                  borderColor: getTagColor(tag),
                  borderWidth: "1px",
                }}
                onClick={() => removeTag(index)}
              >
                {tag}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}

        {/* Champ de saisie */}
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Ajouter un tag (Entrée pour valider)..."
        />

        {/* Liste de suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-40 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(suggestion);
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Séparez les tags par Entrée ou virgule
      </p>
    </div>
  );
};
