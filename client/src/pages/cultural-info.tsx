import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Printer, BookOpen, Heart, Users, Sparkles, Gift } from "lucide-react";

export default function CulturalInfoPage() {
  const [isPrintMode, setIsPrintMode] = useState(false);

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
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 no-print">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="ceremonies" data-testid="tab-ceremonies">Ceremonies</TabsTrigger>
            <TabsTrigger value="attire" data-testid="tab-attire">Attire</TabsTrigger>
            <TabsTrigger value="etiquette" data-testid="tab-etiquette">Etiquette</TabsTrigger>
            <TabsTrigger value="traditions" data-testid="tab-traditions">Traditions</TabsTrigger>
            <TabsTrigger value="glossary" data-testid="tab-glossary">Glossary</TabsTrigger>
          </TabsList>

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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ceremonies Tab */}
          <TabsContent value="ceremonies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Common Ceremonies</CardTitle>
                <CardDescription>Understanding the different events in a South Asian wedding</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="mehndi">
                    <AccordionTrigger data-testid="ceremony-mehndi">
                      <div className="flex items-center gap-2">
                        <Badge>Pre-Wedding</Badge>
                        Mehndi / Mehendi
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <p><strong>What it is:</strong> A joyful celebration where intricate henna designs are applied to the bride's hands and feet.</p>
                      <p><strong>When:</strong> Usually 1-2 days before the wedding</p>
                      <p><strong>Attire:</strong> Bright, colorful traditional outfits (yellow, orange, or green are popular)</p>
                      <p><strong>What to expect:</strong> Live music, dancing, singing, and delicious snacks while the bride gets her mehndi applied</p>
                      <p><strong>Duration:</strong> 3-5 hours</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="sangeet">
                    <AccordionTrigger data-testid="ceremony-sangeet">
                      <div className="flex items-center gap-2">
                        <Badge>Pre-Wedding</Badge>
                        Sangeet
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <p><strong>What it is:</strong> A musical night filled with performances, dancing, and celebration</p>
                      <p><strong>When:</strong> Usually the night before the wedding</p>
                      <p><strong>Attire:</strong> Festive, colorful traditional wear perfect for dancing</p>
                      <p><strong>What to expect:</strong> Choreographed dances by family and friends, DJ or live band, dinner, and lots of Bollywood music</p>
                      <p><strong>Duration:</strong> 4-6 hours (evening event)</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="haldi">
                    <AccordionTrigger data-testid="ceremony-haldi">
                      <div className="flex items-center gap-2">
                        <Badge>Pre-Wedding</Badge>
                        Haldi / Pithi
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <p><strong>What it is:</strong> A purification ceremony where turmeric paste is applied to the bride and groom</p>
                      <p><strong>When:</strong> The morning of the wedding day</p>
                      <p><strong>Attire:</strong> Wear clothes you don't mind getting stained with turmeric (yellow is traditional)</p>
                      <p><strong>What to expect:</strong> An intimate, fun ceremony with close family applying turmeric paste while singing traditional songs</p>
                      <p><strong>Duration:</strong> 1-2 hours</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="baraat">
                    <AccordionTrigger data-testid="ceremony-baraat">
                      <div className="flex items-center gap-2">
                        <Badge>Wedding Day</Badge>
                        Baraat
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <p><strong>What it is:</strong> The groom's grand procession to the wedding venue</p>
                      <p><strong>When:</strong> Beginning of the wedding ceremony</p>
                      <p><strong>Attire:</strong> Formal traditional wear</p>
                      <p><strong>What to expect:</strong> The groom arrives on a decorated horse (or sometimes a vintage car) with his family and friends dancing to dhol (drums)</p>
                      <p><strong>Duration:</strong> 30 minutes - 1 hour</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ceremony">
                    <AccordionTrigger data-testid="ceremony-main">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Wedding Day</Badge>
                        Main Ceremony (Vivah/Nikah)
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <p><strong>What it is:</strong> The sacred wedding ceremony where the couple is officially married</p>
                      <p><strong>When:</strong> Main wedding day, often in the morning or afternoon</p>
                      <p><strong>Attire:</strong> Your most formal traditional attire</p>
                      <p><strong>What to expect:</strong> Rituals around a sacred fire (Hindu), religious readings and vows, exchange of garlands, blessings from elders</p>
                      <p><strong>Duration:</strong> 2-4 hours</p>
                      <p><strong>Note:</strong> The ceremony varies significantly by religion and region</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="reception">
                    <AccordionTrigger data-testid="ceremony-reception">
                      <div className="flex items-center gap-2">
                        <Badge>Post-Wedding</Badge>
                        Reception
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <p><strong>What it is:</strong> A grand celebration and dinner party</p>
                      <p><strong>When:</strong> Evening of the wedding day or the next evening</p>
                      <p><strong>Attire:</strong> Formal traditional or fusion attire</p>
                      <p><strong>What to expect:</strong> Formal introductions, speeches, first dance, multi-course dinner, dancing, and celebration</p>
                      <p><strong>Duration:</strong> 4-6 hours</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attire Tab */}
          <TabsContent value="attire" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>What to Wear</CardTitle>
                <CardDescription>Dressing appropriately for South Asian wedding events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
          </TabsContent>

          {/* Etiquette Tab */}
          <TabsContent value="etiquette" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Guest Etiquette</CardTitle>
                <CardDescription>Dos and don'ts to help you navigate the celebrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-green-600">Do's ✓</h3>
                    <ul className="space-y-2 text-sm">
                      <li>✓ RSVP promptly and accurately</li>
                      <li>✓ Arrive on time (or expect delays—events may start late!)</li>
                      <li>✓ Dress in vibrant, festive colors</li>
                      <li>✓ Bring a gift or cash (cash gifts in envelopes are traditional)</li>
                      <li>✓ Try all the delicious food!</li>
                      <li>✓ Join in the dancing—even if you don't know the steps</li>
                      <li>✓ Take lots of photos and videos</li>
                      <li>✓ Respect religious customs during ceremonies</li>
                      <li>✓ Greet elders with respect (a small bow or touching feet is traditional)</li>
                      <li>✓ Ask questions if you're unsure about something</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-red-600">Don'ts ✗</h3>
                    <ul className="space-y-2 text-sm">
                      <li>✗ Don't wear white (associated with mourning)</li>
                      <li>✗ Don't wear red if you're not the bride</li>
                      <li>✗ Don't wear black to religious ceremonies</li>
                      <li>✗ Don't bring uninvited plus-ones</li>
                      <li>✗ Don't use phones during religious rituals</li>
                      <li>✗ Don't touch sacred items without permission</li>
                      <li>✗ Don't leave early from the main ceremony</li>
                      <li>✗ Don't drink excessively (some events may be alcohol-free)</li>
                      <li>✗ Don't wear shoes inside temples or ceremony spaces</li>
                      <li>✗ Don't expect a Western-style seated dinner—buffets are common</li>
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
                <CardTitle>Beautiful Traditions</CardTitle>
                <CardDescription>Meaningful customs you'll witness during the celebrations</CardDescription>
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
                      In Hindu ceremonies, the couple takes vows while circling a sacred fire seven times. The fire is considered 
                      a divine witness to their marriage and represents purity and knowledge.
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
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Glossary Tab */}
          <TabsContent value="glossary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Common Terms</CardTitle>
                <CardDescription>A quick reference guide to words you'll hear</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <h4 className="font-semibold">Baraat</h4>
                    <p className="text-sm text-muted-foreground">The groom's wedding procession</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Mandap</h4>
                    <p className="text-sm text-muted-foreground">The decorated canopy where the ceremony takes place</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Pandit/Priest</h4>
                    <p className="text-sm text-muted-foreground">The religious officiant who conducts the ceremony</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Dupatta</h4>
                    <p className="text-sm text-muted-foreground">A long scarf worn with traditional outfits</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Shaadi</h4>
                    <p className="text-sm text-muted-foreground">Hindi/Urdu word for wedding</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Bindi</h4>
                    <p className="text-sm text-muted-foreground">Decorative dot worn on the forehead</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Ghunghat</h4>
                    <p className="text-sm text-muted-foreground">Veil worn by the bride</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Phere</h4>
                    <p className="text-sm text-muted-foreground">The seven rounds around the sacred fire</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Dhol</h4>
                    <p className="text-sm text-muted-foreground">Traditional drum played during celebrations</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Aarti</h4>
                    <p className="text-sm text-muted-foreground">A welcoming ritual with a flame and prayers</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Chunni</h4>
                    <p className="text-sm text-muted-foreground">Scarf ceremonially placed on the bride's head</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Mithai</h4>
                    <p className="text-sm text-muted-foreground">Traditional Indian sweets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer for Print */}
        <Card className="print-only">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            <p>Viah.me - South Asian Wedding Management Platform</p>
            <p className="mt-1">This guide is provided as a courtesy to help guests understand and enjoy South Asian wedding traditions.</p>
          </CardContent>
        </Card>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-mode {
            background: white !important;
          }
          .print-mode * {
            background: white !important;
            color: black !important;
          }
          @page {
            margin: 1cm;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>
    </div>
  );
}
