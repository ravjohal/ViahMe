import { Router } from "express";
import type { IStorage } from "../storage";

function parseConversationId(conversationId: string): { weddingId: string; vendorId: string; eventId?: string } | null {
  const parts = conversationId.split("-");
  if (parts.length < 2) return null;
  
  if (parts.length === 3) {
    return { weddingId: parts[0], vendorId: parts[1], eventId: parts[2] };
  }
  return { weddingId: parts[0], vendorId: parts[1] };
}

export async function registerNotificationRoutes(router: Router, storage: IStorage) {
  router.get("/couple/:weddingId", async (req, res) => {
    try {
      const weddingId = req.params.weddingId;
      
      const allUnreadMessages = await storage.getUnreadVendorMessagesByWedding(weddingId);
      
      const messagesByConversation = new Map<string, typeof allUnreadMessages>();
      for (const msg of allUnreadMessages) {
        const convId = msg.conversationId;
        if (!messagesByConversation.has(convId)) {
          messagesByConversation.set(convId, []);
        }
        messagesByConversation.get(convId)!.push(msg);
      }
      
      const vendorIds = new Set<string>();
      for (const convId of messagesByConversation.keys()) {
        const parsed = parseConversationId(convId);
        if (parsed) {
          vendorIds.add(parsed.vendorId);
        }
      }
      
      const [vendors, events] = await Promise.all([
        storage.getVendorsByIds(Array.from(vendorIds)),
        storage.getEventsByWedding(weddingId),
      ]);
      const vendorMap = new Map(vendors.map(v => [v.id, v]));
      const eventMap = new Map(events.map(e => [e.id, e]));
      
      const unreadVendorMessages: Array<{
        type: 'unread_message';
        vendorId: string;
        vendorName: string;
        eventId?: string;
        eventName?: string;
        unreadCount: number;
        conversationId: string;
        latestMessage: string;
        createdAt: Date;
      }> = [];
      
      for (const [convId, messages] of messagesByConversation) {
        const parsed = parseConversationId(convId);
        if (parsed) {
          const vendor = vendorMap.get(parsed.vendorId);
          const event = parsed.eventId ? eventMap.get(parsed.eventId) : undefined;
          const latestUnread = messages[0];
          
          unreadVendorMessages.push({
            type: 'unread_message',
            vendorId: parsed.vendorId,
            vendorName: vendor?.name || 'Unknown Vendor',
            eventId: parsed.eventId,
            eventName: event?.name,
            unreadCount: messages.length,
            conversationId: convId,
            latestMessage: latestUnread.content.slice(0, 100) + (latestUnread.content.length > 100 ? '...' : ''),
            createdAt: latestUnread.createdAt,
          });
        }
      }
      
      const collaborators = await storage.getWeddingCollaboratorsByWedding(weddingId);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentJoins = collaborators
        .filter(c => c.status === 'accepted' && c.acceptedAt && new Date(c.acceptedAt) > sevenDaysAgo)
        .map(c => ({
          type: 'team_join' as const,
          collaboratorId: c.id,
          email: c.email,
          displayName: c.displayName,
          acceptedAt: c.acceptedAt!,
        }));
      
      const notifications: Array<{
        id: string;
        type: 'unread_message' | 'team_join';
        title: string;
        description: string;
        link: string;
        createdAt: Date;
      }> = [];
      
      for (const msg of unreadVendorMessages) {
        const eventSuffix = msg.eventName ? ` for ${msg.eventName}` : '';
        notifications.push({
          id: `msg-${msg.conversationId}`,
          type: 'unread_message',
          title: `${msg.unreadCount} unread message${msg.unreadCount > 1 ? 's' : ''} from ${msg.vendorName}${eventSuffix}`,
          description: msg.latestMessage,
          link: `/messages?conversation=${msg.conversationId}`,
          createdAt: msg.createdAt,
        });
      }
      
      for (const join of recentJoins) {
        notifications.push({
          id: `join-${join.collaboratorId}`,
          type: 'team_join',
          title: `${join.displayName || join.email} joined your team`,
          description: 'A new team member has accepted your invitation',
          link: '/collaborators',
          createdAt: join.acceptedAt,
        });
      }
      
      notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json({
        notifications,
        totalCount: notifications.length,
        unreadMessageCount: unreadVendorMessages.reduce((sum, m) => sum + m.unreadCount, 0),
        teamJoinCount: recentJoins.length,
      });
    } catch (error) {
      console.error("Error fetching couple notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });
}
