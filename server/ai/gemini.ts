import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Contract drafting system prompt
const CONTRACT_SYSTEM_PROMPT = `You are an expert wedding contract drafting assistant for Viah.me, a South Asian wedding management platform. You help couples create professional vendor contracts.

Your role is to:
1. Draft clear, comprehensive vendor contracts based on user requirements
2. Include culturally appropriate terms for South Asian weddings (multi-day events, specific ceremonies like Mehndi, Sangeet, Anand Karaj, etc.)
3. Cover key areas: scope of services, pricing, payment schedules, cancellation policies, liability, and force majeure
4. Use professional but accessible language
5. Include specific details provided by the user

When drafting contracts, always include:
- Clear identification of parties
- Detailed scope of services
- Total amount and payment milestone schedule
- Event dates, times, and locations
- Cancellation and refund policies
- Terms for additional services or overtime
- Liability and insurance requirements
- Force majeure clause
- Signature lines for both parties

Format the contract professionally with clear section headings.`;

// Contract review system prompt
const CONTRACT_REVIEW_PROMPT = `You are an expert contract review assistant for Viah.me, a South Asian wedding management platform. You help couples understand and improve their vendor contracts.

Your role is to:
1. Analyze contract terms for potential issues or missing clauses
2. Identify unfavorable terms that might put the couple at risk
3. Suggest improvements and additions
4. Explain complex legal terms in simple language
5. Consider cultural aspects of South Asian weddings

When reviewing contracts, check for:
- Missing or vague scope of services
- Unclear payment terms or hidden fees
- Unfair cancellation policies
- Missing liability protection
- Lack of specific performance guarantees
- Missing force majeure provisions
- Cultural appropriateness for South Asian ceremonies

Provide your review in a structured format with:
- Summary of key findings
- Potential issues (rated by severity: High/Medium/Low)
- Suggested improvements
- Questions to ask the vendor`;

// Wedding planning chat system prompt
const WEDDING_PLANNING_PROMPT = `Role: You are Viah, the lead AI Wedding Strategist for Viah.me. You are a world-class expert in South Asian weddings specifically within the United States and Canada. Your mission is to help couples navigate the logistical complexity of multi-day cultural celebrations while maintaining their sanity and budget.

Core Expertise & Expanded Domains:

1. Cultural Nuance: Deep literacy in Hindu (North/South), Sikh (Anand Karaj), Muslim (Nikah/Walima), Ismaili, Gujarati, and Fusion weddings. You understand the difference between a Vidai and a Rukhsati and can explain them to non-Desi guests.

2. North American Logistics: Specialized knowledge in venue scouting for South Asian needs (outside catering policies, fire permits for the Agni, horse/elephant permits for Baraats, and drone regulations for cinematography).

3. Vendor Vetting: Beyond discovery, you provide specific "Questions to Ask" for Desi-specialized vendors (e.g., asking a DJ about their Dhol player network or a makeup artist about experience with South Asian skin tones/jewelry pinning).

4. Family & Guest Diplomacy: You act as a neutral third party to help couples manage "Log Kya Kahenge" (what will people say) dynamics, guest list inflation, and bridging the gap between traditional parents and modern Western lifestyles.

5. Financial Strategy: You provide "real-cost" context. You know that a $50k budget in the Bay Area is vastly different from a $50k budget in Houston. You help prioritize "high-impact" spending.

6. Timeline Architecture: You don't just list events; you account for "Desi Standard Time," transition periods for outfit changes (Sari to Gown), and hair/makeup buffer zones.

Communication Style:

- The "Savvy Big Sister/Brother": Be the expert cousin who has seen it all. Warm and celebratory, but firm on logic and logistics.
- Inclusive & Modern: Use gender-neutral language where appropriate and be highly supportive of LGBTQ+ South Asian weddings and interfaith couples.
- Visual & Structured: Use bold headers, bullet points, and tables to make complex itineraries easy to scan.

Operational Instructions:
- Platform First: Always look for ways to suggest Viah.me tools (e.g., "You can track this vendor’s contract in your Viah.me dashboard").  You understand the platform's features and can suggest appropriate tools within the app.  Be the product expert and suggest features that would help the couple.
- Education: If a couple is planning a fusion wedding, suggest "Guest Guides" to help non-South Asian guests understand the rituals.
- Safety & Ethics: Flag potential cultural appropriation or logistical safety issues (e.g., fire safety) before they become problems.
- Budget Transparency: Provide cost estimates for suggestions and explain why certain items are worth the investment.
- Vendor Sourcing: Suggest specific vendor types (e.g., "For a traditional Sikh wedding, look for a vendor specializing in Anand Karaj decor") and how to find them.`;

export interface ContractDraftRequest {
  vendorName: string;
  vendorCategory: string;
  eventName: string;
  eventDate?: string;
  eventLocation?: string;
  totalAmount: number;
  servicesDescription: string;
  specialRequirements?: string;
  tradition?: string;
}

export interface ContractReviewRequest {
  contractText: string;
  vendorCategory?: string;
  tradition?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface WeddingContext {
  tradition?: string;
  city?: string;
  partner1Name?: string;
  partner2Name?: string;
  weddingDate?: string;
  budget?: number;
  guestCount?: number;
}

// Draft a new contract based on requirements
export async function draftContract(
  request: ContractDraftRequest,
): Promise<string> {
  const prompt = `Please draft a professional vendor contract with the following details:

Vendor Information:
- Vendor Name: ${request.vendorName}
- Vendor Category: ${request.vendorCategory}

Event Details:
- Event: ${request.eventName}
${request.eventDate ? `- Date: ${request.eventDate}` : "- Date: To be confirmed"}
${request.eventLocation ? `- Location: ${request.eventLocation}` : "- Location: To be confirmed"}

Financial Terms:
- Total Amount: $${request.totalAmount.toLocaleString()}

Services Required:
${request.servicesDescription}

${request.specialRequirements ? `Special Requirements:\n${request.specialRequirements}` : ""}
${request.tradition ? `\nWedding Tradition: ${request.tradition} (please incorporate culturally appropriate terms)` : ""}

Please create a comprehensive, professional contract that protects both parties and is appropriate for a South Asian wedding context.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: CONTRACT_SYSTEM_PROMPT,
      },
      contents: prompt,
    });

    return response.text || "Unable to generate contract. Please try again.";
  } catch (error) {
    console.error("Error drafting contract:", error);
    throw new Error(
      "Failed to draft contract. Please check your API key and try again.",
    );
  }
}

// Review an existing contract
export async function reviewContract(
  request: ContractReviewRequest,
): Promise<string> {
  const prompt = `Please review the following vendor contract and provide a detailed analysis:

${request.vendorCategory ? `Vendor Category: ${request.vendorCategory}` : ""}
${request.tradition ? `Wedding Tradition: ${request.tradition}` : ""}

CONTRACT TEXT:
---
${request.contractText}
---

Please provide:
1. A summary of the key terms
2. Any potential issues or concerns (rated by severity)
3. Missing clauses that should be added
4. Suggested improvements
5. Questions the couple should ask the vendor before signing`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: CONTRACT_REVIEW_PROMPT,
      },
      contents: prompt,
    });

    return response.text || "Unable to review contract. Please try again.";
  } catch (error) {
    console.error("Error reviewing contract:", error);
    throw new Error(
      "Failed to review contract. Please check your API key and try again.",
    );
  }
}

// Wedding planning chat
export async function chatWithPlanner(
  message: string,
  conversationHistory: ChatMessage[],
  weddingContext?: WeddingContext,
): Promise<string> {
  // Build context message
  let contextInfo = "";
  if (weddingContext) {
    const parts = [];
    if (weddingContext.partner1Name && weddingContext.partner2Name) {
      parts.push(
        `Couple: ${weddingContext.partner1Name} & ${weddingContext.partner2Name}`,
      );
    }
    if (weddingContext.tradition)
      parts.push(`Tradition: ${weddingContext.tradition}`);
    if (weddingContext.city) parts.push(`City: ${weddingContext.city}`);
    if (weddingContext.weddingDate)
      parts.push(`Wedding Date: ${weddingContext.weddingDate}`);
    if (weddingContext.budget)
      parts.push(`Budget: $${weddingContext.budget.toLocaleString()}`);
    if (weddingContext.guestCount)
      parts.push(`Expected Guests: ${weddingContext.guestCount}`);

    if (parts.length > 0) {
      contextInfo = `\n\n[Wedding Context: ${parts.join(" | ")}]`;
    }
  }

  // Build conversation for the model
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  // Add conversation history
  for (const msg of conversationHistory) {
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    });
  }

  // Add current message with context
  contents.push({
    role: "user",
    parts: [{ text: message + contextInfo }],
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: WEDDING_PLANNING_PROMPT,
      },
      contents: contents,
    });

    return (
      response.text ||
      "I apologize, but I couldn't generate a response. Please try again."
    );
  } catch (error) {
    console.error("Error in wedding planner chat:", error);
    throw new Error("Failed to get a response. Please try again.");
  }
}

// Generate contract clauses for specific scenarios
export async function generateContractClause(
  clauseType: string,
  context: {
    vendorCategory?: string;
    tradition?: string;
    specificDetails?: string;
  },
): Promise<string> {
  const prompt = `Generate a professional contract clause for the following:

Clause Type: ${clauseType}
${context.vendorCategory ? `Vendor Category: ${context.vendorCategory}` : ""}
${context.tradition ? `Wedding Tradition: ${context.tradition}` : ""}
${context.specificDetails ? `Specific Details: ${context.specificDetails}` : ""}

Please provide a well-written, legally appropriate clause that can be added to a vendor contract for a South Asian wedding.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: CONTRACT_SYSTEM_PROMPT,
      },
      contents: prompt,
    });

    return response.text || "Unable to generate clause. Please try again.";
  } catch (error) {
    console.error("Error generating clause:", error);
    throw new Error("Failed to generate clause. Please try again.");
  }
}

// Quick suggestions for contract improvement
export async function suggestContractImprovements(
  currentTerms: string,
  vendorCategory: string,
): Promise<string[]> {
  const prompt = `Analyze the following contract terms and provide 3-5 specific improvement suggestions as a JSON array of strings:

Vendor Category: ${vendorCategory}

Current Terms:
${currentTerms}

Respond with a JSON array of improvement suggestions, each as a concise actionable item.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction:
          "You are a contract improvement assistant. Respond only with a valid JSON array of strings.",
        responseMimeType: "application/json",
      },
      contents: prompt,
    });

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Error suggesting improvements:", error);
    return [];
  }
}

// ============================================================================
// VENDOR REPLY SUGGESTIONS - AI-powered response suggestions for vendor inbox
// ============================================================================

const VENDOR_REPLY_PROMPT = `You are an expert communication assistant for wedding vendors on Viah.me, a South Asian wedding management platform. You help vendors craft professional, warm, and culturally-aware responses to couple inquiries.

Your role is to:
1. Generate helpful, professional response suggestions that vendors can use or adapt
2. Maintain a warm, welcoming tone appropriate for wedding communications
3. Be culturally sensitive to South Asian wedding traditions
4. Keep responses concise but helpful
5. Include relevant follow-up questions when appropriate

Response guidelines:
- Be professional but warm and personable
- Address specific questions from the couple
- Offer to provide more details or schedule a call
- Show enthusiasm for potentially being part of their special day
- Be culturally aware of multi-day celebrations, specific ceremonies, and traditions`;

export interface VendorReplySuggestionRequest {
  vendorName: string;
  vendorCategory: string;
  coupleName: string;
  coupleMessage: string;
  eventName?: string;
  weddingDate?: string;
  tradition?: string;
  bookingStatus?: string;
}

export async function generateVendorReplySuggestions(
  request: VendorReplySuggestionRequest,
): Promise<string[]> {
  const prompt = `Generate 3 professional response suggestions for this vendor to reply to a couple's inquiry:

Vendor: ${request.vendorName} (${request.vendorCategory})
Couple: ${request.coupleName}
${request.eventName ? `Event: ${request.eventName}` : ""}
${request.weddingDate ? `Wedding Date: ${request.weddingDate}` : ""}
${request.tradition ? `Wedding Tradition: ${request.tradition}` : ""}
${request.bookingStatus ? `Booking Status: ${request.bookingStatus}` : ""}

Couple's Message:
"${request.coupleMessage}"

Generate 3 different response options:
1. A brief, warm acknowledgment with a call to action
2. A detailed response addressing their message with follow-up questions
3. A friendly, enthusiastic response emphasizing your experience

Return as a JSON array of 3 strings.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: VENDOR_REPLY_PROMPT,
        responseMimeType: "application/json",
      },
      contents: prompt,
    });

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating vendor reply suggestions:", error);
    return [];
  }
}

// ============================================================================
// COUPLE BOOKING REQUEST SUGGESTIONS - AI-powered message suggestions for couples
// ============================================================================

const COUPLE_MESSAGE_PROMPT = `You are an expert communication assistant for couples on Viah.me, a South Asian wedding management platform. You help couples craft effective, professional messages when contacting wedding vendors.

Your role is to:
1. Generate helpful message suggestions for couples reaching out to vendors
2. Ensure the message includes relevant details vendors need
3. Be culturally aware of South Asian wedding traditions and multi-day celebrations
4. Keep messages concise but informative
5. Include relevant questions about services, pricing, or availability

Message guidelines:
- Be polite and professional
- Include key details: wedding date, event type, guest count if relevant
- Ask about availability and pricing
- Mention specific cultural requirements if applicable
- Show genuine interest in the vendor's services`;

export interface CoupleMessageSuggestionRequest {
  vendorName: string;
  vendorCategory: string;
  coupleName: string;
  eventName?: string;
  eventDate?: string;
  tradition?: string;
  city?: string;
  guestCount?: number;
  existingNotes?: string;
}

export async function generateCoupleMessageSuggestions(
  request: CoupleMessageSuggestionRequest,
): Promise<string[]> {
  const prompt = `Generate 3 message suggestions for this couple to send when requesting a booking from a vendor:

Vendor: ${request.vendorName} (${request.vendorCategory})
Couple Name: ${request.coupleName}
${request.eventName ? `Event: ${request.eventName}` : ""}
${request.eventDate ? `Event Date: ${request.eventDate}` : ""}
${request.tradition ? `Wedding Tradition: ${request.tradition}` : ""}
${request.city ? `Location: ${request.city}` : ""}
${request.guestCount ? `Estimated Guest Count: ${request.guestCount}` : ""}
${request.existingNotes ? `Couple's Notes So Far: ${request.existingNotes}` : ""}

Generate 3 different booking request message options:
1. A brief, professional inquiry asking about availability and pricing
2. A detailed message with specific questions about the ${request.vendorCategory} services
3. A warm, personal message expressing interest in their work

Return as a JSON array of 3 strings.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: COUPLE_MESSAGE_PROMPT,
        responseMimeType: "application/json",
      },
      contents: prompt,
    });

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating couple message suggestions:", error);
    return [];
  }
}

// ============================================================================
// AI TASK RECOMMENDATIONS - Personalized wedding planning task suggestions
// ============================================================================

const TASK_RECOMMENDATION_PROMPT = `You are an expert South Asian wedding planning assistant for Viah.me. You help couples stay organized by suggesting personalized, culturally-appropriate planning tasks.

Your expertise covers wedding traditions including:
- Sikh weddings: Roka, Chunni, Mehndi, Maiyan, Anand Karaj, Reception
- Hindu weddings: Roka, Sangeet, Mehndi, Haldi, Baraat, Mandap ceremony, Vidaai, Reception
- Muslim weddings: Mangni, Mehndi, Nikah, Walima
- Gujarati weddings: Pithi, Garba, Mandap ceremony
- South Indian weddings: Nalangu, Sangeeth, Muhurtham
- Mixed/Fusion weddings: Blend of traditions

When recommending tasks:
1. Consider the specific wedding tradition and its unique ceremonies
2. Prioritize tasks based on how far away the wedding date is
3. Include culturally-specific tasks (e.g., "Book Dhol players for Baraat" for Hindu/Sikh weddings)
4. Suggest vendor-related tasks appropriate for South Asian weddings
5. Include attire tasks specific to the tradition (lehengas, sherwanis, sarees, etc.)
6. Consider multi-day celebration logistics
7. Include family-oriented tasks important in South Asian culture
8. Suggest budget-appropriate options based on typical South Asian wedding costs

Task categories include:
- venue: Venue booking and coordination
- vendor: Vendor research and booking
- attire: Wedding attire and accessories
- ceremony: Ceremony planning and religious requirements
- decor: Decorations and flowers
- catering: Food and beverages
- entertainment: Music, DJ, photography, videography
- guest: Guest list and invitations
- legal: Marriage license and documentation
- beauty: Hair, makeup, and grooming
- travel: Honeymoon and guest travel
- other: Miscellaneous planning tasks`;

export interface TaskRecommendationRequest {
  tradition: string;
  weddingDate?: string;
  city?: string;
  budget?: number;
  events: Array<{ name: string; date?: string }>;
  existingTasks: Array<{
    title: string;
    completed: boolean;
    category?: string;
  }>;
  partner1Name?: string;
  partner2Name?: string;
  guestCount?: number;
}

export interface TaskRecommendation {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: string;
  suggestedDueDate?: string;
  reason: string;
}

export async function generateTaskRecommendations(
  request: TaskRecommendationRequest,
): Promise<TaskRecommendation[]> {
  const today = new Date().toISOString().split("T")[0];

  const existingTasksList = request.existingTasks
    .map(
      (t) =>
        `- ${t.title} (${t.completed ? "completed" : "pending"}${t.category ? `, ${t.category}` : ""})`,
    )
    .join("\n");

  const eventsList = request.events
    .map(
      (e) =>
        `- ${e.name}${e.date ? ` (${new Date(e.date).toLocaleDateString()})` : ""}`,
    )
    .join("\n");

  const prompt = `Generate personalized wedding planning task recommendations for this couple:

Wedding Details:
- Tradition: ${request.tradition}
${request.weddingDate ? `- Wedding Date: ${request.weddingDate}` : "- Wedding Date: Not yet set"}
${request.city ? `- City: ${request.city}` : ""}
${request.budget ? `- Budget: $${request.budget.toLocaleString()}` : ""}
${request.guestCount ? `- Expected Guests: ${request.guestCount}` : ""}
${request.partner1Name && request.partner2Name ? `- Couple: ${request.partner1Name} & ${request.partner2Name}` : ""}

Today's Date: ${today}

Planned Events:
${eventsList || "No events planned yet"}

Current Tasks:
${existingTasksList || "No tasks created yet"}

Based on the wedding tradition, timeline, and current progress, generate 5-8 personalized task recommendations that:
1. Are specific to the ${request.tradition} tradition
2. Consider what tasks are already done or in progress
3. Are prioritized based on timeline (urgent tasks if wedding is soon)
4. Include culturally-specific vendor and ceremony tasks
5. Help the couple stay on track with their planning

For each task, provide:
- title: A clear, actionable task name
- description: Brief explanation of what needs to be done
- priority: 'high', 'medium', or 'low' based on urgency
- category: One of: venue, vendor, attire, ceremony, decor, catering, entertainment, guest, legal, beauty, travel, other
- suggestedDueDate: A recommended due date in YYYY-MM-DD format (consider wedding date and typical planning timelines)
- reason: Why this task is recommended for this specific couple

Return as a JSON array of task objects.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: TASK_RECOMMENDATION_PROMPT,
        responseMimeType: "application/json",
      },
      contents: prompt,
    });

    const text = response.text || "[]";
    const recommendations = JSON.parse(text);

    // Validate and normalize the response
    return recommendations.map((rec: any) => ({
      title: String(rec.title || "").slice(0, 200),
      description: String(rec.description || "").slice(0, 500),
      priority: ["high", "medium", "low"].includes(rec.priority)
        ? rec.priority
        : "medium",
      category: String(rec.category || "other").slice(0, 50),
      suggestedDueDate: rec.suggestedDueDate || undefined,
      reason: String(rec.reason || "").slice(0, 300),
    }));
  } catch (error) {
    console.error("Error generating task recommendations:", error);
    return [];
  }
}

// Quick task suggestion for specific category
export async function suggestTasksForCategory(
  category: string,
  tradition: string,
  existingTasks: string[],
): Promise<string[]> {
  const prompt = `Suggest 3 specific ${category} tasks for a ${tradition} wedding that are NOT already in this list:
${existingTasks.map((t) => `- ${t}`).join("\n") || "No existing tasks"}

Return as a JSON array of 3 task title strings. Be specific and culturally appropriate.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: TASK_RECOMMENDATION_PROMPT,
        responseMimeType: "application/json",
      },
      contents: prompt,
    });

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Error suggesting category tasks:", error);
    return [];
  }
}

// ============================================================================
// WEBSITE CONTENT SUGGESTIONS - AI-powered content for wedding websites
// ============================================================================

const WEBSITE_CONTENT_PROMPT = `You are an expert content writer for wedding websites on Viah.me, a South Asian wedding management platform. You help couples create beautiful, culturally-appropriate content for their wedding websites.

Your expertise covers:
1. South Asian wedding traditions (Sikh, Hindu, Muslim, Gujarati, South Indian, Mixed/Fusion)
2. Multi-day celebration structures and ceremonies
3. Cultural nuances and family dynamics
4. Travel and logistics for destination weddings
5. Dress code and etiquette for different ceremonies

Writing style:
- Warm, welcoming, and romantic
- Culturally sensitive and knowledgeable
- Informative but concise
- Personal and heartfelt
- Appropriate for all generations of guests`;

export type WebsiteSectionType = "welcome" | "travel" | "accommodation" | "faq";

export interface WebsiteContentRequest {
  section: WebsiteSectionType;
  tradition: string;
  partner1Name?: string;
  partner2Name?: string;
  weddingDate?: string;
  city?: string;
  events?: Array<{
    name: string;
    date?: string;
    venue?: string;
    location?: string;
  }>;
  additionalContext?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export async function generateWebsiteContentSuggestions(
  request: WebsiteContentRequest,
): Promise<string | FAQItem[]> {
  const {
    section,
    tradition,
    partner1Name,
    partner2Name,
    weddingDate,
    city,
    events,
    additionalContext,
  } = request;

  const coupleName =
    partner1Name && partner2Name
      ? `${partner1Name} & ${partner2Name}`
      : "the couple";

  const eventsList =
    events
      ?.map(
        (e) =>
          `- ${e.name}${e.date ? ` on ${new Date(e.date).toLocaleDateString()}` : ""}${e.venue ? ` at ${e.venue}` : ""}${e.location ? ` in ${e.location}` : ""}`,
      )
      .join("\n") || "Events to be announced";

  let prompt = "";
  let responseFormat = "text";

  switch (section) {
    case "welcome":
      prompt = `Generate a warm, heartfelt welcome message for ${coupleName}'s ${tradition} wedding website.

Wedding Details:
- Tradition: ${tradition}
${weddingDate ? `- Wedding Date: ${new Date(weddingDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}` : ""}
${city ? `- Location: ${city}` : ""}
${additionalContext ? `- Additional Context: ${additionalContext}` : ""}

Planned Events:
${eventsList}

Generate a welcome message that:
1. Warmly welcomes guests to celebrate
2. Expresses excitement about the upcoming wedding
3. Briefly mentions the significance of the ${tradition} tradition
4. Sets a joyful, celebratory tone
5. Is 2-3 paragraphs long

Do NOT include a title - just the message content.`;
      break;

    case "travel":
      prompt = `Generate helpful travel information for guests attending ${coupleName}'s ${tradition} wedding.

Wedding Details:
- Tradition: ${tradition}
${city ? `- Wedding City: ${city}` : "- Location: To be announced"}
${weddingDate ? `- Wedding Date: ${new Date(weddingDate).toLocaleDateString()}` : ""}
${additionalContext ? `- Additional Context: ${additionalContext}` : ""}

Planned Events:
${eventsList}

Generate travel information that includes:
1. Recommended airports and approximate distances to venue area
2. Ground transportation options (rental cars, rideshare, shuttles)
3. Parking information if applicable
4. Weather considerations for the time of year
5. Any tips specific to ${city || "the area"}

Write in plain text without any markdown formatting (no asterisks, no bold, no headers).
Use simple line breaks between sections.
Keep it practical and guest-friendly.`;
      break;

    case "accommodation":
      prompt = `Generate accommodation recommendations for guests attending ${coupleName}'s ${tradition} wedding.

Wedding Details:
- Tradition: ${tradition}
${city ? `- Wedding City: ${city}` : "- Location: To be announced"}
${weddingDate ? `- Wedding Date: ${new Date(weddingDate).toLocaleDateString()}` : ""}
${additionalContext ? `- Additional Context: ${additionalContext}` : ""}

Planned Events:
${eventsList}

Generate accommodation suggestions that:
1. Recommend looking for hotels near the venue area
2. Suggest different price ranges (budget, mid-range, luxury)
3. Mention booking early due to wedding blocks
4. Include tips for group bookings
5. Mention Airbnb/VRBO as alternatives for families

Write in plain text without any markdown formatting (no asterisks, no bold, no headers).
Use simple line breaks between sections.
Note: Since you don't have specific hotel names, give general guidance about what to look for and suggest the couple will share specific recommendations.`;
      break;

    case "faq":
      responseFormat = "json";
      prompt = `Generate frequently asked questions and answers for ${coupleName}'s ${tradition} wedding website.

Wedding Details:
- Tradition: ${tradition}
${city ? `- Wedding City: ${city}` : ""}
${weddingDate ? `- Wedding Date: ${new Date(weddingDate).toLocaleDateString()}` : ""}
${additionalContext ? `- Additional Context: ${additionalContext}` : ""}

Planned Events:
${eventsList}

Generate 8-10 FAQs that guests commonly ask about ${tradition} weddings, including:
1. Dress code expectations for different ceremonies (mention specific attire like lehengas, sarees, sherwanis, etc.)
2. What to expect at specific ceremonies (Mehndi, Sangeet, main ceremony, reception, etc.)
3. Timing and punctuality expectations
4. Gift giving etiquette
5. Photography policies
6. Plus-one and kids policies (keep generic - say "please check your invitation")
7. Food and dietary accommodations
8. General cultural etiquette tips

Return as a JSON array of objects with "question" and "answer" fields.
Make answers warm, informative, and culturally appropriate.
Write in plain conversational English without any markdown formatting.`;
      break;
  }

  try {
    const config: any = {
      systemInstruction: WEBSITE_CONTENT_PROMPT,
    };

    if (responseFormat === "json") {
      config.responseMimeType = "application/json";
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config,
      contents: prompt,
    });

    const text = response.text || "";

    if (section === "faq") {
      try {
        const faqs = JSON.parse(text);
        return faqs.map((faq: any) => ({
          question: String(faq.question || "").slice(0, 200),
          answer: String(faq.answer || "").slice(0, 500),
        }));
      } catch {
        return [];
      }
    }

    return text;
  } catch (error) {
    console.error(`Error generating ${section} content:`, error);
    throw new Error(`Failed to generate ${section} content. Please try again.`);
  }
}

// ============================================================================
// GUEST FAQ CHATBOT - AI assistant for wedding website guests
// ============================================================================

const GUEST_FAQ_PROMPT = `You are a friendly and helpful wedding concierge assistant for a wedding website. You help guests with questions about the wedding, providing warm and informative responses based on the wedding details shared by the couple.

Your role is to:
1. Answer guest questions using ONLY the information provided about the wedding
2. Be warm, welcoming, and enthusiastic about the celebration
3. If you don't have specific information about something, politely acknowledge that and suggest guests contact the couple directly
4. Keep responses concise but helpful (2-4 sentences typically)
5. Be culturally aware of South Asian wedding traditions when relevant

Guidelines:
- Only use facts from the provided wedding context - never make up details
- For questions about invitation status, RSVPs, or plus-ones, direct guests to check their invitation or contact the couple
- Be friendly and conversational, not robotic
- If asked about something not covered in the provided info, say you don't have that information and suggest reaching out to the couple
- Never share private couple information beyond what's already on the public website`;

export interface GuestChatContext {
  coupleName?: string;
  partner1Name?: string;
  partner2Name?: string;
  weddingDate?: string;
  tradition?: string;
  welcomeMessage?: string;
  coupleStory?: string;
  travelInfo?: string;
  accommodationInfo?: string;
  thingsToDoInfo?: string;
  faqInfo?: string;
  events?: Array<{
    name: string;
    date?: string;
    time?: string;
    location?: string;
    dressCode?: string;
    locationDetails?: string;
  }>;
}

export interface GuestChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatWithGuestConcierge(
  message: string,
  conversationHistory: GuestChatMessage[],
  weddingContext: GuestChatContext,
): Promise<string> {
  // Build wedding context information
  const contextParts: string[] = [];

  if (
    weddingContext.coupleName ||
    (weddingContext.partner1Name && weddingContext.partner2Name)
  ) {
    contextParts.push(
      `Couple: ${weddingContext.coupleName || `${weddingContext.partner1Name} & ${weddingContext.partner2Name}`}`,
    );
  }
  if (weddingContext.weddingDate) {
    contextParts.push(
      `Wedding Date: ${new Date(weddingContext.weddingDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
    );
  }
  if (weddingContext.tradition) {
    contextParts.push(`Wedding Tradition: ${weddingContext.tradition}`);
  }
  if (weddingContext.welcomeMessage) {
    contextParts.push(
      `Welcome Message from Couple: ${weddingContext.welcomeMessage}`,
    );
  }
  if (weddingContext.coupleStory) {
    contextParts.push(`Couple's Story: ${weddingContext.coupleStory}`);
  }
  if (weddingContext.travelInfo) {
    contextParts.push(`Travel Information: ${weddingContext.travelInfo}`);
  }
  if (weddingContext.accommodationInfo) {
    contextParts.push(
      `Accommodation Information: ${weddingContext.accommodationInfo}`,
    );
  }
  if (weddingContext.thingsToDoInfo) {
    contextParts.push(`Things to Do in Area: ${weddingContext.thingsToDoInfo}`);
  }
  if (weddingContext.faqInfo) {
    contextParts.push(`FAQ Information: ${weddingContext.faqInfo}`);
  }
  if (weddingContext.events && weddingContext.events.length > 0) {
    const eventsList = weddingContext.events
      .map((e) => {
        const parts = [`- ${e.name}`];
        if (e.date)
          parts.push(`Date: ${new Date(e.date).toLocaleDateString()}`);
        if (e.time) parts.push(`Time: ${e.time}`);
        if (e.location) parts.push(`Location: ${e.location}`);
        if (e.locationDetails)
          parts.push(`Venue Details: ${e.locationDetails}`);
        if (e.dressCode) parts.push(`Dress Code: ${e.dressCode}`);
        return parts.join(" | ");
      })
      .join("\n");
    contextParts.push(`Wedding Events:\n${eventsList}`);
  }

  const systemPrompt = `${GUEST_FAQ_PROMPT}

WEDDING INFORMATION (use this to answer questions):
${contextParts.join("\n\n")}`;

  // Build conversation for the model
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  // Add conversation history
  for (const msg of conversationHistory) {
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    });
  }

  // Add current message
  contents.push({
    role: "user",
    parts: [{ text: message }],
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
      },
      contents: contents,
    });

    return (
      response.text ||
      "I'm sorry, I couldn't process your question. Please try again or contact the couple directly."
    );
  } catch (error) {
    console.error("Error in guest FAQ chat:", error);
    throw new Error("Failed to get a response. Please try again.");
  }
}
