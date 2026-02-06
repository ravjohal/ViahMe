import {
  type User,
  type InsertUser,
  type Wedding,
  type InsertWedding,
  type Event,
  type InsertEvent,
  type EventCostItem,
  type InsertEventCostItem,
  type Vendor,
  type InsertVendor,
  type ServicePackage,
  type InsertServicePackage,
  type Booking,
  type InsertBooking,
  type Guest,
  type InsertGuest,
  type Household,
  type InsertHousehold,
  type Invitation,
  type InsertInvitation,
  type Task,
  type InsertTask,
  type TaskReminder,
  type InsertTaskReminder,
  type TaskComment,
  type InsertTaskComment,
  type Contract,
  type InsertContract,
  type ContractTemplate,
  type InsertContractTemplate,
  type Message,
  type InsertMessage,
  type QuickReplyTemplate,
  type InsertQuickReplyTemplate,
  type FollowUpReminder,
  type InsertFollowUpReminder,
  type Review,
  type InsertReview,
  type Playlist,
  type InsertPlaylist,
  type PlaylistSong,
  type InsertPlaylistSong,
  type SongVote,
  type InsertSongVote,
  type Document,
  type InsertDocument,
  type WeddingWebsite,
  type InsertWeddingWebsite,
  type RegistryRetailer,
  type InsertRegistryRetailer,
  type WeddingRegistry,
  type InsertWeddingRegistry,
  type PhotoGallery,
  type InsertPhotoGallery,
  type Photo,
  type InsertPhoto,
  type VendorAvailability,
  type InsertVendorAvailability,
  type VendorCalendarAccount,
  type InsertVendorCalendarAccount,
  type VendorCalendar,
  type InsertVendorCalendar,
  type ContractSignature,
  type InsertContractSignature,
  type InvitationCard,
  type InsertInvitationCard,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type MeasurementProfile,
  type InsertMeasurementProfile,
  type ShoppingOrderItem,
  type InsertShoppingOrderItem,
  type GapWindow,
  type InsertGapWindow,
  type GapRecommendation,
  type InsertGapRecommendation,
  type RitualStage,
  type InsertRitualStage,
  type RitualStageUpdate,
  type InsertRitualStageUpdate,
  type GuestNotification,
  type InsertGuestNotification,
  type LiveWeddingStatus,
  type InsertLiveWeddingStatus,
  type WeddingRole,
  type InsertWeddingRole,
  type RolePermission,
  type InsertRolePermission,
  type WeddingCollaborator,
  type InsertWeddingCollaborator,
  type CollaboratorActivityLog,
  type InsertCollaboratorActivityLog,
  type RoleWithPermissions,
  type CollaboratorWithDetails,
  type PermissionCategory,
  type PermissionLevel,
  PERMISSION_CATEGORIES,
  type GuestSource,
  type InsertGuestSource,
  type GuestListScenario,
  type InsertGuestListScenario,
  type ScenarioHousehold,
  type InsertScenarioHousehold,
  type GuestBudgetSettings,
  type InsertGuestBudgetSettings,
  type ScenarioWithStats,
  type VendorEventTag,
  type InsertVendorEventTag,
  type TimelineChange,
  type InsertTimelineChange,
  type VendorAcknowledgment,
  type InsertVendorAcknowledgment,
  type VendorEventTagWithVendor,
  type TimelineChangeWithAcks,
  type VendorAcknowledgmentWithDetails,
  type VendorTeammate,
  type InsertVendorTeammate,
  type VendorTeammateInvitation,
  type InsertVendorTeammateInvitation,
  type VendorTeammateWithUser,
  type ContractDocument,
  type InsertContractDocument,
  type ContractPayment,
  type InsertContractPayment,
  type Expense,
  type InsertExpense,
  type ExpenseSplit,
  type InsertExpenseSplit,
  type QuoteRequest,
  type InsertQuoteRequest,
  type ConversationStatus,
  type InsertConversationStatus,
  type VendorLead,
  type InsertVendorLead,
  type LeadNurtureSequence,
  type InsertLeadNurtureSequence,
  type LeadNurtureStep,
  type InsertLeadNurtureStep,
  type LeadNurtureAction,
  type InsertLeadNurtureAction,
  type LeadActivityLog,
  type InsertLeadActivityLog,
  type VendorClaimStaging,
  type InsertVendorClaimStaging,
  type HouseholdMergeAudit,
  type InsertHouseholdMergeAudit,
  type GuestCollectorLink,
  type InsertGuestCollectorLink,
  type GuestCollectorSubmission,
  type InsertGuestCollectorSubmission,
  type VendorFavorite,
  type InsertVendorFavorite,
  type TaskTemplate,
  taskTemplates,
  type GuestCommunication,
  type InsertGuestCommunication,
  type CommunicationRecipient,
  type InsertCommunicationRecipient,
  guestCommunications,
  communicationRecipients,
  type IgnoredDuplicatePair,
  type InsertIgnoredDuplicatePair,
  type EngagementGame,
  type InsertEngagementGame,
  type ScavengerChallenge,
  type InsertScavengerChallenge,
  type TriviaQuestion,
  type InsertTriviaQuestion,
  type GameParticipation,
  type InsertGameParticipation,
  type ScavengerSubmission,
  type InsertScavengerSubmission,
  type TriviaAnswer,
  type InsertTriviaAnswer,
  type LeaderboardEntry,
  type GameWithStats,
  type BudgetAlert,
  type InsertBudgetAlert,
  type DashboardWidget,
  type InsertDashboardWidget,
  type CeremonyType,
  type InsertCeremonyType,
  type CeremonyBudgetCategory,
  type InsertCeremonyBudgetCategory,
  ceremonyTypes,
  ceremonyBudgetCategories,
  type WeddingLineItem,
  type InsertWeddingLineItem,
  weddingLineItems,
  type RegionalPricing,
  type InsertRegionalPricing,
  type BudgetAllocation,
  type InsertBudgetAllocation,
  type RitualRoleAssignment,
  type InsertRitualRoleAssignment,
  type RitualRoleTemplate,
  type InsertRitualRoleTemplate,
  ritualRoleTemplates,
  RITUAL_ROLE_TEMPLATES,
  type MilniList,
  type InsertMilniList,
  type MilniParticipant,
  type InsertMilniParticipant,
  type MilniPair,
  type InsertMilniPair,
  type MilniPairWithParticipants,
  type MilniListWithDetails,
  milniLists,
  milniParticipants,
  milniPairs,
  vendorAccessPasses,
  type VendorAccessPass,
  type InsertVendorAccessPass,
  ceremonyExplainers,
  type CeremonyExplainer,
  type InsertCeremonyExplainer,
  decorItems,
  type DecorItem,
  type InsertDecorItem,
  DEFAULT_DECOR_LIBRARY,
  dayOfTimelineItems,
  type DayOfTimelineItem,
  type InsertDayOfTimelineItem,
  SIKH_WEDDING_DAY_TEMPLATE,
  honeymoonFlights,
  type HoneymoonFlight,
  type InsertHoneymoonFlight,
  honeymoonHotels,
  type HoneymoonHotel,
  type InsertHoneymoonHotel,
  honeymoonActivities,
  type HoneymoonActivity,
  type InsertHoneymoonActivity,
  honeymoonBudgetItems,
  type HoneymoonBudgetItem,
  type InsertHoneymoonBudgetItem,
  favours,
  type Favour,
  type InsertFavour,
  favourRecipients,
  type FavourRecipient,
  type InsertFavourRecipient,
  budgetScenarios,
  type BudgetScenario,
  type InsertBudgetScenario,
  traditionRituals,
  type TraditionRitual,
  type InsertTraditionRitual,
  budgetAllocations,
  budgetAlerts,
  dashboardWidgets,
  // ceremonyTypes already imported above
  regionalPricing,
  ritualRoleAssignments,
  type BudgetBucket,
  getBucketLabel,
  weddingTraditions,
  type WeddingTradition,
  type InsertWeddingTradition,
  weddingSubTraditions,
  type WeddingSubTradition,
  type InsertWeddingSubTradition,
  DEFAULT_TRADITIONS,
  DEFAULT_SUB_TRADITIONS,
  type BudgetCategory,
  type InsertBudgetCategory,
  budgetCategories,
  vendorCategories,
  type VendorCategory,
  type InsertVendorCategory,
  DEFAULT_VENDOR_CATEGORIES,
  pricingRegions,
  type PricingRegion,
  type InsertPricingRegion,
  DEFAULT_PRICING_REGIONS,
  favourCategories,
  type FavourCategory,
  type InsertFavourCategory,
  decorCategories,
  type DecorCategory,
  type InsertDecorCategory,
  decorItemTemplates,
  type DecorItemTemplate,
  type InsertDecorItemTemplate,
  honeymoonBudgetCategories,
  type HoneymoonBudgetCategory,
  type InsertHoneymoonBudgetCategory,
  dietaryOptions,
  type DietaryOption,
  type InsertDietaryOption,
  milniRelationOptions,
  type MilniRelationOption,
  type InsertMilniRelationOption,
  milniPairTemplates,
  type MilniPairTemplate,
  type InsertMilniPairTemplate,
  timelineTemplates,
  type TimelineTemplate,
  type InsertTimelineTemplate,
  vendorTaskCategories,
  type VendorTaskCategory,
  type UserFeedback,
  type InsertUserFeedback,
  userFeedback,
  type InsertVendorTaskCategory,
  type MetroArea,
  type InsertMetroArea,
  aiChatMessages,
  type AiChatMessage,
  type InsertAiChatMessage,
  aiFaq,
  type AiFaq,
  type InsertAiFaq,
  discoveryJobs,
  type DiscoveryJob,
  type InsertDiscoveryJob,
  stagedVendors,
  type StagedVendor,
  type InsertStagedVendor,
  polls,
  type Poll,
  type InsertPoll,
  pollOptions,
  type PollOption,
  type InsertPollOption,
  pollVotes,
  type PollVote,
  type InsertPollVote,
} from "@shared/schema";
import { randomUUID, randomBytes } from "crypto";
import bcrypt from "bcrypt";

// Helper to normalize members field - ensures it's always an array
// Handles both legacy stringified JSON and proper JSONB arrays
function normalizeMembers(members: unknown): any[] {
  if (Array.isArray(members)) return members;
  if (typeof members === 'string') {
    try {
      const parsed = JSON.parse(members);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Normalize a submission to ensure members is an array
function normalizeSubmission<T extends { members?: unknown }>(submission: T): T {
  return { ...submission, members: normalizeMembers(submission.members) };
}

// Helper functions for conversationId management
export function generateConversationId(weddingId: string, vendorId: string, eventId?: string): string {
  const base = `${weddingId}-vendor-${vendorId}`;
  return eventId ? `${base}-event-${eventId}` : base;
}

export function parseConversationId(conversationId: string): { weddingId: string; vendorId: string; eventId?: string } | null {
  // New format: weddingId-vendor-vendorId-event-eventId
  // Old format: weddingId-vendor-vendorId (still supported)
  const eventParts = conversationId.split('-event-');
  const hasEventId = eventParts.length === 2;
  const baseConversation = eventParts[0];
  const eventId = hasEventId ? eventParts[1] : undefined;
  
  const parts = baseConversation.split('-vendor-');
  if (parts.length !== 2) return null;
  
  return { 
    weddingId: parts[0], 
    vendorId: parts[1],
    eventId 
  };
}

export interface IStorage {
  // Users & Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  updateUserPassword(id: string, passwordHash: string): Promise<boolean>;
  setVerificationToken(id: string, token: string, expires: Date): Promise<boolean>;
  setResetToken(id: string, token: string, expires: Date): Promise<boolean>;
  verifyEmail(userId: string): Promise<boolean>;
  clearVerificationToken(userId: string): Promise<boolean>;
  clearResetToken(userId: string): Promise<boolean>;
  updateLastLogin(userId: string): Promise<boolean>;

  // Weddings
  getWedding(id: string): Promise<Wedding | undefined>;
  getWeddingsByUser(userId: string): Promise<Wedding[]>;
  getWeddingsForCollaborator(userId: string): Promise<Wedding[]>;
  createWedding(wedding: InsertWedding): Promise<Wedding>;
  updateWedding(id: string, wedding: Partial<InsertWedding>): Promise<Wedding | undefined>;

  // Events
  getEvent(id: string): Promise<Event | undefined>;
  getEventsByWedding(weddingId: string): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;

  // Event Cost Items
  getEventCostItem(id: string): Promise<EventCostItem | undefined>;
  getEventCostItemsByEvent(eventId: string): Promise<EventCostItem[]>;
  createEventCostItem(costItem: InsertEventCostItem): Promise<EventCostItem>;
  updateEventCostItem(id: string, costItem: Partial<InsertEventCostItem>): Promise<EventCostItem | undefined>;
  deleteEventCostItem(id: string): Promise<boolean>;

  // Vendors
  getVendor(id: string): Promise<Vendor | undefined>;
  getVendorsByIds(ids: string[]): Promise<Vendor[]>;
  getAllVendors(): Promise<Vendor[]>;
  getVendorsByCategory(category: string): Promise<Vendor[]>;
  getVendorsByLocation(location: string): Promise<Vendor[]>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor | undefined>;
  // Ghost Profile / Claim methods
  getVendorByGooglePlaceId(placeId: string): Promise<Vendor | undefined>;
  getVendorByClaimToken(token: string): Promise<Vendor | undefined>;
  incrementVendorViewCount(id: string): Promise<void>;
  queueClaimNotification(vendorId: string): Promise<void>;
  sendClaimEmail(vendorId: string, email: string, vendorName: string, claimLink: string): Promise<void>;

  // Service Packages
  getServicePackage(id: string): Promise<ServicePackage | undefined>;
  getServicePackagesByVendor(vendorId: string): Promise<ServicePackage[]>;
  createServicePackage(pkg: InsertServicePackage): Promise<ServicePackage>;
  updateServicePackage(id: string, pkg: Partial<InsertServicePackage>): Promise<ServicePackage | undefined>;
  deleteServicePackage(id: string): Promise<boolean>;

  // Bookings
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByWedding(weddingId: string): Promise<Booking[]>;
  getBookingsWithVendorsByWedding(weddingId: string): Promise<Array<Booking & { vendor: Vendor }>>;
  getBookingsByVendor(vendorId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined>;

  // Vendor Favorites
  getVendorFavoritesByWedding(weddingId: string): Promise<VendorFavorite[]>;
  getVendorFavorite(weddingId: string, vendorId: string): Promise<VendorFavorite | undefined>;
  addVendorFavorite(favorite: InsertVendorFavorite): Promise<VendorFavorite>;
  removeVendorFavorite(weddingId: string, vendorId: string): Promise<boolean>;

  // Budget Allocations - Unified budget planning (Single Ledger Model)
  // Handles bucket-level, ceremony-level, and line-item-level allocations
  getBudgetAllocation(id: string): Promise<BudgetAllocation | undefined>;
  getBudgetAllocationsByWedding(weddingId: string): Promise<BudgetAllocation[]>;
  getBudgetAllocationByBucket(weddingId: string, bucket: BudgetBucket, ceremonyId?: string | null, lineItemLabel?: string | null): Promise<BudgetAllocation | undefined>; // @deprecated - use getBudgetAllocationByBucketCategoryId
  getBudgetAllocationByBucketCategoryId(weddingId: string, bucketCategoryId: string, ceremonyId?: string | null, lineItemLabel?: string | null): Promise<BudgetAllocation | undefined>;
  getBudgetAllocationsByCeremony(weddingId: string, ceremonyId: string): Promise<BudgetAllocation[]>;
  getBudgetAllocationsByBucket(weddingId: string, bucket: BudgetBucket): Promise<BudgetAllocation[]>; // @deprecated - use getBudgetAllocationsByBucketCategoryId
  getBudgetAllocationsByBucketCategoryId(weddingId: string, bucketCategoryId: string): Promise<BudgetAllocation[]>;
  createBudgetAllocation(allocation: InsertBudgetAllocation): Promise<BudgetAllocation>;
  updateBudgetAllocation(id: string, allocation: Partial<InsertBudgetAllocation>): Promise<BudgetAllocation | undefined>;
  upsertBudgetAllocation(weddingId: string, bucket: BudgetBucket, allocatedAmount: string, ceremonyId?: string | null, lineItemLabel?: string | null, notes?: string | null): Promise<BudgetAllocation>; // @deprecated - use upsertBudgetAllocationByUUID
  upsertBudgetAllocationByUUID(weddingId: string, bucketCategoryId: string, allocatedAmount: string, ceremonyId?: string | null, lineItemLabel?: string | null, notes?: string | null): Promise<BudgetAllocation>;
  deleteBudgetAllocation(id: string): Promise<boolean>;
  getCeremonyTotalAllocated(weddingId: string, ceremonyId: string): Promise<number>;
  getBucketTotalAllocated(weddingId: string, bucket: BudgetBucket): Promise<number>; // @deprecated - use getBucketTotalAllocatedByUUID
  getBucketTotalAllocatedByUUID(weddingId: string, bucketCategoryId: string): Promise<number>;
  getBudgetBucketCategory(id: string): Promise<BudgetBucketCategory | undefined>;
  getAllBudgetBucketCategories(): Promise<BudgetBucketCategory[]>;
  recalculateBucketAllocationsFromCeremonies(weddingId: string): Promise<void>; // Sync auto amounts from ceremony budget categories

  // Expenses (Single Ledger Model)
  getExpense(id: string): Promise<Expense | undefined>;
  getExpensesByWedding(weddingId: string): Promise<Expense[]>;
  getExpensesByBucket(weddingId: string, bucket: BudgetBucket): Promise<Expense[]>;
  getExpenseTotalByBucket(weddingId: string, bucket: BudgetBucket): Promise<number>;
  getExpensesByCeremony(weddingId: string, ceremonyId: string): Promise<Expense[]>;
  getExpenseTotalByCeremony(weddingId: string, ceremonyId: string): Promise<number>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;

  // Expense Splits
  getExpenseSplit(id: string): Promise<ExpenseSplit | undefined>;
  getExpenseSplitsByExpense(expenseId: string): Promise<ExpenseSplit[]>;
  createExpenseSplit(split: InsertExpenseSplit): Promise<ExpenseSplit>;
  updateExpenseSplit(id: string, split: Partial<InsertExpenseSplit>): Promise<ExpenseSplit | undefined>;
  deleteExpenseSplit(id: string): Promise<boolean>;
  deleteExpenseSplitsByExpense(expenseId: string): Promise<boolean>;

  // Households
  getHousehold(id: string): Promise<Household | undefined>;
  getHouseholdsByWedding(weddingId: string): Promise<Household[]>;
  getHouseholdByMagicToken(token: string): Promise<Household | undefined>; // Accepts plaintext token, compares hash, enforces expiry
  createHousehold(household: InsertHousehold): Promise<Household>;
  updateHousehold(id: string, household: Partial<InsertHousehold>): Promise<Household | undefined>;
  deleteHousehold(id: string): Promise<boolean>;
  generateHouseholdMagicToken(householdId: string, expiresInDays?: number): Promise<string>; // Returns plaintext, stores hash
  revokeHouseholdMagicToken(householdId: string): Promise<boolean>;

  // Guests
  getGuest(id: string): Promise<Guest | undefined>;
  getGuestsByWedding(weddingId: string): Promise<Guest[]>;
  getGuestsByHousehold(householdId: string): Promise<Guest[]>;
  getGuestByMagicToken(token: string): Promise<Guest | undefined>; // Accepts plaintext token, compares hash, enforces expiry (deprecated - use household)
  createGuest(guest: InsertGuest): Promise<Guest>;
  updateGuest(id: string, guest: Partial<InsertGuest>): Promise<Guest | undefined>;
  deleteGuest(id: string): Promise<boolean>;
  generateMagicLinkToken(guestId: string, expiresInDays?: number): Promise<string>; // Returns plaintext token, stores hash (deprecated - use household)
  revokeMagicLinkToken(guestId: string): Promise<boolean>; // Invalidates token for security (deprecated - use household)
  
  // Plus-One Guest Management
  createPlusOneGuest(guestId: string): Promise<Guest>; // Creates a plus-one guest linked to the given guest
  deletePlusOneGuest(guestId: string): Promise<boolean>; // Deletes the plus-one guest linked to the given guest
  getPlusOneForGuest(guestId: string): Promise<Guest | undefined>; // Gets the plus-one guest linked to the given guest

  // Invitations
  getInvitation(id: string): Promise<Invitation | undefined>;
  getInvitationsByGuest(guestId: string): Promise<Invitation[]>;
  getInvitationsByEvent(eventId: string): Promise<Invitation[]>;
  getInvitationByGuestAndEvent(guestId: string, eventId: string): Promise<Invitation | undefined>;
  createInvitation(invitation: InsertInvitation): Promise<Invitation>;
  bulkCreateInvitations(invitations: InsertInvitation[]): Promise<Invitation[]>;
  updateInvitation(id: string, invitation: Partial<InsertInvitation>): Promise<Invitation | undefined>;
  deleteInvitation(id: string): Promise<boolean>;

  // Tasks
  getTask(id: string): Promise<Task | undefined>;
  getTasksByWedding(weddingId: string): Promise<Task[]>;
  getTasksByAssignedUser(weddingId: string, userId: string): Promise<Task[]>; // Get tasks assigned to a specific user
  getTasksWithRemindersForDate(targetDate: Date): Promise<Task[]>; // For scheduler
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Task Templates
  getTaskTemplatesByTradition(tradition: string): Promise<TaskTemplate[]>;
  getAllTaskTemplates(): Promise<TaskTemplate[]>;

  // Task Reminders
  getTaskReminder(id: string): Promise<TaskReminder | undefined>;
  getRemindersByTask(taskId: string): Promise<TaskReminder[]>;
  getRemindersByWedding(weddingId: string): Promise<TaskReminder[]>;
  hasReminderBeenSent(taskId: string, reminderType: string, today: Date): Promise<boolean>;
  createTaskReminder(reminder: InsertTaskReminder): Promise<TaskReminder>;
  updateTaskReminder(id: string, updates: Partial<InsertTaskReminder>): Promise<TaskReminder | undefined>;

  // Task Comments
  getTaskComment(id: string): Promise<TaskComment | undefined>;
  getCommentsByTask(taskId: string): Promise<TaskComment[]>;
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;
  deleteTaskComment(id: string): Promise<boolean>;

  // Contracts
  getContract(id: string): Promise<Contract | undefined>;
  getContractsByWedding(weddingId: string): Promise<Contract[]>;
  getContractsByVendor(vendorId: string): Promise<Contract[]>;
  getContractByBooking(bookingId: string): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract | undefined>;
  deleteContract(id: string): Promise<boolean>;

  // Contract Templates
  getContractTemplate(id: string): Promise<ContractTemplate | undefined>;
  getContractTemplatesByCategory(category: string): Promise<ContractTemplate[]>;
  getAllContractTemplates(): Promise<ContractTemplate[]>;
  getDefaultContractTemplate(category: string): Promise<ContractTemplate | undefined>;
  getCustomTemplatesByWedding(weddingId: string): Promise<ContractTemplate[]>;
  createContractTemplate(template: InsertContractTemplate): Promise<ContractTemplate>;
  updateContractTemplate(id: string, template: Partial<InsertContractTemplate>): Promise<ContractTemplate | undefined>;
  deleteContractTemplate(id: string): Promise<boolean>;

  // Messages
  getMessage(id: string): Promise<Message | undefined>;
  getConversationMessages(conversationId: string): Promise<Message[]>;
  getConversationsByWedding(weddingId: string): Promise<string[]>; // Returns unique conversationIds
  getConversationsByVendor(vendorId: string): Promise<string[]>; // Returns unique conversationIds
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<Message | undefined>;
  getUnreadCount(conversationId: string, recipientType: 'couple' | 'vendor'): Promise<number>;
  getUnreadVendorMessagesByWedding(weddingId: string): Promise<Message[]>;

  // Conversation Status
  getConversationStatus(conversationId: string): Promise<ConversationStatus | undefined>;
  createConversationStatus(status: InsertConversationStatus): Promise<ConversationStatus>;
  updateConversationStatus(conversationId: string, status: Partial<InsertConversationStatus>): Promise<ConversationStatus | undefined>;
  closeConversation(conversationId: string, closedBy: string, closedByType: 'couple' | 'vendor', reason?: string): Promise<ConversationStatus>;

  // Quick Reply Templates
  getQuickReplyTemplate(id: string): Promise<QuickReplyTemplate | undefined>;
  getQuickReplyTemplatesByVendor(vendorId: string): Promise<QuickReplyTemplate[]>;
  createQuickReplyTemplate(template: InsertQuickReplyTemplate): Promise<QuickReplyTemplate>;
  updateQuickReplyTemplate(id: string, template: Partial<InsertQuickReplyTemplate>): Promise<QuickReplyTemplate | undefined>;
  deleteQuickReplyTemplate(id: string): Promise<boolean>;
  incrementTemplateUsage(id: string): Promise<QuickReplyTemplate | undefined>;

  // Follow-Up Reminders
  getFollowUpReminder(id: string): Promise<FollowUpReminder | undefined>;
  getFollowUpRemindersByVendor(vendorId: string): Promise<FollowUpReminder[]>;
  getPendingRemindersForVendor(vendorId: string): Promise<FollowUpReminder[]>;
  createFollowUpReminder(reminder: InsertFollowUpReminder): Promise<FollowUpReminder>;
  updateFollowUpReminder(id: string, reminder: Partial<InsertFollowUpReminder>): Promise<FollowUpReminder | undefined>;
  deleteFollowUpReminder(id: string): Promise<boolean>;

  // Reviews
  getReview(id: string): Promise<Review | undefined>;
  getReviewsByVendor(vendorId: string): Promise<Review[]>;
  getReviewsByWedding(weddingId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateVendorRating(vendorId: string): Promise<void>; // Recalculate average rating

  // Playlists
  getPlaylist(id: string): Promise<Playlist | undefined>;
  getPlaylistsByWedding(weddingId: string): Promise<Playlist[]>;
  getPlaylistsByEvent(eventId: string): Promise<Playlist[]>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  updatePlaylist(id: string, playlist: Partial<InsertPlaylist>): Promise<Playlist | undefined>;
  deletePlaylist(id: string): Promise<boolean>;

  // Playlist Songs
  getPlaylistSong(id: string): Promise<PlaylistSong | undefined>;
  getSongsByPlaylist(playlistId: string): Promise<PlaylistSong[]>;
  createPlaylistSong(song: InsertPlaylistSong): Promise<PlaylistSong>;
  updatePlaylistSong(id: string, song: Partial<InsertPlaylistSong>): Promise<PlaylistSong | undefined>;
  deletePlaylistSong(id: string): Promise<boolean>;
  updateSongVoteCount(songId: string): Promise<void>; // Recalculate vote count

  // Song Votes
  getSongVote(id: string): Promise<SongVote | undefined>;
  getVotesBySong(songId: string): Promise<SongVote[]>;
  createSongVote(vote: InsertSongVote): Promise<SongVote>;
  deleteVote(voterId: string, songId: string): Promise<boolean>; // Remove a user's vote
  hasUserVoted(voterId: string, songId: string): Promise<boolean>; // Check if user already voted

  // Documents
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByWedding(weddingId: string): Promise<Document[]>;
  getDocumentsByEvent(eventId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<boolean>;

  // Wedding Websites
  getWeddingWebsite(id: string): Promise<WeddingWebsite | undefined>;
  getWeddingWebsiteByWeddingId(weddingId: string): Promise<WeddingWebsite | undefined>;
  getWeddingWebsiteBySlug(slug: string): Promise<WeddingWebsite | undefined>;
  createWeddingWebsite(website: InsertWeddingWebsite): Promise<WeddingWebsite>;
  updateWeddingWebsite(id: string, website: Partial<InsertWeddingWebsite>): Promise<WeddingWebsite | undefined>;
  deleteWeddingWebsite(id: string): Promise<boolean>;

  // Registry Retailers (preset retailers)
  getRegistryRetailer(id: string): Promise<RegistryRetailer | undefined>;
  getAllRegistryRetailers(): Promise<RegistryRetailer[]>;
  getActiveRegistryRetailers(): Promise<RegistryRetailer[]>;

  // Wedding Registries (couples' registry links)
  getWeddingRegistry(id: string): Promise<WeddingRegistry | undefined>;
  getRegistriesByWedding(weddingId: string): Promise<WeddingRegistry[]>;
  getRegistriesWithRetailersByWedding(weddingId: string): Promise<Array<WeddingRegistry & { retailer?: RegistryRetailer }>>;
  createWeddingRegistry(registry: InsertWeddingRegistry): Promise<WeddingRegistry>;
  updateWeddingRegistry(id: string, registry: Partial<InsertWeddingRegistry>): Promise<WeddingRegistry | undefined>;
  deleteWeddingRegistry(id: string): Promise<boolean>;

  // Photo Galleries
  getPhotoGallery(id: string): Promise<PhotoGallery | undefined>;
  getGalleriesByWedding(weddingId: string): Promise<PhotoGallery[]>;
  getGalleriesByVendor(vendorId: string): Promise<PhotoGallery[]>;
  getGalleriesByEvent(eventId: string): Promise<PhotoGallery[]>;
  getGalleriesByType(type: 'inspiration' | 'vendor_portfolio' | 'event_photos'): Promise<PhotoGallery[]>;
  createPhotoGallery(gallery: InsertPhotoGallery): Promise<PhotoGallery>;
  updatePhotoGallery(id: string, gallery: Partial<InsertPhotoGallery>): Promise<PhotoGallery | undefined>;
  deletePhotoGallery(id: string): Promise<boolean>;

  // Photos
  getPhoto(id: string): Promise<Photo | undefined>;
  getPhotosByGallery(galleryId: string): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  updatePhoto(id: string, photo: Partial<InsertPhoto>): Promise<Photo | undefined>;
  deletePhoto(id: string): Promise<boolean>;

  // Vendor Availability
  getVendorAvailability(id: string): Promise<VendorAvailability | undefined>;
  getAvailabilityByVendor(vendorId: string): Promise<VendorAvailability[]>;
  getAvailabilityByVendorAndDateRange(vendorId: string, startDate: Date, endDate: Date): Promise<VendorAvailability[]>;
  getAvailabilityByDate(vendorId: string, date: Date): Promise<VendorAvailability[]>;
  checkAvailabilityConflicts(vendorId: string, date: Date, timeSlot: string, excludeBookingId?: string): Promise<boolean>;
  createVendorAvailability(availability: InsertVendorAvailability): Promise<VendorAvailability>;
  updateVendorAvailability(id: string, availability: Partial<InsertVendorAvailability>): Promise<VendorAvailability | undefined>;
  deleteVendorAvailability(id: string): Promise<boolean>;

  // Vendor Calendar Accounts (Multi-calendar support)
  getVendorCalendarAccount(id: string): Promise<VendorCalendarAccount | undefined>;
  getCalendarAccountsByVendor(vendorId: string): Promise<VendorCalendarAccount[]>;
  getCalendarAccountByEmail(vendorId: string, email: string): Promise<VendorCalendarAccount | undefined>;
  createVendorCalendarAccount(account: InsertVendorCalendarAccount): Promise<VendorCalendarAccount>;
  updateVendorCalendarAccount(id: string, account: Partial<InsertVendorCalendarAccount>): Promise<VendorCalendarAccount | undefined>;
  deleteVendorCalendarAccount(id: string): Promise<boolean>;

  // Vendor Calendars (Individual calendars within accounts)
  getVendorCalendar(id: string): Promise<VendorCalendar | undefined>;
  getCalendarsByAccount(accountId: string): Promise<VendorCalendar[]>;
  getCalendarsByVendor(vendorId: string): Promise<VendorCalendar[]>;
  getSelectedCalendarsByVendor(vendorId: string): Promise<VendorCalendar[]>;
  getWriteTargetCalendar(vendorId: string): Promise<VendorCalendar | undefined>;
  createVendorCalendar(calendar: InsertVendorCalendar): Promise<VendorCalendar>;
  updateVendorCalendar(id: string, calendar: Partial<InsertVendorCalendar>): Promise<VendorCalendar | undefined>;
  deleteVendorCalendar(id: string): Promise<boolean>;
  deleteCalendarsByAccount(accountId: string): Promise<boolean>;

  // Contract Signatures
  getContractSignature(id: string): Promise<ContractSignature | undefined>;
  getSignaturesByContract(contractId: string): Promise<ContractSignature[]>;
  createContractSignature(signature: InsertContractSignature): Promise<ContractSignature>;
  hasContractBeenSigned(contractId: string, signerId: string): Promise<boolean>;

  // Contract Documents
  getContractDocument(id: string): Promise<ContractDocument | undefined>;
  getDocumentsByContract(contractId: string): Promise<ContractDocument[]>;
  createContractDocument(document: InsertContractDocument): Promise<ContractDocument>;
  updateContractDocument(id: string, document: Partial<InsertContractDocument>): Promise<ContractDocument | undefined>;
  deleteContractDocument(id: string): Promise<boolean>;

  // Contract Payments
  getContractPayment(id: string): Promise<ContractPayment | undefined>;
  getPaymentsByContract(contractId: string): Promise<ContractPayment[]>;
  createContractPayment(payment: InsertContractPayment): Promise<ContractPayment>;
  updateContractPayment(id: string, payment: Partial<InsertContractPayment>): Promise<ContractPayment | undefined>;
  deleteContractPayment(id: string): Promise<boolean>;
  getTotalPaidForContract(contractId: string): Promise<number>;

  // Vendor Analytics
  getVendorAnalyticsSummary(vendorId: string): Promise<{
    totalBookings: number;
    confirmedBookings: number;
    totalRevenue: string;
    averageBookingValue: string;
    averageRating: string;
    totalReviews: number;
    conversionRate: string;
  }>;
  getVendorBookingTrends(vendorId: string, startDate?: Date, endDate?: Date): Promise<Array<{
    date: string;
    bookings: number;
    confirmed: number;
  }>>;
  getVendorRevenueTrends(vendorId: string, startDate?: Date, endDate?: Date): Promise<Array<{
    date: string;
    revenue: string;
  }>>;

  // Couple Analytics
  getWeddingAnalyticsSummary(weddingId: string): Promise<{
    totalBudget: string;
    totalSpent: string;
    remainingBudget: string;
    budgetUtilization: string;
    totalVendors: number;
    confirmedVendors: number;
    totalGuests: number;
    confirmedGuests: number;
    totalTasks: number;
    completedTasks: number;
    taskCompletionRate: string;
    totalEvents: number;
  }>;
  getWeddingBudgetBreakdown(weddingId: string): Promise<Array<{
    category: string;
    allocated: string;
    spent: string;
    percentage: number;
  }>>;
  getWeddingSpendingTrends(weddingId: string): Promise<Array<{
    date: string;
    amount: string;
    category: string;
  }>>;

  // Invitation Cards
  getInvitationCard(id: string): Promise<InvitationCard | undefined>;
  getAllInvitationCards(): Promise<InvitationCard[]>;
  getInvitationCardsByTradition(tradition: string): Promise<InvitationCard[]>;
  getInvitationCardsByCeremony(ceremonyType: string): Promise<InvitationCard[]>;
  getFeaturedInvitationCards(): Promise<InvitationCard[]>;

  // Orders
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByWedding(weddingId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  updateOrderPaymentInfo(id: string, paymentIntentId: string, paymentStatus: string): Promise<Order | undefined>;

  // Order Items
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;

  // Measurement Profiles
  getMeasurementProfile(id: string): Promise<MeasurementProfile | undefined>;
  getMeasurementProfileByGuest(guestId: string): Promise<MeasurementProfile | undefined>;
  getMeasurementProfilesByWedding(weddingId: string): Promise<MeasurementProfile[]>;
  createMeasurementProfile(profile: InsertMeasurementProfile): Promise<MeasurementProfile>;
  updateMeasurementProfile(id: string, profile: Partial<InsertMeasurementProfile>): Promise<MeasurementProfile | undefined>;
  deleteMeasurementProfile(id: string): Promise<boolean>;

  // Shopping Order Items
  getShoppingOrderItem(id: string): Promise<ShoppingOrderItem | undefined>;
  getShoppingOrderItemsByWedding(weddingId: string): Promise<ShoppingOrderItem[]>;
  createShoppingOrderItem(item: InsertShoppingOrderItem): Promise<ShoppingOrderItem>;
  updateShoppingOrderItem(id: string, item: Partial<InsertShoppingOrderItem>): Promise<ShoppingOrderItem | undefined>;
  deleteShoppingOrderItem(id: string): Promise<boolean>;

  // Gap Windows (Guest Concierge)
  getGapWindow(id: string): Promise<GapWindow | undefined>;
  getGapWindowsByWedding(weddingId: string): Promise<GapWindow[]>;
  createGapWindow(gap: InsertGapWindow): Promise<GapWindow>;
  updateGapWindow(id: string, gap: Partial<InsertGapWindow>): Promise<GapWindow | undefined>;
  deleteGapWindow(id: string): Promise<boolean>;
  activateGapWindow(id: string, isActive: boolean): Promise<GapWindow | undefined>;

  // Gap Recommendations
  getGapRecommendation(id: string): Promise<GapRecommendation | undefined>;
  getRecommendationsByGapWindow(gapWindowId: string): Promise<GapRecommendation[]>;
  createGapRecommendation(rec: InsertGapRecommendation): Promise<GapRecommendation>;
  updateGapRecommendation(id: string, rec: Partial<InsertGapRecommendation>): Promise<GapRecommendation | undefined>;
  deleteGapRecommendation(id: string): Promise<boolean>;

  // Ritual Stages
  getRitualStage(id: string): Promise<RitualStage | undefined>;
  getRitualStagesByEvent(eventId: string): Promise<RitualStage[]>;
  createRitualStage(stage: InsertRitualStage): Promise<RitualStage>;
  updateRitualStage(id: string, stage: Partial<InsertRitualStage>): Promise<RitualStage | undefined>;
  deleteRitualStage(id: string): Promise<boolean>;

  // Ritual Stage Updates
  getRitualStageUpdates(ritualStageId: string): Promise<RitualStageUpdate[]>;
  getLatestRitualStageUpdate(ritualStageId: string): Promise<RitualStageUpdate | undefined>;
  createRitualStageUpdate(update: InsertRitualStageUpdate): Promise<RitualStageUpdate>;

  // Guest Notifications
  getGuestNotification(id: string): Promise<GuestNotification | undefined>;
  getNotificationsByWedding(weddingId: string): Promise<GuestNotification[]>;
  createGuestNotification(notification: InsertGuestNotification): Promise<GuestNotification>;

  // Live Wedding Status
  getLiveWeddingStatus(weddingId: string): Promise<LiveWeddingStatus | undefined>;
  createOrUpdateLiveWeddingStatus(status: InsertLiveWeddingStatus): Promise<LiveWeddingStatus>;
  updateLiveWeddingStatus(weddingId: string, updates: Partial<InsertLiveWeddingStatus>): Promise<LiveWeddingStatus | undefined>;

  // Wedding Roles
  getWeddingRole(id: string): Promise<WeddingRole | undefined>;
  getWeddingRoles(weddingId: string): Promise<WeddingRole[]>;
  getWeddingRolesByWedding(weddingId: string): Promise<WeddingRole[]>;
  getWeddingRoleWithPermissions(id: string): Promise<RoleWithPermissions | undefined>;
  createWeddingRole(role: InsertWeddingRole): Promise<WeddingRole>;
  updateWeddingRole(id: string, role: Partial<InsertWeddingRole>): Promise<WeddingRole | undefined>;
  deleteWeddingRole(id: string): Promise<boolean>;
  createDefaultRolesForWedding(weddingId: string): Promise<WeddingRole[]>;

  // Role Permissions
  getRolePermissions(roleId: string): Promise<RolePermission[]>;
  setRolePermission(roleId: string, category: PermissionCategory, level: PermissionLevel): Promise<RolePermission>;
  removeRolePermission(roleId: string, category: PermissionCategory): Promise<boolean>;
  setRolePermissions(roleId: string, permissions: { category: PermissionCategory; level: PermissionLevel }[]): Promise<RolePermission[]>;
  deleteRolePermissions(roleId: string): Promise<void>;

  // Wedding Collaborators
  getWeddingCollaborator(id: string): Promise<WeddingCollaborator | undefined>;
  getWeddingCollaboratorByEmail(weddingId: string, email: string): Promise<WeddingCollaborator | undefined>;
  isWeddingCollaborator(weddingId: string, email: string): Promise<boolean>;
  getWeddingCollaboratorByToken(token: string): Promise<WeddingCollaborator | undefined>;
  getWeddingCollaboratorsByWedding(weddingId: string): Promise<WeddingCollaborator[]>;
  getWeddingCollaboratorWithDetails(id: string): Promise<CollaboratorWithDetails | undefined>;
  getCollaboratorsWithDetailsByWedding(weddingId: string): Promise<CollaboratorWithDetails[]>;
  getWeddingsByCollaboratorUser(userId: string): Promise<Wedding[]>;
  createWeddingCollaborator(collaborator: InsertWeddingCollaborator): Promise<WeddingCollaborator>;
  updateWeddingCollaborator(id: string, updates: Partial<InsertWeddingCollaborator>): Promise<WeddingCollaborator | undefined>;
  deleteWeddingCollaborator(id: string): Promise<boolean>;
  generateCollaboratorInviteToken(collaboratorId: string, expiresInDays?: number): Promise<string>;
  acceptCollaboratorInvite(token: string, userId: string): Promise<WeddingCollaborator | undefined>;
  revokeCollaboratorInvite(id: string): Promise<boolean>;

  // Collaborator Activity Log
  logCollaboratorActivity(log: InsertCollaboratorActivityLog): Promise<CollaboratorActivityLog>;
  getCollaboratorActivityLog(weddingId: string, limit?: number): Promise<CollaboratorActivityLog[]>;

  // Permission Checking
  getUserPermissionsForWedding(userId: string, weddingId: string): Promise<{ isOwner: boolean; permissions: Map<PermissionCategory, PermissionLevel> }>;
  checkUserPermission(userId: string, weddingId: string, category: PermissionCategory, requiredLevel: PermissionLevel): Promise<boolean>;

  // Guest Sources (who submitted guests - e.g., "Bride's Mom")
  getGuestSource(id: string): Promise<GuestSource | undefined>;
  getGuestSourcesByWedding(weddingId: string): Promise<GuestSource[]>;
  createGuestSource(source: InsertGuestSource): Promise<GuestSource>;
  updateGuestSource(id: string, source: Partial<InsertGuestSource>): Promise<GuestSource | undefined>;
  deleteGuestSource(id: string): Promise<boolean>;
  getGuestSourceStats(weddingId: string): Promise<{ sourceId: string; count: number; seats: number }[]>;

  // Guest List Scenarios (what-if playground)
  getGuestListScenario(id: string): Promise<GuestListScenario | undefined>;
  getGuestListScenarioWithStats(id: string): Promise<ScenarioWithStats | undefined>;
  getGuestListScenariosByWedding(weddingId: string): Promise<ScenarioWithStats[]>;
  createGuestListScenario(scenario: InsertGuestListScenario): Promise<GuestListScenario>;
  updateGuestListScenario(id: string, scenario: Partial<InsertGuestListScenario>): Promise<GuestListScenario | undefined>;
  deleteGuestListScenario(id: string): Promise<boolean>;
  setActiveScenario(weddingId: string, scenarioId: string): Promise<GuestListScenario>;
  duplicateScenario(id: string, newName: string, userId: string): Promise<GuestListScenario>;
  promoteScenarioToMain(id: string): Promise<boolean>;

  // Scenario Households (which households are in each scenario)
  getScenarioHouseholds(scenarioId: string): Promise<(ScenarioHousehold & { household: Household })[]>;
  addHouseholdToScenario(scenarioId: string, householdId: string, adjustedMaxCount?: number): Promise<ScenarioHousehold>;
  removeHouseholdFromScenario(scenarioId: string, householdId: string): Promise<boolean>;
  updateScenarioHousehold(id: string, updates: Partial<InsertScenarioHousehold>): Promise<ScenarioHousehold | undefined>;
  copyAllHouseholdsToScenario(scenarioId: string, weddingId: string): Promise<number>;

  // Guest Budget Settings
  getGuestBudgetSettings(weddingId: string): Promise<GuestBudgetSettings | undefined>;
  createOrUpdateGuestBudgetSettings(settings: InsertGuestBudgetSettings): Promise<GuestBudgetSettings>;
  calculateBudgetCapacity(weddingId: string): Promise<{ maxGuests: number; currentCount: number; costPerHead: number; totalBudget: number; remainingBudget: number }>;

  // Guest Planning Snapshot (comprehensive view for planning)
  getGuestPlanningSnapshot(weddingId: string): Promise<GuestPlanningSnapshot>;

  // Guest Collector Links (shareable links for family to submit guests)
  getGuestCollectorLink(id: string): Promise<GuestCollectorLink | undefined>;
  getGuestCollectorLinkByToken(token: string): Promise<GuestCollectorLink | undefined>;
  getGuestCollectorLinksByWedding(weddingId: string): Promise<GuestCollectorLink[]>;
  createGuestCollectorLink(link: InsertGuestCollectorLink): Promise<GuestCollectorLink>;
  updateGuestCollectorLink(id: string, updates: Partial<InsertGuestCollectorLink>): Promise<GuestCollectorLink | undefined>;
  deleteGuestCollectorLink(id: string): Promise<boolean>;
  deactivateGuestCollectorLink(id: string): Promise<GuestCollectorLink | undefined>;

  // Guest Collector Submissions (submissions through collector links)
  getGuestCollectorSubmission(id: string): Promise<GuestCollectorSubmission | undefined>;
  getGuestCollectorSubmissionsByLink(linkId: string): Promise<GuestCollectorSubmission[]>;
  getGuestCollectorSubmissionsByWedding(weddingId: string, status?: string): Promise<GuestCollectorSubmission[]>;
  createGuestCollectorSubmission(submission: InsertGuestCollectorSubmission): Promise<GuestCollectorSubmission>;
  approveCollectorSubmission(id: string, reviewerId: string): Promise<{ household: Household; guests: Guest[] }>;
  declineCollectorSubmission(id: string, reviewerId: string): Promise<GuestCollectorSubmission>;
  markCollectorSubmissionMaybe(id: string, reviewerId: string): Promise<GuestCollectorSubmission>;
  restoreCollectorSubmission(id: string, targetStatus: 'pending' | 'maybe' | 'approved', reviewerId: string): Promise<GuestCollectorSubmission | { household: Household; guests: Guest[] }>;
  getPendingCollectorSubmissionsCount(weddingId: string): Promise<number>;
  getCollectorSubmissionsBySession(linkId: string, sessionId: string): Promise<GuestCollectorSubmission[]>;

  // Guest Side Management (bride/groom side features)
  getGuestsBySide(weddingId: string, side: 'bride' | 'groom' | 'mutual'): Promise<Guest[]>;
  getGuestsByVisibility(weddingId: string, visibility: 'private' | 'shared', addedBySide?: 'bride' | 'groom'): Promise<Guest[]>;
  shareGuestsWithPartner(weddingId: string, guestIds: string[]): Promise<Guest[]>;
  updateGuestConsensusStatus(guestIds: string[], status: 'pending' | 'under_discussion' | 'approved' | 'declined' | 'frozen'): Promise<Guest[]>;
  getSideStatistics(weddingId: string): Promise<{ bride: { total: number; private: number; shared: number; byStatus: Record<string, number> }; groom: { total: number; private: number; shared: number; byStatus: Record<string, number> }; mutual: { total: number } }>;

  // ============================================================================
  // REAL-TIME MASTER TIMELINE
  // ============================================================================

  // Vendor Event Tags
  getVendorEventTag(id: string): Promise<VendorEventTag | undefined>;
  getVendorEventTagsByEvent(eventId: string): Promise<VendorEventTagWithVendor[]>;
  getVendorEventTagsByWedding(weddingId: string): Promise<VendorEventTagWithVendor[]>;
  getVendorEventTagsByVendor(vendorId: string): Promise<VendorEventTag[]>;
  createVendorEventTag(tag: InsertVendorEventTag): Promise<VendorEventTag>;
  deleteVendorEventTag(id: string): Promise<boolean>;
  deleteVendorEventTagsByEvent(eventId: string): Promise<boolean>;
  tagVendorsToEvent(eventId: string, weddingId: string, vendorIds: string[], notifyVia?: string): Promise<VendorEventTag[]>;

  // Timeline Changes
  getTimelineChange(id: string): Promise<TimelineChange | undefined>;
  getTimelineChangesByEvent(eventId: string): Promise<TimelineChange[]>;
  getTimelineChangesByWedding(weddingId: string): Promise<TimelineChangeWithAcks[]>;
  getRecentTimelineChanges(weddingId: string, limit?: number): Promise<TimelineChangeWithAcks[]>;
  createTimelineChange(change: InsertTimelineChange): Promise<TimelineChange>;
  markNotificationsSent(changeId: string): Promise<TimelineChange | undefined>;

  // Vendor Acknowledgments
  getVendorAcknowledgment(id: string): Promise<VendorAcknowledgment | undefined>;
  getAcknowledgmentsByChange(changeId: string): Promise<VendorAcknowledgmentWithDetails[]>;
  getAcknowledgmentsByVendor(vendorId: string): Promise<VendorAcknowledgment[]>;
  getPendingAcknowledgmentsForVendor(vendorId: string): Promise<VendorAcknowledgmentWithDetails[]>;
  createVendorAcknowledgment(ack: InsertVendorAcknowledgment): Promise<VendorAcknowledgment>;
  acknowledgeChange(changeId: string, vendorId: string, status: 'acknowledged' | 'declined', message?: string): Promise<VendorAcknowledgment>;
  getAcknowledgmentSummaryForEvent(eventId: string): Promise<{ pending: number; acknowledged: number; declined: number }>;

  // Timeline utilities
  reorderEvents(weddingId: string, orderedEventIds: string[], changedByUserId: string): Promise<Event[]>;
  updateEventTime(eventId: string, newTime: string, changedByUserId: string, note?: string): Promise<{ event: Event; change: TimelineChange; taggedVendors: Vendor[] }>;
  getTimelineWithAcknowledgments(weddingId: string): Promise<Array<Event & { tags: VendorEventTagWithVendor[]; pendingAcks: number; acknowledgedAcks: number }>>;

  // ============================================================================
  // VENDOR TEAMMATE MANAGEMENT
  // ============================================================================

  // Vendor Teammates
  getVendorTeammate(id: string): Promise<VendorTeammate | undefined>;
  getVendorTeammatesByVendor(vendorId: string): Promise<VendorTeammateWithUser[]>;
  getVendorTeammateByUserAndVendor(userId: string, vendorId: string): Promise<VendorTeammate | undefined>;
  getVendorsByTeammate(userId: string): Promise<Vendor[]>;
  createVendorTeammate(teammate: InsertVendorTeammate): Promise<VendorTeammate>;
  updateVendorTeammate(id: string, teammate: Partial<InsertVendorTeammate>): Promise<VendorTeammate | undefined>;
  revokeVendorTeammate(id: string, revokedBy: string): Promise<VendorTeammate | undefined>;

  // Vendor Teammate Invitations
  getVendorTeammateInvitation(id: string): Promise<VendorTeammateInvitation | undefined>;
  getVendorTeammateInvitationByToken(token: string): Promise<VendorTeammateInvitation | undefined>;
  getVendorTeammateInvitationsByVendor(vendorId: string): Promise<VendorTeammateInvitation[]>;
  createVendorTeammateInvitation(invitation: InsertVendorTeammateInvitation & { inviteToken: string; inviteTokenExpires: Date }): Promise<VendorTeammateInvitation>;
  acceptVendorTeammateInvitation(token: string, userId: string): Promise<{ teammate: VendorTeammate; invitation: VendorTeammateInvitation }>;
  revokeVendorTeammateInvitation(id: string): Promise<VendorTeammateInvitation | undefined>;

  // Vendor teammate authorization helper
  hasVendorTeammateAccess(userId: string, vendorId: string, requiredPermission?: string): Promise<boolean>;

  // ============================================================================
  // QUOTE REQUESTS
  // ============================================================================
  createQuoteRequest(quoteRequest: InsertQuoteRequest): Promise<QuoteRequest>;
  getQuoteRequestsByVendor(vendorId: string): Promise<QuoteRequest[]>;
  getQuoteRequestsByWedding(weddingId: string): Promise<QuoteRequest[]>;
  updateQuoteRequestStatus(id: string, status: string): Promise<QuoteRequest | undefined>;
  
  // ============================================================================
  // VENDOR LEADS - Lead qualification and nurturing
  // ============================================================================
  getVendorLead(id: string): Promise<VendorLead | undefined>;
  getVendorLeadsByVendor(vendorId: string): Promise<VendorLead[]>;
  getVendorLeadByWeddingAndVendor(weddingId: string, vendorId: string): Promise<VendorLead | undefined>;
  createVendorLead(lead: InsertVendorLead): Promise<VendorLead>;
  updateVendorLead(id: string, lead: Partial<InsertVendorLead>): Promise<VendorLead | undefined>;
  deleteVendorLead(id: string): Promise<boolean>;
  
  // Lead Nurture Sequences
  getLeadNurtureSequence(id: string): Promise<LeadNurtureSequence | undefined>;
  getLeadNurtureSequencesByVendor(vendorId: string): Promise<LeadNurtureSequence[]>;
  getDefaultNurtureSequence(vendorId: string): Promise<LeadNurtureSequence | undefined>;
  createLeadNurtureSequence(sequence: InsertLeadNurtureSequence): Promise<LeadNurtureSequence>;
  updateLeadNurtureSequence(id: string, sequence: Partial<InsertLeadNurtureSequence>): Promise<LeadNurtureSequence | undefined>;
  deleteLeadNurtureSequence(id: string): Promise<boolean>;
  
  // Lead Nurture Steps
  getLeadNurtureStep(id: string): Promise<LeadNurtureStep | undefined>;
  getLeadNurtureStepsBySequence(sequenceId: string): Promise<LeadNurtureStep[]>;
  createLeadNurtureStep(step: InsertLeadNurtureStep): Promise<LeadNurtureStep>;
  updateLeadNurtureStep(id: string, step: Partial<InsertLeadNurtureStep>): Promise<LeadNurtureStep | undefined>;
  deleteLeadNurtureStep(id: string): Promise<boolean>;
  
  // Lead Nurture Actions
  getLeadNurtureAction(id: string): Promise<LeadNurtureAction | undefined>;
  getLeadNurtureActionsByLead(leadId: string): Promise<LeadNurtureAction[]>;
  getPendingNurtureActions(beforeDate: Date): Promise<LeadNurtureAction[]>;
  createLeadNurtureAction(action: InsertLeadNurtureAction): Promise<LeadNurtureAction>;
  updateLeadNurtureAction(id: string, action: Partial<InsertLeadNurtureAction>): Promise<LeadNurtureAction | undefined>;
  
  // Lead Activity Log
  getLeadActivityLog(leadId: string): Promise<LeadActivityLog[]>;
  createLeadActivityLog(activity: InsertLeadActivityLog): Promise<LeadActivityLog>;

  // Vendor Claim Staging
  getVendorClaimStaging(id: string): Promise<VendorClaimStaging | undefined>;
  getVendorClaimStagingByVendor(vendorId: string): Promise<VendorClaimStaging[]>;
  getAllPendingVendorClaims(): Promise<VendorClaimStaging[]>;
  createVendorClaimStaging(claim: InsertVendorClaimStaging): Promise<VendorClaimStaging>;
  updateVendorClaimStaging(id: string, claim: Partial<VendorClaimStaging>): Promise<VendorClaimStaging | undefined>;
  deleteVendorClaimStaging(id: string): Promise<boolean>;

  // Vendor Approval (Admin)
  getPendingApprovalVendors(): Promise<Vendor[]>;
  approveVendor(id: string, adminId: string, notes?: string): Promise<Vendor | undefined>;
  rejectVendor(id: string, adminId: string, notes?: string): Promise<Vendor | undefined>;
  getApprovedVendors(): Promise<Vendor[]>;

  // Guest Communications
  getGuestCommunication(id: string): Promise<GuestCommunication | undefined>;
  getGuestCommunicationsByWedding(weddingId: string): Promise<GuestCommunication[]>;
  createGuestCommunication(comm: InsertGuestCommunication): Promise<GuestCommunication>;
  updateGuestCommunication(id: string, updates: Partial<GuestCommunication>): Promise<GuestCommunication | undefined>;
  deleteGuestCommunication(id: string): Promise<boolean>;
  
  // Communication Recipients
  getCommunicationRecipient(id: string): Promise<CommunicationRecipient | undefined>;
  getCommunicationRecipientsByCommunication(communicationId: string): Promise<CommunicationRecipient[]>;
  createCommunicationRecipient(recipient: InsertCommunicationRecipient): Promise<CommunicationRecipient>;
  createCommunicationRecipientsBulk(recipients: InsertCommunicationRecipient[]): Promise<CommunicationRecipient[]>;
  updateCommunicationRecipient(id: string, updates: Partial<CommunicationRecipient>): Promise<CommunicationRecipient | undefined>;
  
  // RSVP Statistics
  getRsvpStatsByWedding(weddingId: string): Promise<{
    total: number;
    attending: number;
    notAttending: number;
    pending: number;
    byEvent: Array<{
      eventId: string;
      eventName: string;
      attending: number;
      notAttending: number;
      pending: number;
    }>;
  }>;

  // Duplicate Detection & Merging
  detectDuplicateHouseholds(weddingId: string): Promise<Array<{
    household1: Household;
    household2: Household;
    guests1: Guest[];
    guests2: Guest[];
    confidence: number;
    matchReasons: string[];
  }>>;
  mergeHouseholds(survivorId: string, mergedId: string, decision: 'kept_older' | 'kept_newer', reviewerId: string): Promise<HouseholdMergeAudit>;
  getHouseholdMergeAudits(weddingId: string): Promise<HouseholdMergeAudit[]>;
  
  // Ignored duplicate pairs (keep both)
  ignoreHouseholdDuplicatePair(weddingId: string, householdId1: string, householdId2: string, ignoredById: string): Promise<IgnoredDuplicatePair>;
  getIgnoredDuplicatePairs(weddingId: string): Promise<IgnoredDuplicatePair[]>;

  // ============================================================================
  // GUEST ENGAGEMENT GAMES - Scavenger hunts and trivia
  // ============================================================================

  // Engagement Games
  getEngagementGame(id: string): Promise<EngagementGame | undefined>;
  getEngagementGamesByWedding(weddingId: string): Promise<EngagementGame[]>;
  getActiveGamesByWedding(weddingId: string): Promise<EngagementGame[]>;
  getGameWithStats(id: string): Promise<GameWithStats | undefined>;
  createEngagementGame(game: InsertEngagementGame): Promise<EngagementGame>;
  updateEngagementGame(id: string, game: Partial<InsertEngagementGame>): Promise<EngagementGame | undefined>;
  deleteEngagementGame(id: string): Promise<boolean>;

  // Scavenger Challenges
  getScavengerChallenge(id: string): Promise<ScavengerChallenge | undefined>;
  getScavengerChallengesByGame(gameId: string): Promise<ScavengerChallenge[]>;
  createScavengerChallenge(challenge: InsertScavengerChallenge): Promise<ScavengerChallenge>;
  updateScavengerChallenge(id: string, challenge: Partial<InsertScavengerChallenge>): Promise<ScavengerChallenge | undefined>;
  deleteScavengerChallenge(id: string): Promise<boolean>;
  reorderScavengerChallenges(gameId: string, orderedIds: string[]): Promise<ScavengerChallenge[]>;

  // Trivia Questions
  getTriviaQuestion(id: string): Promise<TriviaQuestion | undefined>;
  getTriviaQuestionsByGame(gameId: string): Promise<TriviaQuestion[]>;
  createTriviaQuestion(question: InsertTriviaQuestion): Promise<TriviaQuestion>;
  updateTriviaQuestion(id: string, question: Partial<InsertTriviaQuestion>): Promise<TriviaQuestion | undefined>;
  deleteTriviaQuestion(id: string): Promise<boolean>;
  reorderTriviaQuestions(gameId: string, orderedIds: string[]): Promise<TriviaQuestion[]>;

  // Game Participation
  getGameParticipation(id: string): Promise<GameParticipation | undefined>;
  getParticipationByGuestAndGame(guestId: string, gameId: string): Promise<GameParticipation | undefined>;
  getParticipationsByGame(gameId: string): Promise<GameParticipation[]>;
  createGameParticipation(participation: InsertGameParticipation): Promise<GameParticipation>;
  updateGameParticipation(id: string, participation: Partial<GameParticipation>): Promise<GameParticipation | undefined>;
  getLeaderboard(gameId: string, limit?: number): Promise<LeaderboardEntry[]>;

  // Scavenger Submissions
  getScavengerSubmission(id: string): Promise<ScavengerSubmission | undefined>;
  getSubmissionsByChallengeAndGuest(challengeId: string, guestId: string): Promise<ScavengerSubmission[]>;
  getSubmissionsByChallenge(challengeId: string): Promise<ScavengerSubmission[]>;
  getPendingSubmissionsByGame(gameId: string): Promise<ScavengerSubmission[]>;
  createScavengerSubmission(submission: InsertScavengerSubmission): Promise<ScavengerSubmission>;
  reviewScavengerSubmission(id: string, status: 'approved' | 'rejected', reviewerId: string, note?: string): Promise<ScavengerSubmission>;

  // Trivia Answers
  getTriviaAnswer(id: string): Promise<TriviaAnswer | undefined>;
  getAnswersByQuestionAndGuest(questionId: string, guestId: string): Promise<TriviaAnswer | undefined>;
  getAnswersByParticipation(participationId: string): Promise<TriviaAnswer[]>;
  createTriviaAnswer(answer: InsertTriviaAnswer): Promise<TriviaAnswer>;

  // Budget Alerts
  getBudgetAlert(id: string): Promise<BudgetAlert | undefined>;
  getBudgetAlertsByWedding(weddingId: string): Promise<BudgetAlert[]>;
  createBudgetAlert(alert: InsertBudgetAlert): Promise<BudgetAlert>;
  updateBudgetAlert(id: string, alert: Partial<InsertBudgetAlert>): Promise<BudgetAlert | undefined>;
  deleteBudgetAlert(id: string): Promise<boolean>;
  getTriggeredAlerts(weddingId: string): Promise<BudgetAlert[]>;

  // Dashboard Widgets
  getDashboardWidget(id: string): Promise<DashboardWidget | undefined>;
  getDashboardWidgetsByWedding(weddingId: string): Promise<DashboardWidget[]>;
  createDashboardWidget(widget: InsertDashboardWidget): Promise<DashboardWidget>;
  updateDashboardWidget(id: string, widget: Partial<InsertDashboardWidget>): Promise<DashboardWidget | undefined>;
  deleteDashboardWidget(id: string): Promise<boolean>;
  updateDashboardWidgetPositions(widgetIds: string[], positions: number[]): Promise<DashboardWidget[]>;

  // Ceremony Types (uses ceremony_templates table with traditionId UUID FK)
  getCeremonyType(ceremonyId: string): Promise<CeremonyType | undefined>;
  getCeremonyTypesByTradition(tradition: string): Promise<CeremonyType[]>; // @deprecated - use getCeremonyTypesByTraditionId
  getCeremonyTypesByTraditionId(traditionId: string): Promise<CeremonyType[]>;
  getAllCeremonyTypes(): Promise<CeremonyType[]>;
  createCeremonyType(template: InsertCeremonyType): Promise<CeremonyType>;
  updateCeremonyType(ceremonyId: string, template: Partial<InsertCeremonyType>): Promise<CeremonyType | undefined>;
  deleteCeremonyType(ceremonyId: string): Promise<boolean>;

  // Ceremony Budget Categories (junction table: ceremony type + budget bucket)
  // weddingId: NULL = system templates only, undefined = system templates only, string = system + wedding-specific
  getCeremonyBudgetCategoriesByCeremonyTypeId(ceremonyTypeId: string, weddingId?: string | null): Promise<CeremonyBudgetCategory[]>;
  getCeremonyBudgetCategoriesByBucket(budgetBucketId: string): Promise<CeremonyBudgetCategory[]>;
  getAllCeremonyBudgetCategories(): Promise<CeremonyBudgetCategory[]>;
  getAllCeremonyBudgetCategoriesForWedding(weddingId: string): Promise<CeremonyBudgetCategory[]>;
  getCeremonyBudgetCategory(id: string): Promise<CeremonyBudgetCategory | undefined>;
  createCeremonyBudgetCategory(item: InsertCeremonyBudgetCategory): Promise<CeremonyBudgetCategory>;
  updateCeremonyBudgetCategory(id: string, item: Partial<InsertCeremonyBudgetCategory>): Promise<CeremonyBudgetCategory | undefined>;
  deleteCeremonyBudgetCategory(id: string): Promise<boolean>;

  // Wedding Line Items (couple's customized budget line items)
  getWeddingLineItems(weddingId: string): Promise<WeddingLineItem[]>;
  getWeddingLineItemsByCeremony(weddingId: string, ceremonyId: string): Promise<WeddingLineItem[]>;
  getWeddingLineItem(id: string): Promise<WeddingLineItem | undefined>;
  createWeddingLineItem(item: InsertWeddingLineItem): Promise<WeddingLineItem>;
  updateWeddingLineItem(id: string, item: Partial<InsertWeddingLineItem>): Promise<WeddingLineItem | undefined>;
  deleteWeddingLineItem(id: string): Promise<boolean>;
  hydrateWeddingLineItemsFromTemplate(weddingId: string, ceremonyId: string, templateId: string): Promise<WeddingLineItem[]>;

  // Regional Pricing
  getRegionalPricing(city: string): Promise<RegionalPricing | undefined>;
  getAllRegionalPricing(): Promise<RegionalPricing[]>;
  createRegionalPricing(pricing: InsertRegionalPricing): Promise<RegionalPricing>;
  updateRegionalPricing(city: string, pricing: Partial<InsertRegionalPricing>): Promise<RegionalPricing | undefined>;

  // Budget Categories
  getBudgetCategory(id: string): Promise<BudgetCategory | undefined>;
  getBudgetCategoryBySlug(slug: string): Promise<BudgetCategory | undefined>;
  getAllBudgetCategories(): Promise<BudgetCategory[]>;
  getActiveBudgetCategories(): Promise<BudgetCategory[]>;
  createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory>;
  updateBudgetCategory(id: string, category: Partial<InsertBudgetCategory>): Promise<BudgetCategory | undefined>;
  deleteBudgetCategory(id: string): Promise<boolean>;
  seedBudgetCategories(): Promise<BudgetCategory[]>;

  // Wedding Traditions (data-driven tradition system)
  getWeddingTradition(id: string): Promise<WeddingTradition | undefined>;
  getWeddingTraditionBySlug(slug: string): Promise<WeddingTradition | undefined>;
  getAllWeddingTraditions(): Promise<WeddingTradition[]>;
  getActiveWeddingTraditions(): Promise<WeddingTradition[]>;
  createWeddingTradition(tradition: InsertWeddingTradition): Promise<WeddingTradition>;
  updateWeddingTradition(id: string, tradition: Partial<InsertWeddingTradition>): Promise<WeddingTradition | undefined>;
  deleteWeddingTradition(id: string): Promise<boolean>;
  seedWeddingTraditions(): Promise<WeddingTradition[]>;

  // Wedding Sub-Traditions (regional variations)
  getWeddingSubTradition(id: string): Promise<WeddingSubTradition | undefined>;
  getWeddingSubTraditionBySlug(slug: string): Promise<WeddingSubTradition | undefined>;
  getWeddingSubTraditionsByTradition(traditionId: string): Promise<WeddingSubTradition[]>;
  getAllWeddingSubTraditions(): Promise<WeddingSubTradition[]>;
  getActiveWeddingSubTraditions(): Promise<WeddingSubTradition[]>;
  createWeddingSubTradition(subTradition: InsertWeddingSubTradition): Promise<WeddingSubTradition>;
  updateWeddingSubTradition(id: string, subTradition: Partial<InsertWeddingSubTradition>): Promise<WeddingSubTradition | undefined>;
  deleteWeddingSubTradition(id: string): Promise<boolean>;
  seedWeddingSubTraditions(): Promise<WeddingSubTradition[]>;

  // Vendor Categories (database-driven)
  getVendorCategory(id: string): Promise<VendorCategory | undefined>;
  getVendorCategoryBySlug(slug: string): Promise<VendorCategory | undefined>;
  getAllVendorCategories(): Promise<VendorCategory[]>;
  getActiveVendorCategories(): Promise<VendorCategory[]>;
  getVendorCategoriesByTradition(tradition: string): Promise<VendorCategory[]>;
  createVendorCategory(category: InsertVendorCategory): Promise<VendorCategory>;
  updateVendorCategory(id: string, category: Partial<InsertVendorCategory>): Promise<VendorCategory | undefined>;
  deleteVendorCategory(id: string): Promise<boolean>;
  seedVendorCategories(): Promise<VendorCategory[]>;

  // Pricing Regions (database-driven city pricing multipliers)
  getPricingRegion(id: string): Promise<PricingRegion | undefined>;
  getPricingRegionBySlug(slug: string): Promise<PricingRegion | undefined>;
  getAllPricingRegions(): Promise<PricingRegion[]>;
  getActivePricingRegions(): Promise<PricingRegion[]>;
  createPricingRegion(region: InsertPricingRegion): Promise<PricingRegion>;
  updatePricingRegion(id: string, region: Partial<InsertPricingRegion>): Promise<PricingRegion | undefined>;
  deletePricingRegion(id: string): Promise<boolean>;
  seedPricingRegions(): Promise<PricingRegion[]>;

  // Metro Areas (centralized location/city management)
  getMetroArea(id: string): Promise<MetroArea | undefined>;
  getMetroAreaBySlug(slug: string): Promise<MetroArea | undefined>;
  getMetroAreaByValue(value: string): Promise<MetroArea | undefined>;
  getAllMetroAreas(): Promise<MetroArea[]>;
  getActiveMetroAreas(): Promise<MetroArea[]>;
  createMetroArea(area: InsertMetroArea): Promise<MetroArea>;
  updateMetroArea(id: string, area: Partial<InsertMetroArea>): Promise<MetroArea | undefined>;
  deleteMetroArea(id: string): Promise<boolean>;

  // Favour Categories (database-driven favour/gift types)
  getFavourCategory(id: string): Promise<FavourCategory | undefined>;
  getFavourCategoryBySlug(slug: string): Promise<FavourCategory | undefined>;
  getAllFavourCategories(): Promise<FavourCategory[]>;
  getActiveFavourCategories(): Promise<FavourCategory[]>;
  getFavourCategoriesByTradition(tradition: string): Promise<FavourCategory[]>;
  createFavourCategory(category: InsertFavourCategory): Promise<FavourCategory>;
  updateFavourCategory(id: string, category: Partial<InsertFavourCategory>): Promise<FavourCategory | undefined>;
  deleteFavourCategory(id: string): Promise<boolean>;

  // Decor Categories (database-driven decor category types)
  getDecorCategory(id: string): Promise<DecorCategory | undefined>;
  getDecorCategoryBySlug(slug: string): Promise<DecorCategory | undefined>;
  getAllDecorCategories(): Promise<DecorCategory[]>;
  getActiveDecorCategories(): Promise<DecorCategory[]>;
  createDecorCategory(category: InsertDecorCategory): Promise<DecorCategory>;
  updateDecorCategory(id: string, category: Partial<InsertDecorCategory>): Promise<DecorCategory | undefined>;
  deleteDecorCategory(id: string): Promise<boolean>;

  // Decor Item Templates (default library of decor items)
  getDecorItemTemplate(id: string): Promise<DecorItemTemplate | undefined>;
  getDecorItemTemplatesByCategory(categoryId: string): Promise<DecorItemTemplate[]>;
  getDecorItemTemplatesByTradition(tradition: string): Promise<DecorItemTemplate[]>;
  getAllDecorItemTemplates(): Promise<DecorItemTemplate[]>;
  getActiveDecorItemTemplates(): Promise<DecorItemTemplate[]>;
  createDecorItemTemplate(template: InsertDecorItemTemplate): Promise<DecorItemTemplate>;
  updateDecorItemTemplate(id: string, template: Partial<InsertDecorItemTemplate>): Promise<DecorItemTemplate | undefined>;
  deleteDecorItemTemplate(id: string): Promise<boolean>;

  // Honeymoon Budget Categories (database-driven honeymoon expense categories)
  getHoneymoonBudgetCategory(id: string): Promise<HoneymoonBudgetCategory | undefined>;
  getHoneymoonBudgetCategoryBySlug(slug: string): Promise<HoneymoonBudgetCategory | undefined>;
  getAllHoneymoonBudgetCategories(): Promise<HoneymoonBudgetCategory[]>;
  getActiveHoneymoonBudgetCategories(): Promise<HoneymoonBudgetCategory[]>;
  createHoneymoonBudgetCategory(category: InsertHoneymoonBudgetCategory): Promise<HoneymoonBudgetCategory>;
  updateHoneymoonBudgetCategory(id: string, category: Partial<InsertHoneymoonBudgetCategory>): Promise<HoneymoonBudgetCategory | undefined>;
  deleteHoneymoonBudgetCategory(id: string): Promise<boolean>;

  // Dietary Options (database-driven guest dietary restrictions)
  getDietaryOption(id: string): Promise<DietaryOption | undefined>;
  getDietaryOptionBySlug(slug: string): Promise<DietaryOption | undefined>;
  getAllDietaryOptions(): Promise<DietaryOption[]>;
  getActiveDietaryOptions(): Promise<DietaryOption[]>;
  getDietaryOptionsByTradition(tradition: string): Promise<DietaryOption[]>;
  createDietaryOption(option: InsertDietaryOption): Promise<DietaryOption>;
  updateDietaryOption(id: string, option: Partial<InsertDietaryOption>): Promise<DietaryOption | undefined>;
  deleteDietaryOption(id: string): Promise<boolean>;

  // Milni Relation Options (database-driven family relation types)
  getMilniRelationOption(id: string): Promise<MilniRelationOption | undefined>;
  getMilniRelationOptionBySlug(slug: string): Promise<MilniRelationOption | undefined>;
  getAllMilniRelationOptions(): Promise<MilniRelationOption[]>;
  getActiveMilniRelationOptions(): Promise<MilniRelationOption[]>;
  getMilniRelationOptionsByTradition(tradition: string): Promise<MilniRelationOption[]>;
  createMilniRelationOption(option: InsertMilniRelationOption): Promise<MilniRelationOption>;
  updateMilniRelationOption(id: string, option: Partial<InsertMilniRelationOption>): Promise<MilniRelationOption | undefined>;
  deleteMilniRelationOption(id: string): Promise<boolean>;

  // Milni Pair Templates (database-driven default pairing sequence)
  getMilniPairTemplate(id: string): Promise<MilniPairTemplate | undefined>;
  getAllMilniPairTemplates(): Promise<MilniPairTemplate[]>;
  getActiveMilniPairTemplates(): Promise<MilniPairTemplate[]>;
  getMilniPairTemplatesByTradition(tradition: string): Promise<MilniPairTemplate[]>;
  createMilniPairTemplate(template: InsertMilniPairTemplate): Promise<MilniPairTemplate>;
  updateMilniPairTemplate(id: string, template: Partial<InsertMilniPairTemplate>): Promise<MilniPairTemplate | undefined>;
  deleteMilniPairTemplate(id: string): Promise<boolean>;

  // Timeline Templates (tradition-specific day-of timeline templates)
  getTimelineTemplate(id: string): Promise<TimelineTemplate | undefined>;
  getAllTimelineTemplates(): Promise<TimelineTemplate[]>;
  getActiveTimelineTemplates(): Promise<TimelineTemplate[]>;
  getTimelineTemplatesByTradition(tradition: string): Promise<TimelineTemplate[]>;
  createTimelineTemplate(template: InsertTimelineTemplate): Promise<TimelineTemplate>;
  updateTimelineTemplate(id: string, template: Partial<InsertTimelineTemplate>): Promise<TimelineTemplate | undefined>;
  deleteTimelineTemplate(id: string): Promise<boolean>;

  // Vendor Task Categories (database-driven vendor category types)
  getVendorTaskCategory(id: string): Promise<VendorTaskCategory | undefined>;
  getVendorTaskCategoryBySlug(slug: string): Promise<VendorTaskCategory | undefined>;
  getAllVendorTaskCategories(): Promise<VendorTaskCategory[]>;
  getActiveVendorTaskCategories(): Promise<VendorTaskCategory[]>;
  getVendorTaskCategoriesByTradition(tradition: string): Promise<VendorTaskCategory[]>;
  createVendorTaskCategory(category: InsertVendorTaskCategory): Promise<VendorTaskCategory>;
  updateVendorTaskCategory(id: string, category: Partial<InsertVendorTaskCategory>): Promise<VendorTaskCategory | undefined>;
  deleteVendorTaskCategory(id: string): Promise<boolean>;

  // Ritual Role Assignments
  getRitualRoleAssignment(id: string): Promise<RitualRoleAssignment | undefined>;
  getRitualRolesByWedding(weddingId: string): Promise<RitualRoleAssignment[]>;
  getRitualRolesByEvent(eventId: string): Promise<RitualRoleAssignment[]>;
  getRitualRolesByGuest(guestId: string): Promise<RitualRoleAssignment[]>;
  createRitualRoleAssignment(assignment: InsertRitualRoleAssignment): Promise<RitualRoleAssignment>;
  updateRitualRoleAssignment(id: string, assignment: Partial<InsertRitualRoleAssignment>): Promise<RitualRoleAssignment | undefined>;
  deleteRitualRoleAssignment(id: string): Promise<boolean>;
  acknowledgeRitualRole(id: string): Promise<RitualRoleAssignment | undefined>;
  markRitualRoleNotificationSent(id: string): Promise<RitualRoleAssignment | undefined>;

  // Ritual Role Templates (database-driven)
  getRitualRoleTemplate(id: string): Promise<RitualRoleTemplate | undefined>;
  getRitualRoleTemplatesByCeremony(ceremonySlug: string): Promise<RitualRoleTemplate[]>;
  getAllRitualRoleTemplates(): Promise<RitualRoleTemplate[]>;
  getActiveRitualRoleTemplates(): Promise<RitualRoleTemplate[]>;
  createRitualRoleTemplate(template: InsertRitualRoleTemplate): Promise<RitualRoleTemplate>;
  updateRitualRoleTemplate(id: string, template: Partial<InsertRitualRoleTemplate>): Promise<RitualRoleTemplate | undefined>;
  deleteRitualRoleTemplate(id: string): Promise<boolean>;
  seedRitualRoleTemplates(): Promise<RitualRoleTemplate[]>;

  // Milni Lists - Sikh/Punjabi wedding pairing ceremony
  getMilniList(id: string): Promise<MilniList | undefined>;
  getMilniListsByWedding(weddingId: string): Promise<MilniList[]>;
  getMilniListWithDetails(id: string): Promise<MilniListWithDetails | undefined>;
  createMilniList(list: InsertMilniList): Promise<MilniList>;
  updateMilniList(id: string, list: Partial<InsertMilniList>): Promise<MilniList | undefined>;
  deleteMilniList(id: string): Promise<boolean>;
  
  // Milni Participants
  getMilniParticipant(id: string): Promise<MilniParticipant | undefined>;
  getMilniParticipantsByList(milniListId: string): Promise<MilniParticipant[]>;
  getMilniParticipantsBySide(milniListId: string, side: 'bride' | 'groom'): Promise<MilniParticipant[]>;
  createMilniParticipant(participant: InsertMilniParticipant): Promise<MilniParticipant>;
  updateMilniParticipant(id: string, participant: Partial<InsertMilniParticipant>): Promise<MilniParticipant | undefined>;
  deleteMilniParticipant(id: string): Promise<boolean>;
  
  // Milni Pairs
  getMilniPair(id: string): Promise<MilniPair | undefined>;
  getMilniPairsByList(milniListId: string): Promise<MilniPair[]>;
  getMilniPairsWithParticipants(milniListId: string): Promise<MilniPairWithParticipants[]>;
  createMilniPair(pair: InsertMilniPair): Promise<MilniPair>;
  updateMilniPair(id: string, pair: Partial<InsertMilniPair>): Promise<MilniPair | undefined>;
  deleteMilniPair(id: string): Promise<boolean>;
  reorderMilniPairs(milniListId: string, pairIds: string[]): Promise<MilniPair[]>;

  // Vendor Access Passes
  getVendorAccessPass(id: string): Promise<VendorAccessPass | undefined>;
  getVendorAccessPassByToken(token: string): Promise<VendorAccessPass | undefined>;
  getVendorAccessPassesByWedding(weddingId: string): Promise<VendorAccessPass[]>;
  getVendorAccessPassesByVendor(vendorId: string): Promise<VendorAccessPass[]>;
  createVendorAccessPass(pass: InsertVendorAccessPass): Promise<VendorAccessPass>;
  updateVendorAccessPass(id: string, pass: Partial<InsertVendorAccessPass>): Promise<VendorAccessPass | undefined>;
  deleteVendorAccessPass(id: string): Promise<boolean>;
  revokeVendorAccessPass(id: string): Promise<VendorAccessPass | undefined>;
  recordVendorAccessPassUsage(token: string): Promise<VendorAccessPass | undefined>;

  // Ceremony Explainers - Cultural Translator
  getCeremonyExplainer(id: string): Promise<CeremonyExplainer | undefined>;
  getCeremonyExplainerByEvent(eventId: string): Promise<CeremonyExplainer | undefined>;
  getCeremonyExplainersByWedding(weddingId: string): Promise<CeremonyExplainer[]>;
  getPublishedCeremonyExplainersByWedding(weddingId: string): Promise<CeremonyExplainer[]>;
  createCeremonyExplainer(explainer: InsertCeremonyExplainer): Promise<CeremonyExplainer>;
  updateCeremonyExplainer(id: string, explainer: Partial<InsertCeremonyExplainer>): Promise<CeremonyExplainer | undefined>;
  deleteCeremonyExplainer(id: string): Promise<boolean>;
  publishCeremonyExplainer(id: string): Promise<CeremonyExplainer | undefined>;
  unpublishCeremonyExplainer(id: string): Promise<CeremonyExplainer | undefined>;

  // Decor Items - Decor Inventory & Sourcing Tracker
  getDecorItem(id: string): Promise<DecorItem | undefined>;
  getDecorItemsByWedding(weddingId: string): Promise<DecorItem[]>;
  getDecorItemsByWeddingAndCategory(weddingId: string, category: string): Promise<DecorItem[]>;
  createDecorItem(item: InsertDecorItem): Promise<DecorItem>;
  updateDecorItem(id: string, item: Partial<InsertDecorItem>): Promise<DecorItem | undefined>;
  deleteDecorItem(id: string): Promise<boolean>;
  toggleDecorItemSourced(id: string): Promise<DecorItem | undefined>;
  importDefaultDecorLibrary(weddingId: string): Promise<DecorItem[]>;

  // Day-of Timeline Items - Wedding Day Schedule
  getDayOfTimelineItem(id: string): Promise<DayOfTimelineItem | undefined>;
  getDayOfTimelineItemsByWedding(weddingId: string): Promise<DayOfTimelineItem[]>;
  getDayOfTimelineItemsByAssignee(weddingId: string, assignee: string): Promise<DayOfTimelineItem[]>;
  createDayOfTimelineItem(item: InsertDayOfTimelineItem): Promise<DayOfTimelineItem>;
  createDayOfTimelineItems(items: InsertDayOfTimelineItem[]): Promise<DayOfTimelineItem[]>;
  updateDayOfTimelineItem(id: string, item: Partial<InsertDayOfTimelineItem>): Promise<DayOfTimelineItem | undefined>;
  deleteDayOfTimelineItem(id: string): Promise<boolean>;
  toggleDayOfTimelineItemCompleted(id: string): Promise<DayOfTimelineItem | undefined>;
  importDayOfTimelineTemplate(weddingId: string, templateName: string): Promise<DayOfTimelineItem[]>;
  clearDayOfTimeline(weddingId: string): Promise<boolean>;

  // Honeymoon Planner - Flights
  getHoneymoonFlight(id: string): Promise<HoneymoonFlight | undefined>;
  getHoneymoonFlightsByWedding(weddingId: string): Promise<HoneymoonFlight[]>;
  createHoneymoonFlight(flight: InsertHoneymoonFlight): Promise<HoneymoonFlight>;
  updateHoneymoonFlight(id: string, flight: Partial<InsertHoneymoonFlight>): Promise<HoneymoonFlight | undefined>;
  deleteHoneymoonFlight(id: string): Promise<boolean>;

  // Honeymoon Planner - Hotels
  getHoneymoonHotel(id: string): Promise<HoneymoonHotel | undefined>;
  getHoneymoonHotelsByWedding(weddingId: string): Promise<HoneymoonHotel[]>;
  createHoneymoonHotel(hotel: InsertHoneymoonHotel): Promise<HoneymoonHotel>;
  updateHoneymoonHotel(id: string, hotel: Partial<InsertHoneymoonHotel>): Promise<HoneymoonHotel | undefined>;
  deleteHoneymoonHotel(id: string): Promise<boolean>;

  // Honeymoon Planner - Activities
  getHoneymoonActivity(id: string): Promise<HoneymoonActivity | undefined>;
  getHoneymoonActivitiesByWedding(weddingId: string): Promise<HoneymoonActivity[]>;
  createHoneymoonActivity(activity: InsertHoneymoonActivity): Promise<HoneymoonActivity>;
  updateHoneymoonActivity(id: string, activity: Partial<InsertHoneymoonActivity>): Promise<HoneymoonActivity | undefined>;
  deleteHoneymoonActivity(id: string): Promise<boolean>;
  toggleHoneymoonActivityCompleted(id: string): Promise<HoneymoonActivity | undefined>;

  // Honeymoon Planner - Budget
  getHoneymoonBudgetItem(id: string): Promise<HoneymoonBudgetItem | undefined>;
  getHoneymoonBudgetItemsByWedding(weddingId: string): Promise<HoneymoonBudgetItem[]>;
  createHoneymoonBudgetItem(item: InsertHoneymoonBudgetItem): Promise<HoneymoonBudgetItem>;
  updateHoneymoonBudgetItem(id: string, item: Partial<InsertHoneymoonBudgetItem>): Promise<HoneymoonBudgetItem | undefined>;
  deleteHoneymoonBudgetItem(id: string): Promise<boolean>;
  toggleHoneymoonBudgetItemPaid(id: string): Promise<HoneymoonBudgetItem | undefined>;

  // Favours - Gift/favour tracking
  getFavour(id: string): Promise<Favour | undefined>;
  getFavoursByWedding(weddingId: string): Promise<Favour[]>;
  createFavour(favour: InsertFavour): Promise<Favour>;
  updateFavour(id: string, favour: Partial<InsertFavour>): Promise<Favour | undefined>;
  deleteFavour(id: string): Promise<boolean>;

  // Favour Recipients
  getFavourRecipient(id: string): Promise<FavourRecipient | undefined>;
  getFavourRecipientsByFavour(favourId: string): Promise<FavourRecipient[]>;
  getFavourRecipientsByWedding(weddingId: string): Promise<FavourRecipient[]>;
  createFavourRecipient(recipient: InsertFavourRecipient): Promise<FavourRecipient>;
  updateFavourRecipient(id: string, recipient: Partial<InsertFavourRecipient>): Promise<FavourRecipient | undefined>;
  deleteFavourRecipient(id: string): Promise<boolean>;
  toggleFavourRecipientDelivered(id: string): Promise<FavourRecipient | undefined>;

  // Budget Scenarios - What-if scenario planning
  getBudgetScenario(id: string): Promise<BudgetScenario | undefined>;
  getBudgetScenariosByWedding(weddingId: string): Promise<BudgetScenario[]>;
  createBudgetScenario(scenario: InsertBudgetScenario): Promise<BudgetScenario>;
  updateBudgetScenario(id: string, scenario: Partial<InsertBudgetScenario>): Promise<BudgetScenario | undefined>;
  deleteBudgetScenario(id: string): Promise<boolean>;

  // Tradition Rituals - Educational content about wedding rituals
  getTraditionRitual(id: string): Promise<TraditionRitual | undefined>;
  getTraditionRitualBySlug(slug: string): Promise<TraditionRitual | undefined>;
  getTraditionRitualsByTradition(traditionId: string): Promise<TraditionRitual[]>;
  getTraditionRitualsByTraditionSlug(traditionSlug: string): Promise<TraditionRitual[]>;
  getTraditionRitualsByCeremonyTypeId(ceremonyTypeId: string): Promise<TraditionRitual[]>;
  getAllTraditionRituals(): Promise<TraditionRitual[]>;

  // User Feedback - Bug reports and feedback
  getUserFeedback(id: string): Promise<UserFeedback | undefined>;
  getAllUserFeedback(): Promise<UserFeedback[]>;
  getUserFeedbackByStatus(status: string): Promise<UserFeedback[]>;
  createUserFeedback(feedback: InsertUserFeedback): Promise<UserFeedback>;
  updateUserFeedback(id: string, updates: Partial<UserFeedback>): Promise<UserFeedback | undefined>;

  // Admin - User Management
  getAllUsersWithWeddings(): Promise<Array<{ user: User; wedding: Wedding | null }>>;
  getUserWithWedding(userId: string): Promise<{ user: User; wedding: Wedding | null } | null>;

  // AI Chat Messages
  getAiChatMessages(weddingId: string, userId: string): Promise<AiChatMessage[]>;
  createAiChatMessage(message: InsertAiChatMessage): Promise<AiChatMessage>;
  clearAiChatHistory(weddingId: string, userId: string): Promise<boolean>;

  // AI FAQ
  getAllFaq(): Promise<AiFaq[]>;
  getActiveFaq(): Promise<AiFaq[]>;
  findFaqByNormalizedQuestion(normalizedQuestion: string): Promise<AiFaq | null>;
  createFaq(faq: InsertAiFaq): Promise<AiFaq>;

  // Discovery Jobs & Staged Vendors
  getDiscoveryJob(id: string): Promise<DiscoveryJob | undefined>;
  getAllDiscoveryJobs(): Promise<DiscoveryJob[]>;
  getActiveDiscoveryJobs(): Promise<DiscoveryJob[]>;
  createDiscoveryJob(job: InsertDiscoveryJob): Promise<DiscoveryJob>;
  updateDiscoveryJob(id: string, job: Partial<DiscoveryJob>): Promise<DiscoveryJob | undefined>;
  deleteDiscoveryJob(id: string): Promise<boolean>;

  getStagedVendor(id: string): Promise<StagedVendor | undefined>;
  getStagedVendorsByJob(jobId: string): Promise<StagedVendor[]>;
  getStagedVendorsByStatus(status: string): Promise<StagedVendor[]>;
  getAllStagedVendors(): Promise<StagedVendor[]>;
  createStagedVendor(vendor: InsertStagedVendor): Promise<StagedVendor>;
  updateStagedVendor(id: string, vendor: Partial<StagedVendor>): Promise<StagedVendor | undefined>;
  deleteStagedVendor(id: string): Promise<boolean>;

  // Live Polls
  getPoll(id: string): Promise<Poll | undefined>;
  getPollsByWedding(weddingId: string): Promise<Poll[]>;
  getPollsByEvent(eventId: string): Promise<Poll[]>;
  createPoll(poll: InsertPoll): Promise<Poll>;
  updatePoll(id: string, poll: Partial<Poll>): Promise<Poll | undefined>;
  deletePoll(id: string): Promise<boolean>;

  // Poll Options
  getPollOption(id: string): Promise<PollOption | undefined>;
  getPollOptionsByPoll(pollId: string): Promise<PollOption[]>;
  createPollOption(option: InsertPollOption): Promise<PollOption>;
  updatePollOption(id: string, option: Partial<PollOption>): Promise<PollOption | undefined>;
  deletePollOption(id: string): Promise<boolean>;

  // Poll Votes
  getPollVotesByPoll(pollId: string): Promise<PollVote[]>;
  getPollVotesByGuest(pollId: string, guestId: string): Promise<PollVote[]>;
  createPollVote(vote: InsertPollVote): Promise<PollVote>;
  deletePollVotesByGuest(pollId: string, guestId: string): Promise<boolean>;
}

// Guest Planning Snapshot - comprehensive view of all guests and per-event costs
export interface GuestPlanningSnapshot {
  // Confirmed households
  confirmedHouseholds: Household[];
  
  // Summary counts
  summary: {
    confirmedSeats: number;
    totalSeats: number;
    priorityBreakdown: {
      must_invite: number;
      should_invite: number;
      nice_to_have: number;
    };
  };
  
  // Per-event analysis
  events: Array<{
    id: string;
    name: string;
    type: string;
    date: Date | null;
    costPerHead: number | null;
    venueCapacity: number | null;
    budgetAllocation: number | null;
    
    // Guest counts for this event
    confirmedInvited: number;
    
    // Budget impact
    confirmedCost: number;
    actualExpenseSpend: number;
    
    // Capacity status
    capacityUsed: number;
    capacityRemaining: number | null;
    isOverCapacity: boolean;
    isOverBudget: boolean;
  }>;
  
  // Overall budget analysis
  budget: {
    weddingTotalBudget: number;
    guestBudget: number;
    defaultCostPerHead: number;
    confirmedSpend: number;
    remainingBudget: number;
    isOverBudget: boolean;
  };
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private weddings: Map<string, Wedding>;
  private events: Map<string, Event>;
  private eventCostItems: Map<string, EventCostItem>;
  private vendors: Map<string, Vendor>;
  private servicePackages: Map<string, ServicePackage>;
  private bookings: Map<string, Booking>;
  private budgetAllocationsMap: Map<string, BudgetAllocation>;
  private households: Map<string, Household>;
  private guests: Map<string, Guest>;
  private invitations: Map<string, Invitation>;
  private tasks: Map<string, Task>;
  private taskReminders: Map<string, TaskReminder>;
  private contracts: Map<string, Contract>;
  private contractTemplates: Map<string, ContractTemplate>;
  private messages: Map<string, Message>;
  private conversationStatuses: Map<string, ConversationStatus>;
  private quickReplyTemplates: Map<string, QuickReplyTemplate>;
  private followUpReminders: Map<string, FollowUpReminder>;
  private reviews: Map<string, Review>;
  private playlists: Map<string, Playlist>;
  private playlistSongs: Map<string, PlaylistSong>;
  private songVotes: Map<string, SongVote>;
  private documents: Map<string, Document>;
  private weddingWebsites: Map<string, WeddingWebsite>;
  private photoGalleries: Map<string, PhotoGallery>;
  private photos: Map<string, Photo>;
  private vendorAvailability: Map<string, VendorAvailability>;
  private vendorCalendarAccounts: Map<string, VendorCalendarAccount>;
  private vendorCalendars: Map<string, VendorCalendar>;
  private measurementProfiles: Map<string, MeasurementProfile>;
  private shoppingOrderItems: Map<string, ShoppingOrderItem>;
  private expenses: Map<string, Expense>;
  private expenseSplits: Map<string, ExpenseSplit>;

  constructor() {
    this.users = new Map();
    this.weddings = new Map();
    this.events = new Map();
    this.eventCostItems = new Map();
    this.vendors = new Map();
    this.servicePackages = new Map();
    this.bookings = new Map();
    this.budgetAllocationsMap = new Map();
    this.households = new Map();
    this.guests = new Map();
    this.invitations = new Map();
    this.tasks = new Map();
    this.taskReminders = new Map();
    this.contracts = new Map();
    this.contractTemplates = new Map();
    this.messages = new Map();
    this.conversationStatuses = new Map();
    this.quickReplyTemplates = new Map();
    this.followUpReminders = new Map();
    this.reviews = new Map();
    this.playlists = new Map();
    this.playlistSongs = new Map();
    this.songVotes = new Map();
    this.documents = new Map();
    this.weddingWebsites = new Map();
    this.photoGalleries = new Map();
    this.photos = new Map();
    this.vendorAvailability = new Map();
    this.vendorCalendarAccounts = new Map();
    this.vendorCalendars = new Map();
    this.measurementProfiles = new Map();
    this.shoppingOrderItems = new Map();
    this.expenses = new Map();
    this.expenseSplits = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      username: null,
      password: null,
      verificationToken: null,
      verificationTokenExpires: null,
      resetToken: null,
      resetTokenExpires: null,
      lastLoginAt: null,
      createdAt: new Date(),
      emailVerified: insertUser.emailVerified ?? false,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, update: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updated = { ...user, ...update };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;

    const updated = { ...user, passwordHash };
    this.users.set(id, updated);
    return true;
  }

  async setVerificationToken(id: string, token: string, expires: Date): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;

    const updated = { ...user, verificationToken: token, verificationTokenExpires: expires };
    this.users.set(id, updated);
    return true;
  }

  async setResetToken(id: string, token: string, expires: Date): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;

    const updated = { ...user, resetToken: token, resetTokenExpires: expires };
    this.users.set(id, updated);
    return true;
  }

  async verifyEmail(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    const updated = {
      ...user,
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
    };
    this.users.set(userId, updated);
    return true;
  }

  async clearVerificationToken(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    const updated = {
      ...user,
      verificationToken: null,
      verificationTokenExpires: null,
    };
    this.users.set(userId, updated);
    return true;
  }

  async clearResetToken(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    const updated = {
      ...user,
      resetToken: null,
      resetTokenExpires: null,
    };
    this.users.set(userId, updated);
    return true;
  }

  async updateLastLogin(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    const updated = { ...user, lastLoginAt: new Date() };
    this.users.set(userId, updated);
    return true;
  }

  // Weddings
  async getWedding(id: string): Promise<Wedding | undefined> {
    return this.weddings.get(id);
  }

  async getWeddingsByUser(userId: string): Promise<Wedding[]> {
    return Array.from(this.weddings.values()).filter((w) => w.userId === userId);
  }

  async getWeddingsForCollaborator(userId: string): Promise<Wedding[]> {
    const collaborators = Array.from(this.collaborators.values()).filter(
      (c) => c.userId === userId && c.status === "accepted"
    );
    const weddingIds = new Set(collaborators.map((c) => c.weddingId));
    return Array.from(this.weddings.values()).filter((w) => weddingIds.has(w.id));
  }

  async createWedding(insertWedding: InsertWedding): Promise<Wedding> {
    const id = randomUUID();
    const wedding: Wedding = {
      ...insertWedding,
      id,
      status: "planning",
      createdAt: new Date(),
    } as Wedding;
    this.weddings.set(id, wedding);
    return wedding;
  }

  async updateWedding(id: string, update: Partial<InsertWedding>): Promise<Wedding | undefined> {
    const wedding = this.weddings.get(id);
    if (!wedding) return undefined;

    const updated = { ...wedding, ...update };
    this.weddings.set(id, updated);
    return updated;
  }

  // Events
  async getEvent(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEventsByWedding(weddingId: string): Promise<Event[]> {
    return Array.from(this.events.values())
      .filter((e) => e.weddingId === weddingId)
      .sort((a, b) => a.order - b.order);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = randomUUID();
    const event: Event = { ...insertEvent, id } as Event;
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: string, update: Partial<InsertEvent>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;

    const updated = { ...event, ...update } as Event;
    this.events.set(id, updated);
    return updated;
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.events.delete(id);
  }

  // Event Cost Items
  async getEventCostItem(id: string): Promise<EventCostItem | undefined> {
    return this.eventCostItems.get(id);
  }

  async getEventCostItemsByEvent(eventId: string): Promise<EventCostItem[]> {
    return Array.from(this.eventCostItems.values()).filter((item) => item.eventId === eventId);
  }

  async createEventCostItem(insertCostItem: InsertEventCostItem): Promise<EventCostItem> {
    const id = randomUUID();
    const costItem: EventCostItem = { ...insertCostItem, id } as EventCostItem;
    this.eventCostItems.set(id, costItem);
    return costItem;
  }

  async updateEventCostItem(id: string, update: Partial<InsertEventCostItem>): Promise<EventCostItem | undefined> {
    const costItem = this.eventCostItems.get(id);
    if (!costItem) return undefined;
    const updated = { ...costItem, ...update } as EventCostItem;
    this.eventCostItems.set(id, updated);
    return updated;
  }

  async deleteEventCostItem(id: string): Promise<boolean> {
    return this.eventCostItems.delete(id);
  }

  // Vendors
  async getVendor(id: string): Promise<Vendor | undefined> {
    return this.vendors.get(id);
  }

  async getVendorsByIds(ids: string[]): Promise<Vendor[]> {
    const result: Vendor[] = [];
    for (const id of ids) {
      const vendor = this.vendors.get(id);
      if (vendor) result.push(vendor);
    }
    return result;
  }

  async getAllVendors(): Promise<Vendor[]> {
    return Array.from(this.vendors.values());
  }

  async getVendorsByCategory(category: string): Promise<Vendor[]> {
    return Array.from(this.vendors.values()).filter((v) => 
      v.categories?.includes(category)
    );
  }

  async getVendorsByLocation(location: string): Promise<Vendor[]> {
    return Array.from(this.vendors.values()).filter((v) =>
      v.location.toLowerCase().includes(location.toLowerCase())
    );
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const id = randomUUID();
    const vendor: Vendor = {
      ...insertVendor,
      id,
      rating: null,
      reviewCount: 0,
    } as Vendor;
    this.vendors.set(id, vendor);
    return vendor;
  }

  async updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const existing = this.vendors.get(id);
    if (!existing) return undefined;
    
    const updated: Vendor = {
      ...existing,
      ...updates,
    };
    this.vendors.set(id, updated);
    return updated;
  }

  // Ghost Profile / Claim methods
  async getVendorByGooglePlaceId(placeId: string): Promise<Vendor | undefined> {
    return Array.from(this.vendors.values()).find(v => v.googlePlaceId === placeId);
  }

  async getVendorByClaimToken(token: string): Promise<Vendor | undefined> {
    return Array.from(this.vendors.values()).find(v => v.claimToken === token);
  }

  async incrementVendorViewCount(id: string): Promise<void> {
    const vendor = this.vendors.get(id);
    if (vendor) {
      vendor.viewCount = (vendor.viewCount || 0) + 1;
      this.vendors.set(id, vendor);
    }
  }

  async queueClaimNotification(vendorId: string): Promise<void> {
    const vendor = this.vendors.get(vendorId);
    if (!vendor) return;
    
    // Set cooldown for 72 hours
    const cooldownUntil = new Date(Date.now() + 72 * 60 * 60 * 1000);
    vendor.notifyCooldownUntil = cooldownUntil;
    vendor.lastViewNotifiedAt = new Date();
    this.vendors.set(vendorId, vendor);
    
    // In production, this would send an email/SMS
    console.log(`[ClaimNotification] Would notify vendor ${vendor.name} at ${vendor.phone || vendor.email}`);
  }

  async sendClaimEmail(vendorId: string, email: string, vendorName: string, claimLink: string): Promise<void> {
    // In MemStorage, just log the email that would be sent
    console.log(`[ClaimEmail] Would send to ${email}: Claim your profile at ${claimLink}`);
  }

  // Service Packages
  async getServicePackage(id: string): Promise<ServicePackage | undefined> {
    return this.servicePackages.get(id);
  }

  async getServicePackagesByVendor(vendorId: string): Promise<ServicePackage[]> {
    return Array.from(this.servicePackages.values())
      .filter((pkg) => pkg.vendorId === vendorId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  async createServicePackage(insertPkg: InsertServicePackage): Promise<ServicePackage> {
    const id = randomUUID();
    const pkg: ServicePackage = {
      ...insertPkg,
      id,
      isActive: insertPkg.isActive ?? true,
      sortOrder: insertPkg.sortOrder ?? 0,
      createdAt: new Date(),
    } as ServicePackage;
    this.servicePackages.set(id, pkg);
    return pkg;
  }

  async updateServicePackage(id: string, updates: Partial<InsertServicePackage>): Promise<ServicePackage | undefined> {
    const existing = this.servicePackages.get(id);
    if (!existing) return undefined;
    
    const updated: ServicePackage = {
      ...existing,
      ...updates,
    };
    this.servicePackages.set(id, updated);
    return updated;
  }

  async deleteServicePackage(id: string): Promise<boolean> {
    return this.servicePackages.delete(id);
  }

  // Bookings
  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingsByWedding(weddingId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter((b) => b.weddingId === weddingId);
  }

  async getBookingsWithVendorsByWedding(weddingId: string): Promise<Array<Booking & { vendor: Vendor }>> {
    const bookings = Array.from(this.bookings.values()).filter((b) => 
      b.weddingId === weddingId && b.status === 'confirmed'
    );
    return bookings.map(booking => ({
      ...booking,
      vendor: this.vendors.get(booking.vendorId)!
    })).filter(b => b.vendor);
  }

  async getBookingsByVendor(vendorId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter((b) => b.vendorId === vendorId);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = {
      ...insertBooking,
      id,
      status: insertBooking.status || "pending",
      requestDate: new Date(),
      confirmedDate: null,
    } as Booking;
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBooking(id: string, update: Partial<InsertBooking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    const updated = { ...booking, ...update } as Booking;
    if (update.status === "confirmed" && !booking.confirmedDate) {
      updated.confirmedDate = new Date();
    }
    this.bookings.set(id, updated);
    return updated;
  }

  // Vendor Favorites
  private vendorFavorites: Map<string, VendorFavorite> = new Map();

  async getVendorFavoritesByWedding(weddingId: string): Promise<VendorFavorite[]> {
    return Array.from(this.vendorFavorites.values()).filter((f) => f.weddingId === weddingId);
  }

  async getVendorFavorite(weddingId: string, vendorId: string): Promise<VendorFavorite | undefined> {
    return Array.from(this.vendorFavorites.values()).find(
      (f) => f.weddingId === weddingId && f.vendorId === vendorId
    );
  }

  async addVendorFavorite(insertFavorite: InsertVendorFavorite): Promise<VendorFavorite> {
    const id = randomUUID();
    const favorite: VendorFavorite = {
      ...insertFavorite,
      id,
      createdAt: new Date(),
    };
    this.vendorFavorites.set(id, favorite);
    return favorite;
  }

  async removeVendorFavorite(weddingId: string, vendorId: string): Promise<boolean> {
    const favorite = await this.getVendorFavorite(weddingId, vendorId);
    if (!favorite) return false;
    return this.vendorFavorites.delete(favorite.id);
  }

  // Budget Allocations (per-bucket budget targets)
  async getBudgetAllocation(id: string): Promise<BudgetAllocation | undefined> {
    return this.budgetAllocationsMap.get(id);
  }

  async getBudgetAllocationsByWedding(weddingId: string): Promise<BudgetAllocation[]> {
    return Array.from(this.budgetAllocationsMap.values()).filter((a) => a.weddingId === weddingId);
  }

  async getBudgetAllocationByBucket(
    weddingId: string, 
    bucket: BudgetBucket, 
    ceremonyId?: string | null, 
    lineItemLabel?: string | null
  ): Promise<BudgetAllocation | undefined> {
    return Array.from(this.budgetAllocationsMap.values()).find(
      (a) => a.weddingId === weddingId && 
             a.bucket === bucket && 
             (ceremonyId === undefined ? true : a.ceremonyId === ceremonyId) &&
             (lineItemLabel === undefined ? true : a.lineItemLabel === lineItemLabel)
    );
  }

  async createBudgetAllocation(insertAllocation: InsertBudgetAllocation): Promise<BudgetAllocation> {
    const id = randomUUID();
    const allocation: BudgetAllocation = {
      ...insertAllocation,
      id,
      createdAt: new Date(),
    } as BudgetAllocation;
    this.budgetAllocationsMap.set(id, allocation);
    return allocation;
  }

  async updateBudgetAllocation(id: string, update: Partial<InsertBudgetAllocation>): Promise<BudgetAllocation | undefined> {
    const allocation = this.budgetAllocationsMap.get(id);
    if (!allocation) return undefined;
    const updated = { ...allocation, ...update } as BudgetAllocation;
    this.budgetAllocationsMap.set(id, updated);
    return updated;
  }

  async getBudgetAllocationsByCeremony(weddingId: string, ceremonyId: string): Promise<BudgetAllocation[]> {
    return Array.from(this.budgetAllocationsMap.values()).filter(
      a => a.weddingId === weddingId && a.ceremonyId === ceremonyId
    );
  }

  async getBudgetAllocationsByBucket(weddingId: string, bucket: BudgetBucket): Promise<BudgetAllocation[]> {
    return Array.from(this.budgetAllocationsMap.values()).filter(
      a => a.weddingId === weddingId && a.bucket === bucket
    );
  }

  async getBudgetAllocationByBucketCategoryId(
    weddingId: string,
    bucketCategoryId: string,
    ceremonyId?: string | null,
    lineItemLabel?: string | null
  ): Promise<BudgetAllocation | undefined> {
    return Array.from(this.budgetAllocationsMap.values()).find(
      a => a.weddingId === weddingId && 
           a.bucketCategoryId === bucketCategoryId &&
           (ceremonyId === undefined ? true : a.ceremonyId === ceremonyId) &&
           (lineItemLabel === undefined ? true : a.lineItemLabel === lineItemLabel)
    );
  }

  async getBudgetAllocationsByBucketCategoryId(weddingId: string, bucketCategoryId: string): Promise<BudgetAllocation[]> {
    return Array.from(this.budgetAllocationsMap.values()).filter(
      a => a.weddingId === weddingId && a.bucketCategoryId === bucketCategoryId
    );
  }

  async upsertBudgetAllocation(
    weddingId: string, 
    bucket: BudgetBucket, 
    allocatedAmount: string, 
    ceremonyId?: string | null, 
    lineItemLabel?: string | null, 
    notes?: string | null
  ): Promise<BudgetAllocation> {
    const existing = await this.getBudgetAllocationByBucket(weddingId, bucket, ceremonyId, lineItemLabel);
    if (existing) {
      return (await this.updateBudgetAllocation(existing.id, { allocatedAmount, notes }))!;
    }
    return this.createBudgetAllocation({ 
      weddingId, 
      bucket, 
      allocatedAmount, 
      ceremonyId: ceremonyId ?? null, 
      lineItemLabel: lineItemLabel ?? null, 
      notes: notes ?? null 
    });
  }

  async deleteBudgetAllocation(id: string): Promise<boolean> {
    return this.budgetAllocationsMap.delete(id);
  }

  async getCeremonyTotalAllocated(weddingId: string, ceremonyId: string): Promise<number> {
    const allocations = await this.getBudgetAllocationsByCeremony(weddingId, ceremonyId);
    return allocations.reduce((sum, a) => sum + parseFloat(a.allocatedAmount || '0'), 0);
  }

  async getBucketTotalAllocated(weddingId: string, bucket: BudgetBucket): Promise<number> {
    const allocations = await this.getBudgetAllocationsByBucket(weddingId, bucket);
    return allocations.reduce((sum, a) => sum + parseFloat(a.allocatedAmount || '0'), 0);
  }

  async getBudgetBucketCategory(id: string): Promise<BudgetBucketCategory | undefined> {
    return this.budgetBucketCategories.find(c => c.id === id);
  }

  async getAllBudgetBucketCategories(): Promise<BudgetBucketCategory[]> {
    return this.budgetBucketCategories;
  }

  async upsertBudgetAllocationByUUID(
    weddingId: string,
    bucketCategoryId: string,
    allocatedAmount: string,
    ceremonyId?: string | null,
    lineItemLabel?: string | null,
    notes?: string | null
  ): Promise<BudgetAllocation> {
    const existing = await this.getBudgetAllocationByBucketCategoryId(weddingId, bucketCategoryId, ceremonyId, lineItemLabel);
    if (existing) {
      return (await this.updateBudgetAllocation(existing.id, { allocatedAmount, notes }))!;
    }
    
    // Look up the bucket category to get the slug for the legacy 'bucket' column
    const bucketCategory = await this.getBudgetBucketCategory(bucketCategoryId);
    const bucketSlug = bucketCategory?.slug as BudgetBucket || 'other';
    
    return this.createBudgetAllocation({
      weddingId,
      bucket: bucketSlug,
      bucketCategoryId,
      allocatedAmount,
      ceremonyId: ceremonyId ?? null,
      lineItemLabel: lineItemLabel ?? null,
      notes: notes ?? null
    });
  }

  async getBucketTotalAllocatedByUUID(weddingId: string, bucketCategoryId: string): Promise<number> {
    const allocations = await this.getBudgetAllocationsByBucketCategoryId(weddingId, bucketCategoryId);
    return allocations.reduce((sum, a) => sum + parseFloat(a.allocatedAmount || '0'), 0);
  }

  async recalculateBucketAllocationsFromCeremonies(weddingId: string): Promise<void> {
    // MemStorage stub - not fully implemented, just updates existing allocations
    // Full implementation is in DatabaseStorage
  }

  // Expenses (Single Ledger Model)
  async getExpense(id: string): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async getExpensesByWedding(weddingId: string): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter((e) => e.weddingId === weddingId);
  }

  async getExpensesByBucket(weddingId: string, bucket: BudgetBucket): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(
      (e) => e.weddingId === weddingId && e.parentCategory === bucket
    );
  }

  async getExpenseTotalByBucket(weddingId: string, bucket: BudgetBucket): Promise<number> {
    const expenses = await this.getExpensesByBucket(weddingId, bucket);
    return expenses.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
  }

  async getExpensesByCeremony(weddingId: string, ceremonyId: string): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(
      (e) => e.weddingId === weddingId && e.ceremonyId === ceremonyId
    );
  }

  async getExpenseTotalByCeremony(weddingId: string, ceremonyId: string): Promise<number> {
    const expenses = await this.getExpensesByCeremony(weddingId, ceremonyId);
    return expenses.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = randomUUID();
    const expense: Expense = {
      ...insertExpense,
      id,
      ceremonyId: insertExpense.ceremonyId ?? null,
      vendorId: insertExpense.vendorId ?? null,
      receiptUrl: insertExpense.receiptUrl ?? null,
      notes: insertExpense.notes ?? null,
      paymentDueDate: insertExpense.paymentDueDate ?? null,
      expenseDate: insertExpense.expenseDate ?? new Date(),
      createdAt: new Date(),
    } as Expense;
    this.expenses.set(id, expense);
    return expense;
  }

  async updateExpense(id: string, update: Partial<InsertExpense>): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (!expense) return undefined;
    const updated = { ...expense, ...update } as Expense;
    this.expenses.set(id, updated);
    return updated;
  }

  async deleteExpense(id: string): Promise<boolean> {
    return this.expenses.delete(id);
  }

  // Expense Splits
  async getExpenseSplit(id: string): Promise<ExpenseSplit | undefined> {
    return this.expenseSplits.get(id);
  }

  async getExpenseSplitsByExpense(expenseId: string): Promise<ExpenseSplit[]> {
    return Array.from(this.expenseSplits.values()).filter((s) => s.expenseId === expenseId);
  }

  async createExpenseSplit(insertSplit: InsertExpenseSplit): Promise<ExpenseSplit> {
    const id = randomUUID();
    const split: ExpenseSplit = {
      ...insertSplit,
      id,
      sharePercentage: insertSplit.sharePercentage ?? null,
      isPaid: insertSplit.isPaid ?? false,
      paidAt: insertSplit.paidAt ?? null,
    } as ExpenseSplit;
    this.expenseSplits.set(id, split);
    return split;
  }

  async updateExpenseSplit(id: string, update: Partial<InsertExpenseSplit>): Promise<ExpenseSplit | undefined> {
    const split = this.expenseSplits.get(id);
    if (!split) return undefined;
    const updated = { ...split, ...update } as ExpenseSplit;
    this.expenseSplits.set(id, updated);
    return updated;
  }

  async deleteExpenseSplit(id: string): Promise<boolean> {
    return this.expenseSplits.delete(id);
  }

  async deleteExpenseSplitsByExpense(expenseId: string): Promise<boolean> {
    const toDelete = Array.from(this.expenseSplits.entries())
      .filter(([_, split]) => split.expenseId === expenseId)
      .map(([id]) => id);
    toDelete.forEach((id) => this.expenseSplits.delete(id));
    return true;
  }

  // Households
  async getHousehold(id: string): Promise<Household | undefined> {
    return this.households.get(id);
  }

  async getHouseholdsByWedding(weddingId: string): Promise<Household[]> {
    return Array.from(this.households.values()).filter((h) => h.weddingId === weddingId);
  }

  async getHouseholdByMagicToken(token: string): Promise<Household | undefined> {
    const households = Array.from(this.households.values());
    for (const household of households) {
      if (!household.magicLinkTokenHash || !household.magicLinkExpires) continue;
      
      const now = new Date();
      if (household.magicLinkExpires < now) continue;
      
      const isValid = await bcrypt.compare(token, household.magicLinkTokenHash);
      if (isValid) return household;
    }
    return undefined;
  }

  async createHousehold(insertHousehold: InsertHousehold): Promise<Household> {
    const id = randomUUID();
    const household: Household = {
      ...insertHousehold,
      id,
      maxCount: insertHousehold.maxCount ?? 1,
      magicLinkTokenHash: null,
      magicLinkToken: null,
      magicLinkExpires: null,
      createdAt: new Date(),
    };
    this.households.set(id, household);
    return household;
  }

  async updateHousehold(id: string, update: Partial<InsertHousehold>): Promise<Household | undefined> {
    const household = this.households.get(id);
    if (!household) return undefined;

    const updated = { ...household, ...update };
    this.households.set(id, updated);
    return updated;
  }

  async deleteHousehold(id: string): Promise<boolean> {
    return this.households.delete(id);
  }

  async generateHouseholdMagicToken(householdId: string, expiresInDays: number = 30): Promise<string> {
    const household = this.households.get(householdId);
    if (!household) throw new Error('Household not found');

    const token = randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(token, 10);
    const expires = new Date();
    expires.setDate(expires.getDate() + expiresInDays);

    const updated = {
      ...household,
      magicLinkTokenHash: hash,
      magicLinkToken: token, // Store plaintext for QR/copy functionality
      magicLinkExpires: expires,
    };
    this.households.set(householdId, updated);

    return token;
  }

  async revokeHouseholdMagicToken(householdId: string): Promise<boolean> {
    const household = this.households.get(householdId);
    if (!household) return false;

    const updated = {
      ...household,
      magicLinkTokenHash: null,
      magicLinkToken: null, // Clear plaintext token as well
      magicLinkExpires: null,
    };
    this.households.set(householdId, updated);
    return true;
  }

  // Guests
  async getGuest(id: string): Promise<Guest | undefined> {
    return this.guests.get(id);
  }

  async getGuestsByWedding(weddingId: string): Promise<Guest[]> {
    return Array.from(this.guests.values()).filter((g) => g.weddingId === weddingId);
  }

  async getGuestsByHousehold(householdId: string): Promise<Guest[]> {
    return Array.from(this.guests.values()).filter((g) => g.householdId === householdId);
  }

  async getGuestByMagicToken(token: string): Promise<Guest | undefined> {
    const guests = Array.from(this.guests.values());
    for (const guest of guests) {
      if (!guest.magicLinkTokenHash || !guest.magicLinkExpires) continue;
      
      const now = new Date();
      if (guest.magicLinkExpires < now) continue;
      
      const isValid = await bcrypt.compare(token, guest.magicLinkTokenHash);
      if (isValid) return guest;
    }
    return undefined;
  }

  async createGuest(insertGuest: InsertGuest): Promise<Guest> {
    const id = randomUUID();
    const guest: Guest = {
      ...insertGuest,
      id,
      rsvpStatus: insertGuest.rsvpStatus || "pending",
      plusOne: insertGuest.plusOne || false,
      magicLinkTokenHash: null,
      magicLinkExpires: null,
    } as Guest;
    this.guests.set(id, guest);
    return guest;
  }

  async updateGuest(id: string, update: Partial<InsertGuest>): Promise<Guest | undefined> {
    const guest = this.guests.get(id);
    if (!guest) return undefined;

    const updated = { ...guest, ...update } as Guest;
    this.guests.set(id, updated);
    return updated;
  }

  async deleteGuest(id: string): Promise<boolean> {
    return this.guests.delete(id);
  }

  async generateMagicLinkToken(guestId: string, expiresInDays: number = 30): Promise<string> {
    const guest = this.guests.get(guestId);
    if (!guest) throw new Error('Guest not found');

    const token = randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(token, 10);
    const expires = new Date();
    expires.setDate(expires.getDate() + expiresInDays);

    const updated = {
      ...guest,
      magicLinkTokenHash: hash,
      magicLinkExpires: expires,
    } as Guest;
    this.guests.set(guestId, updated);

    return token;
  }

  async revokeMagicLinkToken(guestId: string): Promise<boolean> {
    const guest = this.guests.get(guestId);
    if (!guest) return false;

    const updated = {
      ...guest,
      magicLinkTokenHash: null,
      magicLinkExpires: null,
    } as Guest;
    this.guests.set(guestId, updated);
    return true;
  }

  // Plus-One Guest Management
  async createPlusOneGuest(guestId: string): Promise<Guest> {
    const guest = this.guests.get(guestId);
    if (!guest) throw new Error('Guest not found');
    
    // Check if plus one already exists
    const existingPlusOne = Array.from(this.guests.values()).find(g => g.plusOneForGuestId === guestId);
    if (existingPlusOne) return existingPlusOne;
    
    // Create plus one guest
    const plusOneGuest = await this.createGuest({
      weddingId: guest.weddingId,
      householdId: guest.householdId,
      name: `${guest.name}'s Guest`,
      side: guest.side,
      plusOneForGuestId: guestId,
    } as InsertGuest);
    
    // Mark the original guest as having a plus one
    await this.updateGuest(guestId, { plusOne: true });
    
    return plusOneGuest;
  }

  async deletePlusOneGuest(guestId: string): Promise<boolean> {
    const plusOne = Array.from(this.guests.values()).find(g => g.plusOneForGuestId === guestId);
    if (!plusOne) return false;
    
    // Delete the plus one guest
    this.guests.delete(plusOne.id);
    
    // Update the original guest
    await this.updateGuest(guestId, { plusOne: false });
    
    return true;
  }

  async getPlusOneForGuest(guestId: string): Promise<Guest | undefined> {
    return Array.from(this.guests.values()).find(g => g.plusOneForGuestId === guestId);
  }

  // Invitations
  async getInvitation(id: string): Promise<Invitation | undefined> {
    return this.invitations.get(id);
  }

  async getInvitationsByGuest(guestId: string): Promise<Invitation[]> {
    return Array.from(this.invitations.values()).filter((i) => i.guestId === guestId);
  }

  async getInvitationsByEvent(eventId: string): Promise<Invitation[]> {
    return Array.from(this.invitations.values()).filter((i) => i.eventId === eventId);
  }

  async getInvitationByGuestAndEvent(guestId: string, eventId: string): Promise<Invitation | undefined> {
    return Array.from(this.invitations.values()).find(
      (i) => i.guestId === guestId && i.eventId === eventId
    );
  }

  async createInvitation(insertInvitation: InsertInvitation): Promise<Invitation> {
    const id = randomUUID();
    const invitation: Invitation = {
      ...insertInvitation,
      id,
      rsvpStatus: insertInvitation.rsvpStatus || 'pending',
      invitedAt: new Date(),
    } as Invitation;
    this.invitations.set(id, invitation);
    return invitation;
  }

  async bulkCreateInvitations(insertInvitations: InsertInvitation[]): Promise<Invitation[]> {
    const invitations: Invitation[] = [];
    for (const insertInvitation of insertInvitations) {
      const invitation = await this.createInvitation(insertInvitation);
      invitations.push(invitation);
    }
    return invitations;
  }

  async updateInvitation(id: string, update: Partial<InsertInvitation>): Promise<Invitation | undefined> {
    const invitation = this.invitations.get(id);
    if (!invitation) return undefined;

    const updated = { ...invitation, ...update } as Invitation;
    this.invitations.set(id, updated);
    return updated;
  }

  async deleteInvitation(id: string): Promise<boolean> {
    return this.invitations.delete(id);
  }

  // Tasks
  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByWedding(weddingId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter((t) => t.weddingId === weddingId);
  }

  async getTasksByAssignedUser(weddingId: string, userId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (t) => t.weddingId === weddingId && t.assignedToId === userId
    );
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = {
      ...insertTask,
      id,
      completed: insertTask.completed || false,
      priority: insertTask.priority || "medium",
    } as Task;
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, update: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updated = { ...task, ...update } as Task;
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async getTasksWithRemindersForDate(targetDate: Date): Promise<Task[]> {
    const tasks = Array.from(this.tasks.values()).filter(t => {
      if (!t.reminderEnabled || t.completed || !t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - (t.reminderDaysBefore || 1));
      return reminderDate.toDateString() === targetDate.toDateString();
    });
    return tasks;
  }

  // Task Templates (MemStorage fetches from database since templates are shared)
  async getTaskTemplatesByTradition(tradition: string): Promise<TaskTemplate[]> {
    // MemStorage doesn't store templates - they come from database
    // Return empty array as fallback; in practice, DatabaseStorage is used
    return [];
  }

  async getAllTaskTemplates(): Promise<TaskTemplate[]> {
    return [];
  }

  // Task Reminders
  async getTaskReminder(id: string): Promise<TaskReminder | undefined> {
    return this.taskReminders.get(id);
  }

  async getRemindersByTask(taskId: string): Promise<TaskReminder[]> {
    return Array.from(this.taskReminders.values()).filter(r => r.taskId === taskId);
  }

  async getRemindersByWedding(weddingId: string): Promise<TaskReminder[]> {
    return Array.from(this.taskReminders.values()).filter(r => r.weddingId === weddingId);
  }

  async hasReminderBeenSent(taskId: string, reminderType: string, today: Date): Promise<boolean> {
    const reminders = await this.getRemindersByTask(taskId);
    return reminders.some(r => {
      const sentDate = new Date(r.sentAt).toDateString();
      return r.reminderType === reminderType && sentDate === today.toDateString();
    });
  }

  async createTaskReminder(reminder: InsertTaskReminder): Promise<TaskReminder> {
    const id = randomUUID();
    const newReminder: TaskReminder = {
      ...reminder,
      id,
      sentAt: new Date(),
      status: reminder.status || 'sent',
    };
    this.taskReminders.set(id, newReminder);
    return newReminder;
  }

  async updateTaskReminder(id: string, updates: Partial<InsertTaskReminder>): Promise<TaskReminder | undefined> {
    const reminder = this.taskReminders.get(id);
    if (!reminder) return undefined;
    const updated = { ...reminder, ...updates };
    this.taskReminders.set(id, updated);
    return updated;
  }

  // Task Comments
  private taskComments: Map<string, TaskComment> = new Map();

  async getTaskComment(id: string): Promise<TaskComment | undefined> {
    return this.taskComments.get(id);
  }

  async getCommentsByTask(taskId: string): Promise<TaskComment[]> {
    return Array.from(this.taskComments.values())
      .filter(c => c.taskId === taskId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createTaskComment(comment: InsertTaskComment): Promise<TaskComment> {
    const id = randomUUID();
    const newComment: TaskComment = {
      ...comment,
      id,
      createdAt: new Date(),
    };
    this.taskComments.set(id, newComment);
    return newComment;
  }

  async deleteTaskComment(id: string): Promise<boolean> {
    return this.taskComments.delete(id);
  }

  // Contracts
  async getContract(id: string): Promise<Contract | undefined> {
    return this.contracts.get(id);
  }

  async getContractsByWedding(weddingId: string): Promise<Contract[]> {
    return Array.from(this.contracts.values()).filter((c) => c.weddingId === weddingId);
  }

  async getContractsByVendor(vendorId: string): Promise<Contract[]> {
    return Array.from(this.contracts.values()).filter((c) => c.vendorId === vendorId);
  }

  async getContractByBooking(bookingId: string): Promise<Contract | undefined> {
    return Array.from(this.contracts.values()).find((c) => c.bookingId === bookingId);
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const id = randomUUID();
    const contract: Contract = {
      ...insertContract,
      id,
      status: insertContract.status || 'draft',
      createdAt: new Date(),
    } as Contract;
    this.contracts.set(id, contract);
    return contract;
  }

  async updateContract(
    id: string,
    update: Partial<InsertContract>
  ): Promise<Contract | undefined> {
    const contract = this.contracts.get(id);
    if (!contract) return undefined;

    const updated = { ...contract, ...update } as Contract;
    this.contracts.set(id, updated);
    return updated;
  }

  async deleteContract(id: string): Promise<boolean> {
    return this.contracts.delete(id);
  }

  // Contract Templates
  async getContractTemplate(id: string): Promise<ContractTemplate | undefined> {
    return this.contractTemplates.get(id);
  }

  async getContractTemplatesByCategory(category: string): Promise<ContractTemplate[]> {
    return Array.from(this.contractTemplates.values()).filter(
      (t) => t.vendorCategory.toLowerCase() === category.toLowerCase()
    );
  }

  async getAllContractTemplates(): Promise<ContractTemplate[]> {
    return Array.from(this.contractTemplates.values()).filter(t => !t.isCustom);
  }

  async getDefaultContractTemplate(category: string): Promise<ContractTemplate | undefined> {
    return Array.from(this.contractTemplates.values()).find(
      (t) => t.vendorCategory.toLowerCase() === category.toLowerCase() && t.isDefault
    );
  }

  async getCustomTemplatesByWedding(weddingId: string): Promise<ContractTemplate[]> {
    return Array.from(this.contractTemplates.values()).filter(
      (t) => t.weddingId === weddingId && t.isCustom
    );
  }

  async createContractTemplate(insertTemplate: InsertContractTemplate): Promise<ContractTemplate> {
    const id = randomUUID();
    const template: ContractTemplate = {
      ...insertTemplate,
      id,
      isDefault: insertTemplate.isDefault || false,
      isCustom: insertTemplate.isCustom || false,
      createdAt: new Date(),
    } as ContractTemplate;
    this.contractTemplates.set(id, template);
    return template;
  }

  async updateContractTemplate(
    id: string,
    update: Partial<InsertContractTemplate>
  ): Promise<ContractTemplate | undefined> {
    const template = this.contractTemplates.get(id);
    if (!template) return undefined;

    const updated = { ...template, ...update } as ContractTemplate;
    this.contractTemplates.set(id, updated);
    return updated;
  }

  async deleteContractTemplate(id: string): Promise<boolean> {
    return this.contractTemplates.delete(id);
  }

  // Messages
  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getConversationsByWedding(weddingId: string): Promise<string[]> {
    const conversationIds = new Set<string>();
    Array.from(this.messages.values())
      .filter(m => m.weddingId === weddingId)
      .forEach(m => conversationIds.add(m.conversationId));
    return Array.from(conversationIds);
  }

  async getConversationsByVendor(vendorId: string): Promise<string[]> {
    const conversationIds = new Set<string>();
    Array.from(this.messages.values())
      .filter(m => m.vendorId === vendorId)
      .forEach(m => conversationIds.add(m.conversationId));
    return Array.from(conversationIds);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    // Ensure consistent conversationId format - include eventId if present
    const conversationId = generateConversationId(
      insertMessage.weddingId, 
      insertMessage.vendorId, 
      insertMessage.eventId || undefined
    );
    const message: Message = {
      ...insertMessage,
      id,
      conversationId,
      isRead: false,
      createdAt: new Date(),
      attachments: insertMessage.attachments || null,
      eventId: insertMessage.eventId || null,
      messageType: insertMessage.messageType || 'message',
      bookingId: insertMessage.bookingId || null,
    };
    this.messages.set(id, message);
    return message;
  }

  async markMessageAsRead(id: string): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updated: Message = { ...message, isRead: true };
    this.messages.set(id, updated);
    return updated;
  }

  async getUnreadCount(conversationId: string, recipientType: 'couple' | 'vendor'): Promise<number> {
    return Array.from(this.messages.values())
      .filter(m => 
        m.conversationId === conversationId && 
        !m.isRead && 
        m.senderType !== recipientType
      ).length;
  }

  async getUnreadVendorMessagesByWedding(weddingId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(m => m.weddingId === weddingId && m.senderType === 'vendor' && !m.isRead)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Conversation Status
  async getConversationStatus(conversationId: string): Promise<ConversationStatus | undefined> {
    return Array.from(this.conversationStatuses.values()).find(s => s.conversationId === conversationId);
  }

  async createConversationStatus(insert: InsertConversationStatus): Promise<ConversationStatus> {
    const id = randomUUID();
    const status: ConversationStatus = {
      ...insert,
      id,
      status: insert.status || 'open',
      closedBy: insert.closedBy || null,
      closedByType: insert.closedByType || null,
      closureReason: insert.closureReason || null,
      closedAt: insert.closedAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.conversationStatuses.set(id, status);
    return status;
  }

  async updateConversationStatus(conversationId: string, updates: Partial<InsertConversationStatus>): Promise<ConversationStatus | undefined> {
    const existing = Array.from(this.conversationStatuses.values()).find(s => s.conversationId === conversationId);
    if (!existing) return undefined;
    const updated: ConversationStatus = { ...existing, ...updates, updatedAt: new Date() };
    this.conversationStatuses.set(existing.id, updated);
    return updated;
  }

  async closeConversation(conversationId: string, closedBy: string, closedByType: 'couple' | 'vendor', reason?: string): Promise<ConversationStatus> {
    let existing = Array.from(this.conversationStatuses.values()).find(s => s.conversationId === conversationId);
    if (!existing) {
      const parsed = parseConversationId(conversationId);
      if (!parsed) throw new Error("Invalid conversationId");
      existing = await this.createConversationStatus({
        conversationId,
        weddingId: parsed.weddingId,
        vendorId: parsed.vendorId,
        eventId: parsed.eventId,
      });
    }
    const result = await this.updateConversationStatus(conversationId, {
      status: 'closed',
      closedBy,
      closedByType,
      closureReason: reason,
      closedAt: new Date(),
    });
    return result as ConversationStatus;
  }

  // Quick Reply Templates
  async getQuickReplyTemplate(id: string): Promise<QuickReplyTemplate | undefined> {
    return this.quickReplyTemplates.get(id);
  }

  async getQuickReplyTemplatesByVendor(vendorId: string): Promise<QuickReplyTemplate[]> {
    return Array.from(this.quickReplyTemplates.values())
      .filter(t => t.vendorId === vendorId)
      .sort((a, b) => b.usageCount! - a.usageCount!);
  }

  async createQuickReplyTemplate(insertTemplate: InsertQuickReplyTemplate): Promise<QuickReplyTemplate> {
    const id = randomUUID();
    const template: QuickReplyTemplate = {
      ...insertTemplate,
      id,
      category: insertTemplate.category ?? null,
      isDefault: insertTemplate.isDefault ?? false,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.quickReplyTemplates.set(id, template);
    return template;
  }

  async updateQuickReplyTemplate(id: string, updates: Partial<InsertQuickReplyTemplate>): Promise<QuickReplyTemplate | undefined> {
    const existing = this.quickReplyTemplates.get(id);
    if (!existing) return undefined;
    
    const updated: QuickReplyTemplate = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.quickReplyTemplates.set(id, updated);
    return updated;
  }

  async deleteQuickReplyTemplate(id: string): Promise<boolean> {
    return this.quickReplyTemplates.delete(id);
  }

  async incrementTemplateUsage(id: string): Promise<QuickReplyTemplate | undefined> {
    const template = this.quickReplyTemplates.get(id);
    if (!template) return undefined;
    
    const updated: QuickReplyTemplate = {
      ...template,
      usageCount: (template.usageCount || 0) + 1,
      updatedAt: new Date(),
    };
    this.quickReplyTemplates.set(id, updated);
    return updated;
  }

  // Follow-Up Reminders
  async getFollowUpReminder(id: string): Promise<FollowUpReminder | undefined> {
    return this.followUpReminders.get(id);
  }

  async getFollowUpRemindersByVendor(vendorId: string): Promise<FollowUpReminder[]> {
    return Array.from(this.followUpReminders.values())
      .filter(r => r.vendorId === vendorId)
      .sort((a, b) => a.reminderDate.getTime() - b.reminderDate.getTime());
  }

  async getPendingRemindersForVendor(vendorId: string): Promise<FollowUpReminder[]> {
    return Array.from(this.followUpReminders.values())
      .filter(r => r.vendorId === vendorId && r.status === 'pending')
      .sort((a, b) => a.reminderDate.getTime() - b.reminderDate.getTime());
  }

  async createFollowUpReminder(insertReminder: InsertFollowUpReminder): Promise<FollowUpReminder> {
    const id = randomUUID();
    const reminder: FollowUpReminder = {
      ...insertReminder,
      id,
      note: insertReminder.note ?? null,
      status: insertReminder.status ?? 'pending',
      createdAt: new Date(),
    };
    this.followUpReminders.set(id, reminder);
    return reminder;
  }

  async updateFollowUpReminder(id: string, updates: Partial<InsertFollowUpReminder>): Promise<FollowUpReminder | undefined> {
    const existing = this.followUpReminders.get(id);
    if (!existing) return undefined;
    
    const updated: FollowUpReminder = {
      ...existing,
      ...updates,
    };
    this.followUpReminders.set(id, updated);
    return updated;
  }

  async deleteFollowUpReminder(id: string): Promise<boolean> {
    return this.followUpReminders.delete(id);
  }

  // Reviews
  async getReview(id: string): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async getReviewsByVendor(vendorId: string): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(r => r.vendorId === vendorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getReviewsByWedding(weddingId: string): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(r => r.weddingId === weddingId);
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = randomUUID();
    const review: Review = {
      ...insertReview,
      id,
      comment: insertReview.comment ?? null,
      helpful: 0,
      createdAt: new Date(),
    };
    this.reviews.set(id, review);
    
    // Update vendor rating
    await this.updateVendorRating(insertReview.vendorId);
    
    return review;
  }

  async updateVendorRating(vendorId: string): Promise<void> {
    const vendor = this.vendors.get(vendorId);
    if (!vendor) return;

    const reviews = await this.getReviewsByVendor(vendorId);
    if (reviews.length === 0) {
      vendor.rating = null;
      vendor.reviewCount = 0;
    } else {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      vendor.rating = String(avgRating.toFixed(1));
      vendor.reviewCount = reviews.length;
    }
    
    this.vendors.set(vendorId, vendor);
  }

  // Playlists
  async getPlaylist(id: string): Promise<Playlist | undefined> {
    return this.playlists.get(id);
  }

  async getPlaylistsByWedding(weddingId: string): Promise<Playlist[]> {
    return Array.from(this.playlists.values()).filter((p) => p.weddingId === weddingId);
  }

  async getPlaylistsByEvent(eventId: string): Promise<Playlist[]> {
    return Array.from(this.playlists.values()).filter((p) => p.eventId === eventId);
  }

  async createPlaylist(insertPlaylist: InsertPlaylist): Promise<Playlist> {
    const id = randomUUID();
    const playlist: Playlist = {
      ...insertPlaylist,
      id,
      sharedWithVendors: insertPlaylist.sharedWithVendors || [],
      isPublic: insertPlaylist.isPublic || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Playlist;
    this.playlists.set(id, playlist);
    return playlist;
  }

  async updatePlaylist(id: string, update: Partial<InsertPlaylist>): Promise<Playlist | undefined> {
    const playlist = this.playlists.get(id);
    if (!playlist) return undefined;

    const updated = { ...playlist, ...update, updatedAt: new Date() };
    this.playlists.set(id, updated);
    return updated;
  }

  async deletePlaylist(id: string): Promise<boolean> {
    // Also delete all songs in this playlist
    const songs = await this.getSongsByPlaylist(id);
    for (const song of songs) {
      await this.deletePlaylistSong(song.id);
    }
    return this.playlists.delete(id);
  }

  // Playlist Songs
  async getPlaylistSong(id: string): Promise<PlaylistSong | undefined> {
    return this.playlistSongs.get(id);
  }

  async getSongsByPlaylist(playlistId: string): Promise<PlaylistSong[]> {
    return Array.from(this.playlistSongs.values())
      .filter((s) => s.playlistId === playlistId)
      .sort((a, b) => {
        // Sort by vote count (descending), then by order, then by creation date
        const aVotes = a.voteCount || 0;
        const bVotes = b.voteCount || 0;
        if (bVotes !== aVotes) {
          return bVotes - aVotes;
        }
        if (a.order !== null && b.order !== null) {
          return a.order - b.order;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }

  async createPlaylistSong(insertSong: InsertPlaylistSong): Promise<PlaylistSong> {
    const id = randomUUID();
    const song: PlaylistSong = {
      ...insertSong,
      id,
      voteCount: 0,
      status: insertSong.status || 'pending',
      createdAt: new Date(),
    } as PlaylistSong;
    this.playlistSongs.set(id, song);
    return song;
  }

  async updatePlaylistSong(id: string, update: Partial<InsertPlaylistSong>): Promise<PlaylistSong | undefined> {
    const song = this.playlistSongs.get(id);
    if (!song) return undefined;

    const updated = { ...song, ...update };
    this.playlistSongs.set(id, updated);
    return updated;
  }

  async deletePlaylistSong(id: string): Promise<boolean> {
    // Also delete all votes for this song
    const votes = await this.getVotesBySong(id);
    for (const vote of votes) {
      this.songVotes.delete(vote.id);
    }
    return this.playlistSongs.delete(id);
  }

  async updateSongVoteCount(songId: string): Promise<void> {
    const song = this.playlistSongs.get(songId);
    if (!song) return;

    const votes = await this.getVotesBySong(songId);
    const updated = { ...song, voteCount: votes.length };
    this.playlistSongs.set(songId, updated);
  }

  // Song Votes
  async getSongVote(id: string): Promise<SongVote | undefined> {
    return this.songVotes.get(id);
  }

  async getVotesBySong(songId: string): Promise<SongVote[]> {
    return Array.from(this.songVotes.values()).filter((v) => v.songId === songId);
  }

  async createSongVote(insertVote: InsertSongVote): Promise<SongVote> {
    const id = randomUUID();
    const vote: SongVote = {
      ...insertVote,
      id,
      voterName: insertVote.voterName || null,
      createdAt: new Date(),
    };
    this.songVotes.set(id, vote);
    
    // Update the song's vote count
    await this.updateSongVoteCount(insertVote.songId);
    
    return vote;
  }

  async deleteVote(voterId: string, songId: string): Promise<boolean> {
    const vote = Array.from(this.songVotes.values()).find(
      (v) => v.voterId === voterId && v.songId === songId
    );
    
    if (!vote) return false;
    
    this.songVotes.delete(vote.id);
    await this.updateSongVoteCount(songId);
    return true;
  }

  async hasUserVoted(voterId: string, songId: string): Promise<boolean> {
    return Array.from(this.songVotes.values()).some(
      (v) => v.voterId === voterId && v.songId === songId
    );
  }

  // Documents
  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentsByWedding(weddingId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (d) => d.weddingId === weddingId
    );
  }

  async getDocumentsByEvent(eventId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (d) => d.eventId === eventId
    );
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const newDocument: Document = {
      id: randomUUID(),
      ...document,
      eventId: document.eventId ?? null,
      notes: document.notes ?? null,
      fileSize: document.fileSize ?? null,
      mimeType: document.mimeType ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      sharedWithVendors: document.sharedWithVendors ?? null,
    };
    this.documents.set(newDocument.id, newDocument);
    return newDocument;
  }

  async updateDocument(id: string, document: Partial<InsertDocument>): Promise<Document | undefined> {
    const existing = this.documents.get(id);
    if (!existing) return undefined;
    const updated: Document = {
      ...existing,
      ...document,
      updatedAt: new Date(),
    };
    this.documents.set(id, updated);
    return updated;
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Wedding Websites
  async getWeddingWebsite(id: string): Promise<WeddingWebsite | undefined> {
    return this.weddingWebsites.get(id);
  }

  async getWeddingWebsiteByWeddingId(weddingId: string): Promise<WeddingWebsite | undefined> {
    return Array.from(this.weddingWebsites.values()).find(
      (w) => w.weddingId === weddingId
    );
  }

  async getWeddingWebsiteBySlug(slug: string): Promise<WeddingWebsite | undefined> {
    return Array.from(this.weddingWebsites.values()).find(
      (w) => w.slug === slug
    );
  }

  async createWeddingWebsite(website: InsertWeddingWebsite): Promise<WeddingWebsite> {
    const newWebsite: WeddingWebsite = {
      id: randomUUID(),
      ...website,
      isPublished: website.isPublished ?? false,
      heroImageUrl: website.heroImageUrl ?? null,
      welcomeTitle: website.welcomeTitle ?? null,
      welcomeMessage: website.welcomeMessage ?? null,
      coupleStory: website.coupleStory ?? null,
      travelInfo: website.travelInfo ?? null,
      accommodationInfo: website.accommodationInfo ?? null,
      thingsToDoInfo: website.thingsToDoInfo ?? null,
      faqInfo: website.faqInfo ?? null,
      registryLinks: website.registryLinks ?? null,
      primaryColor: website.primaryColor ?? '#f97316',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.weddingWebsites.set(newWebsite.id, newWebsite);
    return newWebsite;
  }

  async updateWeddingWebsite(id: string, website: Partial<InsertWeddingWebsite>): Promise<WeddingWebsite | undefined> {
    const existing = this.weddingWebsites.get(id);
    if (!existing) return undefined;
    const updated: WeddingWebsite = {
      ...existing,
      ...website,
      updatedAt: new Date(),
    };
    this.weddingWebsites.set(id, updated);
    return updated;
  }

  async deleteWeddingWebsite(id: string): Promise<boolean> {
    return this.weddingWebsites.delete(id);
  }

  // Registry Retailers (MemStorage - presets are in database, stub implementation)
  async getRegistryRetailer(id: string): Promise<RegistryRetailer | undefined> {
    return undefined; // Presets are stored in database
  }

  async getAllRegistryRetailers(): Promise<RegistryRetailer[]> {
    return []; // Presets are stored in database
  }

  async getActiveRegistryRetailers(): Promise<RegistryRetailer[]> {
    return []; // Presets are stored in database
  }

  // Wedding Registries (MemStorage)
  private weddingRegistries: Map<string, WeddingRegistry> = new Map();

  async getWeddingRegistry(id: string): Promise<WeddingRegistry | undefined> {
    return this.weddingRegistries.get(id);
  }

  async getRegistriesByWedding(weddingId: string): Promise<WeddingRegistry[]> {
    return Array.from(this.weddingRegistries.values())
      .filter(r => r.weddingId === weddingId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  async getRegistriesWithRetailersByWedding(weddingId: string): Promise<Array<WeddingRegistry & { retailer?: RegistryRetailer }>> {
    const registries = await this.getRegistriesByWedding(weddingId);
    return registries.map(r => ({ ...r, retailer: undefined }));
  }

  async createWeddingRegistry(registry: InsertWeddingRegistry): Promise<WeddingRegistry> {
    const newRegistry: WeddingRegistry = {
      id: randomUUID(),
      weddingId: registry.weddingId,
      retailerId: registry.retailerId ?? null,
      customRetailerName: registry.customRetailerName ?? null,
      customLogoUrl: registry.customLogoUrl ?? null,
      registryUrl: registry.registryUrl,
      notes: registry.notes ?? null,
      sortOrder: registry.sortOrder ?? 0,
      isPrimary: registry.isPrimary ?? false,
      createdAt: new Date(),
    };
    this.weddingRegistries.set(newRegistry.id, newRegistry);
    return newRegistry;
  }

  async updateWeddingRegistry(id: string, registry: Partial<InsertWeddingRegistry>): Promise<WeddingRegistry | undefined> {
    const existing = this.weddingRegistries.get(id);
    if (!existing) return undefined;
    const updated: WeddingRegistry = { ...existing, ...registry };
    this.weddingRegistries.set(id, updated);
    return updated;
  }

  async deleteWeddingRegistry(id: string): Promise<boolean> {
    return this.weddingRegistries.delete(id);
  }

  // Photo Galleries
  async getPhotoGallery(id: string): Promise<PhotoGallery | undefined> {
    return this.photoGalleries.get(id);
  }

  async getGalleriesByWedding(weddingId: string): Promise<PhotoGallery[]> {
    return Array.from(this.photoGalleries.values()).filter(
      (g) => g.weddingId === weddingId
    );
  }

  async getGalleriesByVendor(vendorId: string): Promise<PhotoGallery[]> {
    return Array.from(this.photoGalleries.values()).filter(
      (g) => g.vendorId === vendorId
    );
  }

  async getGalleriesByEvent(eventId: string): Promise<PhotoGallery[]> {
    return Array.from(this.photoGalleries.values()).filter(
      (g) => g.eventId === eventId
    );
  }

  async getGalleriesByType(type: 'inspiration' | 'vendor_portfolio' | 'event_photos'): Promise<PhotoGallery[]> {
    return Array.from(this.photoGalleries.values()).filter(
      (g) => g.type === type
    );
  }

  async createPhotoGallery(gallery: InsertPhotoGallery): Promise<PhotoGallery> {
    const newGallery: PhotoGallery = {
      id: randomUUID(),
      ...gallery,
      weddingId: gallery.weddingId ?? null,
      vendorId: gallery.vendorId ?? null,
      eventId: gallery.eventId ?? null,
      description: gallery.description ?? null,
      coverPhotoUrl: gallery.coverPhotoUrl ?? null,
      isPublic: gallery.isPublic ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.photoGalleries.set(newGallery.id, newGallery);
    return newGallery;
  }

  async updatePhotoGallery(id: string, gallery: Partial<InsertPhotoGallery>): Promise<PhotoGallery | undefined> {
    const existing = this.photoGalleries.get(id);
    if (!existing) return undefined;
    const updated: PhotoGallery = {
      ...existing,
      ...gallery,
      updatedAt: new Date(),
    };
    this.photoGalleries.set(id, updated);
    return updated;
  }

  async deletePhotoGallery(id: string): Promise<boolean> {
    return this.photoGalleries.delete(id);
  }

  // Photos
  async getPhoto(id: string): Promise<Photo | undefined> {
    return this.photos.get(id);
  }

  async getPhotosByGallery(galleryId: string): Promise<Photo[]> {
    return Array.from(this.photos.values())
      .filter((p) => p.galleryId === galleryId)
      .sort((a, b) => a.order - b.order);
  }

  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const newPhoto: Photo = {
      id: randomUUID(),
      ...photo,
      order: photo.order ?? 0,
      caption: photo.caption ?? null,
      uploadedBy: photo.uploadedBy ?? null,
      createdAt: new Date(),
    };
    this.photos.set(newPhoto.id, newPhoto);
    return newPhoto;
  }

  async updatePhoto(id: string, photo: Partial<InsertPhoto>): Promise<Photo | undefined> {
    const existing = this.photos.get(id);
    if (!existing) return undefined;
    const updated: Photo = {
      ...existing,
      ...photo,
    };
    this.photos.set(id, updated);
    return updated;
  }

  async deletePhoto(id: string): Promise<boolean> {
    return this.photos.delete(id);
  }

  // Vendor Availability
  async getVendorAvailability(id: string): Promise<VendorAvailability | undefined> {
    return this.vendorAvailability.get(id);
  }

  async getAvailabilityByVendor(vendorId: string): Promise<VendorAvailability[]> {
    return Array.from(this.vendorAvailability.values())
      .filter((a) => a.vendorId === vendorId)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getAvailabilityByVendorAndDateRange(vendorId: string, startDate: Date, endDate: Date): Promise<VendorAvailability[]> {
    return Array.from(this.vendorAvailability.values())
      .filter((a) =>
        a.vendorId === vendorId &&
        a.date >= startDate &&
        a.date <= endDate
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getAvailabilityByDate(vendorId: string, date: Date): Promise<VendorAvailability[]> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    return Array.from(this.vendorAvailability.values()).filter((a) => {
      if (a.vendorId !== vendorId) return false;
      const availDate = new Date(a.date);
      availDate.setHours(0, 0, 0, 0);
      return availDate.getTime() === targetDate.getTime();
    });
  }

  async checkAvailabilityConflicts(vendorId: string, date: Date, timeSlot: string, excludeBookingId?: string): Promise<boolean> {
    const slots = await this.getAvailabilityByDate(vendorId, date);
    const conflicts = slots.filter((slot) => {
      if (excludeBookingId && slot.bookingId === excludeBookingId) return false;
      if (slot.status === 'available' || slot.status === 'blocked') return false;
      if (slot.timeSlot === 'full_day' || timeSlot === 'full_day') return true;
      return slot.timeSlot === timeSlot;
    });
    return conflicts.length > 0;
  }

  async createVendorAvailability(availability: InsertVendorAvailability): Promise<VendorAvailability> {
    const newAvailability: VendorAvailability = {
      id: randomUUID(),
      ...availability,
      timeSlot: availability.timeSlot ?? null,
      weddingId: availability.weddingId ?? null,
      eventId: availability.eventId ?? null,
      bookingId: availability.bookingId ?? null,
      notes: availability.notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.vendorAvailability.set(newAvailability.id, newAvailability);
    return newAvailability;
  }

  async updateVendorAvailability(id: string, availability: Partial<InsertVendorAvailability>): Promise<VendorAvailability | undefined> {
    const existing = this.vendorAvailability.get(id);
    if (!existing) return undefined;
    const updated: VendorAvailability = {
      ...existing,
      ...availability,
      updatedAt: new Date(),
    };
    this.vendorAvailability.set(id, updated);
    return updated;
  }

  async deleteVendorAvailability(id: string): Promise<boolean> {
    return this.vendorAvailability.delete(id);
  }

  // Vendor Calendar Accounts
  async getVendorCalendarAccount(id: string): Promise<VendorCalendarAccount | undefined> {
    return this.vendorCalendarAccounts.get(id);
  }

  async getCalendarAccountsByVendor(vendorId: string): Promise<VendorCalendarAccount[]> {
    return Array.from(this.vendorCalendarAccounts.values())
      .filter(a => a.vendorId === vendorId);
  }

  async getCalendarAccountByEmail(vendorId: string, email: string): Promise<VendorCalendarAccount | undefined> {
    return Array.from(this.vendorCalendarAccounts.values())
      .find(a => a.vendorId === vendorId && a.email === email);
  }

  async createVendorCalendarAccount(account: InsertVendorCalendarAccount): Promise<VendorCalendarAccount> {
    const newAccount: VendorCalendarAccount = {
      id: randomUUID(),
      ...account,
      label: account.label ?? null,
      status: account.status ?? 'pending',
      lastSyncedAt: null,
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.vendorCalendarAccounts.set(newAccount.id, newAccount);
    return newAccount;
  }

  async updateVendorCalendarAccount(id: string, account: Partial<InsertVendorCalendarAccount>): Promise<VendorCalendarAccount | undefined> {
    const existing = this.vendorCalendarAccounts.get(id);
    if (!existing) return undefined;
    const updated: VendorCalendarAccount = {
      ...existing,
      ...account,
      updatedAt: new Date(),
    };
    this.vendorCalendarAccounts.set(id, updated);
    return updated;
  }

  async deleteVendorCalendarAccount(id: string): Promise<boolean> {
    return this.vendorCalendarAccounts.delete(id);
  }

  // Vendor Calendars
  async getVendorCalendar(id: string): Promise<VendorCalendar | undefined> {
    return this.vendorCalendars.get(id);
  }

  async getCalendarsByAccount(accountId: string): Promise<VendorCalendar[]> {
    return Array.from(this.vendorCalendars.values())
      .filter(c => c.accountId === accountId);
  }

  async getCalendarsByVendor(vendorId: string): Promise<VendorCalendar[]> {
    return Array.from(this.vendorCalendars.values())
      .filter(c => c.vendorId === vendorId);
  }

  async getSelectedCalendarsByVendor(vendorId: string): Promise<VendorCalendar[]> {
    return Array.from(this.vendorCalendars.values())
      .filter(c => c.vendorId === vendorId && c.isSelected);
  }

  async getWriteTargetCalendar(vendorId: string): Promise<VendorCalendar | undefined> {
    return Array.from(this.vendorCalendars.values())
      .find(c => c.vendorId === vendorId && c.isWriteTarget);
  }

  async createVendorCalendar(calendar: InsertVendorCalendar): Promise<VendorCalendar> {
    const newCalendar: VendorCalendar = {
      id: randomUUID(),
      ...calendar,
      color: calendar.color ?? null,
      isPrimary: calendar.isPrimary ?? false,
      isSelected: calendar.isSelected ?? true,
      isWriteTarget: calendar.isWriteTarget ?? false,
      syncDirection: calendar.syncDirection ?? 'read',
      lastSyncedAt: null,
      createdAt: new Date(),
    };
    this.vendorCalendars.set(newCalendar.id, newCalendar);
    return newCalendar;
  }

  async updateVendorCalendar(id: string, calendar: Partial<InsertVendorCalendar>): Promise<VendorCalendar | undefined> {
    const existing = this.vendorCalendars.get(id);
    if (!existing) return undefined;
    const updated: VendorCalendar = {
      ...existing,
      ...calendar,
    };
    this.vendorCalendars.set(id, updated);
    return updated;
  }

  async deleteVendorCalendar(id: string): Promise<boolean> {
    return this.vendorCalendars.delete(id);
  }

  async deleteCalendarsByAccount(accountId: string): Promise<boolean> {
    const calendars = await this.getCalendarsByAccount(accountId);
    for (const cal of calendars) {
      this.vendorCalendars.delete(cal.id);
    }
    return true;
  }

  // Contract Signatures
  async getContractSignature(id: string): Promise<ContractSignature | undefined> {
    // Not implemented for MemStorage - would need a Map
    return undefined;
  }

  async getSignaturesByContract(contractId: string): Promise<ContractSignature[]> {
    // Not implemented for MemStorage - would need a Map
    return [];
  }

  async createContractSignature(signature: InsertContractSignature): Promise<ContractSignature> {
    // Not implemented for MemStorage - would need a Map
    throw new Error("Contract signatures not supported in MemStorage");
  }

  async hasContractBeenSigned(contractId: string, signerId: string): Promise<boolean> {
    // Not implemented for MemStorage - would need a Map
    return false;
  }

  // Contract Documents - Not implemented for MemStorage
  async getContractDocument(id: string): Promise<ContractDocument | undefined> {
    return undefined;
  }
  async getDocumentsByContract(contractId: string): Promise<ContractDocument[]> {
    return [];
  }
  async createContractDocument(document: InsertContractDocument): Promise<ContractDocument> {
    throw new Error("Contract documents not supported in MemStorage");
  }
  async updateContractDocument(id: string, document: Partial<InsertContractDocument>): Promise<ContractDocument | undefined> {
    return undefined;
  }
  async deleteContractDocument(id: string): Promise<boolean> {
    return false;
  }

  // Contract Payments - Not implemented for MemStorage
  async getContractPayment(id: string): Promise<ContractPayment | undefined> {
    return undefined;
  }
  async getPaymentsByContract(contractId: string): Promise<ContractPayment[]> {
    return [];
  }
  async createContractPayment(payment: InsertContractPayment): Promise<ContractPayment> {
    throw new Error("Contract payments not supported in MemStorage");
  }
  async updateContractPayment(id: string, payment: Partial<InsertContractPayment>): Promise<ContractPayment | undefined> {
    return undefined;
  }
  async deleteContractPayment(id: string): Promise<boolean> {
    return false;
  }
  async getTotalPaidForContract(contractId: string): Promise<number> {
    return 0;
  }

  // Vendor Analytics
  async getVendorAnalyticsSummary(vendorId: string): Promise<{
    totalBookings: number;
    confirmedBookings: number;
    totalRevenue: string;
    averageBookingValue: string;
    averageRating: string;
    totalReviews: number;
    conversionRate: string;
  }> {
    const bookings = await this.getBookingsByVendor(vendorId);
    const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
    const totalBookings = activeBookings.length;
    const confirmedBookings = activeBookings.filter(b => b.status === 'confirmed').length;
    
    const confirmedWithCost = bookings.filter(b => 
      b.status === 'confirmed' && b.estimatedCost !== null && b.estimatedCost !== ''
    );
    const totalRevenue = confirmedWithCost.reduce((sum, b) => 
      sum + parseFloat(b.estimatedCost!), 0
    );
    const averageBookingValue = confirmedWithCost.length > 0 
      ? totalRevenue / confirmedWithCost.length 
      : 0;

    const reviews = await this.getReviewsByVendor(vendorId);
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    const conversionRate = totalBookings > 0 
      ? (confirmedBookings / totalBookings * 100) 
      : 0;

    return {
      totalBookings,
      confirmedBookings,
      totalRevenue: totalRevenue.toFixed(2),
      averageBookingValue: averageBookingValue.toFixed(2),
      averageRating: averageRating.toFixed(1),
      totalReviews,
      conversionRate: conversionRate.toFixed(1),
    };
  }

  async getVendorBookingTrends(vendorId: string, startDate?: Date, endDate?: Date): Promise<Array<{
    date: string;
    bookings: number;
    confirmed: number;
  }>> {
    const bookings = await this.getBookingsByVendor(vendorId);
    let filteredBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
    
    if (startDate || endDate) {
      filteredBookings = filteredBookings.filter(b => {
        const bookingDate = new Date(b.requestDate);
        if (startDate && bookingDate < startDate) return false;
        if (endDate && bookingDate > endDate) return false;
        return true;
      });
    }

    const dateMap = new Map<string, { bookings: number; confirmed: number }>();
    filteredBookings.forEach(booking => {
      const dateStr = new Date(booking.requestDate).toISOString().split('T')[0];
      const existing = dateMap.get(dateStr) || { bookings: 0, confirmed: 0 };
      existing.bookings++;
      if (booking.status === 'confirmed') existing.confirmed++;
      dateMap.set(dateStr, existing);
    });

    return Array.from(dateMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getVendorRevenueTrends(vendorId: string, startDate?: Date, endDate?: Date): Promise<Array<{
    date: string;
    revenue: string;
  }>> {
    const bookings = await this.getBookingsByVendor(vendorId);
    let filteredBookings = bookings.filter(b => 
      b.status === 'confirmed' && b.estimatedCost !== null && b.estimatedCost !== ''
    );
    
    if (startDate || endDate) {
      filteredBookings = filteredBookings.filter(b => {
        const bookingDate = b.confirmedDate ? new Date(b.confirmedDate) : new Date(b.requestDate);
        if (startDate && bookingDate < startDate) return false;
        if (endDate && bookingDate > endDate) return false;
        return true;
      });
    }

    const dateMap = new Map<string, number>();
    filteredBookings.forEach(booking => {
      if (booking.estimatedCost) {
        const dateStr = booking.confirmedDate 
          ? new Date(booking.confirmedDate).toISOString().split('T')[0]
          : new Date(booking.requestDate).toISOString().split('T')[0];
        const existing = dateMap.get(dateStr) || 0;
        const cost = parseFloat(booking.estimatedCost);
        if (!isNaN(cost)) {
          dateMap.set(dateStr, existing + cost);
        }
      }
    });

    return Array.from(dateMap.entries())
      .map(([date, revenue]) => ({ date, revenue: revenue.toFixed(2) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Couple Analytics
  async getWeddingAnalyticsSummary(weddingId: string): Promise<{
    totalBudget: string;
    totalSpent: string;
    remainingBudget: string;
    budgetUtilization: string;
    totalVendors: number;
    confirmedVendors: number;
    totalGuests: number;
    confirmedGuests: number;
    totalTasks: number;
    completedTasks: number;
    taskCompletionRate: string;
    totalEvents: number;
  }> {
    const wedding = await this.getWedding(weddingId);
    const totalBudget = wedding?.totalBudget ? parseFloat(wedding.totalBudget) : 0;

    // Get total spent from expenses
    const expenses = await this.getExpensesByWedding(weddingId);
    const totalSpent = expenses.reduce((sum, exp) => {
      const amount = exp.amount ? parseFloat(exp.amount) : 0;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    const remainingBudget = totalBudget - totalSpent;
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget * 100) : 0;

    const bookings = await this.getBookingsByWedding(weddingId);
    const totalVendors = bookings.length;
    const confirmedVendors = bookings.filter(b => b.status === 'confirmed').length;

    const guests = await this.getGuestsByWedding(weddingId);
    const totalGuests = guests.length;
    const confirmedGuests = guests.filter(g => g.rsvpStatus === 'attending').length;

    const tasks = await this.getTasksByWedding(weddingId);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed === true).length;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0;

    const events = await this.getEventsByWedding(weddingId);
    const totalEvents = events.length;

    return {
      totalBudget: totalBudget.toFixed(2),
      totalSpent: totalSpent.toFixed(2),
      remainingBudget: remainingBudget.toFixed(2),
      budgetUtilization: budgetUtilization.toFixed(1),
      totalVendors,
      confirmedVendors,
      totalGuests,
      confirmedGuests,
      totalTasks,
      completedTasks,
      taskCompletionRate: taskCompletionRate.toFixed(1),
      totalEvents,
    };
  }

  async getWeddingBudgetBreakdown(weddingId: string): Promise<Array<{
    category: string;
    allocated: string;
    spent: string;
    percentage: number;
  }>> {
    // Get budget allocations and expenses for the wedding
    const budgetAllocations = await this.getBudgetAllocationsByWedding(weddingId);
    const expenses = await this.getExpensesByWedding(weddingId);
    const allBucketCategories = await this.getAllBudgetBucketCategories();
    
    // Build a map of bucket category id to display name
    const bucketCategoryMap = new Map(allBucketCategories.map(c => [c.id, c.displayName]));
    
    // Calculate spent per bucket category
    const spentByBucket = new Map<string, number>();
    for (const exp of expenses) {
      if (exp.bucketCategoryId) {
        const current = spentByBucket.get(exp.bucketCategoryId) || 0;
        spentByBucket.set(exp.bucketCategoryId, current + (parseFloat(exp.amount) || 0));
      }
    }
    
    // Build breakdown from allocations
    const wedding = await this.getWedding(weddingId);
    const totalBudget = wedding?.totalBudget ? parseFloat(wedding.totalBudget) : 0;
    
    return budgetAllocations.map(alloc => {
      const allocated = alloc.allocatedAmount ? parseFloat(alloc.allocatedAmount) : 0;
      const spent = alloc.bucketCategoryId ? (spentByBucket.get(alloc.bucketCategoryId) || 0) : 0;
      const categoryName = alloc.bucketCategoryId ? (bucketCategoryMap.get(alloc.bucketCategoryId) || alloc.bucket || 'Unknown') : (alloc.bucket || 'Unknown');
      return {
        category: categoryName,
        allocated: (isNaN(allocated) ? 0 : allocated).toFixed(2),
        spent: (isNaN(spent) ? 0 : spent).toFixed(2),
        percentage: totalBudget > 0 ? Math.round((allocated / totalBudget) * 100) : 0,
      };
    });
  }

  async getWeddingSpendingTrends(weddingId: string): Promise<Array<{
    date: string;
    amount: string;
    category: string;
  }>> {
    const bookings = await this.getBookingsByWedding(weddingId);
    const trends = bookings
      .filter(b => b.status === 'confirmed' && b.estimatedCost !== null && b.confirmedDate !== null)
      .map(booking => {
        const vendor = this.vendors.get(booking.vendorId);
        const cost = parseFloat(booking.estimatedCost!);
        return {
          date: new Date(booking.confirmedDate!).toISOString().split('T')[0],
          amount: (isNaN(cost) ? 0 : cost).toFixed(2),
          category: vendor?.categories?.[0] || 'Unknown',
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return trends;
  }

  // Invitation Cards
  async getInvitationCard(id: string): Promise<InvitationCard | undefined> {
    // Not implemented for MemStorage
    return undefined;
  }

  async getAllInvitationCards(): Promise<InvitationCard[]> {
    // Not implemented for MemStorage
    return [];
  }

  async getInvitationCardsByTradition(tradition: string): Promise<InvitationCard[]> {
    // Not implemented for MemStorage
    return [];
  }

  async getInvitationCardsByCeremony(ceremonyType: string): Promise<InvitationCard[]> {
    // Not implemented for MemStorage
    return [];
  }

  async getFeaturedInvitationCards(): Promise<InvitationCard[]> {
    // Not implemented for MemStorage
    return [];
  }

  // Orders
  async getOrder(id: string): Promise<Order | undefined> {
    // Not implemented for MemStorage
    return undefined;
  }

  async getOrdersByWedding(weddingId: string): Promise<Order[]> {
    // Not implemented for MemStorage
    return [];
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    // Not implemented for MemStorage
    throw new Error("Orders not supported in MemStorage");
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    // Not implemented for MemStorage
    return undefined;
  }

  async updateOrderPaymentInfo(id: string, paymentIntentId: string, paymentStatus: string): Promise<Order | undefined> {
    // Not implemented for MemStorage
    return undefined;
  }

  // Order Items
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    // Not implemented for MemStorage
    return [];
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    // Not implemented for MemStorage
    throw new Error("Order items not supported in MemStorage");
  }

  // Measurement Profiles
  async getMeasurementProfile(id: string): Promise<MeasurementProfile | undefined> {
    return this.measurementProfiles.get(id);
  }

  async getMeasurementProfileByGuest(guestId: string): Promise<MeasurementProfile | undefined> {
    return Array.from(this.measurementProfiles.values()).find(
      (profile) => profile.guestId === guestId
    );
  }

  async getMeasurementProfilesByWedding(weddingId: string): Promise<MeasurementProfile[]> {
    // Get all guests for this wedding first
    const guests = await this.getGuestsByWedding(weddingId);
    const guestIds = new Set(guests.map(g => g.id));
    
    return Array.from(this.measurementProfiles.values()).filter(
      (profile) => guestIds.has(profile.guestId)
    );
  }

  async createMeasurementProfile(profile: InsertMeasurementProfile): Promise<MeasurementProfile> {
    const id = randomUUID();
    const newProfile: MeasurementProfile = {
      id,
      ...profile,
      blouseSize: profile.blouseSize ?? null,
      waist: profile.waist ?? null,
      inseam: profile.inseam ?? null,
      sariBlouseStyle: profile.sariBlouseStyle ?? null,
      notes: profile.notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.measurementProfiles.set(id, newProfile);
    return newProfile;
  }

  async updateMeasurementProfile(id: string, profile: Partial<InsertMeasurementProfile>): Promise<MeasurementProfile | undefined> {
    const existing = this.measurementProfiles.get(id);
    if (!existing) return undefined;

    const updated: MeasurementProfile = {
      ...existing,
      ...profile,
      updatedAt: new Date(),
    };
    this.measurementProfiles.set(id, updated);
    return updated;
  }

  async deleteMeasurementProfile(id: string): Promise<boolean> {
    return this.measurementProfiles.delete(id);
  }

  // Shopping Order Items
  async getShoppingOrderItem(id: string): Promise<ShoppingOrderItem | undefined> {
    return this.shoppingOrderItems.get(id);
  }

  async getShoppingOrderItemsByWedding(weddingId: string): Promise<ShoppingOrderItem[]> {
    return Array.from(this.shoppingOrderItems.values())
      .filter((item) => item.weddingId === weddingId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createShoppingOrderItem(item: InsertShoppingOrderItem): Promise<ShoppingOrderItem> {
    const id = randomUUID();
    
    // Calculate costUSD from costINR if provided (1 INR = 0.012 USD)
    let costUSD: string | null = null;
    if (item.costINR) {
      const inrAmount = parseFloat(item.costINR);
      if (!isNaN(inrAmount)) {
        costUSD = (inrAmount * 0.012).toFixed(2);
      }
    }

    const newItem: ShoppingOrderItem = {
      id,
      ...item,
      storeName: item.storeName ?? null,
      costINR: item.costINR ?? null,
      costUSD,
      weightKg: item.weightKg ?? null,
      notes: item.notes ?? null,
      status: item.status || 'ordered',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.shoppingOrderItems.set(id, newItem);
    return newItem;
  }

  async updateShoppingOrderItem(id: string, item: Partial<InsertShoppingOrderItem>): Promise<ShoppingOrderItem | undefined> {
    const existing = this.shoppingOrderItems.get(id);
    if (!existing) return undefined;

    // Recalculate costUSD if costINR is being updated
    let costUSD = existing.costUSD;
    if (item.costINR !== undefined) {
      if (item.costINR) {
        const inrAmount = parseFloat(item.costINR);
        if (!isNaN(inrAmount)) {
          costUSD = (inrAmount * 0.012).toFixed(2);
        }
      } else {
        costUSD = null;
      }
    }

    const updated: ShoppingOrderItem = {
      ...existing,
      ...item,
      costUSD,
      updatedAt: new Date(),
    };
    this.shoppingOrderItems.set(id, updated);
    return updated;
  }

  async deleteShoppingOrderItem(id: string): Promise<boolean> {
    return this.shoppingOrderItems.delete(id);
  }

  // Gap Windows - MemStorage stubs (not fully implemented, use DBStorage)
  async getGapWindow(id: string): Promise<GapWindow | undefined> {
    throw new Error("MemStorage does not support Gap Windows. Use DBStorage.");
  }
  async getGapWindowsByWedding(weddingId: string): Promise<GapWindow[]> {
    return [];
  }
  async createGapWindow(gap: InsertGapWindow): Promise<GapWindow> {
    throw new Error("MemStorage does not support Gap Windows. Use DBStorage.");
  }
  async updateGapWindow(id: string, gap: Partial<InsertGapWindow>): Promise<GapWindow | undefined> {
    throw new Error("MemStorage does not support Gap Windows. Use DBStorage.");
  }
  async deleteGapWindow(id: string): Promise<boolean> {
    return false;
  }
  async activateGapWindow(id: string, isActive: boolean): Promise<GapWindow | undefined> {
    throw new Error("MemStorage does not support Gap Windows. Use DBStorage.");
  }

  // Gap Recommendations - MemStorage stubs
  async getGapRecommendation(id: string): Promise<GapRecommendation | undefined> {
    throw new Error("MemStorage does not support Gap Recommendations. Use DBStorage.");
  }
  async getRecommendationsByGapWindow(gapWindowId: string): Promise<GapRecommendation[]> {
    return [];
  }
  async createGapRecommendation(rec: InsertGapRecommendation): Promise<GapRecommendation> {
    throw new Error("MemStorage does not support Gap Recommendations. Use DBStorage.");
  }
  async updateGapRecommendation(id: string, rec: Partial<InsertGapRecommendation>): Promise<GapRecommendation | undefined> {
    throw new Error("MemStorage does not support Gap Recommendations. Use DBStorage.");
  }
  async deleteGapRecommendation(id: string): Promise<boolean> {
    return false;
  }

  // Ritual Stages - MemStorage stubs
  async getRitualStage(id: string): Promise<RitualStage | undefined> {
    throw new Error("MemStorage does not support Ritual Stages. Use DBStorage.");
  }
  async getRitualStagesByEvent(eventId: string): Promise<RitualStage[]> {
    return [];
  }
  async createRitualStage(stage: InsertRitualStage): Promise<RitualStage> {
    throw new Error("MemStorage does not support Ritual Stages. Use DBStorage.");
  }
  async updateRitualStage(id: string, stage: Partial<InsertRitualStage>): Promise<RitualStage | undefined> {
    throw new Error("MemStorage does not support Ritual Stages. Use DBStorage.");
  }
  async deleteRitualStage(id: string): Promise<boolean> {
    return false;
  }

  // Ritual Stage Updates - MemStorage stubs
  async getRitualStageUpdates(ritualStageId: string): Promise<RitualStageUpdate[]> {
    return [];
  }
  async getLatestRitualStageUpdate(ritualStageId: string): Promise<RitualStageUpdate | undefined> {
    return undefined;
  }
  async createRitualStageUpdate(update: InsertRitualStageUpdate): Promise<RitualStageUpdate> {
    throw new Error("MemStorage does not support Ritual Stage Updates. Use DBStorage.");
  }

  // Guest Notifications - MemStorage stubs
  async getGuestNotification(id: string): Promise<GuestNotification | undefined> {
    throw new Error("MemStorage does not support Guest Notifications. Use DBStorage.");
  }
  async getNotificationsByWedding(weddingId: string): Promise<GuestNotification[]> {
    return [];
  }
  async createGuestNotification(notification: InsertGuestNotification): Promise<GuestNotification> {
    throw new Error("MemStorage does not support Guest Notifications. Use DBStorage.");
  }

  // Live Wedding Status - MemStorage stubs
  async getLiveWeddingStatus(weddingId: string): Promise<LiveWeddingStatus | undefined> {
    return undefined;
  }
  async createOrUpdateLiveWeddingStatus(status: InsertLiveWeddingStatus): Promise<LiveWeddingStatus> {
    throw new Error("MemStorage does not support Live Wedding Status. Use DBStorage.");
  }
  async updateLiveWeddingStatus(weddingId: string, updates: Partial<InsertLiveWeddingStatus>): Promise<LiveWeddingStatus | undefined> {
    throw new Error("MemStorage does not support Live Wedding Status. Use DBStorage.");
  }

  // Wedding Roles - MemStorage stubs
  async getWeddingRole(id: string): Promise<WeddingRole | undefined> {
    return undefined;
  }
  async getWeddingRoles(weddingId: string): Promise<WeddingRole[]> {
    return this.getWeddingRolesByWedding(weddingId);
  }
  async getWeddingRolesByWedding(weddingId: string): Promise<WeddingRole[]> {
    return [];
  }
  async getWeddingRoleWithPermissions(id: string): Promise<RoleWithPermissions | undefined> {
    return undefined;
  }
  async createWeddingRole(role: InsertWeddingRole): Promise<WeddingRole> {
    throw new Error("MemStorage does not support Wedding Roles. Use DBStorage.");
  }
  async updateWeddingRole(id: string, role: Partial<InsertWeddingRole>): Promise<WeddingRole | undefined> {
    throw new Error("MemStorage does not support Wedding Roles. Use DBStorage.");
  }
  async deleteWeddingRole(id: string): Promise<boolean> {
    return false;
  }
  async createDefaultRolesForWedding(weddingId: string): Promise<WeddingRole[]> {
    throw new Error("MemStorage does not support Wedding Roles. Use DBStorage.");
  }

  // Role Permissions - MemStorage stubs
  async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    return [];
  }
  async setRolePermission(roleId: string, category: PermissionCategory, level: PermissionLevel): Promise<RolePermission> {
    throw new Error("MemStorage does not support Role Permissions. Use DBStorage.");
  }
  async removeRolePermission(roleId: string, category: PermissionCategory): Promise<boolean> {
    return false;
  }
  async setRolePermissions(roleId: string, permissions: { category: PermissionCategory; level: PermissionLevel }[]): Promise<RolePermission[]> {
    throw new Error("MemStorage does not support Role Permissions. Use DBStorage.");
  }
  async deleteRolePermissions(roleId: string): Promise<void> {
    // No-op for MemStorage
  }

  // Wedding Collaborators - MemStorage stubs
  async getWeddingCollaborator(id: string): Promise<WeddingCollaborator | undefined> {
    return undefined;
  }
  async getWeddingCollaboratorByEmail(weddingId: string, email: string): Promise<WeddingCollaborator | undefined> {
    return undefined;
  }
  async isWeddingCollaborator(weddingId: string, email: string): Promise<boolean> {
    const collaborator = await this.getWeddingCollaboratorByEmail(weddingId, email);
    return !!collaborator && collaborator.status === 'active';
  }
  async getWeddingCollaboratorByToken(token: string): Promise<WeddingCollaborator | undefined> {
    return undefined;
  }
  async getWeddingCollaboratorsByWedding(weddingId: string): Promise<WeddingCollaborator[]> {
    return [];
  }
  async getWeddingCollaboratorWithDetails(id: string): Promise<CollaboratorWithDetails | undefined> {
    return undefined;
  }
  async getCollaboratorsWithDetailsByWedding(weddingId: string): Promise<CollaboratorWithDetails[]> {
    return [];
  }
  async getWeddingsByCollaboratorUser(userId: string): Promise<Wedding[]> {
    return [];
  }
  async createWeddingCollaborator(collaborator: InsertWeddingCollaborator): Promise<WeddingCollaborator> {
    throw new Error("MemStorage does not support Wedding Collaborators. Use DBStorage.");
  }
  async updateWeddingCollaborator(id: string, updates: Partial<InsertWeddingCollaborator>): Promise<WeddingCollaborator | undefined> {
    throw new Error("MemStorage does not support Wedding Collaborators. Use DBStorage.");
  }
  async deleteWeddingCollaborator(id: string): Promise<boolean> {
    return false;
  }
  async generateCollaboratorInviteToken(collaboratorId: string, expiresInDays?: number): Promise<string> {
    throw new Error("MemStorage does not support Wedding Collaborators. Use DBStorage.");
  }
  async acceptCollaboratorInvite(token: string, userId: string): Promise<WeddingCollaborator | undefined> {
    throw new Error("MemStorage does not support Wedding Collaborators. Use DBStorage.");
  }
  async revokeCollaboratorInvite(id: string): Promise<boolean> {
    return false;
  }

  // Collaborator Activity Log - MemStorage stubs
  async logCollaboratorActivity(log: InsertCollaboratorActivityLog): Promise<CollaboratorActivityLog> {
    throw new Error("MemStorage does not support Collaborator Activity Log. Use DBStorage.");
  }
  async getCollaboratorActivityLog(weddingId: string, limit?: number): Promise<CollaboratorActivityLog[]> {
    return [];
  }

  // Permission Checking - MemStorage stubs
  async getUserPermissionsForWedding(userId: string, weddingId: string): Promise<{ isOwner: boolean; permissions: Map<PermissionCategory, PermissionLevel> }> {
    return { isOwner: true, permissions: new Map() }; // Default to owner for MemStorage
  }
  async checkUserPermission(userId: string, weddingId: string, category: PermissionCategory, requiredLevel: PermissionLevel): Promise<boolean> {
    return true; // Default to allowed for MemStorage
  }

  // Guest Sources - MemStorage stubs
  async getGuestSource(id: string): Promise<GuestSource | undefined> {
    return undefined;
  }
  async getGuestSourcesByWedding(weddingId: string): Promise<GuestSource[]> {
    return [];
  }
  async createGuestSource(source: InsertGuestSource): Promise<GuestSource> {
    throw new Error("MemStorage does not support Guest Sources. Use DBStorage.");
  }
  async updateGuestSource(id: string, source: Partial<InsertGuestSource>): Promise<GuestSource | undefined> {
    throw new Error("MemStorage does not support Guest Sources. Use DBStorage.");
  }
  async deleteGuestSource(id: string): Promise<boolean> {
    return false;
  }
  async getGuestSourceStats(weddingId: string): Promise<{ sourceId: string; count: number; seats: number }[]> {
    return [];
  }

  // Guest List Scenarios - MemStorage stubs
  async getGuestListScenario(id: string): Promise<GuestListScenario | undefined> {
    return undefined;
  }
  async getGuestListScenarioWithStats(id: string): Promise<ScenarioWithStats | undefined> {
    return undefined;
  }
  async getGuestListScenariosByWedding(weddingId: string): Promise<ScenarioWithStats[]> {
    return [];
  }
  async createGuestListScenario(scenario: InsertGuestListScenario): Promise<GuestListScenario> {
    throw new Error("MemStorage does not support Guest List Scenarios. Use DBStorage.");
  }
  async updateGuestListScenario(id: string, scenario: Partial<InsertGuestListScenario>): Promise<GuestListScenario | undefined> {
    throw new Error("MemStorage does not support Guest List Scenarios. Use DBStorage.");
  }
  async deleteGuestListScenario(id: string): Promise<boolean> {
    return false;
  }
  async setActiveScenario(weddingId: string, scenarioId: string): Promise<GuestListScenario> {
    throw new Error("MemStorage does not support Guest List Scenarios. Use DBStorage.");
  }
  async duplicateScenario(id: string, newName: string, userId: string): Promise<GuestListScenario> {
    throw new Error("MemStorage does not support Guest List Scenarios. Use DBStorage.");
  }
  async promoteScenarioToMain(id: string): Promise<boolean> {
    return false;
  }

  // Scenario Households - MemStorage stubs
  async getScenarioHouseholds(scenarioId: string): Promise<(ScenarioHousehold & { household: Household })[]> {
    return [];
  }
  async addHouseholdToScenario(scenarioId: string, householdId: string, adjustedMaxCount?: number): Promise<ScenarioHousehold> {
    throw new Error("MemStorage does not support Scenario Households. Use DBStorage.");
  }
  async removeHouseholdFromScenario(scenarioId: string, householdId: string): Promise<boolean> {
    return false;
  }
  async updateScenarioHousehold(id: string, updates: Partial<InsertScenarioHousehold>): Promise<ScenarioHousehold | undefined> {
    throw new Error("MemStorage does not support Scenario Households. Use DBStorage.");
  }
  async copyAllHouseholdsToScenario(scenarioId: string, weddingId: string): Promise<number> {
    return 0;
  }

  // Guest Budget Settings - MemStorage stubs
  async getGuestBudgetSettings(weddingId: string): Promise<GuestBudgetSettings | undefined> {
    return undefined;
  }
  async createOrUpdateGuestBudgetSettings(settings: InsertGuestBudgetSettings): Promise<GuestBudgetSettings> {
    throw new Error("MemStorage does not support Guest Budget Settings. Use DBStorage.");
  }
  async calculateBudgetCapacity(weddingId: string): Promise<{ maxGuests: number; currentCount: number; costPerHead: number; totalBudget: number; remainingBudget: number }> {
    return { maxGuests: 0, currentCount: 0, costPerHead: 150, totalBudget: 0, remainingBudget: 0 };
  }

  async getGuestPlanningSnapshot(weddingId: string): Promise<GuestPlanningSnapshot> {
    throw new Error("MemStorage does not support Guest Planning Snapshot. Use DBStorage.");
  }

  // ============================================================================
  // REAL-TIME MASTER TIMELINE - MemStorage stubs
  // ============================================================================

  // Vendor Event Tags
  async getVendorEventTag(id: string): Promise<VendorEventTag | undefined> {
    return undefined;
  }
  async getVendorEventTagsByEvent(eventId: string): Promise<VendorEventTagWithVendor[]> {
    return [];
  }
  async getVendorEventTagsByWedding(weddingId: string): Promise<VendorEventTagWithVendor[]> {
    return [];
  }
  async getVendorEventTagsByVendor(vendorId: string): Promise<VendorEventTag[]> {
    return [];
  }
  async createVendorEventTag(tag: InsertVendorEventTag): Promise<VendorEventTag> {
    throw new Error("MemStorage does not support Vendor Event Tags. Use DBStorage.");
  }
  async deleteVendorEventTag(id: string): Promise<boolean> {
    return false;
  }
  async deleteVendorEventTagsByEvent(eventId: string): Promise<boolean> {
    return false;
  }
  async tagVendorsToEvent(eventId: string, weddingId: string, vendorIds: string[], notifyVia?: string): Promise<VendorEventTag[]> {
    throw new Error("MemStorage does not support Vendor Event Tags. Use DBStorage.");
  }

  // Timeline Changes
  async getTimelineChange(id: string): Promise<TimelineChange | undefined> {
    return undefined;
  }
  async getTimelineChangesByEvent(eventId: string): Promise<TimelineChange[]> {
    return [];
  }
  async getTimelineChangesByWedding(weddingId: string): Promise<TimelineChangeWithAcks[]> {
    return [];
  }
  async getRecentTimelineChanges(weddingId: string, limit?: number): Promise<TimelineChangeWithAcks[]> {
    return [];
  }
  async createTimelineChange(change: InsertTimelineChange): Promise<TimelineChange> {
    throw new Error("MemStorage does not support Timeline Changes. Use DBStorage.");
  }
  async markNotificationsSent(changeId: string): Promise<TimelineChange | undefined> {
    throw new Error("MemStorage does not support Timeline Changes. Use DBStorage.");
  }

  // Vendor Acknowledgments
  async getVendorAcknowledgment(id: string): Promise<VendorAcknowledgment | undefined> {
    return undefined;
  }
  async getAcknowledgmentsByChange(changeId: string): Promise<VendorAcknowledgmentWithDetails[]> {
    return [];
  }
  async getAcknowledgmentsByVendor(vendorId: string): Promise<VendorAcknowledgment[]> {
    return [];
  }
  async getPendingAcknowledgmentsForVendor(vendorId: string): Promise<VendorAcknowledgmentWithDetails[]> {
    return [];
  }
  async createVendorAcknowledgment(ack: InsertVendorAcknowledgment): Promise<VendorAcknowledgment> {
    throw new Error("MemStorage does not support Vendor Acknowledgments. Use DBStorage.");
  }
  async acknowledgeChange(changeId: string, vendorId: string, status: 'acknowledged' | 'declined', message?: string): Promise<VendorAcknowledgment> {
    throw new Error("MemStorage does not support Vendor Acknowledgments. Use DBStorage.");
  }
  async getAcknowledgmentSummaryForEvent(eventId: string): Promise<{ pending: number; acknowledged: number; declined: number }> {
    return { pending: 0, acknowledged: 0, declined: 0 };
  }

  // Timeline utilities
  async reorderEvents(weddingId: string, orderedEventIds: string[], changedByUserId: string): Promise<Event[]> {
    throw new Error("MemStorage does not support Timeline reordering. Use DBStorage.");
  }
  async updateEventTime(eventId: string, newTime: string, changedByUserId: string, note?: string): Promise<{ event: Event; change: TimelineChange; taggedVendors: Vendor[] }> {
    throw new Error("MemStorage does not support Timeline updates. Use DBStorage.");
  }
  async getTimelineWithAcknowledgments(weddingId: string): Promise<Array<Event & { tags: VendorEventTagWithVendor[]; pendingAcks: number; acknowledgedAcks: number }>> {
    return [];
  }

  // ============================================================================
  // VENDOR TEAMMATE MANAGEMENT - MemStorage stubs
  // ============================================================================

  async getVendorTeammate(id: string): Promise<VendorTeammate | undefined> {
    return undefined;
  }
  async getVendorTeammatesByVendor(vendorId: string): Promise<VendorTeammateWithUser[]> {
    return [];
  }
  async getVendorTeammateByUserAndVendor(userId: string, vendorId: string): Promise<VendorTeammate | undefined> {
    return undefined;
  }
  async getVendorsByTeammate(userId: string): Promise<Vendor[]> {
    return [];
  }
  async createVendorTeammate(teammate: InsertVendorTeammate): Promise<VendorTeammate> {
    throw new Error("MemStorage does not support Vendor Teammates. Use DBStorage.");
  }
  async updateVendorTeammate(id: string, teammate: Partial<InsertVendorTeammate>): Promise<VendorTeammate | undefined> {
    throw new Error("MemStorage does not support Vendor Teammates. Use DBStorage.");
  }
  async revokeVendorTeammate(id: string, revokedBy: string): Promise<VendorTeammate | undefined> {
    throw new Error("MemStorage does not support Vendor Teammates. Use DBStorage.");
  }
  async getVendorTeammateInvitation(id: string): Promise<VendorTeammateInvitation | undefined> {
    return undefined;
  }
  async getVendorTeammateInvitationByToken(token: string): Promise<VendorTeammateInvitation | undefined> {
    return undefined;
  }
  async getVendorTeammateInvitationsByVendor(vendorId: string): Promise<VendorTeammateInvitation[]> {
    return [];
  }
  async createVendorTeammateInvitation(invitation: InsertVendorTeammateInvitation & { inviteToken: string; inviteTokenExpires: Date }): Promise<VendorTeammateInvitation> {
    throw new Error("MemStorage does not support Vendor Teammate Invitations. Use DBStorage.");
  }
  async acceptVendorTeammateInvitation(token: string, userId: string): Promise<{ teammate: VendorTeammate; invitation: VendorTeammateInvitation }> {
    throw new Error("MemStorage does not support Vendor Teammate Invitations. Use DBStorage.");
  }
  async revokeVendorTeammateInvitation(id: string): Promise<VendorTeammateInvitation | undefined> {
    throw new Error("MemStorage does not support Vendor Teammate Invitations. Use DBStorage.");
  }
  async hasVendorTeammateAccess(userId: string, vendorId: string, requiredPermission?: string): Promise<boolean> {
    return false;
  }

  // Quote Requests (stubs)
  async createQuoteRequest(quoteRequest: InsertQuoteRequest): Promise<QuoteRequest> {
    throw new Error("MemStorage does not support Quote Requests. Use DBStorage.");
  }
  async getQuoteRequestsByVendor(vendorId: string): Promise<QuoteRequest[]> {
    return [];
  }
  async getQuoteRequestsByWedding(weddingId: string): Promise<QuoteRequest[]> {
    return [];
  }
  async updateQuoteRequestStatus(id: string, status: string): Promise<QuoteRequest | undefined> {
    throw new Error("MemStorage does not support Quote Requests. Use DBStorage.");
  }
  
  // Vendor Leads (stubs)
  async getVendorLead(id: string): Promise<VendorLead | undefined> { return undefined; }
  async getVendorLeadsByVendor(vendorId: string): Promise<VendorLead[]> { return []; }
  async getVendorLeadByWeddingAndVendor(weddingId: string, vendorId: string): Promise<VendorLead | undefined> { return undefined; }
  async createVendorLead(lead: InsertVendorLead): Promise<VendorLead> { throw new Error("MemStorage does not support Vendor Leads. Use DBStorage."); }
  async updateVendorLead(id: string, lead: Partial<InsertVendorLead>): Promise<VendorLead | undefined> { throw new Error("MemStorage does not support Vendor Leads. Use DBStorage."); }
  async deleteVendorLead(id: string): Promise<boolean> { return false; }
  
  // Lead Nurture Sequences (stubs)
  async getLeadNurtureSequence(id: string): Promise<LeadNurtureSequence | undefined> { return undefined; }
  async getLeadNurtureSequencesByVendor(vendorId: string): Promise<LeadNurtureSequence[]> { return []; }
  async getDefaultNurtureSequence(vendorId: string): Promise<LeadNurtureSequence | undefined> { return undefined; }
  async createLeadNurtureSequence(sequence: InsertLeadNurtureSequence): Promise<LeadNurtureSequence> { throw new Error("MemStorage does not support Lead Nurture Sequences. Use DBStorage."); }
  async updateLeadNurtureSequence(id: string, sequence: Partial<InsertLeadNurtureSequence>): Promise<LeadNurtureSequence | undefined> { throw new Error("MemStorage does not support Lead Nurture Sequences. Use DBStorage."); }
  async deleteLeadNurtureSequence(id: string): Promise<boolean> { return false; }
  
  // Lead Nurture Steps (stubs)
  async getLeadNurtureStep(id: string): Promise<LeadNurtureStep | undefined> { return undefined; }
  async getLeadNurtureStepsBySequence(sequenceId: string): Promise<LeadNurtureStep[]> { return []; }
  async createLeadNurtureStep(step: InsertLeadNurtureStep): Promise<LeadNurtureStep> { throw new Error("MemStorage does not support Lead Nurture Steps. Use DBStorage."); }
  async updateLeadNurtureStep(id: string, step: Partial<InsertLeadNurtureStep>): Promise<LeadNurtureStep | undefined> { throw new Error("MemStorage does not support Lead Nurture Steps. Use DBStorage."); }
  async deleteLeadNurtureStep(id: string): Promise<boolean> { return false; }
  
  // Lead Nurture Actions (stubs)
  async getLeadNurtureAction(id: string): Promise<LeadNurtureAction | undefined> { return undefined; }
  async getLeadNurtureActionsByLead(leadId: string): Promise<LeadNurtureAction[]> { return []; }
  async getPendingNurtureActions(beforeDate: Date): Promise<LeadNurtureAction[]> { return []; }
  async createLeadNurtureAction(action: InsertLeadNurtureAction): Promise<LeadNurtureAction> { throw new Error("MemStorage does not support Lead Nurture Actions. Use DBStorage."); }
  async updateLeadNurtureAction(id: string, action: Partial<InsertLeadNurtureAction>): Promise<LeadNurtureAction | undefined> { throw new Error("MemStorage does not support Lead Nurture Actions. Use DBStorage."); }
  
  // Lead Activity Log (stubs)
  async getLeadActivityLog(leadId: string): Promise<LeadActivityLog[]> { return []; }
  async createLeadActivityLog(activity: InsertLeadActivityLog): Promise<LeadActivityLog> { throw new Error("MemStorage does not support Lead Activity Log. Use DBStorage."); }
  
  // Vendor Claim Staging (stubs)
  async getVendorClaimStaging(id: string): Promise<VendorClaimStaging | undefined> { return undefined; }
  async getVendorClaimStagingByVendor(vendorId: string): Promise<VendorClaimStaging[]> { return []; }
  async getAllPendingVendorClaims(): Promise<VendorClaimStaging[]> { return []; }
  async createVendorClaimStaging(claim: InsertVendorClaimStaging): Promise<VendorClaimStaging> { throw new Error("MemStorage does not support Vendor Claim Staging. Use DBStorage."); }
  async updateVendorClaimStaging(id: string, claim: Partial<VendorClaimStaging>): Promise<VendorClaimStaging | undefined> { throw new Error("MemStorage does not support Vendor Claim Staging. Use DBStorage."); }
  async deleteVendorClaimStaging(id: string): Promise<boolean> { return false; }

  // Vendor Approval (stubs)
  async getPendingApprovalVendors(): Promise<Vendor[]> { return []; }
  async approveVendor(id: string, adminId: string, notes?: string): Promise<Vendor | undefined> { throw new Error("MemStorage does not support Vendor Approval. Use DBStorage."); }
  async rejectVendor(id: string, adminId: string, notes?: string): Promise<Vendor | undefined> { throw new Error("MemStorage does not support Vendor Approval. Use DBStorage."); }
  async getApprovedVendors(): Promise<Vendor[]> { return Array.from(this.vendors.values()); }

  // Guest Collector Links (stubs)
  async getGuestCollectorLink(id: string): Promise<GuestCollectorLink | undefined> { return undefined; }
  async getGuestCollectorLinkByToken(token: string): Promise<GuestCollectorLink | undefined> { return undefined; }
  async getGuestCollectorLinksByWedding(weddingId: string): Promise<GuestCollectorLink[]> { return []; }
  async createGuestCollectorLink(link: InsertGuestCollectorLink): Promise<GuestCollectorLink> { throw new Error("MemStorage does not support Guest Collector Links. Use DBStorage."); }
  async updateGuestCollectorLink(id: string, updates: Partial<InsertGuestCollectorLink>): Promise<GuestCollectorLink | undefined> { throw new Error("MemStorage does not support Guest Collector Links. Use DBStorage."); }
  async deleteGuestCollectorLink(id: string): Promise<boolean> { return false; }
  async deactivateGuestCollectorLink(id: string): Promise<GuestCollectorLink | undefined> { throw new Error("MemStorage does not support Guest Collector Links. Use DBStorage."); }

  // Guest Collector Submissions (stubs)
  async getGuestCollectorSubmission(id: string): Promise<GuestCollectorSubmission | undefined> { return undefined; }
  async getGuestCollectorSubmissionsByLink(linkId: string): Promise<GuestCollectorSubmission[]> { return []; }
  async getGuestCollectorSubmissionsByWedding(weddingId: string, status?: string): Promise<GuestCollectorSubmission[]> { return []; }
  async createGuestCollectorSubmission(submission: InsertGuestCollectorSubmission): Promise<GuestCollectorSubmission> { throw new Error("MemStorage does not support Guest Collector Submissions. Use DBStorage."); }
  async approveCollectorSubmission(id: string, reviewerId: string): Promise<{ household: Household; guests: Guest[] }> { throw new Error("MemStorage does not support Guest Collector Submissions. Use DBStorage."); }
  async declineCollectorSubmission(id: string, reviewerId: string): Promise<GuestCollectorSubmission> { throw new Error("MemStorage does not support Guest Collector Submissions. Use DBStorage."); }
  async markCollectorSubmissionMaybe(id: string, reviewerId: string): Promise<GuestCollectorSubmission> { throw new Error("MemStorage does not support Guest Collector Submissions. Use DBStorage."); }
  async restoreCollectorSubmission(id: string, targetStatus: 'pending' | 'maybe' | 'approved', reviewerId: string): Promise<GuestCollectorSubmission | { household: Household; guests: Guest[] }> { throw new Error("MemStorage does not support Guest Collector Submissions. Use DBStorage."); }
  async getPendingCollectorSubmissionsCount(weddingId: string): Promise<number> { return 0; }
  async getCollectorSubmissionsBySession(linkId: string, sessionId: string): Promise<GuestCollectorSubmission[]> { return []; }

  // Guest Side Management (stubs)
  async getGuestsBySide(weddingId: string, side: 'bride' | 'groom' | 'mutual'): Promise<Guest[]> { return []; }
  async getGuestsByVisibility(weddingId: string, visibility: 'private' | 'shared', addedBySide?: 'bride' | 'groom'): Promise<Guest[]> { return []; }
  async shareGuestsWithPartner(weddingId: string, guestIds: string[]): Promise<Guest[]> { return []; }
  async updateGuestConsensusStatus(guestIds: string[], status: 'pending' | 'under_discussion' | 'approved' | 'declined' | 'frozen'): Promise<Guest[]> { return []; }
  async getSideStatistics(weddingId: string): Promise<{ bride: { total: number; private: number; shared: number; byStatus: Record<string, number> }; groom: { total: number; private: number; shared: number; byStatus: Record<string, number> }; mutual: { total: number } }> { 
    return { bride: { total: 0, private: 0, shared: 0, byStatus: {} }, groom: { total: 0, private: 0, shared: 0, byStatus: {} }, mutual: { total: 0 } }; 
  }

  // Guest Communications (stubs)
  async getGuestCommunication(id: string): Promise<GuestCommunication | undefined> { return undefined; }
  async getGuestCommunicationsByWedding(weddingId: string): Promise<GuestCommunication[]> { return []; }
  async createGuestCommunication(comm: InsertGuestCommunication): Promise<GuestCommunication> { throw new Error("MemStorage does not support Guest Communications. Use DBStorage."); }
  async updateGuestCommunication(id: string, updates: Partial<GuestCommunication>): Promise<GuestCommunication | undefined> { throw new Error("MemStorage does not support Guest Communications. Use DBStorage."); }
  async deleteGuestCommunication(id: string): Promise<boolean> { return false; }
  
  // Communication Recipients (stubs)
  async getCommunicationRecipient(id: string): Promise<CommunicationRecipient | undefined> { return undefined; }
  async getCommunicationRecipientsByCommunication(communicationId: string): Promise<CommunicationRecipient[]> { return []; }
  async createCommunicationRecipient(recipient: InsertCommunicationRecipient): Promise<CommunicationRecipient> { throw new Error("MemStorage does not support Communication Recipients. Use DBStorage."); }
  async createCommunicationRecipientsBulk(recipients: InsertCommunicationRecipient[]): Promise<CommunicationRecipient[]> { throw new Error("MemStorage does not support Communication Recipients. Use DBStorage."); }
  async updateCommunicationRecipient(id: string, updates: Partial<CommunicationRecipient>): Promise<CommunicationRecipient | undefined> { throw new Error("MemStorage does not support Communication Recipients. Use DBStorage."); }
  
  // RSVP Statistics (stubs)
  async getRsvpStatsByWedding(weddingId: string): Promise<{
    total: number;
    attending: number;
    notAttending: number;
    pending: number;
    byEvent: Array<{
      eventId: string;
      eventName: string;
      attending: number;
      notAttending: number;
      pending: number;
    }>;
  }> { return { total: 0, attending: 0, notAttending: 0, pending: 0, byEvent: [] }; }

  // Duplicate Detection stubs
  async detectDuplicateHouseholds(weddingId: string): Promise<Array<{
    household1: Household;
    household2: Household;
    guests1: Guest[];
    guests2: Guest[];
    confidence: number;
    matchReasons: string[];
  }>> { return []; }
  async mergeHouseholds(survivorId: string, mergedId: string, decision: 'kept_older' | 'kept_newer', reviewerId: string): Promise<HouseholdMergeAudit> { throw new Error('Not implemented'); }
  async getHouseholdMergeAudits(weddingId: string): Promise<HouseholdMergeAudit[]> { return []; }
  async ignoreHouseholdDuplicatePair(weddingId: string, householdId1: string, householdId2: string, ignoredById: string): Promise<IgnoredDuplicatePair> { throw new Error('Not implemented'); }
  async getIgnoredDuplicatePairs(weddingId: string): Promise<IgnoredDuplicatePair[]> { return []; }

  // Ceremony Types (stubs - use DBStorage for production)
  async getCeremonyType(ceremonyId: string): Promise<CeremonyType | undefined> { return undefined; }
  async getCeremonyTypesByTradition(tradition: string): Promise<CeremonyType[]> { return []; }
  async getCeremonyTypesByTraditionId(traditionId: string): Promise<CeremonyType[]> { return []; }
  async getAllCeremonyTypes(): Promise<CeremonyType[]> { return []; }
  async createCeremonyType(template: InsertCeremonyType): Promise<CeremonyType> { throw new Error('MemStorage does not support Ceremony Types. Use DBStorage.'); }
  async updateCeremonyType(ceremonyId: string, template: Partial<InsertCeremonyType>): Promise<CeremonyType | undefined> { throw new Error('MemStorage does not support Ceremony Types. Use DBStorage.'); }
  async deleteCeremonyType(ceremonyId: string): Promise<boolean> { return false; }

  // Ceremony Budget Categories (stubs - use DBStorage for production)
  async getCeremonyBudgetCategoriesByCeremonyTypeId(ceremonyTypeId: string, weddingId?: string | null): Promise<CeremonyBudgetCategory[]> { return []; }
  async getCeremonyBudgetCategoriesByBucket(budgetBucketId: string): Promise<CeremonyBudgetCategory[]> { return []; }
  async getAllCeremonyBudgetCategories(): Promise<CeremonyBudgetCategory[]> { return []; }
  async getAllCeremonyBudgetCategoriesForWedding(weddingId: string): Promise<CeremonyBudgetCategory[]> { return []; }
  async getCeremonyBudgetCategory(id: string): Promise<CeremonyBudgetCategory | undefined> { return undefined; }
  async createCeremonyBudgetCategory(item: InsertCeremonyBudgetCategory): Promise<CeremonyBudgetCategory> { throw new Error('MemStorage does not support Ceremony Budget Categories. Use DBStorage.'); }
  async updateCeremonyBudgetCategory(id: string, item: Partial<InsertCeremonyBudgetCategory>): Promise<CeremonyBudgetCategory | undefined> { throw new Error('MemStorage does not support Ceremony Budget Categories. Use DBStorage.'); }
  async deleteCeremonyBudgetCategory(id: string): Promise<boolean> { return false; }

  // Wedding Line Items (stubs - use DBStorage for production)
  async getWeddingLineItems(weddingId: string): Promise<WeddingLineItem[]> { return []; }
  async getWeddingLineItemsByCeremony(weddingId: string, ceremonyId: string): Promise<WeddingLineItem[]> { return []; }
  async getWeddingLineItem(id: string): Promise<WeddingLineItem | undefined> { return undefined; }
  async createWeddingLineItem(item: InsertWeddingLineItem): Promise<WeddingLineItem> { throw new Error('MemStorage does not support Wedding Line Items. Use DBStorage.'); }
  async updateWeddingLineItem(id: string, item: Partial<InsertWeddingLineItem>): Promise<WeddingLineItem | undefined> { throw new Error('MemStorage does not support Wedding Line Items. Use DBStorage.'); }
  async deleteWeddingLineItem(id: string): Promise<boolean> { return false; }
  async hydrateWeddingLineItemsFromTemplate(weddingId: string, ceremonyId: string, templateId: string): Promise<WeddingLineItem[]> { throw new Error('MemStorage does not support Wedding Line Items. Use DBStorage.'); }

  // Regional Pricing (stubs - use DBStorage for production)
  async getRegionalPricing(city: string): Promise<RegionalPricing | undefined> { return undefined; }
  async getAllRegionalPricing(): Promise<RegionalPricing[]> { return []; }
  async createRegionalPricing(pricing: InsertRegionalPricing): Promise<RegionalPricing> { throw new Error('MemStorage does not support Regional Pricing. Use DBStorage.'); }
  async updateRegionalPricing(city: string, pricing: Partial<InsertRegionalPricing>): Promise<RegionalPricing | undefined> { throw new Error('MemStorage does not support Regional Pricing. Use DBStorage.'); }

  // Budget Categories (stubs - use DBStorage for production)
  async getBudgetCategory(id: string): Promise<BudgetCategory | undefined> { return undefined; }
  async getBudgetCategoryBySlug(slug: string): Promise<BudgetCategory | undefined> { return undefined; }
  async getAllBudgetCategories(): Promise<BudgetCategory[]> { return []; }
  async getActiveBudgetCategories(): Promise<BudgetCategory[]> { return []; }
  async createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory> { throw new Error('MemStorage does not support Budget Categories. Use DBStorage.'); }
  async updateBudgetCategory(id: string, category: Partial<InsertBudgetCategory>): Promise<BudgetCategory | undefined> { throw new Error('MemStorage does not support Budget Categories. Use DBStorage.'); }
  async deleteBudgetCategory(id: string): Promise<boolean> { return false; }
  async seedBudgetCategories(): Promise<BudgetCategory[]> { throw new Error('MemStorage does not support Budget Categories. Use DBStorage.'); }

  // Wedding Traditions (stubs - use DBStorage for production)
  async getWeddingTradition(id: string): Promise<WeddingTradition | undefined> { return undefined; }
  async getWeddingTraditionBySlug(slug: string): Promise<WeddingTradition | undefined> { return undefined; }
  async getAllWeddingTraditions(): Promise<WeddingTradition[]> { return []; }
  async getActiveWeddingTraditions(): Promise<WeddingTradition[]> { return []; }
  async createWeddingTradition(tradition: InsertWeddingTradition): Promise<WeddingTradition> { throw new Error('MemStorage does not support Wedding Traditions. Use DBStorage.'); }
  async updateWeddingTradition(id: string, tradition: Partial<InsertWeddingTradition>): Promise<WeddingTradition | undefined> { throw new Error('MemStorage does not support Wedding Traditions. Use DBStorage.'); }
  async deleteWeddingTradition(id: string): Promise<boolean> { return false; }
  async seedWeddingTraditions(): Promise<WeddingTradition[]> { throw new Error('MemStorage does not support Wedding Traditions. Use DBStorage.'); }

  // Wedding Sub-Traditions (stubs - use DBStorage for production)
  async getWeddingSubTradition(id: string): Promise<WeddingSubTradition | undefined> { return undefined; }
  async getWeddingSubTraditionBySlug(slug: string): Promise<WeddingSubTradition | undefined> { return undefined; }
  async getWeddingSubTraditionsByTradition(traditionId: string): Promise<WeddingSubTradition[]> { return []; }
  async getAllWeddingSubTraditions(): Promise<WeddingSubTradition[]> { return []; }
  async getActiveWeddingSubTraditions(): Promise<WeddingSubTradition[]> { return []; }
  async createWeddingSubTradition(subTradition: InsertWeddingSubTradition): Promise<WeddingSubTradition> { throw new Error('MemStorage does not support Wedding Sub-Traditions. Use DBStorage.'); }
  async updateWeddingSubTradition(id: string, subTradition: Partial<InsertWeddingSubTradition>): Promise<WeddingSubTradition | undefined> { throw new Error('MemStorage does not support Wedding Sub-Traditions. Use DBStorage.'); }
  async deleteWeddingSubTradition(id: string): Promise<boolean> { return false; }
  async seedWeddingSubTraditions(): Promise<WeddingSubTradition[]> { throw new Error('MemStorage does not support Wedding Sub-Traditions. Use DBStorage.'); }

  // Vendor Categories (database-driven) - stub methods for MemStorage
  async getVendorCategory(id: string): Promise<VendorCategory | undefined> { return undefined; }
  async getVendorCategoryBySlug(slug: string): Promise<VendorCategory | undefined> { return undefined; }
  async getAllVendorCategories(): Promise<VendorCategory[]> { return []; }
  async getActiveVendorCategories(): Promise<VendorCategory[]> { return []; }
  async getVendorCategoriesByTradition(tradition: string): Promise<VendorCategory[]> { return []; }
  async createVendorCategory(category: InsertVendorCategory): Promise<VendorCategory> { throw new Error('MemStorage does not support Vendor Categories. Use DBStorage.'); }
  async updateVendorCategory(id: string, category: Partial<InsertVendorCategory>): Promise<VendorCategory | undefined> { throw new Error('MemStorage does not support Vendor Categories. Use DBStorage.'); }
  async deleteVendorCategory(id: string): Promise<boolean> { return false; }
  async seedVendorCategories(): Promise<VendorCategory[]> { throw new Error('MemStorage does not support Vendor Categories. Use DBStorage.'); }

  // Pricing Regions (database-driven) - stub methods for MemStorage
  async getPricingRegion(id: string): Promise<PricingRegion | undefined> { return undefined; }
  async getPricingRegionBySlug(slug: string): Promise<PricingRegion | undefined> { return undefined; }
  async getAllPricingRegions(): Promise<PricingRegion[]> { return []; }
  async getActivePricingRegions(): Promise<PricingRegion[]> { return []; }
  async createPricingRegion(region: InsertPricingRegion): Promise<PricingRegion> { throw new Error('MemStorage does not support Pricing Regions. Use DBStorage.'); }
  async updatePricingRegion(id: string, region: Partial<InsertPricingRegion>): Promise<PricingRegion | undefined> { throw new Error('MemStorage does not support Pricing Regions. Use DBStorage.'); }
  async deletePricingRegion(id: string): Promise<boolean> { return false; }
  async seedPricingRegions(): Promise<PricingRegion[]> { throw new Error('MemStorage does not support Pricing Regions. Use DBStorage.'); }

  // Metro Areas (database-driven) - stub methods for MemStorage
  async getMetroArea(id: string): Promise<MetroArea | undefined> { return undefined; }
  async getMetroAreaBySlug(slug: string): Promise<MetroArea | undefined> { return undefined; }
  async getMetroAreaByValue(value: string): Promise<MetroArea | undefined> { return undefined; }
  async getAllMetroAreas(): Promise<MetroArea[]> { return []; }
  async getActiveMetroAreas(): Promise<MetroArea[]> { return []; }
  async createMetroArea(area: InsertMetroArea): Promise<MetroArea> { throw new Error('MemStorage does not support Metro Areas. Use DBStorage.'); }
  async updateMetroArea(id: string, area: Partial<InsertMetroArea>): Promise<MetroArea | undefined> { throw new Error('MemStorage does not support Metro Areas. Use DBStorage.'); }
  async deleteMetroArea(id: string): Promise<boolean> { return false; }

  // Favour Categories (database-driven) - stub methods for MemStorage
  async getFavourCategory(id: string): Promise<FavourCategory | undefined> { return undefined; }
  async getFavourCategoryBySlug(slug: string): Promise<FavourCategory | undefined> { return undefined; }
  async getAllFavourCategories(): Promise<FavourCategory[]> { return []; }
  async getActiveFavourCategories(): Promise<FavourCategory[]> { return []; }
  async getFavourCategoriesByTradition(tradition: string): Promise<FavourCategory[]> { return []; }
  async createFavourCategory(category: InsertFavourCategory): Promise<FavourCategory> { throw new Error('MemStorage does not support Favour Categories. Use DBStorage.'); }
  async updateFavourCategory(id: string, category: Partial<InsertFavourCategory>): Promise<FavourCategory | undefined> { throw new Error('MemStorage does not support Favour Categories. Use DBStorage.'); }
  async deleteFavourCategory(id: string): Promise<boolean> { return false; }

  // Decor Categories (database-driven) - stub methods for MemStorage
  async getDecorCategory(id: string): Promise<DecorCategory | undefined> { return undefined; }
  async getDecorCategoryBySlug(slug: string): Promise<DecorCategory | undefined> { return undefined; }
  async getAllDecorCategories(): Promise<DecorCategory[]> { return []; }
  async getActiveDecorCategories(): Promise<DecorCategory[]> { return []; }
  async createDecorCategory(category: InsertDecorCategory): Promise<DecorCategory> { throw new Error('MemStorage does not support Decor Categories. Use DBStorage.'); }
  async updateDecorCategory(id: string, category: Partial<InsertDecorCategory>): Promise<DecorCategory | undefined> { throw new Error('MemStorage does not support Decor Categories. Use DBStorage.'); }
  async deleteDecorCategory(id: string): Promise<boolean> { return false; }

  // Decor Item Templates (database-driven) - stub methods for MemStorage
  async getDecorItemTemplate(id: string): Promise<DecorItemTemplate | undefined> { return undefined; }
  async getDecorItemTemplatesByCategory(categoryId: string): Promise<DecorItemTemplate[]> { return []; }
  async getDecorItemTemplatesByTradition(tradition: string): Promise<DecorItemTemplate[]> { return []; }
  async getAllDecorItemTemplates(): Promise<DecorItemTemplate[]> { return []; }
  async getActiveDecorItemTemplates(): Promise<DecorItemTemplate[]> { return []; }
  async createDecorItemTemplate(template: InsertDecorItemTemplate): Promise<DecorItemTemplate> { throw new Error('MemStorage does not support Decor Item Templates. Use DBStorage.'); }
  async updateDecorItemTemplate(id: string, template: Partial<InsertDecorItemTemplate>): Promise<DecorItemTemplate | undefined> { throw new Error('MemStorage does not support Decor Item Templates. Use DBStorage.'); }
  async deleteDecorItemTemplate(id: string): Promise<boolean> { return false; }

  // Honeymoon Budget Categories (database-driven) - stub methods for MemStorage
  async getHoneymoonBudgetCategory(id: string): Promise<HoneymoonBudgetCategory | undefined> { return undefined; }
  async getHoneymoonBudgetCategoryBySlug(slug: string): Promise<HoneymoonBudgetCategory | undefined> { return undefined; }
  async getAllHoneymoonBudgetCategories(): Promise<HoneymoonBudgetCategory[]> { return []; }
  async getActiveHoneymoonBudgetCategories(): Promise<HoneymoonBudgetCategory[]> { return []; }
  async createHoneymoonBudgetCategory(category: InsertHoneymoonBudgetCategory): Promise<HoneymoonBudgetCategory> { throw new Error('MemStorage does not support Honeymoon Budget Categories. Use DBStorage.'); }
  async updateHoneymoonBudgetCategory(id: string, category: Partial<InsertHoneymoonBudgetCategory>): Promise<HoneymoonBudgetCategory | undefined> { throw new Error('MemStorage does not support Honeymoon Budget Categories. Use DBStorage.'); }
  async deleteHoneymoonBudgetCategory(id: string): Promise<boolean> { return false; }

  // Dietary Options (database-driven) - stub methods for MemStorage
  async getDietaryOption(id: string): Promise<DietaryOption | undefined> { return undefined; }
  async getDietaryOptionBySlug(slug: string): Promise<DietaryOption | undefined> { return undefined; }
  async getAllDietaryOptions(): Promise<DietaryOption[]> { return []; }
  async getActiveDietaryOptions(): Promise<DietaryOption[]> { return []; }
  async getDietaryOptionsByTradition(tradition: string): Promise<DietaryOption[]> { return []; }
  async createDietaryOption(option: InsertDietaryOption): Promise<DietaryOption> { throw new Error('MemStorage does not support Dietary Options. Use DBStorage.'); }
  async updateDietaryOption(id: string, option: Partial<InsertDietaryOption>): Promise<DietaryOption | undefined> { throw new Error('MemStorage does not support Dietary Options. Use DBStorage.'); }
  async deleteDietaryOption(id: string): Promise<boolean> { return false; }

  // Milni Relation Options (database-driven) - stub methods for MemStorage
  async getMilniRelationOption(id: string): Promise<MilniRelationOption | undefined> { return undefined; }
  async getMilniRelationOptionBySlug(slug: string): Promise<MilniRelationOption | undefined> { return undefined; }
  async getAllMilniRelationOptions(): Promise<MilniRelationOption[]> { return []; }
  async getActiveMilniRelationOptions(): Promise<MilniRelationOption[]> { return []; }
  async getMilniRelationOptionsByTradition(tradition: string): Promise<MilniRelationOption[]> { return []; }
  async createMilniRelationOption(option: InsertMilniRelationOption): Promise<MilniRelationOption> { throw new Error('MemStorage does not support Milni Relation Options. Use DBStorage.'); }
  async updateMilniRelationOption(id: string, option: Partial<InsertMilniRelationOption>): Promise<MilniRelationOption | undefined> { throw new Error('MemStorage does not support Milni Relation Options. Use DBStorage.'); }
  async deleteMilniRelationOption(id: string): Promise<boolean> { return false; }

  // Milni Pair Templates (database-driven) - stub methods for MemStorage
  async getMilniPairTemplate(id: string): Promise<MilniPairTemplate | undefined> { return undefined; }
  async getAllMilniPairTemplates(): Promise<MilniPairTemplate[]> { return []; }
  async getActiveMilniPairTemplates(): Promise<MilniPairTemplate[]> { return []; }
  async getMilniPairTemplatesByTradition(tradition: string): Promise<MilniPairTemplate[]> { return []; }
  async createMilniPairTemplate(template: InsertMilniPairTemplate): Promise<MilniPairTemplate> { throw new Error('MemStorage does not support Milni Pair Templates. Use DBStorage.'); }
  async updateMilniPairTemplate(id: string, template: Partial<InsertMilniPairTemplate>): Promise<MilniPairTemplate | undefined> { throw new Error('MemStorage does not support Milni Pair Templates. Use DBStorage.'); }
  async deleteMilniPairTemplate(id: string): Promise<boolean> { return false; }

  // Timeline Templates (database-driven) - stub methods for MemStorage
  async getTimelineTemplate(id: string): Promise<TimelineTemplate | undefined> { return undefined; }
  async getAllTimelineTemplates(): Promise<TimelineTemplate[]> { return []; }
  async getActiveTimelineTemplates(): Promise<TimelineTemplate[]> { return []; }
  async getTimelineTemplatesByTradition(tradition: string): Promise<TimelineTemplate[]> { return []; }
  async createTimelineTemplate(template: InsertTimelineTemplate): Promise<TimelineTemplate> { throw new Error('MemStorage does not support Timeline Templates. Use DBStorage.'); }
  async updateTimelineTemplate(id: string, template: Partial<InsertTimelineTemplate>): Promise<TimelineTemplate | undefined> { throw new Error('MemStorage does not support Timeline Templates. Use DBStorage.'); }
  async deleteTimelineTemplate(id: string): Promise<boolean> { return false; }

  // Vendor Task Categories (database-driven) - stub methods for MemStorage
  async getVendorTaskCategory(id: string): Promise<VendorTaskCategory | undefined> { return undefined; }
  async getVendorTaskCategoryBySlug(slug: string): Promise<VendorTaskCategory | undefined> { return undefined; }
  async getAllVendorTaskCategories(): Promise<VendorTaskCategory[]> { return []; }
  async getActiveVendorTaskCategories(): Promise<VendorTaskCategory[]> { return []; }
  async getVendorTaskCategoriesByTradition(tradition: string): Promise<VendorTaskCategory[]> { return []; }
  async createVendorTaskCategory(category: InsertVendorTaskCategory): Promise<VendorTaskCategory> { throw new Error('MemStorage does not support Vendor Task Categories. Use DBStorage.'); }
  async updateVendorTaskCategory(id: string, category: Partial<InsertVendorTaskCategory>): Promise<VendorTaskCategory | undefined> { throw new Error('MemStorage does not support Vendor Task Categories. Use DBStorage.'); }
  async deleteVendorTaskCategory(id: string): Promise<boolean> { return false; }

  // User Feedback (stub methods for MemStorage)
  async getUserFeedback(id: string): Promise<UserFeedback | undefined> { return undefined; }
  async getAllUserFeedback(): Promise<UserFeedback[]> { return []; }
  async getUserFeedbackByStatus(status: string): Promise<UserFeedback[]> { return []; }
  async createUserFeedback(feedback: InsertUserFeedback): Promise<UserFeedback> { throw new Error('MemStorage does not support User Feedback. Use DBStorage.'); }
  async updateUserFeedback(id: string, updates: Partial<UserFeedback>): Promise<UserFeedback | undefined> { throw new Error('MemStorage does not support User Feedback. Use DBStorage.'); }

  // Admin - User Management (stub methods for MemStorage)
  async getAllUsersWithWeddings(): Promise<Array<{ user: User; wedding: Wedding | null }>> { return []; }
  async getUserWithWedding(userId: string): Promise<{ user: User; wedding: Wedding | null } | null> { return null; }

  // AI Chat Messages (stub methods for MemStorage)
  async getAiChatMessages(weddingId: string, userId: string): Promise<AiChatMessage[]> { return []; }
  async createAiChatMessage(message: InsertAiChatMessage): Promise<AiChatMessage> { throw new Error('MemStorage does not support AI Chat Messages. Use DBStorage.'); }
  async clearAiChatHistory(weddingId: string, userId: string): Promise<boolean> { return false; }

  // AI FAQ (stub methods for MemStorage)
  async getAllFaq(): Promise<AiFaq[]> { return []; }
  async getActiveFaq(): Promise<AiFaq[]> { return []; }
  async findFaqByNormalizedQuestion(normalizedQuestion: string): Promise<AiFaq | null> { return null; }
  async createFaq(faq: InsertAiFaq): Promise<AiFaq> { throw new Error('MemStorage does not support FAQ. Use DBStorage.'); }

  // Discovery Jobs (stub methods for MemStorage)
  async getDiscoveryJob(id: string): Promise<DiscoveryJob | undefined> { return undefined; }
  async getAllDiscoveryJobs(): Promise<DiscoveryJob[]> { return []; }
  async getActiveDiscoveryJobs(): Promise<DiscoveryJob[]> { return []; }
  async createDiscoveryJob(job: InsertDiscoveryJob): Promise<DiscoveryJob> { throw new Error('MemStorage does not support Discovery Jobs. Use DBStorage.'); }
  async updateDiscoveryJob(id: string, job: Partial<DiscoveryJob>): Promise<DiscoveryJob | undefined> { throw new Error('MemStorage does not support Discovery Jobs. Use DBStorage.'); }
  async deleteDiscoveryJob(id: string): Promise<boolean> { return false; }

  // Staged Vendors (stub methods for MemStorage)
  async getStagedVendor(id: string): Promise<StagedVendor | undefined> { return undefined; }
  async getStagedVendorsByJob(jobId: string): Promise<StagedVendor[]> { return []; }
  async getStagedVendorsByStatus(status: string): Promise<StagedVendor[]> { return []; }
  async getAllStagedVendors(): Promise<StagedVendor[]> { return []; }
  async createStagedVendor(vendor: InsertStagedVendor): Promise<StagedVendor> { throw new Error('MemStorage does not support Staged Vendors. Use DBStorage.'); }
  async updateStagedVendor(id: string, vendor: Partial<StagedVendor>): Promise<StagedVendor | undefined> { throw new Error('MemStorage does not support Staged Vendors. Use DBStorage.'); }
  async deleteStagedVendor(id: string): Promise<boolean> { return false; }

  // Live Polls (stub methods for MemStorage)
  async getPoll(id: string): Promise<Poll | undefined> { return undefined; }
  async getPollsByWedding(weddingId: string): Promise<Poll[]> { return []; }
  async getPollsByEvent(eventId: string): Promise<Poll[]> { return []; }
  async createPoll(poll: InsertPoll): Promise<Poll> { throw new Error('MemStorage does not support Polls. Use DBStorage.'); }
  async updatePoll(id: string, poll: Partial<Poll>): Promise<Poll | undefined> { throw new Error('MemStorage does not support Polls. Use DBStorage.'); }
  async deletePoll(id: string): Promise<boolean> { return false; }

  async getPollOption(id: string): Promise<PollOption | undefined> { return undefined; }
  async getPollOptionsByPoll(pollId: string): Promise<PollOption[]> { return []; }
  async createPollOption(option: InsertPollOption): Promise<PollOption> { throw new Error('MemStorage does not support Polls. Use DBStorage.'); }
  async updatePollOption(id: string, option: Partial<PollOption>): Promise<PollOption | undefined> { throw new Error('MemStorage does not support Polls. Use DBStorage.'); }
  async deletePollOption(id: string): Promise<boolean> { return false; }

  async getPollVotesByPoll(pollId: string): Promise<PollVote[]> { return []; }
  async getPollVotesByGuest(pollId: string, guestId: string): Promise<PollVote[]> { return []; }
  async createPollVote(vote: InsertPollVote): Promise<PollVote> { throw new Error('MemStorage does not support Polls. Use DBStorage.'); }
  async deletePollVotesByGuest(pollId: string, guestId: string): Promise<boolean> { return false; }
}

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, or, sql, inArray, isNull, desc } from "drizzle-orm";
import * as schema from "@shared/schema";

export class DBStorage implements IStorage {
  private db;

  constructor(connectionString: string) {
    const sql = neon(connectionString);
    this.db = drizzle(sql, { schema });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Username field was removed - return undefined for backward compatibility
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(schema.users).where(eq(schema.users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(schema.users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, update: Partial<User>): Promise<User | undefined> {
    const result = await this.db.update(schema.users).set(update).where(eq(schema.users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      // Get all weddings for this user
      const weddings = await this.getWeddingsByUser(id);
      
      // Delete all wedding-related data
      for (const wedding of weddings) {
        // Delete events
        await this.db.delete(schema.events).where(eq(schema.events.weddingId, wedding.id));
        
        // Delete guests
        await this.db.delete(schema.guests).where(eq(schema.guests.weddingId, wedding.id));
        
        // Delete tasks
        await this.db.delete(schema.tasks).where(eq(schema.tasks.weddingId, wedding.id));
        
        // Delete budget categories
        await this.db.delete(schema.budgetCategories).where(eq(schema.budgetCategories.weddingId, wedding.id));
        
        // Delete bookings
        await this.db.delete(schema.bookings).where(eq(schema.bookings.weddingId, wedding.id));
        
        // Delete contracts
        await this.db.delete(schema.contracts).where(eq(schema.contracts.weddingId, wedding.id));
        
        // Delete messages
        const conversationIds = await this.getConversationsByWedding(wedding.id);
        for (const convId of conversationIds) {
          await this.db.delete(schema.messages).where(eq(schema.messages.conversationId, convId));
        }
        
        // Delete reviews
        await this.db.delete(schema.reviews).where(eq(schema.reviews.weddingId, wedding.id));
        
        // Delete playlists and songs
        const playlists = await this.getPlaylistsByWedding(wedding.id);
        for (const playlist of playlists) {
          const songs = await this.getSongsByPlaylist(playlist.id);
          for (const song of songs) {
            await this.db.delete(schema.songVotes).where(eq(schema.songVotes.songId, song.id));
          }
          await this.db.delete(schema.playlistSongs).where(eq(schema.playlistSongs.playlistId, playlist.id));
        }
        await this.db.delete(schema.playlists).where(eq(schema.playlists.weddingId, wedding.id));
        
        // Delete documents
        await this.db.delete(schema.documents).where(eq(schema.documents.weddingId, wedding.id));
        
        // Delete photo galleries and photos
        const galleries = await this.db.select().from(schema.photoGalleries).where(eq(schema.photoGalleries.weddingId, wedding.id));
        for (const gallery of galleries) {
          await this.db.delete(schema.photos).where(eq(schema.photos.galleryId, gallery.id));
        }
        await this.db.delete(schema.photoGalleries).where(eq(schema.photoGalleries.weddingId, wedding.id));
        
        // Delete wedding website
        await this.db.delete(schema.weddingWebsites).where(eq(schema.weddingWebsites.weddingId, wedding.id));
        
        // Delete wedding itself
        await this.db.delete(schema.weddings).where(eq(schema.weddings.id, wedding.id));
      }
      
      // For vendors: delete vendor profile if they have one
      const vendor = await this.db.select().from(schema.vendors).where(eq(schema.vendors.userId, id)).limit(1);
      if (vendor.length > 0) {
        const vendorId = vendor[0].id;
        
        // Delete vendor availability
        await this.db.delete(schema.vendorAvailability).where(eq(schema.vendorAvailability.vendorId, vendorId));
        
        // Delete vendor
        await this.db.delete(schema.vendors).where(eq(schema.vendors.id, vendorId));
      }
      
      // Finally, delete the user
      await this.db.delete(schema.users).where(eq(schema.users.id, id));
      
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<boolean> {
    await this.db.update(schema.users).set({ passwordHash }).where(eq(schema.users.id, id));
    return true;
  }

  async setVerificationToken(id: string, token: string, expires: Date): Promise<boolean> {
    await this.db.update(schema.users).set({ 
      verificationToken: token, 
      verificationTokenExpires: expires 
    }).where(eq(schema.users.id, id));
    return true;
  }

  async setResetToken(id: string, token: string, expires: Date): Promise<boolean> {
    await this.db.update(schema.users).set({ 
      resetToken: token, 
      resetTokenExpires: expires 
    }).where(eq(schema.users.id, id));
    return true;
  }

  async verifyEmail(userId: string): Promise<boolean> {
    await this.db.update(schema.users).set({ 
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpires: null
    }).where(eq(schema.users.id, userId));
    return true;
  }

  async clearVerificationToken(userId: string): Promise<boolean> {
    await this.db.update(schema.users).set({ 
      verificationToken: null,
      verificationTokenExpires: null
    }).where(eq(schema.users.id, userId));
    return true;
  }

  async clearResetToken(userId: string): Promise<boolean> {
    await this.db.update(schema.users).set({ 
      resetToken: null,
      resetTokenExpires: null
    }).where(eq(schema.users.id, userId));
    return true;
  }

  async updateLastLogin(userId: string): Promise<boolean> {
    await this.db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, userId));
    return true;
  }

  // Weddings
  async getWedding(id: string): Promise<Wedding | undefined> {
    const result = await this.db.select().from(schema.weddings).where(eq(schema.weddings.id, id));
    return result[0];
  }

  async getWeddingsByUser(userId: string): Promise<Wedding[]> {
    return await this.db.select().from(schema.weddings).where(eq(schema.weddings.userId, userId));
  }

  async getWeddingsForCollaborator(userId: string): Promise<Wedding[]> {
    const collaborators = await this.db
      .select({ weddingId: schema.weddingCollaborators.weddingId })
      .from(schema.weddingCollaborators)
      .where(
        and(
          eq(schema.weddingCollaborators.userId, userId),
          eq(schema.weddingCollaborators.status, "accepted")
        )
      );
    
    if (collaborators.length === 0) return [];
    
    const weddingIds = collaborators.map((c) => c.weddingId);
    return await this.db
      .select()
      .from(schema.weddings)
      .where(inArray(schema.weddings.id, weddingIds));
  }

  async createWedding(insertWedding: InsertWedding): Promise<Wedding> {
    // Resolve tradition slug to UUID for the new FK column
    let traditionId = insertWedding.traditionId;
    if (!traditionId && insertWedding.tradition) {
      const tradition = await this.getWeddingTraditionBySlug(insertWedding.tradition);
      if (tradition) {
        traditionId = tradition.id;
      }
    }
    
    const result = await this.db.insert(schema.weddings).values({
      ...insertWedding,
      traditionId,
    }).returning();
    return result[0];
  }

  async updateWedding(id: string, update: Partial<InsertWedding>): Promise<Wedding | undefined> {
    // Resolve tradition slug to UUID for the new FK column if tradition is being updated
    let traditionId = update.traditionId;
    if (!traditionId && update.tradition) {
      const tradition = await this.getWeddingTraditionBySlug(update.tradition);
      if (tradition) {
        traditionId = tradition.id;
      }
    }
    
    const result = await this.db.update(schema.weddings).set({
      ...update,
      ...(traditionId ? { traditionId } : {}),
    }).where(eq(schema.weddings.id, id)).returning();
    return result[0];
  }

  // Events
  async getEvent(id: string): Promise<Event | undefined> {
    const result = await this.db.select().from(schema.events).where(eq(schema.events.id, id));
    return result[0];
  }

  async getEventsByWedding(weddingId: string): Promise<Event[]> {
    return await this.db.select().from(schema.events).where(eq(schema.events.weddingId, weddingId));
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    // Auto-resolve ceremonyTypeId from type+tradition if not provided
    let ceremonyTypeId = insertEvent.ceremonyTypeId;
    
    // Try to resolve from wedding tradition + event type if not provided
    if (!ceremonyTypeId && insertEvent.type && insertEvent.weddingId) {
      const wedding = await this.getWedding(insertEvent.weddingId);
      if (wedding?.tradition) {
        const ceremonySlug = `${wedding.tradition.toLowerCase()}_${insertEvent.type}`;
        const ceremonyType = await this.getCeremonyType(ceremonySlug);
        if (ceremonyType) {
          ceremonyTypeId = ceremonyType.id;
        }
      }
    }
    
    // Ensure we have a valid ceremonyTypeId - required by NOT NULL constraint
    if (!ceremonyTypeId) {
      throw new Error("ceremonyTypeId is required - provide directly or ensure type+weddingId allows auto-resolution");
    }
    
    const result = await this.db.insert(schema.events).values({
      ...insertEvent,
      ceremonyTypeId,
    }).returning();
    return result[0];
  }

  async updateEvent(id: string, update: Partial<InsertEvent>): Promise<Event | undefined> {
    const result = await this.db.update(schema.events).set(update).where(eq(schema.events.id, id)).returning();
    return result[0];
  }

  async deleteEvent(id: string): Promise<boolean> {
    await this.db.delete(schema.events).where(eq(schema.events.id, id));
    return true;
  }

  // Event Cost Items
  async getEventCostItem(id: string): Promise<EventCostItem | undefined> {
    const result = await this.db.select().from(schema.eventCostItems).where(eq(schema.eventCostItems.id, id));
    return result[0];
  }

  async getEventCostItemsByEvent(eventId: string): Promise<EventCostItem[]> {
    return await this.db.select().from(schema.eventCostItems).where(eq(schema.eventCostItems.eventId, eventId));
  }

  async createEventCostItem(insertCostItem: InsertEventCostItem): Promise<EventCostItem> {
    const result = await this.db.insert(schema.eventCostItems).values(insertCostItem).returning();
    return result[0];
  }

  async updateEventCostItem(id: string, update: Partial<InsertEventCostItem>): Promise<EventCostItem | undefined> {
    const result = await this.db.update(schema.eventCostItems).set(update).where(eq(schema.eventCostItems.id, id)).returning();
    return result[0];
  }

  async deleteEventCostItem(id: string): Promise<boolean> {
    await this.db.delete(schema.eventCostItems).where(eq(schema.eventCostItems.id, id));
    return true;
  }

  // Vendors
  async getVendor(id: string): Promise<Vendor | undefined> {
    const result = await this.db.select().from(schema.vendors).where(eq(schema.vendors.id, id));
    return result[0];
  }

  async getVendorsByIds(ids: string[]): Promise<Vendor[]> {
    if (ids.length === 0) return [];
    return await this.db.select().from(schema.vendors).where(inArray(schema.vendors.id, ids));
  }

  async getAllVendors(): Promise<Vendor[]> {
    return await this.db.select().from(schema.vendors);
  }

  async getVendorsByCategory(category: string): Promise<Vendor[]> {
    // Check both the legacy 'category' field and the 'categories' array
    return await this.db.select().from(schema.vendors).where(
      sql`${schema.vendors.category} = ${category} OR ${category} = ANY(${schema.vendors.categories})`
    );
  }

  async getVendorsByLocation(location: string): Promise<Vendor[]> {
    const vendors = await this.db.select().from(schema.vendors);
    return vendors.filter(v => v.location.toLowerCase().includes(location.toLowerCase()));
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const result = await this.db.insert(schema.vendors).values(insertVendor).returning();
    return result[0];
  }

  async updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const result = await this.db
      .update(schema.vendors)
      .set(updates)
      .where(eq(schema.vendors.id, id))
      .returning();
    return result[0];
  }

  // Ghost Profile / Claim methods
  async getVendorByGooglePlaceId(placeId: string): Promise<Vendor | undefined> {
    const result = await this.db
      .select()
      .from(schema.vendors)
      .where(eq(schema.vendors.googlePlaceId, placeId));
    return result[0];
  }

  async getVendorByClaimToken(token: string): Promise<Vendor | undefined> {
    const result = await this.db
      .select()
      .from(schema.vendors)
      .where(eq(schema.vendors.claimToken, token));
    return result[0];
  }

  async incrementVendorViewCount(id: string): Promise<void> {
    await this.db
      .update(schema.vendors)
      .set({ viewCount: sql`COALESCE(view_count, 0) + 1` })
      .where(eq(schema.vendors.id, id));
  }

  async queueClaimNotification(vendorId: string): Promise<void> {
    const vendor = await this.getVendor(vendorId);
    if (!vendor) return;
    
    // Set cooldown for 72 hours
    const cooldownUntil = new Date(Date.now() + 72 * 60 * 60 * 1000);
    await this.db
      .update(schema.vendors)
      .set({
        notifyCooldownUntil: cooldownUntil,
        lastViewNotifiedAt: new Date(),
      })
      .where(eq(schema.vendors.id, vendorId));
    
    // In production, this would send an email/SMS via Brevo
    console.log(`[ClaimNotification] Would notify vendor ${vendor.name} at ${vendor.phone || vendor.email}`);
  }

  async sendClaimEmail(vendorId: string, email: string, vendorName: string, claimLink: string): Promise<void> {
    // Use Brevo to send the claim email
    console.log(`[ClaimEmail] Preparing to send claim invitation:`, {
      vendorId,
      vendorName,
      recipientEmail: email,
      claimLink,
    });
    
    try {
      const { sendBrevoEmail } = await import('./email');
      
      await sendBrevoEmail({
        to: email,
        subject: `Claim Your Business Profile on Viah.me - ${vendorName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #C2410C;">Claim Your Profile on Viah.me</h1>
            <p>Hello,</p>
            <p>You're invited to claim your business profile <strong>${vendorName}</strong> on Viah.me, the premier South Asian wedding planning platform.</p>
            <p>Claim your free profile to:</p>
            <ul>
              <li>Update your photos and portfolio</li>
              <li>Respond directly to inquiries</li>
              <li>Showcase your services to engaged couples</li>
            </ul>
            <p style="margin: 30px 0;">
              <a href="${claimLink}" style="background-color: #C2410C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Claim Your Profile
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">This link expires in 48 hours.</p>
            <p style="color: #666; font-size: 12px;">
              If you don't want to receive these emails, you can ignore this message.
            </p>
          </div>
        `,
      });
      console.log(`[ClaimEmail] Successfully sent to ${email} for vendor ${vendorName} (${vendorId})`);
    } catch (err) {
      console.error(`[ClaimEmail] Failed to send to ${email} for vendor ${vendorName} (${vendorId}):`, err);
      throw err; // Re-throw so caller knows it failed
    }
  }

  // Service Packages
  async getServicePackage(id: string): Promise<ServicePackage | undefined> {
    const result = await this.db.select().from(schema.servicePackages).where(eq(schema.servicePackages.id, id));
    return result[0];
  }

  async getServicePackagesByVendor(vendorId: string): Promise<ServicePackage[]> {
    return await this.db
      .select()
      .from(schema.servicePackages)
      .where(eq(schema.servicePackages.vendorId, vendorId))
      .orderBy(schema.servicePackages.sortOrder);
  }

  async createServicePackage(insertPkg: InsertServicePackage): Promise<ServicePackage> {
    const result = await this.db.insert(schema.servicePackages).values(insertPkg).returning();
    return result[0];
  }

  async updateServicePackage(id: string, updates: Partial<InsertServicePackage>): Promise<ServicePackage | undefined> {
    const result = await this.db
      .update(schema.servicePackages)
      .set(updates)
      .where(eq(schema.servicePackages.id, id))
      .returning();
    return result[0];
  }

  async deleteServicePackage(id: string): Promise<boolean> {
    await this.db.delete(schema.servicePackages).where(eq(schema.servicePackages.id, id));
    return true;
  }

  // Bookings
  async getBooking(id: string): Promise<Booking | undefined> {
    const result = await this.db.select().from(schema.bookings).where(eq(schema.bookings.id, id));
    return result[0];
  }

  async getBookingsByWedding(weddingId: string): Promise<Booking[]> {
    return await this.db.select().from(schema.bookings).where(eq(schema.bookings.weddingId, weddingId));
  }

  async getBookingsWithVendorsByWedding(weddingId: string): Promise<Array<Booking & { vendor: Vendor }>> {
    const results = await this.db
      .select()
      .from(schema.bookings)
      .leftJoin(schema.vendors, eq(schema.bookings.vendorId, schema.vendors.id))
      .where(
        and(
          eq(schema.bookings.weddingId, weddingId),
          eq(schema.bookings.status, 'confirmed')
        )
      );
    
    return results
      .filter((row): row is { bookings: Booking; vendors: Vendor } => row.vendors !== null)
      .map(row => ({
        ...row.bookings,
        vendor: row.vendors
      }));
  }

  async getBookingsByVendor(vendorId: string): Promise<Booking[]> {
    return await this.db.select().from(schema.bookings).where(eq(schema.bookings.vendorId, vendorId));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const result = await this.db.insert(schema.bookings).values(insertBooking).returning();
    return result[0];
  }

  async updateBooking(id: string, update: Partial<InsertBooking>): Promise<Booking | undefined> {
    const result = await this.db.update(schema.bookings).set(update).where(eq(schema.bookings.id, id)).returning();
    return result[0];
  }

  // Vendor Favorites
  async getVendorFavoritesByWedding(weddingId: string): Promise<VendorFavorite[]> {
    return await this.db.select().from(schema.vendorFavorites).where(eq(schema.vendorFavorites.weddingId, weddingId));
  }

  async getVendorFavorite(weddingId: string, vendorId: string): Promise<VendorFavorite | undefined> {
    const result = await this.db
      .select()
      .from(schema.vendorFavorites)
      .where(
        and(
          eq(schema.vendorFavorites.weddingId, weddingId),
          eq(schema.vendorFavorites.vendorId, vendorId)
        )
      );
    return result[0];
  }

  async addVendorFavorite(insertFavorite: InsertVendorFavorite): Promise<VendorFavorite> {
    const result = await this.db.insert(schema.vendorFavorites).values(insertFavorite).returning();
    return result[0];
  }

  async removeVendorFavorite(weddingId: string, vendorId: string): Promise<boolean> {
    await this.db
      .delete(schema.vendorFavorites)
      .where(
        and(
          eq(schema.vendorFavorites.weddingId, weddingId),
          eq(schema.vendorFavorites.vendorId, vendorId)
        )
      );
    return true;
  }

  // Budget Allocations - Unified budget planning (Single Ledger Model)
  async getBudgetAllocation(id: string): Promise<BudgetAllocation | undefined> {
    const result = await this.db.select().from(budgetAllocations).where(eq(budgetAllocations.id, id));
    return result[0];
  }

  async getBudgetAllocationsByWedding(weddingId: string): Promise<BudgetAllocation[]> {
    return await this.db.select().from(budgetAllocations).where(eq(budgetAllocations.weddingId, weddingId));
  }

  async getBudgetAllocationByBucket(
    weddingId: string, 
    bucket: BudgetBucket, 
    ceremonyId?: string | null, 
    lineItemLabel?: string | null
  ): Promise<BudgetAllocation | undefined> {
    const conditions = [
      eq(budgetAllocations.weddingId, weddingId),
      eq(budgetAllocations.bucket, bucket),
    ];
    if (ceremonyId !== undefined) {
      conditions.push(ceremonyId === null ? isNull(budgetAllocations.ceremonyId) : eq(budgetAllocations.ceremonyId, ceremonyId));
    }
    if (lineItemLabel !== undefined) {
      conditions.push(lineItemLabel === null ? isNull(budgetAllocations.lineItemLabel) : eq(budgetAllocations.lineItemLabel, lineItemLabel));
    }
    const result = await this.db.select().from(budgetAllocations).where(and(...conditions));
    return result[0];
  }

  async getBudgetAllocationsByCeremony(weddingId: string, ceremonyId: string): Promise<BudgetAllocation[]> {
    return await this.db.select().from(budgetAllocations).where(
      and(eq(budgetAllocations.weddingId, weddingId), eq(budgetAllocations.ceremonyId, ceremonyId))
    );
  }

  async getBudgetAllocationsByBucket(weddingId: string, bucket: BudgetBucket): Promise<BudgetAllocation[]> {
    return await this.db.select().from(budgetAllocations).where(
      and(eq(budgetAllocations.weddingId, weddingId), eq(budgetAllocations.bucket, bucket))
    );
  }

  async getBudgetAllocationByBucketCategoryId(
    weddingId: string,
    bucketCategoryId: string,
    ceremonyId?: string | null,
    lineItemLabel?: string | null
  ): Promise<BudgetAllocation | undefined> {
    const conditions = [
      eq(budgetAllocations.weddingId, weddingId),
      eq(budgetAllocations.bucketCategoryId, bucketCategoryId),
    ];
    if (ceremonyId !== undefined) {
      conditions.push(ceremonyId === null ? isNull(budgetAllocations.ceremonyId) : eq(budgetAllocations.ceremonyId, ceremonyId));
    }
    if (lineItemLabel !== undefined) {
      conditions.push(lineItemLabel === null ? isNull(budgetAllocations.lineItemLabel) : eq(budgetAllocations.lineItemLabel, lineItemLabel));
    }
    const result = await this.db.select().from(budgetAllocations).where(and(...conditions));
    return result[0];
  }

  async getBudgetAllocationsByBucketCategoryId(weddingId: string, bucketCategoryId: string): Promise<BudgetAllocation[]> {
    return await this.db.select().from(budgetAllocations).where(
      and(eq(budgetAllocations.weddingId, weddingId), eq(budgetAllocations.bucketCategoryId, bucketCategoryId))
    );
  }

  async createBudgetAllocation(insertAllocation: InsertBudgetAllocation): Promise<BudgetAllocation> {
    // Resolve bucket slug to UUID for the new FK column - must use budgetBucketCategories table
    let bucketCategoryId = insertAllocation.bucketCategoryId;
    if (!bucketCategoryId && insertAllocation.bucket) {
      const [bucketCategory] = await this.db.select()
        .from(schema.budgetBucketCategories)
        .where(eq(schema.budgetBucketCategories.slug, insertAllocation.bucket))
        .limit(1);
      if (bucketCategory) {
        bucketCategoryId = bucketCategory.id;
      }
    }
    
    if (!bucketCategoryId) {
      throw new Error(`Cannot find budget bucket category for slug: ${insertAllocation.bucket}`);
    }
    
    const result = await this.db.insert(budgetAllocations).values({
      ...insertAllocation,
      bucketCategoryId,
    }).returning();
    return result[0];
  }

  async updateBudgetAllocation(id: string, update: Partial<InsertBudgetAllocation>): Promise<BudgetAllocation | undefined> {
    // Resolve bucket slug to UUID for the new FK column if bucket is being updated
    let bucketCategoryId = update.bucketCategoryId;
    if (!bucketCategoryId && update.bucket) {
      const [bucketCategory] = await this.db.select()
        .from(schema.budgetBucketCategories)
        .where(eq(schema.budgetBucketCategories.slug, update.bucket))
        .limit(1);
      if (bucketCategory) {
        bucketCategoryId = bucketCategory.id;
      }
    }
    
    const result = await this.db.update(budgetAllocations).set({
      ...update,
      ...(bucketCategoryId ? { bucketCategoryId } : {}),
    }).where(eq(budgetAllocations.id, id)).returning();
    return result[0];
  }

  async upsertBudgetAllocation(
    weddingId: string, 
    bucket: BudgetBucket, 
    allocatedAmount: string, 
    ceremonyId?: string | null, 
    lineItemLabel?: string | null, 
    notes?: string | null
  ): Promise<BudgetAllocation> {
    const existing = await this.getBudgetAllocationByBucket(weddingId, bucket, ceremonyId, lineItemLabel);
    if (existing) {
      return (await this.updateBudgetAllocation(existing.id, { allocatedAmount, notes }))!;
    }
    return this.createBudgetAllocation({ 
      weddingId, 
      bucket, 
      allocatedAmount, 
      ceremonyId: ceremonyId ?? null, 
      lineItemLabel: lineItemLabel ?? null, 
      notes: notes ?? null 
    });
  }

  async deleteBudgetAllocation(id: string): Promise<boolean> {
    await this.db.delete(budgetAllocations).where(eq(budgetAllocations.id, id));
    return true;
  }

  async getCeremonyTotalAllocated(weddingId: string, ceremonyId: string): Promise<number> {
    const allocations = await this.getBudgetAllocationsByCeremony(weddingId, ceremonyId);
    return allocations.reduce((sum, a) => sum + parseFloat(a.allocatedAmount || '0'), 0);
  }

  async getBucketTotalAllocated(weddingId: string, bucket: BudgetBucket): Promise<number> {
    const allocations = await this.getBudgetAllocationsByBucket(weddingId, bucket);
    return allocations.reduce((sum, a) => sum + parseFloat(a.allocatedAmount || '0'), 0);
  }

  async getBudgetBucketCategory(id: string): Promise<BudgetBucketCategory | undefined> {
    const [result] = await this.db.select()
      .from(schema.budgetBucketCategories)
      .where(eq(schema.budgetBucketCategories.id, id))
      .limit(1);
    return result;
  }

  async getAllBudgetBucketCategories(): Promise<BudgetBucketCategory[]> {
    return this.db.select().from(schema.budgetBucketCategories);
  }

  async upsertBudgetAllocationByUUID(
    weddingId: string,
    bucketCategoryId: string,
    allocatedAmount: string,
    ceremonyId?: string | null,
    lineItemLabel?: string | null,
    notes?: string | null
  ): Promise<BudgetAllocation> {
    const existing = await this.getBudgetAllocationByBucketCategoryId(weddingId, bucketCategoryId, ceremonyId, lineItemLabel);
    if (existing) {
      return (await this.updateBudgetAllocation(existing.id, { allocatedAmount, notes }))!;
    }
    
    // Look up the bucket category to get the slug for the legacy 'bucket' column
    const bucketCategory = await this.getBudgetBucketCategory(bucketCategoryId);
    const bucketSlug = bucketCategory?.slug as BudgetBucket || 'other';
    
    return this.createBudgetAllocation({
      weddingId,
      bucket: bucketSlug,
      bucketCategoryId,
      allocatedAmount,
      ceremonyId: ceremonyId ?? null,
      lineItemLabel: lineItemLabel ?? null,
      notes: notes ?? null
    });
  }

  async getBucketTotalAllocatedByUUID(weddingId: string, bucketCategoryId: string): Promise<number> {
    const allocations = await this.getBudgetAllocationsByBucketCategoryId(weddingId, bucketCategoryId);
    return allocations.reduce((sum, a) => sum + parseFloat(a.allocatedAmount || '0'), 0);
  }

  async recalculateBucketAllocationsFromCeremonies(weddingId: string): Promise<void> {
    // Get all events for the wedding with their ceremonyTypeId and guest counts
    const weddingEvents = await this.db.select()
      .from(schema.events)
      .where(eq(schema.events.weddingId, weddingId));

    // Get all budget categories first to build a slug-to-UUID lookup
    const allCategories = await this.db.select().from(schema.budgetBucketCategories);
    const slugToUuid: Record<string, string> = {};
    for (const cat of allCategories) {
      slugToUuid[cat.slug] = cat.id;
    }

    // Aggregate ceremony budget categories by UUID (not slug)
    const bucketAggregates: Record<string, { low: number; high: number; itemCount: number }> = {};

    for (const event of weddingEvents) {
      if (!event.ceremonyTypeId) continue;

      const guestCount = event.guestCount || 100;

      // Get ceremony budget categories for this ceremony type (both system and wedding-specific)
      const lineItems = await this.db.select()
        .from(schema.ceremonyBudgetCategories)
        .where(
          and(
            eq(schema.ceremonyBudgetCategories.ceremonyTypeId, event.ceremonyTypeId),
            eq(schema.ceremonyBudgetCategories.isActive, true),
            or(
              isNull(schema.ceremonyBudgetCategories.weddingId),
              eq(schema.ceremonyBudgetCategories.weddingId, weddingId)
            )
          )
        );

      for (const item of lineItems) {
        let bucketIdRaw = item.budgetBucketId;
        if (!bucketIdRaw) continue;

        // Resolve slug to UUID if needed (budgetBucketId may be slug or UUID)
        const bucketUuid = slugToUuid[bucketIdRaw] || bucketIdRaw;

        if (!bucketAggregates[bucketUuid]) {
          bucketAggregates[bucketUuid] = { low: 0, high: 0, itemCount: 0 };
        }

        let itemLow = parseFloat(item.lowCost || '0');
        let itemHigh = parseFloat(item.highCost || '0');

        // Apply unit multipliers
        if (item.unit === 'per_person') {
          itemLow *= guestCount;
          itemHigh *= guestCount;
        } else if (item.unit === 'per_hour') {
          const hoursLow = item.hoursLow || 1;
          const hoursHigh = item.hoursHigh || hoursLow;
          itemLow *= hoursLow;
          itemHigh *= hoursHigh;
        }

        bucketAggregates[bucketUuid].low += Math.round(itemLow);
        bucketAggregates[bucketUuid].high += Math.round(itemHigh);
        bucketAggregates[bucketUuid].itemCount += 1;
      }
    }

    // Upsert budget allocations with auto values
    for (const category of allCategories) {
      const aggregate = bucketAggregates[category.id] || { low: 0, high: 0, itemCount: 0 };
      const avgAmount = Math.round((aggregate.low + aggregate.high) / 2);

      // Check if an allocation exists for this bucket
      const existing = await this.getBudgetAllocationByBucketCategoryId(weddingId, category.id, null, null);

      if (existing) {
        // Update auto estimate values only - don't change allocated amounts
        // Couples decide their own budget allocations
        const updates: Partial<schema.InsertBudgetAllocation> = {
          autoLowAmount: aggregate.low.toString(),
          autoHighAmount: aggregate.high.toString(),
          autoItemCount: aggregate.itemCount,
        };

        await this.db.update(schema.budgetAllocations)
          .set(updates)
          .where(eq(schema.budgetAllocations.id, existing.id));
      } else if (aggregate.itemCount > 0) {
        // Create new allocation with auto estimates but $0 allocated (couples set their own)
        await this.db.insert(schema.budgetAllocations).values({
          weddingId,
          bucketCategoryId: category.id,
          bucket: category.slug,
          allocatedAmount: "0", // Start at $0 - couples decide
          autoLowAmount: aggregate.low.toString(),
          autoHighAmount: aggregate.high.toString(),
          autoItemCount: aggregate.itemCount,
          isManualOverride: false,
        });
      }
    }
  }

  // Expenses (Single Ledger Model)
  async getExpense(id: string): Promise<Expense | undefined> {
    const result = await this.db.select().from(schema.expenses).where(eq(schema.expenses.id, id));
    return result[0];
  }

  async getExpensesByWedding(weddingId: string): Promise<Expense[]> {
    return await this.db.select().from(schema.expenses).where(eq(schema.expenses.weddingId, weddingId));
  }

  async getExpensesByBucket(weddingId: string, bucket: BudgetBucket): Promise<Expense[]> {
    return await this.db.select().from(schema.expenses).where(
      and(eq(schema.expenses.weddingId, weddingId), eq(schema.expenses.parentCategory, bucket))
    );
  }

  async getExpenseTotalByBucket(weddingId: string, bucket: BudgetBucket): Promise<number> {
    const expenses = await this.getExpensesByBucket(weddingId, bucket);
    return expenses.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
  }

  async getExpensesByCeremony(weddingId: string, ceremonyId: string): Promise<Expense[]> {
    return await this.db.select().from(schema.expenses).where(
      and(eq(schema.expenses.weddingId, weddingId), eq(schema.expenses.ceremonyId, ceremonyId))
    );
  }

  async getExpenseTotalByCeremony(weddingId: string, ceremonyId: string): Promise<number> {
    const expenses = await this.getExpensesByCeremony(weddingId, ceremonyId);
    return expenses.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    // Auto-resolve parentCategory slug to bucketCategoryId if not provided
    let bucketCategoryId = insertExpense.bucketCategoryId;
    if (!bucketCategoryId && insertExpense.parentCategory) {
      // Look up the budget_bucket_category by slug to get its UUID
      const category = await this.getBudgetCategoryBySlug(insertExpense.parentCategory);
      if (category) {
        bucketCategoryId = category.id;
      }
    }
    
    // Ensure we have a valid bucketCategoryId - required by NOT NULL constraint
    if (!bucketCategoryId) {
      throw new Error("bucketCategoryId is required - provide directly or via parentCategory");
    }
    
    const result = await this.db.insert(schema.expenses).values({
      ...insertExpense,
      bucketCategoryId,
    }).returning();
    return result[0];
  }

  async updateExpense(id: string, update: Partial<InsertExpense>): Promise<Expense | undefined> {
    const result = await this.db.update(schema.expenses).set(update).where(eq(schema.expenses.id, id)).returning();
    return result[0];
  }

  async deleteExpense(id: string): Promise<boolean> {
    await this.db.delete(schema.expenses).where(eq(schema.expenses.id, id));
    return true;
  }

  // Expense Splits
  async getExpenseSplit(id: string): Promise<ExpenseSplit | undefined> {
    const result = await this.db.select().from(schema.expenseSplits).where(eq(schema.expenseSplits.id, id));
    return result[0];
  }

  async getExpenseSplitsByExpense(expenseId: string): Promise<ExpenseSplit[]> {
    return await this.db.select().from(schema.expenseSplits).where(eq(schema.expenseSplits.expenseId, expenseId));
  }

  async createExpenseSplit(insertSplit: InsertExpenseSplit): Promise<ExpenseSplit> {
    const result = await this.db.insert(schema.expenseSplits).values(insertSplit).returning();
    return result[0];
  }

  async updateExpenseSplit(id: string, update: Partial<InsertExpenseSplit>): Promise<ExpenseSplit | undefined> {
    const result = await this.db.update(schema.expenseSplits).set(update).where(eq(schema.expenseSplits.id, id)).returning();
    return result[0];
  }

  async deleteExpenseSplit(id: string): Promise<boolean> {
    await this.db.delete(schema.expenseSplits).where(eq(schema.expenseSplits.id, id));
    return true;
  }

  async deleteExpenseSplitsByExpense(expenseId: string): Promise<boolean> {
    await this.db.delete(schema.expenseSplits).where(eq(schema.expenseSplits.expenseId, expenseId));
    return true;
  }

  // Households
  async getHousehold(id: string): Promise<Household | undefined> {
    const result = await this.db.select().from(schema.households).where(eq(schema.households.id, id));
    return result[0];
  }

  async getHouseholdsByWedding(weddingId: string): Promise<Household[]> {
    return await this.db.select().from(schema.households).where(eq(schema.households.weddingId, weddingId));
  }

  async getHouseholdByMagicToken(token: string): Promise<Household | undefined> {
    const households = await this.db.select().from(schema.households);
    
    for (const household of households) {
      if (!household.magicLinkTokenHash || !household.magicLinkExpires) continue;
      
      const now = new Date();
      if (household.magicLinkExpires < now) continue;
      
      const isValid = await bcrypt.compare(token, household.magicLinkTokenHash);
      if (isValid) return household;
    }
    return undefined;
  }

  async createHousehold(insertHousehold: InsertHousehold): Promise<Household> {
    const result = await this.db.insert(schema.households).values(insertHousehold).returning();
    return result[0];
  }

  async updateHousehold(id: string, update: Partial<InsertHousehold>): Promise<Household | undefined> {
    const result = await this.db.update(schema.households).set(update).where(eq(schema.households.id, id)).returning();
    return result[0];
  }

  async deleteHousehold(id: string): Promise<boolean> {
    await this.db.delete(schema.households).where(eq(schema.households.id, id));
    return true;
  }

  async generateHouseholdMagicToken(householdId: string, expiresInDays: number = 30): Promise<string> {
    const household = await this.getHousehold(householdId);
    if (!household) throw new Error('Household not found');

    const token = randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(token, 10);
    const expires = new Date();
    expires.setDate(expires.getDate() + expiresInDays);

    await this.db
      .update(schema.households)
      .set({
        magicLinkTokenHash: hash,
        magicLinkToken: token, // Store plaintext for QR/copy functionality
        magicLinkExpires: expires,
      })
      .where(eq(schema.households.id, householdId));

    return token;
  }

  async revokeHouseholdMagicToken(householdId: string): Promise<boolean> {
    await this.db
      .update(schema.households)
      .set({
        magicLinkTokenHash: null,
        magicLinkToken: null, // Clear plaintext token as well
        magicLinkExpires: null,
      })
      .where(eq(schema.households.id, householdId));
    return true;
  }

  // Guests
  async getGuest(id: string): Promise<Guest | undefined> {
    const result = await this.db.select().from(schema.guests).where(eq(schema.guests.id, id));
    return result[0];
  }

  async getGuestsByWedding(weddingId: string): Promise<Guest[]> {
    return await this.db.select().from(schema.guests).where(eq(schema.guests.weddingId, weddingId));
  }

  async getGuestsByHousehold(householdId: string): Promise<Guest[]> {
    return await this.db.select().from(schema.guests).where(eq(schema.guests.householdId, householdId));
  }

  async getGuestByMagicToken(token: string): Promise<Guest | undefined> {
    const guests = await this.db.select().from(schema.guests);
    
    for (const guest of guests) {
      if (!guest.magicLinkTokenHash || !guest.magicLinkExpires) continue;
      
      const now = new Date();
      if (guest.magicLinkExpires < now) continue;
      
      const isValid = await bcrypt.compare(token, guest.magicLinkTokenHash);
      if (isValid) return guest;
    }
    return undefined;
  }

  async createGuest(insertGuest: InsertGuest): Promise<Guest> {
    const result = await this.db.insert(schema.guests).values(insertGuest).returning();
    return result[0];
  }

  async updateGuest(id: string, update: Partial<InsertGuest>): Promise<Guest | undefined> {
    const result = await this.db.update(schema.guests).set(update).where(eq(schema.guests.id, id)).returning();
    return result[0];
  }

  async deleteGuest(id: string): Promise<boolean> {
    const result = await this.db.delete(schema.guests).where(eq(schema.guests.id, id)).returning();
    return result.length > 0;
  }

  async generateMagicLinkToken(guestId: string, expiresInDays: number = 30): Promise<string> {
    const guest = await this.getGuest(guestId);
    if (!guest) throw new Error('Guest not found');

    const token = randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(token, 10);
    const expires = new Date();
    expires.setDate(expires.getDate() + expiresInDays);

    await this.db
      .update(schema.guests)
      .set({
        magicLinkTokenHash: hash,
        magicLinkExpires: expires,
      })
      .where(eq(schema.guests.id, guestId));

    return token;
  }

  async revokeMagicLinkToken(guestId: string): Promise<boolean> {
    await this.db
      .update(schema.guests)
      .set({
        magicLinkTokenHash: null,
        magicLinkExpires: null,
      })
      .where(eq(schema.guests.id, guestId));
    return true;
  }

  // Plus-One Guest Management
  async createPlusOneGuest(guestId: string): Promise<Guest> {
    const guest = await this.getGuest(guestId);
    if (!guest) throw new Error('Guest not found');
    
    // Check if plus one already exists
    const existingPlusOne = await this.db
      .select()
      .from(schema.guests)
      .where(eq(schema.guests.plusOneForGuestId, guestId));
    if (existingPlusOne.length > 0) return existingPlusOne[0];
    
    // Create plus one guest
    const plusOneResult = await this.db.insert(schema.guests).values({
      weddingId: guest.weddingId,
      householdId: guest.householdId,
      name: `${guest.name}'s Guest`,
      side: guest.side,
      plusOneForGuestId: guestId,
    }).returning();
    
    // Mark the original guest as having a plus one
    await this.db
      .update(schema.guests)
      .set({ plusOne: true })
      .where(eq(schema.guests.id, guestId));
    
    return plusOneResult[0];
  }

  async deletePlusOneGuest(guestId: string): Promise<boolean> {
    // Find the plus one guest
    const plusOne = await this.db
      .select()
      .from(schema.guests)
      .where(eq(schema.guests.plusOneForGuestId, guestId));
    
    if (plusOne.length === 0) return false;
    
    // Delete the plus one guest
    await this.db.delete(schema.guests).where(eq(schema.guests.plusOneForGuestId, guestId));
    
    // Update the original guest
    await this.db
      .update(schema.guests)
      .set({ plusOne: false })
      .where(eq(schema.guests.id, guestId));
    
    return true;
  }

  async getPlusOneForGuest(guestId: string): Promise<Guest | undefined> {
    const result = await this.db
      .select()
      .from(schema.guests)
      .where(eq(schema.guests.plusOneForGuestId, guestId));
    return result[0];
  }

  // Invitations
  async getInvitation(id: string): Promise<Invitation | undefined> {
    const result = await this.db.select().from(schema.invitations).where(eq(schema.invitations.id, id));
    return result[0];
  }

  async getInvitationsByGuest(guestId: string): Promise<Invitation[]> {
    return await this.db.select().from(schema.invitations).where(eq(schema.invitations.guestId, guestId));
  }

  async getInvitationsByEvent(eventId: string): Promise<Invitation[]> {
    return await this.db.select().from(schema.invitations).where(eq(schema.invitations.eventId, eventId));
  }

  async getInvitationByGuestAndEvent(guestId: string, eventId: string): Promise<Invitation | undefined> {
    const result = await this.db
      .select()
      .from(schema.invitations)
      .where(
        and(
          eq(schema.invitations.guestId, guestId),
          eq(schema.invitations.eventId, eventId)
        )
      );
    return result[0];
  }

  async createInvitation(insertInvitation: InsertInvitation): Promise<Invitation> {
    const result = await this.db.insert(schema.invitations).values(insertInvitation).returning();
    return result[0];
  }

  async bulkCreateInvitations(insertInvitations: InsertInvitation[]): Promise<Invitation[]> {
    if (insertInvitations.length === 0) return [];
    const result = await this.db.insert(schema.invitations).values(insertInvitations).returning();
    return result;
  }

  async updateInvitation(id: string, update: Partial<InsertInvitation>): Promise<Invitation | undefined> {
    const result = await this.db.update(schema.invitations).set(update).where(eq(schema.invitations.id, id)).returning();
    return result[0];
  }

  async deleteInvitation(id: string): Promise<boolean> {
    await this.db.delete(schema.invitations).where(eq(schema.invitations.id, id));
    return true;
  }

  // Tasks
  async getTask(id: string): Promise<Task | undefined> {
    const result = await this.db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    return result[0];
  }

  async getTasksByWedding(weddingId: string): Promise<Task[]> {
    return await this.db.select().from(schema.tasks).where(eq(schema.tasks.weddingId, weddingId));
  }

  async getTasksByAssignedUser(weddingId: string, userId: string): Promise<Task[]> {
    return await this.db.select().from(schema.tasks).where(
      and(
        eq(schema.tasks.weddingId, weddingId),
        eq(schema.tasks.assignedToId, userId)
      )
    );
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const result = await this.db.insert(schema.tasks).values(insertTask).returning();
    return result[0];
  }

  async updateTask(id: string, update: Partial<InsertTask>): Promise<Task | undefined> {
    const result = await this.db.update(schema.tasks).set(update).where(eq(schema.tasks.id, id)).returning();
    return result[0];
  }

  async deleteTask(id: string): Promise<boolean> {
    await this.db.delete(schema.tasks).where(eq(schema.tasks.id, id));
    return true;
  }

  async getTasksWithRemindersForDate(targetDate: Date): Promise<Task[]> {
    const allTasks = await this.db.select().from(schema.tasks).where(
      and(
        eq(schema.tasks.reminderEnabled, true),
        eq(schema.tasks.completed, false),
        sql`${schema.tasks.dueDate} IS NOT NULL`
      )
    );
    
    return allTasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - (task.reminderDaysBefore || 1));
      return reminderDate.toDateString() === targetDate.toDateString();
    });
  }

  // Task Templates
  async getTaskTemplatesByTradition(tradition: string): Promise<TaskTemplate[]> {
    // Fetch both tradition-specific and general templates
    const templates = await this.db.select().from(taskTemplates).where(
      and(
        sql`(${taskTemplates.tradition} = ${tradition} OR ${taskTemplates.tradition} = 'general')`,
        eq(taskTemplates.isActive, true)
      )
    ).orderBy(taskTemplates.daysBeforeWedding);
    return templates;
  }

  async getAllTaskTemplates(): Promise<TaskTemplate[]> {
    return await this.db.select().from(taskTemplates).where(
      eq(taskTemplates.isActive, true)
    ).orderBy(taskTemplates.tradition, taskTemplates.daysBeforeWedding);
  }

  // Task Reminders
  async getTaskReminder(id: string): Promise<TaskReminder | undefined> {
    const result = await this.db.select().from(schema.taskReminders).where(eq(schema.taskReminders.id, id));
    return result[0];
  }

  async getRemindersByTask(taskId: string): Promise<TaskReminder[]> {
    return await this.db.select().from(schema.taskReminders).where(eq(schema.taskReminders.taskId, taskId));
  }

  async getRemindersByWedding(weddingId: string): Promise<TaskReminder[]> {
    return await this.db.select().from(schema.taskReminders).where(eq(schema.taskReminders.weddingId, weddingId));
  }

  async hasReminderBeenSent(taskId: string, reminderType: string, today: Date): Promise<boolean> {
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    const result = await this.db.select().from(schema.taskReminders).where(
      and(
        eq(schema.taskReminders.taskId, taskId),
        eq(schema.taskReminders.reminderType, reminderType),
        sql`${schema.taskReminders.sentAt} >= ${startOfDay}`,
        sql`${schema.taskReminders.sentAt} <= ${endOfDay}`
      )
    );
    return result.length > 0;
  }

  async createTaskReminder(reminder: InsertTaskReminder): Promise<TaskReminder> {
    const result = await this.db.insert(schema.taskReminders).values(reminder).returning();
    return result[0];
  }

  async updateTaskReminder(id: string, updates: Partial<InsertTaskReminder>): Promise<TaskReminder | undefined> {
    const result = await this.db.update(schema.taskReminders).set(updates).where(eq(schema.taskReminders.id, id)).returning();
    return result[0];
  }

  // Task Comments
  async getTaskComment(id: string): Promise<TaskComment | undefined> {
    const result = await this.db.select().from(schema.taskComments).where(eq(schema.taskComments.id, id));
    return result[0];
  }

  async getCommentsByTask(taskId: string): Promise<TaskComment[]> {
    return await this.db.select().from(schema.taskComments)
      .where(eq(schema.taskComments.taskId, taskId))
      .orderBy(schema.taskComments.createdAt);
  }

  async createTaskComment(comment: InsertTaskComment): Promise<TaskComment> {
    const result = await this.db.insert(schema.taskComments).values(comment).returning();
    return result[0];
  }

  async deleteTaskComment(id: string): Promise<boolean> {
    await this.db.delete(schema.taskComments).where(eq(schema.taskComments.id, id));
    return true;
  }

  // Contracts
  async getContract(id: string): Promise<Contract | undefined> {
    const result = await this.db.select().from(schema.contracts).where(eq(schema.contracts.id, id));
    return result[0];
  }

  async getContractsByWedding(weddingId: string): Promise<Contract[]> {
    return await this.db.select().from(schema.contracts).where(eq(schema.contracts.weddingId, weddingId));
  }

  async getContractsByVendor(vendorId: string): Promise<Contract[]> {
    return await this.db.select().from(schema.contracts).where(eq(schema.contracts.vendorId, vendorId));
  }

  async getContractByBooking(bookingId: string): Promise<Contract | undefined> {
    const result = await this.db.select().from(schema.contracts).where(eq(schema.contracts.bookingId, bookingId));
    return result[0];
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const result = await this.db.insert(schema.contracts).values(insertContract).returning();
    return result[0];
  }

  async updateContract(id: string, update: Partial<InsertContract>): Promise<Contract | undefined> {
    const result = await this.db.update(schema.contracts).set(update).where(eq(schema.contracts.id, id)).returning();
    return result[0];
  }

  async deleteContract(id: string): Promise<boolean> {
    await this.db.delete(schema.contracts).where(eq(schema.contracts.id, id));
    return true;
  }

  // Contract Templates
  async getContractTemplate(id: string): Promise<ContractTemplate | undefined> {
    const result = await this.db.select().from(schema.contractTemplates).where(eq(schema.contractTemplates.id, id));
    return result[0];
  }

  async getContractTemplatesByCategory(category: string): Promise<ContractTemplate[]> {
    return await this.db.select().from(schema.contractTemplates).where(
      sql`LOWER(${schema.contractTemplates.vendorCategory}) = LOWER(${category})`
    );
  }

  async getAllContractTemplates(): Promise<ContractTemplate[]> {
    return await this.db.select().from(schema.contractTemplates).where(
      eq(schema.contractTemplates.isCustom, false)
    );
  }

  async getDefaultContractTemplate(category: string): Promise<ContractTemplate | undefined> {
    const result = await this.db.select().from(schema.contractTemplates).where(
      and(
        sql`LOWER(${schema.contractTemplates.vendorCategory}) = LOWER(${category})`,
        eq(schema.contractTemplates.isDefault, true)
      )
    );
    return result[0];
  }

  async getCustomTemplatesByWedding(weddingId: string): Promise<ContractTemplate[]> {
    return await this.db.select().from(schema.contractTemplates).where(
      and(
        eq(schema.contractTemplates.weddingId, weddingId),
        eq(schema.contractTemplates.isCustom, true)
      )
    );
  }

  async createContractTemplate(insertTemplate: InsertContractTemplate): Promise<ContractTemplate> {
    const result = await this.db.insert(schema.contractTemplates).values(insertTemplate).returning();
    return result[0];
  }

  async updateContractTemplate(id: string, update: Partial<InsertContractTemplate>): Promise<ContractTemplate | undefined> {
    const result = await this.db.update(schema.contractTemplates).set(update).where(eq(schema.contractTemplates.id, id)).returning();
    return result[0];
  }

  async deleteContractTemplate(id: string): Promise<boolean> {
    await this.db.delete(schema.contractTemplates).where(eq(schema.contractTemplates.id, id));
    return true;
  }

  // Messages
  async getMessage(id: string): Promise<Message | undefined> {
    const result = await this.db.select().from(schema.messages).where(eq(schema.messages.id, id));
    return result[0];
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const result = await this.db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.conversationId, conversationId))
      .orderBy(schema.messages.createdAt);
    return result;
  }

  async getConversationsByWedding(weddingId: string): Promise<string[]> {
    const result = await this.db
      .selectDistinct({ conversationId: schema.messages.conversationId })
      .from(schema.messages)
      .where(eq(schema.messages.weddingId, weddingId));
    return result.map(r => r.conversationId);
  }

  async getConversationsByVendor(vendorId: string): Promise<string[]> {
    const result = await this.db
      .selectDistinct({ conversationId: schema.messages.conversationId })
      .from(schema.messages)
      .where(eq(schema.messages.vendorId, vendorId));
    return result.map(r => r.conversationId);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    // Ensure consistent conversationId format - include eventId if present
    const conversationId = generateConversationId(
      insertMessage.weddingId, 
      insertMessage.vendorId,
      insertMessage.eventId || undefined
    );
    const result = await this.db.insert(schema.messages).values({
      ...insertMessage,
      conversationId,
    }).returning();
    return result[0];
  }

  async markMessageAsRead(id: string): Promise<Message | undefined> {
    const result = await this.db
      .update(schema.messages)
      .set({ isRead: true })
      .where(eq(schema.messages.id, id))
      .returning();
    return result[0];
  }

  async getUnreadCount(conversationId: string, recipientType: 'couple' | 'vendor'): Promise<number> {
    const result = await this.db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.conversationId, conversationId));
    
    return result.filter(m => !m.isRead && m.senderType !== recipientType).length;
  }

  async getUnreadVendorMessagesByWedding(weddingId: string): Promise<Message[]> {
    const result = await this.db
      .select()
      .from(schema.messages)
      .where(
        and(
          eq(schema.messages.weddingId, weddingId),
          eq(schema.messages.senderType, 'vendor'),
          eq(schema.messages.isRead, false)
        )
      )
      .orderBy(sql`${schema.messages.createdAt} DESC`);
    return result;
  }

  // Conversation Status
  async getConversationStatus(conversationId: string): Promise<ConversationStatus | undefined> {
    const result = await this.db.select().from(schema.conversationStatus)
      .where(eq(schema.conversationStatus.conversationId, conversationId));
    return result[0];
  }

  async createConversationStatus(insert: InsertConversationStatus): Promise<ConversationStatus> {
    const result = await this.db.insert(schema.conversationStatus).values(insert).returning();
    return result[0];
  }

  async updateConversationStatus(conversationId: string, updates: Partial<InsertConversationStatus>): Promise<ConversationStatus | undefined> {
    const result = await this.db.update(schema.conversationStatus)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.conversationStatus.conversationId, conversationId))
      .returning();
    return result[0];
  }

  async closeConversation(conversationId: string, closedBy: string, closedByType: 'couple' | 'vendor', reason?: string): Promise<ConversationStatus> {
    let existing = await this.getConversationStatus(conversationId);
    if (!existing) {
      const parsed = parseConversationId(conversationId);
      if (!parsed) throw new Error("Invalid conversationId");
      existing = await this.createConversationStatus({
        conversationId,
        weddingId: parsed.weddingId,
        vendorId: parsed.vendorId,
        eventId: parsed.eventId,
      });
    }
    const result = await this.updateConversationStatus(conversationId, {
      status: 'closed',
      closedBy,
      closedByType,
      closureReason: reason,
      closedAt: new Date(),
    });
    return result as ConversationStatus;
  }

  // Quick Reply Templates
  async getQuickReplyTemplate(id: string): Promise<QuickReplyTemplate | undefined> {
    const result = await this.db.select().from(schema.quickReplyTemplates).where(eq(schema.quickReplyTemplates.id, id));
    return result[0];
  }

  async getQuickReplyTemplatesByVendor(vendorId: string): Promise<QuickReplyTemplate[]> {
    return await this.db
      .select()
      .from(schema.quickReplyTemplates)
      .where(eq(schema.quickReplyTemplates.vendorId, vendorId))
      .orderBy(schema.quickReplyTemplates.usageCount);
  }

  async createQuickReplyTemplate(insertTemplate: InsertQuickReplyTemplate): Promise<QuickReplyTemplate> {
    const result = await this.db.insert(schema.quickReplyTemplates).values(insertTemplate).returning();
    return result[0];
  }

  async updateQuickReplyTemplate(id: string, update: Partial<InsertQuickReplyTemplate>): Promise<QuickReplyTemplate | undefined> {
    const result = await this.db
      .update(schema.quickReplyTemplates)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(schema.quickReplyTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteQuickReplyTemplate(id: string): Promise<boolean> {
    await this.db.delete(schema.quickReplyTemplates).where(eq(schema.quickReplyTemplates.id, id));
    return true;
  }

  async incrementTemplateUsage(id: string): Promise<QuickReplyTemplate | undefined> {
    const template = await this.getQuickReplyTemplate(id);
    if (!template) return undefined;
    
    const result = await this.db
      .update(schema.quickReplyTemplates)
      .set({ 
        usageCount: (template.usageCount || 0) + 1,
        updatedAt: new Date()
      })
      .where(eq(schema.quickReplyTemplates.id, id))
      .returning();
    return result[0];
  }

  // Follow-Up Reminders
  async getFollowUpReminder(id: string): Promise<FollowUpReminder | undefined> {
    const result = await this.db.select().from(schema.followUpReminders).where(eq(schema.followUpReminders.id, id));
    return result[0];
  }

  async getFollowUpRemindersByVendor(vendorId: string): Promise<FollowUpReminder[]> {
    return await this.db
      .select()
      .from(schema.followUpReminders)
      .where(eq(schema.followUpReminders.vendorId, vendorId))
      .orderBy(schema.followUpReminders.reminderDate);
  }

  async getPendingRemindersForVendor(vendorId: string): Promise<FollowUpReminder[]> {
    return await this.db
      .select()
      .from(schema.followUpReminders)
      .where(and(
        eq(schema.followUpReminders.vendorId, vendorId),
        eq(schema.followUpReminders.status, 'pending')
      ))
      .orderBy(schema.followUpReminders.reminderDate);
  }

  async createFollowUpReminder(insertReminder: InsertFollowUpReminder): Promise<FollowUpReminder> {
    const result = await this.db.insert(schema.followUpReminders).values(insertReminder).returning();
    return result[0];
  }

  async updateFollowUpReminder(id: string, update: Partial<InsertFollowUpReminder>): Promise<FollowUpReminder | undefined> {
    const result = await this.db
      .update(schema.followUpReminders)
      .set(update)
      .where(eq(schema.followUpReminders.id, id))
      .returning();
    return result[0];
  }

  async deleteFollowUpReminder(id: string): Promise<boolean> {
    await this.db.delete(schema.followUpReminders).where(eq(schema.followUpReminders.id, id));
    return true;
  }

  // Reviews
  async getReview(id: string): Promise<Review | undefined> {
    const result = await this.db.select().from(schema.reviews).where(eq(schema.reviews.id, id));
    return result[0];
  }

  async getReviewsByVendor(vendorId: string): Promise<Review[]> {
    return await this.db
      .select()
      .from(schema.reviews)
      .where(eq(schema.reviews.vendorId, vendorId))
      .orderBy(schema.reviews.createdAt);
  }

  async getReviewsByWedding(weddingId: string): Promise<Review[]> {
    return await this.db.select().from(schema.reviews).where(eq(schema.reviews.weddingId, weddingId));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const result = await this.db.insert(schema.reviews).values(insertReview).returning();
    
    // Update vendor rating
    await this.updateVendorRating(insertReview.vendorId);
    
    return result[0];
  }

  async updateVendorRating(vendorId: string): Promise<void> {
    const reviews = await this.getReviewsByVendor(vendorId);
    
    if (reviews.length === 0) {
      await this.db
        .update(schema.vendors)
        .set({ rating: null, reviewCount: 0 })
        .where(eq(schema.vendors.id, vendorId));
    } else {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await this.db
        .update(schema.vendors)
        .set({ 
          rating: avgRating.toFixed(1), 
          reviewCount: reviews.length 
        })
        .where(eq(schema.vendors.id, vendorId));
    }
  }

  // Playlists
  async getPlaylist(id: string): Promise<Playlist | undefined> {
    const result = await this.db.select().from(schema.playlists).where(eq(schema.playlists.id, id));
    return result[0];
  }

  async getPlaylistsByWedding(weddingId: string): Promise<Playlist[]> {
    return await this.db.select().from(schema.playlists).where(eq(schema.playlists.weddingId, weddingId));
  }

  async getPlaylistsByEvent(eventId: string): Promise<Playlist[]> {
    return await this.db.select().from(schema.playlists).where(eq(schema.playlists.eventId, eventId));
  }

  async createPlaylist(insertPlaylist: InsertPlaylist): Promise<Playlist> {
    const result = await this.db.insert(schema.playlists).values(insertPlaylist).returning();
    return result[0];
  }

  async updatePlaylist(id: string, update: Partial<InsertPlaylist>): Promise<Playlist | undefined> {
    const result = await this.db
      .update(schema.playlists)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(schema.playlists.id, id))
      .returning();
    return result[0];
  }

  async deletePlaylist(id: string): Promise<boolean> {
    // Get all songs in this playlist
    const songs = await this.getSongsByPlaylist(id);
    
    // Delete all votes for all songs in this playlist
    for (const song of songs) {
      await this.db.delete(schema.songVotes).where(eq(schema.songVotes.songId, song.id));
    }
    
    // Delete all songs in this playlist
    await this.db.delete(schema.playlistSongs).where(eq(schema.playlistSongs.playlistId, id));
    
    // Delete the playlist
    await this.db.delete(schema.playlists).where(eq(schema.playlists.id, id));
    return true;
  }

  // Playlist Songs
  async getPlaylistSong(id: string): Promise<PlaylistSong | undefined> {
    const result = await this.db.select().from(schema.playlistSongs).where(eq(schema.playlistSongs.id, id));
    return result[0];
  }

  async getSongsByPlaylist(playlistId: string): Promise<PlaylistSong[]> {
    return await this.db
      .select()
      .from(schema.playlistSongs)
      .where(eq(schema.playlistSongs.playlistId, playlistId))
      .orderBy(schema.playlistSongs.voteCount, schema.playlistSongs.order);
  }

  async createPlaylistSong(insertSong: InsertPlaylistSong): Promise<PlaylistSong> {
    const result = await this.db.insert(schema.playlistSongs).values({
      ...insertSong,
      voteCount: 0, // Explicitly initialize vote count
    }).returning();
    return result[0];
  }

  async updatePlaylistSong(id: string, update: Partial<InsertPlaylistSong>): Promise<PlaylistSong | undefined> {
    const result = await this.db
      .update(schema.playlistSongs)
      .set(update)
      .where(eq(schema.playlistSongs.id, id))
      .returning();
    return result[0];
  }

  async deletePlaylistSong(id: string): Promise<boolean> {
    await this.db.delete(schema.songVotes).where(eq(schema.songVotes.songId, id));
    await this.db.delete(schema.playlistSongs).where(eq(schema.playlistSongs.id, id));
    return true;
  }

  async updateSongVoteCount(songId: string): Promise<void> {
    const votes = await this.getVotesBySong(songId);
    await this.db
      .update(schema.playlistSongs)
      .set({ voteCount: votes.length })
      .where(eq(schema.playlistSongs.id, songId));
  }

  // Song Votes
  async getSongVote(id: string): Promise<SongVote | undefined> {
    const result = await this.db.select().from(schema.songVotes).where(eq(schema.songVotes.id, id));
    return result[0];
  }

  async getVotesBySong(songId: string): Promise<SongVote[]> {
    return await this.db.select().from(schema.songVotes).where(eq(schema.songVotes.songId, songId));
  }

  async createSongVote(insertVote: InsertSongVote): Promise<SongVote> {
    const result = await this.db.insert(schema.songVotes).values(insertVote).returning();
    await this.updateSongVoteCount(insertVote.songId);
    return result[0];
  }

  async deleteVote(voterId: string, songId: string): Promise<boolean> {
    await this.db
      .delete(schema.songVotes)
      .where(and(
        eq(schema.songVotes.voterId, voterId),
        eq(schema.songVotes.songId, songId)
      ));
    await this.updateSongVoteCount(songId);
    return true;
  }

  async hasUserVoted(voterId: string, songId: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(schema.songVotes)
      .where(and(
        eq(schema.songVotes.voterId, voterId),
        eq(schema.songVotes.songId, songId)
      ));
    return result.length > 0;
  }

  // Documents
  async getDocument(id: string): Promise<Document | undefined> {
    const result = await this.db
      .select()
      .from(schema.documents)
      .where(eq(schema.documents.id, id));
    return result[0];
  }

  async getDocumentsByWedding(weddingId: string): Promise<Document[]> {
    return await this.db
      .select()
      .from(schema.documents)
      .where(eq(schema.documents.weddingId, weddingId));
  }

  async getDocumentsByEvent(eventId: string): Promise<Document[]> {
    return await this.db
      .select()
      .from(schema.documents)
      .where(eq(schema.documents.eventId, eventId));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const result = await this.db
      .insert(schema.documents)
      .values(document)
      .returning();
    return result[0];
  }

  async updateDocument(id: string, document: Partial<InsertDocument>): Promise<Document | undefined> {
    const result = await this.db
      .update(schema.documents)
      .set({
        ...document,
        updatedAt: new Date(),
      })
      .where(eq(schema.documents.id, id))
      .returning();
    return result[0];
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.documents)
      .where(eq(schema.documents.id, id))
      .returning();
    return result.length > 0;
  }

  // Wedding Websites
  async getWeddingWebsite(id: string): Promise<WeddingWebsite | undefined> {
    const result = await this.db
      .select()
      .from(schema.weddingWebsites)
      .where(eq(schema.weddingWebsites.id, id));
    return result[0];
  }

  async getWeddingWebsiteByWeddingId(weddingId: string): Promise<WeddingWebsite | undefined> {
    const result = await this.db
      .select()
      .from(schema.weddingWebsites)
      .where(eq(schema.weddingWebsites.weddingId, weddingId));
    return result[0];
  }

  async getWeddingWebsiteBySlug(slug: string): Promise<WeddingWebsite | undefined> {
    const result = await this.db
      .select()
      .from(schema.weddingWebsites)
      .where(eq(schema.weddingWebsites.slug, slug));
    return result[0];
  }

  async createWeddingWebsite(website: InsertWeddingWebsite): Promise<WeddingWebsite> {
    const result = await this.db
      .insert(schema.weddingWebsites)
      .values(website)
      .returning();
    return result[0];
  }

  async updateWeddingWebsite(id: string, website: Partial<InsertWeddingWebsite>): Promise<WeddingWebsite | undefined> {
    const result = await this.db
      .update(schema.weddingWebsites)
      .set({
        ...website,
        updatedAt: new Date(),
      })
      .where(eq(schema.weddingWebsites.id, id))
      .returning();
    return result[0];
  }

  async deleteWeddingWebsite(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.weddingWebsites)
      .where(eq(schema.weddingWebsites.id, id))
      .returning();
    return result.length > 0;
  }

  // Registry Retailers
  async getRegistryRetailer(id: string): Promise<RegistryRetailer | undefined> {
    const result = await this.db
      .select()
      .from(schema.registryRetailers)
      .where(eq(schema.registryRetailers.id, id));
    return result[0];
  }

  async getAllRegistryRetailers(): Promise<RegistryRetailer[]> {
    return await this.db
      .select()
      .from(schema.registryRetailers)
      .orderBy(schema.registryRetailers.sortOrder);
  }

  async getActiveRegistryRetailers(): Promise<RegistryRetailer[]> {
    return await this.db
      .select()
      .from(schema.registryRetailers)
      .where(eq(schema.registryRetailers.isActive, true))
      .orderBy(schema.registryRetailers.sortOrder);
  }

  // Wedding Registries
  async getWeddingRegistry(id: string): Promise<WeddingRegistry | undefined> {
    const result = await this.db
      .select()
      .from(schema.weddingRegistries)
      .where(eq(schema.weddingRegistries.id, id));
    return result[0];
  }

  async getRegistriesByWedding(weddingId: string): Promise<WeddingRegistry[]> {
    return await this.db
      .select()
      .from(schema.weddingRegistries)
      .where(eq(schema.weddingRegistries.weddingId, weddingId))
      .orderBy(schema.weddingRegistries.sortOrder);
  }

  async getRegistriesWithRetailersByWedding(weddingId: string): Promise<Array<WeddingRegistry & { retailer?: RegistryRetailer }>> {
    const registries = await this.getRegistriesByWedding(weddingId);
    const retailers = await this.getAllRegistryRetailers();
    const retailerMap = new Map(retailers.map(r => [r.id, r]));
    return registries.map(reg => ({
      ...reg,
      retailer: reg.retailerId ? retailerMap.get(reg.retailerId) : undefined,
    }));
  }

  async createWeddingRegistry(registry: InsertWeddingRegistry): Promise<WeddingRegistry> {
    const result = await this.db
      .insert(schema.weddingRegistries)
      .values(registry)
      .returning();
    return result[0];
  }

  async updateWeddingRegistry(id: string, registry: Partial<InsertWeddingRegistry>): Promise<WeddingRegistry | undefined> {
    const result = await this.db
      .update(schema.weddingRegistries)
      .set(registry)
      .where(eq(schema.weddingRegistries.id, id))
      .returning();
    return result[0];
  }

  async deleteWeddingRegistry(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.weddingRegistries)
      .where(eq(schema.weddingRegistries.id, id))
      .returning();
    return result.length > 0;
  }

  // Photo Galleries
  async getPhotoGallery(id: string): Promise<PhotoGallery | undefined> {
    const result = await this.db
      .select()
      .from(schema.photoGalleries)
      .where(eq(schema.photoGalleries.id, id));
    return result[0];
  }

  async getGalleriesByWedding(weddingId: string): Promise<PhotoGallery[]> {
    return await this.db
      .select()
      .from(schema.photoGalleries)
      .where(eq(schema.photoGalleries.weddingId, weddingId));
  }

  async getGalleriesByVendor(vendorId: string): Promise<PhotoGallery[]> {
    return await this.db
      .select()
      .from(schema.photoGalleries)
      .where(eq(schema.photoGalleries.vendorId, vendorId));
  }

  async getGalleriesByEvent(eventId: string): Promise<PhotoGallery[]> {
    return await this.db
      .select()
      .from(schema.photoGalleries)
      .where(eq(schema.photoGalleries.eventId, eventId));
  }

  async getGalleriesByType(type: 'inspiration' | 'vendor_portfolio' | 'event_photos'): Promise<PhotoGallery[]> {
    return await this.db
      .select()
      .from(schema.photoGalleries)
      .where(eq(schema.photoGalleries.type, type));
  }

  async createPhotoGallery(gallery: InsertPhotoGallery): Promise<PhotoGallery> {
    const result = await this.db
      .insert(schema.photoGalleries)
      .values(gallery)
      .returning();
    return result[0];
  }

  async updatePhotoGallery(id: string, gallery: Partial<InsertPhotoGallery>): Promise<PhotoGallery | undefined> {
    const result = await this.db
      .update(schema.photoGalleries)
      .set({
        ...gallery,
        updatedAt: new Date(),
      })
      .where(eq(schema.photoGalleries.id, id))
      .returning();
    return result[0];
  }

  async deletePhotoGallery(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.photoGalleries)
      .where(eq(schema.photoGalleries.id, id))
      .returning();
    return result.length > 0;
  }

  // Photos
  async getPhoto(id: string): Promise<Photo | undefined> {
    const result = await this.db
      .select()
      .from(schema.photos)
      .where(eq(schema.photos.id, id));
    return result[0];
  }

  async getPhotosByGallery(galleryId: string): Promise<Photo[]> {
    return await this.db
      .select()
      .from(schema.photos)
      .where(eq(schema.photos.galleryId, galleryId))
      .orderBy(schema.photos.order);
  }

  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const result = await this.db
      .insert(schema.photos)
      .values(photo)
      .returning();
    return result[0];
  }

  async updatePhoto(id: string, photo: Partial<InsertPhoto>): Promise<Photo | undefined> {
    const result = await this.db
      .update(schema.photos)
      .set(photo)
      .where(eq(schema.photos.id, id))
      .returning();
    return result[0];
  }

  async deletePhoto(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.photos)
      .where(eq(schema.photos.id, id))
      .returning();
    return result.length > 0;
  }

  // Vendor Availability
  async getVendorAvailability(id: string): Promise<VendorAvailability | undefined> {
    const result = await this.db
      .select()
      .from(schema.vendorAvailability)
      .where(eq(schema.vendorAvailability.id, id));
    return result[0];
  }

  async getAvailabilityByVendor(vendorId: string): Promise<VendorAvailability[]> {
    return await this.db
      .select()
      .from(schema.vendorAvailability)
      .where(eq(schema.vendorAvailability.vendorId, vendorId))
      .orderBy(schema.vendorAvailability.date);
  }

  async getAvailabilityByVendorAndDateRange(vendorId: string, startDate: Date, endDate: Date): Promise<VendorAvailability[]> {
    return await this.db
      .select()
      .from(schema.vendorAvailability)
      .where(
        and(
          eq(schema.vendorAvailability.vendorId, vendorId),
          and(
            sql`${schema.vendorAvailability.date} >= ${startDate}`,
            sql`${schema.vendorAvailability.date} <= ${endDate}`
          )
        )
      )
      .orderBy(schema.vendorAvailability.date);
  }

  async getAvailabilityByDate(vendorId: string, date: Date): Promise<VendorAvailability[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await this.db
      .select()
      .from(schema.vendorAvailability)
      .where(
        and(
          eq(schema.vendorAvailability.vendorId, vendorId),
          and(
            sql`${schema.vendorAvailability.date} >= ${startOfDay}`,
            sql`${schema.vendorAvailability.date} <= ${endOfDay}`
          )
        )
      );
  }

  async checkAvailabilityConflicts(vendorId: string, date: Date, timeSlot: string, excludeBookingId?: string): Promise<boolean> {
    const slots = await this.getAvailabilityByDate(vendorId, date);
    const conflicts = slots.filter((slot) => {
      if (excludeBookingId && slot.bookingId === excludeBookingId) return false;
      if (slot.status === 'available' || slot.status === 'blocked') return false;
      if (slot.timeSlot === 'full_day' || timeSlot === 'full_day') return true;
      return slot.timeSlot === timeSlot;
    });
    return conflicts.length > 0;
  }

  async createVendorAvailability(availability: InsertVendorAvailability): Promise<VendorAvailability> {
    const result = await this.db
      .insert(schema.vendorAvailability)
      .values(availability)
      .returning();
    return result[0];
  }

  async updateVendorAvailability(id: string, availability: Partial<InsertVendorAvailability>): Promise<VendorAvailability | undefined> {
    const result = await this.db
      .update(schema.vendorAvailability)
      .set({
        ...availability,
        updatedAt: new Date(),
      })
      .where(eq(schema.vendorAvailability.id, id))
      .returning();
    return result[0];
  }

  async deleteVendorAvailability(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.vendorAvailability)
      .where(eq(schema.vendorAvailability.id, id))
      .returning();
    return result.length > 0;
  }

  // ============================================================================
  // Vendor Calendar Accounts
  // ============================================================================

  async getVendorCalendarAccount(id: string): Promise<VendorCalendarAccount | undefined> {
    const result = await this.db
      .select()
      .from(schema.vendorCalendarAccounts)
      .where(eq(schema.vendorCalendarAccounts.id, id))
      .limit(1);
    return result[0];
  }

  async getCalendarAccountsByVendor(vendorId: string): Promise<VendorCalendarAccount[]> {
    return await this.db
      .select()
      .from(schema.vendorCalendarAccounts)
      .where(eq(schema.vendorCalendarAccounts.vendorId, vendorId))
      .orderBy(schema.vendorCalendarAccounts.createdAt);
  }

  async getCalendarAccountByEmail(vendorId: string, email: string): Promise<VendorCalendarAccount | undefined> {
    const result = await this.db
      .select()
      .from(schema.vendorCalendarAccounts)
      .where(
        and(
          eq(schema.vendorCalendarAccounts.vendorId, vendorId),
          eq(schema.vendorCalendarAccounts.email, email)
        )
      )
      .limit(1);
    return result[0];
  }

  async createVendorCalendarAccount(account: InsertVendorCalendarAccount): Promise<VendorCalendarAccount> {
    const result = await this.db
      .insert(schema.vendorCalendarAccounts)
      .values(account)
      .returning();
    return result[0];
  }

  async updateVendorCalendarAccount(id: string, account: Partial<InsertVendorCalendarAccount>): Promise<VendorCalendarAccount | undefined> {
    const result = await this.db
      .update(schema.vendorCalendarAccounts)
      .set({
        ...account,
        updatedAt: new Date(),
      })
      .where(eq(schema.vendorCalendarAccounts.id, id))
      .returning();
    return result[0];
  }

  async deleteVendorCalendarAccount(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.vendorCalendarAccounts)
      .where(eq(schema.vendorCalendarAccounts.id, id))
      .returning();
    return result.length > 0;
  }

  // ============================================================================
  // Vendor Calendars
  // ============================================================================

  async getVendorCalendar(id: string): Promise<VendorCalendar | undefined> {
    const result = await this.db
      .select()
      .from(schema.vendorCalendars)
      .where(eq(schema.vendorCalendars.id, id))
      .limit(1);
    return result[0];
  }

  async getCalendarsByAccount(accountId: string): Promise<VendorCalendar[]> {
    return await this.db
      .select()
      .from(schema.vendorCalendars)
      .where(eq(schema.vendorCalendars.accountId, accountId));
  }

  async getCalendarsByVendor(vendorId: string): Promise<VendorCalendar[]> {
    return await this.db
      .select()
      .from(schema.vendorCalendars)
      .where(eq(schema.vendorCalendars.vendorId, vendorId));
  }

  async getSelectedCalendarsByVendor(vendorId: string): Promise<VendorCalendar[]> {
    return await this.db
      .select()
      .from(schema.vendorCalendars)
      .where(
        and(
          eq(schema.vendorCalendars.vendorId, vendorId),
          eq(schema.vendorCalendars.isSelected, true)
        )
      );
  }

  async getWriteTargetCalendar(vendorId: string): Promise<VendorCalendar | undefined> {
    const result = await this.db
      .select()
      .from(schema.vendorCalendars)
      .where(
        and(
          eq(schema.vendorCalendars.vendorId, vendorId),
          eq(schema.vendorCalendars.isWriteTarget, true)
        )
      )
      .limit(1);
    return result[0];
  }

  async createVendorCalendar(calendar: InsertVendorCalendar): Promise<VendorCalendar> {
    const result = await this.db
      .insert(schema.vendorCalendars)
      .values(calendar)
      .returning();
    return result[0];
  }

  async updateVendorCalendar(id: string, calendar: Partial<InsertVendorCalendar>): Promise<VendorCalendar | undefined> {
    const result = await this.db
      .update(schema.vendorCalendars)
      .set(calendar)
      .where(eq(schema.vendorCalendars.id, id))
      .returning();
    return result[0];
  }

  async deleteVendorCalendar(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.vendorCalendars)
      .where(eq(schema.vendorCalendars.id, id))
      .returning();
    return result.length > 0;
  }

  async deleteCalendarsByAccount(accountId: string): Promise<boolean> {
    await this.db
      .delete(schema.vendorCalendars)
      .where(eq(schema.vendorCalendars.accountId, accountId));
    return true;
  }

  // ============================================================================
  // Contract Signatures
  // ============================================================================

  async getContractSignature(id: string): Promise<ContractSignature | undefined> {
    const result = await this.db
      .select()
      .from(schema.contractSignatures)
      .where(eq(schema.contractSignatures.id, id))
      .limit(1);
    return result[0];
  }

  async getSignaturesByContract(contractId: string): Promise<ContractSignature[]> {
    return await this.db
      .select()
      .from(schema.contractSignatures)
      .where(eq(schema.contractSignatures.contractId, contractId))
      .orderBy(schema.contractSignatures.signedAt);
  }

  async createContractSignature(signature: InsertContractSignature): Promise<ContractSignature> {
    const result = await this.db
      .insert(schema.contractSignatures)
      .values(signature)
      .returning();
    return result[0];
  }

  async hasContractBeenSigned(contractId: string, signerId: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(schema.contractSignatures)
      .where(
        and(
          eq(schema.contractSignatures.contractId, contractId),
          eq(schema.contractSignatures.signerId, signerId)
        )
      )
      .limit(1);
    return result.length > 0;
  }

  // ============================================================================
  // Contract Documents
  // ============================================================================

  async getContractDocument(id: string): Promise<ContractDocument | undefined> {
    const result = await this.db
      .select()
      .from(schema.contractDocuments)
      .where(eq(schema.contractDocuments.id, id))
      .limit(1);
    return result[0];
  }

  async getDocumentsByContract(contractId: string): Promise<ContractDocument[]> {
    return await this.db
      .select()
      .from(schema.contractDocuments)
      .where(eq(schema.contractDocuments.contractId, contractId))
      .orderBy(schema.contractDocuments.createdAt);
  }

  async createContractDocument(document: InsertContractDocument): Promise<ContractDocument> {
    const result = await this.db
      .insert(schema.contractDocuments)
      .values(document)
      .returning();
    return result[0];
  }

  async updateContractDocument(id: string, document: Partial<InsertContractDocument>): Promise<ContractDocument | undefined> {
    const result = await this.db
      .update(schema.contractDocuments)
      .set(document)
      .where(eq(schema.contractDocuments.id, id))
      .returning();
    return result[0];
  }

  async deleteContractDocument(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.contractDocuments)
      .where(eq(schema.contractDocuments.id, id))
      .returning();
    return result.length > 0;
  }

  // ============================================================================
  // Contract Payments
  // ============================================================================

  async getContractPayment(id: string): Promise<ContractPayment | undefined> {
    const result = await this.db
      .select()
      .from(schema.contractPayments)
      .where(eq(schema.contractPayments.id, id))
      .limit(1);
    return result[0];
  }

  async getPaymentsByContract(contractId: string): Promise<ContractPayment[]> {
    return await this.db
      .select()
      .from(schema.contractPayments)
      .where(eq(schema.contractPayments.contractId, contractId))
      .orderBy(schema.contractPayments.createdAt);
  }

  async createContractPayment(payment: InsertContractPayment): Promise<ContractPayment> {
    const result = await this.db
      .insert(schema.contractPayments)
      .values(payment)
      .returning();
    return result[0];
  }

  async updateContractPayment(id: string, payment: Partial<InsertContractPayment>): Promise<ContractPayment | undefined> {
    const result = await this.db
      .update(schema.contractPayments)
      .set(payment)
      .where(eq(schema.contractPayments.id, id))
      .returning();
    return result[0];
  }

  async deleteContractPayment(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.contractPayments)
      .where(eq(schema.contractPayments.id, id))
      .returning();
    return result.length > 0;
  }

  async getTotalPaidForContract(contractId: string): Promise<number> {
    const payments = await this.db
      .select()
      .from(schema.contractPayments)
      .where(
        and(
          eq(schema.contractPayments.contractId, contractId),
          eq(schema.contractPayments.status, 'completed')
        )
      );
    return payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  }

  // ============================================================================
  // Vendor Analytics
  // ============================================================================

  async getVendorAnalyticsSummary(vendorId: string): Promise<{
    totalBookings: number;
    confirmedBookings: number;
    totalRevenue: string;
    averageBookingValue: string;
    averageRating: string;
    totalReviews: number;
    conversionRate: string;
  }> {
    // Get booking statistics (exclude cancelled/declined from totals)
    const bookings = await this.db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.vendorId, vendorId));

    // Only count active bookings (confirmed + pending) as total
    const activeBookings = bookings.filter(b => 
      b.status === 'confirmed' || b.status === 'pending'
    );
    const totalBookings = activeBookings.length;
    // Compute confirmed from active bookings to ensure consistent denominator/numerator
    const confirmedBookings = activeBookings.filter(b => b.status === 'confirmed').length;

    // Calculate revenue - ONLY from confirmed bookings
    const confirmedWithCost = bookings.filter(b => 
      b.status === 'confirmed' && b.estimatedCost !== null && b.estimatedCost !== ''
    );
    const totalRevenue = confirmedWithCost.reduce((sum, b) => 
      sum + parseFloat(b.estimatedCost!), 0
    );
    const averageBookingValue = confirmedWithCost.length > 0 
      ? totalRevenue / confirmedWithCost.length 
      : 0;

    // Get review statistics
    const reviews = await this.db
      .select()
      .from(schema.reviews)
      .where(eq(schema.reviews.vendorId, vendorId));

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // Calculate conversion rate (confirmed / total bookings)
    const conversionRate = totalBookings > 0 
      ? (confirmedBookings / totalBookings * 100) 
      : 0;

    return {
      totalBookings,
      confirmedBookings,
      totalRevenue: totalRevenue.toFixed(2),
      averageBookingValue: averageBookingValue.toFixed(2),
      averageRating: averageRating.toFixed(1),
      totalReviews,
      conversionRate: conversionRate.toFixed(1),
    };
  }

  async getVendorBookingTrends(vendorId: string, startDate?: Date, endDate?: Date): Promise<Array<{
    date: string;
    bookings: number;
    confirmed: number;
  }>> {
    let query = this.db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.vendorId, vendorId));

    const bookings = await query;

    // Filter by date range if provided
    let filteredBookings = bookings;
    if (startDate || endDate) {
      filteredBookings = bookings.filter(b => {
        const bookingDate = new Date(b.requestDate);
        if (startDate && bookingDate < startDate) return false;
        if (endDate && bookingDate > endDate) return false;
        return true;
      });
    }

    // Group by date (count only active bookings: confirmed + pending)
    const dateMap = new Map<string, { bookings: number; confirmed: number }>();
    filteredBookings.forEach(booking => {
      // Only count confirmed and pending bookings (exclude cancelled/declined)
      if (booking.status === 'confirmed' || booking.status === 'pending') {
        const dateStr = new Date(booking.requestDate).toISOString().split('T')[0];
        const existing = dateMap.get(dateStr) || { bookings: 0, confirmed: 0 };
        existing.bookings++;
        if (booking.status === 'confirmed') existing.confirmed++;
        dateMap.set(dateStr, existing);
      }
    });

    // Convert to array and sort by date
    return Array.from(dateMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getVendorRevenueTrends(vendorId: string, startDate?: Date, endDate?: Date): Promise<Array<{
    date: string;
    revenue: string;
  }>> {
    const bookings = await this.db
      .select()
      .from(schema.bookings)
      .where(
        and(
          eq(schema.bookings.vendorId, vendorId),
          eq(schema.bookings.status, 'confirmed')
        )
      );

    // Filter by date range and confirmed with cost
    let filteredBookings = bookings.filter(b => b.estimatedCost !== null);
    if (startDate || endDate) {
      filteredBookings = filteredBookings.filter(b => {
        const bookingDate = b.confirmedDate ? new Date(b.confirmedDate) : new Date(b.requestDate);
        if (startDate && bookingDate < startDate) return false;
        if (endDate && bookingDate > endDate) return false;
        return true;
      });
    }

    // Group revenue by date with defensive parsing
    const dateMap = new Map<string, number>();
    filteredBookings.forEach(booking => {
      if (booking.estimatedCost && booking.estimatedCost.trim() !== '') {
        const dateStr = booking.confirmedDate 
          ? new Date(booking.confirmedDate).toISOString().split('T')[0]
          : new Date(booking.requestDate).toISOString().split('T')[0];
        const existing = dateMap.get(dateStr) || 0;
        const cost = parseFloat(booking.estimatedCost);
        if (!isNaN(cost)) {
          dateMap.set(dateStr, existing + cost);
        }
      }
    });

    // Convert to array and sort by date
    return Array.from(dateMap.entries())
      .map(([date, revenue]) => ({ date, revenue: revenue.toFixed(2) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // ============================================================================
  // Couple Analytics
  // ============================================================================

  async getWeddingAnalyticsSummary(weddingId: string): Promise<{
    totalBudget: string;
    totalSpent: string;
    remainingBudget: string;
    budgetUtilization: string;
    totalVendors: number;
    confirmedVendors: number;
    totalGuests: number;
    confirmedGuests: number;
    totalTasks: number;
    completedTasks: number;
    taskCompletionRate: string;
    totalEvents: number;
  }> {
    // Get wedding data with null guard
    const wedding = await this.getWedding(weddingId);
    const totalBudget = wedding?.totalBudget ? parseFloat(wedding.totalBudget) : 0;

    // Get budget categories
    const budgetCategories = await this.db
      .select()
      .from(schema.budgetCategories)
      .where(eq(schema.budgetCategories.weddingId, weddingId));

    const totalSpent = budgetCategories.reduce((sum, cat) => {
      const amount = cat.spentAmount ? parseFloat(cat.spentAmount) : 0;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    const remainingBudget = totalBudget - totalSpent;
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget * 100) : 0;

    // Get vendor statistics
    const bookings = await this.db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.weddingId, weddingId));

    const totalVendors = bookings.length;
    const confirmedVendors = bookings.filter(b => b.status === 'confirmed').length;

    // Get guest statistics
    const guests = await this.db
      .select()
      .from(schema.guests)
      .where(eq(schema.guests.weddingId, weddingId));

    const totalGuests = guests.length;
    const confirmedGuests = guests.filter(g => g.rsvpStatus === 'attending').length;

    // Get task statistics
    const tasks = await this.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.weddingId, weddingId));

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed === true).length;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0;

    // Get events count
    const events = await this.db
      .select()
      .from(schema.events)
      .where(eq(schema.events.weddingId, weddingId));

    const totalEvents = events.length;

    return {
      totalBudget: totalBudget.toFixed(2),
      totalSpent: totalSpent.toFixed(2),
      remainingBudget: remainingBudget.toFixed(2),
      budgetUtilization: budgetUtilization.toFixed(1),
      totalVendors,
      confirmedVendors,
      totalGuests,
      confirmedGuests,
      totalTasks,
      completedTasks,
      taskCompletionRate: taskCompletionRate.toFixed(1),
      totalEvents,
    };
  }

  async getWeddingBudgetBreakdown(weddingId: string): Promise<Array<{
    category: string;
    allocated: string;
    spent: string;
    percentage: number;
  }>> {
    const budgetCategories = await this.db
      .select()
      .from(schema.budgetCategories)
      .where(eq(schema.budgetCategories.weddingId, weddingId));

    return budgetCategories.map(cat => {
      const allocated = cat.allocatedAmount ? parseFloat(cat.allocatedAmount) : 0;
      const spent = cat.spentAmount ? parseFloat(cat.spentAmount) : 0;
      return {
        category: cat.category,
        allocated: (isNaN(allocated) ? 0 : allocated).toFixed(2),
        spent: (isNaN(spent) ? 0 : spent).toFixed(2),
        percentage: cat.percentage || 0,
      };
    });
  }

  async getWeddingSpendingTrends(weddingId: string): Promise<Array<{
    date: string;
    amount: string;
    category: string;
  }>> {
    // Get confirmed bookings with costs
    const bookings = await this.db
      .select()
      .from(schema.bookings)
      .where(
        and(
          eq(schema.bookings.weddingId, weddingId),
          eq(schema.bookings.status, 'confirmed')
        )
      );

    // Get vendors to map to categories
    const vendorIds = bookings.map(b => b.vendorId);
    const vendors = await this.db
      .select()
      .from(schema.vendors)
      .where(inArray(schema.vendors.id, vendorIds));

    const vendorMap = new Map(vendors.map(v => [v.id, v]));

    // Map bookings to spending trends with defensive parsing
    const trends = bookings
      .filter(b => b.estimatedCost !== null && b.estimatedCost.trim() !== '' && b.confirmedDate !== null)
      .map(booking => {
        const vendor = vendorMap.get(booking.vendorId);
        const cost = parseFloat(booking.estimatedCost!);
        return {
          date: new Date(booking.confirmedDate!).toISOString().split('T')[0],
          amount: (isNaN(cost) ? 0 : cost).toFixed(2),
          category: vendor?.categories?.[0] || 'Unknown',
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return trends;
  }

  // ============================================================================
  // Invitation Cards
  // ============================================================================

  async getInvitationCard(id: string): Promise<InvitationCard | undefined> {
    const result = await this.db
      .select()
      .from(schema.invitationCards)
      .where(eq(schema.invitationCards.id, id))
      .limit(1);
    return result[0];
  }

  async getAllInvitationCards(): Promise<InvitationCard[]> {
    return await this.db
      .select()
      .from(schema.invitationCards)
      .where(eq(schema.invitationCards.inStock, true))
      .orderBy(schema.invitationCards.createdAt);
  }

  async getInvitationCardsByTradition(tradition: string): Promise<InvitationCard[]> {
    return await this.db
      .select()
      .from(schema.invitationCards)
      .where(
        and(
          eq(schema.invitationCards.tradition, tradition),
          eq(schema.invitationCards.inStock, true)
        )
      )
      .orderBy(schema.invitationCards.createdAt);
  }

  async getInvitationCardsByCeremony(ceremonyType: string): Promise<InvitationCard[]> {
    return await this.db
      .select()
      .from(schema.invitationCards)
      .where(
        and(
          eq(schema.invitationCards.ceremonyType, ceremonyType),
          eq(schema.invitationCards.inStock, true)
        )
      )
      .orderBy(schema.invitationCards.createdAt);
  }

  async getFeaturedInvitationCards(): Promise<InvitationCard[]> {
    return await this.db
      .select()
      .from(schema.invitationCards)
      .where(
        and(
          eq(schema.invitationCards.featured, true),
          eq(schema.invitationCards.inStock, true)
        )
      )
      .orderBy(schema.invitationCards.createdAt);
  }

  // ============================================================================
  // Orders
  // ============================================================================

  async getOrder(id: string): Promise<Order | undefined> {
    const result = await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);
    return result[0];
  }

  async getOrdersByWedding(weddingId: string): Promise<Order[]> {
    return await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.weddingId, weddingId))
      .orderBy(schema.orders.createdAt);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await this.db
      .insert(schema.orders)
      .values(order)
      .returning();
    return result[0];
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const result = await this.db
      .update(schema.orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.orders.id, id))
      .returning();
    return result[0];
  }

  async updateOrderPaymentInfo(id: string, paymentIntentId: string, paymentStatus: string): Promise<Order | undefined> {
    const result = await this.db
      .update(schema.orders)
      .set({ 
        stripePaymentIntentId: paymentIntentId,
        stripePaymentStatus: paymentStatus,
        status: paymentStatus === 'succeeded' ? 'paid' : 'pending',
        updatedAt: new Date()
      })
      .where(eq(schema.orders.id, id))
      .returning();
    return result[0];
  }

  // ============================================================================
  // Order Items
  // ============================================================================

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await this.db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, orderId));
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const result = await this.db
      .insert(schema.orderItems)
      .values(item)
      .returning();
    return result[0];
  }

  // ============================================================================
  // Measurement Profiles
  // ============================================================================

  async getMeasurementProfile(id: string): Promise<MeasurementProfile | undefined> {
    const result = await this.db
      .select()
      .from(schema.measurementProfiles)
      .where(eq(schema.measurementProfiles.id, id))
      .limit(1);
    return result[0];
  }

  async getMeasurementProfileByGuest(guestId: string): Promise<MeasurementProfile | undefined> {
    const result = await this.db
      .select()
      .from(schema.measurementProfiles)
      .where(eq(schema.measurementProfiles.guestId, guestId))
      .limit(1);
    return result[0];
  }

  async getMeasurementProfilesByWedding(weddingId: string): Promise<MeasurementProfile[]> {
    // First get all guests for this wedding
    const guests = await this.db
      .select()
      .from(schema.guests)
      .where(eq(schema.guests.weddingId, weddingId));
    
    if (guests.length === 0) {
      return [];
    }

    const guestIds = guests.map(g => g.id);
    
    return await this.db
      .select()
      .from(schema.measurementProfiles)
      .where(inArray(schema.measurementProfiles.guestId, guestIds));
  }

  async createMeasurementProfile(profile: InsertMeasurementProfile): Promise<MeasurementProfile> {
    const result = await this.db
      .insert(schema.measurementProfiles)
      .values(profile)
      .returning();
    return result[0];
  }

  async updateMeasurementProfile(id: string, profile: Partial<InsertMeasurementProfile>): Promise<MeasurementProfile | undefined> {
    const result = await this.db
      .update(schema.measurementProfiles)
      .set({
        ...profile,
        updatedAt: new Date(),
      })
      .where(eq(schema.measurementProfiles.id, id))
      .returning();
    return result[0];
  }

  async deleteMeasurementProfile(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.measurementProfiles)
      .where(eq(schema.measurementProfiles.id, id))
      .returning();
    return result.length > 0;
  }

  // ============================================================================
  // Shopping Order Items
  // ============================================================================

  async getShoppingOrderItem(id: string): Promise<ShoppingOrderItem | undefined> {
    const result = await this.db
      .select()
      .from(schema.shoppingOrderItems)
      .where(eq(schema.shoppingOrderItems.id, id))
      .limit(1);
    return result[0];
  }

  async getShoppingOrderItemsByWedding(weddingId: string): Promise<ShoppingOrderItem[]> {
    return await this.db
      .select()
      .from(schema.shoppingOrderItems)
      .where(eq(schema.shoppingOrderItems.weddingId, weddingId))
      .orderBy(sql`${schema.shoppingOrderItems.createdAt} DESC`);
  }

  async createShoppingOrderItem(item: InsertShoppingOrderItem): Promise<ShoppingOrderItem> {
    // Calculate costUSD from costINR if provided (1 INR = 0.012 USD)
    let costUSD: string | null = null;
    if (item.costINR) {
      const inrAmount = parseFloat(item.costINR);
      if (!isNaN(inrAmount)) {
        costUSD = (inrAmount * 0.012).toFixed(2);
      }
    }

    const result = await this.db
      .insert(schema.shoppingOrderItems)
      .values({
        ...item,
        costUSD,
      })
      .returning();
    return result[0];
  }

  async updateShoppingOrderItem(id: string, item: Partial<InsertShoppingOrderItem>): Promise<ShoppingOrderItem | undefined> {
    // Get existing item to check if we need to recalculate costUSD
    const existing = await this.getShoppingOrderItem(id);
    if (!existing) return undefined;

    // Recalculate costUSD if costINR is being updated
    let costUSD = existing.costUSD;
    if (item.costINR !== undefined) {
      if (item.costINR) {
        const inrAmount = parseFloat(item.costINR);
        if (!isNaN(inrAmount)) {
          costUSD = (inrAmount * 0.012).toFixed(2);
        }
      } else {
        costUSD = null;
      }
    }

    const result = await this.db
      .update(schema.shoppingOrderItems)
      .set({
        ...item,
        costUSD,
        updatedAt: new Date(),
      })
      .where(eq(schema.shoppingOrderItems.id, id))
      .returning();
    return result[0];
  }

  async deleteShoppingOrderItem(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.shoppingOrderItems)
      .where(eq(schema.shoppingOrderItems.id, id))
      .returning();
    return result.length > 0;
  }

  // ============================================================================
  // Gap Windows (Guest Concierge)
  // ============================================================================

  async getGapWindow(id: string): Promise<GapWindow | undefined> {
    const result = await this.db
      .select()
      .from(schema.gapWindows)
      .where(eq(schema.gapWindows.id, id))
      .limit(1);
    return result[0];
  }

  async getGapWindowsByWedding(weddingId: string): Promise<GapWindow[]> {
    return await this.db
      .select()
      .from(schema.gapWindows)
      .where(eq(schema.gapWindows.weddingId, weddingId))
      .orderBy(schema.gapWindows.startTime);
  }

  async createGapWindow(gap: InsertGapWindow): Promise<GapWindow> {
    const result = await this.db
      .insert(schema.gapWindows)
      .values(gap)
      .returning();
    return result[0];
  }

  async updateGapWindow(id: string, gap: Partial<InsertGapWindow>): Promise<GapWindow | undefined> {
    const result = await this.db
      .update(schema.gapWindows)
      .set(gap)
      .where(eq(schema.gapWindows.id, id))
      .returning();
    return result[0];
  }

  async deleteGapWindow(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.gapWindows)
      .where(eq(schema.gapWindows.id, id))
      .returning();
    return result.length > 0;
  }

  async activateGapWindow(id: string, isActive: boolean): Promise<GapWindow | undefined> {
    const result = await this.db
      .update(schema.gapWindows)
      .set({ isActive })
      .where(eq(schema.gapWindows.id, id))
      .returning();
    return result[0];
  }

  // ============================================================================
  // Gap Recommendations
  // ============================================================================

  async getGapRecommendation(id: string): Promise<GapRecommendation | undefined> {
    const result = await this.db
      .select()
      .from(schema.gapRecommendations)
      .where(eq(schema.gapRecommendations.id, id))
      .limit(1);
    return result[0];
  }

  async getRecommendationsByGapWindow(gapWindowId: string): Promise<GapRecommendation[]> {
    return await this.db
      .select()
      .from(schema.gapRecommendations)
      .where(eq(schema.gapRecommendations.gapWindowId, gapWindowId))
      .orderBy(schema.gapRecommendations.order);
  }

  async createGapRecommendation(rec: InsertGapRecommendation): Promise<GapRecommendation> {
    const result = await this.db
      .insert(schema.gapRecommendations)
      .values(rec)
      .returning();
    return result[0];
  }

  async updateGapRecommendation(id: string, rec: Partial<InsertGapRecommendation>): Promise<GapRecommendation | undefined> {
    const result = await this.db
      .update(schema.gapRecommendations)
      .set(rec)
      .where(eq(schema.gapRecommendations.id, id))
      .returning();
    return result[0];
  }

  async deleteGapRecommendation(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.gapRecommendations)
      .where(eq(schema.gapRecommendations.id, id))
      .returning();
    return result.length > 0;
  }

  // ============================================================================
  // Ritual Stages
  // ============================================================================

  async getRitualStage(id: string): Promise<RitualStage | undefined> {
    const result = await this.db
      .select()
      .from(schema.ritualStages)
      .where(eq(schema.ritualStages.id, id))
      .limit(1);
    return result[0];
  }

  async getRitualStagesByEvent(eventId: string): Promise<RitualStage[]> {
    return await this.db
      .select()
      .from(schema.ritualStages)
      .where(eq(schema.ritualStages.eventId, eventId))
      .orderBy(schema.ritualStages.displayOrder);
  }

  async createRitualStage(stage: InsertRitualStage): Promise<RitualStage> {
    const result = await this.db
      .insert(schema.ritualStages)
      .values(stage)
      .returning();
    return result[0];
  }

  async updateRitualStage(id: string, stage: Partial<InsertRitualStage>): Promise<RitualStage | undefined> {
    const result = await this.db
      .update(schema.ritualStages)
      .set(stage)
      .where(eq(schema.ritualStages.id, id))
      .returning();
    return result[0];
  }

  async deleteRitualStage(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.ritualStages)
      .where(eq(schema.ritualStages.id, id))
      .returning();
    return result.length > 0;
  }

  // ============================================================================
  // Ritual Stage Updates
  // ============================================================================

  async getRitualStageUpdates(ritualStageId: string): Promise<RitualStageUpdate[]> {
    return await this.db
      .select()
      .from(schema.ritualStageUpdates)
      .where(eq(schema.ritualStageUpdates.ritualStageId, ritualStageId))
      .orderBy(sql`${schema.ritualStageUpdates.updatedAt} DESC`);
  }

  async getLatestRitualStageUpdate(ritualStageId: string): Promise<RitualStageUpdate | undefined> {
    const result = await this.db
      .select()
      .from(schema.ritualStageUpdates)
      .where(eq(schema.ritualStageUpdates.ritualStageId, ritualStageId))
      .orderBy(sql`${schema.ritualStageUpdates.updatedAt} DESC`)
      .limit(1);
    return result[0];
  }

  async createRitualStageUpdate(update: InsertRitualStageUpdate): Promise<RitualStageUpdate> {
    const result = await this.db
      .insert(schema.ritualStageUpdates)
      .values(update)
      .returning();
    return result[0];
  }

  // ============================================================================
  // Guest Notifications
  // ============================================================================

  async getGuestNotification(id: string): Promise<GuestNotification | undefined> {
    const result = await this.db
      .select()
      .from(schema.guestNotifications)
      .where(eq(schema.guestNotifications.id, id))
      .limit(1);
    return result[0];
  }

  async getNotificationsByWedding(weddingId: string): Promise<GuestNotification[]> {
    return await this.db
      .select()
      .from(schema.guestNotifications)
      .where(eq(schema.guestNotifications.weddingId, weddingId))
      .orderBy(sql`${schema.guestNotifications.sentAt} DESC`);
  }

  async createGuestNotification(notification: InsertGuestNotification): Promise<GuestNotification> {
    const result = await this.db
      .insert(schema.guestNotifications)
      .values(notification)
      .returning();
    return result[0];
  }

  // ============================================================================
  // Live Wedding Status
  // ============================================================================

  async getLiveWeddingStatus(weddingId: string): Promise<LiveWeddingStatus | undefined> {
    const result = await this.db
      .select()
      .from(schema.liveWeddingStatus)
      .where(eq(schema.liveWeddingStatus.weddingId, weddingId))
      .limit(1);
    return result[0];
  }

  async createOrUpdateLiveWeddingStatus(status: InsertLiveWeddingStatus): Promise<LiveWeddingStatus> {
    // Check if status exists for this wedding
    const existing = await this.getLiveWeddingStatus(status.weddingId);
    
    if (existing) {
      const result = await this.db
        .update(schema.liveWeddingStatus)
        .set({
          ...status,
          lastUpdatedAt: new Date(),
        })
        .where(eq(schema.liveWeddingStatus.weddingId, status.weddingId))
        .returning();
      return result[0];
    }
    
    const result = await this.db
      .insert(schema.liveWeddingStatus)
      .values(status)
      .returning();
    return result[0];
  }

  async updateLiveWeddingStatus(weddingId: string, updates: Partial<InsertLiveWeddingStatus>): Promise<LiveWeddingStatus | undefined> {
    const result = await this.db
      .update(schema.liveWeddingStatus)
      .set({
        ...updates,
        lastUpdatedAt: new Date(),
      })
      .where(eq(schema.liveWeddingStatus.weddingId, weddingId))
      .returning();
    return result[0];
  }

  // ============================================================================
  // Wedding Roles
  // ============================================================================

  async getWeddingRole(id: string): Promise<WeddingRole | undefined> {
    const result = await this.db
      .select()
      .from(schema.weddingRoles)
      .where(eq(schema.weddingRoles.id, id))
      .limit(1);
    return result[0];
  }

  async getWeddingRoles(weddingId: string): Promise<WeddingRole[]> {
    return this.getWeddingRolesByWedding(weddingId);
  }

  async getWeddingRolesByWedding(weddingId: string): Promise<WeddingRole[]> {
    return await this.db
      .select()
      .from(schema.weddingRoles)
      .where(eq(schema.weddingRoles.weddingId, weddingId))
      .orderBy(sql`${schema.weddingRoles.isOwner} DESC, ${schema.weddingRoles.isSystem} DESC, ${schema.weddingRoles.createdAt} ASC`);
  }

  async getWeddingRoleWithPermissions(id: string): Promise<RoleWithPermissions | undefined> {
    const role = await this.getWeddingRole(id);
    if (!role) return undefined;
    
    const permissions = await this.getRolePermissions(id);
    return { ...role, permissions };
  }

  async createWeddingRole(role: InsertWeddingRole): Promise<WeddingRole> {
    const result = await this.db
      .insert(schema.weddingRoles)
      .values(role)
      .returning();
    return result[0];
  }

  async updateWeddingRole(id: string, role: Partial<InsertWeddingRole>): Promise<WeddingRole | undefined> {
    const result = await this.db
      .update(schema.weddingRoles)
      .set(role)
      .where(eq(schema.weddingRoles.id, id))
      .returning();
    return result[0];
  }

  async deleteWeddingRole(id: string): Promise<boolean> {
    // First check if this is a system role
    const role = await this.getWeddingRole(id);
    if (role?.isSystem || role?.isOwner) {
      return false; // Cannot delete system or owner roles
    }
    
    // Delete all permissions for this role first
    await this.db.delete(schema.rolePermissions).where(eq(schema.rolePermissions.roleId, id));
    
    const result = await this.db
      .delete(schema.weddingRoles)
      .where(eq(schema.weddingRoles.id, id))
      .returning();
    return result.length > 0;
  }

  async createDefaultRolesForWedding(weddingId: string): Promise<WeddingRole[]> {
    const roles: WeddingRole[] = [];
    
    // Create Owner role with full access
    const ownerRole = await this.createWeddingRole({
      weddingId,
      name: "owner",
      displayName: "Owner",
      description: "Full access to all wedding features",
      isSystem: true,
      isOwner: true,
    });
    roles.push(ownerRole);
    
    // Create Wedding Planner role with most access
    const plannerRole = await this.createWeddingRole({
      weddingId,
      name: "wedding_planner",
      displayName: "Wedding Planner",
      description: "Access to: Guests, Invitations, Timeline, Tasks, Vendors, Photos, Documents, Concierge, Contracts, Website, Playlists, Messages",
      isSystem: true,
      isOwner: false,
    });
    // Set planner permissions
    const plannerPermissions: { category: PermissionCategory; level: PermissionLevel }[] = [
      { category: "guests", level: "manage" },
      { category: "invitations", level: "manage" },
      { category: "timeline", level: "manage" },
      { category: "tasks", level: "manage" },
      { category: "vendors", level: "manage" },
      { category: "budget", level: "view" },
      { category: "contracts", level: "edit" },
      { category: "website", level: "edit" },
      { category: "photos", level: "manage" },
      { category: "documents", level: "manage" },
      { category: "playlists", level: "edit" },
      { category: "messages", level: "manage" },
      { category: "concierge", level: "manage" },
      { category: "shopping", level: "view" },
      { category: "settings", level: "view" },
      { category: "collaborators", level: "view" },
    ];
    await this.setRolePermissions(plannerRole.id, plannerPermissions);
    roles.push(plannerRole);
    
    // Create Family Member role with limited access
    const familyRole = await this.createWeddingRole({
      weddingId,
      name: "family_member",
      displayName: "Family Member",
      description: "Access to: Guest List (view), Timeline (view), Tasks (view), Vendors (view), Photos (edit), Playlists (edit)",
      isSystem: true,
      isOwner: false,
    });
    const familyPermissions: { category: PermissionCategory; level: PermissionLevel }[] = [
      { category: "guests", level: "view" },
      { category: "timeline", level: "view" },
      { category: "tasks", level: "view" },
      { category: "vendors", level: "view" },
      { category: "photos", level: "edit" },
      { category: "playlists", level: "edit" },
    ];
    await this.setRolePermissions(familyRole.id, familyPermissions);
    roles.push(familyRole);
    
    // Create Guest Coordinator role
    const coordinatorRole = await this.createWeddingRole({
      weddingId,
      name: "guest_coordinator",
      displayName: "Guest Coordinator",
      description: "Access to: Guests (manage), Invitations (manage), Timeline (view), Concierge (edit)",
      isSystem: true,
      isOwner: false,
    });
    const coordinatorPermissions: { category: PermissionCategory; level: PermissionLevel }[] = [
      { category: "guests", level: "manage" },
      { category: "invitations", level: "manage" },
      { category: "timeline", level: "view" },
      { category: "concierge", level: "edit" },
    ];
    await this.setRolePermissions(coordinatorRole.id, coordinatorPermissions);
    roles.push(coordinatorRole);
    
    return roles;
  }

  // ============================================================================
  // Role Permissions
  // ============================================================================

  async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    return await this.db
      .select()
      .from(schema.rolePermissions)
      .where(eq(schema.rolePermissions.roleId, roleId));
  }

  async setRolePermission(roleId: string, category: PermissionCategory, level: PermissionLevel): Promise<RolePermission> {
    // Delete existing permission for this category
    await this.db
      .delete(schema.rolePermissions)
      .where(and(
        eq(schema.rolePermissions.roleId, roleId),
        eq(schema.rolePermissions.category, category)
      ));
    
    // Insert new permission
    const result = await this.db
      .insert(schema.rolePermissions)
      .values({ roleId, category, level })
      .returning();
    return result[0];
  }

  async removeRolePermission(roleId: string, category: PermissionCategory): Promise<boolean> {
    const result = await this.db
      .delete(schema.rolePermissions)
      .where(and(
        eq(schema.rolePermissions.roleId, roleId),
        eq(schema.rolePermissions.category, category)
      ))
      .returning();
    return result.length > 0;
  }

  async setRolePermissions(roleId: string, permissions: { category: PermissionCategory; level: PermissionLevel }[]): Promise<RolePermission[]> {
    // Delete all existing permissions for this role
    await this.db.delete(schema.rolePermissions).where(eq(schema.rolePermissions.roleId, roleId));
    
    if (permissions.length === 0) return [];
    
    // Insert all new permissions
    const result = await this.db
      .insert(schema.rolePermissions)
      .values(permissions.map(p => ({ roleId, category: p.category, level: p.level })))
      .returning();
    return result;
  }

  async deleteRolePermissions(roleId: string): Promise<void> {
    await this.db.delete(schema.rolePermissions).where(eq(schema.rolePermissions.roleId, roleId));
  }

  // ============================================================================
  // Wedding Collaborators
  // ============================================================================

  async getWeddingCollaborator(id: string): Promise<WeddingCollaborator | undefined> {
    const result = await this.db
      .select()
      .from(schema.weddingCollaborators)
      .where(eq(schema.weddingCollaborators.id, id))
      .limit(1);
    return result[0];
  }

  async getWeddingCollaboratorByEmail(weddingId: string, email: string): Promise<WeddingCollaborator | undefined> {
    const result = await this.db
      .select()
      .from(schema.weddingCollaborators)
      .where(and(
        eq(schema.weddingCollaborators.weddingId, weddingId),
        eq(schema.weddingCollaborators.email, email.toLowerCase())
      ))
      .limit(1);
    return result[0];
  }

  async isWeddingCollaborator(weddingId: string, email: string): Promise<boolean> {
    const collaborator = await this.getWeddingCollaboratorByEmail(weddingId, email);
    return !!collaborator && collaborator.status === 'active';
  }

  async getWeddingCollaboratorByToken(token: string): Promise<WeddingCollaborator | undefined> {
    const collaborators = await this.db
      .select()
      .from(schema.weddingCollaborators)
      .where(eq(schema.weddingCollaborators.status, "pending"));
    
    for (const collab of collaborators) {
      if (collab.inviteToken && collab.inviteTokenExpires) {
        const isMatch = await bcrypt.compare(token, collab.inviteToken);
        if (isMatch) {
          // Check expiry
          if (new Date() > collab.inviteTokenExpires) {
            return undefined; // Token expired
          }
          return collab;
        }
      }
    }
    return undefined;
  }

  async getWeddingCollaboratorsByWedding(weddingId: string): Promise<WeddingCollaborator[]> {
    return await this.db
      .select()
      .from(schema.weddingCollaborators)
      .where(eq(schema.weddingCollaborators.weddingId, weddingId))
      .orderBy(sql`${schema.weddingCollaborators.invitedAt} DESC`);
  }

  async getWeddingCollaboratorWithDetails(id: string): Promise<CollaboratorWithDetails | undefined> {
    const collaborator = await this.getWeddingCollaborator(id);
    if (!collaborator) return undefined;
    
    const role = await this.getWeddingRole(collaborator.roleId);
    if (!role) return undefined;
    
    const permissions = await this.getRolePermissions(collaborator.roleId);
    return { ...collaborator, role, permissions };
  }

  async getCollaboratorsWithDetailsByWedding(weddingId: string): Promise<CollaboratorWithDetails[]> {
    const collaborators = await this.getWeddingCollaboratorsByWedding(weddingId);
    const results: CollaboratorWithDetails[] = [];
    
    for (const collab of collaborators) {
      const role = await this.getWeddingRole(collab.roleId);
      if (role) {
        const permissions = await this.getRolePermissions(collab.roleId);
        results.push({ ...collab, role, permissions });
      }
    }
    
    return results;
  }

  async getWeddingsByCollaboratorUser(userId: string): Promise<Wedding[]> {
    const collaborators = await this.db
      .select()
      .from(schema.weddingCollaborators)
      .where(and(
        eq(schema.weddingCollaborators.userId, userId),
        eq(schema.weddingCollaborators.status, "accepted")
      ));
    
    const weddings: Wedding[] = [];
    for (const collab of collaborators) {
      const wedding = await this.getWedding(collab.weddingId);
      if (wedding) {
        weddings.push(wedding);
      }
    }
    return weddings;
  }

  async createWeddingCollaborator(collaborator: InsertWeddingCollaborator): Promise<WeddingCollaborator> {
    const result = await this.db
      .insert(schema.weddingCollaborators)
      .values({
        ...collaborator,
        email: collaborator.email.toLowerCase(),
        status: collaborator.status || "pending",
      })
      .returning();
    return result[0];
  }

  async updateWeddingCollaborator(id: string, updates: Partial<InsertWeddingCollaborator>): Promise<WeddingCollaborator | undefined> {
    const result = await this.db
      .update(schema.weddingCollaborators)
      .set(updates)
      .where(eq(schema.weddingCollaborators.id, id))
      .returning();
    return result[0];
  }

  async deleteWeddingCollaborator(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.weddingCollaborators)
      .where(eq(schema.weddingCollaborators.id, id))
      .returning();
    return result.length > 0;
  }

  async generateCollaboratorInviteToken(collaboratorId: string, expiresInDays: number = 7): Promise<string> {
    const plainToken = randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(plainToken, 10);
    const expires = new Date();
    expires.setDate(expires.getDate() + expiresInDays);
    
    await this.db
      .update(schema.weddingCollaborators)
      .set({
        inviteToken: hashedToken,
        inviteTokenExpires: expires,
      })
      .where(eq(schema.weddingCollaborators.id, collaboratorId));
    
    return plainToken;
  }

  async acceptCollaboratorInvite(token: string, userId: string): Promise<WeddingCollaborator | undefined> {
    const collaborator = await this.getWeddingCollaboratorByToken(token);
    if (!collaborator) return undefined;
    
    const result = await this.db
      .update(schema.weddingCollaborators)
      .set({
        userId,
        status: "accepted",
        acceptedAt: new Date(),
        inviteToken: null,
        inviteTokenExpires: null,
      })
      .where(eq(schema.weddingCollaborators.id, collaborator.id))
      .returning();
    
    return result[0];
  }

  async revokeCollaboratorInvite(id: string): Promise<boolean> {
    const result = await this.db
      .update(schema.weddingCollaborators)
      .set({
        status: "revoked",
        inviteToken: null,
        inviteTokenExpires: null,
      })
      .where(eq(schema.weddingCollaborators.id, id))
      .returning();
    return result.length > 0;
  }

  // ============================================================================
  // Collaborator Activity Log
  // ============================================================================

  async logCollaboratorActivity(log: InsertCollaboratorActivityLog): Promise<CollaboratorActivityLog> {
    const result = await this.db
      .insert(schema.collaboratorActivityLog)
      .values(log)
      .returning();
    return result[0];
  }

  async getCollaboratorActivityLog(weddingId: string, limit: number = 50): Promise<CollaboratorActivityLog[]> {
    return await this.db
      .select()
      .from(schema.collaboratorActivityLog)
      .where(eq(schema.collaboratorActivityLog.weddingId, weddingId))
      .orderBy(sql`${schema.collaboratorActivityLog.performedAt} DESC`)
      .limit(limit);
  }

  // ============================================================================
  // Permission Checking
  // ============================================================================

  async getUserPermissionsForWedding(userId: string, weddingId: string): Promise<{ isOwner: boolean; permissions: Map<PermissionCategory, PermissionLevel> }> {
    const permissionMap = new Map<PermissionCategory, PermissionLevel>();
    
    // Check if user is the wedding owner (created the wedding)
    const wedding = await this.getWedding(weddingId);
    if (wedding && wedding.userId === userId) {
      // Wedding owner has full access to everything
      return { isOwner: true, permissions: permissionMap };
    }
    
    // Check if user is a collaborator
    const collaborators = await this.db
      .select()
      .from(schema.weddingCollaborators)
      .where(and(
        eq(schema.weddingCollaborators.weddingId, weddingId),
        eq(schema.weddingCollaborators.userId, userId),
        eq(schema.weddingCollaborators.status, "accepted")
      ))
      .limit(1);
    
    if (collaborators.length === 0) {
      return { isOwner: false, permissions: permissionMap };
    }
    
    const collaborator = collaborators[0];
    const role = await this.getWeddingRole(collaborator.roleId);
    
    if (role?.isOwner) {
      return { isOwner: true, permissions: permissionMap };
    }
    
    // Get permissions for this role
    const permissions = await this.getRolePermissions(collaborator.roleId);
    for (const perm of permissions) {
      permissionMap.set(perm.category as PermissionCategory, perm.level as PermissionLevel);
    }
    
    return { isOwner: false, permissions: permissionMap };
  }

  async checkUserPermission(userId: string, weddingId: string, category: PermissionCategory, requiredLevel: PermissionLevel): Promise<boolean> {
    const { isOwner, permissions } = await this.getUserPermissionsForWedding(userId, weddingId);
    
    // Owners have full access
    if (isOwner) return true;
    
    const userLevel = permissions.get(category);
    if (!userLevel) return false;
    
    // Check if user's level meets the required level
    const levelHierarchy: PermissionLevel[] = ["view", "edit", "manage"];
    const userLevelIndex = levelHierarchy.indexOf(userLevel);
    const requiredLevelIndex = levelHierarchy.indexOf(requiredLevel);
    
    return userLevelIndex >= requiredLevelIndex;
  }

  // ============================================================================
  // Guest Sources
  // ============================================================================

  async getGuestSource(id: string): Promise<GuestSource | undefined> {
    const result = await this.db
      .select()
      .from(schema.guestSources)
      .where(eq(schema.guestSources.id, id))
      .limit(1);
    return result[0];
  }

  async getGuestSourcesByWedding(weddingId: string): Promise<GuestSource[]> {
    return await this.db
      .select()
      .from(schema.guestSources)
      .where(eq(schema.guestSources.weddingId, weddingId))
      .orderBy(schema.guestSources.label);
  }

  async createGuestSource(source: InsertGuestSource): Promise<GuestSource> {
    const result = await this.db
      .insert(schema.guestSources)
      .values(source)
      .returning();
    return result[0];
  }

  async updateGuestSource(id: string, source: Partial<InsertGuestSource>): Promise<GuestSource | undefined> {
    const result = await this.db
      .update(schema.guestSources)
      .set(source)
      .where(eq(schema.guestSources.id, id))
      .returning();
    return result[0];
  }

  async deleteGuestSource(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.guestSources)
      .where(eq(schema.guestSources.id, id))
      .returning();
    return result.length > 0;
  }

  async getGuestSourceStats(weddingId: string): Promise<{ sourceId: string; count: number; seats: number }[]> {
    const result = await this.db
      .select({
        sourceId: schema.households.sourceId,
        count: sql<number>`count(*)::int`,
        seats: sql<number>`sum(${schema.households.maxCount})::int`,
      })
      .from(schema.households)
      .where(and(
        eq(schema.households.weddingId, weddingId),
        sql`${schema.households.sourceId} IS NOT NULL`
      ))
      .groupBy(schema.households.sourceId);
    return result.map(r => ({
      sourceId: r.sourceId || '',
      count: r.count || 0,
      seats: r.seats || 0,
    }));
  }

  // ============================================================================
  // Guest List Scenarios
  // ============================================================================

  async getGuestListScenario(id: string): Promise<GuestListScenario | undefined> {
    const result = await this.db
      .select()
      .from(schema.guestListScenarios)
      .where(eq(schema.guestListScenarios.id, id))
      .limit(1);
    return result[0];
  }

  async getGuestListScenarioWithStats(id: string): Promise<ScenarioWithStats | undefined> {
    const scenario = await this.getGuestListScenario(id);
    if (!scenario) return undefined;

    const scenarioHouseholds = await this.db
      .select()
      .from(schema.scenarioHouseholds)
      .where(and(
        eq(schema.scenarioHouseholds.scenarioId, id),
        eq(schema.scenarioHouseholds.isIncluded, true)
      ));

    let householdCount = 0;
    let guestCount = 0;

    for (const sh of scenarioHouseholds) {
      householdCount++;
      const household = await this.getHousehold(sh.householdId);
      if (household) {
        guestCount += sh.adjustedMaxCount || household.maxCount;
      }
    }

    const budgetLimit = scenario.budgetLimit ? parseFloat(scenario.budgetLimit) : undefined;
    const costPerHead = scenario.costPerHead ? parseFloat(scenario.costPerHead) : 0;
    const totalCost = guestCount * costPerHead;
    const remainingBudget = budgetLimit ? budgetLimit - totalCost : undefined;

    return {
      ...scenario,
      householdCount,
      guestCount,
      remainingBudget,
    };
  }

  async getGuestListScenariosByWedding(weddingId: string): Promise<ScenarioWithStats[]> {
    const scenarios = await this.db
      .select()
      .from(schema.guestListScenarios)
      .where(eq(schema.guestListScenarios.weddingId, weddingId))
      .orderBy(sql`${schema.guestListScenarios.createdAt} DESC`);

    const result: ScenarioWithStats[] = [];
    for (const scenario of scenarios) {
      const withStats = await this.getGuestListScenarioWithStats(scenario.id);
      if (withStats) result.push(withStats);
    }
    return result;
  }

  async createGuestListScenario(scenario: InsertGuestListScenario): Promise<GuestListScenario> {
    const result = await this.db
      .insert(schema.guestListScenarios)
      .values(scenario)
      .returning();
    return result[0];
  }

  async updateGuestListScenario(id: string, scenario: Partial<InsertGuestListScenario>): Promise<GuestListScenario | undefined> {
    const result = await this.db
      .update(schema.guestListScenarios)
      .set({ ...scenario, updatedAt: new Date() })
      .where(eq(schema.guestListScenarios.id, id))
      .returning();
    return result[0];
  }

  async deleteGuestListScenario(id: string): Promise<boolean> {
    // Delete scenario households first
    await this.db
      .delete(schema.scenarioHouseholds)
      .where(eq(schema.scenarioHouseholds.scenarioId, id));
    
    const result = await this.db
      .delete(schema.guestListScenarios)
      .where(eq(schema.guestListScenarios.id, id))
      .returning();
    return result.length > 0;
  }

  async setActiveScenario(weddingId: string, scenarioId: string): Promise<GuestListScenario> {
    // Deactivate all scenarios for this wedding
    await this.db
      .update(schema.guestListScenarios)
      .set({ isActive: false })
      .where(eq(schema.guestListScenarios.weddingId, weddingId));
    
    // Activate the specified scenario
    const result = await this.db
      .update(schema.guestListScenarios)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(schema.guestListScenarios.id, scenarioId))
      .returning();
    
    if (!result[0]) throw new Error("Scenario not found");
    return result[0];
  }

  async duplicateScenario(id: string, newName: string, userId: string): Promise<GuestListScenario> {
    const original = await this.getGuestListScenario(id);
    if (!original) throw new Error("Scenario not found");

    // Create new scenario
    const newScenario = await this.createGuestListScenario({
      weddingId: original.weddingId,
      name: newName,
      description: original.description,
      budgetLimit: original.budgetLimit,
      costPerHead: original.costPerHead,
      isActive: false,
      createdBy: userId,
    });

    // Copy households
    const households = await this.db
      .select()
      .from(schema.scenarioHouseholds)
      .where(eq(schema.scenarioHouseholds.scenarioId, id));

    for (const h of households) {
      await this.db
        .insert(schema.scenarioHouseholds)
        .values({
          scenarioId: newScenario.id,
          householdId: h.householdId,
          isIncluded: h.isIncluded,
          adjustedMaxCount: h.adjustedMaxCount,
          notes: h.notes,
        });
    }

    return newScenario;
  }

  async promoteScenarioToMain(id: string): Promise<boolean> {
    const scenario = await this.getGuestListScenario(id);
    if (!scenario) return false;

    // Get scenario households
    const scenarioHouseholds = await this.db
      .select()
      .from(schema.scenarioHouseholds)
      .where(eq(schema.scenarioHouseholds.scenarioId, id));

    const includedIds = new Set(
      scenarioHouseholds
        .filter(sh => sh.isIncluded)
        .map(sh => sh.householdId)
    );

    // Get all wedding households
    const allHouseholds = await this.getHouseholdsByWedding(scenario.weddingId);

    // Delete households not in scenario
    for (const household of allHouseholds) {
      if (!includedIds.has(household.id)) {
        await this.deleteHousehold(household.id);
      }
    }

    return true;
  }

  // ============================================================================
  // Scenario Households
  // ============================================================================

  async getScenarioHouseholds(scenarioId: string): Promise<(ScenarioHousehold & { household: Household })[]> {
    const scenarioHouseholds = await this.db
      .select()
      .from(schema.scenarioHouseholds)
      .where(eq(schema.scenarioHouseholds.scenarioId, scenarioId));

    const result: (ScenarioHousehold & { household: Household })[] = [];
    for (const sh of scenarioHouseholds) {
      const household = await this.getHousehold(sh.householdId);
      if (household) {
        result.push({ ...sh, household });
      }
    }
    return result;
  }

  async addHouseholdToScenario(scenarioId: string, householdId: string, adjustedMaxCount?: number): Promise<ScenarioHousehold> {
    // Check if already exists
    const existing = await this.db
      .select()
      .from(schema.scenarioHouseholds)
      .where(and(
        eq(schema.scenarioHouseholds.scenarioId, scenarioId),
        eq(schema.scenarioHouseholds.householdId, householdId)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      const result = await this.db
        .update(schema.scenarioHouseholds)
        .set({ isIncluded: true, adjustedMaxCount })
        .where(eq(schema.scenarioHouseholds.id, existing[0].id))
        .returning();
      return result[0];
    }

    const result = await this.db
      .insert(schema.scenarioHouseholds)
      .values({
        scenarioId,
        householdId,
        isIncluded: true,
        adjustedMaxCount,
      })
      .returning();
    return result[0];
  }

  async removeHouseholdFromScenario(scenarioId: string, householdId: string): Promise<boolean> {
    const result = await this.db
      .update(schema.scenarioHouseholds)
      .set({ isIncluded: false })
      .where(and(
        eq(schema.scenarioHouseholds.scenarioId, scenarioId),
        eq(schema.scenarioHouseholds.householdId, householdId)
      ))
      .returning();
    return result.length > 0;
  }

  async updateScenarioHousehold(id: string, updates: Partial<InsertScenarioHousehold>): Promise<ScenarioHousehold | undefined> {
    const result = await this.db
      .update(schema.scenarioHouseholds)
      .set(updates)
      .where(eq(schema.scenarioHouseholds.id, id))
      .returning();
    return result[0];
  }

  async copyAllHouseholdsToScenario(scenarioId: string, weddingId: string): Promise<number> {
    const households = await this.getHouseholdsByWedding(weddingId);

    let count = 0;
    for (const household of households) {
      await this.addHouseholdToScenario(scenarioId, household.id);
      count++;
    }
    return count;
  }

  // ============================================================================
  // Guest Budget Settings
  // ============================================================================

  async getGuestBudgetSettings(weddingId: string): Promise<GuestBudgetSettings | undefined> {
    const result = await this.db
      .select()
      .from(schema.guestBudgetSettings)
      .where(eq(schema.guestBudgetSettings.weddingId, weddingId))
      .limit(1);
    return result[0];
  }

  async createOrUpdateGuestBudgetSettings(settings: InsertGuestBudgetSettings): Promise<GuestBudgetSettings> {
    const existing = await this.getGuestBudgetSettings(settings.weddingId);
    
    if (existing) {
      const result = await this.db
        .update(schema.guestBudgetSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(schema.guestBudgetSettings.id, existing.id))
        .returning();
      return result[0];
    }

    const result = await this.db
      .insert(schema.guestBudgetSettings)
      .values(settings)
      .returning();
    return result[0];
  }

  async calculateBudgetCapacity(weddingId: string): Promise<{ maxGuests: number; currentCount: number; costPerHead: number; totalBudget: number; remainingBudget: number }> {
    const settings = await this.getGuestBudgetSettings(weddingId);
    const costPerHead = settings?.defaultCostPerHead ? parseFloat(settings.defaultCostPerHead) : 150; // Default $150/head
    const totalBudget = settings?.maxGuestBudget ? parseFloat(settings.maxGuestBudget) : 0;
    
    // Get current household count
    const households = await this.getHouseholdsByWedding(weddingId);
    const currentCount = households.reduce((sum, h) => sum + h.maxCount, 0);
    
    const maxGuests = totalBudget > 0 && costPerHead > 0 ? Math.floor(totalBudget / costPerHead) : 0;
    const remainingBudget = totalBudget - (currentCount * costPerHead);

    return {
      maxGuests,
      currentCount,
      costPerHead,
      totalBudget,
      remainingBudget,
    };
  }

  // ============================================================================
  // Guest Planning Snapshot - Comprehensive view for planning workflow
  // ============================================================================

  async getGuestPlanningSnapshot(weddingId: string): Promise<GuestPlanningSnapshot> {
    // Get all confirmed households
    const confirmedHouseholds = await this.getHouseholdsByWedding(weddingId);

    // Get wedding for total budget
    const wedding = await this.getWedding(weddingId);
    const weddingTotalBudget = wedding?.totalBudget ? parseFloat(wedding.totalBudget) : 0;

    // Get budget settings (for guest-specific budget)
    const budgetSettings = await this.getGuestBudgetSettings(weddingId);
    const defaultCostPerHead = budgetSettings?.defaultCostPerHead ? parseFloat(budgetSettings.defaultCostPerHead) : 150;
    
    // Use guest budget settings if set, otherwise use the wedding's total budget
    let guestBudget = 0;
    if (budgetSettings?.maxGuestBudget) {
      guestBudget = parseFloat(budgetSettings.maxGuestBudget);
    } else if (weddingTotalBudget > 0) {
      guestBudget = weddingTotalBudget;
    }
    
    // Get the couple's target guest count for fallback capacity
    const coupleTargetGuestCount = wedding?.guestCountEstimate || null;
    
    // Get budget allocations for per-event allocations
    const budgetAllocations = await this.getBudgetAllocationsByWedding(weddingId);

    // Calculate confirmed seat counts
    const confirmedSeats = confirmedHouseholds.reduce((sum, h) => sum + h.maxCount, 0);

    // Priority breakdown
    const priorityBreakdown = {
      must_invite: 0,
      should_invite: 0,
      nice_to_have: 0,
    };

    for (const h of confirmedHouseholds) {
      const tier = h.priorityTier as keyof typeof priorityBreakdown;
      if (tier in priorityBreakdown) {
        priorityBreakdown[tier] += h.maxCount;
      }
    }

    // Get events with per-event analysis
    const allEvents = await this.db
      .select()
      .from(schema.events)
      .where(eq(schema.events.weddingId, weddingId))
      .orderBy(schema.events.order);

    // Get all guests from confirmed households
    const confirmedGuests: Guest[] = [];
    for (const household of confirmedHouseholds) {
      const guests = await this.getGuestsByHousehold(household.id);
      confirmedGuests.push(...guests);
    }

    // Get invitations to understand which guests are invited to which events
    const allInvitations = await this.db
      .select()
      .from(schema.invitations);

    const guestEventMap = new Map<string, Set<string>>(); // eventId -> Set of guestIds
    for (const inv of allInvitations) {
      if (!guestEventMap.has(inv.eventId)) {
        guestEventMap.set(inv.eventId, new Set());
      }
      guestEventMap.get(inv.eventId)!.add(inv.guestId);
    }

    // Calculate per-event analysis
    const numEvents = allEvents.length || 1;
    const defaultEventAllocation = guestBudget > 0 ? guestBudget / numEvents : null;
    
    const eventAnalysis = await Promise.all(allEvents.map(async (event) => {
      const costPerHead = event.costPerHead ? parseFloat(event.costPerHead) : defaultCostPerHead;
      
      // Determine event capacity
      let eventCapacity: number | null = null;
      if (event.guestCount !== null && event.guestCount !== undefined) {
        eventCapacity = event.guestCount;
      } else if (event.venueCapacity !== null && event.venueCapacity !== undefined) {
        eventCapacity = event.venueCapacity;
      } else if (coupleTargetGuestCount && coupleTargetGuestCount > 0) {
        eventCapacity = coupleTargetGuestCount;
      }
      
      // Find budget allocation for this event (by ceremonyId match)
      const matchingAllocation = budgetAllocations.find(alloc => alloc.ceremonyId === event.id);
      
      const eventBudgetAllocation = matchingAllocation?.allocatedAmount 
        ? parseFloat(matchingAllocation.allocatedAmount) 
        : defaultEventAllocation;
      
      // Count confirmed guests for this event
      const invitedGuestIds = guestEventMap.get(event.id) || new Set();
      const confirmedInvited = confirmedGuests.filter(g => invitedGuestIds.has(g.id)).length;
      
      // Budget impact (estimated based on guest count)
      const confirmedCost = confirmedInvited * costPerHead;
      
      // Get actual expense spend for this event (includes multi-event allocations)
      const actualExpenseSpend = await this.getExpenseTotalByEvent(event.id);
      
      // Capacity status
      const capacityUsed = confirmedInvited;
      const capacityRemaining = eventCapacity !== null ? eventCapacity - confirmedInvited : null;
      const isOverCapacity = eventCapacity !== null && confirmedInvited > eventCapacity;
      const isOverBudget = eventBudgetAllocation !== null && eventBudgetAllocation > 0 && confirmedCost > eventBudgetAllocation;

      return {
        id: event.id,
        name: event.name,
        type: event.type,
        date: event.date,
        costPerHead,
        venueCapacity: eventCapacity,
        budgetAllocation: eventBudgetAllocation,
        confirmedInvited,
        confirmedCost,
        actualExpenseSpend,
        capacityUsed,
        capacityRemaining,
        isOverCapacity,
        isOverBudget,
      };
    }));

    // Calculate overall budget
    const confirmedSpend = confirmedSeats * defaultCostPerHead;
    const remainingBudget = guestBudget > 0 ? guestBudget - confirmedSpend : 0;
    const isOverBudget = guestBudget > 0 && confirmedSpend > guestBudget;

    return {
      confirmedHouseholds,
      summary: {
        confirmedSeats,
        totalSeats: confirmedSeats,
        priorityBreakdown,
      },
      events: eventAnalysis,
      budget: {
        weddingTotalBudget,
        guestBudget,
        defaultCostPerHead,
        confirmedSpend,
        remainingBudget,
        isOverBudget,
      },
    };
  }

  // ============================================================================
  // REAL-TIME MASTER TIMELINE
  // ============================================================================

  // Vendor Event Tags
  async getVendorEventTag(id: string): Promise<VendorEventTag | undefined> {
    const result = await this.db.select().from(schema.vendorEventTags).where(eq(schema.vendorEventTags.id, id));
    return result[0];
  }

  async getVendorEventTagsByEvent(eventId: string): Promise<VendorEventTagWithVendor[]> {
    const tags = await this.db.select().from(schema.vendorEventTags)
      .where(eq(schema.vendorEventTags.eventId, eventId));
    
    const result: VendorEventTagWithVendor[] = [];
    for (const tag of tags) {
      const vendor = await this.getVendor(tag.vendorId);
      if (vendor) {
        result.push({ ...tag, vendor });
      }
    }
    return result;
  }

  async getVendorEventTagsByWedding(weddingId: string): Promise<VendorEventTagWithVendor[]> {
    const tags = await this.db.select().from(schema.vendorEventTags)
      .where(eq(schema.vendorEventTags.weddingId, weddingId));
    
    const result: VendorEventTagWithVendor[] = [];
    for (const tag of tags) {
      const vendor = await this.getVendor(tag.vendorId);
      if (vendor) {
        result.push({ ...tag, vendor });
      }
    }
    return result;
  }

  async getVendorEventTagsByVendor(vendorId: string): Promise<VendorEventTag[]> {
    return this.db.select().from(schema.vendorEventTags)
      .where(eq(schema.vendorEventTags.vendorId, vendorId));
  }

  async createVendorEventTag(tag: InsertVendorEventTag): Promise<VendorEventTag> {
    const result = await this.db.insert(schema.vendorEventTags).values(tag).returning();
    return result[0];
  }

  async deleteVendorEventTag(id: string): Promise<boolean> {
    await this.db.delete(schema.vendorEventTags).where(eq(schema.vendorEventTags.id, id));
    return true;
  }

  async deleteVendorEventTagsByEvent(eventId: string): Promise<boolean> {
    await this.db.delete(schema.vendorEventTags).where(eq(schema.vendorEventTags.eventId, eventId));
    return true;
  }

  async tagVendorsToEvent(eventId: string, weddingId: string, vendorIds: string[], notifyVia: string = 'email'): Promise<VendorEventTag[]> {
    // Delete existing tags for this event
    await this.deleteVendorEventTagsByEvent(eventId);
    
    // Create new tags
    const tags: VendorEventTag[] = [];
    for (const vendorId of vendorIds) {
      const tag = await this.createVendorEventTag({
        eventId,
        weddingId,
        vendorId,
        notifyVia: notifyVia as 'email' | 'sms' | 'both',
      });
      tags.push(tag);
    }
    return tags;
  }

  // Timeline Changes
  async getTimelineChange(id: string): Promise<TimelineChange | undefined> {
    const result = await this.db.select().from(schema.timelineChanges).where(eq(schema.timelineChanges.id, id));
    return result[0];
  }

  async getTimelineChangesByEvent(eventId: string): Promise<TimelineChange[]> {
    return this.db.select().from(schema.timelineChanges)
      .where(eq(schema.timelineChanges.eventId, eventId))
      .orderBy(sql`${schema.timelineChanges.createdAt} DESC`);
  }

  async getTimelineChangesByWedding(weddingId: string): Promise<TimelineChangeWithAcks[]> {
    const changes = await this.db.select().from(schema.timelineChanges)
      .where(eq(schema.timelineChanges.weddingId, weddingId))
      .orderBy(sql`${schema.timelineChanges.createdAt} DESC`);
    
    const result: TimelineChangeWithAcks[] = [];
    for (const change of changes) {
      const acks = await this.db.select().from(schema.vendorAcknowledgments)
        .where(eq(schema.vendorAcknowledgments.changeId, change.id));
      const event = await this.getEvent(change.eventId);
      result.push({ ...change, acknowledgments: acks, event });
    }
    return result;
  }

  async getRecentTimelineChanges(weddingId: string, limit: number = 10): Promise<TimelineChangeWithAcks[]> {
    const changes = await this.db.select().from(schema.timelineChanges)
      .where(eq(schema.timelineChanges.weddingId, weddingId))
      .orderBy(sql`${schema.timelineChanges.createdAt} DESC`)
      .limit(limit);
    
    const result: TimelineChangeWithAcks[] = [];
    for (const change of changes) {
      const acks = await this.db.select().from(schema.vendorAcknowledgments)
        .where(eq(schema.vendorAcknowledgments.changeId, change.id));
      const event = await this.getEvent(change.eventId);
      result.push({ ...change, acknowledgments: acks, event });
    }
    return result;
  }

  async createTimelineChange(change: InsertTimelineChange): Promise<TimelineChange> {
    const result = await this.db.insert(schema.timelineChanges).values(change).returning();
    return result[0];
  }

  async markNotificationsSent(changeId: string): Promise<TimelineChange | undefined> {
    const result = await this.db.update(schema.timelineChanges)
      .set({ notificationsSent: true })
      .where(eq(schema.timelineChanges.id, changeId))
      .returning();
    return result[0];
  }

  // Vendor Acknowledgments
  async getVendorAcknowledgment(id: string): Promise<VendorAcknowledgment | undefined> {
    const result = await this.db.select().from(schema.vendorAcknowledgments).where(eq(schema.vendorAcknowledgments.id, id));
    return result[0];
  }

  async getAcknowledgmentsByChange(changeId: string): Promise<VendorAcknowledgmentWithDetails[]> {
    const acks = await this.db.select().from(schema.vendorAcknowledgments)
      .where(eq(schema.vendorAcknowledgments.changeId, changeId));
    
    const result: VendorAcknowledgmentWithDetails[] = [];
    for (const ack of acks) {
      const vendor = await this.getVendor(ack.vendorId);
      const change = await this.getTimelineChange(ack.changeId);
      if (vendor && change) {
        result.push({ ...ack, vendor, change });
      }
    }
    return result;
  }

  async getAcknowledgmentsByVendor(vendorId: string): Promise<VendorAcknowledgment[]> {
    return this.db.select().from(schema.vendorAcknowledgments)
      .where(eq(schema.vendorAcknowledgments.vendorId, vendorId));
  }

  async getPendingAcknowledgmentsForVendor(vendorId: string): Promise<VendorAcknowledgmentWithDetails[]> {
    const acks = await this.db.select().from(schema.vendorAcknowledgments)
      .where(and(
        eq(schema.vendorAcknowledgments.vendorId, vendorId),
        eq(schema.vendorAcknowledgments.status, 'pending')
      ));
    
    const result: VendorAcknowledgmentWithDetails[] = [];
    for (const ack of acks) {
      const vendor = await this.getVendor(ack.vendorId);
      const change = await this.getTimelineChange(ack.changeId);
      if (vendor && change) {
        result.push({ ...ack, vendor, change });
      }
    }
    return result;
  }

  async createVendorAcknowledgment(ack: InsertVendorAcknowledgment): Promise<VendorAcknowledgment> {
    const result = await this.db.insert(schema.vendorAcknowledgments).values(ack).returning();
    return result[0];
  }

  async acknowledgeChange(changeId: string, vendorId: string, status: 'acknowledged' | 'declined', message?: string): Promise<VendorAcknowledgment> {
    // Find existing acknowledgment
    const existing = await this.db.select().from(schema.vendorAcknowledgments)
      .where(and(
        eq(schema.vendorAcknowledgments.changeId, changeId),
        eq(schema.vendorAcknowledgments.vendorId, vendorId)
      ));
    
    if (existing.length > 0) {
      // Update existing
      const result = await this.db.update(schema.vendorAcknowledgments)
        .set({ status, message, acknowledgedAt: new Date() })
        .where(eq(schema.vendorAcknowledgments.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      // Get change details to create new ack
      const change = await this.getTimelineChange(changeId);
      if (!change) {
        throw new Error("Change not found");
      }
      
      return this.createVendorAcknowledgment({
        weddingId: change.weddingId,
        eventId: change.eventId,
        vendorId,
        changeId,
        status,
        message,
      });
    }
  }

  async getAcknowledgmentSummaryForEvent(eventId: string): Promise<{ pending: number; acknowledged: number; declined: number }> {
    const acks = await this.db.select().from(schema.vendorAcknowledgments)
      .where(eq(schema.vendorAcknowledgments.eventId, eventId));
    
    return {
      pending: acks.filter(a => a.status === 'pending').length,
      acknowledged: acks.filter(a => a.status === 'acknowledged').length,
      declined: acks.filter(a => a.status === 'declined').length,
    };
  }

  // Timeline utilities
  async reorderEvents(weddingId: string, orderedEventIds: string[], changedByUserId: string): Promise<Event[]> {
    const updatedEvents: Event[] = [];
    
    for (let i = 0; i < orderedEventIds.length; i++) {
      const eventId = orderedEventIds[i];
      const event = await this.getEvent(eventId);
      if (event && event.weddingId === weddingId) {
        const oldOrder = event.order;
        const newOrder = i + 1;
        
        if (oldOrder !== newOrder) {
          // Update the event order
          const updated = await this.updateEvent(eventId, { order: newOrder });
          if (updated) {
            updatedEvents.push(updated);
            
            // Create a change log entry
            await this.createTimelineChange({
              weddingId,
              eventId,
              changeType: 'order',
              oldValue: String(oldOrder),
              newValue: String(newOrder),
              changedByUserId,
            });
          }
        } else if (event) {
          updatedEvents.push(event);
        }
      }
    }
    
    return updatedEvents;
  }

  async updateEventTime(eventId: string, newTime: string, changedByUserId: string, note?: string): Promise<{ event: Event; change: TimelineChange; taggedVendors: Vendor[] }> {
    const event = await this.getEvent(eventId);
    if (!event) {
      throw new Error("Event not found");
    }
    
    const oldTime = event.time || '';
    
    // Update the event
    const updated = await this.updateEvent(eventId, { time: newTime });
    if (!updated) {
      throw new Error("Failed to update event");
    }
    
    // Create timeline change record
    const change = await this.createTimelineChange({
      weddingId: event.weddingId,
      eventId,
      changeType: 'time',
      oldValue: oldTime,
      newValue: newTime,
      changedByUserId,
      note,
    });
    
    // Get tagged vendors for this event
    const tags = await this.getVendorEventTagsByEvent(eventId);
    const taggedVendors = tags.map(t => t.vendor);
    
    // Create pending acknowledgment records for each tagged vendor
    for (const tag of tags) {
      await this.createVendorAcknowledgment({
        weddingId: event.weddingId,
        eventId,
        vendorId: tag.vendorId,
        changeId: change.id,
        status: 'pending',
      });
    }
    
    return { event: updated, change, taggedVendors };
  }

  async getTimelineWithAcknowledgments(weddingId: string): Promise<Array<Event & { tags: VendorEventTagWithVendor[]; pendingAcks: number; acknowledgedAcks: number }>> {
    const events = await this.getEventsByWedding(weddingId);
    
    const result = [];
    for (const event of events) {
      const tags = await this.getVendorEventTagsByEvent(event.id);
      const ackSummary = await this.getAcknowledgmentSummaryForEvent(event.id);
      
      result.push({
        ...event,
        tags,
        pendingAcks: ackSummary.pending,
        acknowledgedAcks: ackSummary.acknowledged,
      });
    }
    
    return result.sort((a, b) => a.order - b.order);
  }

  // ============================================================================
  // VENDOR TEAMMATE MANAGEMENT
  // ============================================================================

  async getVendorTeammate(id: string): Promise<VendorTeammate | undefined> {
    const result = await this.db.select().from(schema.vendorTeammates)
      .where(eq(schema.vendorTeammates.id, id));
    return result[0];
  }

  async getVendorTeammatesByVendor(vendorId: string): Promise<VendorTeammateWithUser[]> {
    const teammates = await this.db.select().from(schema.vendorTeammates)
      .where(and(
        eq(schema.vendorTeammates.vendorId, vendorId),
        eq(schema.vendorTeammates.status, 'active')
      ));
    
    const result: VendorTeammateWithUser[] = [];
    for (const teammate of teammates) {
      const user = await this.getUser(teammate.userId);
      result.push({
        ...teammate,
        user: user ? { email: user.email } : undefined,
      });
    }
    return result;
  }

  async getVendorTeammateByUserAndVendor(userId: string, vendorId: string): Promise<VendorTeammate | undefined> {
    const result = await this.db.select().from(schema.vendorTeammates)
      .where(and(
        eq(schema.vendorTeammates.userId, userId),
        eq(schema.vendorTeammates.vendorId, vendorId),
        eq(schema.vendorTeammates.status, 'active')
      ));
    return result[0];
  }

  async getVendorsByTeammate(userId: string): Promise<Vendor[]> {
    const teammates = await this.db.select().from(schema.vendorTeammates)
      .where(and(
        eq(schema.vendorTeammates.userId, userId),
        eq(schema.vendorTeammates.status, 'active')
      ));
    
    const vendors: Vendor[] = [];
    for (const teammate of teammates) {
      const vendor = await this.getVendor(teammate.vendorId);
      if (vendor) {
        vendors.push(vendor);
      }
    }
    return vendors;
  }

  async createVendorTeammate(teammate: InsertVendorTeammate): Promise<VendorTeammate> {
    const result = await this.db.insert(schema.vendorTeammates).values(teammate).returning();
    return result[0];
  }

  async updateVendorTeammate(id: string, teammate: Partial<InsertVendorTeammate>): Promise<VendorTeammate | undefined> {
    const result = await this.db.update(schema.vendorTeammates)
      .set(teammate)
      .where(eq(schema.vendorTeammates.id, id))
      .returning();
    return result[0];
  }

  async revokeVendorTeammate(id: string, revokedBy: string): Promise<VendorTeammate | undefined> {
    const result = await this.db.update(schema.vendorTeammates)
      .set({ status: 'revoked', revokedAt: new Date(), revokedBy })
      .where(eq(schema.vendorTeammates.id, id))
      .returning();
    return result[0];
  }

  async getVendorTeammateInvitation(id: string): Promise<VendorTeammateInvitation | undefined> {
    const result = await this.db.select().from(schema.vendorTeammateInvitations)
      .where(eq(schema.vendorTeammateInvitations.id, id));
    return result[0];
  }

  async getVendorTeammateInvitationByToken(token: string): Promise<VendorTeammateInvitation | undefined> {
    const result = await this.db.select().from(schema.vendorTeammateInvitations)
      .where(eq(schema.vendorTeammateInvitations.inviteToken, token));
    return result[0];
  }

  async getVendorTeammateInvitationsByVendor(vendorId: string): Promise<VendorTeammateInvitation[]> {
    return this.db.select().from(schema.vendorTeammateInvitations)
      .where(eq(schema.vendorTeammateInvitations.vendorId, vendorId));
  }

  async createVendorTeammateInvitation(invitation: InsertVendorTeammateInvitation & { inviteToken: string; inviteTokenExpires: Date }): Promise<VendorTeammateInvitation> {
    const result = await this.db.insert(schema.vendorTeammateInvitations).values(invitation).returning();
    return result[0];
  }

  async acceptVendorTeammateInvitation(token: string, userId: string): Promise<{ teammate: VendorTeammate; invitation: VendorTeammateInvitation }> {
    const invitation = await this.getVendorTeammateInvitationByToken(token);
    
    if (!invitation) {
      throw new Error("Invitation not found");
    }
    
    if (invitation.status !== 'pending') {
      throw new Error("Invitation is no longer valid");
    }
    
    if (new Date() > invitation.inviteTokenExpires) {
      await this.db.update(schema.vendorTeammateInvitations)
        .set({ status: 'expired' })
        .where(eq(schema.vendorTeammateInvitations.id, invitation.id));
      throw new Error("Invitation has expired");
    }
    
    // Get the user to get their email
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Create the teammate record
    const teammate = await this.createVendorTeammate({
      vendorId: invitation.vendorId,
      userId,
      email: user.email,
      displayName: invitation.displayName || user.email,
      permissions: invitation.permissions as any,
      status: 'active',
      invitedBy: invitation.invitedBy,
    });
    
    // Update the invitation status
    const updatedInvitation = await this.db.update(schema.vendorTeammateInvitations)
      .set({ status: 'accepted', acceptedAt: new Date() })
      .where(eq(schema.vendorTeammateInvitations.id, invitation.id))
      .returning();
    
    return { teammate, invitation: updatedInvitation[0] };
  }

  async revokeVendorTeammateInvitation(id: string): Promise<VendorTeammateInvitation | undefined> {
    const result = await this.db.update(schema.vendorTeammateInvitations)
      .set({ status: 'revoked' })
      .where(eq(schema.vendorTeammateInvitations.id, id))
      .returning();
    return result[0];
  }

  async hasVendorTeammateAccess(userId: string, vendorId: string, requiredPermission?: string): Promise<boolean> {
    // Check if user is the vendor owner
    const vendor = await this.getVendor(vendorId);
    if (vendor && vendor.userId === userId) {
      return true; // Owner has full access
    }
    
    // Check if user is a teammate
    const teammate = await this.getVendorTeammateByUserAndVendor(userId, vendorId);
    if (!teammate) {
      return false;
    }
    
    // If no specific permission required, just being a teammate is enough
    if (!requiredPermission) {
      return true;
    }
    
    // Check if teammate has the required permission
    return teammate.permissions.includes(requiredPermission);
  }

  // ============================================================================
  // QUOTE REQUESTS
  // ============================================================================

  async createQuoteRequest(quoteRequest: InsertQuoteRequest): Promise<QuoteRequest> {
    const result = await this.db.insert(schema.quoteRequests).values(quoteRequest).returning();
    return result[0];
  }

  async getQuoteRequestsByVendor(vendorId: string): Promise<QuoteRequest[]> {
    return await this.db.select().from(schema.quoteRequests).where(eq(schema.quoteRequests.vendorId, vendorId));
  }

  async getQuoteRequestsByWedding(weddingId: string): Promise<QuoteRequest[]> {
    return await this.db.select().from(schema.quoteRequests).where(eq(schema.quoteRequests.weddingId, weddingId));
  }

  async updateQuoteRequestStatus(id: string, status: string): Promise<QuoteRequest | undefined> {
    const result = await this.db.update(schema.quoteRequests).set({ status }).where(eq(schema.quoteRequests.id, id)).returning();
    return result[0];
  }

  // ============================================================================
  // VENDOR LEADS - Lead qualification and nurturing
  // ============================================================================

  async getVendorLead(id: string): Promise<VendorLead | undefined> {
    const result = await this.db.select().from(schema.vendorLeads).where(eq(schema.vendorLeads.id, id));
    return result[0];
  }

  async getVendorLeadsByVendor(vendorId: string): Promise<VendorLead[]> {
    return await this.db.select().from(schema.vendorLeads)
      .where(eq(schema.vendorLeads.vendorId, vendorId))
      .orderBy(sql`${schema.vendorLeads.createdAt} DESC`);
  }

  async getVendorLeadByWeddingAndVendor(weddingId: string, vendorId: string): Promise<VendorLead | undefined> {
    const result = await this.db.select().from(schema.vendorLeads)
      .where(and(
        eq(schema.vendorLeads.weddingId, weddingId),
        eq(schema.vendorLeads.vendorId, vendorId)
      ));
    return result[0];
  }

  async createVendorLead(lead: InsertVendorLead): Promise<VendorLead> {
    const result = await this.db.insert(schema.vendorLeads).values(lead).returning();
    return result[0];
  }

  async updateVendorLead(id: string, lead: Partial<InsertVendorLead>): Promise<VendorLead | undefined> {
    const result = await this.db.update(schema.vendorLeads)
      .set({ ...lead, updatedAt: new Date() })
      .where(eq(schema.vendorLeads.id, id))
      .returning();
    return result[0];
  }

  async deleteVendorLead(id: string): Promise<boolean> {
    await this.db.delete(schema.vendorLeads).where(eq(schema.vendorLeads.id, id));
    return true;
  }

  // Lead Nurture Sequences
  async getLeadNurtureSequence(id: string): Promise<LeadNurtureSequence | undefined> {
    const result = await this.db.select().from(schema.leadNurtureSequences).where(eq(schema.leadNurtureSequences.id, id));
    return result[0];
  }

  async getLeadNurtureSequencesByVendor(vendorId: string): Promise<LeadNurtureSequence[]> {
    return await this.db.select().from(schema.leadNurtureSequences)
      .where(eq(schema.leadNurtureSequences.vendorId, vendorId));
  }

  async getDefaultNurtureSequence(vendorId: string): Promise<LeadNurtureSequence | undefined> {
    const result = await this.db.select().from(schema.leadNurtureSequences)
      .where(and(
        eq(schema.leadNurtureSequences.vendorId, vendorId),
        eq(schema.leadNurtureSequences.isDefault, true)
      ));
    return result[0];
  }

  async createLeadNurtureSequence(sequence: InsertLeadNurtureSequence): Promise<LeadNurtureSequence> {
    const result = await this.db.insert(schema.leadNurtureSequences).values(sequence).returning();
    return result[0];
  }

  async updateLeadNurtureSequence(id: string, sequence: Partial<InsertLeadNurtureSequence>): Promise<LeadNurtureSequence | undefined> {
    const result = await this.db.update(schema.leadNurtureSequences)
      .set(sequence)
      .where(eq(schema.leadNurtureSequences.id, id))
      .returning();
    return result[0];
  }

  async deleteLeadNurtureSequence(id: string): Promise<boolean> {
    await this.db.delete(schema.leadNurtureSequences).where(eq(schema.leadNurtureSequences.id, id));
    return true;
  }

  // Lead Nurture Steps
  async getLeadNurtureStep(id: string): Promise<LeadNurtureStep | undefined> {
    const result = await this.db.select().from(schema.leadNurtureSteps).where(eq(schema.leadNurtureSteps.id, id));
    return result[0];
  }

  async getLeadNurtureStepsBySequence(sequenceId: string): Promise<LeadNurtureStep[]> {
    return await this.db.select().from(schema.leadNurtureSteps)
      .where(eq(schema.leadNurtureSteps.sequenceId, sequenceId))
      .orderBy(schema.leadNurtureSteps.stepNumber);
  }

  async createLeadNurtureStep(step: InsertLeadNurtureStep): Promise<LeadNurtureStep> {
    const result = await this.db.insert(schema.leadNurtureSteps).values(step).returning();
    return result[0];
  }

  async updateLeadNurtureStep(id: string, step: Partial<InsertLeadNurtureStep>): Promise<LeadNurtureStep | undefined> {
    const result = await this.db.update(schema.leadNurtureSteps)
      .set(step)
      .where(eq(schema.leadNurtureSteps.id, id))
      .returning();
    return result[0];
  }

  async deleteLeadNurtureStep(id: string): Promise<boolean> {
    await this.db.delete(schema.leadNurtureSteps).where(eq(schema.leadNurtureSteps.id, id));
    return true;
  }

  // Lead Nurture Actions
  async getLeadNurtureAction(id: string): Promise<LeadNurtureAction | undefined> {
    const result = await this.db.select().from(schema.leadNurtureActions).where(eq(schema.leadNurtureActions.id, id));
    return result[0];
  }

  async getLeadNurtureActionsByLead(leadId: string): Promise<LeadNurtureAction[]> {
    return await this.db.select().from(schema.leadNurtureActions)
      .where(eq(schema.leadNurtureActions.leadId, leadId))
      .orderBy(schema.leadNurtureActions.scheduledAt);
  }

  async getPendingNurtureActions(beforeDate: Date): Promise<LeadNurtureAction[]> {
    return await this.db.select().from(schema.leadNurtureActions)
      .where(and(
        eq(schema.leadNurtureActions.status, 'pending'),
        sql`${schema.leadNurtureActions.scheduledAt} <= ${beforeDate.toISOString()}`
      ));
  }

  async createLeadNurtureAction(action: InsertLeadNurtureAction): Promise<LeadNurtureAction> {
    const result = await this.db.insert(schema.leadNurtureActions).values(action).returning();
    return result[0];
  }

  async updateLeadNurtureAction(id: string, action: Partial<InsertLeadNurtureAction>): Promise<LeadNurtureAction | undefined> {
    const result = await this.db.update(schema.leadNurtureActions)
      .set(action)
      .where(eq(schema.leadNurtureActions.id, id))
      .returning();
    return result[0];
  }

  // Lead Activity Log
  async getLeadActivityLog(leadId: string): Promise<LeadActivityLog[]> {
    return await this.db.select().from(schema.leadActivityLog)
      .where(eq(schema.leadActivityLog.leadId, leadId))
      .orderBy(sql`${schema.leadActivityLog.performedAt} DESC`);
  }

  async createLeadActivityLog(activity: InsertLeadActivityLog): Promise<LeadActivityLog> {
    const result = await this.db.insert(schema.leadActivityLog).values(activity).returning();
    return result[0];
  }

  // Vendor Claim Staging
  async getVendorClaimStaging(id: string): Promise<VendorClaimStaging | undefined> {
    const result = await this.db.select().from(schema.vendorClaimStaging)
      .where(eq(schema.vendorClaimStaging.id, id));
    return result[0];
  }

  async getVendorClaimStagingByVendor(vendorId: string): Promise<VendorClaimStaging[]> {
    return await this.db.select().from(schema.vendorClaimStaging)
      .where(eq(schema.vendorClaimStaging.vendorId, vendorId))
      .orderBy(sql`${schema.vendorClaimStaging.createdAt} DESC`);
  }

  async getAllPendingVendorClaims(): Promise<VendorClaimStaging[]> {
    return await this.db.select().from(schema.vendorClaimStaging)
      .where(eq(schema.vendorClaimStaging.status, 'pending'))
      .orderBy(sql`${schema.vendorClaimStaging.createdAt} ASC`);
  }

  async createVendorClaimStaging(claim: InsertVendorClaimStaging): Promise<VendorClaimStaging> {
    const result = await this.db.insert(schema.vendorClaimStaging).values(claim).returning();
    return result[0];
  }

  async updateVendorClaimStaging(id: string, claim: Partial<VendorClaimStaging>): Promise<VendorClaimStaging | undefined> {
    const result = await this.db.update(schema.vendorClaimStaging)
      .set(claim)
      .where(eq(schema.vendorClaimStaging.id, id))
      .returning();
    return result[0];
  }

  async deleteVendorClaimStaging(id: string): Promise<boolean> {
    await this.db.delete(schema.vendorClaimStaging)
      .where(eq(schema.vendorClaimStaging.id, id));
    return true;
  }

  // Vendor Approval (Admin)
  async getPendingApprovalVendors(): Promise<Vendor[]> {
    return await this.db.select().from(schema.vendors)
      .where(eq(schema.vendors.approvalStatus, 'pending'))
      .orderBy(sql`${schema.vendors.createdAt} ASC`);
  }

  async approveVendor(id: string, adminId: string, notes?: string): Promise<Vendor | undefined> {
    const result = await this.db.update(schema.vendors)
      .set({
        approvalStatus: 'approved',
        approvalNotes: notes || null,
        approvedBy: adminId,
        approvedAt: new Date(),
        isPublished: true, // Auto-publish when approved
      })
      .where(eq(schema.vendors.id, id))
      .returning();
    return result[0];
  }

  async rejectVendor(id: string, adminId: string, notes?: string): Promise<Vendor | undefined> {
    const result = await this.db.update(schema.vendors)
      .set({
        approvalStatus: 'rejected',
        approvalNotes: notes || null,
        approvedBy: adminId,
        approvedAt: new Date(),
      })
      .where(eq(schema.vendors.id, id))
      .returning();
    return result[0];
  }

  async getApprovedVendors(): Promise<Vendor[]> {
    return await this.db.select().from(schema.vendors)
      .where(eq(schema.vendors.approvalStatus, 'approved'));
  }

  // Guest Collector Links
  async getGuestCollectorLink(id: string): Promise<GuestCollectorLink | undefined> {
    const result = await this.db.select().from(schema.guestCollectorLinks)
      .where(eq(schema.guestCollectorLinks.id, id));
    return result[0];
  }

  async getGuestCollectorLinkByToken(token: string): Promise<GuestCollectorLink | undefined> {
    const result = await this.db.select().from(schema.guestCollectorLinks)
      .where(eq(schema.guestCollectorLinks.token, token));
    return result[0];
  }

  async getGuestCollectorLinksByWedding(weddingId: string): Promise<GuestCollectorLink[]> {
    return await this.db.select().from(schema.guestCollectorLinks)
      .where(eq(schema.guestCollectorLinks.weddingId, weddingId))
      .orderBy(sql`${schema.guestCollectorLinks.createdAt} DESC`);
  }

  async createGuestCollectorLink(link: InsertGuestCollectorLink): Promise<GuestCollectorLink> {
    const token = randomBytes(16).toString('hex');
    const result = await this.db.insert(schema.guestCollectorLinks)
      .values({ ...link, token })
      .returning();
    return result[0];
  }

  async updateGuestCollectorLink(id: string, updates: Partial<InsertGuestCollectorLink>): Promise<GuestCollectorLink | undefined> {
    const result = await this.db.update(schema.guestCollectorLinks)
      .set(updates)
      .where(eq(schema.guestCollectorLinks.id, id))
      .returning();
    return result[0];
  }

  async deleteGuestCollectorLink(id: string): Promise<boolean> {
    await this.db.delete(schema.guestCollectorLinks)
      .where(eq(schema.guestCollectorLinks.id, id));
    return true;
  }

  async deactivateGuestCollectorLink(id: string): Promise<GuestCollectorLink | undefined> {
    const result = await this.db.update(schema.guestCollectorLinks)
      .set({ isActive: false })
      .where(eq(schema.guestCollectorLinks.id, id))
      .returning();
    return result[0];
  }

  // Guest Collector Submissions
  async getGuestCollectorSubmission(id: string): Promise<GuestCollectorSubmission | undefined> {
    const result = await this.db.select().from(schema.guestCollectorSubmissions)
      .where(eq(schema.guestCollectorSubmissions.id, id));
    return result[0] ? normalizeSubmission(result[0]) : undefined;
  }

  async getGuestCollectorSubmissionsByLink(linkId: string): Promise<GuestCollectorSubmission[]> {
    const results = await this.db.select().from(schema.guestCollectorSubmissions)
      .where(eq(schema.guestCollectorSubmissions.collectorLinkId, linkId))
      .orderBy(sql`${schema.guestCollectorSubmissions.createdAt} DESC`);
    return results.map(normalizeSubmission);
  }

  async getGuestCollectorSubmissionsByWedding(weddingId: string, status?: string): Promise<GuestCollectorSubmission[]> {
    if (status) {
      const results = await this.db.select().from(schema.guestCollectorSubmissions)
        .where(and(
          eq(schema.guestCollectorSubmissions.weddingId, weddingId),
          eq(schema.guestCollectorSubmissions.status, status)
        ))
        .orderBy(sql`${schema.guestCollectorSubmissions.createdAt} DESC`);
      return results.map(normalizeSubmission);
    }
    const results = await this.db.select().from(schema.guestCollectorSubmissions)
      .where(eq(schema.guestCollectorSubmissions.weddingId, weddingId))
      .orderBy(sql`${schema.guestCollectorSubmissions.createdAt} DESC`);
    return results.map(normalizeSubmission);
  }

  async createGuestCollectorSubmission(submission: InsertGuestCollectorSubmission): Promise<GuestCollectorSubmission> {
    // Normalize all array/jsonb fields before insert - handle string values from client
    let membersValue = submission.members;
    if (typeof membersValue === 'string') {
      try {
        membersValue = JSON.parse(membersValue as string);
      } catch {
        membersValue = undefined;
      }
    }
    if (!Array.isArray(membersValue) || membersValue.length === 0) {
      membersValue = undefined;
    }
    
    let eventSuggestionsValue = submission.eventSuggestions;
    if (!Array.isArray(eventSuggestionsValue) || eventSuggestionsValue.length === 0) {
      eventSuggestionsValue = undefined;
    }
    
    const normalizedSubmission = {
      ...submission,
      members: membersValue,
      eventSuggestions: eventSuggestionsValue,
    };
    
    const result = await this.db.insert(schema.guestCollectorSubmissions)
      .values(normalizedSubmission as any)
      .returning();
    // Increment submission count on the collector link
    await this.db.update(schema.guestCollectorLinks)
      .set({ submissionCount: sql`submission_count + 1` })
      .where(eq(schema.guestCollectorLinks.id, submission.collectorLinkId));
    return normalizeSubmission(result[0]);
  }

  async approveCollectorSubmission(id: string, reviewerId: string): Promise<{ household: Household; guests: Guest[] }> {
    const submission = await this.getGuestCollectorSubmission(id);
    if (!submission) throw new Error("Submission not found");
    
    // Prevent re-approving an already approved submission (would create duplicate guests)
    if (submission.status === 'approved') {
      throw new Error("Submission has already been approved");
    }
    
    // Get collector link to determine side
    const link = await this.getGuestCollectorLink(submission.collectorLinkId);
    if (!link) throw new Error("Collector link not found");
    
    // Household name is now required
    const householdName = submission.householdName;
    
    // Parse members to determine guest count
    let parsedMembers: Array<{ name: string; email?: string; phone?: string; dietary?: string }> = [];
    if (submission.members) {
      try {
        parsedMembers = typeof submission.members === 'string' 
          ? JSON.parse(submission.members) 
          : (submission.members as any);
      } catch (e) {
        parsedMembers = [];
      }
    }
    
    // Determine maxCount: use members length if available, otherwise use guestCount from submission
    const maxCount = parsedMembers.length > 0 ? parsedMembers.length : (submission.guestCount || 1);
    
    // Create household for the guest (contact info comes from main contact guest)
    const household = await this.createHousehold({
      weddingId: submission.weddingId,
      name: householdName,
      affiliation: link.side as 'bride' | 'groom' | 'mutual',
      relationshipTier: (submission.relationshipTier as any) || 'friend',
      priorityTier: 'should_invite',
      maxCount: maxCount,
      desiDietaryType: (submission.dietaryRestriction as any) || 'none',
    });
    
    const guests: Guest[] = [];
    
    if (parsedMembers.length > 0) {
      // New wizard format with individual members
      for (let i = 0; i < parsedMembers.length; i++) {
        const member = parsedMembers[i];
        if (!member.name?.trim()) continue;
        const isFirstGuest = guests.length === 0;
        const guest = await this.createGuest({
          weddingId: submission.weddingId,
          householdId: household.id,
          name: member.name,
          email: member.email || undefined,
          phone: member.phone || undefined,
          dietaryRestrictions: member.dietary || undefined,
          isMainHouseholdContact: isFirstGuest,
          addressStreet: isFirstGuest ? (submission.contactStreet || undefined) : undefined,
          addressCity: isFirstGuest ? (submission.contactCity || undefined) : undefined,
          addressState: isFirstGuest ? (submission.contactState || undefined) : undefined,
          addressPostalCode: isFirstGuest ? (submission.contactPostalCode || undefined) : undefined,
          addressCountry: isFirstGuest ? (submission.contactCountry || undefined) : undefined,
          side: link.side as 'bride' | 'groom',
          relationshipTier: (submission.relationshipTier as any) || 'friend',
          visibility: 'shared',
          addedBySide: link.side as 'bride' | 'groom',
          consensusStatus: 'pending',
        });
        guests.push(guest);
      }
    } else {
      // Legacy format or count-only mode - create guest count based on guestCount
      const guestCount = submission.guestCount || 1;
      for (let i = 0; i < guestCount; i++) {
        const guestName = i === 0 
          ? (submission.mainContactName || householdName)
          : `${householdName} Guest ${i + 1}`;
        const isFirstGuest = i === 0;
        const guest = await this.createGuest({
          weddingId: submission.weddingId,
          householdId: household.id,
          name: guestName,
          email: isFirstGuest ? (submission.mainContactEmail || undefined) : undefined,
          phone: isFirstGuest ? (submission.mainContactPhone || undefined) : undefined,
          isMainHouseholdContact: isFirstGuest,
          addressStreet: isFirstGuest ? (submission.contactStreet || undefined) : undefined,
          addressCity: isFirstGuest ? (submission.contactCity || undefined) : undefined,
          addressState: isFirstGuest ? (submission.contactState || undefined) : undefined,
          addressPostalCode: isFirstGuest ? (submission.contactPostalCode || undefined) : undefined,
          addressCountry: isFirstGuest ? (submission.contactCountry || undefined) : undefined,
          side: link.side as 'bride' | 'groom',
          relationshipTier: (submission.relationshipTier as any) || 'friend',
          visibility: 'shared',
          addedBySide: link.side as 'bride' | 'groom',
          consensusStatus: 'pending',
        });
        guests.push(guest);
      }
    }
    
    // Create invitations for suggested events and update guest eventIds
    if (submission.eventSuggestions && submission.eventSuggestions.length > 0) {
      for (const guest of guests) {
        for (const eventId of submission.eventSuggestions) {
          try {
            await this.createInvitation({
              guestId: guest.id,
              eventId: eventId,
              rsvpStatus: 'pending',
            });
          } catch (e) {
            // Skip if invitation already exists or event doesn't exist
            console.error('Failed to create invitation:', e);
          }
        }
        // Update guest's eventIds field to match the selected events
        try {
          await this.db.update(schema.guests)
            .set({ eventIds: submission.eventSuggestions })
            .where(eq(schema.guests.id, guest.id));
          // Update local guest object
          (guest as any).eventIds = submission.eventSuggestions;
        } catch (e) {
          console.error('Failed to update guest eventIds:', e);
        }
      }
    }
    
    // Mark submission as approved
    await this.db.update(schema.guestCollectorSubmissions)
      .set({ status: 'approved', reviewedById: reviewerId, reviewedAt: new Date() })
      .where(eq(schema.guestCollectorSubmissions.id, id));
    
    return { household, guests };
  }

  async declineCollectorSubmission(id: string, reviewerId: string): Promise<GuestCollectorSubmission> {
    const result = await this.db.update(schema.guestCollectorSubmissions)
      .set({ status: 'declined', reviewedById: reviewerId, reviewedAt: new Date() })
      .where(eq(schema.guestCollectorSubmissions.id, id))
      .returning();
    return normalizeSubmission(result[0]);
  }

  async markCollectorSubmissionMaybe(id: string, reviewerId: string): Promise<GuestCollectorSubmission> {
    // First verify the submission exists
    const existing = await this.db.select().from(schema.guestCollectorSubmissions)
      .where(eq(schema.guestCollectorSubmissions.id, id));
    
    if (!existing.length) {
      throw new Error(`Submission not found: ${id}`);
    }
    
    // Perform the update
    const result = await this.db.update(schema.guestCollectorSubmissions)
      .set({ status: 'maybe', reviewedById: reviewerId, reviewedAt: new Date() })
      .where(eq(schema.guestCollectorSubmissions.id, id))
      .returning();
    
    if (!result.length) {
      throw new Error(`Failed to update submission: ${id}`);
    }
    
    return normalizeSubmission(result[0]);
  }

  async restoreCollectorSubmission(id: string, targetStatus: 'pending' | 'maybe' | 'approved', reviewerId: string): Promise<GuestCollectorSubmission | { household: Household; guests: Guest[] }> {
    if (targetStatus === 'approved') {
      return await this.approveCollectorSubmission(id, reviewerId);
    }
    
    const result = await this.db.update(schema.guestCollectorSubmissions)
      .set({ status: targetStatus, reviewedById: reviewerId, reviewedAt: new Date() })
      .where(eq(schema.guestCollectorSubmissions.id, id))
      .returning();
    return normalizeSubmission(result[0]);
  }

  async getPendingCollectorSubmissionsCount(weddingId: string): Promise<number> {
    const result = await this.db.select({ count: sql<number>`count(*)` })
      .from(schema.guestCollectorSubmissions)
      .where(and(
        eq(schema.guestCollectorSubmissions.weddingId, weddingId),
        eq(schema.guestCollectorSubmissions.status, 'pending')
      ));
    return Number(result[0]?.count || 0);
  }

  async getCollectorSubmissionsBySession(linkId: string, sessionId: string): Promise<GuestCollectorSubmission[]> {
    const results = await this.db.select().from(schema.guestCollectorSubmissions)
      .where(and(
        eq(schema.guestCollectorSubmissions.collectorLinkId, linkId),
        eq(schema.guestCollectorSubmissions.submissionSessionId, sessionId)
      ))
      .orderBy(sql`${schema.guestCollectorSubmissions.createdAt} DESC`);
    return results.map(normalizeSubmission);
  }

  // Guest Side Management
  async getGuestsBySide(weddingId: string, side: 'bride' | 'groom' | 'mutual'): Promise<Guest[]> {
    return await this.db.select().from(schema.guests)
      .where(and(
        eq(schema.guests.weddingId, weddingId),
        eq(schema.guests.side, side)
      ));
  }

  async getGuestsByVisibility(weddingId: string, visibility: 'private' | 'shared', addedBySide?: 'bride' | 'groom'): Promise<Guest[]> {
    const conditions = [
      eq(schema.guests.weddingId, weddingId),
      eq(schema.guests.visibility, visibility)
    ];
    if (addedBySide) {
      conditions.push(eq(schema.guests.addedBySide, addedBySide));
    }
    return await this.db.select().from(schema.guests)
      .where(and(...conditions));
  }

  async shareGuestsWithPartner(weddingId: string, guestIds: string[]): Promise<Guest[]> {
    if (guestIds.length === 0) return [];
    const result = await this.db.update(schema.guests)
      .set({ visibility: 'shared' })
      .where(and(
        eq(schema.guests.weddingId, weddingId),
        inArray(schema.guests.id, guestIds)
      ))
      .returning();
    return result;
  }

  async updateGuestConsensusStatus(guestIds: string[], status: 'pending' | 'under_discussion' | 'approved' | 'declined' | 'frozen'): Promise<Guest[]> {
    if (guestIds.length === 0) return [];
    const result = await this.db.update(schema.guests)
      .set({ consensusStatus: status })
      .where(inArray(schema.guests.id, guestIds))
      .returning();
    return result;
  }

  async getSideStatistics(weddingId: string): Promise<{ 
    bride: { total: number; private: number; shared: number; byStatus: Record<string, number> }; 
    groom: { total: number; private: number; shared: number; byStatus: Record<string, number> }; 
    mutual: { total: number } 
  }> {
    const guests = await this.getGuestsByWedding(weddingId);
    
    const stats = {
      bride: { total: 0, private: 0, shared: 0, byStatus: {} as Record<string, number> },
      groom: { total: 0, private: 0, shared: 0, byStatus: {} as Record<string, number> },
      mutual: { total: 0 }
    };
    
    for (const guest of guests) {
      if (guest.side === 'bride') {
        stats.bride.total++;
        if (guest.visibility === 'private') stats.bride.private++;
        else stats.bride.shared++;
        const status = guest.consensusStatus || 'approved';
        stats.bride.byStatus[status] = (stats.bride.byStatus[status] || 0) + 1;
      } else if (guest.side === 'groom') {
        stats.groom.total++;
        if (guest.visibility === 'private') stats.groom.private++;
        else stats.groom.shared++;
        const status = guest.consensusStatus || 'approved';
        stats.groom.byStatus[status] = (stats.groom.byStatus[status] || 0) + 1;
      } else {
        stats.mutual.total++;
      }
    }
    
    return stats;
  }

  // Guest Communications
  async getGuestCommunication(id: string): Promise<GuestCommunication | undefined> {
    const result = await this.db.select().from(guestCommunications)
      .where(eq(guestCommunications.id, id));
    return result[0];
  }

  async getGuestCommunicationsByWedding(weddingId: string): Promise<GuestCommunication[]> {
    return await this.db.select().from(guestCommunications)
      .where(eq(guestCommunications.weddingId, weddingId))
      .orderBy(sql`${guestCommunications.createdAt} DESC`);
  }

  async createGuestCommunication(comm: InsertGuestCommunication): Promise<GuestCommunication> {
    const result = await this.db.insert(guestCommunications).values(comm).returning();
    return result[0];
  }

  async updateGuestCommunication(id: string, updates: Partial<GuestCommunication>): Promise<GuestCommunication | undefined> {
    const result = await this.db.update(guestCommunications)
      .set(updates)
      .where(eq(guestCommunications.id, id))
      .returning();
    return result[0];
  }

  async deleteGuestCommunication(id: string): Promise<boolean> {
    const result = await this.db.delete(guestCommunications)
      .where(eq(guestCommunications.id, id));
    return true;
  }

  // Communication Recipients
  async getCommunicationRecipient(id: string): Promise<CommunicationRecipient | undefined> {
    const result = await this.db.select().from(communicationRecipients)
      .where(eq(communicationRecipients.id, id));
    return result[0];
  }

  async getCommunicationRecipientsByCommunication(communicationId: string): Promise<CommunicationRecipient[]> {
    return await this.db.select().from(communicationRecipients)
      .where(eq(communicationRecipients.communicationId, communicationId));
  }

  async createCommunicationRecipient(recipient: InsertCommunicationRecipient): Promise<CommunicationRecipient> {
    const result = await this.db.insert(communicationRecipients).values(recipient).returning();
    return result[0];
  }

  async createCommunicationRecipientsBulk(recipients: InsertCommunicationRecipient[]): Promise<CommunicationRecipient[]> {
    if (recipients.length === 0) return [];
    const result = await this.db.insert(communicationRecipients).values(recipients).returning();
    return result;
  }

  async updateCommunicationRecipient(id: string, updates: Partial<CommunicationRecipient>): Promise<CommunicationRecipient | undefined> {
    const result = await this.db.update(communicationRecipients)
      .set(updates)
      .where(eq(communicationRecipients.id, id))
      .returning();
    return result[0];
  }

  // RSVP Statistics
  async getRsvpStatsByWedding(weddingId: string): Promise<{
    total: number;
    attending: number;
    notAttending: number;
    pending: number;
    byEvent: Array<{
      eventId: string;
      eventName: string;
      attending: number;
      notAttending: number;
      pending: number;
    }>;
  }> {
    // Get all events for this wedding
    const events = await this.getEventsByWedding(weddingId);
    
    // Get all invitations for events in this wedding
    const allInvitations: Invitation[] = [];
    for (const event of events) {
      const invitations = await this.getInvitationsByEvent(event.id);
      allInvitations.push(...invitations);
    }

    // Calculate stats
    const attending = allInvitations.filter(i => i.rsvpStatus === 'attending').length;
    const notAttending = allInvitations.filter(i => i.rsvpStatus === 'not_attending').length;
    const pending = allInvitations.filter(i => i.rsvpStatus === 'pending').length;

    // Calculate per-event stats
    const byEvent = events.map(event => {
      const eventInvitations = allInvitations.filter(i => i.eventId === event.id);
      return {
        eventId: event.id,
        eventName: event.name,
        attending: eventInvitations.filter(i => i.rsvpStatus === 'attending').length,
        notAttending: eventInvitations.filter(i => i.rsvpStatus === 'not_attending').length,
        pending: eventInvitations.filter(i => i.rsvpStatus === 'pending').length,
      };
    });

    return {
      total: allInvitations.length,
      attending,
      notAttending,
      pending,
      byEvent,
    };
  }

  // ============================================================================
  // DUPLICATE DETECTION & MERGING
  // ============================================================================

  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, ' ')
      .trim();
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const s1 = this.normalizeString(str1);
    const s2 = this.normalizeString(str2);
    
    if (s1 === s2) return 1;
    if (!s1 || !s2) return 0;
    
    // Levenshtein distance calculation
    const m = s1.length;
    const n = s2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }
    
    const maxLen = Math.max(m, n);
    return maxLen === 0 ? 1 : 1 - dp[m][n] / maxLen;
  }

  async detectDuplicateHouseholds(weddingId: string): Promise<Array<{
    household1: Household;
    household2: Household;
    guests1: Guest[];
    guests2: Guest[];
    confidence: number;
    matchReasons: string[];
  }>> {
    const households = await this.getHouseholdsByWedding(weddingId);
    const duplicates: Array<{
      household1: Household;
      household2: Household;
      guests1: Guest[];
      guests2: Guest[];
      confidence: number;
      matchReasons: string[];
    }> = [];

    // Get ignored pairs to filter them out
    const ignoredPairs = await this.getIgnoredDuplicatePairs(weddingId);
    const ignoredSet = new Set<string>();
    for (const pair of ignoredPairs) {
      // Store both orderings so we can check either way
      ignoredSet.add(`${pair.householdId1}-${pair.householdId2}`);
      ignoredSet.add(`${pair.householdId2}-${pair.householdId1}`);
    }

    // Get guests for all households
    const householdGuests: Map<string, Guest[]> = new Map();
    for (const household of households) {
      const guests = await this.getGuestsByHousehold(household.id);
      householdGuests.set(household.id, guests);
    }

    // FIRST: Check for duplicate guests WITHIN the same household
    for (const household of households) {
      const guests = householdGuests.get(household.id) || [];
      if (guests.length < 2) continue;
      
      // Compare each pair of guests within the same household
      for (let i = 0; i < guests.length; i++) {
        for (let j = i + 1; j < guests.length; j++) {
          const g1 = guests[i];
          const g2 = guests[j];
          
          const nameSim = this.calculateStringSimilarity(g1.name, g2.name);
          
          // High similarity threshold for same-household duplicates
          if (nameSim >= 0.9) {
            // Create a "virtual" duplicate entry showing the same household twice
            // with the specific duplicate guests highlighted
            duplicates.push({
              household1: household,
              household2: household,
              guests1: [g1],
              guests2: [g2],
              confidence: nameSim,
              matchReasons: [`Duplicate guests within same household: "${g1.name}" and "${g2.name}" (${Math.round(nameSim * 100)}% match)`],
            });
          }
        }
      }
    }

    // SECOND: Compare each pair of different households
    for (let i = 0; i < households.length; i++) {
      for (let j = i + 1; j < households.length; j++) {
        const h1 = households[i];
        const h2 = households[j];
        
        // Skip if this pair was marked as "keep both"
        if (ignoredSet.has(`${h1.id}-${h2.id}`)) {
          continue;
        }
        
        const guests1 = householdGuests.get(h1.id) || [];
        const guests2 = householdGuests.get(h2.id) || [];

        let score = 0;
        const matchReasons: string[] = [];

        // Check exact email match from main contact guests (high confidence: 0.6)
        const mainContact1 = guests1.find(g => g.isMainHouseholdContact) || guests1[0];
        const mainContact2 = guests2.find(g => g.isMainHouseholdContact) || guests2[0];
        if (mainContact1?.email && mainContact2?.email && 
            mainContact1.email.toLowerCase() === mainContact2.email.toLowerCase()) {
          score += 0.6;
          matchReasons.push('Same email address');
        }

        // Check exact phone match from main contact guests (high confidence: 0.5)
        const normalizePhone = (p: string) => p.replace(/\D/g, '').slice(-10);
        if (mainContact1?.phone && mainContact2?.phone &&
            normalizePhone(mainContact1.phone) === normalizePhone(mainContact2.phone)) {
          score += 0.5;
          matchReasons.push('Same phone number');
        }

        // Check household name similarity (higher confidence for exact/near matches)
        const nameSimilarity = this.calculateStringSimilarity(h1.name, h2.name);
        if (nameSimilarity >= 0.95) {
          score += 0.5;
          matchReasons.push(`Nearly identical household names (${Math.round(nameSimilarity * 100)}% match)`);
        } else if (nameSimilarity >= 0.8) {
          score += 0.35;
          matchReasons.push(`Similar household names (${Math.round(nameSimilarity * 100)}% match)`);
        }

        // Check guest name overlaps (higher confidence for matching guests)
        let guestMatchCount = 0;
        let highConfidenceGuestMatches = 0;
        for (const g1 of guests1) {
          for (const g2 of guests2) {
            const guestSim = this.calculateStringSimilarity(g1.name, g2.name);
            if (guestSim >= 0.95) {
              // Near-exact match (e.g., "Rahul Patel" vs "Rahul Patel")
              highConfidenceGuestMatches++;
              guestMatchCount++;
            } else if (guestSim >= 0.8) {
              guestMatchCount++;
            }
          }
        }
        if (highConfidenceGuestMatches > 0) {
          // Near-exact guest name matches get higher weight - can trigger duplicate alone
          const guestScore = Math.min(0.6, highConfidenceGuestMatches * 0.45);
          score += guestScore;
          matchReasons.push(`${highConfidenceGuestMatches} guest name(s) nearly identical`);
        } else if (guestMatchCount > 0) {
          const guestScore = Math.min(0.35, guestMatchCount * 0.2);
          score += guestScore;
          matchReasons.push(`${guestMatchCount} guest name(s) similar`);
        }

        // Only include if score meets threshold
        if (score >= 0.4) {
          duplicates.push({
            household1: h1,
            household2: h2,
            guests1,
            guests2,
            confidence: Math.min(score, 1),
            matchReasons,
          });
        }
      }
    }

    // Sort by confidence descending
    return duplicates.sort((a, b) => b.confidence - a.confidence);
  }

  async mergeHouseholds(
    survivorId: string,
    mergedId: string,
    decision: 'kept_older' | 'kept_newer',
    reviewerId: string
  ): Promise<HouseholdMergeAudit> {
    const survivor = await this.getHousehold(survivorId);
    const merged = await this.getHousehold(mergedId);
    
    if (!survivor || !merged) {
      throw new Error('Household not found');
    }

    const survivorGuests = await this.getGuestsByHousehold(survivorId);
    const mergedGuests = await this.getGuestsByHousehold(mergedId);

    // Get invitations for merged guests
    let invitationsMoved = 0;
    for (const guest of mergedGuests) {
      const invitations = await this.getInvitationsByGuest(guest.id);
      for (const invitation of invitations) {
        // Update guest's household to survivor
        await this.db.update(schema.guests)
          .set({ householdId: survivorId })
          .where(eq(schema.guests.id, guest.id));
        invitationsMoved += invitations.length;
      }
    }

    // Move all guests from merged to survivor
    await this.db.update(schema.guests)
      .set({ householdId: survivorId })
      .where(eq(schema.guests.householdId, mergedId));

    // Merge other info if survivor is missing (contactEmail/phone now stored on guests, not households)
    const updates: Partial<typeof survivor> = {};
    if (!survivor.lifafaAmount && merged.lifafaAmount) {
      updates.lifafaAmount = merged.lifafaAmount;
    }
    if (!survivor.giftDescription && merged.giftDescription) {
      updates.giftDescription = merged.giftDescription;
    }

    if (Object.keys(updates).length > 0) {
      await this.db.update(schema.households)
        .set(updates as any)
        .where(eq(schema.households.id, survivorId));
    }

    // Create audit record
    const auditResult = await this.db.insert(schema.householdMergeAudits)
      .values({
        weddingId: survivor.weddingId,
        survivorHouseholdId: survivorId,
        mergedHouseholdId: mergedId,
        decision,
        survivorSnapshot: survivor as any,
        mergedSnapshot: merged as any,
        guestsMoved: mergedGuests.length,
        invitationsMoved,
        reviewedById: reviewerId,
      })
      .returning();

    // Delete the merged household
    await this.db.delete(schema.households)
      .where(eq(schema.households.id, mergedId));

    return auditResult[0];
  }

  async getHouseholdMergeAudits(weddingId: string): Promise<HouseholdMergeAudit[]> {
    return await this.db.select()
      .from(schema.householdMergeAudits)
      .where(eq(schema.householdMergeAudits.weddingId, weddingId))
      .orderBy(sql`${schema.householdMergeAudits.createdAt} DESC`);
  }

  async ignoreHouseholdDuplicatePair(
    weddingId: string,
    householdId1: string,
    householdId2: string,
    ignoredById: string
  ): Promise<IgnoredDuplicatePair> {
    const result = await this.db.insert(schema.ignoredDuplicatePairs)
      .values({
        weddingId,
        householdId1,
        householdId2,
        ignoredById,
      })
      .returning();
    return result[0];
  }

  async getIgnoredDuplicatePairs(weddingId: string): Promise<IgnoredDuplicatePair[]> {
    return await this.db.select()
      .from(schema.ignoredDuplicatePairs)
      .where(eq(schema.ignoredDuplicatePairs.weddingId, weddingId));
  }

  // ============================================================================
  // GUEST ENGAGEMENT GAMES - Scavenger hunts and trivia
  // ============================================================================

  async getEngagementGame(id: string): Promise<EngagementGame | undefined> {
    const result = await this.db.select()
      .from(schema.engagementGames)
      .where(eq(schema.engagementGames.id, id));
    return result[0];
  }

  async getEngagementGamesByWedding(weddingId: string): Promise<EngagementGame[]> {
    return await this.db.select()
      .from(schema.engagementGames)
      .where(eq(schema.engagementGames.weddingId, weddingId))
      .orderBy(sql`${schema.engagementGames.createdAt} DESC`);
  }

  async getActiveGamesByWedding(weddingId: string): Promise<EngagementGame[]> {
    return await this.db.select()
      .from(schema.engagementGames)
      .where(and(
        eq(schema.engagementGames.weddingId, weddingId),
        eq(schema.engagementGames.status, 'active')
      ))
      .orderBy(sql`${schema.engagementGames.createdAt} DESC`);
  }

  async getGameWithStats(id: string): Promise<GameWithStats | undefined> {
    const game = await this.getEngagementGame(id);
    if (!game) return undefined;

    let challengeCount = 0;
    if (game.gameType === 'scavenger_hunt') {
      const challenges = await this.getScavengerChallengesByGame(id);
      challengeCount = challenges.length;
    } else if (game.gameType === 'trivia') {
      const questions = await this.getTriviaQuestionsByGame(id);
      challengeCount = questions.length;
    }

    const participations = await this.getParticipationsByGame(id);
    const participantCount = participations.length;

    let event: Event | undefined;
    if (game.eventId) {
      event = await this.getEvent(game.eventId);
    }

    return {
      ...game,
      challengeCount,
      participantCount,
      event,
    };
  }

  async createEngagementGame(game: InsertEngagementGame): Promise<EngagementGame> {
    const result = await this.db.insert(schema.engagementGames)
      .values(game)
      .returning();
    return result[0];
  }

  async updateEngagementGame(id: string, game: Partial<InsertEngagementGame>): Promise<EngagementGame | undefined> {
    const result = await this.db.update(schema.engagementGames)
      .set({ ...game, updatedAt: new Date() })
      .where(eq(schema.engagementGames.id, id))
      .returning();
    return result[0];
  }

  async deleteEngagementGame(id: string): Promise<boolean> {
    const result = await this.db.delete(schema.engagementGames)
      .where(eq(schema.engagementGames.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getScavengerChallenge(id: string): Promise<ScavengerChallenge | undefined> {
    const result = await this.db.select()
      .from(schema.scavengerChallenges)
      .where(eq(schema.scavengerChallenges.id, id));
    return result[0];
  }

  async getScavengerChallengesByGame(gameId: string): Promise<ScavengerChallenge[]> {
    return await this.db.select()
      .from(schema.scavengerChallenges)
      .where(eq(schema.scavengerChallenges.gameId, gameId))
      .orderBy(schema.scavengerChallenges.sortOrder);
  }

  async createScavengerChallenge(challenge: InsertScavengerChallenge): Promise<ScavengerChallenge> {
    const result = await this.db.insert(schema.scavengerChallenges)
      .values(challenge)
      .returning();
    return result[0];
  }

  async updateScavengerChallenge(id: string, challenge: Partial<InsertScavengerChallenge>): Promise<ScavengerChallenge | undefined> {
    const result = await this.db.update(schema.scavengerChallenges)
      .set(challenge)
      .where(eq(schema.scavengerChallenges.id, id))
      .returning();
    return result[0];
  }

  async deleteScavengerChallenge(id: string): Promise<boolean> {
    const result = await this.db.delete(schema.scavengerChallenges)
      .where(eq(schema.scavengerChallenges.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async reorderScavengerChallenges(gameId: string, orderedIds: string[]): Promise<ScavengerChallenge[]> {
    for (let i = 0; i < orderedIds.length; i++) {
      await this.db.update(schema.scavengerChallenges)
        .set({ sortOrder: i })
        .where(eq(schema.scavengerChallenges.id, orderedIds[i]));
    }
    return this.getScavengerChallengesByGame(gameId);
  }

  async getTriviaQuestion(id: string): Promise<TriviaQuestion | undefined> {
    const result = await this.db.select()
      .from(schema.triviaQuestions)
      .where(eq(schema.triviaQuestions.id, id));
    return result[0];
  }

  async getTriviaQuestionsByGame(gameId: string): Promise<TriviaQuestion[]> {
    return await this.db.select()
      .from(schema.triviaQuestions)
      .where(eq(schema.triviaQuestions.gameId, gameId))
      .orderBy(schema.triviaQuestions.sortOrder);
  }

  async createTriviaQuestion(question: InsertTriviaQuestion): Promise<TriviaQuestion> {
    const result = await this.db.insert(schema.triviaQuestions)
      .values(question)
      .returning();
    return result[0];
  }

  async updateTriviaQuestion(id: string, question: Partial<InsertTriviaQuestion>): Promise<TriviaQuestion | undefined> {
    const result = await this.db.update(schema.triviaQuestions)
      .set(question)
      .where(eq(schema.triviaQuestions.id, id))
      .returning();
    return result[0];
  }

  async deleteTriviaQuestion(id: string): Promise<boolean> {
    const result = await this.db.delete(schema.triviaQuestions)
      .where(eq(schema.triviaQuestions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async reorderTriviaQuestions(gameId: string, orderedIds: string[]): Promise<TriviaQuestion[]> {
    for (let i = 0; i < orderedIds.length; i++) {
      await this.db.update(schema.triviaQuestions)
        .set({ sortOrder: i })
        .where(eq(schema.triviaQuestions.id, orderedIds[i]));
    }
    return this.getTriviaQuestionsByGame(gameId);
  }

  async getGameParticipation(id: string): Promise<GameParticipation | undefined> {
    const result = await this.db.select()
      .from(schema.gameParticipation)
      .where(eq(schema.gameParticipation.id, id));
    return result[0];
  }

  async getParticipationByGuestAndGame(guestId: string, gameId: string): Promise<GameParticipation | undefined> {
    const result = await this.db.select()
      .from(schema.gameParticipation)
      .where(and(
        eq(schema.gameParticipation.guestId, guestId),
        eq(schema.gameParticipation.gameId, gameId)
      ));
    return result[0];
  }

  async getParticipationsByGame(gameId: string): Promise<GameParticipation[]> {
    return await this.db.select()
      .from(schema.gameParticipation)
      .where(eq(schema.gameParticipation.gameId, gameId))
      .orderBy(sql`${schema.gameParticipation.totalPoints} DESC`);
  }

  async createGameParticipation(participation: InsertGameParticipation): Promise<GameParticipation> {
    const result = await this.db.insert(schema.gameParticipation)
      .values(participation)
      .returning();
    return result[0];
  }

  async updateGameParticipation(id: string, participation: Partial<GameParticipation>): Promise<GameParticipation | undefined> {
    const result = await this.db.update(schema.gameParticipation)
      .set({ ...participation, lastActivityAt: new Date() })
      .where(eq(schema.gameParticipation.id, id))
      .returning();
    return result[0];
  }

  async getLeaderboard(gameId: string, limit: number = 10): Promise<LeaderboardEntry[]> {
    const participations = await this.db.select()
      .from(schema.gameParticipation)
      .where(eq(schema.gameParticipation.gameId, gameId))
      .orderBy(sql`${schema.gameParticipation.totalPoints} DESC`)
      .limit(limit);

    const entries: LeaderboardEntry[] = [];
    for (let i = 0; i < participations.length; i++) {
      const p = participations[i];
      const guest = await this.getGuest(p.guestId);
      let householdName: string | undefined;
      if (p.householdId) {
        const household = await this.getHousehold(p.householdId);
        householdName = household?.name;
      }
      entries.push({
        guestId: p.guestId,
        guestName: guest?.name || 'Unknown Guest',
        householdName,
        totalPoints: p.totalPoints,
        challengesCompleted: p.challengesCompleted,
        rank: i + 1,
      });
    }
    return entries;
  }

  async getScavengerSubmission(id: string): Promise<ScavengerSubmission | undefined> {
    const result = await this.db.select()
      .from(schema.scavengerSubmissions)
      .where(eq(schema.scavengerSubmissions.id, id));
    return result[0];
  }

  async getSubmissionsByChallengeAndGuest(challengeId: string, guestId: string): Promise<ScavengerSubmission[]> {
    return await this.db.select()
      .from(schema.scavengerSubmissions)
      .where(and(
        eq(schema.scavengerSubmissions.challengeId, challengeId),
        eq(schema.scavengerSubmissions.guestId, guestId)
      ));
  }

  async getSubmissionsByChallenge(challengeId: string): Promise<ScavengerSubmission[]> {
    return await this.db.select()
      .from(schema.scavengerSubmissions)
      .where(eq(schema.scavengerSubmissions.challengeId, challengeId))
      .orderBy(sql`${schema.scavengerSubmissions.submittedAt} DESC`);
  }

  async getPendingSubmissionsByGame(gameId: string): Promise<ScavengerSubmission[]> {
    const challenges = await this.getScavengerChallengesByGame(gameId);
    const challengeIds = challenges.map(c => c.id);
    if (challengeIds.length === 0) return [];

    return await this.db.select()
      .from(schema.scavengerSubmissions)
      .where(and(
        inArray(schema.scavengerSubmissions.challengeId, challengeIds),
        eq(schema.scavengerSubmissions.status, 'pending')
      ))
      .orderBy(sql`${schema.scavengerSubmissions.submittedAt} ASC`);
  }

  async createScavengerSubmission(submission: InsertScavengerSubmission): Promise<ScavengerSubmission> {
    const result = await this.db.insert(schema.scavengerSubmissions)
      .values(submission)
      .returning();
    return result[0];
  }

  async reviewScavengerSubmission(
    id: string,
    status: 'approved' | 'rejected',
    reviewerId: string,
    note?: string
  ): Promise<ScavengerSubmission> {
    const submission = await this.getScavengerSubmission(id);
    if (!submission) throw new Error('Submission not found');

    let pointsAwarded = 0;
    if (status === 'approved') {
      const challenge = await this.getScavengerChallenge(submission.challengeId);
      pointsAwarded = challenge?.points || 0;

      // Update participation
      const participation = await this.getGameParticipation(submission.participationId);
      if (participation) {
        await this.updateGameParticipation(participation.id, {
          totalPoints: participation.totalPoints + pointsAwarded,
          challengesCompleted: participation.challengesCompleted + 1,
        });
      }
    }

    const result = await this.db.update(schema.scavengerSubmissions)
      .set({
        status,
        pointsAwarded,
        reviewedById: reviewerId,
        reviewNote: note,
        reviewedAt: new Date(),
      })
      .where(eq(schema.scavengerSubmissions.id, id))
      .returning();
    return result[0];
  }

  async getTriviaAnswer(id: string): Promise<TriviaAnswer | undefined> {
    const result = await this.db.select()
      .from(schema.triviaAnswers)
      .where(eq(schema.triviaAnswers.id, id));
    return result[0];
  }

  async getAnswersByQuestionAndGuest(questionId: string, guestId: string): Promise<TriviaAnswer | undefined> {
    const result = await this.db.select()
      .from(schema.triviaAnswers)
      .where(and(
        eq(schema.triviaAnswers.questionId, questionId),
        eq(schema.triviaAnswers.guestId, guestId)
      ));
    return result[0];
  }

  async getAnswersByParticipation(participationId: string): Promise<TriviaAnswer[]> {
    return await this.db.select()
      .from(schema.triviaAnswers)
      .where(eq(schema.triviaAnswers.participationId, participationId))
      .orderBy(sql`${schema.triviaAnswers.answeredAt} ASC`);
  }

  async createTriviaAnswer(answer: InsertTriviaAnswer): Promise<TriviaAnswer> {
    // Check if already answered
    const existing = await this.getAnswersByQuestionAndGuest(answer.questionId, answer.guestId);
    if (existing) {
      throw new Error('Question already answered');
    }

    // Insert answer
    const result = await this.db.insert(schema.triviaAnswers)
      .values(answer)
      .returning();

    // Update participation points if correct
    if (answer.isCorrect && answer.pointsAwarded > 0) {
      const participation = await this.getGameParticipation(answer.participationId);
      if (participation) {
        await this.updateGameParticipation(participation.id, {
          totalPoints: participation.totalPoints + answer.pointsAwarded,
          challengesCompleted: participation.challengesCompleted + 1,
        });
      }
    }

    return result[0];
  }

  // Budget Alerts
  async getBudgetAlert(id: string): Promise<BudgetAlert | undefined> {
    const result = await this.db.select()
      .from(budgetAlerts)
      .where(eq(budgetAlerts.id, id));
    return result[0];
  }

  async getBudgetAlertsByWedding(weddingId: string): Promise<BudgetAlert[]> {
    return await this.db.select()
      .from(budgetAlerts)
      .where(eq(budgetAlerts.weddingId, weddingId))
      .orderBy(sql`${budgetAlerts.createdAt} DESC`);
  }

  async createBudgetAlert(alert: InsertBudgetAlert): Promise<BudgetAlert> {
    const result = await this.db.insert(budgetAlerts)
      .values(alert)
      .returning();
    return result[0];
  }

  async updateBudgetAlert(id: string, alert: Partial<InsertBudgetAlert>): Promise<BudgetAlert | undefined> {
    const result = await this.db.update(budgetAlerts)
      .set(alert)
      .where(eq(budgetAlerts.id, id))
      .returning();
    return result[0];
  }

  async deleteBudgetAlert(id: string): Promise<boolean> {
    await this.db.delete(budgetAlerts)
      .where(eq(budgetAlerts.id, id));
    return true;
  }

  async getTriggeredAlerts(weddingId: string): Promise<BudgetAlert[]> {
    return await this.db.select()
      .from(budgetAlerts)
      .where(and(
        eq(budgetAlerts.weddingId, weddingId),
        eq(budgetAlerts.isTriggered, true),
        eq(budgetAlerts.isEnabled, true)
      ))
      .orderBy(sql`${budgetAlerts.triggeredAt} DESC`);
  }

  // Dashboard Widgets
  async getDashboardWidget(id: string): Promise<DashboardWidget | undefined> {
    const result = await this.db.select()
      .from(dashboardWidgets)
      .where(eq(dashboardWidgets.id, id));
    return result[0];
  }

  async getDashboardWidgetsByWedding(weddingId: string): Promise<DashboardWidget[]> {
    return await this.db.select()
      .from(dashboardWidgets)
      .where(eq(dashboardWidgets.weddingId, weddingId))
      .orderBy(sql`${dashboardWidgets.position} ASC`);
  }

  async createDashboardWidget(widget: InsertDashboardWidget): Promise<DashboardWidget> {
    const result = await this.db.insert(dashboardWidgets)
      .values(widget)
      .returning();
    return result[0];
  }

  async updateDashboardWidget(id: string, widget: Partial<InsertDashboardWidget>): Promise<DashboardWidget | undefined> {
    const result = await this.db.update(dashboardWidgets)
      .set({ ...widget, updatedAt: new Date() })
      .where(eq(dashboardWidgets.id, id))
      .returning();
    return result[0];
  }

  async deleteDashboardWidget(id: string): Promise<boolean> {
    await this.db.delete(dashboardWidgets)
      .where(eq(dashboardWidgets.id, id));
    return true;
  }

  async updateDashboardWidgetPositions(widgetIds: string[], positions: number[]): Promise<DashboardWidget[]> {
    const results: DashboardWidget[] = [];
    for (let i = 0; i < widgetIds.length; i++) {
      const result = await this.db.update(dashboardWidgets)
        .set({ position: positions[i], updatedAt: new Date() })
        .where(eq(dashboardWidgets.id, widgetIds[i]))
        .returning();
      if (result[0]) results.push(result[0]);
    }
    return results;
  }

  // Ceremony Types (uses ceremony_templates table with 'tradition' field)
  // Accepts either ceremonyId (slug like 'sikh_maiyan') or id (UUID)
  async getCeremonyType(ceremonyId: string): Promise<CeremonyType | undefined> {
    const result = await this.db.select()
      .from(ceremonyTypes)
      .where(or(
        eq(ceremonyTypes.ceremonyId, ceremonyId),
        eq(ceremonyTypes.id, ceremonyId)
      ));
    return result[0];
  }

  async getCeremonyTypesByTradition(tradition: string): Promise<CeremonyType[]> {
    return await this.db.select()
      .from(ceremonyTypes)
      .where(eq(ceremonyTypes.tradition, tradition))
      .orderBy(sql`${ceremonyTypes.displayOrder} ASC`);
  }

  async getCeremonyTypesByTraditionId(traditionId: string): Promise<CeremonyType[]> {
    return await this.db.select()
      .from(ceremonyTypes)
      .where(eq(ceremonyTypes.traditionId, traditionId))
      .orderBy(sql`${ceremonyTypes.displayOrder} ASC`);
  }

  async getAllCeremonyTypes(): Promise<CeremonyType[]> {
    return await this.db.select()
      .from(ceremonyTypes)
      .orderBy(sql`${ceremonyTypes.tradition} ASC, ${ceremonyTypes.displayOrder} ASC`);
  }

  async createCeremonyType(template: InsertCeremonyType): Promise<CeremonyType> {
    // Resolve tradition slug to UUID for the new FK column
    let traditionId = template.traditionId;
    if (!traditionId && template.tradition) {
      const tradition = await this.getWeddingTraditionBySlug(template.tradition);
      if (tradition) {
        traditionId = tradition.id;
      }
    }
    
    const result = await this.db.insert(ceremonyTypes)
      .values({
        ...template,
        traditionId,
      })
      .returning();
    return result[0];
  }

  async updateCeremonyType(ceremonyId: string, data: Partial<InsertCeremonyType>): Promise<CeremonyType | undefined> {
    // Resolve tradition slug to UUID for the new FK column if tradition is being updated
    let traditionId = data.traditionId;
    if (!traditionId && data.tradition) {
      const tradition = await this.getWeddingTraditionBySlug(data.tradition);
      if (tradition) {
        traditionId = tradition.id;
      }
    }
    
    const result = await this.db.update(ceremonyTypes)
      .set({
        ...data,
        ...(traditionId ? { traditionId } : {}),
      })
      .where(eq(ceremonyTypes.ceremonyId, ceremonyId))
      .returning();
    return result[0];
  }

  async deleteCeremonyType(ceremonyId: string): Promise<boolean> {
    await this.db.delete(ceremonyTypes)
      .where(eq(ceremonyTypes.ceremonyId, ceremonyId));
    return true;
  }

  // Ceremony Budget Categories (junction: ceremony type + budget bucket)
  // Returns system templates (weddingId = NULL) plus any wedding-specific custom items
  async getCeremonyBudgetCategoriesByCeremonyTypeId(ceremonyTypeId: string, weddingId?: string | null): Promise<CeremonyBudgetCategory[]> {
    const weddingFilter = weddingId
      ? or(
          isNull(ceremonyBudgetCategories.weddingId),
          eq(ceremonyBudgetCategories.weddingId, weddingId)
        )
      : isNull(ceremonyBudgetCategories.weddingId);
    
    return await this.db.select()
      .from(ceremonyBudgetCategories)
      .where(and(
        eq(ceremonyBudgetCategories.ceremonyTypeId, ceremonyTypeId),
        eq(ceremonyBudgetCategories.isActive, true),
        weddingFilter
      ))
      .orderBy(sql`${ceremonyBudgetCategories.displayOrder} ASC`);
  }

  async getCeremonyBudgetCategoriesByBucket(budgetBucketId: string): Promise<CeremonyBudgetCategory[]> {
    return await this.db.select()
      .from(ceremonyBudgetCategories)
      .where(and(
        eq(ceremonyBudgetCategories.budgetBucketId, budgetBucketId),
        eq(ceremonyBudgetCategories.isActive, true)
      ))
      .orderBy(sql`${ceremonyBudgetCategories.displayOrder} ASC`);
  }

  async getAllCeremonyBudgetCategories(): Promise<CeremonyBudgetCategory[]> {
    // Returns only system templates (weddingId is NULL)
    return await this.db.select()
      .from(ceremonyBudgetCategories)
      .where(and(
        eq(ceremonyBudgetCategories.isActive, true),
        isNull(ceremonyBudgetCategories.weddingId)
      ))
      .orderBy(sql`${ceremonyBudgetCategories.ceremonyTypeId} ASC, ${ceremonyBudgetCategories.displayOrder} ASC`);
  }

  async getAllCeremonyBudgetCategoriesForWedding(weddingId: string): Promise<CeremonyBudgetCategory[]> {
    // Returns only wedding-specific custom items (weddingId matches)
    return await this.db.select()
      .from(ceremonyBudgetCategories)
      .where(and(
        eq(ceremonyBudgetCategories.isActive, true),
        eq(ceremonyBudgetCategories.weddingId, weddingId)
      ))
      .orderBy(sql`${ceremonyBudgetCategories.ceremonyTypeId} ASC, ${ceremonyBudgetCategories.displayOrder} ASC`);
  }

  async getCeremonyBudgetCategory(id: string): Promise<CeremonyBudgetCategory | undefined> {
    const result = await this.db.select()
      .from(ceremonyBudgetCategories)
      .where(eq(ceremonyBudgetCategories.id, id));
    return result[0];
  }

  async createCeremonyBudgetCategory(item: InsertCeremonyBudgetCategory): Promise<CeremonyBudgetCategory> {
    // Ensure we have a valid ceremonyTypeId - required by NOT NULL constraint
    if (!item.ceremonyTypeId) {
      throw new Error("ceremonyTypeId is required");
    }
    
    const result = await this.db.insert(ceremonyBudgetCategories).values(item).returning();
    return result[0];
  }

  async updateCeremonyBudgetCategory(id: string, item: Partial<InsertCeremonyBudgetCategory>): Promise<CeremonyBudgetCategory | undefined> {
    const result = await this.db.update(ceremonyBudgetCategories)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(ceremonyBudgetCategories.id, id))
      .returning();
    return result[0];
  }

  async deleteCeremonyBudgetCategory(id: string): Promise<boolean> {
    await this.db.delete(ceremonyBudgetCategories)
      .where(eq(ceremonyBudgetCategories.id, id));
    return true;
  }

  // Wedding Line Items (couple's customized budget line items)
  async getWeddingLineItems(weddingId: string): Promise<WeddingLineItem[]> {
    return await this.db.select()
      .from(weddingLineItems)
      .where(eq(weddingLineItems.weddingId, weddingId))
      .orderBy(sql`${weddingLineItems.createdAt} ASC`);
  }

  async getWeddingLineItemsByCeremony(weddingId: string, ceremonyId: string): Promise<WeddingLineItem[]> {
    return await this.db.select()
      .from(weddingLineItems)
      .where(and(
        eq(weddingLineItems.weddingId, weddingId),
        eq(weddingLineItems.ceremonyId, ceremonyId)
      ))
      .orderBy(sql`${weddingLineItems.createdAt} ASC`);
  }

  async getWeddingLineItem(id: string): Promise<WeddingLineItem | undefined> {
    const result = await this.db.select()
      .from(weddingLineItems)
      .where(eq(weddingLineItems.id, id));
    return result[0];
  }

  async createWeddingLineItem(item: InsertWeddingLineItem): Promise<WeddingLineItem> {
    const result = await this.db.insert(weddingLineItems).values(item).returning();
    return result[0];
  }

  async updateWeddingLineItem(id: string, item: Partial<InsertWeddingLineItem>): Promise<WeddingLineItem | undefined> {
    const result = await this.db.update(weddingLineItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(weddingLineItems.id, id))
      .returning();
    return result[0];
  }

  async deleteWeddingLineItem(id: string): Promise<boolean> {
    await this.db.delete(weddingLineItems)
      .where(eq(weddingLineItems.id, id));
    return true;
  }

  async hydrateWeddingLineItemsFromTemplate(weddingId: string, ceremonyId: string, templateId: string): Promise<WeddingLineItem[]> {
    // Get template items - templateId is the ceremony_types.id UUID
    const templateItems = await this.getCeremonyBudgetCategoriesByCeremonyTypeId(templateId);
    
    // Create wedding line items from template
    const createdItems: WeddingLineItem[] = [];
    for (const item of templateItems) {
      const newItem = await this.createWeddingLineItem({
        weddingId,
        ceremonyId,
        label: item.itemName,
        bucket: item.budgetBucket as any,
        targetAmount: item.highCost, // Use high cost as default target
        isSystemGenerated: true,
        sourceTemplateItemId: item.id,
        notes: item.notes || undefined,
      });
      createdItems.push(newItem);
    }
    
    return createdItems;
  }

  // Regional Pricing
  async getRegionalPricing(city: string): Promise<RegionalPricing | undefined> {
    const result = await this.db.select()
      .from(regionalPricing)
      .where(eq(regionalPricing.city, city));
    return result[0];
  }

  async getAllRegionalPricing(): Promise<RegionalPricing[]> {
    return await this.db.select()
      .from(regionalPricing)
      .orderBy(sql`${regionalPricing.city} ASC`);
  }

  async createRegionalPricing(pricing: InsertRegionalPricing): Promise<RegionalPricing> {
    const result = await this.db.insert(regionalPricing)
      .values(pricing)
      .returning();
    return result[0];
  }

  async updateRegionalPricing(city: string, pricing: Partial<InsertRegionalPricing>): Promise<RegionalPricing | undefined> {
    const result = await this.db.update(regionalPricing)
      .set(pricing)
      .where(eq(regionalPricing.city, city))
      .returning();
    return result[0];
  }

  // Budget Categories (dynamic system categories)
  async getBudgetCategory(id: string): Promise<BudgetCategory | undefined> {
    const result = await this.db.select()
      .from(schema.budgetCategories)
      .where(eq(schema.budgetCategories.id, id));
    return result[0];
  }

  async getBudgetCategoryBySlug(slug: string): Promise<BudgetCategory | undefined> {
    const result = await this.db.select()
      .from(schema.budgetCategories)
      .where(eq(schema.budgetCategories.slug, slug));
    return result[0];
  }

  async getAllBudgetCategories(): Promise<BudgetCategory[]> {
    return await this.db.select()
      .from(schema.budgetCategories)
      .orderBy(sql`${schema.budgetCategories.displayOrder} ASC`);
  }

  async getActiveBudgetCategories(): Promise<BudgetCategory[]> {
    return await this.db.select()
      .from(schema.budgetCategories)
      .where(eq(schema.budgetCategories.isActive, true))
      .orderBy(sql`${schema.budgetCategories.displayOrder} ASC`);
  }

  async createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory> {
    const result = await this.db.insert(schema.budgetCategories)
      .values(category)
      .returning();
    return result[0];
  }

  async updateBudgetCategory(id: string, category: Partial<InsertBudgetCategory>): Promise<BudgetCategory | undefined> {
    const result = await this.db.update(schema.budgetCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(schema.budgetCategories.id, id))
      .returning();
    return result[0];
  }

  async deleteBudgetCategory(id: string): Promise<boolean> {
    // Check if category exists
    const existing = await this.getBudgetCategory(id);
    if (!existing) {
      return false; // Category not found
    }
    
    // Don't allow deleting system categories
    if (existing.isSystemCategory) {
      throw new Error('Cannot delete system categories');
    }
    
    await this.db.delete(schema.budgetCategories)
      .where(eq(schema.budgetCategories.id, id));
    return true;
  }

  async seedBudgetCategories(): Promise<BudgetCategory[]> {
    const seededCategories: BudgetCategory[] = [];
    
    // Seed from DEFAULT_CATEGORY_METADATA
    for (const [id, metadata] of Object.entries(schema.DEFAULT_CATEGORY_METADATA)) {
      // Check if category already exists
      const existing = await this.getBudgetCategory(id);
      if (existing) {
        seededCategories.push(existing);
        continue;
      }
      
      const category = await this.createBudgetCategory({
        id,
        displayName: metadata.displayName,
        description: metadata.description,
        iconName: metadata.iconName,
        isEssential: metadata.isEssential,
        suggestedPercentage: metadata.suggestedPercentage,
        displayOrder: metadata.displayOrder,
        isActive: true,
        isSystemCategory: true, // System categories can't be deleted
      });
      seededCategories.push(category);
    }
    
    return seededCategories;
  }

  // Wedding Traditions (data-driven tradition system)
  async getWeddingTradition(id: string): Promise<WeddingTradition | undefined> {
    const result = await this.db.select()
      .from(weddingTraditions)
      .where(eq(weddingTraditions.id, id));
    return result[0];
  }

  async getAllWeddingTraditions(): Promise<WeddingTradition[]> {
    return await this.db.select()
      .from(weddingTraditions)
      .orderBy(sql`${weddingTraditions.displayOrder} ASC`);
  }

  async getActiveWeddingTraditions(): Promise<WeddingTradition[]> {
    return await this.db.select()
      .from(weddingTraditions)
      .where(eq(weddingTraditions.isActive, true))
      .orderBy(sql`${weddingTraditions.displayOrder} ASC`);
  }

  async createWeddingTradition(tradition: InsertWeddingTradition): Promise<WeddingTradition> {
    const result = await this.db.insert(weddingTraditions)
      .values(tradition)
      .returning();
    return result[0];
  }

  async updateWeddingTradition(id: string, tradition: Partial<InsertWeddingTradition>): Promise<WeddingTradition | undefined> {
    const result = await this.db.update(weddingTraditions)
      .set({ ...tradition, updatedAt: new Date() })
      .where(eq(weddingTraditions.id, id))
      .returning();
    return result[0];
  }

  async deleteWeddingTradition(id: string): Promise<boolean> {
    const existing = await this.getWeddingTradition(id);
    if (!existing) {
      return false;
    }
    
    // Don't allow deleting system traditions
    if (existing.isSystemTradition) {
      throw new Error('Cannot delete system traditions');
    }
    
    await this.db.delete(weddingTraditions)
      .where(eq(weddingTraditions.id, id));
    return true;
  }

  async getWeddingTraditionBySlug(slug: string): Promise<WeddingTradition | undefined> {
    const result = await this.db.select()
      .from(weddingTraditions)
      .where(eq(weddingTraditions.slug, slug));
    return result[0];
  }

  async seedWeddingTraditions(): Promise<WeddingTradition[]> {
    const seededTraditions: WeddingTradition[] = [];
    
    for (const traditionData of DEFAULT_TRADITIONS) {
      // Check by slug (new approach)
      const existing = await this.getWeddingTraditionBySlug(traditionData.slug);
      if (existing) {
        seededTraditions.push(existing);
        continue;
      }
      
      const tradition = await this.createWeddingTradition({
        slug: traditionData.slug,
        displayName: traditionData.displayName,
        description: traditionData.description,
        displayOrder: traditionData.displayOrder,
        isActive: true,
        isSystemTradition: true,
      });
      seededTraditions.push(tradition);
    }
    
    return seededTraditions;
  }

  // Wedding Sub-Traditions (regional variations)
  async getWeddingSubTradition(id: string): Promise<WeddingSubTradition | undefined> {
    const result = await this.db.select()
      .from(weddingSubTraditions)
      .where(eq(weddingSubTraditions.id, id));
    return result[0];
  }

  async getWeddingSubTraditionsByTradition(traditionId: string): Promise<WeddingSubTradition[]> {
    return await this.db.select()
      .from(weddingSubTraditions)
      .where(eq(weddingSubTraditions.traditionId, traditionId))
      .orderBy(sql`${weddingSubTraditions.displayOrder} ASC`);
  }

  async getAllWeddingSubTraditions(): Promise<WeddingSubTradition[]> {
    return await this.db.select()
      .from(weddingSubTraditions)
      .orderBy(sql`${weddingSubTraditions.displayOrder} ASC`);
  }

  async getActiveWeddingSubTraditions(): Promise<WeddingSubTradition[]> {
    return await this.db.select()
      .from(weddingSubTraditions)
      .where(eq(weddingSubTraditions.isActive, true))
      .orderBy(sql`${weddingSubTraditions.displayOrder} ASC`);
  }

  async createWeddingSubTradition(subTradition: InsertWeddingSubTradition): Promise<WeddingSubTradition> {
    const result = await this.db.insert(weddingSubTraditions)
      .values(subTradition)
      .returning();
    return result[0];
  }

  async updateWeddingSubTradition(id: string, subTradition: Partial<InsertWeddingSubTradition>): Promise<WeddingSubTradition | undefined> {
    const result = await this.db.update(weddingSubTraditions)
      .set({ ...subTradition, updatedAt: new Date() })
      .where(eq(weddingSubTraditions.id, id))
      .returning();
    return result[0];
  }

  async deleteWeddingSubTradition(id: string): Promise<boolean> {
    const existing = await this.getWeddingSubTradition(id);
    if (!existing) {
      return false;
    }
    
    await this.db.delete(weddingSubTraditions)
      .where(eq(weddingSubTraditions.id, id));
    return true;
  }

  async getWeddingSubTraditionBySlug(slug: string): Promise<WeddingSubTradition | undefined> {
    const result = await this.db.select()
      .from(weddingSubTraditions)
      .where(eq(weddingSubTraditions.slug, slug));
    return result[0];
  }

  async seedWeddingSubTraditions(): Promise<WeddingSubTradition[]> {
    const seededSubTraditions: WeddingSubTradition[] = [];
    
    for (const subTraditionData of DEFAULT_SUB_TRADITIONS) {
      // Check by slug (new approach)
      const existing = await this.getWeddingSubTraditionBySlug(subTraditionData.slug);
      if (existing) {
        seededSubTraditions.push(existing);
        continue;
      }
      
      // Resolve parent tradition UUID from slug
      const parentTradition = await this.getWeddingTraditionBySlug(subTraditionData.traditionSlug);
      if (!parentTradition) {
        console.warn(`Parent tradition ${subTraditionData.traditionSlug} not found for sub-tradition ${subTraditionData.slug}`);
        continue;
      }
      
      const subTradition = await this.createWeddingSubTradition({
        slug: subTraditionData.slug,
        traditionId: parentTradition.id, // Use the UUID of the parent tradition
        displayName: subTraditionData.displayName,
        description: subTraditionData.description,
        displayOrder: subTraditionData.displayOrder,
        isActive: true,
      });
      seededSubTraditions.push(subTradition);
    }
    
    return seededSubTraditions;
  }

  // Vendor Categories (database-driven)
  async getVendorCategory(id: string): Promise<VendorCategory | undefined> {
    const result = await this.db.select()
      .from(vendorCategories)
      .where(eq(vendorCategories.id, id));
    return result[0];
  }

  async getVendorCategoryBySlug(slug: string): Promise<VendorCategory | undefined> {
    const result = await this.db.select()
      .from(vendorCategories)
      .where(eq(vendorCategories.slug, slug));
    return result[0];
  }

  async getAllVendorCategories(): Promise<VendorCategory[]> {
    return await this.db.select()
      .from(vendorCategories)
      .orderBy(sql`${vendorCategories.displayOrder} ASC, ${vendorCategories.displayName} ASC`);
  }

  async getActiveVendorCategories(): Promise<VendorCategory[]> {
    return await this.db.select()
      .from(vendorCategories)
      .where(eq(vendorCategories.isActive, true))
      .orderBy(sql`${vendorCategories.displayOrder} ASC, ${vendorCategories.displayName} ASC`);
  }

  async getVendorCategoriesByTradition(tradition: string): Promise<VendorCategory[]> {
    return await this.db.select()
      .from(vendorCategories)
      .where(and(
        eq(vendorCategories.isActive, true),
        sql`${vendorCategories.traditionAffinity} && ARRAY[${tradition}]::text[]`
      ))
      .orderBy(sql`${vendorCategories.displayOrder} ASC, ${vendorCategories.displayName} ASC`);
  }

  async createVendorCategory(category: InsertVendorCategory): Promise<VendorCategory> {
    const result = await this.db.insert(vendorCategories)
      .values(category)
      .returning();
    return result[0];
  }

  async updateVendorCategory(id: string, category: Partial<InsertVendorCategory>): Promise<VendorCategory | undefined> {
    const result = await this.db.update(vendorCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(vendorCategories.id, id))
      .returning();
    return result[0];
  }

  async deleteVendorCategory(id: string): Promise<boolean> {
    await this.db.delete(vendorCategories)
      .where(eq(vendorCategories.id, id));
    return true;
  }

  async seedVendorCategories(): Promise<VendorCategory[]> {
    const seeded: VendorCategory[] = [];
    for (const categoryData of DEFAULT_VENDOR_CATEGORIES) {
      const existing = await this.getVendorCategoryBySlug(categoryData.slug);
      if (existing) {
        seeded.push(existing);
        continue;
      }
      const category = await this.createVendorCategory({
        slug: categoryData.slug,
        displayName: categoryData.displayName,
        description: categoryData.description,
        iconName: categoryData.iconName,
        budgetBucketSlug: categoryData.budgetBucketSlug,
        traditionAffinity: categoryData.traditionAffinity,
        displayOrder: categoryData.displayOrder,
        isActive: true,
        isSystemCategory: true,
      });
      seeded.push(category);
    }
    return seeded;
  }

  // Pricing Regions (database-driven city pricing multipliers)
  async getPricingRegion(id: string): Promise<PricingRegion | undefined> {
    const result = await this.db.select()
      .from(pricingRegions)
      .where(eq(pricingRegions.id, id));
    return result[0];
  }

  async getPricingRegionBySlug(slug: string): Promise<PricingRegion | undefined> {
    const result = await this.db.select()
      .from(pricingRegions)
      .where(eq(pricingRegions.slug, slug));
    return result[0];
  }

  async getAllPricingRegions(): Promise<PricingRegion[]> {
    return await this.db.select()
      .from(pricingRegions)
      .orderBy(sql`${pricingRegions.displayOrder} ASC, ${pricingRegions.displayName} ASC`);
  }

  async getActivePricingRegions(): Promise<PricingRegion[]> {
    return await this.db.select()
      .from(pricingRegions)
      .where(eq(pricingRegions.isActive, true))
      .orderBy(sql`${pricingRegions.displayOrder} ASC, ${pricingRegions.displayName} ASC`);
  }

  async createPricingRegion(region: InsertPricingRegion): Promise<PricingRegion> {
    const result = await this.db.insert(pricingRegions)
      .values(region)
      .returning();
    return result[0];
  }

  async updatePricingRegion(id: string, region: Partial<InsertPricingRegion>): Promise<PricingRegion | undefined> {
    const result = await this.db.update(pricingRegions)
      .set({ ...region, updatedAt: new Date() })
      .where(eq(pricingRegions.id, id))
      .returning();
    return result[0];
  }

  async deletePricingRegion(id: string): Promise<boolean> {
    await this.db.delete(pricingRegions)
      .where(eq(pricingRegions.id, id));
    return true;
  }

  async seedPricingRegions(): Promise<PricingRegion[]> {
    const seeded: PricingRegion[] = [];
    for (const regionData of DEFAULT_PRICING_REGIONS) {
      const existing = await this.getPricingRegionBySlug(regionData.slug);
      if (existing) {
        seeded.push(existing);
        continue;
      }
      const region = await this.createPricingRegion({
        slug: regionData.slug,
        displayName: regionData.displayName,
        description: regionData.description,
        multiplier: regionData.multiplier,
        state: regionData.state,
        displayOrder: regionData.displayOrder,
        isActive: true,
        isSystemRegion: true,
      });
      seeded.push(region);
    }
    return seeded;
  }

  // Metro Areas (database-driven)
  async getMetroArea(id: string): Promise<MetroArea | undefined> {
    const result = await this.db.select()
      .from(schema.metroAreas)
      .where(eq(schema.metroAreas.id, id));
    return result[0];
  }

  async getMetroAreaBySlug(slug: string): Promise<MetroArea | undefined> {
    const result = await this.db.select()
      .from(schema.metroAreas)
      .where(eq(schema.metroAreas.slug, slug));
    return result[0];
  }

  async getMetroAreaByValue(value: string): Promise<MetroArea | undefined> {
    const result = await this.db.select()
      .from(schema.metroAreas)
      .where(eq(schema.metroAreas.value, value));
    return result[0];
  }

  async getAllMetroAreas(): Promise<MetroArea[]> {
    return await this.db.select()
      .from(schema.metroAreas)
      .orderBy(sql`${schema.metroAreas.displayOrder} ASC, ${schema.metroAreas.label} ASC`);
  }

  async getActiveMetroAreas(): Promise<MetroArea[]> {
    return await this.db.select()
      .from(schema.metroAreas)
      .where(eq(schema.metroAreas.isActive, true))
      .orderBy(sql`${schema.metroAreas.displayOrder} ASC, ${schema.metroAreas.label} ASC`);
  }

  async createMetroArea(area: InsertMetroArea): Promise<MetroArea> {
    const result = await this.db.insert(schema.metroAreas)
      .values(area)
      .returning();
    return result[0];
  }

  async updateMetroArea(id: string, area: Partial<InsertMetroArea>): Promise<MetroArea | undefined> {
    const result = await this.db.update(schema.metroAreas)
      .set({ ...area, updatedAt: new Date() })
      .where(eq(schema.metroAreas.id, id))
      .returning();
    return result[0];
  }

  async deleteMetroArea(id: string): Promise<boolean> {
    await this.db.delete(schema.metroAreas)
      .where(eq(schema.metroAreas.id, id));
    return true;
  }

  // Favour Categories (database-driven)
  async getFavourCategory(id: string): Promise<FavourCategory | undefined> {
    const result = await this.db.select()
      .from(favourCategories)
      .where(eq(favourCategories.id, id));
    return result[0];
  }

  async getFavourCategoryBySlug(slug: string): Promise<FavourCategory | undefined> {
    const result = await this.db.select()
      .from(favourCategories)
      .where(eq(favourCategories.slug, slug));
    return result[0];
  }

  async getAllFavourCategories(): Promise<FavourCategory[]> {
    return await this.db.select()
      .from(favourCategories)
      .orderBy(sql`${favourCategories.displayOrder} ASC, ${favourCategories.displayName} ASC`);
  }

  async getActiveFavourCategories(): Promise<FavourCategory[]> {
    return await this.db.select()
      .from(favourCategories)
      .where(eq(favourCategories.isActive, true))
      .orderBy(sql`${favourCategories.displayOrder} ASC, ${favourCategories.displayName} ASC`);
  }

  async getFavourCategoriesByTradition(tradition: string): Promise<FavourCategory[]> {
    return await this.db.select()
      .from(favourCategories)
      .where(and(
        eq(favourCategories.isActive, true),
        or(
          sql`${favourCategories.traditionAffinity} && ARRAY[${tradition}]::text[]`,
          sql`array_length(${favourCategories.traditionAffinity}, 1) IS NULL OR array_length(${favourCategories.traditionAffinity}, 1) = 0`
        )
      ))
      .orderBy(sql`${favourCategories.displayOrder} ASC, ${favourCategories.displayName} ASC`);
  }

  async createFavourCategory(category: InsertFavourCategory): Promise<FavourCategory> {
    const result = await this.db.insert(favourCategories)
      .values(category)
      .returning();
    return result[0];
  }

  async updateFavourCategory(id: string, category: Partial<InsertFavourCategory>): Promise<FavourCategory | undefined> {
    const result = await this.db.update(favourCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(favourCategories.id, id))
      .returning();
    return result[0];
  }

  async deleteFavourCategory(id: string): Promise<boolean> {
    await this.db.delete(favourCategories)
      .where(eq(favourCategories.id, id));
    return true;
  }

  // Decor Categories (database-driven)
  async getDecorCategory(id: string): Promise<DecorCategory | undefined> {
    const result = await this.db.select()
      .from(decorCategories)
      .where(eq(decorCategories.id, id));
    return result[0];
  }

  async getDecorCategoryBySlug(slug: string): Promise<DecorCategory | undefined> {
    const result = await this.db.select()
      .from(decorCategories)
      .where(eq(decorCategories.slug, slug));
    return result[0];
  }

  async getAllDecorCategories(): Promise<DecorCategory[]> {
    return await this.db.select()
      .from(decorCategories)
      .orderBy(sql`${decorCategories.displayOrder} ASC, ${decorCategories.displayName} ASC`);
  }

  async getActiveDecorCategories(): Promise<DecorCategory[]> {
    return await this.db.select()
      .from(decorCategories)
      .where(eq(decorCategories.isActive, true))
      .orderBy(sql`${decorCategories.displayOrder} ASC, ${decorCategories.displayName} ASC`);
  }

  async createDecorCategory(category: InsertDecorCategory): Promise<DecorCategory> {
    const result = await this.db.insert(decorCategories)
      .values(category)
      .returning();
    return result[0];
  }

  async updateDecorCategory(id: string, category: Partial<InsertDecorCategory>): Promise<DecorCategory | undefined> {
    const result = await this.db.update(decorCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(decorCategories.id, id))
      .returning();
    return result[0];
  }

  async deleteDecorCategory(id: string): Promise<boolean> {
    await this.db.delete(decorCategories)
      .where(eq(decorCategories.id, id));
    return true;
  }

  // Decor Item Templates (database-driven)
  async getDecorItemTemplate(id: string): Promise<DecorItemTemplate | undefined> {
    const result = await this.db.select()
      .from(decorItemTemplates)
      .where(eq(decorItemTemplates.id, id));
    return result[0];
  }

  async getDecorItemTemplatesByCategory(categoryId: string): Promise<DecorItemTemplate[]> {
    return await this.db.select()
      .from(decorItemTemplates)
      .where(and(
        eq(decorItemTemplates.categoryId, categoryId),
        eq(decorItemTemplates.isActive, true)
      ))
      .orderBy(sql`${decorItemTemplates.displayOrder} ASC, ${decorItemTemplates.itemName} ASC`);
  }

  async getDecorItemTemplatesByTradition(tradition: string): Promise<DecorItemTemplate[]> {
    return await this.db.select()
      .from(decorItemTemplates)
      .where(and(
        eq(decorItemTemplates.isActive, true),
        or(
          sql`${decorItemTemplates.traditionAffinity} && ARRAY[${tradition}]::text[]`,
          sql`array_length(${decorItemTemplates.traditionAffinity}, 1) IS NULL OR array_length(${decorItemTemplates.traditionAffinity}, 1) = 0`
        )
      ))
      .orderBy(sql`${decorItemTemplates.displayOrder} ASC, ${decorItemTemplates.itemName} ASC`);
  }

  async getAllDecorItemTemplates(): Promise<DecorItemTemplate[]> {
    return await this.db.select()
      .from(decorItemTemplates)
      .orderBy(sql`${decorItemTemplates.displayOrder} ASC, ${decorItemTemplates.itemName} ASC`);
  }

  async getActiveDecorItemTemplates(): Promise<DecorItemTemplate[]> {
    return await this.db.select()
      .from(decorItemTemplates)
      .where(eq(decorItemTemplates.isActive, true))
      .orderBy(sql`${decorItemTemplates.displayOrder} ASC, ${decorItemTemplates.itemName} ASC`);
  }

  async createDecorItemTemplate(template: InsertDecorItemTemplate): Promise<DecorItemTemplate> {
    const result = await this.db.insert(decorItemTemplates)
      .values(template)
      .returning();
    return result[0];
  }

  async updateDecorItemTemplate(id: string, template: Partial<InsertDecorItemTemplate>): Promise<DecorItemTemplate | undefined> {
    const result = await this.db.update(decorItemTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(decorItemTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteDecorItemTemplate(id: string): Promise<boolean> {
    await this.db.delete(decorItemTemplates)
      .where(eq(decorItemTemplates.id, id));
    return true;
  }

  // Honeymoon Budget Categories (database-driven)
  async getHoneymoonBudgetCategory(id: string): Promise<HoneymoonBudgetCategory | undefined> {
    const result = await this.db.select()
      .from(honeymoonBudgetCategories)
      .where(eq(honeymoonBudgetCategories.id, id));
    return result[0];
  }

  async getHoneymoonBudgetCategoryBySlug(slug: string): Promise<HoneymoonBudgetCategory | undefined> {
    const result = await this.db.select()
      .from(honeymoonBudgetCategories)
      .where(eq(honeymoonBudgetCategories.slug, slug));
    return result[0];
  }

  async getAllHoneymoonBudgetCategories(): Promise<HoneymoonBudgetCategory[]> {
    return await this.db.select()
      .from(honeymoonBudgetCategories)
      .orderBy(sql`${honeymoonBudgetCategories.displayOrder} ASC, ${honeymoonBudgetCategories.displayName} ASC`);
  }

  async getActiveHoneymoonBudgetCategories(): Promise<HoneymoonBudgetCategory[]> {
    return await this.db.select()
      .from(honeymoonBudgetCategories)
      .where(eq(honeymoonBudgetCategories.isActive, true))
      .orderBy(sql`${honeymoonBudgetCategories.displayOrder} ASC, ${honeymoonBudgetCategories.displayName} ASC`);
  }

  async createHoneymoonBudgetCategory(category: InsertHoneymoonBudgetCategory): Promise<HoneymoonBudgetCategory> {
    const result = await this.db.insert(honeymoonBudgetCategories)
      .values(category)
      .returning();
    return result[0];
  }

  async updateHoneymoonBudgetCategory(id: string, category: Partial<InsertHoneymoonBudgetCategory>): Promise<HoneymoonBudgetCategory | undefined> {
    const result = await this.db.update(honeymoonBudgetCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(honeymoonBudgetCategories.id, id))
      .returning();
    return result[0];
  }

  async deleteHoneymoonBudgetCategory(id: string): Promise<boolean> {
    await this.db.delete(honeymoonBudgetCategories)
      .where(eq(honeymoonBudgetCategories.id, id));
    return true;
  }

  // Dietary Options (database-driven)
  async getDietaryOption(id: string): Promise<DietaryOption | undefined> {
    const result = await this.db.select()
      .from(dietaryOptions)
      .where(eq(dietaryOptions.id, id));
    return result[0];
  }

  async getDietaryOptionBySlug(slug: string): Promise<DietaryOption | undefined> {
    const result = await this.db.select()
      .from(dietaryOptions)
      .where(eq(dietaryOptions.slug, slug));
    return result[0];
  }

  async getAllDietaryOptions(): Promise<DietaryOption[]> {
    return await this.db.select()
      .from(dietaryOptions)
      .orderBy(sql`${dietaryOptions.displayOrder} ASC, ${dietaryOptions.displayName} ASC`);
  }

  async getActiveDietaryOptions(): Promise<DietaryOption[]> {
    return await this.db.select()
      .from(dietaryOptions)
      .where(eq(dietaryOptions.isActive, true))
      .orderBy(sql`${dietaryOptions.displayOrder} ASC, ${dietaryOptions.displayName} ASC`);
  }

  async getDietaryOptionsByTradition(tradition: string): Promise<DietaryOption[]> {
    return await this.db.select()
      .from(dietaryOptions)
      .where(and(
        eq(dietaryOptions.isActive, true),
        or(
          sql`${dietaryOptions.traditionAffinity} && ARRAY[${tradition}]::text[]`,
          sql`array_length(${dietaryOptions.traditionAffinity}, 1) IS NULL OR array_length(${dietaryOptions.traditionAffinity}, 1) = 0`
        )
      ))
      .orderBy(sql`${dietaryOptions.displayOrder} ASC, ${dietaryOptions.displayName} ASC`);
  }

  async createDietaryOption(option: InsertDietaryOption): Promise<DietaryOption> {
    const result = await this.db.insert(dietaryOptions)
      .values(option)
      .returning();
    return result[0];
  }

  async updateDietaryOption(id: string, option: Partial<InsertDietaryOption>): Promise<DietaryOption | undefined> {
    const result = await this.db.update(dietaryOptions)
      .set({ ...option, updatedAt: new Date() })
      .where(eq(dietaryOptions.id, id))
      .returning();
    return result[0];
  }

  async deleteDietaryOption(id: string): Promise<boolean> {
    await this.db.delete(dietaryOptions)
      .where(eq(dietaryOptions.id, id));
    return true;
  }

  // Milni Relation Options (database-driven)
  async getMilniRelationOption(id: string): Promise<MilniRelationOption | undefined> {
    const result = await this.db.select()
      .from(milniRelationOptions)
      .where(eq(milniRelationOptions.id, id));
    return result[0];
  }

  async getMilniRelationOptionBySlug(slug: string): Promise<MilniRelationOption | undefined> {
    const result = await this.db.select()
      .from(milniRelationOptions)
      .where(eq(milniRelationOptions.slug, slug));
    return result[0];
  }

  async getAllMilniRelationOptions(): Promise<MilniRelationOption[]> {
    return await this.db.select()
      .from(milniRelationOptions)
      .orderBy(sql`${milniRelationOptions.displayOrder} ASC, ${milniRelationOptions.displayName} ASC`);
  }

  async getActiveMilniRelationOptions(): Promise<MilniRelationOption[]> {
    return await this.db.select()
      .from(milniRelationOptions)
      .where(eq(milniRelationOptions.isActive, true))
      .orderBy(sql`${milniRelationOptions.displayOrder} ASC, ${milniRelationOptions.displayName} ASC`);
  }

  async getMilniRelationOptionsByTradition(tradition: string): Promise<MilniRelationOption[]> {
    return await this.db.select()
      .from(milniRelationOptions)
      .where(and(
        eq(milniRelationOptions.isActive, true),
        or(
          sql`${milniRelationOptions.traditionAffinity} && ARRAY[${tradition}]::text[]`,
          sql`array_length(${milniRelationOptions.traditionAffinity}, 1) IS NULL OR array_length(${milniRelationOptions.traditionAffinity}, 1) = 0`
        )
      ))
      .orderBy(sql`${milniRelationOptions.displayOrder} ASC, ${milniRelationOptions.displayName} ASC`);
  }

  async createMilniRelationOption(option: InsertMilniRelationOption): Promise<MilniRelationOption> {
    const result = await this.db.insert(milniRelationOptions)
      .values(option)
      .returning();
    return result[0];
  }

  async updateMilniRelationOption(id: string, option: Partial<InsertMilniRelationOption>): Promise<MilniRelationOption | undefined> {
    const result = await this.db.update(milniRelationOptions)
      .set({ ...option, updatedAt: new Date() })
      .where(eq(milniRelationOptions.id, id))
      .returning();
    return result[0];
  }

  async deleteMilniRelationOption(id: string): Promise<boolean> {
    await this.db.delete(milniRelationOptions)
      .where(eq(milniRelationOptions.id, id));
    return true;
  }

  // Milni Pair Templates (database-driven)
  async getMilniPairTemplate(id: string): Promise<MilniPairTemplate | undefined> {
    const result = await this.db.select()
      .from(milniPairTemplates)
      .where(eq(milniPairTemplates.id, id));
    return result[0];
  }

  async getAllMilniPairTemplates(): Promise<MilniPairTemplate[]> {
    return await this.db.select()
      .from(milniPairTemplates)
      .orderBy(sql`${milniPairTemplates.sequence} ASC`);
  }

  async getActiveMilniPairTemplates(): Promise<MilniPairTemplate[]> {
    return await this.db.select()
      .from(milniPairTemplates)
      .where(eq(milniPairTemplates.isActive, true))
      .orderBy(sql`${milniPairTemplates.sequence} ASC`);
  }

  async getMilniPairTemplatesByTradition(tradition: string): Promise<MilniPairTemplate[]> {
    return await this.db.select()
      .from(milniPairTemplates)
      .where(and(
        eq(milniPairTemplates.isActive, true),
        or(
          sql`${milniPairTemplates.traditionAffinity} && ARRAY[${tradition}]::text[]`,
          sql`array_length(${milniPairTemplates.traditionAffinity}, 1) IS NULL OR array_length(${milniPairTemplates.traditionAffinity}, 1) = 0`
        )
      ))
      .orderBy(sql`${milniPairTemplates.sequence} ASC`);
  }

  async createMilniPairTemplate(template: InsertMilniPairTemplate): Promise<MilniPairTemplate> {
    const result = await this.db.insert(milniPairTemplates)
      .values(template)
      .returning();
    return result[0];
  }

  async updateMilniPairTemplate(id: string, template: Partial<InsertMilniPairTemplate>): Promise<MilniPairTemplate | undefined> {
    const result = await this.db.update(milniPairTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(milniPairTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteMilniPairTemplate(id: string): Promise<boolean> {
    await this.db.delete(milniPairTemplates)
      .where(eq(milniPairTemplates.id, id));
    return true;
  }

  // Timeline Templates (database-driven)
  async getTimelineTemplate(id: string): Promise<TimelineTemplate | undefined> {
    const result = await this.db.select()
      .from(timelineTemplates)
      .where(eq(timelineTemplates.id, id));
    return result[0];
  }

  async getAllTimelineTemplates(): Promise<TimelineTemplate[]> {
    return await this.db.select()
      .from(timelineTemplates)
      .orderBy(sql`${timelineTemplates.sortOrder} ASC`);
  }

  async getActiveTimelineTemplates(): Promise<TimelineTemplate[]> {
    return await this.db.select()
      .from(timelineTemplates)
      .where(eq(timelineTemplates.isActive, true))
      .orderBy(sql`${timelineTemplates.sortOrder} ASC`);
  }

  async getTimelineTemplatesByTradition(tradition: string): Promise<TimelineTemplate[]> {
    return await this.db.select()
      .from(timelineTemplates)
      .where(and(
        eq(timelineTemplates.isActive, true),
        eq(timelineTemplates.tradition, tradition)
      ))
      .orderBy(sql`${timelineTemplates.sortOrder} ASC`);
  }

  async createTimelineTemplate(template: InsertTimelineTemplate): Promise<TimelineTemplate> {
    const result = await this.db.insert(timelineTemplates)
      .values(template)
      .returning();
    return result[0];
  }

  async updateTimelineTemplate(id: string, template: Partial<InsertTimelineTemplate>): Promise<TimelineTemplate | undefined> {
    const result = await this.db.update(timelineTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(timelineTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteTimelineTemplate(id: string): Promise<boolean> {
    await this.db.delete(timelineTemplates)
      .where(eq(timelineTemplates.id, id));
    return true;
  }

  // Vendor Task Categories (database-driven)
  async getVendorTaskCategory(id: string): Promise<VendorTaskCategory | undefined> {
    const result = await this.db.select()
      .from(vendorTaskCategories)
      .where(eq(vendorTaskCategories.id, id));
    return result[0];
  }

  async getVendorTaskCategoryBySlug(slug: string): Promise<VendorTaskCategory | undefined> {
    const result = await this.db.select()
      .from(vendorTaskCategories)
      .where(eq(vendorTaskCategories.slug, slug));
    return result[0];
  }

  async getAllVendorTaskCategories(): Promise<VendorTaskCategory[]> {
    return await this.db.select()
      .from(vendorTaskCategories)
      .orderBy(sql`${vendorTaskCategories.displayOrder} ASC, ${vendorTaskCategories.displayName} ASC`);
  }

  async getActiveVendorTaskCategories(): Promise<VendorTaskCategory[]> {
    return await this.db.select()
      .from(vendorTaskCategories)
      .where(eq(vendorTaskCategories.isActive, true))
      .orderBy(sql`${vendorTaskCategories.displayOrder} ASC, ${vendorTaskCategories.displayName} ASC`);
  }

  async getVendorTaskCategoriesByTradition(tradition: string): Promise<VendorTaskCategory[]> {
    return await this.db.select()
      .from(vendorTaskCategories)
      .where(and(
        eq(vendorTaskCategories.isActive, true),
        or(
          sql`${vendorTaskCategories.traditionAffinity} && ARRAY[${tradition}]::text[]`,
          sql`array_length(${vendorTaskCategories.traditionAffinity}, 1) IS NULL OR array_length(${vendorTaskCategories.traditionAffinity}, 1) = 0`
        )
      ))
      .orderBy(sql`${vendorTaskCategories.displayOrder} ASC, ${vendorTaskCategories.displayName} ASC`);
  }

  async createVendorTaskCategory(category: InsertVendorTaskCategory): Promise<VendorTaskCategory> {
    const result = await this.db.insert(vendorTaskCategories)
      .values(category)
      .returning();
    return result[0];
  }

  async updateVendorTaskCategory(id: string, category: Partial<InsertVendorTaskCategory>): Promise<VendorTaskCategory | undefined> {
    const result = await this.db.update(vendorTaskCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(vendorTaskCategories.id, id))
      .returning();
    return result[0];
  }

  async deleteVendorTaskCategory(id: string): Promise<boolean> {
    await this.db.delete(vendorTaskCategories)
      .where(eq(vendorTaskCategories.id, id));
    return true;
  }

  // Ritual Role Assignments
  async getRitualRoleAssignment(id: string): Promise<RitualRoleAssignment | undefined> {
    const result = await this.db.select()
      .from(ritualRoleAssignments)
      .where(eq(ritualRoleAssignments.id, id));
    return result[0];
  }

  async getRitualRolesByWedding(weddingId: string): Promise<RitualRoleAssignment[]> {
    return await this.db.select()
      .from(ritualRoleAssignments)
      .where(eq(ritualRoleAssignments.weddingId, weddingId))
      .orderBy(sql`${ritualRoleAssignments.createdAt} ASC`);
  }

  async getRitualRolesByEvent(eventId: string): Promise<RitualRoleAssignment[]> {
    return await this.db.select()
      .from(ritualRoleAssignments)
      .where(eq(ritualRoleAssignments.eventId, eventId))
      .orderBy(sql`${ritualRoleAssignments.priority} DESC, ${ritualRoleAssignments.createdAt} ASC`);
  }

  async getRitualRolesByGuest(guestId: string): Promise<RitualRoleAssignment[]> {
    return await this.db.select()
      .from(ritualRoleAssignments)
      .where(eq(ritualRoleAssignments.guestId, guestId))
      .orderBy(sql`${ritualRoleAssignments.createdAt} ASC`);
  }

  async createRitualRoleAssignment(assignment: InsertRitualRoleAssignment): Promise<RitualRoleAssignment> {
    const result = await this.db.insert(ritualRoleAssignments)
      .values(assignment)
      .returning();
    return result[0];
  }

  async updateRitualRoleAssignment(id: string, assignment: Partial<InsertRitualRoleAssignment>): Promise<RitualRoleAssignment | undefined> {
    const result = await this.db.update(ritualRoleAssignments)
      .set({ ...assignment, updatedAt: new Date() })
      .where(eq(ritualRoleAssignments.id, id))
      .returning();
    return result[0];
  }

  async deleteRitualRoleAssignment(id: string): Promise<boolean> {
    await this.db.delete(ritualRoleAssignments)
      .where(eq(ritualRoleAssignments.id, id));
    return true;
  }

  async acknowledgeRitualRole(id: string): Promise<RitualRoleAssignment | undefined> {
    const result = await this.db.update(ritualRoleAssignments)
      .set({ status: "acknowledged", acknowledgedAt: new Date(), updatedAt: new Date() })
      .where(eq(ritualRoleAssignments.id, id))
      .returning();
    return result[0];
  }

  async markRitualRoleNotificationSent(id: string): Promise<RitualRoleAssignment | undefined> {
    const result = await this.db.update(ritualRoleAssignments)
      .set({ notificationSent: true, notificationSentAt: new Date(), updatedAt: new Date() })
      .where(eq(ritualRoleAssignments.id, id))
      .returning();
    return result[0];
  }

  // Ritual Role Templates (database-driven)
  async getRitualRoleTemplate(id: string): Promise<RitualRoleTemplate | undefined> {
    const result = await this.db.select()
      .from(ritualRoleTemplates)
      .where(eq(ritualRoleTemplates.id, id));
    return result[0];
  }

  async getRitualRoleTemplatesByCeremony(ceremonySlug: string): Promise<RitualRoleTemplate[]> {
    return await this.db.select()
      .from(ritualRoleTemplates)
      .where(and(
        eq(ritualRoleTemplates.ceremonySlug, ceremonySlug),
        eq(ritualRoleTemplates.isActive, true)
      ))
      .orderBy(sql`${ritualRoleTemplates.displayOrder} ASC, ${ritualRoleTemplates.createdAt} ASC`);
  }

  async getAllRitualRoleTemplates(): Promise<RitualRoleTemplate[]> {
    return await this.db.select()
      .from(ritualRoleTemplates)
      .orderBy(sql`${ritualRoleTemplates.ceremonySlug} ASC, ${ritualRoleTemplates.displayOrder} ASC`);
  }

  async getActiveRitualRoleTemplates(): Promise<RitualRoleTemplate[]> {
    return await this.db.select()
      .from(ritualRoleTemplates)
      .where(eq(ritualRoleTemplates.isActive, true))
      .orderBy(sql`${ritualRoleTemplates.ceremonySlug} ASC, ${ritualRoleTemplates.displayOrder} ASC`);
  }

  async createRitualRoleTemplate(template: InsertRitualRoleTemplate): Promise<RitualRoleTemplate> {
    const result = await this.db.insert(ritualRoleTemplates)
      .values(template)
      .returning();
    return result[0];
  }

  async updateRitualRoleTemplate(id: string, template: Partial<InsertRitualRoleTemplate>): Promise<RitualRoleTemplate | undefined> {
    const result = await this.db.update(ritualRoleTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(ritualRoleTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteRitualRoleTemplate(id: string): Promise<boolean> {
    await this.db.delete(ritualRoleTemplates)
      .where(eq(ritualRoleTemplates.id, id));
    return true;
  }

  async seedRitualRoleTemplates(): Promise<RitualRoleTemplate[]> {
    const existingTemplates = await this.getAllRitualRoleTemplates();
    if (existingTemplates.length > 0) {
      return existingTemplates;
    }

    const templatesToInsert: InsertRitualRoleTemplate[] = [];
    for (const [ceremonySlug, roles] of Object.entries(RITUAL_ROLE_TEMPLATES)) {
      roles.forEach((role, index) => {
        templatesToInsert.push({
          ceremonySlug,
          roleName: role.roleName,
          roleDisplayName: role.roleDisplayName,
          description: role.description,
          instructions: role.instructions,
          timing: role.timing,
          priority: role.priority,
          displayOrder: index,
          isActive: true,
        });
      });
    }

    if (templatesToInsert.length > 0) {
      const result = await this.db.insert(ritualRoleTemplates)
        .values(templatesToInsert)
        .returning();
      return result;
    }
    return [];
  }

  // Milni Lists - Sikh/Punjabi wedding pairing ceremony
  async getMilniList(id: string): Promise<MilniList | undefined> {
    const result = await this.db.select()
      .from(milniLists)
      .where(eq(milniLists.id, id));
    return result[0];
  }

  async getMilniListsByWedding(weddingId: string): Promise<MilniList[]> {
    return await this.db.select()
      .from(milniLists)
      .where(eq(milniLists.weddingId, weddingId))
      .orderBy(milniLists.createdAt);
  }

  async getMilniListWithDetails(id: string): Promise<MilniListWithDetails | undefined> {
    const list = await this.getMilniList(id);
    if (!list) return undefined;

    const participants = await this.getMilniParticipantsByList(id);
    const pairs = await this.getMilniPairsWithParticipants(id);
    
    let event: Event | undefined;
    if (list.eventId) {
      event = await this.getEvent(list.eventId);
    }

    return {
      ...list,
      pairs,
      participants,
      event,
    };
  }

  async createMilniList(list: InsertMilniList): Promise<MilniList> {
    const result = await this.db.insert(milniLists)
      .values(list)
      .returning();
    return result[0];
  }

  async updateMilniList(id: string, list: Partial<InsertMilniList>): Promise<MilniList | undefined> {
    const result = await this.db.update(milniLists)
      .set({ ...list, updatedAt: new Date() })
      .where(eq(milniLists.id, id))
      .returning();
    return result[0];
  }

  async deleteMilniList(id: string): Promise<boolean> {
    // Delete all pairs and participants first
    await this.db.delete(milniPairs).where(eq(milniPairs.milniListId, id));
    await this.db.delete(milniParticipants).where(eq(milniParticipants.milniListId, id));
    await this.db.delete(milniLists).where(eq(milniLists.id, id));
    return true;
  }

  // Milni Participants
  async getMilniParticipant(id: string): Promise<MilniParticipant | undefined> {
    const result = await this.db.select()
      .from(milniParticipants)
      .where(eq(milniParticipants.id, id));
    return result[0];
  }

  async getMilniParticipantsByList(milniListId: string): Promise<MilniParticipant[]> {
    return await this.db.select()
      .from(milniParticipants)
      .where(eq(milniParticipants.milniListId, milniListId))
      .orderBy(milniParticipants.createdAt);
  }

  async getMilniParticipantsBySide(milniListId: string, side: 'bride' | 'groom'): Promise<MilniParticipant[]> {
    return await this.db.select()
      .from(milniParticipants)
      .where(and(
        eq(milniParticipants.milniListId, milniListId),
        eq(milniParticipants.side, side)
      ))
      .orderBy(milniParticipants.createdAt);
  }

  async createMilniParticipant(participant: InsertMilniParticipant): Promise<MilniParticipant> {
    const result = await this.db.insert(milniParticipants)
      .values(participant)
      .returning();
    return result[0];
  }

  async updateMilniParticipant(id: string, participant: Partial<InsertMilniParticipant>): Promise<MilniParticipant | undefined> {
    const result = await this.db.update(milniParticipants)
      .set(participant)
      .where(eq(milniParticipants.id, id))
      .returning();
    return result[0];
  }

  async deleteMilniParticipant(id: string): Promise<boolean> {
    // Also remove from any pairs
    await this.db.update(milniPairs)
      .set({ brideParticipantId: null })
      .where(eq(milniPairs.brideParticipantId, id));
    await this.db.update(milniPairs)
      .set({ groomParticipantId: null })
      .where(eq(milniPairs.groomParticipantId, id));
    
    await this.db.delete(milniParticipants)
      .where(eq(milniParticipants.id, id));
    return true;
  }

  // Milni Pairs
  async getMilniPair(id: string): Promise<MilniPair | undefined> {
    const result = await this.db.select()
      .from(milniPairs)
      .where(eq(milniPairs.id, id));
    return result[0];
  }

  async getMilniPairsByList(milniListId: string): Promise<MilniPair[]> {
    return await this.db.select()
      .from(milniPairs)
      .where(eq(milniPairs.milniListId, milniListId))
      .orderBy(milniPairs.sequence);
  }

  async getMilniPairsWithParticipants(milniListId: string): Promise<MilniPairWithParticipants[]> {
    const pairs = await this.getMilniPairsByList(milniListId);
    const participants = await this.getMilniParticipantsByList(milniListId);
    
    const participantMap = new Map(participants.map(p => [p.id, p]));
    
    return pairs.map(pair => ({
      ...pair,
      brideParticipant: pair.brideParticipantId ? participantMap.get(pair.brideParticipantId) || null : null,
      groomParticipant: pair.groomParticipantId ? participantMap.get(pair.groomParticipantId) || null : null,
    }));
  }

  async createMilniPair(pair: InsertMilniPair): Promise<MilniPair> {
    // Auto-assign sequence if not provided
    if (pair.sequence === undefined || pair.sequence === null) {
      const existingPairs = await this.getMilniPairsByList(pair.milniListId);
      pair.sequence = existingPairs.length;
    }
    
    const result = await this.db.insert(milniPairs)
      .values(pair)
      .returning();
    return result[0];
  }

  async updateMilniPair(id: string, pair: Partial<InsertMilniPair>): Promise<MilniPair | undefined> {
    const result = await this.db.update(milniPairs)
      .set({ ...pair, updatedAt: new Date() })
      .where(eq(milniPairs.id, id))
      .returning();
    return result[0];
  }

  async deleteMilniPair(id: string): Promise<boolean> {
    await this.db.delete(milniPairs)
      .where(eq(milniPairs.id, id));
    return true;
  }

  async reorderMilniPairs(milniListId: string, pairIds: string[]): Promise<MilniPair[]> {
    // Update sequence for each pair based on position in array
    const updates = pairIds.map((pairId, index) => 
      this.db.update(milniPairs)
        .set({ sequence: index, updatedAt: new Date() })
        .where(and(
          eq(milniPairs.id, pairId),
          eq(milniPairs.milniListId, milniListId)
        ))
    );
    
    await Promise.all(updates);
    return this.getMilniPairsByList(milniListId);
  }

  // Vendor Access Passes
  async getVendorAccessPass(id: string): Promise<VendorAccessPass | undefined> {
    const result = await this.db.select()
      .from(vendorAccessPasses)
      .where(eq(vendorAccessPasses.id, id));
    return result[0];
  }

  async getVendorAccessPassByToken(token: string): Promise<VendorAccessPass | undefined> {
    const result = await this.db.select()
      .from(vendorAccessPasses)
      .where(eq(vendorAccessPasses.token, token));
    return result[0];
  }

  async getVendorAccessPassesByWedding(weddingId: string): Promise<VendorAccessPass[]> {
    return await this.db.select()
      .from(vendorAccessPasses)
      .where(eq(vendorAccessPasses.weddingId, weddingId))
      .orderBy(sql`${vendorAccessPasses.createdAt} DESC`);
  }

  async getVendorAccessPassesByVendor(vendorId: string): Promise<VendorAccessPass[]> {
    return await this.db.select()
      .from(vendorAccessPasses)
      .where(eq(vendorAccessPasses.vendorId, vendorId))
      .orderBy(sql`${vendorAccessPasses.createdAt} DESC`);
  }

  async createVendorAccessPass(pass: InsertVendorAccessPass): Promise<VendorAccessPass> {
    const token = randomBytes(24).toString('base64url');
    const result = await this.db.insert(vendorAccessPasses)
      .values({ ...pass, token })
      .returning();
    return result[0];
  }

  async updateVendorAccessPass(id: string, pass: Partial<InsertVendorAccessPass>): Promise<VendorAccessPass | undefined> {
    const result = await this.db.update(vendorAccessPasses)
      .set({ ...pass, updatedAt: new Date() })
      .where(eq(vendorAccessPasses.id, id))
      .returning();
    return result[0];
  }

  async deleteVendorAccessPass(id: string): Promise<boolean> {
    await this.db.delete(vendorAccessPasses)
      .where(eq(vendorAccessPasses.id, id));
    return true;
  }

  async revokeVendorAccessPass(id: string): Promise<VendorAccessPass | undefined> {
    const result = await this.db.update(vendorAccessPasses)
      .set({ status: "revoked", updatedAt: new Date() })
      .where(eq(vendorAccessPasses.id, id))
      .returning();
    return result[0];
  }

  async recordVendorAccessPassUsage(token: string): Promise<VendorAccessPass | undefined> {
    const result = await this.db.update(vendorAccessPasses)
      .set({ 
        lastAccessedAt: new Date(), 
        accessCount: sql`${vendorAccessPasses.accessCount} + 1`,
        updatedAt: new Date() 
      })
      .where(eq(vendorAccessPasses.token, token))
      .returning();
    return result[0];
  }

  // Ceremony Explainers - Cultural Translator
  async getCeremonyExplainer(id: string): Promise<CeremonyExplainer | undefined> {
    const result = await this.db.select()
      .from(ceremonyExplainers)
      .where(eq(ceremonyExplainers.id, id))
      .limit(1);
    return result[0];
  }

  async getCeremonyExplainerByEvent(eventId: string): Promise<CeremonyExplainer | undefined> {
    const result = await this.db.select()
      .from(ceremonyExplainers)
      .where(eq(ceremonyExplainers.eventId, eventId))
      .limit(1);
    return result[0];
  }

  async getCeremonyExplainersByWedding(weddingId: string): Promise<CeremonyExplainer[]> {
    return await this.db.select()
      .from(ceremonyExplainers)
      .where(eq(ceremonyExplainers.weddingId, weddingId))
      .orderBy(ceremonyExplainers.createdAt);
  }

  async getPublishedCeremonyExplainersByWedding(weddingId: string): Promise<CeremonyExplainer[]> {
    return await this.db.select()
      .from(ceremonyExplainers)
      .where(and(
        eq(ceremonyExplainers.weddingId, weddingId),
        eq(ceremonyExplainers.isPublished, true)
      ))
      .orderBy(ceremonyExplainers.createdAt);
  }

  async createCeremonyExplainer(explainer: InsertCeremonyExplainer): Promise<CeremonyExplainer> {
    const result = await this.db.insert(ceremonyExplainers)
      .values(explainer)
      .returning();
    return result[0];
  }

  async updateCeremonyExplainer(id: string, explainer: Partial<InsertCeremonyExplainer>): Promise<CeremonyExplainer | undefined> {
    const result = await this.db.update(ceremonyExplainers)
      .set({ ...explainer, updatedAt: new Date() })
      .where(eq(ceremonyExplainers.id, id))
      .returning();
    return result[0];
  }

  async deleteCeremonyExplainer(id: string): Promise<boolean> {
    await this.db.delete(ceremonyExplainers)
      .where(eq(ceremonyExplainers.id, id));
    return true;
  }

  async publishCeremonyExplainer(id: string): Promise<CeremonyExplainer | undefined> {
    const result = await this.db.update(ceremonyExplainers)
      .set({ isPublished: true, updatedAt: new Date() })
      .where(eq(ceremonyExplainers.id, id))
      .returning();
    return result[0];
  }

  async unpublishCeremonyExplainer(id: string): Promise<CeremonyExplainer | undefined> {
    const result = await this.db.update(ceremonyExplainers)
      .set({ isPublished: false, updatedAt: new Date() })
      .where(eq(ceremonyExplainers.id, id))
      .returning();
    return result[0];
  }

  // Decor Items - Decor Inventory & Sourcing Tracker
  async getDecorItem(id: string): Promise<DecorItem | undefined> {
    const result = await this.db.select()
      .from(decorItems)
      .where(eq(decorItems.id, id));
    return result[0];
  }

  async getDecorItemsByWedding(weddingId: string): Promise<DecorItem[]> {
    return await this.db.select()
      .from(decorItems)
      .where(eq(decorItems.weddingId, weddingId))
      .orderBy(decorItems.category, decorItems.sortOrder, decorItems.itemName);
  }

  async getDecorItemsByWeddingAndCategory(weddingId: string, category: string): Promise<DecorItem[]> {
    return await this.db.select()
      .from(decorItems)
      .where(and(
        eq(decorItems.weddingId, weddingId),
        eq(decorItems.category, category)
      ))
      .orderBy(decorItems.sortOrder, decorItems.itemName);
  }

  async createDecorItem(item: InsertDecorItem): Promise<DecorItem> {
    const result = await this.db.insert(decorItems)
      .values(item)
      .returning();
    return result[0];
  }

  async updateDecorItem(id: string, item: Partial<InsertDecorItem>): Promise<DecorItem | undefined> {
    const result = await this.db.update(decorItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(decorItems.id, id))
      .returning();
    return result[0];
  }

  async deleteDecorItem(id: string): Promise<boolean> {
    await this.db.delete(decorItems)
      .where(eq(decorItems.id, id));
    return true;
  }

  async toggleDecorItemSourced(id: string): Promise<DecorItem | undefined> {
    const item = await this.getDecorItem(id);
    if (!item) return undefined;
    
    const result = await this.db.update(decorItems)
      .set({ sourced: !item.sourced, updatedAt: new Date() })
      .where(eq(decorItems.id, id))
      .returning();
    return result[0];
  }

  async importDefaultDecorLibrary(weddingId: string): Promise<DecorItem[]> {
    const createdItems: DecorItem[] = [];
    let sortOrder = 0;
    
    for (const libraryItem of DEFAULT_DECOR_LIBRARY) {
      const result = await this.db.insert(decorItems)
        .values({
          weddingId,
          itemName: libraryItem.itemName,
          category: libraryItem.category,
          sourcing: libraryItem.sourcing,
          quantity: 1,
          sortOrder: sortOrder++,
        })
        .returning();
      createdItems.push(result[0]);
    }
    
    return createdItems;
  }

  // Day-of Timeline Items - Wedding Day Schedule
  async getDayOfTimelineItem(id: string): Promise<DayOfTimelineItem | undefined> {
    const result = await this.db.select()
      .from(dayOfTimelineItems)
      .where(eq(dayOfTimelineItems.id, id));
    return result[0];
  }

  async getDayOfTimelineItemsByWedding(weddingId: string): Promise<DayOfTimelineItem[]> {
    return await this.db.select()
      .from(dayOfTimelineItems)
      .where(eq(dayOfTimelineItems.weddingId, weddingId))
      .orderBy(dayOfTimelineItems.sortOrder, dayOfTimelineItems.time);
  }

  async getDayOfTimelineItemsByAssignee(weddingId: string, assignee: string): Promise<DayOfTimelineItem[]> {
    return await this.db.select()
      .from(dayOfTimelineItems)
      .where(and(
        eq(dayOfTimelineItems.weddingId, weddingId),
        eq(dayOfTimelineItems.assignee, assignee)
      ))
      .orderBy(dayOfTimelineItems.sortOrder, dayOfTimelineItems.time);
  }

  async createDayOfTimelineItem(item: InsertDayOfTimelineItem): Promise<DayOfTimelineItem> {
    const result = await this.db.insert(dayOfTimelineItems)
      .values(item)
      .returning();
    return result[0];
  }

  async createDayOfTimelineItems(items: InsertDayOfTimelineItem[]): Promise<DayOfTimelineItem[]> {
    if (items.length === 0) return [];
    const result = await this.db.insert(dayOfTimelineItems)
      .values(items)
      .returning();
    return result;
  }

  async updateDayOfTimelineItem(id: string, item: Partial<InsertDayOfTimelineItem>): Promise<DayOfTimelineItem | undefined> {
    const result = await this.db.update(dayOfTimelineItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(dayOfTimelineItems.id, id))
      .returning();
    return result[0];
  }

  async deleteDayOfTimelineItem(id: string): Promise<boolean> {
    await this.db.delete(dayOfTimelineItems)
      .where(eq(dayOfTimelineItems.id, id));
    return true;
  }

  async toggleDayOfTimelineItemCompleted(id: string): Promise<DayOfTimelineItem | undefined> {
    const item = await this.getDayOfTimelineItem(id);
    if (!item) return undefined;
    
    const result = await this.db.update(dayOfTimelineItems)
      .set({ completed: !item.completed, updatedAt: new Date() })
      .where(eq(dayOfTimelineItems.id, id))
      .returning();
    return result[0];
  }

  async importDayOfTimelineTemplate(weddingId: string, templateName: string): Promise<DayOfTimelineItem[]> {
    // For now, only support Sikh wedding template
    if (templateName !== 'sikh') {
      return [];
    }

    const itemsToCreate: InsertDayOfTimelineItem[] = SIKH_WEDDING_DAY_TEMPLATE.map(item => ({
      weddingId,
      time: item.time,
      activity: item.activity,
      assignee: item.assignee as "bride" | "groom" | "bridal_party" | "vendor",
      vendorCategory: item.vendorCategory as any,
      sortOrder: item.sortOrder,
      isFromTemplate: true,
    }));

    return await this.createDayOfTimelineItems(itemsToCreate);
  }

  async clearDayOfTimeline(weddingId: string): Promise<boolean> {
    await this.db.delete(dayOfTimelineItems)
      .where(eq(dayOfTimelineItems.weddingId, weddingId));
    return true;
  }

  // ============================================================================
  // HONEYMOON PLANNER IMPLEMENTATIONS
  // ============================================================================

  // Honeymoon Flights
  async getHoneymoonFlight(id: string): Promise<HoneymoonFlight | undefined> {
    const result = await this.db.select()
      .from(honeymoonFlights)
      .where(eq(honeymoonFlights.id, id));
    return result[0];
  }

  async getHoneymoonFlightsByWedding(weddingId: string): Promise<HoneymoonFlight[]> {
    return await this.db.select()
      .from(honeymoonFlights)
      .where(eq(honeymoonFlights.weddingId, weddingId))
      .orderBy(honeymoonFlights.departureDate, honeymoonFlights.departureTime);
  }

  async createHoneymoonFlight(flight: InsertHoneymoonFlight): Promise<HoneymoonFlight> {
    const result = await this.db.insert(honeymoonFlights)
      .values(flight)
      .returning();
    return result[0];
  }

  async updateHoneymoonFlight(id: string, flight: Partial<InsertHoneymoonFlight>): Promise<HoneymoonFlight | undefined> {
    const result = await this.db.update(honeymoonFlights)
      .set({ ...flight, updatedAt: new Date() })
      .where(eq(honeymoonFlights.id, id))
      .returning();
    return result[0];
  }

  async deleteHoneymoonFlight(id: string): Promise<boolean> {
    await this.db.delete(honeymoonFlights)
      .where(eq(honeymoonFlights.id, id));
    return true;
  }

  // Honeymoon Hotels
  async getHoneymoonHotel(id: string): Promise<HoneymoonHotel | undefined> {
    const result = await this.db.select()
      .from(honeymoonHotels)
      .where(eq(honeymoonHotels.id, id));
    return result[0];
  }

  async getHoneymoonHotelsByWedding(weddingId: string): Promise<HoneymoonHotel[]> {
    return await this.db.select()
      .from(honeymoonHotels)
      .where(eq(honeymoonHotels.weddingId, weddingId))
      .orderBy(honeymoonHotels.checkInDate);
  }

  async createHoneymoonHotel(hotel: InsertHoneymoonHotel): Promise<HoneymoonHotel> {
    const result = await this.db.insert(honeymoonHotels)
      .values(hotel)
      .returning();
    return result[0];
  }

  async updateHoneymoonHotel(id: string, hotel: Partial<InsertHoneymoonHotel>): Promise<HoneymoonHotel | undefined> {
    const result = await this.db.update(honeymoonHotels)
      .set({ ...hotel, updatedAt: new Date() })
      .where(eq(honeymoonHotels.id, id))
      .returning();
    return result[0];
  }

  async deleteHoneymoonHotel(id: string): Promise<boolean> {
    await this.db.delete(honeymoonHotels)
      .where(eq(honeymoonHotels.id, id));
    return true;
  }

  // Honeymoon Activities
  async getHoneymoonActivity(id: string): Promise<HoneymoonActivity | undefined> {
    const result = await this.db.select()
      .from(honeymoonActivities)
      .where(eq(honeymoonActivities.id, id));
    return result[0];
  }

  async getHoneymoonActivitiesByWedding(weddingId: string): Promise<HoneymoonActivity[]> {
    return await this.db.select()
      .from(honeymoonActivities)
      .where(eq(honeymoonActivities.weddingId, weddingId))
      .orderBy(honeymoonActivities.date, honeymoonActivities.time);
  }

  async createHoneymoonActivity(activity: InsertHoneymoonActivity): Promise<HoneymoonActivity> {
    const result = await this.db.insert(honeymoonActivities)
      .values(activity)
      .returning();
    return result[0];
  }

  async updateHoneymoonActivity(id: string, activity: Partial<InsertHoneymoonActivity>): Promise<HoneymoonActivity | undefined> {
    const result = await this.db.update(honeymoonActivities)
      .set({ ...activity, updatedAt: new Date() })
      .where(eq(honeymoonActivities.id, id))
      .returning();
    return result[0];
  }

  async deleteHoneymoonActivity(id: string): Promise<boolean> {
    await this.db.delete(honeymoonActivities)
      .where(eq(honeymoonActivities.id, id));
    return true;
  }

  async toggleHoneymoonActivityCompleted(id: string): Promise<HoneymoonActivity | undefined> {
    const activity = await this.getHoneymoonActivity(id);
    if (!activity) return undefined;
    
    const result = await this.db.update(honeymoonActivities)
      .set({ completed: !activity.completed, updatedAt: new Date() })
      .where(eq(honeymoonActivities.id, id))
      .returning();
    return result[0];
  }

  // Honeymoon Budget
  async getHoneymoonBudgetItem(id: string): Promise<HoneymoonBudgetItem | undefined> {
    const result = await this.db.select()
      .from(honeymoonBudgetItems)
      .where(eq(honeymoonBudgetItems.id, id));
    return result[0];
  }

  async getHoneymoonBudgetItemsByWedding(weddingId: string): Promise<HoneymoonBudgetItem[]> {
    return await this.db.select()
      .from(honeymoonBudgetItems)
      .where(eq(honeymoonBudgetItems.weddingId, weddingId))
      .orderBy(honeymoonBudgetItems.category, honeymoonBudgetItems.createdAt);
  }

  async createHoneymoonBudgetItem(item: InsertHoneymoonBudgetItem): Promise<HoneymoonBudgetItem> {
    const result = await this.db.insert(honeymoonBudgetItems)
      .values(item)
      .returning();
    return result[0];
  }

  async updateHoneymoonBudgetItem(id: string, item: Partial<InsertHoneymoonBudgetItem>): Promise<HoneymoonBudgetItem | undefined> {
    const result = await this.db.update(honeymoonBudgetItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(honeymoonBudgetItems.id, id))
      .returning();
    return result[0];
  }

  async deleteHoneymoonBudgetItem(id: string): Promise<boolean> {
    await this.db.delete(honeymoonBudgetItems)
      .where(eq(honeymoonBudgetItems.id, id));
    return true;
  }

  async toggleHoneymoonBudgetItemPaid(id: string): Promise<HoneymoonBudgetItem | undefined> {
    const item = await this.getHoneymoonBudgetItem(id);
    if (!item) return undefined;
    
    const result = await this.db.update(honeymoonBudgetItems)
      .set({ isPaid: !item.isPaid, updatedAt: new Date() })
      .where(eq(honeymoonBudgetItems.id, id))
      .returning();
    return result[0];
  }

  // Favours
  async getFavour(id: string): Promise<Favour | undefined> {
    const result = await this.db.select()
      .from(favours)
      .where(eq(favours.id, id));
    return result[0];
  }

  async getFavoursByWedding(weddingId: string): Promise<Favour[]> {
    return await this.db.select()
      .from(favours)
      .where(eq(favours.weddingId, weddingId))
      .orderBy(favours.category, favours.createdAt);
  }

  async createFavour(favour: InsertFavour): Promise<Favour> {
    const result = await this.db.insert(favours)
      .values(favour)
      .returning();
    return result[0];
  }

  async updateFavour(id: string, favour: Partial<InsertFavour>): Promise<Favour | undefined> {
    const result = await this.db.update(favours)
      .set({ ...favour, updatedAt: new Date() })
      .where(eq(favours.id, id))
      .returning();
    return result[0];
  }

  async deleteFavour(id: string): Promise<boolean> {
    // First delete all recipients for this favour
    await this.db.delete(favourRecipients)
      .where(eq(favourRecipients.favourId, id));
    // Then delete the favour
    await this.db.delete(favours)
      .where(eq(favours.id, id));
    return true;
  }

  // Favour Recipients
  async getFavourRecipient(id: string): Promise<FavourRecipient | undefined> {
    const result = await this.db.select()
      .from(favourRecipients)
      .where(eq(favourRecipients.id, id));
    return result[0];
  }

  async getFavourRecipientsByFavour(favourId: string): Promise<FavourRecipient[]> {
    return await this.db.select()
      .from(favourRecipients)
      .where(eq(favourRecipients.favourId, favourId))
      .orderBy(favourRecipients.recipientName);
  }

  async getFavourRecipientsByWedding(weddingId: string): Promise<FavourRecipient[]> {
    return await this.db.select()
      .from(favourRecipients)
      .where(eq(favourRecipients.weddingId, weddingId))
      .orderBy(favourRecipients.createdAt);
  }

  async createFavourRecipient(recipient: InsertFavourRecipient): Promise<FavourRecipient> {
    const result = await this.db.insert(favourRecipients)
      .values(recipient)
      .returning();
    
    // Update the favour's remaining quantity
    const favour = await this.getFavour(recipient.favourId);
    if (favour) {
      const newRemaining = Math.max(0, favour.quantityRemaining - (recipient.quantity || 1));
      await this.db.update(favours)
        .set({ quantityRemaining: newRemaining, updatedAt: new Date() })
        .where(eq(favours.id, recipient.favourId));
    }
    
    return result[0];
  }

  async updateFavourRecipient(id: string, recipient: Partial<InsertFavourRecipient>): Promise<FavourRecipient | undefined> {
    const result = await this.db.update(favourRecipients)
      .set({ ...recipient, updatedAt: new Date() })
      .where(eq(favourRecipients.id, id))
      .returning();
    return result[0];
  }

  async deleteFavourRecipient(id: string): Promise<boolean> {
    // Get the recipient to restore quantity
    const recipient = await this.getFavourRecipient(id);
    if (recipient) {
      const favour = await this.getFavour(recipient.favourId);
      if (favour) {
        const newRemaining = favour.quantityRemaining + (recipient.quantity || 1);
        await this.db.update(favours)
          .set({ quantityRemaining: Math.min(newRemaining, favour.quantityPurchased), updatedAt: new Date() })
          .where(eq(favours.id, recipient.favourId));
      }
    }
    
    await this.db.delete(favourRecipients)
      .where(eq(favourRecipients.id, id));
    return true;
  }

  async toggleFavourRecipientDelivered(id: string): Promise<FavourRecipient | undefined> {
    const recipient = await this.getFavourRecipient(id);
    if (!recipient) return undefined;
    
    const newStatus = recipient.deliveryStatus === 'delivered' ? 'pending' : 'delivered';
    const result = await this.db.update(favourRecipients)
      .set({ 
        deliveryStatus: newStatus, 
        deliveryDate: newStatus === 'delivered' ? new Date().toISOString().split('T')[0] : null,
        updatedAt: new Date() 
      })
      .where(eq(favourRecipients.id, id))
      .returning();
    return result[0];
  }

  // Budget Scenarios - What-if scenario planning
  async getBudgetScenario(id: string): Promise<BudgetScenario | undefined> {
    const result = await this.db.select().from(budgetScenarios).where(eq(budgetScenarios.id, id));
    return result[0];
  }

  async getBudgetScenariosByWedding(weddingId: string): Promise<BudgetScenario[]> {
    return await this.db.select()
      .from(budgetScenarios)
      .where(eq(budgetScenarios.weddingId, weddingId))
      .orderBy(budgetScenarios.createdAt);
  }

  async createBudgetScenario(scenario: InsertBudgetScenario): Promise<BudgetScenario> {
    const result = await this.db.insert(budgetScenarios)
      .values(scenario)
      .returning();
    return result[0];
  }

  async updateBudgetScenario(id: string, scenario: Partial<InsertBudgetScenario>): Promise<BudgetScenario | undefined> {
    const result = await this.db.update(budgetScenarios)
      .set({ ...scenario, updatedAt: new Date() })
      .where(eq(budgetScenarios.id, id))
      .returning();
    return result[0];
  }

  async deleteBudgetScenario(id: string): Promise<boolean> {
    await this.db.delete(budgetScenarios).where(eq(budgetScenarios.id, id));
    return true;
  }

  // Tradition Rituals - Educational content about wedding rituals
  // NOTE: tradition_rituals contains ONLY rituals (activities), NOT ceremonies.
  // - Rituals WITH ceremonyTypeId are done AS PART OF that ceremony
  // - Rituals WITHOUT ceremonyTypeId are done OUTSIDE any ceremony (standalone)
  // ceremony_types is the source of truth for ceremonies (Anand Karaj, Sangeet, etc.)
  async getTraditionRitual(id: string): Promise<TraditionRitual | undefined> {
    const result = await this.db.select().from(traditionRituals).where(eq(traditionRituals.id, id));
    return result[0];
  }

  async getTraditionRitualBySlug(slug: string): Promise<TraditionRitual | undefined> {
    const result = await this.db.select().from(traditionRituals).where(eq(traditionRituals.slug, slug));
    return result[0];
  }

  async getTraditionRitualsByTradition(traditionId: string): Promise<TraditionRitual[]> {
    // Get ceremony slugs for this tradition to filter out duplicates
    // This prevents any ceremonies that were accidentally added to tradition_rituals from showing
    const ceremonies = await this.db.select({ ceremonyId: ceremonyTypes.ceremonyId })
      .from(ceremonyTypes)
      .where(eq(ceremonyTypes.traditionId, traditionId));
    const ceremonySlugs = new Set(ceremonies.map(c => c.ceremonyId));
    
    const rituals = await this.db.select()
      .from(traditionRituals)
      .where(and(
        eq(traditionRituals.traditionId, traditionId),
        eq(traditionRituals.isActive, true)
      ))
      .orderBy(traditionRituals.sortOrder);
    
    // Filter out any rituals whose slug matches a ceremony (these are duplicates)
    return rituals.filter(r => !ceremonySlugs.has(r.slug));
  }

  async getTraditionRitualsByTraditionSlug(traditionSlug: string): Promise<TraditionRitual[]> {
    const tradition = await this.db.select()
      .from(weddingTraditions)
      .where(eq(weddingTraditions.slug, traditionSlug));
    if (!tradition[0]) return [];
    return this.getTraditionRitualsByTradition(tradition[0].id);
  }

  async getAllTraditionRituals(): Promise<TraditionRitual[]> {
    // Get all ceremony slugs to filter out duplicates
    const ceremonies = await this.db.select({ ceremonyId: ceremonyTypes.ceremonyId })
      .from(ceremonyTypes);
    const ceremonySlugs = new Set(ceremonies.map(c => c.ceremonyId));
    
    const rituals = await this.db.select()
      .from(traditionRituals)
      .where(eq(traditionRituals.isActive, true))
      .orderBy(traditionRituals.sortOrder);
    
    // Filter out any rituals whose slug matches a ceremony (these are duplicates)
    return rituals.filter(r => !ceremonySlugs.has(r.slug));
  }

  async getTraditionRitualsByCeremonyTypeId(ceremonyTypeId: string): Promise<TraditionRitual[]> {
    return await this.db.select()
      .from(traditionRituals)
      .where(and(
        eq(traditionRituals.ceremonyTypeId, ceremonyTypeId),
        eq(traditionRituals.isActive, true)
      ))
      .orderBy(traditionRituals.sortOrder);
  }

  // User Feedback methods
  async getUserFeedback(id: string): Promise<UserFeedback | undefined> {
    const result = await this.db.select().from(userFeedback).where(eq(userFeedback.id, id));
    return result[0];
  }

  async getAllUserFeedback(): Promise<UserFeedback[]> {
    return await this.db.select().from(userFeedback).orderBy(desc(userFeedback.createdAt));
  }

  async getUserFeedbackByStatus(status: string): Promise<UserFeedback[]> {
    return await this.db.select().from(userFeedback)
      .where(eq(userFeedback.status, status))
      .orderBy(desc(userFeedback.createdAt));
  }

  async createUserFeedback(feedback: InsertUserFeedback): Promise<UserFeedback> {
    const result = await this.db.insert(userFeedback).values(feedback).returning();
    return result[0];
  }

  async updateUserFeedback(id: string, updates: Partial<UserFeedback>): Promise<UserFeedback | undefined> {
    const result = await this.db.update(userFeedback)
      .set(updates)
      .where(eq(userFeedback.id, id))
      .returning();
    return result[0];
  }

  // Admin - User Management methods
  async getAllUsersWithWeddings(): Promise<Array<{ user: User; wedding: Wedding | null }>> {
    const allUsers = await this.db.select().from(schema.users).orderBy(desc(schema.users.createdAt));
    const allWeddings = await this.db.select().from(schema.weddings);
    
    const weddingsByUserId = new Map<string, Wedding>();
    for (const wedding of allWeddings) {
      weddingsByUserId.set(wedding.userId, wedding);
    }
    
    return allUsers.map(user => ({
      user,
      wedding: weddingsByUserId.get(user.id) || null,
    }));
  }

  async getUserWithWedding(userId: string): Promise<{ user: User; wedding: Wedding | null } | null> {
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.id, userId));
    if (!user) return null;
    
    const [wedding] = await this.db.select().from(schema.weddings).where(eq(schema.weddings.userId, userId));
    return { user, wedding: wedding || null };
  }

  // AI Chat Messages
  async getAiChatMessages(weddingId: string, userId: string): Promise<AiChatMessage[]> {
    return await this.db.select()
      .from(aiChatMessages)
      .where(and(
        eq(aiChatMessages.weddingId, weddingId),
        eq(aiChatMessages.userId, userId)
      ))
      .orderBy(aiChatMessages.createdAt);
  }

  async createAiChatMessage(message: InsertAiChatMessage): Promise<AiChatMessage> {
    const [newMessage] = await this.db.insert(aiChatMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async clearAiChatHistory(weddingId: string, userId: string): Promise<boolean> {
    await this.db.delete(aiChatMessages)
      .where(and(
        eq(aiChatMessages.weddingId, weddingId),
        eq(aiChatMessages.userId, userId)
      ));
    return true;
  }

  // AI FAQ methods
  async getAllFaq(): Promise<AiFaq[]> {
    return await this.db.select().from(aiFaq).orderBy(desc(aiFaq.priority));
  }

  async getActiveFaq(): Promise<AiFaq[]> {
    return await this.db.select().from(aiFaq)
      .where(eq(aiFaq.isActive, true))
      .orderBy(desc(aiFaq.priority));
  }

  async findFaqByNormalizedQuestion(normalizedQuestion: string): Promise<AiFaq | null> {
    const results = await this.db.select().from(aiFaq)
      .where(and(
        eq(aiFaq.normalizedQuestion, normalizedQuestion),
        eq(aiFaq.isActive, true)
      ))
      .limit(1);
    return results[0] || null;
  }

  async createFaq(faqData: InsertAiFaq): Promise<AiFaq> {
    const [newFaq] = await this.db.insert(aiFaq)
      .values(faqData)
      .returning();
    return newFaq;
  }

  // Discovery Jobs
  async getDiscoveryJob(id: string): Promise<DiscoveryJob | undefined> {
    const [job] = await this.db.select().from(discoveryJobs).where(eq(discoveryJobs.id, id));
    return job;
  }

  async getAllDiscoveryJobs(): Promise<DiscoveryJob[]> {
    return this.db.select().from(discoveryJobs).orderBy(discoveryJobs.createdAt);
  }

  async getActiveDiscoveryJobs(): Promise<DiscoveryJob[]> {
    return this.db.select().from(discoveryJobs).where(and(eq(discoveryJobs.isActive, true), eq(discoveryJobs.paused, false)));
  }

  async createDiscoveryJob(job: InsertDiscoveryJob): Promise<DiscoveryJob> {
    const [created] = await this.db.insert(discoveryJobs).values(job).returning();
    return created;
  }

  async updateDiscoveryJob(id: string, job: Partial<DiscoveryJob>): Promise<DiscoveryJob | undefined> {
    const [updated] = await this.db.update(discoveryJobs).set({ ...job, updatedAt: new Date() }).where(eq(discoveryJobs.id, id)).returning();
    return updated;
  }

  async deleteDiscoveryJob(id: string): Promise<boolean> {
    const result = await this.db.delete(discoveryJobs).where(eq(discoveryJobs.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Staged Vendors
  async getStagedVendor(id: string): Promise<StagedVendor | undefined> {
    const [vendor] = await this.db.select().from(stagedVendors).where(eq(stagedVendors.id, id));
    return vendor;
  }

  async getStagedVendorsByJob(jobId: string): Promise<StagedVendor[]> {
    return this.db.select().from(stagedVendors).where(eq(stagedVendors.discoveryJobId, jobId));
  }

  async getStagedVendorsByStatus(status: string): Promise<StagedVendor[]> {
    return this.db.select().from(stagedVendors).where(eq(stagedVendors.status, status));
  }

  async getAllStagedVendors(): Promise<StagedVendor[]> {
    return this.db.select().from(stagedVendors).orderBy(desc(stagedVendors.discoveredAt));
  }

  async createStagedVendor(vendor: InsertStagedVendor): Promise<StagedVendor> {
    const [created] = await this.db.insert(stagedVendors).values(vendor).returning();
    return created;
  }

  async updateStagedVendor(id: string, vendor: Partial<StagedVendor>): Promise<StagedVendor | undefined> {
    const [updated] = await this.db.update(stagedVendors).set(vendor).where(eq(stagedVendors.id, id)).returning();
    return updated;
  }

  async deleteStagedVendor(id: string): Promise<boolean> {
    const result = await this.db.delete(stagedVendors).where(eq(stagedVendors.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Live Polls
  async getPoll(id: string): Promise<Poll | undefined> {
    const [poll] = await this.db.select().from(polls).where(eq(polls.id, id));
    return poll;
  }

  async getPollsByWedding(weddingId: string): Promise<Poll[]> {
    return this.db.select().from(polls).where(eq(polls.weddingId, weddingId)).orderBy(desc(polls.createdAt));
  }

  async getPollsByEvent(eventId: string): Promise<Poll[]> {
    return this.db.select().from(polls).where(eq(polls.eventId, eventId)).orderBy(desc(polls.createdAt));
  }

  async createPoll(poll: InsertPoll): Promise<Poll> {
    const [created] = await this.db.insert(polls).values(poll).returning();
    return created;
  }

  async updatePoll(id: string, update: Partial<Poll>): Promise<Poll | undefined> {
    const [updated] = await this.db.update(polls).set({ ...update, updatedAt: new Date() }).where(eq(polls.id, id)).returning();
    return updated;
  }

  async deletePoll(id: string): Promise<boolean> {
    const result = await this.db.delete(polls).where(eq(polls.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Poll Options
  async getPollOption(id: string): Promise<PollOption | undefined> {
    const [option] = await this.db.select().from(pollOptions).where(eq(pollOptions.id, id));
    return option;
  }

  async getPollOptionsByPoll(pollId: string): Promise<PollOption[]> {
    return this.db.select().from(pollOptions).where(eq(pollOptions.pollId, pollId)).orderBy(pollOptions.displayOrder);
  }

  async createPollOption(option: InsertPollOption): Promise<PollOption> {
    const [created] = await this.db.insert(pollOptions).values(option).returning();
    return created;
  }

  async updatePollOption(id: string, update: Partial<PollOption>): Promise<PollOption | undefined> {
    const [updated] = await this.db.update(pollOptions).set(update).where(eq(pollOptions.id, id)).returning();
    return updated;
  }

  async deletePollOption(id: string): Promise<boolean> {
    const result = await this.db.delete(pollOptions).where(eq(pollOptions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Poll Votes
  async getPollVotesByPoll(pollId: string): Promise<PollVote[]> {
    return this.db.select().from(pollVotes).where(eq(pollVotes.pollId, pollId));
  }

  async getPollVotesByGuest(pollId: string, guestId: string): Promise<PollVote[]> {
    return this.db.select().from(pollVotes).where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.guestId, guestId)));
  }

  async createPollVote(vote: InsertPollVote): Promise<PollVote> {
    const [created] = await this.db.insert(pollVotes).values(vote).returning();
    return created;
  }

  async deletePollVotesByGuest(pollId: string, guestId: string): Promise<boolean> {
    const result = await this.db.delete(pollVotes).where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.guestId, guestId)));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = process.env.DATABASE_URL 
  ? new DBStorage(process.env.DATABASE_URL)
  : new MemStorage();
