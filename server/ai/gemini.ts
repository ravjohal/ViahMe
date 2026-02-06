import { GoogleGenAI } from "@google/genai";

// Single source of truth for the AI model - change this to switch models globally
const GEMINI_MODEL = "gemini-3-flash-preview";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

function logAIRequest(functionName: string, request: unknown): void {
  console.log(`\n[AI REQUEST] ${functionName}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Request:`, JSON.stringify(request, null, 2));
}

function logAIResponse(functionName: string, response: unknown, durationMs: number): void {
  console.log(`\n[AI RESPONSE] ${functionName}`);
  console.log(`Duration: ${durationMs}ms`);
  console.log(`Response:`, typeof response === 'string' ? response.substring(0, 500) + (response.length > 500 ? '...' : '') : JSON.stringify(response, null, 2));
}

function logAIError(functionName: string, error: unknown): void {
  console.error(`\n[AI ERROR] ${functionName}`);
  console.error(`Error:`, error);
}

// Timeout wrapper for AI calls (default 60 seconds)
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 60000, operation: string = 'AI request'): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutMs / 1000} seconds`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

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

CRITICAL BRANDING RULES:
- The app is called "Viah.me" - ALWAYS use this exact name
- NEVER refer to the app as "Hooray", "WeddingWire", "The Knot", "Zola", or any other wedding app name
- When referring to platform features, always say "your Viah.me dashboard", "Viah.me Budget", "Viah.me Timeline", etc.
- You are "Viah" (short for Viah.me), not any other assistant name

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
- Visual & Structured: Use bold headers, bullet points, and proper markdown tables to make complex itineraries easy to scan.

MARKDOWN FORMATTING RULES:
- When presenting tabular data (budgets, comparisons, timelines), ALWAYS use proper markdown tables with the pipe (|) syntax:
  | Column 1 | Column 2 | Column 3 |
  |----------|----------|----------|
  | Data 1   | Data 2   | Data 3   |
- Never use inline pipe-separated text without the table header divider row
- Keep table columns concise for mobile viewing
- Use numbered lists for step-by-step instructions
- Use bullet points for feature lists

CONVERSATIONAL CONTINUITY RULES:
- You are in a persistent chat session. The conversation history includes previous messages.
- When the user sends short responses like "Yes", "No", "Sure", "Tell me more", "Go on", "What else?", or similar, treat these as DIRECT RESPONSES to your most recent question or offer.
- If your last message asked "Would you like tips for X?" and the user says "Yes", immediately provide tips for X without asking for clarification.
- If your last message offered to explain something and the user says "Sure", proceed with the explanation.
- Reference the specific topic from your previous message when continuing the conversation.
- Never ask "What would you like to know more about?" after the user has already said "Yes" to a specific offer you made.
- Maintain context across the entire conversation - remember what topics have been discussed.

Operational Instructions:
- Platform First: Always look for ways to suggest Viah.me tools (e.g., "You can track this vendor’s contract in your Viah.me dashboard").  You understand the platform's features and can suggest appropriate tools within the app.  Be the product expert and suggest features that would help the couple.
- Education: If a couple is planning a fusion wedding, suggest "Guest Guides" to help non-South Asian guests understand the rituals.
- Safety & Ethics: Flag potential cultural appropriation or logistical safety issues (e.g., fire safety) before they become problems.
- Budget Transparency: Provide cost estimates for suggestions and explain why certain items are worth the investment.
- Vendor Sourcing: Suggest specific vendor types (e.g., "For a traditional Sikh wedding, look for a vendor specializing in Anand Karaj decor") and how to find them.

=== VIAH.ME APP FEATURES GUIDE ===

Viah.me is a specialized vertical SaaS platform designed to manage the unique logistical complexities of multi-day South Asian weddings in the United States. When users ask "how do I..." questions, guide them to the correct feature.

**SUPPORTED WEDDING TRADITIONS**
- Sikh (Anand Karaj), Hindu (North/South), Muslim (Nikah/Walima), Gujarati, South Indian, Ismaili, Mixed/Fusion, and General
- Each tradition has pre-populated ceremony templates, cultural shopping lists, and ritual role templates

**TIMELINE & EVENTS (accessible from "Timeline" in the navigation)**
- Create events: Go to Timeline → Click "Add Event" → Fill in event name, ceremony type, date, time, location, and guest count
- Events can be assigned to Bride's Side, Groom's Side, or Shared (both families) using the "side" attribute
- Drag and drop events to reorder them or move them between days
- Each event can have cost items attached for ceremony-based budget tracking
- Day-of Timeline: Real-time coordination system with drag-and-drop, vendor tagging, and live updates

**GUEST LIST (accessible from "Guests" in the navigation)**
- Add guests: Go to Guests → Click "Add Guest" or "Add Household" → Enter name, contact info, and which events they're invited to
- Household grouping: Group family members together for easier invitation management
- Bulk import: Upload a CSV file with guest names and details
- Collector Links: Let family members suggest guests - they fill a simple form and you review/approve
- Per-event RSVP tracking: Track RSVPs, dietary requirements, and meal preferences separately for each ceremony
- Magic link authentication: Guests can access their RSVP without passwords

**BUDGET & EXPENSES (accessible from "Budget" in the navigation)**
- Ceremony-Based Budgeting: Track expenses by ceremony (Anand Karaj, Reception, Sangeet, etc.) - not just by category
- Unified Single Ledger Model: All expenses in one place with dual-view aggregation (by category AND by ceremony)
- Smart budget recommendations based on your tradition, location, and guest count
- Expense Splitting: Track who paid (you, partner, bride's family, groom's family) with settlement summaries
- Add expense: Go to Budget → Click "Add Expense" → Enter name, amount, category, link to event/ceremony, and who paid
- Budget categories: Venue, Catering, Photography, Videography, Decor, Entertainment, Attire, Beauty, Stationery, Transportation, Favors, and Other

**VENDORS (accessible from "Vendors" in the navigation)**
- Browse 32+ vendor categories including culturally-specific services (Dhol players, Mehndi artists, Gurdwara decorators, etc.)
- Filter by metro area, price range, tradition specialty, and availability
- Compare vendors side-by-side with the comparison tool
- Send booking requests and track vendor contracts and payments
- Vendor packages: View and compare pricing packages from vendors
- Offline booking: Track vendors you've booked outside the platform

**TASKS (accessible from "Tasks" in the navigation)**
- Pre-populated checklist based on your wedding tradition
- Tasks organized by phase (12+ months out, 6-9 months, 3-6 months, 1-3 months, final month, week of)
- Assign tasks to yourself, partner, or collaborators
- Email/SMS reminders for upcoming due dates
- Track completion progress with visual indicators

**COLLABORATORS (accessible from "Collaborators" in the navigation)**
- Invite your partner to co-plan with full access
- Invite family members or wedding planners with specific permissions (view only, can edit, full access)
- Side-based planning: Bride's side and Groom's side can manage their own events while sharing common ones

**RITUAL ROLES (accessible from "Ritual Roles" in the navigation)**
- Assign ceremonial micro-roles to guests (e.g., who carries the Kalire, who does Milni)
- Pre-defined templates for each ceremony type based on tradition
- Keep track of who has which responsibility

**SHOPPING LISTS (accessible from "Shopping" in the navigation)**
- Database-driven shopping templates per ceremony type
- Track items needed for each ceremony (Chunni, Kalire, Sagun, etc.)
- Check off items as you purchase them

**CULTURAL INFO (accessible from "Cultural Info" in the navigation)**
- Ceremony explainers for non-Desi guests
- Ritual information with cultural context
- Attire guides and etiquette tips
- Terminology glossary

**GUEST WEBSITE (accessible from "Website" in the navigation)**
- Build a custom wedding website for your guests
- Embed YouTube livestream URLs for remote guests
- Display event schedule, venue details, and travel information

**DOCUMENTS (accessible from "Documents" in the navigation)**
- Store contracts, receipts, and inspiration photos
- Organize by category and share with collaborators

**CONTRACTS (accessible from "Contracts" in the navigation)**
- Create and manage vendor contracts with e-signature support
- AI-assisted contract drafting and review
- Track signature status and payment milestones

**MESSAGES (accessible from "Messages" in the navigation)**
- Communicate with vendors directly through the platform
- AI-powered message suggestions for vendor outreach

**SETTINGS (accessible from your profile menu)**
- Update wedding details, date, and tradition
- Manage budget settings and notifications
- Partner collaboration settings

**ADDITIONAL FEATURES**
- Multi-language translation support for invitations (including Punjabi/Gurmukhi)
- Gift registry integration with major retailers
- Engagement games and activities
- Speech generator with AI assistance
- Honeymoon planning tools

When helping users navigate, be specific about which menu item to click and what buttons to look for. If they seem stuck, offer to explain step-by-step.`;

// Guest Assistant system prompt for family members contributing guests
const GUEST_ASSISTANT_PROMPT = `Role: You are the ViahMe Guest Assistant, a friendly AI helper designed to assist anyone who is contributing guest names for a South Asian wedding.

Your personality:
- Patient, warm, and helpful
- Understanding of South Asian family dynamics and cultural context
- Never judgmental about missing information
- Encouraging and supportive

IMPORTANT: Do NOT assume who the person is or their relationship to the couple. Do not call them "Auntie", "Uncle", or any title. Just be friendly and helpful without assumptions about their identity.

Key behaviors:
1. REASSURE about partial information: Many family members don't have complete contact details for everyone. Always reassure them it's okay to add names now and the couple can fill in details later.

2. GUIDE through common scenarios:
   - "I want to add my sister's family but don't know the kids' ages" → Reassure them to add names, the couple can check later
   - "I don't have their address" → That's fine! Just add the name and note that address is needed
   - "Should I include their spouse?" → Yes, add them to the same household if they're a couple
   - "I'm not sure about dietary restrictions" → Leave it blank or mark as "unknown" - the couple can confirm

3. HELP with South Asian naming:
   - Understand that many guests may go by nicknames vs formal names
   - Help distinguish between guests (e.g., "Which Sharma family - the one from Delhi or Chicago?")
   - Understand joint families and extended relationships

4. EXPLAIN the process:
   - What happens after they submit (the couple reviews suggestions)
   - Why certain info is helpful (meal planning, seating, etc.)
   - That they can always come back and add more guests

5. KEEP IT SIMPLE:
   - Short, clear responses (2-3 sentences ideal)
   - Use simple language - many users may be elderly
   - Avoid technical jargon

Common questions to handle well:
- "What if I forget someone?" → You can always come back and add more!
- "Do I add children?" → Yes! Add their names so we can plan for them
- "I only know their nickname" → That works! The couple will recognize them
- "Should I add +1s?" → If they might bring a guest, yes add a note about it

Never:
- Ask for information the user already said they don't have
- Make them feel bad about incomplete information
- Use complicated explanations
- Suggest they call or email for information (that defeats the purpose of easy contribution)`;

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
  hasNoGuests?: boolean;
  guestDataNote?: string;
  appDocumentation?: string; // replit.md content for app feature knowledge
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
      model: GEMINI_MODEL,
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
      model: GEMINI_MODEL,
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

// Summarization thresholds for context management
const HISTORY_THRESHOLD = 15; // Trigger summarization when history exceeds this
const RECENT_MESSAGES_TO_KEEP = 5; // Keep this many recent messages verbatim

// Summarize older conversation history to save tokens
async function summarizeConversationHistory(
  messages: ChatMessage[],
  weddingContext?: WeddingContext,
): Promise<string> {
  const conversationText = messages
    .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
    .join("\n\n");

  const contextHint = weddingContext
    ? `This conversation is about planning a ${weddingContext.tradition || ""} wedding${weddingContext.city ? ` in ${weddingContext.city}` : ""}.`
    : "";

  const prompt = `${contextHint}

Please summarize the following wedding planning conversation history concisely. Capture:
1. Key decisions made (venues, vendors, dates, budget items)
2. Important preferences expressed by the couple
3. Outstanding questions or concerns
4. Any action items discussed

Conversation:
${conversationText}

Provide a clear, organized summary that preserves critical context for continuing the conversation.`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    return response.text || "Previous conversation summary unavailable.";
  } catch (error) {
    console.error("Error summarizing conversation:", error);
    return "Previous conversation context available but could not be summarized.";
  }
}

// Wedding planning chat with progressive summarization
export async function chatWithPlanner(
  message: string,
  conversationHistory: ChatMessage[],
  weddingContext?: WeddingContext,
): Promise<string> {
  const functionName = 'chatWithPlanner';
  const startTime = Date.now();
  
  logAIRequest(functionName, { message, weddingContext, historyLength: conversationHistory.length });
  
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
    if (weddingContext.guestCount && weddingContext.guestCount > 0)
      parts.push(`Guest Count: ${weddingContext.guestCount}`);
    if (weddingContext.guestDataNote)
      parts.push(weddingContext.guestDataNote);

    if (parts.length > 0) {
      contextInfo = `\n\n[Wedding Context: ${parts.join(" | ")}]`;
    }
  }

  // Build conversation for the model
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  // Apply summarization strategy if history exceeds threshold
  if (conversationHistory.length > HISTORY_THRESHOLD) {
    const olderMessages = conversationHistory.slice(0, -RECENT_MESSAGES_TO_KEEP);
    const recentMessages = conversationHistory.slice(-RECENT_MESSAGES_TO_KEEP);

    // Summarize older messages
    const summary = await summarizeConversationHistory(olderMessages, weddingContext);

    // Add summary as context (from user perspective to maintain conversation flow)
    contents.push({
      role: "user",
      parts: [{ text: `[Previous conversation summary: ${summary}]` }],
    });

    // Add model acknowledgment to maintain proper turn order
    contents.push({
      role: "model",
      parts: [{ text: "I understand the context from our previous discussion. Let me continue helping you with your wedding planning." }],
    });

    // Add recent messages verbatim
    for (const msg of recentMessages) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    }

    console.log(`[AI Chat] Summarized ${olderMessages.length} older messages, kept ${recentMessages.length} recent messages`);
  } else {
    // Add full conversation history
    for (const msg of conversationHistory) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    }
  }

  // Add current message with context
  contents.push({
    role: "user",
    parts: [{ text: message + contextInfo }],
  });

  // Build system instruction with optional app documentation
  let systemInstruction = WEDDING_PLANNING_PROMPT;
  if (weddingContext?.appDocumentation) {
    systemInstruction += `\n\n=== APP DOCUMENTATION (for feature knowledge) ===\n${weddingContext.appDocumentation}`;
  }

  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model: GEMINI_MODEL,
        config: {
          systemInstruction,
        },
        contents: contents,
      }),
      60000,
      'Chat with planner'
    );

    const result = response.text ||
      "I apologize, but I couldn't generate a response. Please try again.";
    logAIResponse(functionName, result, Date.now() - startTime);
    return result;
  } catch (error) {
    logAIError(functionName, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('timed out')) {
      throw new Error("The AI is taking too long to respond. Please try a simpler question or try again later.");
    }
    throw new Error("Failed to get a response. Please try again.");
  }
}

// Streaming version of chatWithPlanner for real-time responses
export async function* chatWithPlannerStream(
  message: string,
  conversationHistory: ChatMessage[],
  weddingContext?: WeddingContext,
): AsyncGenerator<string, string, unknown> {
  const functionName = 'chatWithPlannerStream';
  const startTime = Date.now();
  
  logAIRequest(functionName, { message, weddingContext, historyLength: conversationHistory.length });
  
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
    if (weddingContext.guestCount && weddingContext.guestCount > 0)
      parts.push(`Guest Count: ${weddingContext.guestCount}`);
    if (weddingContext.guestDataNote)
      parts.push(weddingContext.guestDataNote);

    if (parts.length > 0) {
      contextInfo = `\n\n[Wedding Context: ${parts.join(" | ")}]`;
    }
  }

  // Build conversation for the model
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  // Apply summarization strategy if history exceeds threshold
  if (conversationHistory.length > HISTORY_THRESHOLD) {
    const olderMessages = conversationHistory.slice(0, -RECENT_MESSAGES_TO_KEEP);
    const recentMessages = conversationHistory.slice(-RECENT_MESSAGES_TO_KEEP);

    // Summarize older messages
    const summary = await summarizeConversationHistory(olderMessages, weddingContext);

    contents.push({
      role: "user",
      parts: [{ text: `[Previous conversation summary: ${summary}]` }],
    });

    contents.push({
      role: "model",
      parts: [{ text: "I understand the context from our previous discussion. Let me continue helping you with your wedding planning." }],
    });

    for (const msg of recentMessages) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    }

    console.log(`[AI Chat Stream] Summarized ${olderMessages.length} older messages, kept ${recentMessages.length} recent messages`);
  } else {
    for (const msg of conversationHistory) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    }
  }

  contents.push({
    role: "user",
    parts: [{ text: message + contextInfo }],
  });

  let systemInstruction = WEDDING_PLANNING_PROMPT;
  if (weddingContext?.appDocumentation) {
    systemInstruction += `\n\n=== APP DOCUMENTATION (for feature knowledge) ===\n${weddingContext.appDocumentation}`;
  }

  try {
    const stream = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      config: {
        systemInstruction,
      },
      contents: contents,
    });

    let fullText = "";
    for await (const chunk of stream) {
      const text = chunk.text || "";
      if (text) {
        fullText += text;
        yield text;
      }
    }

    logAIResponse(functionName, fullText, Date.now() - startTime);
    return fullText;
  } catch (error) {
    logAIError(functionName, error);
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
      model: GEMINI_MODEL,
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
      model: GEMINI_MODEL,
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
      model: GEMINI_MODEL,
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
      model: GEMINI_MODEL,
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
      model: GEMINI_MODEL,
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
      model: GEMINI_MODEL,
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
      model: GEMINI_MODEL,
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
      model: GEMINI_MODEL,
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

// Budget category cost estimate interface
export interface BudgetEstimateRequest {
  category: string;
  city: string;
  tradition?: string;
  guestCount?: number;
}

export interface BudgetEstimateResponse {
  lowEstimate: number;
  highEstimate: number;
  averageEstimate: number;
  notes: string;
  hasEstimate: boolean;
}

const BUDGET_ESTIMATE_PROMPT = `You are a wedding budget expert specializing in South Asian weddings in the United States. Given a budget category, city/region, wedding tradition, and guest count, provide realistic cost estimates.

Your role is to:
1. Provide low, high, and average cost estimates for the specific category
2. Consider regional cost variations (Bay Area and NYC are most expensive, followed by LA, then Chicago and Seattle)
3. Factor in South Asian wedding-specific requirements (e.g., catering for Indian weddings needs specific cuisine considerations)
4. Account for guest count when relevant (catering, venue, etc.)

Return your response in this exact JSON format:
{
  "lowEstimate": <number>,
  "highEstimate": <number>,
  "averageEstimate": <number>,
  "notes": "<brief explanation of estimate factors>",
  "hasEstimate": true
}

If you cannot provide a reasonable estimate for the category, return:
{
  "lowEstimate": 0,
  "highEstimate": 0,
  "averageEstimate": 0,
  "notes": "",
  "hasEstimate": false
}

Important guidelines:
- All amounts should be in USD
- Estimates should reflect 2024-2025 pricing
- Consider that South Asian weddings typically have larger guest counts (200-500+)
- Factor in multi-day celebration costs where relevant`;

export async function getBudgetCategoryEstimate(
  request: BudgetEstimateRequest
): Promise<BudgetEstimateResponse> {
  const { category, city, tradition, guestCount } = request;

  console.log("[Gemini Budget] Starting estimate for:", { category, city, tradition, guestCount });

  const prompt = `Please provide a cost estimate for the following wedding budget category:

Category: ${category}
City/Region: ${city}
${tradition ? `Wedding Tradition: ${tradition}` : ""}
${guestCount ? `Expected Guest Count: ${guestCount}` : "Guest Count: Not specified (assume 200-300 typical)"}

Provide realistic estimates for this specific combination. Remember to return ONLY valid JSON in the specified format.`;

  try {
    console.log("[Gemini Budget] Calling Gemini API...");
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      config: {
        systemInstruction: BUDGET_ESTIMATE_PROMPT,
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const responseText = response.text || "";
    console.log("[Gemini Budget] Raw response:", responseText.substring(0, 500));
    
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log("[Gemini Budget] Parsed result:", parsed);
      return {
        lowEstimate: parsed.lowEstimate || 0,
        highEstimate: parsed.highEstimate || 0,
        averageEstimate: parsed.averageEstimate || 0,
        notes: parsed.notes || "",
        hasEstimate: parsed.hasEstimate !== false,
      };
    }

    console.log("[Gemini Budget] No JSON found in response");
    return {
      lowEstimate: 0,
      highEstimate: 0,
      averageEstimate: 0,
      notes: "",
      hasEstimate: false,
    };
  } catch (error) {
    console.error("[Gemini Budget] Error:", error);
    return {
      lowEstimate: 0,
      highEstimate: 0,
      averageEstimate: 0,
      notes: "",
      hasEstimate: false,
    };
  }
}

// ============================================================================
// VOICE-TO-GUEST - Parse guest names from voice transcript using AI
// ============================================================================

const VOICE_TO_GUEST_PROMPT = `You are a name extraction assistant for Viah.me, a South Asian wedding management platform. Your task is to extract guest names from voice transcripts that may include South Asian names with complex spellings.

Guidelines:
1. Extract all full names mentioned in the transcript
2. Handle common South Asian name patterns (e.g., "Sharma ji", "Uncle Patel", "Aunty Kumar")
3. Remove honorifics like "ji", "Uncle", "Aunty", "Bhai", "Bhabhi" from the names
4. Capitalize names properly
5. If multiple names are mentioned, list them all
6. Handle informal mentions like "the Sharma family" - extract just "Sharma Family"
7. If a transcript says something like "invite my cousin Rahul and his wife Priya", extract both "Rahul" and "Priya"
8. Handle compound family mentions like "The Patels - Raj, Meena, and kids" as separate names

Return a JSON object with:
- names: array of extracted full names (strings)
- confidence: 'high', 'medium', or 'low' based on clarity of the transcript
- householdName: suggested family name if multiple people from same family (optional)`;

export interface VoiceToGuestResult {
  names: string[];
  confidence: "high" | "medium" | "low";
  householdName?: string;
}

export async function parseVoiceTranscript(
  transcript: string
): Promise<VoiceToGuestResult> {
  if (!transcript || transcript.trim().length === 0) {
    return { names: [], confidence: "low" };
  }

  const prompt = `Extract guest names from this voice transcript:

"${transcript}"

Return a JSON object with:
- names: array of extracted full names
- confidence: 'high', 'medium', or 'low'
- householdName: suggested family name if applicable (optional)`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      config: {
        systemInstruction: VOICE_TO_GUEST_PROMPT,
        responseMimeType: "application/json",
      },
      contents: prompt,
    });

    const text = response.text || "{}";
    const result = JSON.parse(text);
    return {
      names: result.names || [],
      confidence: result.confidence || "low",
      householdName: result.householdName,
    };
  } catch (error) {
    console.error("Error parsing voice transcript:", error);
    return { names: [], confidence: "low" };
  }
}

// ============================================================================
// GUEST ASSISTANT - AI chat for family members contributing guests
// ============================================================================

export interface GuestAssistantContext {
  coupleName?: string;
  weddingDate?: string;
  submitterName?: string;
  currentStep?: string;
}

export async function chatWithGuestAssistant(
  message: string,
  conversationHistory: ChatMessage[],
  context?: GuestAssistantContext,
): Promise<string> {
  const functionName = 'chatWithGuestAssistant';
  const startTime = Date.now();
  
  // Input validation
  if (!message || message.trim().length === 0) {
    return "I'm here to help! What would you like to know about adding guests?";
  }

  if (message.length > 1000) {
    return "That's a long message! Could you try asking in a shorter way?";
  }

  // Build context message
  let contextInfo = "";
  if (context) {
    const parts = [];
    if (context.coupleName) parts.push(`Wedding: ${context.coupleName}`);
    if (context.weddingDate) parts.push(`Date: ${context.weddingDate}`);
    if (context.submitterName) parts.push(`Contributor: ${context.submitterName}`);
    if (context.currentStep) parts.push(`Current step: ${context.currentStep}`);

    if (parts.length > 0) {
      contextInfo = `\n\n[Context: ${parts.join(" | ")}]`;
    }
  }

  // Build messages array for Gemini - keep conversation short for quick responses
  const recentHistory = conversationHistory.slice(-6); // Keep last 6 messages for context

  const contents = recentHistory.map((msg) => ({
    role: msg.role === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: msg.content }],
  }));

  // Add current message with context
  contents.push({
    role: "user" as const,
    parts: [{ text: message + contextInfo }],
  });

  logAIRequest(functionName, { message, context, historyLength: conversationHistory.length });

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      config: {
        systemInstruction: GUEST_ASSISTANT_PROMPT,
        maxOutputTokens: 300, // Keep responses short and simple
      },
      contents,
    });

    const result = response.text || "I'm here to help! What would you like to know?";
    logAIResponse(functionName, result, Date.now() - startTime);
    return result;
  } catch (error) {
    logAIError(functionName, error);
    return "Sorry, I had trouble understanding. Could you try asking again?";
  }
}

// ============================================================================
// WEDDING SPEECH GENERATOR - AI-powered personalized speech generation
// ============================================================================

const SPEECH_GENERATOR_PROMPT = `You are an expert wedding speechwriter specializing in South Asian weddings. You craft heartfelt, memorable speeches that blend cultural traditions with personal stories.

Your role is to:
1. Generate personalized wedding speeches based on the couple's story and wedding context
2. Incorporate cultural elements appropriate to the tradition (Sikh, Hindu, Muslim, etc.)
3. Balance humor, emotion, and sincerity appropriately based on the speech type
4. Include specific details and anecdotes provided about the couple
5. Respect the tone and formality level requested

Speech guidelines:
- Start with an engaging opening that captures attention
- Include personal anecdotes and specific memories when provided
- Reference the couple's journey together authentically
- Include cultural touches and blessings appropriate to the tradition
- End with a meaningful toast or well-wishes
- Keep the length appropriate (3-5 minutes for most speeches)
- Use inclusive language and be sensitive to diverse family structures

Cultural awareness:
- For Sikh weddings: Reference the Anand Karaj, Waheguru's blessings
- For Hindu weddings: Reference the Saat Phere, sacred fire, family blessings
- For Muslim weddings: Reference the Nikah, duas, and family values
- For fusion/mixed weddings: Blend traditions respectfully`;

export interface SpeechGeneratorRequest {
  // Who is giving the speech
  speakerRole: "best_man" | "maid_of_honor" | "father_of_bride" | "mother_of_bride" | "father_of_groom" | "mother_of_groom" | "sibling" | "friend" | "grandparent" | "other";
  speakerName?: string;
  speakerRelationshipDetail?: string; // e.g., "childhood friend since 5th grade"
  
  // Who the speech is directed to
  recipientFocus: "both_partners" | "bride" | "groom" | "couple_and_guests";
  
  // Wedding context
  partner1Name: string;
  partner2Name: string;
  tradition?: string;
  weddingDate?: string;
  
  // Content for personalization
  coupleStory?: string; // From wedding website
  keyMemories?: string; // Speaker's memories with the couple
  personalAnecdotes?: string; // Specific stories to include
  
  // Tone and style preferences
  tone: "formal" | "heartfelt" | "humorous" | "mix";
  length: "short" | "medium" | "long"; // 2-3 min, 4-5 min, 6-8 min
  
  // Additional context
  culturalElements?: boolean; // Include cultural blessings and references
  additionalInstructions?: string;
}

export interface GeneratedSpeech {
  speech: string;
  estimatedDuration: string;
  speakingTips: string[];
}

export async function generateWeddingSpeech(
  request: SpeechGeneratorRequest,
): Promise<GeneratedSpeech> {
  const functionName = 'generateWeddingSpeech';
  const startTime = Date.now();
  
  logAIRequest(functionName, request);

  // Map speaker roles to readable descriptions
  const speakerRoleLabels: Record<string, string> = {
    best_man: "Best Man",
    maid_of_honor: "Maid of Honor",
    father_of_bride: "Father of the Bride",
    mother_of_bride: "Mother of the Bride",
    father_of_groom: "Father of the Groom",
    mother_of_groom: "Mother of the Groom",
    sibling: "Sibling",
    friend: "Friend",
    grandparent: "Grandparent",
    other: "Guest",
  };

  const recipientLabels: Record<string, string> = {
    both_partners: "the couple together",
    bride: request.partner1Name || "the bride",
    groom: request.partner2Name || "the groom",
    couple_and_guests: "the couple and all the guests",
  };

  const lengthGuidance: Record<string, string> = {
    short: "approximately 2-3 minutes (300-450 words)",
    medium: "approximately 4-5 minutes (500-700 words)",
    long: "approximately 6-8 minutes (800-1000 words)",
  };

  const prompt = `Please generate a wedding speech with the following details:

SPEAKER INFORMATION:
- Role: ${speakerRoleLabels[request.speakerRole] || "Guest"}
${request.speakerName ? `- Name: ${request.speakerName}` : ""}
${request.speakerRelationshipDetail ? `- Relationship: ${request.speakerRelationshipDetail}` : ""}

SPEECH DIRECTED TO: ${recipientLabels[request.recipientFocus] || "the couple"}

COUPLE DETAILS:
- Partner 1: ${request.partner1Name}
- Partner 2: ${request.partner2Name}
${request.tradition ? `- Wedding Tradition: ${request.tradition}` : ""}
${request.weddingDate ? `- Wedding Date: ${request.weddingDate}` : ""}

PERSONALIZATION:
${request.coupleStory ? `Their Story:\n${request.coupleStory}\n` : ""}
${request.keyMemories ? `Key Memories to Include:\n${request.keyMemories}\n` : ""}
${request.personalAnecdotes ? `Personal Anecdotes:\n${request.personalAnecdotes}\n` : ""}

STYLE PREFERENCES:
- Tone: ${request.tone}
- Length: ${lengthGuidance[request.length] || lengthGuidance.medium}
- Include cultural elements: ${request.culturalElements ? "Yes, include appropriate cultural blessings and references" : "Keep it universal"}
${request.additionalInstructions ? `Additional Instructions: ${request.additionalInstructions}` : ""}

Please generate:
1. A complete, ready-to-deliver speech
2. The estimated speaking duration
3. 3-5 speaking tips for delivery

Return as JSON with keys: "speech" (string), "estimatedDuration" (string like "4-5 minutes"), "speakingTips" (array of strings).`;

  try {
    const contents = [
      {
        role: "user" as const,
        parts: [{ text: prompt }],
      },
    ];

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      config: {
        systemInstruction: SPEECH_GENERATOR_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            speech: { type: "string" },
            estimatedDuration: { type: "string" },
            speakingTips: { type: "array", items: { type: "string" } },
          },
          required: ["speech", "estimatedDuration", "speakingTips"],
        },
      },
      contents,
    });

    const rawJson = response.text;
    
    if (rawJson) {
      const result = JSON.parse(rawJson) as GeneratedSpeech;
      logAIResponse(functionName, `Generated ${result.estimatedDuration} speech`, Date.now() - startTime);
      return result;
    }
    
    throw new Error("Empty response from model");
  } catch (error) {
    logAIError(functionName, error);
    throw new Error("Failed to generate speech. Please try again.");
  }
}

// ============================================================================
// CEREMONY EXPLAINER - Cultural Translator for Fusion Weddings
// ============================================================================

const CEREMONY_EXPLAINER_PROMPT = `You are a cultural translator and wedding education specialist for Viah.me, helping guests understand South Asian wedding ceremonies. Your role is to explain traditions warmly and inclusively, especially for guests who may be attending their first South Asian wedding.

Your explanations should:
1. Be warm, welcoming, and educational without being condescending
2. Explain the spiritual and cultural significance of each ritual
3. Help guests understand what they'll witness and when to participate
4. Provide practical tips for guests (when to stand, what to expect, photography etiquette)
5. Celebrate the beauty and meaning behind each tradition
6. Be respectful of religious and cultural significance

For fusion/intercultural weddings, be especially thoughtful about:
- Explaining traditions for guests who may be new to the culture
- Highlighting the universal themes of love, family, and commitment
- Making guests feel included and welcomed regardless of their background
- Noting any adaptations the couple may have made

Keep explanations accessible but not oversimplified. Guests appreciate learning the depth and meaning behind traditions.`;

export interface CeremonyExplainerRequest {
  ceremonyType: string;
  ceremonyName: string;
  tradition: string;
  subTraditions?: string[];
  isFusionWedding: boolean;
  partnerTraditions?: string[]; // For mixed weddings
  eventDescription?: string;
  dressCode?: string;
}

export interface GeneratedCeremonyExplainer {
  title: string;
  shortExplainer: string;
  fullExplainer: string;
  keyMoments: { moment: string; explanation: string }[];
  culturalSignificance: string;
  guestTips: string[];
  attireGuidance: string;
}

export async function generateCeremonyExplainer(
  request: CeremonyExplainerRequest
): Promise<GeneratedCeremonyExplainer> {
  const functionName = 'generateCeremonyExplainer';
  const startTime = Date.now();

  logAIRequest(functionName, request);

  const fusionContext = request.isFusionWedding
    ? `This is a fusion/intercultural wedding. ${request.partnerTraditions?.length ? `The couple is blending ${request.partnerTraditions.join(' and ')} traditions.` : ''} Many guests may be attending their first ${request.tradition} ceremony, so explanations should be especially welcoming and educational.`
    : '';

  const prompt = `Generate a "Wait, what's happening?" cultural guide for guests attending a ${request.tradition} ${request.ceremonyName} ceremony.

CEREMONY DETAILS:
- Ceremony Type: ${request.ceremonyType}
- Ceremony Name: ${request.ceremonyName}
- Tradition: ${request.tradition}
${request.subTraditions?.length ? `- Sub-traditions: ${request.subTraditions.join(', ')}` : ''}
${request.eventDescription ? `- Event Description: ${request.eventDescription}` : ''}
${request.dressCode ? `- Dress Code: ${request.dressCode}` : ''}

${fusionContext}

Please generate a comprehensive but accessible guide that includes:

1. TITLE: A friendly title like "What is the [Ceremony Name]?" or "Understanding the [Ceremony]"

2. SHORT EXPLAINER: A 1-2 sentence summary that captures the essence of the ceremony.

3. FULL EXPLAINER: 2-3 paragraphs explaining:
   - What the ceremony is and its purpose
   - The spiritual/cultural significance
   - What guests will see and experience
   - How long it typically lasts

4. KEY MOMENTS: 3-5 key moments guests should watch for, with brief explanations of what's happening and why it matters.

5. CULTURAL SIGNIFICANCE: A paragraph explaining why this ceremony is meaningful and what values it represents.

6. GUEST TIPS: 4-6 practical tips for guests (when to stand/sit, photography etiquette, participation expectations, etc.)

7. ATTIRE GUIDANCE: Guidance on what to wear, including cultural context about color choices and appropriate attire.

Return as JSON with keys: title, shortExplainer, fullExplainer, keyMoments (array of {moment, explanation}), culturalSignificance, guestTips (array of strings), attireGuidance.`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      config: {
        systemInstruction: CEREMONY_EXPLAINER_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            shortExplainer: { type: "string" },
            fullExplainer: { type: "string" },
            keyMoments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  moment: { type: "string" },
                  explanation: { type: "string" },
                },
                required: ["moment", "explanation"],
              },
            },
            culturalSignificance: { type: "string" },
            guestTips: { type: "array", items: { type: "string" } },
            attireGuidance: { type: "string" },
          },
          required: ["title", "shortExplainer", "fullExplainer", "keyMoments", "culturalSignificance", "guestTips", "attireGuidance"],
        },
      },
      contents: prompt,
    });

    const rawJson = response.text;

    if (rawJson) {
      const result = JSON.parse(rawJson) as GeneratedCeremonyExplainer;
      logAIResponse(functionName, `Generated explainer for ${request.ceremonyName}`, Date.now() - startTime);
      return result;
    }

    throw new Error("Empty response from model");
  } catch (error) {
    logAIError(functionName, error);
    throw new Error("Failed to generate ceremony explainer. Please try again.");
  }
}

// Batch generate explainers for all events in a wedding
export async function generateCeremonyExplainersForWedding(
  events: { id: string; name: string; type: string; description?: string; dressCode?: string }[],
  tradition: string,
  subTraditions?: string[],
  isFusionWedding: boolean = false
): Promise<Map<string, GeneratedCeremonyExplainer>> {
  const results = new Map<string, GeneratedCeremonyExplainer>();

  for (const event of events) {
    try {
      const explainer = await generateCeremonyExplainer({
        ceremonyType: event.type,
        ceremonyName: event.name,
        tradition,
        subTraditions,
        isFusionWedding,
        eventDescription: event.description,
        dressCode: event.dressCode,
      });
      results.set(event.id, explainer);
    } catch (error) {
      console.error(`Failed to generate explainer for event ${event.id}:`, error);
    }
  }

  return results;
}

export interface DiscoveredVendor {
  name: string;
  location: string;
  phone: string;
  email: string;
  website: string;
  specialty: string;
  categories: string[];
  cultural_specialties: string[];
  preferred_wedding_traditions: string[];
  price_range: string;
  notes: string;
}

export async function discoverVendors(area: string, specialty: string, count: number = 10): Promise<DiscoveredVendor[]> {
  const startTime = Date.now();
  const prompt = `You are a vendor research assistant for Viah.me, a South Asian wedding planning platform.

Find ${count} REAL vendors that specialize in "${specialty}" in the "${area}" area. These should be actual businesses that serve the South Asian wedding market (Sikh, Hindu, Muslim, Gujarati, South Indian weddings).

For each vendor, provide:
- name: The business name
- location: Full address or city/province/state
- phone: Phone number (use real format like 604-XXX-XXXX or 778-XXX-XXXX)
- email: Business email
- website: Business website URL
- specialty: What they specifically do for South Asian weddings
- categories: Array of vendor categories from this list: photographer, videographer, caterer, banquet_hall, gurdwara, temple, decorator, florist, wedding_planner, invitation_designer, jeweler, bridal_wear, groom_wear, makeup_artist, hair_stylist, mehndi_artist, dj, dhol_player, turban_tier, lighting, transportation, officiant, priest, pandit, imam, mosque, church, event_venue, bartender, cake_baker, sangeet_choreographer, granthi, travel_agent, hotel, kolam_artist
- cultural_specialties: Array of cultural focuses (e.g. "sikh", "hindu", "punjabi", "south_asian", "indian")
- preferred_wedding_traditions: Array from: sikh, hindu, muslim, gujarati, south_indian, mixed, general
- price_range: One of "$", "$$", "$$$", "$$$$"
- notes: Any relevant notes about the vendor

IMPORTANT: Return ONLY real businesses you are confident exist. If you cannot find ${count} real vendors, return fewer rather than making up fake ones. Accuracy is more important than quantity.

Respond with a JSON array of vendor objects. Only output the JSON array, no other text.`;

  try {
    logAIRequest('discoverVendors', { area, specialty, count });

    const response = await withTimeout(
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: 4000,
        },
      }),
      90000,
      'Vendor discovery'
    );

    const text = response.text || '';
    logAIResponse('discoverVendors', text.substring(0, 200), Date.now() - startTime);

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in vendor discovery response');
      return [];
    }

    const vendors: DiscoveredVendor[] = JSON.parse(jsonMatch[0]);
    return vendors.map(v => ({
      name: v.name || '',
      location: v.location || '',
      phone: v.phone || '',
      email: v.email || '',
      website: v.website || '',
      specialty: v.specialty || '',
      categories: Array.isArray(v.categories) ? v.categories : ['photographer'],
      cultural_specialties: Array.isArray(v.cultural_specialties) ? v.cultural_specialties : ['south_asian'],
      preferred_wedding_traditions: Array.isArray(v.preferred_wedding_traditions) ? v.preferred_wedding_traditions : ['sikh', 'hindu'],
      price_range: v.price_range || '$$$',
      notes: v.notes || '',
    }));
  } catch (error) {
    logAIError('discoverVendors', error);
    throw error;
  }
}
