import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, DollarSign, Check } from "lucide-react";
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
  onSelect: (item: LibraryItem, amount: string) => void;
}

export function LibraryItemPicker({ open, onOpenChange, ceremonyName, onSelect }: LibraryItemPickerProps) {
  const { data: libraryData, isLoading } = useBudgetItemLibrary();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [amount, setAmount] = useState("");

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

  const handleSelect = () => {
    if (selectedItem && amount) {
      onSelect(selectedItem, amount);
      setSelectedItem(null);
      setAmount("");
      setSearchQuery("");
      onOpenChange(false);
    }
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
            Choose a budget item to add to {ceremonyName}
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
        ) : selectedItem ? (
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{selectedItem.itemName}</h3>
                <Badge variant="outline">{BUCKET_LABELS[selectedItem.budgetBucketId] || "Other"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Typical range: {formatCurrency(selectedItem.lowCost)} - {formatCurrency(selectedItem.highCost)}
              </p>
              {selectedItem.ceremonies.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Used in: {selectedItem.ceremonies.map(c => c.ceremonyName).join(", ")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget-amount">Your Budget for This Item</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="budget-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10"
                  data-testid="input-library-amount"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setSelectedItem(null)}
                className="flex-1"
                data-testid="button-back-to-list"
              >
                Back
              </Button>
              <Button 
                onClick={handleSelect}
                disabled={!amount || isNaN(parseFloat(amount))}
                className="flex-1"
                data-testid="button-add-library-item"
              >
                <Check className="h-4 w-4 mr-2" />
                Add to {ceremonyName}
              </Button>
            </div>
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
                          onClick={() => setSelectedItem(item)}
                          className="w-full text-left p-3 rounded-md hover-elevate transition-colors"
                          data-testid={`button-library-item-${item.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{item.itemName}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(item.lowCost)} - {formatCurrency(item.highCost)}
                            </span>
                          </div>
                          {item.ceremonies.length > 1 && (
                            <p className="text-xs text-muted-foreground mt-1">
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
