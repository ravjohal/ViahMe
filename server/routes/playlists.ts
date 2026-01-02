import { Router } from "express";
import type { IStorage } from "../storage";
import {
  insertPlaylistSchema,
  insertPlaylistSongSchema,
  insertSongVoteSchema,
} from "@shared/schema";

export function createPlaylistsRouter(storage: IStorage): Router {
  const router = Router();

  // PLAYLISTS

  router.get("/wedding/:weddingId", async (req, res) => {
    try {
      const playlists = await storage.getPlaylistsByWedding(req.params.weddingId);
      res.json(playlists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch playlists" });
    }
  });

  router.get("/event/:eventId", async (req, res) => {
    try {
      const playlists = await storage.getPlaylistsByEvent(req.params.eventId);
      res.json(playlists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch playlists" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }
      res.json(playlist);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch playlist" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const validatedData = insertPlaylistSchema.parse(req.body);
      const playlist = await storage.createPlaylist(validatedData);
      res.json(playlist);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to create playlist" });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const playlist = await storage.updatePlaylist(req.params.id, req.body);
      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }
      res.json(playlist);
    } catch (error) {
      res.status(500).json({ error: "Failed to update playlist" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const success = await storage.deletePlaylist(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Playlist not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete playlist" });
    }
  });

  // PLAYLIST SONGS

  router.get("/:playlistId/songs", async (req, res) => {
    try {
      const songs = await storage.getSongsByPlaylist(req.params.playlistId);
      res.json(songs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch songs" });
    }
  });

  return router;
}

export function createSongsRouter(storage: IStorage): Router {
  const router = Router();

  router.get("/:id", async (req, res) => {
    try {
      const song = await storage.getPlaylistSong(req.params.id);
      if (!song) {
        return res.status(404).json({ error: "Song not found" });
      }
      res.json(song);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch song" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const validatedData = insertPlaylistSongSchema.parse(req.body);
      const song = await storage.createPlaylistSong(validatedData);
      res.json(song);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to add song" });
    }
  });

  router.patch("/:id", async (req, res) => {
    try {
      const song = await storage.updatePlaylistSong(req.params.id, req.body);
      if (!song) {
        return res.status(404).json({ error: "Song not found" });
      }
      res.json(song);
    } catch (error) {
      res.status(500).json({ error: "Failed to update song" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const success = await storage.deletePlaylistSong(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Song not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete song" });
    }
  });

  router.get("/:songId/votes", async (req, res) => {
    try {
      const votes = await storage.getVotesBySong(req.params.songId);
      res.json(votes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch votes" });
    }
  });

  return router;
}

export function createVotesRouter(storage: IStorage): Router {
  const router = Router();

  router.post("/", async (req, res) => {
    try {
      const validatedData = insertSongVoteSchema.parse(req.body);
      
      const hasVoted = await storage.hasUserVoted(validatedData.voterId, validatedData.songId);
      if (hasVoted) {
        return res.status(400).json({ error: "You have already voted for this song" });
      }
      
      const vote = await storage.createSongVote(validatedData);
      res.json(vote);
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return res.status(400).json({ error: "Validation failed", details: error });
      }
      res.status(500).json({ error: "Failed to vote" });
    }
  });

  router.get("/:voterId/:songId", async (req, res) => {
    try {
      const hasVoted = await storage.hasUserVoted(req.params.voterId, req.params.songId);
      res.json({ hasVoted });
    } catch (error) {
      res.status(500).json({ error: "Failed to check vote status" });
    }
  });

  router.delete("/:voterId/:songId", async (req, res) => {
    try {
      const success = await storage.deleteVote(req.params.voterId, req.params.songId);
      if (!success) {
        return res.status(404).json({ error: "Vote not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove vote" });
    }
  });

  return router;
}
