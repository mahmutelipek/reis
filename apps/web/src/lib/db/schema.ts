import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const videos = pgTable("videos", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull().default("Untitled"),
  status: text("status").notNull().default("uploading"),
  muxUploadId: text("mux_upload_id"),
  muxAssetId: text("mux_asset_id"),
  muxPlaybackId: text("mux_playback_id"),
  shareSlug: text("share_slug").notNull().unique(),
  /** bcrypt hash; null = paylaşım herkese açık */
  sharePasswordHash: text("share_password_hash"),
  transcriptStatus: text("transcript_status").default("pending"),
  transcriptText: text("transcript_text"),
  transcriptError: text("transcript_error"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  /** Doluysa kayıt Arşiv sekmesinde gösterilir */
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  /** Mux asset süresi (sn); webhook ile dolar */
  durationSeconds: integer("duration_seconds"),
});

export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;

/** Her izleyici oturumu (video + session_id); max izlenen saniye güncellenir. */
export const videoViews = pgTable(
  "video_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    sessionId: text("session_id").notNull(),
    maxSecondsWatched: integer("max_seconds_watched").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("video_views_video_id_session_id_uidx").on(
      t.videoId,
      t.sessionId,
    ),
  ],
);

export type VideoView = typeof videoViews.$inferSelect;

export const videoComments = pgTable("video_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  videoId: uuid("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type VideoComment = typeof videoComments.$inferSelect;

export const videoReactions = pgTable(
  "video_reactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    kind: text("kind").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("video_reactions_video_user_kind_uidx").on(
      t.videoId,
      t.userId,
      t.kind,
    ),
  ],
);

export type VideoReaction = typeof videoReactions.$inferSelect;

export const userNotifications = pgTable("user_notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  videoId: uuid("video_id")
    .notNull()
    .references(() => videos.id, { onDelete: "cascade" }),
  actorUserId: text("actor_user_id"),
  title: text("title").notNull(),
  body: text("body"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type UserNotification = typeof userNotifications.$inferSelect;
