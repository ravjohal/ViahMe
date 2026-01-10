import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, Plus } from "lucide-react";
import { useBudgetItemLibrary, type LibraryItem } from "@/hooks/use-ceremony-types";

const BUCKET_LABELS: Record<string, string> = {
  venue: "Venue",
  catering: "Catering",
  photography: "Photography",
  videography: "Videography",
  decoration: "Decoration",
  entertainment: "Entertainment",
  attire: "Attire & Beauty",
  religious: "Religious & Ceremonial",
  stationery: "Stationery & Gifts",
  transportation: "Transportation",
  favors: "Favors",
  other: "Other",
};

interface LibraryItemPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ceremonyName: string;
  onSelect: (item: LibraryItem) => void;
}

export function LibraryItemPicker({ open, onOpenChange, ceremonyName, onSelect }: LibraryItemPickerProps) {
  const { data: libraryData, isLoading } = useBudgetItemLibrary();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    if (!libraryData?.items) return {};
    
    const query = searchQuery.toLowerCase().trim();
    const filtered: Record<string, LibraryItem[]> = {};
    
    for (const item of libraryData.items) {
      if (query && !item.itemName.toLowerCase().includes(query)) {
        continue;
      }
      
      const bucket = item.budgetBucketId || "other";
      if (!filtered[bucket]) {
        filtered[bucket] = [];
      }
      filtered[bucket].push(item);
    }
    
    return filtered;
  }, [libraryData?.items, searchQuery]);

  const handleItemClick = (item: LibraryItem) => {
    onSelect(item);
    setSearchQuery("");
    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Item from Library</DialogTitle>
          <DialogDescription>
            Click an item to add it to {ceremonyName} with its estimated costs
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-library-search"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : (
          <ScrollArea className="flex-1 max-h-[400px]">
            <Accordion type="multiple" defaultValue={Object.keys(filteredItems)} className="w-full">
              {Object.entries(filteredItems).map(([bucket, items]) => (
                <AccordionItem key={bucket} value={bucket}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span>{BUCKET_LABELS[bucket] || bucket}</span>
                      <Badge variant="secondary" className="text-xs">
                        {items.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          className="w-full text-left p-3 rounded-md hover-elevate transition-colors group"
                          data-testid={`button-library-item-${item.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              <span className="font-medium">{item.itemName}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(item.lowCost)} - {formatCurrency(item.highCost)}
                            </span>
                          </div>
                          {item.ceremonies.length > 1 && (
                            <p className="text-xs text-muted-foreground mt-1 ml-6">
                              Found in {item.ceremonies.length} ceremonies
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            {Object.keys(filteredItems).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No items found matching your search" : "No items available"}
              </div>
            )}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
