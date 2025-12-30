import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Store, CheckCircle2, Loader2 } from "lucide-react";
import { VENDOR_CATEGORIES } from "@shared/schema";

const CITIES = [
  { value: "San Francisco Bay Area", label: "San Francisco Bay Area" },
  { value: "New York City", label: "New York City" },
  { value: "Los Angeles", label: "Los Angeles" },
  { value: "Chicago", label: "Chicago" },
  { value: "Seattle", label: "Seattle" },
];

const PRICE_RANGES = [
  { value: "$", label: "$ (Budget-friendly)" },
  { value: "$$", label: "$$ (Moderate)" },
  { value: "$$$", label: "$$$ (Premium)" },
  { value: "$$$$", label: "$$$$ (Luxury)" },
];

const CULTURAL_SPECIALTIES = [
  { value: "sikh", label: "Sikh" },
  { value: "hindu", label: "Hindu" },
  { value: "muslim", label: "Muslim" },
  { value: "gujarati", label: "Gujarati" },
  { value: "south_indian", label: "South Indian" },
  { value: "punjabi", label: "Punjabi" },
  { value: "north_indian", label: "North Indian" },
  { value: "mixed", label: "Mixed/Fusion" },
];

const CATEGORY_LABELS: Record<string, string> = {
  makeup_artist: "Makeup Artist",
  dj: "DJ",
  dhol_player: "Dhol Player",
  turban_tier: "Turban Tier",
  mehndi_artist: "Mehndi Artist",
  photographer: "Photographer",
  videographer: "Videographer",
  caterer: "Caterer",
  banquet_hall: "Banquet Hall",
  gurdwara: "Gurdwara",
  temple: "Temple",
  decorator: "Decorator",
  florist: "Florist",
  horse_rental: "Horse Rental",
  sword_rental: "Sword Rental",
  tent_service: "Tent Service",
  limo_service: "Limo Service",
  mobile_food: "Mobile Food",
  baraat_band: "Baraat Band",
  pandit: "Pandit",
  mandap_decorator: "Mandap Decorator",
  haldi_supplies: "Haldi Supplies",
  pooja_items: "Pooja Items",
  astrologer: "Astrologer",
  garland_maker: "Garland Maker",
  qazi: "Qazi",
  imam: "Imam",
  nikah_decorator: "Nikah Decorator",
  halal_caterer: "Halal Caterer",
  quran_reciter: "Quran Reciter",
  garba_instructor: "Garba Instructor",
  dandiya_equipment: "Dandiya Equipment",
  rangoli_artist: "Rangoli Artist",
  nadaswaram_player: "Nadaswaram Player",
  silk_saree_rental: "Silk Saree Rental",
  kolam_artist: "Kolam Artist",
};

const submitVendorSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters"),
  categories: z.array(z.string()).min(1, "Select at least one category"),
  city: z.string().min(1, "City is required"),
  location: z.string().min(1, "Address/Location is required"),
  priceRange: z.string().min(1, "Price range is required"),
  culturalSpecialties: z.array(z.string()).optional(),
  description: z.string().optional(),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  instagram: z.string().optional(),
});

type SubmitVendorFormData = z.infer<typeof submitVendorSchema>;

interface SubmitVendorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubmitVendorModal({ open, onOpenChange }: SubmitVendorModalProps) {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<SubmitVendorFormData>({
    resolver: zodResolver(submitVendorSchema),
    defaultValues: {
      name: "",
      categories: [],
      city: "",
      location: "",
      priceRange: "",
      culturalSpecialties: [],
      description: "",
      email: "",
      phone: "",
      website: "",
      instagram: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SubmitVendorFormData) => {
      const response = await apiRequest("POST", "/api/vendors/submit", data);
      return await response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Failed to submit vendor. Please try again.",
      });
    },
  });

  const onSubmit = (data: SubmitVendorFormData) => {
    submitMutation.mutate(data);
  };

  const handleClose = () => {
    setSubmitted(false);
    form.reset();
    onOpenChange(false);
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Vendor Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for adding this vendor. Our team will review the submission 
              and it will appear in the directory once approved.
            </p>
            <Button onClick={handleClose} data-testid="button-close-submit-success">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Add a Vendor
          </DialogTitle>
          <DialogDescription>
            Know a great vendor not on our platform? Share their details and help other couples discover them.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Singh Photography Studio"
                      data-testid="input-submit-vendor-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categories"
              render={() => (
                <FormItem>
                  <FormLabel>Service Categories *</FormLabel>
                  <FormDescription>Select all services this vendor provides</FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {VENDOR_CATEGORIES.map((category) => (
                      <FormField
                        key={category}
                        control={form.control}
                        name="categories"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(category)}
                                onCheckedChange={(checked) => {
                                  const updated = checked
                                    ? [...(field.value || []), category]
                                    : field.value?.filter((v) => v !== category) || [];
                                  field.onChange(updated);
                                }}
                                data-testid={`checkbox-category-${category}`}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {CATEGORY_LABELS[category] || category}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-submit-vendor-city">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CITIES.map((city) => (
                          <SelectItem key={city.value} value={city.value}>
                            {city.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Range *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-submit-vendor-price">
                          <SelectValue placeholder="Select price range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRICE_RANGES.map((price) => (
                          <SelectItem key={price.value} value={price.value}>
                            {price.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address / Location *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., 123 Main St, San Jose, CA"
                      data-testid="input-submit-vendor-location"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="culturalSpecialties"
              render={() => (
                <FormItem>
                  <FormLabel>Cultural Specialties</FormLabel>
                  <FormDescription>What cultural traditions does this vendor specialize in?</FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {CULTURAL_SPECIALTIES.map((specialty) => (
                      <FormField
                        key={specialty.value}
                        control={form.control}
                        name="culturalSpecialties"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(specialty.value)}
                                onCheckedChange={(checked) => {
                                  const updated = checked
                                    ? [...(field.value || []), specialty.value]
                                    : field.value?.filter((v) => v !== specialty.value) || [];
                                  field.onChange(updated);
                                }}
                                data-testid={`checkbox-specialty-${specialty.value}`}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {specialty.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Tell us about this vendor - their services, what makes them special, your experience..."
                      className="min-h-[100px]"
                      data-testid="textarea-submit-vendor-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">Contact Information (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="vendor@email.com"
                          data-testid="input-submit-vendor-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="(555) 123-4567"
                          data-testid="input-submit-vendor-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://..."
                          data-testid="input-submit-vendor-website"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="@username"
                          data-testid="input-submit-vendor-instagram"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                data-testid="button-cancel-submit-vendor"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                data-testid="button-submit-vendor"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Vendor"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
