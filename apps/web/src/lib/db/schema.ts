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
