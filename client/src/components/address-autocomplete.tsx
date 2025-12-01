import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, X } from "lucide-react";

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  disabled?: boolean;
  testid?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Enter address",
  disabled = false,
  testid = "input-address",
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const fetchAddressSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
      );
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced search
    timeoutRef.current = setTimeout(() => {
      fetchAddressSuggestions(newValue);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setInputValue(suggestion.display_name);
    onChange(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleClear = () => {
    setInputValue("");
    onChange("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="relative flex items-center gap-1">
        <div className="flex-1 relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            data-testid={testid}
            className="pl-10 pr-10"
          />
          {inputValue && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleClear}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 h-auto px-2"
              data-testid="button-clear-address"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        {loading && (
          <div className="px-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-input rounded-md shadow-md max-h-64 overflow-y-auto"
          data-testid="address-suggestions"
        >
          {suggestions.map((suggestion, idx) => (
            <Button
              key={idx}
              variant="ghost"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full justify-start text-left font-normal h-auto py-2 px-3 rounded-none hover:bg-accent"
              data-testid={`suggestion-${idx}`}
            >
              <MapPin className="w-3 h-3 mr-2 text-muted-foreground flex-shrink-0" />
              <span className="text-sm line-clamp-2">{suggestion.display_name}</span>
            </Button>
          ))}
        </div>
      )}

      {showSuggestions && inputValue && suggestions.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-input rounded-md shadow-md p-3">
          <p className="text-sm text-muted-foreground">No addresses found. Try a different search.</p>
        </div>
      )}
    </div>
  );
}
