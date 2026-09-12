import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, numeric, pgTable, text } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const languagesTable = pgTable("languages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nativeName: text("native_name").notNull(),
  code: text("code").notNull().unique(),
  learners: integer("learners").notNull().default(0),
  accent: text("accent").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertLanguageSchema = createInsertSchema(languagesTable);
export type InsertLanguage = z.infer<typeof insertLanguageSchema>;
export type Language = typeof languagesTable.$inferSelect;

export const teachersTable = pgTable("teachers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  avatar: text("avatar").notNull(),
  headline: text("headline").notNull(),
  bio: text("bio").notNull(),
  languages: text("languages").array().notNull(),
  serviceType: text("service_type").notNull(),
  serviceLabel: text("service_label").notNull(),
  rating: numeric("rating", { precision: 3, scale: 1 }).notNull(),
  reviewCount: integer("review_count").notNull().default(0),
  students: integer("students").notNull().default(0),
  online: boolean("online").notNull().default(false),
  pricePerMinute: integer("price_per_minute").notNull(),
  currency: text("currency").notNull().default("DA"),
  experienceYears: integer("experience_years").notNull().default(0),
  specialties: text("specialties").array().notNull(),
  nextAvailable: text("next_available").notNull(),
  accent: text("accent").notNull(),
  isApproved: boolean("is_approved").notNull().default(true),
});

export const insertTeacherSchema = createInsertSchema(teachersTable);
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Teacher = typeof teachersTable.$inferSelect;

export const minutePackagesTable = pgTable("minute_packages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  minutes: integer("minutes").notNull(),
  price: integer("price").notNull(),
  currency: text("currency").notNull().default("DA"),
  popular: boolean("popular").notNull().default(false),
  description: text("description").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertMinutePackageSchema = createInsertSchema(minutePackagesTable);
export type InsertMinutePackage = z.infer<typeof insertMinutePackageSchema>;
export type MinutePackage = typeof minutePackagesTable.$inferSelect;

export const podcastsTable = pgTable("podcasts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  language: text("language").notNull(),
  level: text("level").notNull(),
  duration: text("duration").notNull(),
  xp: integer("xp").notNull().default(0),
  cover: text("cover").notNull(),
  accent: text("accent").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertPodcastSchema = createInsertSchema(podcastsTable);
export type InsertPodcast = z.infer<typeof insertPodcastSchema>;
export type Podcast = typeof podcastsTable.$inferSelect;

export const testimonialsTable = pgTable("testimonials", {
  id: text("id").primaryKey(),
  quote: text("quote").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  avatar: text("avatar").notNull(),
  rating: integer("rating").notNull().default(5),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertTestimonialSchema = createInsertSchema(testimonialsTable);
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonialsTable.$inferSelect;

export const siteStatsTable = pgTable("site_stats", {
  id: text("id").primaryKey(),
  learners: integer("learners").notNull().default(0),
  teachers: integer("teachers").notNull().default(0),
  lessons: integer("lessons").notNull().default(0),
  countries: integer("countries").notNull().default(0),
  rating: numeric("rating", { precision: 3, scale: 1 }).notNull().default("0"),
});

export const insertSiteStatsSchema = createInsertSchema(siteStatsTable);
export type InsertSiteStats = z.infer<typeof insertSiteStatsSchema>;
export type SiteStats = typeof siteStatsTable.$inferSelect;