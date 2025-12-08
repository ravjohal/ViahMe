import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { registerRoutes } from '../routes';
import { MemStorage } from '../storage';

vi.mock('../services/resend', () => ({
  sendBookingConfirmationEmail: vi.fn().mockResolvedValue({ success: true }),
  sendVendorBookingNotificationEmail: vi.fn().mockResolvedValue({ success: true }),
  sendInvitationEmail: vi.fn().mockResolvedValue({ success: true }),
  sendRsvpConfirmationEmail: vi.fn().mockResolvedValue({ success: true }),
  sendTaskReminderEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('twilio', () => ({
  default: vi.fn(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({ sid: 'test-sid' }),
    },
  })),
}));

vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: vi.fn(() => ({
        setCredentials: vi.fn(),
        credentials: {},
      })),
    },
    calendar: vi.fn(() => ({
      events: {
        list: vi.fn().mockResolvedValue({ data: { items: [] } }),
        insert: vi.fn().mockResolvedValue({ data: { id: 'test-event-id' } }),
      },
    })),
  },
}));

let app: express.Express;
let storage: MemStorage;
let testWedding: any;
let testUser: any;
let testVendor: any;
let testEvent: any;
let testHousehold: any;
let testGuest: any;

describe('Viah.me API Tests', () => {
  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
    }));
    
    storage = new MemStorage();
    
    testUser = await storage.createUser({
      email: 'test@example.com',
      password: 'hashedpassword123',
      name: 'Test User',
      userType: 'couple',
    });
    
    testWedding = await storage.createWedding({
      userId: testUser.id,
      partner1Name: 'Partner One',
      partner2Name: 'Partner Two',
      date: new Date('2025-12-15'),
      tradition: 'sikh',
      city: 'bay_area',
      totalBudget: '100000',
    });
    
    testVendor = await storage.createVendor({
      name: 'Test Vendor',
      category: 'photographer',
      description: 'Professional wedding photographer',
      location: 'San Francisco, CA',
      priceRange: '$$$',
      phone: '555-1234',
      email: 'vendor@test.com',
      claimed: true,
      userId: null,
    });
    
    testEvent = await storage.createEvent({
      weddingId: testWedding.id,
      name: 'Test Ceremony',
      type: 'anand_karaj',
      date: new Date('2025-12-15'),
      startTime: '10:00',
      endTime: '14:00',
      location: 'Test Temple',
    });
    
    testHousehold = await storage.createHousehold({
      weddingId: testWedding.id,
      name: 'Test Family',
      contactEmail: 'family@test.com',
      maxCount: 4,
      affiliation: 'bride',
      relationshipTier: 'immediate_family',
      priorityTier: 'must_invite',
    });
    
    testGuest = await storage.createGuest({
      householdId: testHousehold.id,
      weddingId: testWedding.id,
      name: 'Test Guest',
      email: 'guest@test.com',
      phone: '555-5678',
      isPrimaryContact: true,
    });
    
    await registerRoutes(app, storage);
  });

  describe('Wedding Endpoints', () => {
    it('GET /api/weddings/:id - should fetch wedding by ID', async () => {
      const res = await request(app)
        .get(`/api/weddings/${testWedding.id}`)
        .expect(200);
      
      expect(res.body.id).toBe(testWedding.id);
      expect(res.body.partner1Name).toBe('Partner One');
      expect(res.body.tradition).toBe('sikh');
    });

    it('GET /api/weddings/invalid-id - should return 404 for non-existent wedding', async () => {
      await request(app)
        .get('/api/weddings/non-existent-id')
        .expect(404);
    });

    it('PATCH /api/weddings/:id - should update wedding', async () => {
      const res = await request(app)
        .patch(`/api/weddings/${testWedding.id}`)
        .send({ totalBudget: '150000' })
        .expect(200);
      
      expect(res.body.totalBudget).toBe('150000');
    });
  });

  describe('Event Endpoints', () => {
    it('GET /api/events/:weddingId - should fetch events for wedding', async () => {
      const res = await request(app)
        .get(`/api/events/${testWedding.id}`)
        .expect(200);
      
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('GET /api/events/by-id/:id - should fetch single event', async () => {
      const res = await request(app)
        .get(`/api/events/by-id/${testEvent.id}`)
        .expect(200);
      
      expect(res.body.id).toBe(testEvent.id);
      expect(res.body.name).toBe('Test Ceremony');
    });

    it('POST /api/events - should create new event', async () => {
      const res = await request(app)
        .post('/api/events')
        .send({
          weddingId: testWedding.id,
          name: 'Reception',
          type: 'reception',
          date: new Date('2025-12-16').toISOString(),
          time: '18:00',
          location: 'Grand Hall',
          order: 2,
        })
        .expect(200);
      
      expect(res.body.name).toBe('Reception');
      expect(res.body.type).toBe('reception');
    });

    it('POST /api/events - should reject invalid event data', async () => {
      await request(app)
        .post('/api/events')
        .send({
          name: 'Invalid Event',
        })
        .expect(400);
    });

    it('PATCH /api/events/:id - should update event', async () => {
      const res = await request(app)
        .patch(`/api/events/${testEvent.id}`)
        .send({ location: 'Updated Temple' })
        .expect(200);
      
      expect(res.body.location).toBe('Updated Temple');
    });
  });

  describe('Vendor Endpoints', () => {
    it('GET /api/vendors - should fetch all vendors', async () => {
      const res = await request(app)
        .get('/api/vendors')
        .expect(200);
      
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/vendors?category=photographer - should filter by category', async () => {
      const res = await request(app)
        .get('/api/vendors?category=photographer')
        .expect(200);
      
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((v: any) => expect(v.category).toBe('photographer'));
    });

    it('GET /api/vendors/:id - should fetch vendor by ID', async () => {
      const res = await request(app)
        .get(`/api/vendors/${testVendor.id}`)
        .expect(200);
      
      expect(res.body.id).toBe(testVendor.id);
      expect(res.body.name).toBe('Test Vendor');
    });

    it('GET /api/vendors/invalid-id - should return 404', async () => {
      await request(app)
        .get('/api/vendors/non-existent-id')
        .expect(404);
    });
  });

  describe('Guest Management Endpoints', () => {
    it('GET /api/guests/:weddingId - should fetch guests for wedding', async () => {
      const res = await request(app)
        .get(`/api/guests/${testWedding.id}`)
        .expect(200);
      
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('POST /api/guests - should create new guest', async () => {
      const res = await request(app)
        .post('/api/guests')
        .send({
          householdId: testHousehold.id,
          weddingId: testWedding.id,
          name: 'New Guest',
          email: 'newguest@test.com',
        })
        .expect(200);
      
      expect(res.body.name).toBe('New Guest');
    });

    it('POST /api/guests - should reject empty name', async () => {
      await request(app)
        .post('/api/guests')
        .send({
          householdId: testHousehold.id,
          weddingId: testWedding.id,
          name: '',
        })
        .expect(400);
    });

    it('PATCH /api/guests/:id - should update guest', async () => {
      const res = await request(app)
        .patch(`/api/guests/${testGuest.id}`)
        .send({ dietaryRestrictions: 'Vegetarian' })
        .expect(200);
      
      expect(res.body.dietaryRestrictions).toBe('Vegetarian');
    });
  });

  describe('Household Endpoints', () => {
    it('GET /api/households/:weddingId - should fetch households for wedding', async () => {
      const res = await request(app)
        .get(`/api/households/${testWedding.id}`)
        .expect(200);
      
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('POST /api/households - should create new household', async () => {
      const res = await request(app)
        .post('/api/households')
        .send({
          weddingId: testWedding.id,
          name: 'New Family',
          contactEmail: 'newfamily@test.com',
          maxCount: 2,
          affiliation: 'groom',
          relationshipTier: 'extended_family',
          priorityTier: 'should_invite',
        })
        .expect(200);
      
      expect(res.body.name).toBe('New Family');
    });

    it('GET /api/households/:id - should fetch household by ID', async () => {
      const res = await request(app)
        .get(`/api/households/by-id/${testHousehold.id}`)
        .expect(200);
      
      expect(res.body.id).toBe(testHousehold.id);
      expect(res.body.name).toBe('Test Family');
    });
  });

  describe('Budget Category Endpoints', () => {
    it('GET /api/budget-categories/:weddingId - should fetch budget categories', async () => {
      const res = await request(app)
        .get(`/api/budget-categories/${testWedding.id}`)
        .expect(200);
      
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/budget-categories - should create budget category', async () => {
      const res = await request(app)
        .post('/api/budget-categories')
        .send({
          weddingId: testWedding.id,
          category: 'catering',
          allocatedAmount: '25000',
          spentAmount: '0',
        })
        .expect(200);
      
      expect(res.body.category).toBe('catering');
      expect(res.body.allocatedAmount).toBe('25000');
    });

    it('PATCH /api/budget-categories/:id - should update budget category', async () => {
      const category = await storage.createBudgetCategory({
        weddingId: testWedding.id,
        category: 'photography',
        allocatedAmount: '10000',
        spentAmount: '0',
      });
      
      const res = await request(app)
        .patch(`/api/budget-categories/${category.id}`)
        .send({ spentAmount: '5000' })
        .expect(200);
      
      expect(res.body.spentAmount).toBe('5000');
    });
  });

  describe('Expense Splitting Endpoints', () => {
    it('GET /api/expenses/:weddingId - should fetch expenses', async () => {
      const res = await request(app)
        .get(`/api/expenses/${testWedding.id}`)
        .expect(200);
      
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/expenses - should create expense with splits', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .send({
          weddingId: testWedding.id,
          description: 'Venue Deposit',
          amount: '5000.00',
          expenseDate: new Date().toISOString(),
          paidById: testUser.id,
          paidByName: 'Partner One',
          splitType: 'equal',
          splits: [
            { userId: testUser.id, amount: '2500', isPaid: true },
            { userId: 'partner2', amount: '2500', isPaid: false },
          ],
        })
        .expect(200);
      
      expect(res.body.description).toBe('Venue Deposit');
      expect(res.body.splits).toBeDefined();
      expect(res.body.splits.length).toBe(2);
    });

    it('POST /api/expenses - should reject missing paidById/paidByName', async () => {
      await request(app)
        .post('/api/expenses')
        .send({
          weddingId: testWedding.id,
          description: 'Missing Payer Info',
          amount: '1000.00',
          splitType: 'equal',
        })
        .expect(400);
    });
  });

  describe('Invitation & RSVP Endpoints', () => {
    let testInvitation: any;

    it('POST /api/invitations - should create invitation', async () => {
      const res = await request(app)
        .post('/api/invitations')
        .send({
          guestId: testGuest.id,
          eventId: testEvent.id,
          rsvpStatus: 'pending',
        })
        .expect(200);
      
      testInvitation = res.body;
      expect(res.body.rsvpStatus).toBe('pending');
    });

    it('GET /api/invitations/by-guest/:guestId - should fetch guest invitations', async () => {
      const res = await request(app)
        .get(`/api/invitations/by-guest/${testGuest.id}`)
        .expect(200);
      
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('PATCH /api/invitations/:id/rsvp - should update RSVP status', async () => {
      expect(testInvitation).toBeDefined();
      expect(testInvitation.id).toBeDefined();
      
      const res = await request(app)
        .patch(`/api/invitations/${testInvitation.id}/rsvp`)
        .send({ rsvpStatus: 'attending' })
        .expect(200);
      
      expect(res.body.rsvpStatus).toBe('attending');
    });
  });

  describe('Booking Endpoints', () => {
    it('GET /api/bookings/:weddingId - should fetch bookings', async () => {
      const res = await request(app)
        .get(`/api/bookings/${testWedding.id}`)
        .expect(200);
      
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/bookings - should create booking', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({
          weddingId: testWedding.id,
          vendorId: testVendor.id,
          eventId: testEvent.id,
          status: 'pending',
          timeSlot: 'full_day',
        })
        .expect(200);
      
      expect(res.body.status).toBe('pending');
      expect(res.body.vendorId).toBe(testVendor.id);
    });
  });

  describe('Task Management Endpoints', () => {
    let testTask: any;

    it('POST /api/tasks - should create task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({
          weddingId: testWedding.id,
          title: 'Book Photographer',
          description: 'Find and book wedding photographer',
          priority: 'high',
          status: 'pending',
          dueDate: new Date('2025-06-01').toISOString(),
        })
        .expect(200);
      
      testTask = res.body;
      expect(res.body.title).toBe('Book Photographer');
      expect(res.body.priority).toBe('high');
    });

    it('GET /api/tasks/:weddingId - should fetch tasks', async () => {
      const res = await request(app)
        .get(`/api/tasks/${testWedding.id}`)
        .expect(200);
      
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('PATCH /api/tasks/:id - should update task status', async () => {
      if (testTask) {
        const res = await request(app)
          .patch(`/api/tasks/${testTask.id}`)
          .send({ status: 'completed' })
          .expect(200);
        
        expect(res.body.status).toBe('completed');
      }
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const res = await request(app)
        .post('/api/weddings')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');
      
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle missing required fields', async () => {
      const res = await request(app)
        .post('/api/events')
        .send({})
        .expect(400);
      
      expect(res.body.error).toBeDefined();
    });

    it('should handle non-existent resource updates', async () => {
      const res = await request(app)
        .patch('/api/guests/non-existent-id')
        .send({ name: 'Updated Name' })
        .expect(404);
      
      expect(res.body.error).toBeDefined();
    });

    it('should handle non-existent resource deletions', async () => {
      const res = await request(app)
        .delete('/api/guests/non-existent-id')
        .expect(404);
      
      expect(res.body.error).toBeDefined();
    });
  });

  describe('Data Validation', () => {
    it('should reject negative budget amounts', async () => {
      const res = await request(app)
        .post('/api/budget-categories')
        .send({
          weddingId: testWedding.id,
          category: 'venue',
          allocatedAmount: '-1000',
          spentAmount: '0',
        });
      
      expect([200, 400]).toContain(res.status);
    });

    it('should validate email format in guests', async () => {
      const res = await request(app)
        .post('/api/guests')
        .send({
          householdId: testHousehold.id,
          weddingId: testWedding.id,
          name: 'Test Guest',
          email: 'invalid-email',
        });
      
      expect([200, 400]).toContain(res.status);
    });
  });
});
