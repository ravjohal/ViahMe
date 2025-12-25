import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DollarSign, HelpCircle, CheckCircle2, AlertTriangle, Lightbulb, MapPin, ChevronDown, ChevronUp, Info } from "lucide-react";
import { 
  getCityCostForCategory, 
  getVendorCategoryInfo, 
  formatCostRange,
  normalizeToKnownCity,
  KNOWN_CITIES,
  type CityVendorCost,
  type VendorCategoryInfo
} from "@/lib/vendor-guidance";

interface VendorCategoryGuideProps {
  category: string;
  categoryLabel: string;
  userCity?: string;
  onClose?: () => void;
}

export function VendorCategoryGuide({ 
  category, 
  categoryLabel, 
  userCity = "San Francisco Bay Area",
  onClose 
}: VendorCategoryGuideProps) {
  const [showAllCities, setShowAllCities] = useState(false);
  
  const normalizedCity = normalizeToKnownCity(userCity);
  const costInfo = getCityCostForCategory(normalizedCity, category);
  const categoryInfo = getVendorCategoryInfo(category);

  if (!costInfo && !categoryInfo) {
    return null;
  }

  return (
    <Card className="p-5 border-primary/20 bg-gradient-to-br from-primary/5 to-orange-50/30" data-testid="vendor-category-guide">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              {categoryLabel} Guide
            </h3>
            <p className="text-sm text-muted-foreground">
              Everything you need to know before booking
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
            <ChevronUp className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Cost Estimates Section */}
      {costInfo && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <h4 className="font-medium text-sm">Typical Pricing in {normalizedCity}</h4>
          </div>
          
          <div className="p-4 rounded-lg bg-white border">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-emerald-700" data-testid="text-cost-range">
                {formatCostRange(costInfo)}
              </span>
            </div>
            {costInfo.notes && (
              <p className="text-sm text-muted-foreground">{costInfo.notes}</p>
            )}
          </div>

          {/* Other Cities */}
          <div className="mt-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAllCities(!showAllCities)}
              className="text-sm text-muted-foreground hover:text-foreground"
              data-testid="button-toggle-cities"
            >
              <MapPin className="w-3 h-3 mr-1" />
              Compare other cities
              {showAllCities ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </Button>
            
            {showAllCities && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {KNOWN_CITIES.filter(city => city !== normalizedCity).map(city => {
                  const cityCost = getCityCostForCategory(city, category);
                  if (!cityCost) return null;
                  return (
                    <div key={city} className="p-3 rounded-lg bg-muted/50 text-sm">
                      <div className="font-medium text-foreground">{city}</div>
                      <div className="text-muted-foreground">{formatCostRange(cityCost)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Info Sections */}
      {categoryInfo && (
        <div className="space-y-4">
          {/* Description */}
          {categoryInfo.description && (
            <p className="text-sm text-muted-foreground">{categoryInfo.description}</p>
          )}

          {/* What to Look For */}
          {categoryInfo.whatToLookFor.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h4 className="font-medium text-sm">What to Look For</h4>
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {categoryInfo.whatToLookFor.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Red Flags */}
          {categoryInfo.redFlags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h4 className="font-medium text-sm">Red Flags to Watch</h4>
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {categoryInfo.redFlags.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Booking Tips */}
          {categoryInfo.bookingTips.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                <h4 className="font-medium text-sm">Booking Tips</h4>
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {categoryInfo.bookingTips.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">{idx + 1}.</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* FAQs Accordion */}
          {categoryInfo.faqs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-sm">Frequently Asked Questions</h4>
              </div>
              <Accordion type="single" collapsible className="w-full">
                {categoryInfo.faqs.map((faq, idx) => (
                  <AccordionItem key={idx} value={`faq-${idx}`} className="border-b-0">
                    <AccordionTrigger 
                      className="text-sm text-left py-3 hover:no-underline"
                      data-testid={`accordion-faq-${idx}`}
                    >
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-3">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

interface VendorCategoryGuideBadgeProps {
  category: string;
  categoryLabel: string;
  userCity?: string;
}

export function VendorCategoryGuideBadge({ 
  category, 
  categoryLabel, 
  userCity = "San Francisco Bay Area" 
}: VendorCategoryGuideBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const normalizedCity = normalizeToKnownCity(userCity);
  const costInfo = getCityCostForCategory(normalizedCity, category);
  const categoryInfo = getVendorCategoryInfo(category);

  if (!costInfo && !categoryInfo) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="gap-2 text-primary border-primary/30 hover:bg-primary/5"
        data-testid={`button-guide-${category}`}
      >
        <Info className="w-4 h-4" />
        {costInfo ? (
          <span>
            {formatCostRange(costInfo)} in {normalizedCity}
          </span>
        ) : (
          <span>View {categoryLabel} Guide</span>
        )}
        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </Button>
      
      {isExpanded && (
        <VendorCategoryGuide 
          category={category} 
          categoryLabel={categoryLabel} 
          userCity={userCity}
          onClose={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}
