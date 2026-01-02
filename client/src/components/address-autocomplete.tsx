import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, X } from "lucide-react";

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface GeoapifyResult {
  properties: {
    formatted: string;
    street?: string;
    housenumber?: string;
    address_line1?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export interface ParsedAddress {
  formatted: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onAddressSelect?: (parsed: ParsedAddress) => void;
  placeholder?: string;
  disabled?: boolean;
  testid?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Enter address",
  disabled = false,
  testid = "input-address",
}: AddressAutocompleteProps) {
  const [geoapifySuggestions, setGeoapifySuggestions] = useState<GeoapifyResult[]>([]);
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
      setGeoapifySuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/address-autocomplete?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setGeoapifySuggestions(data.features || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      setGeoapifySuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      fetchAddressSuggestions(newValue);
    }, 300);
  };

  const handleSelectGeoapify = (result: GeoapifyResult) => {
    const props = result.properties;
    const formatted = props.formatted || "";
    
    setInputValue(formatted);
    onChange(formatted);
    
    if (onAddressSelect) {
      const street = props.address_line1 || 
        (props.housenumber && props.street ? `${props.housenumber} ${props.street}` : props.street) || 
        "";
      const city = props.city || props.town || props.village || "";
      
      onAddressSelect({
        formatted,
        street,
        city,
        state: props.state || "",
        postalCode: props.postcode || "",
        country: props.country || "",
      });
    }
    
    setShowSuggestions(false);
    setGeoapifySuggestions([]);
  };

  const handleClear = () => {
    setInputValue("");
    onChange("");
    if (onAddressSelect) {
      onAddressSelect({
        formatted: "",
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      });
    }
    setGeoapifySuggestions([]);
    setShowSuggestions(false);
  };

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

      {showSuggestions && geoapifySuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-input rounded-md shadow-md max-h-64 overflow-y-auto"
          data-testid="address-suggestions"
        >
          {geoapifySuggestions.map((result, idx) => (
            <Button
              key={idx}
              variant="ghost"
              onClick={() => handleSelectGeoapify(result)}
              className="w-full justify-start text-left font-normal h-auto py-2 px-3 rounded-none hover:bg-accent"
              data-testid={`suggestion-${idx}`}
            >
              <MapPin className="w-3 h-3 mr-2 text-muted-foreground flex-shrink-0" />
              <span className="text-sm line-clamp-2">{result.properties.formatted}</span>
            </Button>
          ))}
        </div>
      )}

      {showSuggestions && inputValue && geoapifySuggestions.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-input rounded-md shadow-md p-3">
          <p className="text-sm text-muted-foreground">No addresses found. Try a different search.</p>
        </div>
      )}
    </div>
  );
}
