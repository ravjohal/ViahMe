import {
  type User,
  type InsertUser,
  type Wedding,
  type InsertWedding,
  type Event,
  type InsertEvent,
  type Vendor,
  type InsertVendor,
  type Booking,
  type InsertBooking,
  type BudgetCategory,
  type InsertBudgetCategory,
  type Guest,
  type InsertGuest,
  type Household,
  type InsertHousehold,
  type Invitation,
  type InsertInvitation,
  type Task,
  type InsertTask,
  type Contract,
  type InsertContract,
  type Message,
  type InsertMessage,
  type Review,
  type InsertReview,
  type BudgetBenchmark,
  type InsertBudgetBenchmark,
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
  type PhotoGallery,
  type InsertPhotoGallery,
  type Photo,
  type InsertPhoto,
  type VendorAvailability,
  type InsertVendorAvailability,
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
} from "@shared/schema";
import { randomUUID, randomBytes } from "crypto";
import bcrypt from "bcrypt";

// Helper functions for conversationId management
export function generateConversationId(weddingId: string, vendorId: string): string {
  return `${weddingId}-vendor-${vendorId}`;
}

export function parseConversationId(conversationId: string): { weddingId: string; vendorId: string } | null {
  const parts = conversationId.split('-vendor-');
  if (parts.length !== 2) return null;
  return { weddingId: parts[0], vendorId: parts[1] };
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
  createWedding(wedding: InsertWedding): Promise<Wedding>;
  updateWedding(id: string, wedding: Partial<InsertWedding>): Promise<Wedding | undefined>;

  // Events
  getEvent(id: string): Promise<Event | undefined>;
  getEventsByWedding(weddingId: string): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;

  // Vendors
  getVendor(id: string): Promise<Vendor | undefined>;
  getAllVendors(): Promise<Vendor[]>;
  getVendorsByCategory(category: string): Promise<Vendor[]>;
  getVendorsByLocation(location: string): Promise<Vendor[]>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor | undefined>;

  // Bookings
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByWedding(weddingId: string): Promise<Booking[]>;
  getBookingsWithVendorsByWedding(weddingId: string): Promise<Array<Booking & { vendor: Vendor }>>;
  getBookingsByVendor(vendorId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined>;

  // Budget Categories
  getBudgetCategory(id: string): Promise<BudgetCategory | undefined>;
  getBudgetCategoriesByWedding(weddingId: string): Promise<BudgetCategory[]>;
  createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory>;
  updateBudgetCategory(id: string, category: Partial<InsertBudgetCategory>): Promise<BudgetCategory | undefined>;
  deleteBudgetCategory(id: string): Promise<boolean>;

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
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Contracts
  getContract(id: string): Promise<Contract | undefined>;
  getContractsByWedding(weddingId: string): Promise<Contract[]>;
  getContractsByVendor(vendorId: string): Promise<Contract[]>;
  getContractByBooking(bookingId: string): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract | undefined>;
  deleteContract(id: string): Promise<boolean>;

  // Messages
  getMessage(id: string): Promise<Message | undefined>;
  getConversationMessages(conversationId: string): Promise<Message[]>;
  getConversationsByWedding(weddingId: string): Promise<string[]>; // Returns unique conversationIds
  getConversationsByVendor(vendorId: string): Promise<string[]>; // Returns unique conversationIds
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<Message | undefined>;
  getUnreadCount(conversationId: string, recipientType: 'couple' | 'vendor'): Promise<number>;

  // Reviews
  getReview(id: string): Promise<Review | undefined>;
  getReviewsByVendor(vendorId: string): Promise<Review[]>;
  getReviewsByWedding(weddingId: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateVendorRating(vendorId: string): Promise<void>; // Recalculate average rating

  // Budget Benchmarks
  getBudgetBenchmark(id: string): Promise<BudgetBenchmark | undefined>;
  getBudgetBenchmarks(city: string, tradition: string): Promise<BudgetBenchmark[]>;
  getBudgetBenchmarkByCategory(city: string, tradition: string, category: string): Promise<BudgetBenchmark | undefined>;
  getAllBudgetBenchmarks(): Promise<BudgetBenchmark[]>;
  createBudgetBenchmark(benchmark: InsertBudgetBenchmark): Promise<BudgetBenchmark>;
  updateBudgetBenchmark(id: string, benchmark: Partial<InsertBudgetBenchmark>): Promise<BudgetBenchmark | undefined>;

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

  // Contract Signatures
  getContractSignature(id: string): Promise<ContractSignature | undefined>;
  getSignaturesByContract(contractId: string): Promise<ContractSignature[]>;
  createContractSignature(signature: InsertContractSignature): Promise<ContractSignature>;
  hasContractBeenSigned(contractId: string, signerId: string): Promise<boolean>;

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

  // Wedding Collaborators
  getWeddingCollaborator(id: string): Promise<WeddingCollaborator | undefined>;
  getWeddingCollaboratorByEmail(weddingId: string, email: string): Promise<WeddingCollaborator | undefined>;
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private weddings: Map<string, Wedding>;
  private events: Map<string, Event>;
  private vendors: Map<string, Vendor>;
  private bookings: Map<string, Booking>;
  private budgetCategories: Map<string, BudgetCategory>;
  private households: Map<string, Household>;
  private guests: Map<string, Guest>;
  private invitations: Map<string, Invitation>;
  private tasks: Map<string, Task>;
  private contracts: Map<string, Contract>;
  private messages: Map<string, Message>;
  private reviews: Map<string, Review>;
  private budgetBenchmarks: Map<string, BudgetBenchmark>;
  private playlists: Map<string, Playlist>;
  private playlistSongs: Map<string, PlaylistSong>;
  private songVotes: Map<string, SongVote>;
  private documents: Map<string, Document>;
  private weddingWebsites: Map<string, WeddingWebsite>;
  private photoGalleries: Map<string, PhotoGallery>;
  private photos: Map<string, Photo>;
  private vendorAvailability: Map<string, VendorAvailability>;
  private measurementProfiles: Map<string, MeasurementProfile>;
  private shoppingOrderItems: Map<string, ShoppingOrderItem>;

  constructor() {
    this.users = new Map();
    this.weddings = new Map();
    this.events = new Map();
    this.vendors = new Map();
    this.bookings = new Map();
    this.budgetCategories = new Map();
    this.households = new Map();
    this.guests = new Map();
    this.invitations = new Map();
    this.tasks = new Map();
    this.contracts = new Map();
    this.messages = new Map();
    this.reviews = new Map();
    this.budgetBenchmarks = new Map();
    this.playlists = new Map();
    this.playlistSongs = new Map();
    this.songVotes = new Map();
    this.documents = new Map();
    this.weddingWebsites = new Map();
    this.photoGalleries = new Map();
    this.photos = new Map();
    this.vendorAvailability = new Map();
    this.measurementProfiles = new Map();
    this.shoppingOrderItems = new Map();
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

  // Vendors
  async getVendor(id: string): Promise<Vendor | undefined> {
    return this.vendors.get(id);
  }

  async getAllVendors(): Promise<Vendor[]> {
    return Array.from(this.vendors.values());
  }

  async getVendorsByCategory(category: string): Promise<Vendor[]> {
    return Array.from(this.vendors.values()).filter((v) => v.category === category);
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

  // Budget Categories
  async getBudgetCategory(id: string): Promise<BudgetCategory | undefined> {
    return this.budgetCategories.get(id);
  }

  async getBudgetCategoriesByWedding(weddingId: string): Promise<BudgetCategory[]> {
    return Array.from(this.budgetCategories.values()).filter((c) => c.weddingId === weddingId);
  }

  async createBudgetCategory(insertCategory: InsertBudgetCategory): Promise<BudgetCategory> {
    const id = randomUUID();
    const category: BudgetCategory = {
      ...insertCategory,
      id,
      spentAmount: insertCategory.spentAmount || "0",
    } as BudgetCategory;
    this.budgetCategories.set(id, category);
    return category;
  }

  async updateBudgetCategory(
    id: string,
    update: Partial<InsertBudgetCategory>
  ): Promise<BudgetCategory | undefined> {
    const category = this.budgetCategories.get(id);
    if (!category) return undefined;

    const updated = { ...category, ...update } as BudgetCategory;
    this.budgetCategories.set(id, updated);
    return updated;
  }

  async deleteBudgetCategory(id: string): Promise<boolean> {
    return this.budgetCategories.delete(id);
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
      contactEmail: insertHousehold.contactEmail ?? null,
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
    // Ensure consistent conversationId format
    const conversationId = generateConversationId(insertMessage.weddingId, insertMessage.vendorId);
    const message: Message = {
      ...insertMessage,
      id,
      conversationId,
      isRead: false,
      createdAt: new Date(),
      attachments: insertMessage.attachments || null,
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

  // Budget Benchmarks
  async getBudgetBenchmark(id: string): Promise<BudgetBenchmark | undefined> {
    return this.budgetBenchmarks.get(id);
  }

  async getBudgetBenchmarks(city: string, tradition: string): Promise<BudgetBenchmark[]> {
    return Array.from(this.budgetBenchmarks.values()).filter(
      (b) => b.city === city && b.tradition === tradition
    );
  }

  async getBudgetBenchmarkByCategory(
    city: string,
    tradition: string,
    category: string
  ): Promise<BudgetBenchmark | undefined> {
    return Array.from(this.budgetBenchmarks.values()).find(
      (b) => b.city === city && b.tradition === tradition && b.category === category
    );
  }

  async getAllBudgetBenchmarks(): Promise<BudgetBenchmark[]> {
    return Array.from(this.budgetBenchmarks.values());
  }

  async createBudgetBenchmark(insertBenchmark: InsertBudgetBenchmark): Promise<BudgetBenchmark> {
    const id = randomUUID();
    const benchmark: BudgetBenchmark = {
      ...insertBenchmark,
      id,
      sampleSize: insertBenchmark.sampleSize || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as BudgetBenchmark;
    this.budgetBenchmarks.set(id, benchmark);
    return benchmark;
  }

  async updateBudgetBenchmark(
    id: string,
    update: Partial<InsertBudgetBenchmark>
  ): Promise<BudgetBenchmark | undefined> {
    const benchmark = this.budgetBenchmarks.get(id);
    if (!benchmark) return undefined;

    const updated = { ...benchmark, ...update, updatedAt: new Date() };
    this.budgetBenchmarks.set(id, updated);
    return updated;
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

    const budgetCategories = await this.getBudgetCategoriesByWedding(weddingId);
    const totalSpent = budgetCategories.reduce((sum, cat) => {
      const amount = cat.spentAmount ? parseFloat(cat.spentAmount) : 0;
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
    const budgetCategories = await this.getBudgetCategoriesByWedding(weddingId);
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
    const bookings = await this.getBookingsByWedding(weddingId);
    const trends = bookings
      .filter(b => b.status === 'confirmed' && b.estimatedCost !== null && b.confirmedDate !== null)
      .map(booking => {
        const vendor = this.vendors.get(booking.vendorId);
        const cost = parseFloat(booking.estimatedCost!);
        return {
          date: new Date(booking.confirmedDate!).toISOString().split('T')[0],
          amount: (isNaN(cost) ? 0 : cost).toFixed(2),
          category: vendor?.category || 'Unknown',
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

  // Wedding Collaborators - MemStorage stubs
  async getWeddingCollaborator(id: string): Promise<WeddingCollaborator | undefined> {
    return undefined;
  }
  async getWeddingCollaboratorByEmail(weddingId: string, email: string): Promise<WeddingCollaborator | undefined> {
    return undefined;
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
}

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, sql, inArray } from "drizzle-orm";
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
    const result = await this.db.select().from(schema.users).where(eq(schema.users.username, username));
    return result[0];
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

  async createWedding(insertWedding: InsertWedding): Promise<Wedding> {
    const result = await this.db.insert(schema.weddings).values(insertWedding).returning();
    return result[0];
  }

  async updateWedding(id: string, update: Partial<InsertWedding>): Promise<Wedding | undefined> {
    const result = await this.db.update(schema.weddings).set(update).where(eq(schema.weddings.id, id)).returning();
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
    const result = await this.db.insert(schema.events).values(insertEvent).returning();
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

  // Vendors
  async getVendor(id: string): Promise<Vendor | undefined> {
    const result = await this.db.select().from(schema.vendors).where(eq(schema.vendors.id, id));
    return result[0];
  }

  async getAllVendors(): Promise<Vendor[]> {
    return await this.db.select().from(schema.vendors);
  }

  async getVendorsByCategory(category: string): Promise<Vendor[]> {
    return await this.db.select().from(schema.vendors).where(eq(schema.vendors.category, category));
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

  // Budget Categories
  async getBudgetCategory(id: string): Promise<BudgetCategory | undefined> {
    const result = await this.db.select().from(schema.budgetCategories).where(eq(schema.budgetCategories.id, id));
    return result[0];
  }

  async getBudgetCategoriesByWedding(weddingId: string): Promise<BudgetCategory[]> {
    return await this.db.select().from(schema.budgetCategories).where(eq(schema.budgetCategories.weddingId, weddingId));
  }

  async createBudgetCategory(insertCategory: InsertBudgetCategory): Promise<BudgetCategory> {
    const result = await this.db.insert(schema.budgetCategories).values(insertCategory).returning();
    return result[0];
  }

  async updateBudgetCategory(id: string, update: Partial<InsertBudgetCategory>): Promise<BudgetCategory | undefined> {
    const result = await this.db.update(schema.budgetCategories).set(update).where(eq(schema.budgetCategories.id, id)).returning();
    return result[0];
  }

  async deleteBudgetCategory(id: string): Promise<boolean> {
    await this.db.delete(schema.budgetCategories).where(eq(schema.budgetCategories.id, id));
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
    await this.db.delete(schema.guests).where(eq(schema.guests.id, id));
    return true;
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
    // Ensure consistent conversationId format
    const conversationId = generateConversationId(insertMessage.weddingId, insertMessage.vendorId);
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

  // Budget Benchmarks
  async getBudgetBenchmark(id: string): Promise<BudgetBenchmark | undefined> {
    const result = await this.db.select().from(schema.budgetBenchmarks).where(eq(schema.budgetBenchmarks.id, id));
    return result[0];
  }

  async getBudgetBenchmarks(city: string, tradition: string): Promise<BudgetBenchmark[]> {
    return await this.db
      .select()
      .from(schema.budgetBenchmarks)
      .where(and(
        eq(schema.budgetBenchmarks.city, city),
        eq(schema.budgetBenchmarks.tradition, tradition)
      ));
  }

  async getBudgetBenchmarkByCategory(
    city: string,
    tradition: string,
    category: string
  ): Promise<BudgetBenchmark | undefined> {
    const result = await this.db
      .select()
      .from(schema.budgetBenchmarks)
      .where(and(
        eq(schema.budgetBenchmarks.city, city),
        eq(schema.budgetBenchmarks.tradition, tradition),
        eq(schema.budgetBenchmarks.category, category)
      ));
    return result[0];
  }

  async getAllBudgetBenchmarks(): Promise<BudgetBenchmark[]> {
    return await this.db.select().from(schema.budgetBenchmarks);
  }

  async createBudgetBenchmark(insertBenchmark: InsertBudgetBenchmark): Promise<BudgetBenchmark> {
    const result = await this.db.insert(schema.budgetBenchmarks).values(insertBenchmark).returning();
    return result[0];
  }

  async updateBudgetBenchmark(
    id: string,
    update: Partial<InsertBudgetBenchmark>
  ): Promise<BudgetBenchmark | undefined> {
    const result = await this.db
      .update(schema.budgetBenchmarks)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(schema.budgetBenchmarks.id, id))
      .returning();
    return result[0];
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
          category: vendor?.category || 'Unknown',
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
      description: "Professional planner with broad access",
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
      description: "Family member with view and limited edit access",
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
      description: "Helps manage guest lists and RSVPs",
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
}

export const storage = process.env.DATABASE_URL 
  ? new DBStorage(process.env.DATABASE_URL)
  : new MemStorage();
