import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, BookOpen, Heart, Users, Sparkles, Gift, Clock, MapPin, Shirt } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CeremonyStyleCard } from "@/components/ceremony-style-card";
import { TraditionCeremoniesContent } from "@/components/tradition-ceremonies-content";
import { useWeddingTraditions } from "@/hooks/use-tradition-rituals";

export default function CulturalInfoPage() {
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [selectedTradition, setSelectedTradition] = useState<string | undefined>();
  
  const { data: dbTraditions = [], isLoading: traditionsLoading } = useWeddingTraditions();
  
  const traditions = useMemo(() => {
    return dbTraditions
      .filter(t => t.isActive)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map(t => ({
        id: t.slug,
        name: t.displayName,
        description: t.description || "",
      }));
  }, [dbTraditions]);
  
  const defaultTradition = traditions[0]?.id || "sikh";

  const handlePrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  };

  return (
    <div className={`h-full overflow-auto ${isPrintMode ? 'print-mode' : ''}`}>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center gap-4 flex-wrap no-print">
          <div>
            <h1 className="text-3xl font-bold">South Asian Wedding Guide</h1>
            <p className="text-muted-foreground mt-1">Cultural traditions, ceremonies, and etiquette for guests</p>
          </div>
          <Button onClick={handlePrint} variant="outline" data-testid="button-print">
            <Printer className="w-4 h-4 mr-2" />
            Print Guide
          </Button>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <ScrollArea className="w-full whitespace-nowrap no-print">
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="ceremonies" data-testid="tab-ceremonies">Ceremonies</TabsTrigger>
              <TabsTrigger value="attire" data-testid="tab-attire">Attire</TabsTrigger>
              <TabsTrigger value="etiquette" data-testid="tab-etiquette">Dos & Don'ts</TabsTrigger>
              <TabsTrigger value="traditions" data-testid="tab-traditions">Traditions</TabsTrigger>
              <TabsTrigger value="glossary" data-testid="tab-glossary">Glossary</TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Welcome to a South Asian Wedding
                </CardTitle>
                <CardDescription>A celebration of love, family, and rich cultural heritage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  South Asian weddings are vibrant, multi-day celebrations that bring together families, friends, and communities 
                  in joyous union. These weddings are not just about the couple—they're about the merging of two families and 
                  the honoring of centuries-old traditions.
                </p>
                <p>
                  Unlike Western weddings that typically last one day, South Asian weddings often span 3-5 days with multiple 
                  ceremonies, each with its own significance and beauty. Expect colorful attire, delicious food, lively music, 
                  and heartfelt rituals that have been passed down through generations.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold">3-5 Days</h3>
                      <p className="text-sm text-muted-foreground">Multiple ceremonies and celebrations</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold">200-500+ Guests</h3>
                      <p className="text-sm text-muted-foreground">Extended family and community</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Gift className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold">Rich Traditions</h3>
                      <p className="text-sm text-muted-foreground">Centuries of cultural heritage</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Tradition Selector */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Explore by Tradition</h3>
                  {traditionsLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                      {traditions.map((t) => (
                        <Button
                          key={t.id}
                          variant={(selectedTradition ?? defaultTradition) === t.id ? "default" : "outline"}
                          className="h-auto py-3 flex-col"
                          onClick={() => setSelectedTradition(t.id)}
                          data-testid={`tradition-${t.id}`}
                        >
                          <span className="font-semibold">{t.name}</span>
                          <span className="text-xs opacity-70">{t.description}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ceremonies Tab - Database Driven */}
          <TabsContent value="ceremonies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Wedding Ceremonies by Tradition</CardTitle>
                <CardDescription>Select a tradition to explore its unique rituals and ceremonies</CardDescription>
              </CardHeader>
              <CardContent>
                {traditionsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-48 w-full" />
                  </div>
                ) : traditions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No traditions available yet.</p>
                  </div>
                ) : (
                  <Tabs defaultValue={defaultTradition} className="w-full">
                    <ScrollArea className="w-full whitespace-nowrap">
                      <TabsList className="inline-flex w-auto mb-4">
                        {traditions.map((t) => (
                          <TabsTrigger key={t.id} value={t.id} data-testid={`ceremony-tradition-${t.id}`}>
                            {t.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>

                    {traditions.map((t) => (
                      <TabsContent key={t.id} value={t.id}>
                        <TraditionCeremoniesContent traditionSlug={t.id} />
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attire Tab */}
          <TabsContent value="attire" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>What to Wear</CardTitle>
                <CardDescription>How to dress for each celebration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">For Women</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li><strong>Saree:</strong> A long draped garment with a blouse. Elegant and traditional.</li>
                      <li><strong>Lehenga:</strong> A long skirt with a matching blouse and dupatta (scarf). Perfect for dancing!</li>
                      <li><strong>Salwar Kameez/Anarkali:</strong> A tunic with pants and a scarf. Comfortable and beautiful.</li>
                      <li><strong>Indo-Western Fusion:</strong> Modern outfits that blend traditional and contemporary styles.</li>
                      <li><strong>Colors:</strong> Bright, vibrant colors are encouraged! Avoid white (worn for funerals) and red (traditionally for the bride).</li>
                      <li><strong>Accessories:</strong> Statement jewelry, bangles, and bindis are welcome!</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">For Men</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li><strong>Sherwani:</strong> A long coat worn over churidar pants. Very formal and regal.</li>
                      <li><strong>Kurta Pajama:</strong> A long shirt with loose pants. Comfortable and traditional.</li>
                      <li><strong>Indo-Western:</strong> Nehru jackets, bandhgala suits, or fusion wear.</li>
                      <li><strong>Western Formal:</strong> A suit is acceptable for the reception, but traditional wear is preferred.</li>
                      <li><strong>Colors:</strong> Rich colors like maroon, navy, cream, or gold are great choices.</li>
                    </ul>
                  </div>

                  {/* Tradition-specific attire */}
                  <div className="mt-6 space-y-4">
                    <h3 className="font-semibold text-lg">Tradition-Specific Attire</h3>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className="p-4">
                        <h4 className="font-semibold mb-2">Sikh Weddings</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li><strong>Must:</strong> Cover your head in the Gurdwara (scarves provided)</li>
                          <li><strong>Bride:</strong> Red or pink Lehenga with heavy embroidery</li>
                          <li><strong>Groom:</strong> Sherwani with a turban (pagri)</li>
                        </ul>
                      </Card>
                      
                      <Card className="p-4">
                        <h4 className="font-semibold mb-2">Muslim Weddings</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li><strong>Bride:</strong> Sharara, Gharara, or Lehenga in red/maroon</li>
                          <li><strong>Groom:</strong> Sherwani or Kurta Pajama</li>
                          <li><strong>Modesty:</strong> Conservative dress appreciated</li>
                        </ul>
                      </Card>
                      
                      <Card className="p-4">
                        <h4 className="font-semibold mb-2">Gujarati Weddings</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li><strong>Bride:</strong> Traditional Panetar saree (white/red) or Chaniya Choli</li>
                          <li><strong>Groom:</strong> Dhoti kurta with Bandhani dupatta and Pagdi</li>
                          <li><strong>Garba Night:</strong> Vibrant Chaniya Choli with mirror work</li>
                        </ul>
                      </Card>
                      
                      <Card className="p-4">
                        <h4 className="font-semibold mb-2">South Indian Weddings</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li><strong>Bride:</strong> Kanjeevaram silk saree with gold borders</li>
                          <li><strong>Groom:</strong> White silk veshti (dhoti) with angavastram</li>
                          <li><strong>Colors:</strong> White/cream with gold is traditional</li>
                        </ul>
                      </Card>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-md">
                    <h3 className="font-semibold mb-2">Quick Tips</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Remove shoes before entering religious ceremony spaces</li>
                      <li>Dress modestly for religious ceremonies (cover shoulders and knees)</li>
                      <li>It's perfectly fine to wear traditional attire even if you're not South Asian—it's appreciated!</li>
                      <li>When in doubt, ask the couple or their family about dress code</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ceremony Style Lookbook */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shirt className="w-5 h-5 text-primary" />
                  Ceremony Style Lookbook
                </CardTitle>
                <CardDescription>Detailed dress code guidance for each ceremony type</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="sikh" className="w-full">
                  <ScrollArea className="w-full whitespace-nowrap">
                    <TabsList className="inline-flex w-auto mb-4">
                      <TabsTrigger value="sikh">Sikh Ceremonies</TabsTrigger>
                      <TabsTrigger value="hindu">Hindu Ceremonies</TabsTrigger>
                      <TabsTrigger value="muslim">Muslim Ceremonies</TabsTrigger>
                      <TabsTrigger value="general">General Events</TabsTrigger>
                    </TabsList>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>

                  <TabsContent value="sikh" className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <CeremonyStyleCard ceremonyType="anand_karaj" />
                      <CeremonyStyleCard ceremonyType="paath" />
                      <CeremonyStyleCard ceremonyType="maiyan" />
                      <CeremonyStyleCard ceremonyType="chunni_chadana" />
                      <CeremonyStyleCard ceremonyType="jaggo" />
                      <CeremonyStyleCard ceremonyType="chooda" />
                    </div>
                  </TabsContent>

                  <TabsContent value="hindu" className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <CeremonyStyleCard ceremonyType="haldi" />
                      <CeremonyStyleCard ceremonyType="mehndi" />
                      <CeremonyStyleCard ceremonyType="sangeet" />
                      <CeremonyStyleCard ceremonyType="baraat" />
                      <CeremonyStyleCard ceremonyType="milni" />
                      <CeremonyStyleCard ceremonyType="pheras" />
                      <CeremonyStyleCard ceremonyType="vidaai" />
                    </div>
                  </TabsContent>

                  <TabsContent value="muslim" className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <CeremonyStyleCard ceremonyType="nikah" />
                      <CeremonyStyleCard ceremonyType="walima" />
                    </div>
                  </TabsContent>

                  <TabsContent value="general" className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <CeremonyStyleCard ceremonyType="reception" />
                      <CeremonyStyleCard ceremonyType="cocktail" />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Etiquette Tab */}
          <TabsContent value="etiquette" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>How to Behave at Celebrations</CardTitle>
                <CardDescription>Simple dos and don'ts to help you fit right in</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-green-600">Do's</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2"><span className="text-green-600">+</span> RSVP promptly and accurately</li>
                      <li className="flex items-start gap-2"><span className="text-green-600">+</span> Arrive on time (or expect delays—events may start late!)</li>
                      <li className="flex items-start gap-2"><span className="text-green-600">+</span> Dress in vibrant, festive colors</li>
                      <li className="flex items-start gap-2"><span className="text-green-600">+</span> Bring a gift or cash (cash gifts in envelopes are traditional)</li>
                      <li className="flex items-start gap-2"><span className="text-green-600">+</span> Try all the delicious food!</li>
                      <li className="flex items-start gap-2"><span className="text-green-600">+</span> Join in the dancing—even if you don't know the steps</li>
                      <li className="flex items-start gap-2"><span className="text-green-600">+</span> Take lots of photos and videos</li>
                      <li className="flex items-start gap-2"><span className="text-green-600">+</span> Respect religious customs during ceremonies</li>
                      <li className="flex items-start gap-2"><span className="text-green-600">+</span> Greet elders with respect (a small bow or touching feet is traditional)</li>
                      <li className="flex items-start gap-2"><span className="text-green-600">+</span> Ask questions if you're unsure about something</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-red-600">Don'ts</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2"><span className="text-red-600">-</span> Don't wear white (associated with mourning)</li>
                      <li className="flex items-start gap-2"><span className="text-red-600">-</span> Don't wear red if you're not the bride</li>
                      <li className="flex items-start gap-2"><span className="text-red-600">-</span> Don't wear black to religious ceremonies</li>
                      <li className="flex items-start gap-2"><span className="text-red-600">-</span> Don't bring uninvited plus-ones</li>
                      <li className="flex items-start gap-2"><span className="text-red-600">-</span> Don't use phones during religious rituals</li>
                      <li className="flex items-start gap-2"><span className="text-red-600">-</span> Don't touch sacred items without permission</li>
                      <li className="flex items-start gap-2"><span className="text-red-600">-</span> Don't leave early from the main ceremony</li>
                      <li className="flex items-start gap-2"><span className="text-red-600">-</span> Don't drink excessively (some events may be alcohol-free)</li>
                      <li className="flex items-start gap-2"><span className="text-red-600">-</span> Don't wear shoes inside temples or ceremony spaces</li>
                      <li className="flex items-start gap-2"><span className="text-red-600">-</span> Don't expect a Western-style seated dinner—buffets are common</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-primary/10 p-4 rounded-md">
                  <h3 className="font-semibold mb-2">Gift Giving</h3>
                  <p className="text-sm text-muted-foreground">
                    Cash gifts are traditional and preferred. Place cash in a decorative envelope or card and give it to the 
                    couple or their parents. Amounts ending in '1' are auspicious (e.g., $101, $151, $201). If giving a physical 
                    gift, avoid black wrapping and sharp objects like knives.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Traditions Tab */}
          <TabsContent value="traditions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Special Moments to Know About</CardTitle>
                <CardDescription>Beautiful traditions you'll see during the celebrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Accordion type="single" collapsible>
                  <AccordionItem value="garland">
                    <AccordionTrigger>Exchange of Garlands (Jaimala/Varmala)</AccordionTrigger>
                    <AccordionContent>
                      The bride and groom exchange floral garlands as a symbol of acceptance and respect. Family members often 
                      lift the bride or groom to make the exchange playful and challenging!
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="feet">
                    <AccordionTrigger>Touching Elders' Feet</AccordionTrigger>
                    <AccordionContent>
                      A sign of deep respect. You may see the couple and other young people touch the feet of elders to receive 
                      blessings. This is one of the most cherished traditions.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="fire">
                    <AccordionTrigger>Sacred Fire (Agni)</AccordionTrigger>
                    <AccordionContent>
                      In Hindu ceremonies, the couple takes vows while circling a sacred fire. The fire is considered 
                      a divine witness to their marriage and represents purity and knowledge. Hindu weddings have 7 circles, 
                      while Gujarati weddings have 4.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="sindoor">
                    <AccordionTrigger>Sindoor & Mangalsutra</AccordionTrigger>
                    <AccordionContent>
                      The groom applies red powder (sindoor) to the bride's hair parting and places a sacred necklace (mangalsutra) 
                      around her neck. These are symbols of marriage that the bride will wear throughout married life.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="kanyadaan">
                    <AccordionTrigger>Kanyadaan (Giving Away the Bride)</AccordionTrigger>
                    <AccordionContent>
                      An emotional moment where the bride's parents give her hand to the groom, entrusting her to his care. 
                      This is often the most tearful part of the ceremony.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="joota">
                    <AccordionTrigger>Joota Chupai (Hiding the Shoes)</AccordionTrigger>
                    <AccordionContent>
                      A fun tradition where the bride's sisters and cousins "steal" the groom's shoes and demand a ransom for 
                      their return. Expect lots of laughter and negotiation!
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="laavaan">
                    <AccordionTrigger>Four Laavaan (Sikh)</AccordionTrigger>
                    <AccordionContent>
                      In Sikh weddings, the couple circles the Sri Guru Granth Sahib Ji four times while joined by a cloth. 
                      Each circle represents a spiritual journey: righteous living, devotion to the Guru, divine love, 
                      and merging with the Infinite.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="qubool">
                    <AccordionTrigger>Qubool (Muslim)</AccordionTrigger>
                    <AccordionContent>
                      During the Nikah ceremony, both the bride and groom must say "Qubool" (I accept) three times to 
                      formalize the marriage. This mutual consent is essential for the marriage to be valid.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="ring-game">
                    <AccordionTrigger>Ring Finding Game</AccordionTrigger>
                    <AccordionContent>
                      Common in Telugu, Kannada, and Gujarati weddings. A ring is dropped in a bowl of milk or colored water, 
                      and the newlyweds compete to find it. The winner (best of 3) is said to have the "upper hand" in marriage!
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Glossary Tab */}
          <TabsContent value="glossary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Wedding Glossary</CardTitle>
                <CardDescription>A comprehensive reference guide to words you'll hear at South Asian weddings</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="general" className="w-full">
                  <ScrollArea className="w-full whitespace-nowrap">
                    <TabsList className="inline-flex w-auto mb-4">
                      <TabsTrigger value="general">General</TabsTrigger>
                      <TabsTrigger value="hindu-terms">Hindu</TabsTrigger>
                      <TabsTrigger value="sikh-terms">Sikh</TabsTrigger>
                      <TabsTrigger value="muslim-terms">Muslim</TabsTrigger>
                      <TabsTrigger value="gujarati-terms">Gujarati</TabsTrigger>
                      <TabsTrigger value="south-indian-terms">South Indian</TabsTrigger>
                      <TabsTrigger value="mixed-fusion-terms">Mixed/Fusion</TabsTrigger>
                    </TabsList>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>

                  {/* General Terms */}
                  <TabsContent value="general">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div><h4 className="font-semibold">Baraat</h4><p className="text-sm text-muted-foreground">The groom's wedding procession</p></div>
                      <div><h4 className="font-semibold">Mandap</h4><p className="text-sm text-muted-foreground">The decorated canopy where the ceremony takes place</p></div>
                      <div><h4 className="font-semibold">Mehndi/Mehendi</h4><p className="text-sm text-muted-foreground">Intricate henna designs applied to hands and feet</p></div>
                      <div><h4 className="font-semibold">Sangeet</h4><p className="text-sm text-muted-foreground">Musical night with performances and dancing</p></div>
                      <div><h4 className="font-semibold">Haldi/Pithi</h4><p className="text-sm text-muted-foreground">Turmeric ceremony for purification and glow</p></div>
                      <div><h4 className="font-semibold">Dupatta</h4><p className="text-sm text-muted-foreground">A long scarf worn with traditional outfits</p></div>
                      <div><h4 className="font-semibold">Shaadi</h4><p className="text-sm text-muted-foreground">Hindi/Urdu word for wedding</p></div>
                      <div><h4 className="font-semibold">Bindi</h4><p className="text-sm text-muted-foreground">Decorative dot worn on the forehead</p></div>
                      <div><h4 className="font-semibold">Dhol</h4><p className="text-sm text-muted-foreground">Traditional drum played during celebrations</p></div>
                      <div><h4 className="font-semibold">Aarti</h4><p className="text-sm text-muted-foreground">A welcoming ritual with a flame and prayers</p></div>
                      <div><h4 className="font-semibold">Vidaai</h4><p className="text-sm text-muted-foreground">Emotional farewell when the bride leaves her home</p></div>
                      <div><h4 className="font-semibold">Mithai</h4><p className="text-sm text-muted-foreground">Traditional Indian sweets</p></div>
                      <div><h4 className="font-semibold">Sherwani</h4><p className="text-sm text-muted-foreground">Long formal coat worn by grooms</p></div>
                      <div><h4 className="font-semibold">Lehenga</h4><p className="text-sm text-muted-foreground">Long skirt with blouse and dupatta for women</p></div>
                      <div><h4 className="font-semibold">Saree</h4><p className="text-sm text-muted-foreground">Traditional draped garment for women</p></div>
                      <div><h4 className="font-semibold">Kurta Pajama</h4><p className="text-sm text-muted-foreground">Traditional tunic and pants for men</p></div>
                    </div>
                  </TabsContent>

                  {/* Hindu Terms */}
                  <TabsContent value="hindu-terms">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div><h4 className="font-semibold">Pandit/Priest</h4><p className="text-sm text-muted-foreground">The religious officiant who conducts the ceremony</p></div>
                      <div><h4 className="font-semibold">Saptapadi</h4><p className="text-sm text-muted-foreground">The seven sacred steps/circles around the fire</p></div>
                      <div><h4 className="font-semibold">Pheras</h4><p className="text-sm text-muted-foreground">The seven rounds around the sacred fire</p></div>
                      <div><h4 className="font-semibold">Agni</h4><p className="text-sm text-muted-foreground">Sacred fire, divine witness to the marriage</p></div>
                      <div><h4 className="font-semibold">Kanyadaan</h4><p className="text-sm text-muted-foreground">Giving away of the bride by her parents</p></div>
                      <div><h4 className="font-semibold">Jaimala/Varmala</h4><p className="text-sm text-muted-foreground">Exchange of garlands between bride and groom</p></div>
                      <div><h4 className="font-semibold">Sindoor</h4><p className="text-sm text-muted-foreground">Red vermilion powder applied to bride's hair parting</p></div>
                      <div><h4 className="font-semibold">Mangalsutra</h4><p className="text-sm text-muted-foreground">Sacred necklace tied around bride's neck</p></div>
                      <div><h4 className="font-semibold">Granthi Bandhan</h4><p className="text-sm text-muted-foreground">Tying the knot - joining garments together</p></div>
                      <div><h4 className="font-semibold">Ghunghat</h4><p className="text-sm text-muted-foreground">Veil worn by the bride</p></div>
                      <div><h4 className="font-semibold">Joota Chupai</h4><p className="text-sm text-muted-foreground">Playful stealing of groom's shoes</p></div>
                      <div><h4 className="font-semibold">Griha Pravesh</h4><p className="text-sm text-muted-foreground">Bride's entry into the groom's home</p></div>
                    </div>
                  </TabsContent>

                  {/* Sikh Terms */}
                  <TabsContent value="sikh-terms">
                    <div className="grid grid-cols-1 md:cols-2 gap-x-8 gap-y-4">
                      <div><h4 className="font-semibold">Anand Karaj</h4><p className="text-sm text-muted-foreground">"Blissful Union" - the Sikh wedding ceremony</p></div>
                      <div><h4 className="font-semibold">Gurdwara</h4><p className="text-sm text-muted-foreground">Sikh place of worship where ceremony takes place</p></div>
                      <div><h4 className="font-semibold">Guru Granth Sahib</h4><p className="text-sm text-muted-foreground">The holy scripture of Sikhism</p></div>
                      <div><h4 className="font-semibold">Laavaan</h4><p className="text-sm text-muted-foreground">The four sacred hymns/circles in Anand Karaj</p></div>
                      <div><h4 className="font-semibold">Ardas</h4><p className="text-sm text-muted-foreground">Prayer offered to Waheguru</p></div>
                      <div><h4 className="font-semibold">Akhand Paath</h4><p className="text-sm text-muted-foreground">48-hour continuous reading of holy scripture</p></div>
                      <div><h4 className="font-semibold">Kurmai</h4><p className="text-sm text-muted-foreground">Sikh engagement ceremony</p></div>
                      <div><h4 className="font-semibold">Milni</h4><p className="text-sm text-muted-foreground">Meeting of families at the Gurdwara gate</p></div>
                      <div><h4 className="font-semibold">Chunni</h4><p className="text-sm text-muted-foreground">Scarf ceremonially placed on the bride's head</p></div>
                      <div><h4 className="font-semibold">Maiyan</h4><p className="text-sm text-muted-foreground">Sikh version of Haldi ceremony</p></div>
                      <div><h4 className="font-semibold">Langar</h4><p className="text-sm text-muted-foreground">Communal meal served after the ceremony</p></div>
                      <div><h4 className="font-semibold">Prashad</h4><p className="text-sm text-muted-foreground">Sacred sweet blessed during prayer</p></div>
                      <div><h4 className="font-semibold">Kara</h4><p className="text-sm text-muted-foreground">Steel bracelet, one of the five Sikh articles</p></div>
                      <div><h4 className="font-semibold">Pagri/Turban</h4><p className="text-sm text-muted-foreground">Head covering worn by Sikh men</p></div>
                      <div><h4 className="font-semibold">Hukam</h4><p className="text-sm text-muted-foreground">Random verse read from scripture to conclude</p></div>
                      <div><h4 className="font-semibold">Doli</h4><p className="text-sm text-muted-foreground">Bride's departure from parental home</p></div>
                    </div>
                  </TabsContent>

                  {/* Muslim Terms */}
                  <TabsContent value="muslim-terms">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div><h4 className="font-semibold">Nikah/Nikkah</h4><p className="text-sm text-muted-foreground">The Islamic marriage ceremony</p></div>
                      <div><h4 className="font-semibold">Qubool</h4><p className="text-sm text-muted-foreground">"I accept" - said three times to formalize marriage</p></div>
                      <div><h4 className="font-semibold">Mahr/Meher</h4><p className="text-sm text-muted-foreground">Mandatory gift from groom to bride</p></div>
                      <div><h4 className="font-semibold">Nikah Nama</h4><p className="text-sm text-muted-foreground">The official marriage contract</p></div>
                      <div><h4 className="font-semibold">Imam</h4><p className="text-sm text-muted-foreground">Religious leader who officiates</p></div>
                      <div><h4 className="font-semibold">Wali</h4><p className="text-sm text-muted-foreground">Guardian of the bride (usually father)</p></div>
                      <div><h4 className="font-semibold">Walima</h4><p className="text-sm text-muted-foreground">Wedding reception hosted by groom's family</p></div>
                      <div><h4 className="font-semibold">Rukhsat</h4><p className="text-sm text-muted-foreground">Bride's farewell and departure</p></div>
                      <div><h4 className="font-semibold">Arsi Mushraf</h4><p className="text-sm text-muted-foreground">Mirror ritual for first look as married couple</p></div>
                      <div><h4 className="font-semibold">Chauthi</h4><p className="text-sm text-muted-foreground">Fourth day visit to bride's family</p></div>
                      <div><h4 className="font-semibold">Zaffe</h4><p className="text-sm text-muted-foreground">Pre-wedding celebration with music and dance</p></div>
                      <div><h4 className="font-semibold">Sharara</h4><p className="text-sm text-muted-foreground">Traditional bridal outfit with wide pants</p></div>
                      <div><h4 className="font-semibold">Gharara</h4><p className="text-sm text-muted-foreground">Traditional outfit with flared pants</p></div>
                    </div>
                  </TabsContent>

                  {/* Gujarati Terms */}
                  <TabsContent value="gujarati-terms">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div><h4 className="font-semibold">Garba</h4><p className="text-sm text-muted-foreground">Traditional circle dance around lamps</p></div>
                      <div><h4 className="font-semibold">Dandiya Raas</h4><p className="text-sm text-muted-foreground">Dance with decorative sticks</p></div>
                      <div><h4 className="font-semibold">Chaniya Choli</h4><p className="text-sm text-muted-foreground">Traditional colorful skirt and blouse</p></div>
                      <div><h4 className="font-semibold">Panetar</h4><p className="text-sm text-muted-foreground">Traditional white and red bridal saree</p></div>
                      <div><h4 className="font-semibold">Chandlo Matli</h4><p className="text-sm text-muted-foreground">First formal ceremony fixing the wedding</p></div>
                      <div><h4 className="font-semibold">Gol Dhana</h4><p className="text-sm text-muted-foreground">Engagement with coriander and jaggery</p></div>
                      <div><h4 className="font-semibold">Mandvo</h4><p className="text-sm text-muted-foreground">Ceremony to bless the wedding canopy</p></div>
                      <div><h4 className="font-semibold">Mameru</h4><p className="text-sm text-muted-foreground">Maternal uncle's gift ceremony</p></div>
                      <div><h4 className="font-semibold">Pithi</h4><p className="text-sm text-muted-foreground">Gujarati Haldi ceremony</p></div>
                      <div><h4 className="font-semibold">Bajat/Bajoth</h4><p className="text-sm text-muted-foreground">Low seat used during Pithi</p></div>
                      <div><h4 className="font-semibold">Jaan</h4><p className="text-sm text-muted-foreground">Playful welcome of groom at venue</p></div>
                      <div><h4 className="font-semibold">Chero Pakaryo</h4><p className="text-sm text-muted-foreground">Groom asking mother-in-law for gifts</p></div>
                      <div><h4 className="font-semibold">Aeki Beki</h4><p className="text-sm text-muted-foreground">Ring-finding game in milk</p></div>
                      <div><h4 className="font-semibold">Kansar</h4><p className="text-sm text-muted-foreground">Couple feeding each other sweets</p></div>
                      <div><h4 className="font-semibold">Bandhani/Bandhej</h4><p className="text-sm text-muted-foreground">Traditional tie-dye fabric</p></div>
                    </div>
                  </TabsContent>

                  {/* South Indian Terms */}
                  <TabsContent value="south-indian-terms">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div><h4 className="font-semibold">Thali/Mangalsutra</h4><p className="text-sm text-muted-foreground">Sacred necklace tied by groom</p></div>
                      <div><h4 className="font-semibold">Kanjeevaram</h4><p className="text-sm text-muted-foreground">Traditional silk saree from Tamil Nadu</p></div>
                      <div><h4 className="font-semibold">Veshti</h4><p className="text-sm text-muted-foreground">Traditional dhoti worn by men</p></div>
                      <div><h4 className="font-semibold">Angavastram</h4><p className="text-sm text-muted-foreground">Silk scarf worn across shoulders</p></div>
                      <div><h4 className="font-semibold">Nadaswaram</h4><p className="text-sm text-muted-foreground">Traditional wind instrument for ceremonies</p></div>
                      <div><h4 className="font-semibold">Muhurtham</h4><p className="text-sm text-muted-foreground">Auspicious time for the ceremony</p></div>
                      <div><h4 className="font-semibold">Oonjal</h4><p className="text-sm text-muted-foreground">Swing ceremony in Tamil weddings</p></div>
                      <div><h4 className="font-semibold">Kashi Yatra</h4><p className="text-sm text-muted-foreground">Mock pilgrimage by the groom</p></div>
                      <div><h4 className="font-semibold">Jeelakara Bellam</h4><p className="text-sm text-muted-foreground">Cumin and jaggery ritual in Telugu weddings</p></div>
                      <div><h4 className="font-semibold">Talambralu</h4><p className="text-sm text-muted-foreground">Showering pearls/rice on each other</p></div>
                      <div><h4 className="font-semibold">Dhare Herdu</h4><p className="text-sm text-muted-foreground">Sacred hand-giving in Kannada weddings</p></div>
                      <div><h4 className="font-semibold">Thalikettu</h4><p className="text-sm text-muted-foreground">Tying the thali in Kerala weddings</p></div>
                      <div><h4 className="font-semibold">Pudavakodukkal</h4><p className="text-sm text-muted-foreground">Gift of cloth ceremony in Kerala</p></div>
                      <div><h4 className="font-semibold">Sadhya</h4><p className="text-sm text-muted-foreground">Traditional Kerala feast on banana leaves</p></div>
                      <div><h4 className="font-semibold">Kasavu</h4><p className="text-sm text-muted-foreground">White Kerala saree with gold border</p></div>
                      <div><h4 className="font-semibold">Okhli</h4><p className="text-sm text-muted-foreground">Ring game in Kannada weddings</p></div>
                    </div>
                  </TabsContent>

                  {/* Mixed/Fusion Terms */}
                  <TabsContent value="mixed-fusion-terms">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div><h4 className="font-semibold">Fusion Ceremony</h4><p className="text-sm text-muted-foreground">A ceremony blending rituals from multiple traditions</p></div>
                      <div><h4 className="font-semibold">Interfaith Wedding</h4><p className="text-sm text-muted-foreground">Marriage between partners of different religions</p></div>
                      <div><h4 className="font-semibold">Intercultural Wedding</h4><p className="text-sm text-muted-foreground">Marriage blending different cultural backgrounds</p></div>
                      <div><h4 className="font-semibold">Co-Officiants</h4><p className="text-sm text-muted-foreground">Two officiants from different traditions conducting together</p></div>
                      <div><h4 className="font-semibold">Blended Ritual</h4><p className="text-sm text-muted-foreground">A combined ritual drawing from multiple traditions</p></div>
                      <div><h4 className="font-semibold">Unity Ceremony</h4><p className="text-sm text-muted-foreground">Symbolic ritual representing joining of two lives</p></div>
                      <div><h4 className="font-semibold">Chuppah-Mandap</h4><p className="text-sm text-muted-foreground">Combined Jewish-Hindu wedding canopy structure</p></div>
                      <div><h4 className="font-semibold">Fusion Attire</h4><p className="text-sm text-muted-foreground">Outfit combining elements from different cultures</p></div>
                      <div><h4 className="font-semibold">Multicultural Reception</h4><p className="text-sm text-muted-foreground">Celebration featuring traditions from both families</p></div>
                      <div><h4 className="font-semibold">Program Guide</h4><p className="text-sm text-muted-foreground">Written explanation of ceremonies for guests</p></div>
                      <div><h4 className="font-semibold">Secular Ceremony</h4><p className="text-sm text-muted-foreground">Non-religious wedding focusing on personal vows</p></div>
                      <div><h4 className="font-semibold">Civil Celebrant</h4><p className="text-sm text-muted-foreground">Non-religious officiant for secular ceremonies</p></div>
                      <div><h4 className="font-semibold">Handfasting</h4><p className="text-sm text-muted-foreground">Binding hands with cord, popular in fusion ceremonies</p></div>
                      <div><h4 className="font-semibold">Sand Ceremony</h4><p className="text-sm text-muted-foreground">Pouring colored sand together to symbolize unity</p></div>
                      <div><h4 className="font-semibold">Wine Box Ceremony</h4><p className="text-sm text-muted-foreground">Sealing wine and letters to open on anniversary</p></div>
                      <div><h4 className="font-semibold">First Look</h4><p className="text-sm text-muted-foreground">Western tradition of seeing each other before ceremony</p></div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer for Print */}
        <Card className="print-only">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            <p>This guide was prepared especially for you. We hope you enjoy celebrating with us!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
