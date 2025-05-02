import { pgTable, text, serial, integer, timestamp, decimal, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull().unique(),
  role: text("role").notNull().default("user"), // user, driver, admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // No updatedAt in the actual database
});

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  drivers: many(drivers),
}));

export const usersInsertSchema = createInsertSchema(users, {
  phoneNumber: (schema) => schema.regex(/^\d{10}$/, "Phone number must be 10 digits"),
  role: (schema) => schema.refine((val) => ["user", "driver", "admin"].includes(val), "Invalid role"),
});

export type InsertUser = z.infer<typeof usersInsertSchema>;
export type User = typeof users.$inferSelect;

// Driver table
export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  fullName: text("full_name").notNull(),
  vehicleType: text("vehicle_type").notNull(),
  vehicleModel: text("vehicle_model"),
  vehicleNumber: text("vehicle_number").notNull(),
  licenseUrl: text("license_url"),
  idProofUrl: text("id_proof_url"),
  selfieUrl: text("selfie_url"),
  isVerified: boolean("is_verified").default(false).notNull(),
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // No updatedAt in the actual database
});

export const driversRelations = relations(drivers, ({ one, many }) => ({
  user: one(users, { fields: [drivers.userId], references: [users.id] }),
  bookings: many(bookings),
}));

export const driversInsertSchema = createInsertSchema(drivers, {
  fullName: (schema) => schema.min(3, "Full name must be at least 3 characters"),
  vehicleType: (schema) => schema.min(2, "Vehicle type must be at least 2 characters"),
  vehicleNumber: (schema) => schema.min(4, "Vehicle number must be at least 4 characters"),
});

export type InsertDriver = z.infer<typeof driversInsertSchema>;
export type Driver = typeof drivers.$inferSelect;

// Booking table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  driverId: integer("driver_id").references(() => drivers.id),
  pickupLocation: text("pickup_location").notNull(),
  dropLocation: text("drop_location").notNull(),
  date: text("date").notNull(), // Note: This is a text field, not timestamp in the actual database
  passengers: integer("passengers").notNull(),
  rideType: text("ride_type").notNull(), // local, outstation, roundtrip
  luggage: boolean("luggage").default(false).notNull(),
  kids: boolean("kids").default(false).notNull(),
  elderPassenger: boolean("elder_passenger").default(false).notNull(),
  pets: boolean("pets").default(false).notNull(),
  specialRequests: text("special_requests"),
  estimatedFare: decimal("estimated_fare", { precision: 10, scale: 2 }),
  status: text("status").default("pending").notNull(), // pending, assigned, on_the_way, completed, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // No updatedAt in the actual database
});

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  driver: one(drivers, { fields: [bookings.driverId], references: [drivers.id] }),
}));

export const bookingsInsertSchema = createInsertSchema(bookings, {
  pickupLocation: (schema) => schema.min(3, "Pickup location must be at least 3 characters"),
  dropLocation: (schema) => schema.min(3, "Drop location must be at least 3 characters"),
  rideType: (schema) => schema.refine((val) => ["local", "outstation", "roundtrip"].includes(val), "Invalid ride type"),
  passengers: (schema) => schema.min(1, "Passengers must be at least 1").max(10, "Passengers must be at most 10"),
});

export type InsertBooking = z.infer<typeof bookingsInsertSchema>;
export type Booking = typeof bookings.$inferSelect;

// Testimonials table
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  avatarUrl: text("avatar_url"),
  isVisible: boolean("is_visible").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const testimonialsRelations = relations(testimonials, ({ one }) => ({
  user: one(users, { fields: [testimonials.userId], references: [users.id] }),
}));

export const testimonialsInsertSchema = createInsertSchema(testimonials, {
  rating: (schema) => schema.min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  comment: (schema) => schema.min(10, "Comment must be at least 10 characters").max(500, "Comment must be at most 500 characters"),
});

export type InsertTestimonial = z.infer<typeof testimonialsInsertSchema>;
export type Testimonial = typeof testimonials.$inferSelect;

// OTP table for phone verification
export const otps = pgTable("otps", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const otpsInsertSchema = createInsertSchema(otps);
export type InsertOtp = z.infer<typeof otpsInsertSchema>;
export type Otp = typeof otps.$inferSelect;

// Driver earnings table
export const earnings = pgTable("earnings", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").references(() => drivers.id).notNull(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

export const earningsRelations = relations(earnings, ({ one }) => ({
  driver: one(drivers, { fields: [earnings.driverId], references: [drivers.id] }),
  booking: one(bookings, { fields: [earnings.bookingId], references: [bookings.id] }),
}));

export const earningsInsertSchema = createInsertSchema(earnings);
export type InsertEarning = z.infer<typeof earningsInsertSchema>;
export type Earning = typeof earnings.$inferSelect;
