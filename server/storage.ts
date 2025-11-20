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
} from "@shared/schema";
import { randomUUID } from "crypto";

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
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
  getBookingsByVendor(vendorId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined>;

  // Budget Categories
  getBudgetCategory(id: string): Promise<BudgetCategory | undefined>;
  getBudgetCategoriesByWedding(weddingId: string): Promise<BudgetCategory[]>;
  createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory>;
  updateBudgetCategory(id: string, category: Partial<InsertBudgetCategory>): Promise<BudgetCategory | undefined>;
  deleteBudgetCategory(id: string): Promise<boolean>;

  // Guests
  getGuest(id: string): Promise<Guest | undefined>;
  getGuestsByWedding(weddingId: string): Promise<Guest[]>;
  createGuest(guest: InsertGuest): Promise<Guest>;
  updateGuest(id: string, guest: Partial<InsertGuest>): Promise<Guest | undefined>;
  deleteGuest(id: string): Promise<boolean>;

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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private weddings: Map<string, Wedding>;
  private events: Map<string, Event>;
  private vendors: Map<string, Vendor>;
  private bookings: Map<string, Booking>;
  private budgetCategories: Map<string, BudgetCategory>;
  private guests: Map<string, Guest>;
  private tasks: Map<string, Task>;
  private contracts: Map<string, Contract>;
  private messages: Map<string, Message>;
  private reviews: Map<string, Review>;
  private budgetBenchmarks: Map<string, BudgetBenchmark>;
  private playlists: Map<string, Playlist>;
  private playlistSongs: Map<string, PlaylistSong>;
  private songVotes: Map<string, SongVote>;

  constructor() {
    this.users = new Map();
    this.weddings = new Map();
    this.events = new Map();
    this.vendors = new Map();
    this.bookings = new Map();
    this.budgetCategories = new Map();
    this.guests = new Map();
    this.tasks = new Map();
    this.contracts = new Map();
    this.messages = new Map();
    this.reviews = new Map();
    this.budgetBenchmarks = new Map();
    this.playlists = new Map();
    this.playlistSongs = new Map();
    this.songVotes = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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

  // Guests
  async getGuest(id: string): Promise<Guest | undefined> {
    return this.guests.get(id);
  }

  async getGuestsByWedding(weddingId: string): Promise<Guest[]> {
    return Array.from(this.guests.values()).filter((g) => g.weddingId === weddingId);
  }

  async createGuest(insertGuest: InsertGuest): Promise<Guest> {
    const id = randomUUID();
    const guest: Guest = {
      ...insertGuest,
      id,
      rsvpStatus: insertGuest.rsvpStatus || "pending",
      plusOne: insertGuest.plusOne || false,
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
}

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and } from "drizzle-orm";
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(schema.users).values(insertUser).returning();
    return result[0];
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

  // Guests
  async getGuest(id: string): Promise<Guest | undefined> {
    const result = await this.db.select().from(schema.guests).where(eq(schema.guests.id, id));
    return result[0];
  }

  async getGuestsByWedding(weddingId: string): Promise<Guest[]> {
    return await this.db.select().from(schema.guests).where(eq(schema.guests.weddingId, weddingId));
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
}

export const storage = process.env.DATABASE_URL 
  ? new DBStorage(process.env.DATABASE_URL)
  : new MemStorage();
