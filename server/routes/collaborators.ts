import { Router } from "express";
import { z } from "zod";
import type { IStorage } from "../storage";
import { insertWeddingRoleSchema } from "@shared/schema";
import { sendCollaboratorInviteEmail } from "../email";

export function createRolesRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/weddings/:weddingId", async (req, res) => {
    const { weddingId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { isOwner, permissions } = await storage.getUserPermissionsForWedding(userId, weddingId);
      if (!isOwner && permissions.size === 0) {
        return res.status(403).json({ error: "You do not have access to this wedding" });
      }
      
      let roles = await storage.getWeddingRolesByWedding(weddingId);
      
      const roleDescriptions: Record<string, string> = {
        owner: "Full access to all sections",
        wedding_planner: "Access to: Guests, Invitations, Timeline, Tasks, Vendors, Photos, Documents, Concierge, Contracts, Website, Playlists, Messages",
        family_member: "Access to: Guest List (view), Timeline (view), Tasks (view), Vendors (view), Photos (edit), Playlists (edit)",
        guest_coordinator: "Access to: Guests (manage), Invitations (manage), Timeline (view), Concierge (edit)",
      };
      
      roles = roles.map(role => {
        if (role.isSystem && !role.description && roleDescriptions[role.name as keyof typeof roleDescriptions]) {
          return {
            ...role,
            description: roleDescriptions[role.name as keyof typeof roleDescriptions],
          };
        }
        return role;
      });
      
      const rolesWithPermissions = await Promise.all(
        roles.map(async (role) => {
          const permissions = await storage.getRolePermissions(role.id);
          return { ...role, permissions };
        })
      );
      
      res.json(rolesWithPermissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/:roleId", async (req, res) => {
    const { roleId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const role = await storage.getWeddingRoleWithPermissions(roleId);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      
      const { isOwner, permissions } = await storage.getUserPermissionsForWedding(userId, role.weddingId);
      if (!isOwner && permissions.size === 0) {
        return res.status(403).json({ error: "You do not have access to this wedding" });
      }
      
      res.json(role);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/weddings/:weddingId", async (req, res) => {
    const { weddingId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const hasPermission = await storage.checkUserPermission(userId, weddingId, "collaborators", "manage");
      if (!hasPermission) {
        return res.status(403).json({ error: "You do not have permission to manage roles" });
      }
      
      let permissionsArray: Array<{ category: string; level: string }> = [];
      if (req.body.permissions) {
        if (Array.isArray(req.body.permissions)) {
          permissionsArray = req.body.permissions;
        } else if (typeof req.body.permissions === 'object') {
          permissionsArray = Object.entries(req.body.permissions)
            .filter(([_, level]) => level !== "none")
            .map(([category, level]) => ({ category, level: level as string }));
        }
      }
      
      const roleData = insertWeddingRoleSchema.parse({
        weddingId,
        name: req.body.name,
        displayName: req.body.name,
        description: req.body.description || null,
        isSystem: false,
        isOwner: false,
      });
      const role = await storage.createWeddingRole(roleData);
      
      if (permissionsArray.length > 0) {
        await storage.setRolePermissions(role.id, permissionsArray as any);
      }
      
      await storage.logCollaboratorActivity({
        weddingId,
        collaboratorId: null,
        userId,
        action: "role_created",
        targetType: "role",
        targetId: role.id,
        details: { roleName: role.displayName },
      });
      
      res.status(201).json(role);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.patch("/:roleId", async (req, res) => {
    const { roleId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const role = await storage.getWeddingRole(roleId);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      
      const hasPermission = await storage.checkUserPermission(userId, role.weddingId, "collaborators", "manage");
      if (!hasPermission) {
        return res.status(403).json({ error: "You do not have permission to manage roles" });
      }
      
      if (role.isSystem && (req.body.name || req.body.isOwner !== undefined)) {
        return res.status(400).json({ error: "Cannot modify system role core properties" });
      }
      
      const updatedRole = await storage.updateWeddingRole(roleId, req.body);
      
      if (req.body.permissions && Array.isArray(req.body.permissions)) {
        await storage.setRolePermissions(roleId, req.body.permissions);
      }
      
      res.json(updatedRole);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete("/:roleId", async (req, res) => {
    const { roleId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const role = await storage.getWeddingRole(roleId);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      
      const hasPermission = await storage.checkUserPermission(userId, role.weddingId, "collaborators", "manage");
      if (!hasPermission) {
        return res.status(403).json({ error: "You do not have permission to manage roles" });
      }
      
      const success = await storage.deleteWeddingRole(roleId);
      if (!success) {
        return res.status(400).json({ error: "Cannot delete system or owner roles" });
      }
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete("/:roleId/permissions", async (req, res) => {
    const { roleId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const role = await storage.getWeddingRole(roleId);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      
      const hasPermission = await storage.checkUserPermission(userId, role.weddingId, "collaborators", "manage");
      if (!hasPermission) {
        return res.status(403).json({ error: "You do not have permission to manage roles" });
      }
      
      await storage.deleteRolePermissions(roleId);
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/weddings/:weddingId/initialize", async (req, res) => {
    const { weddingId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      
      if (wedding.userId !== userId) {
        return res.status(403).json({ error: "Only the wedding owner can initialize roles" });
      }
      
      const existingRoles = await storage.getWeddingRolesByWedding(weddingId);
      if (existingRoles.length > 0) {
        return res.status(400).json({ error: "Roles already initialized for this wedding" });
      }
      
      const roles = await storage.createDefaultRolesForWedding(weddingId);
      
      for (const role of roles) {
        await storage.logCollaboratorActivity({
          weddingId,
          collaboratorId: null,
          userId,
          action: "role_created",
          targetType: "role",
          targetId: role.id,
          details: { roleName: role.displayName },
        });
      }
      
      res.status(201).json(roles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

const inviteCollaboratorSchema = z.object({
  email: z.string().email("Valid email is required"),
  name: z.string().optional(),
  roleId: z.string().min(1, "Role ID is required"),
});

export function createCollaboratorsRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/weddings/:weddingId", async (req, res) => {
    const { weddingId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { isOwner, permissions } = await storage.getUserPermissionsForWedding(userId, weddingId);
      if (!isOwner && !permissions.get("collaborators")) {
        return res.status(403).json({ error: "You do not have access to view collaborators" });
      }
      
      const collaborators = await storage.getCollaboratorsWithDetailsByWedding(weddingId);
      
      const sanitized = collaborators.map(c => ({
        ...c,
        inviteToken: undefined,
        inviteTokenExpires: c.inviteTokenExpires ? c.inviteTokenExpires : undefined,
      }));
      
      res.json(sanitized);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/weddings/:weddingId", async (req, res) => {
    const { weddingId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const parseResult = inviteCollaboratorSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: parseResult.error.errors 
        });
      }
      const { email, name, roleId } = parseResult.data;
      
      const hasPermission = await storage.checkUserPermission(userId, weddingId, "collaborators", "manage");
      if (!hasPermission) {
        return res.status(403).json({ error: "You do not have permission to invite collaborators" });
      }
      
      const existing = await storage.getWeddingCollaboratorByEmail(weddingId, email);
      if (existing) {
        return res.status(400).json({ error: "This email has already been invited" });
      }
      
      const role = await storage.getWeddingRole(roleId);
      if (!role || role.weddingId !== weddingId) {
        return res.status(400).json({ error: "Invalid role" });
      }
      
      if (role.isOwner) {
        return res.status(400).json({ error: "Cannot assign owner role to collaborators" });
      }
      
      const collaborator = await storage.createWeddingCollaborator({
        weddingId,
        email: email.toLowerCase(),
        name: name || null,
        roleId,
        invitedBy: userId,
        status: "pending",
      });
      
      const inviteToken = await storage.generateCollaboratorInviteToken(collaborator.id);
      
      await storage.logCollaboratorActivity({
        weddingId,
        collaboratorId: collaborator.id,
        userId,
        action: "invited",
        targetType: "collaborator",
        targetId: collaborator.id,
        details: { email, roleName: role.displayName },
      });
      
      const wedding = await storage.getWedding(weddingId);
      const inviter = await storage.getUser(userId);
      
      // Build full invite URL
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : process.env.REPLIT_DEPLOYMENT_URL || 'https://viah.me';
      const fullInviteUrl = `${baseUrl}/accept-invite?token=${inviteToken}`;
      
      // Send invitation email
      console.log("[Collaborator Invite] Attempting to send email...");
      console.log("[Collaborator Invite] Email params:", {
        to: email,
        inviterName: inviter?.name || inviter?.email || "Your partner",
        weddingTitle: wedding?.title || "Wedding",
        roleName: role.displayName,
        inviteUrl: fullInviteUrl,
      });
      try {
        const emailResult = await sendCollaboratorInviteEmail({
          to: email,
          inviterName: inviter?.name || inviter?.email || "Your partner",
          weddingTitle: wedding?.title || "Wedding",
          roleName: role.displayName,
          inviteUrl: fullInviteUrl,
        });
        console.log("[Collaborator Invite] Email sent successfully:", emailResult);
      } catch (emailError: any) {
        console.error("[Collaborator Invite] Failed to send invitation email:");
        console.error("[Collaborator Invite] Error message:", emailError?.message);
        console.error("[Collaborator Invite] Full error:", emailError);
        // Don't fail the request if email fails - collaborator is still created
      }
      
      res.status(201).json({
        ...collaborator,
        inviteToken,
        inviteUrl: `/accept-invite?token=${inviteToken}`,
        weddingTitle: wedding?.title || "Wedding",
        email,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.patch("/:collaboratorId", async (req, res) => {
    const { collaboratorId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const collaborator = await storage.getWeddingCollaborator(collaboratorId);
      if (!collaborator) {
        return res.status(404).json({ error: "Collaborator not found" });
      }
      
      const hasPermission = await storage.checkUserPermission(userId, collaborator.weddingId, "collaborators", "manage");
      if (!hasPermission) {
        return res.status(403).json({ error: "You do not have permission to manage collaborators" });
      }
      
      if (req.body.roleId) {
        const role = await storage.getWeddingRole(req.body.roleId);
        if (!role || role.weddingId !== collaborator.weddingId) {
          return res.status(400).json({ error: "Invalid role" });
        }
        if (role.isOwner) {
          return res.status(400).json({ error: "Cannot assign owner role to collaborators" });
        }
      }
      
      const updated = await storage.updateWeddingCollaborator(collaboratorId, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete("/:collaboratorId", async (req, res) => {
    const { collaboratorId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const collaborator = await storage.getWeddingCollaborator(collaboratorId);
      if (!collaborator) {
        return res.status(404).json({ error: "Collaborator not found" });
      }
      
      const hasPermission = await storage.checkUserPermission(userId, collaborator.weddingId, "collaborators", "manage");
      if (!hasPermission) {
        return res.status(403).json({ error: "You do not have permission to manage collaborators" });
      }
      
      await storage.logCollaboratorActivity({
        weddingId: collaborator.weddingId,
        collaboratorId: collaborator.id,
        userId,
        action: "removed",
        targetType: "collaborator",
        targetId: collaborator.id,
        details: { email: collaborator.email },
      });
      
      await storage.deleteWeddingCollaborator(collaboratorId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/:collaboratorId/resend-invite", async (req, res) => {
    const { collaboratorId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const collaborator = await storage.getWeddingCollaborator(collaboratorId);
      if (!collaborator) {
        return res.status(404).json({ error: "Collaborator not found" });
      }
      
      if (collaborator.status !== "pending") {
        return res.status(400).json({ error: "Can only resend invites for pending collaborators" });
      }
      
      const hasPermission = await storage.checkUserPermission(userId, collaborator.weddingId, "collaborators", "manage");
      if (!hasPermission) {
        return res.status(403).json({ error: "You do not have permission to manage collaborators" });
      }
      
      const inviteToken = await storage.generateCollaboratorInviteToken(collaboratorId);
      
      await storage.logCollaboratorActivity({
        weddingId: collaborator.weddingId,
        collaboratorId: collaborator.id,
        userId,
        action: "invite_resent",
        targetType: "collaborator",
        targetId: collaborator.id,
        details: { email: collaborator.email },
      });
      
      const wedding = await storage.getWedding(collaborator.weddingId);
      
      res.json({
        success: true,
        inviteToken,
        inviteUrl: `/accept-invite?token=${inviteToken}`,
        weddingTitle: wedding?.title || "Wedding",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

export function createCollaboratorInvitesRouter(storage: IStorage): Router {
  const router = Router();

  router.post("/:token", async (req, res) => {
    const { token } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Please log in to accept this invitation" });
    }
    
    try {
      const collaborator = await storage.acceptCollaboratorInvite(token, userId);
      
      if (!collaborator) {
        return res.status(400).json({ error: "Invalid or expired invitation" });
      }
      
      await storage.logCollaboratorActivity({
        weddingId: collaborator.weddingId,
        collaboratorId: collaborator.id,
        userId,
        action: "accepted_invite",
        targetType: "collaborator",
        targetId: collaborator.id,
        details: { email: collaborator.email },
      });
      
      res.json({ success: true, weddingId: collaborator.weddingId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/:token", async (req, res) => {
    const { token } = req.params;
    
    try {
      const collaborator = await storage.getWeddingCollaboratorByToken(token);
      
      if (!collaborator) {
        return res.status(404).json({ error: "Invalid or expired invitation" });
      }
      
      const wedding = await storage.getWedding(collaborator.weddingId);
      const role = await storage.getWeddingRole(collaborator.roleId);
      
      res.json({
        email: collaborator.email,
        name: collaborator.name,
        roleName: role?.displayName,
        weddingTitle: wedding?.title,
        partnerNames: wedding ? `${wedding.partner1Name} & ${wedding.partner2Name}` : undefined,
        expiresAt: collaborator.inviteTokenExpires,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

export function createCollaboratorActivityRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/weddings/:weddingId", async (req, res) => {
    const { weddingId } = req.params;
    const userId = req.session?.userId;
    const limit = parseInt(req.query.limit as string) || 50;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const hasPermission = await storage.checkUserPermission(userId, weddingId, "collaborators", "view");
      if (!hasPermission) {
        return res.status(403).json({ error: "You do not have permission to view collaborator activity" });
      }
      
      const activity = await storage.getCollaboratorActivityLog(weddingId, limit);
      res.json(activity);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

export function createPermissionsRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/weddings/:weddingId/my-permissions", async (req, res) => {
    const { weddingId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const { isOwner, permissions } = await storage.getUserPermissionsForWedding(userId, weddingId);
      
      const permissionsObject: Record<string, string> = {};
      permissions.forEach((level, category) => {
        permissionsObject[category] = level;
      });
      
      res.json({
        isOwner,
        permissions: permissionsObject,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/weddings/:weddingId/my-role", async (req, res) => {
    const { weddingId } = req.params;
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const wedding = await storage.getWedding(weddingId);
      if (!wedding) {
        return res.status(404).json({ error: "Wedding not found" });
      }
      
      if (wedding.userId === userId) {
        return res.json({ role: null, isOwner: true });
      }
      
      const collaborators = await storage.getWeddingCollaboratorsByWedding(weddingId);
      const collaborator = collaborators.find(c => c.userId === userId && c.status === 'accepted');
      
      if (!collaborator) {
        return res.json({ role: null, isOwner: false });
      }
      
      const role = await storage.getWeddingRole(collaborator.roleId);
      
      res.json({ role: role || null, isOwner: false });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

export function createMyCollaborationsRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const weddings = await storage.getWeddingsByCollaboratorUser(userId);
      res.json(weddings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
