import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Printer, BookOpen, Heart, Users, Sparkles, Gift, Clock, MapPin } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function CulturalInfoPage() {
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [selectedTradition, setSelectedTradition] = useState("hindu");

  const handlePrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  };

  const traditions = [
    { id: "hindu", name: "Hindu", description: "North Indian Hindu traditions" },
    { id: "sikh", name: "Sikh", description: "Anand Karaj ceremony" },
    { id: "muslim", name: "Muslim", description: "Nikah ceremony" },
    { id: "gujarati", name: "Gujarati", description: "Gujarati Hindu traditions" },
    { id: "south-indian", name: "South Indian", description: "Tamil, Telugu, Malayalam, Kannada" },
    { id: "mixed-fusion", name: "Mixed/Fusion", description: "Blending multiple traditions" },
    { id: "general", name: "General", description: "Secular & modern ceremonies" },
  ];

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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {traditions.map((t) => (
                      <Button
                        key={t.id}
                        variant={selectedTradition === t.id ? "default" : "outline"}
                        className="h-auto py-3 flex-col"
                        onClick={() => setSelectedTradition(t.id)}
                        data-testid={`tradition-${t.id}`}
                      >
                        <span className="font-semibold">{t.name}</span>
                        <span className="text-xs opacity-70">{t.description}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ceremonies Tab - Organized by Tradition */}
          <TabsContent value="ceremonies" className="space-y-6">
            {/* Tradition Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Wedding Ceremonies by Tradition</CardTitle>
                <CardDescription>Select a tradition to explore its unique ceremonies</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="hindu" className="w-full">
                  <ScrollArea className="w-full whitespace-nowrap">
                    <TabsList className="inline-flex w-auto mb-4">
                      <TabsTrigger value="hindu">Hindu</TabsTrigger>
                      <TabsTrigger value="sikh">Sikh</TabsTrigger>
                      <TabsTrigger value="muslim">Muslim</TabsTrigger>
                      <TabsTrigger value="gujarati">Gujarati</TabsTrigger>
                      <TabsTrigger value="south-indian">South Indian</TabsTrigger>
                      <TabsTrigger value="mixed-fusion">Mixed/Fusion</TabsTrigger>
                      <TabsTrigger value="general">General</TabsTrigger>
                    </TabsList>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>

                  {/* Hindu Ceremonies */}
                  <TabsContent value="hindu">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="ganesh-puja">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Pre-Wedding</Badge>
                            Ganesh Puja
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> Prayers to Lord Ganesh, the remover of obstacles, to bless the wedding with smooth proceedings.</p>
                          <p><strong>When:</strong> Before wedding festivities begin</p>
                          <p><strong>What to expect:</strong> Offerings of modaks (sweets), coconuts, flowers, and incense with prayers.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="mehndi">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Pre-Wedding</Badge>
                            Mehndi (Henna)
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> Intricate henna designs applied to the bride's hands and feet, symbolizing love and prosperity.</p>
                          <p><strong>When:</strong> 1-2 days before the wedding</p>
                          <p><strong>Attire:</strong> Bright, colorful traditional outfits (yellow, orange, or green)</p>
                          <p><strong>Duration:</strong> 3-5 hours</p>
                          <p><strong>Fun fact:</strong> The groom's name is often hidden in the bride's mehndi design!</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="sangeet">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Pre-Wedding</Badge>
                            Sangeet
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> A musical night filled with choreographed performances, dancing, and celebration.</p>
                          <p><strong>When:</strong> Usually the night before the wedding</p>
                          <p><strong>What to expect:</strong> Dance performances by family and friends, DJ or live band, dinner, and Bollywood music.</p>
                          <p><strong>Duration:</strong> 4-6 hours (evening event)</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="haldi">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Pre-Wedding</Badge>
                            Haldi (Pithi)
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> A purification ceremony where turmeric paste is applied to the bride and groom for a glowing complexion.</p>
                          <p><strong>When:</strong> The morning of the wedding day</p>
                          <p><strong>Attire:</strong> Wear clothes you don't mind getting stained with turmeric (yellow is traditional)</p>
                          <p><strong>Duration:</strong> 1-2 hours</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="baraat">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge variant="default">Wedding Day</Badge>
                            Baraat
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> The groom's grand procession to the wedding venue, often on a decorated horse.</p>
                          <p><strong>What to expect:</strong> Dancing, dhol drums, and celebration as the groom arrives with family and friends.</p>
                          <p><strong>Duration:</strong> 30 minutes - 1 hour</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="jaimala">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge variant="default">Wedding Day</Badge>
                            Jaimala (Garland Exchange)
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> The bride and groom exchange floral garlands, symbolizing acceptance and respect.</p>
                          <p><strong>Fun element:</strong> Family members often lift the bride or groom to make the exchange playful!</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="kanyadaan">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge variant="default">Wedding Day</Badge>
                            Kanyadaan
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> The most emotional moment where the bride's parents place her hand in the groom's, entrusting her to his care.</p>
                          <p><strong>Significance:</strong> The bride is considered a form of Goddess Lakshmi, and the groom as Lord Narayana.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="saptapadi">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge variant="default">Wedding Day</Badge>
                            Saptapadi (Seven Pheras)
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> The most sacred ritual where the couple takes seven rounds around the sacred fire, making seven vows.</p>
                          <p><strong>The Seven Vows:</strong></p>
                          <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                            <li><strong>1st:</strong> Nourishment & Prosperity - to provide and share responsibilities</li>
                            <li><strong>2nd:</strong> Health & Strength - to support each other in sickness and health</li>
                            <li><strong>3rd:</strong> Wealth & Growth - to share joys and sorrows equally</li>
                            <li><strong>4th:</strong> Love, Respect & Family - to increase love and honor both families</li>
                            <li><strong>5th:</strong> Children & Legacy - to be blessed with children and be good parents</li>
                            <li><strong>6th:</strong> Peace & Longevity - to support each other's dreams</li>
                            <li><strong>7th:</strong> Companionship & Devotion - eternal love, friendship, and loyalty</li>
                          </ul>
                          <p className="mt-2"><strong>Note:</strong> The marriage is legally complete after the seventh phera. The groom leads the first 4, the bride leads the last 3.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="sindoor">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge variant="default">Wedding Day</Badge>
                            Sindoor & Mangalsutra
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> The groom applies red vermilion powder (sindoor) to the bride's hair parting and ties a sacred necklace (mangalsutra) around her neck.</p>
                          <p><strong>Significance:</strong> These are symbols of marriage that the bride will wear throughout married life.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="vidaai">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Post-Wedding</Badge>
                            Vidaai (Farewell)
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> An emotional farewell where the bride leaves her parents' home.</p>
                          <p><strong>Tradition:</strong> The bride throws rice over her shoulder, symbolizing prosperity for her maternal home.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="reception">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Post-Wedding</Badge>
                            Reception
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> A grand celebration and dinner party.</p>
                          <p><strong>When:</strong> Evening of the wedding day or the next evening</p>
                          <p><strong>What to expect:</strong> Formal introductions, speeches, first dance, multi-course dinner, and celebration.</p>
                          <p><strong>Duration:</strong> 4-6 hours</p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </TabsContent>

                  {/* Sikh Ceremonies */}
                  <TabsContent value="sikh">
                    <div className="mb-4 p-4 bg-primary/5 rounded-lg">
                      <h4 className="font-semibold">About Anand Karaj</h4>
                      <p className="text-sm text-muted-foreground">
                        "Anand Karaj" means "Act towards happiness" or "Blissful Union." It was introduced by Guru Amar Das, 
                        with the four sacred hymns (Laavaan) composed by Guru Ram Das. The ceremony takes place in a Gurdwara, 
                        ideally before noon.
                      </p>
                    </div>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="roka">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Pre-Wedding</Badge>
                            Roka / Thaka
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> Both sets of parents bless the union, marking the official commencement of wedding ceremonies.</p>
                          <p><strong>Significance:</strong> Traditionally stops the bride and groom from seeing other prospective partners.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="kurmai">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Pre-Wedding</Badge>
                            Kurmai / Sagan (Engagement)
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> The priest offers Ardas (prayer), and the couple exchange rings.</p>
                          <p><strong>Gifts:</strong> Groom receives a kara (bracelet), kirpan, sweets, fruits, and nuts. Bride's family receives garments and sweets.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="akhand-paath">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Pre-Wedding</Badge>
                            Akhand Paath
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> Continuous reading of the entire Guru Granth Sahib within 48 hours.</p>
                          <p><strong>When:</strong> Usually the weekend before the wedding</p>
                          <p><strong>Where:</strong> At home or the Gurdwara, performed by both families separately.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="chunni">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Pre-Wedding</Badge>
                            Chunni Chadana
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> The groom's female relatives bring the bride's outfit, jewelry, and accessories.</p>
                          <p><strong>Key moment:</strong> The groom's mother covers the bride's head with a sanctified chunni, accepting her into the family.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="maiyan">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Pre-Wedding</Badge>
                            Maiya / Maiyan
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> Similar to Haldi - oil is applied to the hair and turmeric paste to the body.</p>
                          <p><strong>Setting:</strong> The bride/groom sits on a stool while a red cloth is held overhead by female relatives who sing traditional songs.</p>
                          <p><strong>When:</strong> Any of the five days before the wedding</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="milni">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge variant="default">Wedding Day</Badge>
                            Milni
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> The baraat is welcomed at the Gurdwara gate with hymns.</p>
                          <p><strong>Key moment:</strong> Male relatives from both families exchange garlands and embrace, symbolizing the union of two families.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="palla">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge variant="default">Wedding Day</Badge>
                            Palla Ceremony
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> A red scarf is placed on the groom's shoulders, and dried dates are placed in his hands.</p>
                          <p><strong>Tradition:</strong> The bride's grandfather feeds the dates to the groom.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="laavaan">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge variant="default">Wedding Day</Badge>
                            The Four Laavaan (Circling)
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> The most sacred part - the couple, joined by a piece of cloth, circles the Sri Guru Granth Sahib Ji four times.</p>
                          <p><strong>The Four Laavaan (Spiritual Meaning):</strong></p>
                          <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                            <li><strong>1st:</strong> Commitment to righteous living and rejection of sin</li>
                            <li><strong>2nd:</strong> Spiritual purity and devotion to the Guru</li>
                            <li><strong>3rd:</strong> Conquest of lust and embrace of divine love</li>
                            <li><strong>4th:</strong> Merging of the soul with the Infinite</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="anand-sahib">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge variant="default">Wedding Day</Badge>
                            Anand Sahib
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> The "Song of Bliss" sung by the entire congregation.</p>
                          <p><strong>Significance:</strong> Emphasizes the fusing of two souls into one as they merge with the divine.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="langar">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Post-Wedding</Badge>
                            Langar (Community Meal)
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> A communal meal where everyone gathers to eat together.</p>
                          <p><strong>Significance:</strong> Everyone sits together as equals, sharing food blessed during the ceremony.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="doli">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Post-Wedding</Badge>
                            Doli / Vidaai
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> The bride's family sends her off with the groom.</p>
                          <p><strong>Tradition:</strong> The bride tosses puffed rice over her shoulders, symbolizing prosperity for her maternal home.</p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </TabsContent>

                  {/* Muslim Ceremonies */}
                  <TabsContent value="muslim">
                    <div className="mb-4 p-4 bg-primary/5 rounded-lg">
                      <h4 className="font-semibold">About the Nikah</h4>
                      <p className="text-sm text-muted-foreground">
                        The Nikah is the sacred Islamic marriage ceremony. It requires mutual consent, witnesses, a guardian 
                        (Wali) for the bride, and an Imam to officiate. The ceremony is typically simple but deeply meaningful.
                      </p>
                    </div>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="mehndi-muslim">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Pre-Wedding</Badge>
                            Mehndi Ceremony
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> Henna applied to the bride's hands and feet at her home.</p>
                          <p><strong>When:</strong> Usually the evening before or two days before the wedding</p>
                          <p><strong>Atmosphere:</strong> Festive celebration with music, singing, and dancing.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="zaffe">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Pre-Wedding</Badge>
                            Zaffe
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> A celebration at both the bride's and groom's homes.</p>
                          <p><strong>What to expect:</strong> Music, dancing, and joyful celebration symbolizing both families' happiness.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="baraat-muslim">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge variant="default">Wedding Day</Badge>
                            Baraat
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> The groom's procession to the wedding venue.</p>
                          <p><strong>Style:</strong> Can be in a fancy car, on horseback, or with live music and dancers.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="mahr">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge variant="default">Wedding Day</Badge>
                            Mahr (Meher)
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> A mandatory gift that the groom gives to the bride.</p>
                          <p><strong>Significance:</strong> A critical part of the Islamic marriage contract, representing the groom's commitment.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="nikah">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge variant="default">Wedding Day</Badge>
                            Nikah Ceremony
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> The official marriage ceremony.</p>
                          <p><strong>Requirements:</strong></p>
                          <ul className="list-disc list-inside ml-4 text-sm">
                            <li>Mutual consent from both parties</li>
                            <li>Two male adult witnesses (or one male and two females)</li>
                            <li>A guardian (Wali) for the bride</li>
                            <li>An Imam to officiate</li>
                          </ul>
                          <p className="mt-2"><strong>Key moment:</strong> The couple accepts the marriage three times with "Qubool" (I accept).</p>
                          <p><strong>Nikah Nama:</strong> The official marriage contract is signed in the presence of witnesses.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="arsi-mushraf">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Post-Wedding</Badge>
                            Arsi Mushraf (Mirror Ritual)
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> The first moment the bride and groom look at each other as a married couple.</p>
                          <p><strong>Tradition:</strong> A mirror is placed between them so they see each other's reflection.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="walima">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Post-Wedding</Badge>
                            Walima (Reception)
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> A grand celebration hosted by the groom's family.</p>
                          <p><strong>Significance:</strong> Considered a religious requirement to announce the marriage publicly.</p>
                          <p><strong>Note:</strong> Alcohol is not served at Muslim weddings.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="rukhsat">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Post-Wedding</Badge>
                            Rukhsat
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> The bride says goodbye to her family and enters the groom's house.</p>
                          <p><strong>Welcome:</strong> Elders recite prayers from the Holy Quran as she arrives.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="chauthi">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Post-Wedding</Badge>
                            Chauthi
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> The couple visits the bride's family on the fourth day after the wedding.</p>
                          <p><strong>What to expect:</strong> Sweets, gifts, and an extended feast.</p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </TabsContent>

                  {/* Gujarati Ceremonies */}
                  <TabsContent value="gujarati">
                    <div className="mb-4 p-4 bg-primary/5 rounded-lg">
                      <h4 className="font-semibold">About Gujarati Weddings</h4>
                      <p className="text-sm text-muted-foreground">
                        Gujarati weddings are known for vibrant Garba dancing, colorful attire, vegetarian feasts, 
                        and unique traditions like only 4 pheras (instead of 7). Expect lots of folk songs and celebration!
                      </p>
                    </div>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="chandlo-matli">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Pre-Wedding</Badge>
                            Chandlo Matli
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> The first formal ceremony marking acceptance of the alliance.</p>
                          <p><strong>What happens:</strong> Four male members from bride's family visit groom's house. Red vermilion (chandlo) is applied on groom's forehead.</p>
                          <p><strong>Significance:</strong> The wedding date is officially fixed during this ceremony.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="gol-dhana">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Pre-Wedding</Badge>
                            Gol Dhana (Engagement)
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> The engagement ceremony.</p>
                          <p><strong>Tradition:</strong> Coriander seeds (dhana) and jaggery (gol) are distributed to guests.</p>
                          <p><strong>Blessings:</strong> Five married women bless the couple for a fruitful marriage.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="mandvo">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Pre-Wedding</Badge>
                            Mandap Mahurat / Mandvo
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> Seeking Lord Ganesha's blessings before constructing the wedding canopy.</p>
                          <p><strong>When:</strong> 1-2 days before the wedding at both homes</p>
                          <p><strong>Tradition:</strong> Permission is asked from Mother Earth before erecting the mandap.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="pithi-gujarati">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Pre-Wedding</Badge>
                            Pithi (Haldi)
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> The Gujarati version of Haldi ceremony.</p>
                          <p><strong>Setting:</strong> Bride/groom sits on a low seat called Bajat/Bajoth.</p>
                          <p><strong>Paste:</strong> Turmeric, sandalwood, rosewater, herbs, and perfume prepared by the paternal uncle's wife (Kaki).</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="mameru">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Pre-Wedding</Badge>
                            Mameru / Mosaalu
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> The maternal uncle (Mama) brings special gifts for the bride.</p>
                          <p><strong>Gifts:</strong> Traditional Panetar saree, jewelry, ivory/white bangles (chura), sweets, and dry fruits.</p>
                          <p><strong>When:</strong> 1-2 days before the wedding</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="garba">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Pre-Wedding</Badge>
                            Garba & Sangeet Sandhya
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> One of the most fun-filled ceremonies with traditional folk dance!</p>
                          <p><strong>Garba:</strong> Circle dance performed around earthen lamps (diyas).</p>
                          <p><strong>Dandiya Raas:</strong> Energetic dance with decorative sticks (dandiya) tapped against partners'.</p>
                          <p><strong>Attire:</strong> Vibrant Chaniya Choli for women, kurta for men.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="jaan">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge variant="default">Wedding Day</Badge>
                            Jaan
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> An entertaining ritual when the groom arrives at the venue.</p>
                          <p><strong>Fun moment:</strong> The groom touches his mother-in-law's feet for blessings, and she playfully tries to grab his nose!</p>
                          <p><strong>Significance:</strong> Reminds the groom to be humble and grateful.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="mangal-pheras">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge variant="default">Wedding Day</Badge>
                            Mangal Pheras (4 Pheras)
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> The sacred circling of the fire.</p>
                          <p><strong>Unique:</strong> Gujarati weddings have only 4 pheras (not 7), representing Dharma, Artha, Kama, and Moksha.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="chero">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Post-Wedding</Badge>
                            Chero Pakaryo
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> A fun-filled post-wedding ritual.</p>
                          <p><strong>What happens:</strong> The groom playfully catches his mother-in-law's saree and asks for more gifts!</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="aeki-beki">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Post-Wedding</Badge>
                            Aeki Beki
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>What it is:</strong> A fun post-wedding game for the newlyweds.</p>
                          <p><strong>How it works:</strong> A ring is placed in a bowl of milk, and the couple searches for it. Whoever finds it wins!</p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </TabsContent>

                  {/* South Indian Ceremonies */}
                  <TabsContent value="south-indian">
                    <div className="mb-4 p-4 bg-primary/5 rounded-lg">
                      <h4 className="font-semibold">South Indian Wedding Traditions</h4>
                      <p className="text-sm text-muted-foreground">
                        South Indian weddings vary by region (Tamil, Telugu, Malayalam/Kerala, Kannada) but share elegant 
                        traditions, Kanjeevaram silk sarees, and focus on temple ceremonies and vegetarian feasts on banana leaves.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Tamil Section */}
                      <div>
                        <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                          <Badge variant="outline">Tamil</Badge>
                          Tamil Wedding Ceremonies
                        </h4>
                        <Accordion type="single" collapsible>
                          <AccordionItem value="tamil-muhurtham">
                            <AccordionTrigger>Thali Tying (Muhurtham)</AccordionTrigger>
                            <AccordionContent>
                              <p><strong>The most important moment:</strong> The groom ties the sacred gold Thali necklace around the bride's neck to drum/pipe music.</p>
                              <p>Guests shower flower petals and rice, symbolizing blessings and eternal devotion.</p>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="tamil-oonjal">
                            <AccordionTrigger>Oonjal (Swing Ceremony)</AccordionTrigger>
                            <AccordionContent>
                              <p>The couple is seated on a decorated swing for playful, light-hearted moments together.</p>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="tamil-saptapadi">
                            <AccordionTrigger>Saptapadi (Seven Steps)</AccordionTrigger>
                            <AccordionContent>
                              <p>The couple circles the sacred fire 7 times with clasped hands while the priest recites Vedic mantras of the 7 marriage vows.</p>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>

                      {/* Telugu Section */}
                      <div>
                        <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                          <Badge variant="outline">Telugu</Badge>
                          Telugu Wedding Ceremonies
                        </h4>
                        <Accordion type="single" collapsible>
                          <AccordionItem value="telugu-kashi">
                            <AccordionTrigger>Kashi Yatra</AccordionTrigger>
                            <AccordionContent>
                              <p><strong>Fun tradition:</strong> The groom pretends to leave for Kashi as a celibate with walking stick and umbrella.</p>
                              <p>The bride's brother/father must convince him to stay and marry instead!</p>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="telugu-jeelakara">
                            <AccordionTrigger>Jeelakara Bellam</AccordionTrigger>
                            <AccordionContent>
                              <p><strong>Critical timing:</strong> Paste of cumin (Jeelakara) and jaggery (Bellam) is placed on the couple's hands at the exact auspicious hour.</p>
                              <p>They place it on each other's heads, symbolizing sticking together through bitter and sweet.</p>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="telugu-talambralu">
                            <AccordionTrigger>Talambralu</AccordionTrigger>
                            <AccordionContent>
                              <p><strong>Fun ritual:</strong> The couple showers each other with pearls or turmeric-colored rice over their heads 3 times.</p>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="telugu-ring">
                            <AccordionTrigger>Ring Finding Ceremony</AccordionTrigger>
                            <AccordionContent>
                              <p><strong>Most entertaining:</strong> Two rings (gold/silver) are dropped in a water pot. The couple competes to find the gold ring first (best of 3).</p>
                              <p>The winner is said to have the "upper hand" in marriage!</p>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                        <p className="text-xs text-muted-foreground mt-2">Note: Telugu weddings are typically held close to midnight.</p>
                      </div>

                      {/* Kerala Section */}
                      <div>
                        <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                          <Badge variant="outline">Kerala</Badge>
                          Malayalam (Kerala) Wedding Ceremonies
                        </h4>
                        <Accordion type="single" collapsible>
                          <AccordionItem value="kerala-thali">
                            <AccordionTrigger>Thalikettu</AccordionTrigger>
                            <AccordionContent>
                              <p>The groom ties the golden thali around the bride's neck at the auspicious Muhurtham moment.</p>
                              <p>Accompanied by ceremonial ululating sounds (Vai Kurava) and special drumbeats (Ketti Melam).</p>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="kerala-pudava">
                            <AccordionTrigger>Pudavakodukkal (Gift of Cloth)</AccordionTrigger>
                            <AccordionContent>
                              <p>After Kanyadaan, the groom gifts his bride a saree and blouse on a platter.</p>
                              <p>Signifies that he will provide for her for the rest of her life.</p>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="kerala-sadhya">
                            <AccordionTrigger>Sadhya (Grand Feast)</AccordionTrigger>
                            <AccordionContent>
                              <p>A traditional vegetarian feast of 25+ items served on plantain leaves.</p>
                              <p>Includes rice, pickles, curries, and sweets like payasam.</p>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                        <p className="text-xs text-muted-foreground mt-2">Note: Kerala Nair weddings are known for simplicity, often lasting just 15-30 minutes.</p>
                      </div>

                      {/* Kannada Section */}
                      <div>
                        <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                          <Badge variant="outline">Kannada</Badge>
                          Kannada (Karnataka) Wedding Ceremonies
                        </h4>
                        <Accordion type="single" collapsible>
                          <AccordionItem value="kannada-dhare">
                            <AccordionTrigger>Dhare Herdu (Sacred Hand-Giving)</AccordionTrigger>
                            <AccordionContent>
                              <p>The Kannada equivalent of Kanyadaan with a unique tradition.</p>
                              <p><strong>What happens:</strong> The bride's right hand is placed on the groom's, with a coconut and betel leaf on top. The bride's parents pour holy water (preferably from the Ganges) over their joined hands.</p>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="kannada-kashi">
                            <AccordionTrigger>Kaashi Yaatre</AccordionTrigger>
                            <AccordionContent>
                              <p><strong>Most entertaining pre-wedding ritual:</strong> The groom threatens to leave for a pilgrimage to Kashi, carrying a walking stick, umbrella, and fan.</p>
                              <p>The maternal uncle stops him and shows him the bride. The groom agrees to stay and marry!</p>
                            </AccordionContent>
                          </AccordionItem>
                          <AccordionItem value="kannada-okhli">
                            <AccordionTrigger>Okhli (Ring Game)</AccordionTrigger>
                            <AccordionContent>
                              <p>The groom's ring is placed in a bowl of milk. The couple competes to find it (best of 3 rounds).</p>
                              <p>The winner is believed to handle future challenges better. A fun ice-breaker for the newlyweds!</p>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Mixed/Fusion Ceremonies */}
                  <TabsContent value="mixed-fusion">
                    <div className="mb-4 p-4 bg-primary/5 rounded-lg">
                      <h4 className="font-semibold">About Mixed/Fusion Weddings</h4>
                      <p className="text-sm text-muted-foreground">
                        Mixed or fusion weddings beautifully blend traditions from two different cultures or religions. 
                        These celebrations honor both families' backgrounds while creating new, personalized traditions.
                      </p>
                    </div>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="fusion-planning">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Planning</Badge>
                            Creating Your Fusion Ceremony
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>The approach:</strong> Select meaningful rituals from each tradition that resonate with you as a couple.</p>
                          <p><strong>Timeline options:</strong> You can have separate ceremonies on different days, combine elements into one ceremony, or create a blended ceremony with alternating traditions.</p>
                          <p><strong>Working with officiants:</strong> Many couples have two officiants (one from each tradition) who collaborate on the ceremony.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="fusion-hindu-christian">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Example</Badge>
                            Hindu + Christian Fusion
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>Common blend:</strong> Traditional church vows combined with the Saptapadi (7 steps), exchange of rings followed by Mangalsutra tying.</p>
                          <p><strong>Setting:</strong> Often held at a neutral venue like a garden, hotel, or banquet hall.</p>
                          <p><strong>Attire:</strong> Bride may change from a white gown to a red lehenga, or wear a fusion outfit combining both styles.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="fusion-hindu-jewish">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Example</Badge>
                            Hindu + Jewish Fusion
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>Common blend:</strong> Ceremony under both a chuppah and a mandap, combining the breaking of glass with the Saptapadi.</p>
                          <p><strong>Unique touch:</strong> The ketubah (Jewish marriage contract) displayed alongside a Hindu blessing.</p>
                          <p><strong>Food:</strong> Often vegetarian to accommodate both traditions, with fusion cuisine.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="fusion-sikh-western">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Example</Badge>
                            Sikh + Western Fusion
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>Two ceremonies:</strong> Often a traditional Anand Karaj at a Gurdwara followed by a Western-style reception.</p>
                          <p><strong>Compromise:</strong> The Sikh ceremony remains traditional, while the reception incorporates Western customs like first dance, cake cutting, and speeches.</p>
                          <p><strong>Attire:</strong> Traditional Punjabi attire for the ceremony, Western formal wear for the reception.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="fusion-muslim-hindu">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Example</Badge>
                            Muslim + Hindu Fusion
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>Approach:</strong> Families often choose a secular ceremony with cultural elements from both traditions.</p>
                          <p><strong>Pre-wedding:</strong> Mehndi and Sangeet are common to both cultures and serve as wonderful shared celebrations.</p>
                          <p><strong>Ceremony elements:</strong> May include the exchange of garlands, signing of a marriage contract, and blessings from both families.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="fusion-tips">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Tips</Badge>
                            Making It Work
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>Communication:</strong> Have open conversations with both families early in the planning process.</p>
                          <p><strong>Respect:</strong> Ensure all chosen rituals are performed with proper reverence and understanding.</p>
                          <p><strong>Explanation:</strong> Provide guests with a program explaining each ritual and its significance.</p>
                          <p><strong>Flexibility:</strong> Be prepared to compromise and find creative solutions.</p>
                          <p><strong>Professionals:</strong> Hire a wedding planner experienced in multicultural weddings.</p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </TabsContent>

                  {/* General/Secular Ceremonies */}
                  <TabsContent value="general">
                    <div className="mb-4 p-4 bg-primary/5 rounded-lg">
                      <h4 className="font-semibold">About General/Secular Weddings</h4>
                      <p className="text-sm text-muted-foreground">
                        General or secular weddings focus on the couple's personal values and relationship rather than 
                        religious traditions. These celebrations can still incorporate South Asian cultural elements 
                        while maintaining a non-religious ceremony.
                      </p>
                    </div>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="general-ceremony">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge variant="default">Wedding Day</Badge>
                            The Ceremony
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>Officiant:</strong> A civil celebrant, judge, or a friend who is ordained online.</p>
                          <p><strong>Structure:</strong> Welcome, readings, vows, ring exchange, pronouncement, and first kiss.</p>
                          <p><strong>Personal touch:</strong> Write your own vows, include poetry or songs that are meaningful to you.</p>
                          <p><strong>Duration:</strong> Typically 20-30 minutes</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="general-cultural-elements">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Cultural</Badge>
                            Adding South Asian Touches
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>Attire:</strong> Traditional South Asian wedding attire (lehenga, sherwani) without religious ceremony.</p>
                          <p><strong>Decor:</strong> Marigold flowers, colorful fabrics, mandap-style structure for aesthetic purposes.</p>
                          <p><strong>Food:</strong> South Asian cuisine for the reception.</p>
                          <p><strong>Music:</strong> Bollywood or traditional music for entertainment.</p>
                          <p><strong>Mehndi:</strong> Henna application as a cultural (not religious) celebration.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="general-pre-wedding">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Pre-Wedding</Badge>
                            Pre-Wedding Celebrations
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>Engagement party:</strong> Ring ceremony with family and close friends.</p>
                          <p><strong>Sangeet:</strong> Music and dance night celebrating the upcoming wedding.</p>
                          <p><strong>Mehndi party:</strong> Henna application with friends and family.</p>
                          <p><strong>Bachelor/Bachelorette:</strong> Traditional Western-style parties.</p>
                          <p><strong>Rehearsal dinner:</strong> Gathering the night before with the wedding party and family.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="general-reception">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Post-Ceremony</Badge>
                            Reception Traditions
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>Grand entrance:</strong> Couple enters to music with the wedding party.</p>
                          <p><strong>First dance:</strong> Couple's first dance as a married pair.</p>
                          <p><strong>Speeches:</strong> Toasts from the best man, maid of honor, and family.</p>
                          <p><strong>Cake cutting:</strong> Ceremonial cutting and feeding each other cake.</p>
                          <p><strong>Bouquet/Garter toss:</strong> Optional fun traditions.</p>
                          <p><strong>Dancing:</strong> Mix of Western music and Bollywood for inclusive celebration.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="general-symbolic">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Symbolic</Badge>
                            Meaningful Symbolic Rituals
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>Unity candle:</strong> Lighting a single candle together to symbolize joining of lives.</p>
                          <p><strong>Sand ceremony:</strong> Pouring different colored sands into one vessel.</p>
                          <p><strong>Handfasting:</strong> Tying hands together with a ribbon or cord.</p>
                          <p><strong>Wine ceremony:</strong> Sharing a drink from the same cup.</p>
                          <p><strong>Tree planting:</strong> Planting a tree together to grow with your marriage.</p>
                          <p><strong>Time capsule:</strong> Sealing letters or items to open on a future anniversary.</p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="general-legal">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <Badge>Legal</Badge>
                            Legal Requirements
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p><strong>Marriage license:</strong> Obtain from your local county clerk's office before the wedding.</p>
                          <p><strong>Officiant:</strong> Must be legally authorized to perform marriages in your state.</p>
                          <p><strong>Witnesses:</strong> Most states require 1-2 witnesses to sign the marriage certificate.</p>
                          <p><strong>Timing:</strong> Licenses typically valid for 30-90 days, check your local requirements.</p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </TabsContent>
                </Tabs>
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
