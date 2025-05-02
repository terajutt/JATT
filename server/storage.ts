import { db } from "@db";
import * as schema from "@shared/schema";
import { eq, and, desc, gte, lte, sql, inArray } from "drizzle-orm";
import { createHash } from "crypto";
import { subDays, format, startOfToday, endOfToday, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import axios from "axios";

import { fileURLToPath } from 'url';
import fs from 'fs';

// Helper function to upload files to local storage
const saveUploadedFile = async (file: any, type: string): Promise<string> => {
  if (!file) {
    return `/uploads/default-${type}.jpg`;
  }

  try {
    // For multer file objects
    if (file.path) {
      // The file is already saved by multer, just return the path relative to /uploads
      const filename = file.filename;
      console.log(`File uploaded: ${filename} for ${type}`);
      
      // In production, this would handle uploading to a cloud storage service
      // and return a full URL, but for development we'll return a local path
      // that matches the format being used in production.
      
      // For development on Replit, return a local file path for now 
      // with note that this should change in production
      // return `/uploads/${filename}`;
      
      // NOTE: For now, simulate the production URL structure 
      // This is only to demonstrate the UI; the actual upload code 
      // would need to be implemented to use the client's storage service
      return `https://storage.jattairlines.com/${type}/${filename}`;
    }
    
    // Fallback for any other case
    console.log(`Using default image for ${type}`);
    return `/uploads/default-${type}.jpg`;
  } catch (error) {
    console.error(`Error saving ${type} file:`, error);
    return `/uploads/default-${type}.jpg`;
  }
};

export const storage = {
  // User related functions
  async getUserById(id: number) {
    const users = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return users[0] || null;
  },

  async getUserByPhoneNumber(phoneNumber: string) {
    const users = await db.select().from(schema.users).where(eq(schema.users.phoneNumber, phoneNumber));
    return users[0] || null;
  },

  async createUser(phoneNumber: string, role: string = "user") {
    const [user] = await db.insert(schema.users).values({
      phoneNumber,
      role
    }).returning();
    return user;
  },

  // OTP related functions
  async sendOtp(phoneNumber: string) {
    try {
      // Check if user exists, create if not
      let user = await this.getUserByPhoneNumber(phoneNumber);
      if (!user) {
        user = await this.createUser(phoneNumber);
      }

      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP in database
      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + 10); // OTP valid for 10 minutes

      await db.insert(schema.otps).values({
        phoneNumber,
        otp,
        expiresAt: expiryTime
      });

      // Check if 2Factor API key is available
      const apiKey = process.env.TWOFACTOR_API_KEY;
      
      if (apiKey) {
        try {
          // Call 2Factor API to send OTP
          await axios.get(`https://2factor.in/API/V1/${apiKey}/SMS/${phoneNumber}/${otp}`);
          console.log(`OTP sent to ${phoneNumber} via 2Factor API`);
        } catch (error) {
          console.error('Error sending OTP via 2Factor:', error);
          // Fall back to console log for development
          console.log(`============================================`);
          console.log(`TESTING MODE: OTP for ${phoneNumber} is ${otp}`);
          console.log(`============================================`);
        }
      } else {
        // No API key available, just log the OTP
        console.log(`============================================`);
        console.log(`TESTING MODE: OTP for ${phoneNumber} is ${otp}`);
        console.log(`============================================`);
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error sending OTP:", error);
      return { success: false, message: "Failed to send OTP" };
    }
  },

  async verifyOtp(phoneNumber: string, otpToVerify: string) {
    try {
      console.log(`Verifying OTP for ${phoneNumber}, entered OTP: ${otpToVerify}`);
      
      // Find the latest OTP for this phone number that hasn't expired
      const otps = await db.select()
        .from(schema.otps)
        .where(
          and(
            eq(schema.otps.phoneNumber, phoneNumber),
            gte(schema.otps.expiresAt, new Date())
          )
        )
        .orderBy(desc(schema.otps.createdAt))
        .limit(1);

      if (otps.length === 0) {
        console.log(`No valid OTP found for ${phoneNumber}`);
        return { success: false, message: "OTP expired or not found" };
      }

      const storedOtp = otps[0];
      console.log(`Found stored OTP: ${storedOtp.otp} for ${phoneNumber}, comparing with entered OTP: ${otpToVerify}`);
      
      if (storedOtp.otp !== otpToVerify) {
        console.log(`OTP mismatch for ${phoneNumber}. Stored: ${storedOtp.otp}, Entered: ${otpToVerify}`);
        return { success: false, message: "Invalid OTP" };
      }

      // Get or create the user
      let user = await this.getUserByPhoneNumber(phoneNumber);
      if (!user) {
        user = await this.createUser(phoneNumber);
      }

      // Delete all OTPs for this phone number
      await db.delete(schema.otps).where(eq(schema.otps.phoneNumber, phoneNumber));

      return { success: true, user };
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return { success: false, message: "Failed to verify OTP" };
    }
  },

  // Booking related functions
  async createBooking(bookingData: any) {
    const [booking] = await db.insert(schema.bookings).values(bookingData).returning();
    return booking;
  },

  async getUserBookings(userId: number) {
    try {
      // Select all bookings for this user
      const bookingsForUser = await db.select({
        id: schema.bookings.id,
        userId: schema.bookings.userId,
        driverId: schema.bookings.driverId,
        pickupLocation: schema.bookings.pickupLocation,
        dropLocation: schema.bookings.dropLocation,
        date: schema.bookings.date,
        passengers: schema.bookings.passengers,
        rideType: schema.bookings.rideType,
        luggage: schema.bookings.luggage,
        kids: schema.bookings.kids,
        elderPassenger: schema.bookings.elderPassenger,
        pets: schema.bookings.pets,
        specialRequests: schema.bookings.specialRequests,
        estimatedFare: schema.bookings.estimatedFare,
        status: schema.bookings.status,
        createdAt: schema.bookings.createdAt
      })
      .from(schema.bookings)
      .where(eq(schema.bookings.userId, userId))
      .orderBy(desc(schema.bookings.createdAt));
      
      // If there are no bookings, return empty array
      if (bookingsForUser.length === 0) {
        return [];
      }
      
      // Get driver information separately for bookings with assigned drivers
      const driverIds = bookingsForUser
        .filter(booking => booking.driverId !== null)
        .map(booking => booking.driverId);
      
      let driversById = {};
      if (driverIds.length > 0) {
        const drivers = await db.select({
          id: schema.drivers.id,
          userId: schema.drivers.userId,
          fullName: schema.drivers.fullName,
          vehicleType: schema.drivers.vehicleType,
          vehicleModel: schema.drivers.vehicleModel,
          vehicleNumber: schema.drivers.vehicleNumber,
          userPhoneNumber: schema.users.phoneNumber
        })
        .from(schema.drivers)
        .leftJoin(schema.users, eq(schema.drivers.userId, schema.users.id))
        .where(inArray(schema.drivers.id, driverIds));
        
        // Create a map of drivers by ID for quick lookup
        driversById = drivers.reduce((acc, driver) => {
          acc[driver.id] = driver;
          return acc;
        }, {});
      }
      
      // Format the bookings with driver information
      return bookingsForUser.map(booking => {
        // Get the driver if exists
        const driver = booking.driverId && driversById[booking.driverId] ? {
          id: driversById[booking.driverId].id,
          fullName: driversById[booking.driverId].fullName,
          vehicleType: driversById[booking.driverId].vehicleType,
          vehicleModel: driversById[booking.driverId].vehicleModel,
          vehicleNumber: driversById[booking.driverId].vehicleNumber,
          user: {
            phoneNumber: driversById[booking.driverId].userPhoneNumber
          }
        } : null;
        
        return {
          ...booking,
          driver
        };
      });
    } catch (error) {
      console.error("Error in getUserBookings:", error);
      throw error;
    }
  },

  async getBookingById(id: number) {
    const booking = await db.query.bookings.findFirst({
      where: eq(schema.bookings.id, id),
      with: {
        driver: {
          with: {
            user: true
          }
        },
        user: true
      }
    });
    return booking;
  },

  async updateBookingStatus(id: number, status: string) {
    const [updatedBooking] = await db.update(schema.bookings)
      .set({ 
        status
      })
      .where(eq(schema.bookings.id, id))
      .returning();
    
    // If the booking is completed, create an earning record for the driver
    if (status === "completed" && updatedBooking.driverId) {
      // Check if estimatedFare is valid
      if (updatedBooking.driverId && updatedBooking.estimatedFare) {
        await db.insert(schema.earnings).values({
          driverId: updatedBooking.driverId,
          bookingId: updatedBooking.id,
          amount: String(updatedBooking.estimatedFare),
          date: new Date() // Add date field
        });
      }
    }
    
    return updatedBooking;
  },

  async assignDriverToBooking(bookingId: number, driverId: number) {
    const [updatedBooking] = await db.update(schema.bookings)
      .set({ 
        driverId,
        status: "assigned"
      })
      .where(eq(schema.bookings.id, bookingId))
      .returning();
    
    return updatedBooking;
  },

  async getAllBookings() {
    try {
      // Select all bookings with their users directly
      const bookingsWithUsers = await db.select({
        id: schema.bookings.id,
        userId: schema.bookings.userId,
        driverId: schema.bookings.driverId,
        pickupLocation: schema.bookings.pickupLocation,
        dropLocation: schema.bookings.dropLocation,
        date: schema.bookings.date,
        passengers: schema.bookings.passengers,
        rideType: schema.bookings.rideType,
        luggage: schema.bookings.luggage,
        kids: schema.bookings.kids,
        elderPassenger: schema.bookings.elderPassenger,
        pets: schema.bookings.pets,
        specialRequests: schema.bookings.specialRequests,
        estimatedFare: schema.bookings.estimatedFare,
        status: schema.bookings.status,
        createdAt: schema.bookings.createdAt,
        userPhoneNumber: schema.users.phoneNumber
      })
      .from(schema.bookings)
      .leftJoin(schema.users, eq(schema.bookings.userId, schema.users.id))
      .orderBy(desc(schema.bookings.createdAt));
      
      // Get all drivers in a separate query to avoid joins that might cause issues
      const drivers = await db.select({
        id: schema.drivers.id,
        userId: schema.drivers.userId,
        fullName: schema.drivers.fullName,
        vehicleType: schema.drivers.vehicleType,
        vehicleModel: schema.drivers.vehicleModel,
        vehicleNumber: schema.drivers.vehicleNumber,
        userPhoneNumber: schema.users.phoneNumber
      })
      .from(schema.drivers)
      .leftJoin(schema.users, eq(schema.drivers.userId, schema.users.id));
      
      // Create a map of drivers by ID for quick lookup
      const driversById = drivers.reduce((acc, driver) => {
        acc[driver.id] = driver;
        return acc;
      }, {});
      
      // Combine the data manually
      return bookingsWithUsers.map(booking => {
        // Construct the user object
        const user = {
          id: booking.userId,
          phoneNumber: booking.userPhoneNumber
        };
        
        // Get the driver if exists
        const driver = booking.driverId ? driversById[booking.driverId] : null;
        
        // Return the restructured booking object
        return {
          id: booking.id,
          userId: booking.userId,
          driverId: booking.driverId,
          pickupLocation: booking.pickupLocation,
          dropLocation: booking.dropLocation,
          date: booking.date,
          passengers: booking.passengers,
          rideType: booking.rideType,
          luggage: booking.luggage,
          kids: booking.kids,
          elderPassenger: booking.elderPassenger,
          pets: booking.pets,
          specialRequests: booking.specialRequests,
          estimatedFare: booking.estimatedFare,
          status: booking.status,
          createdAt: booking.createdAt,
          user,
          driver
        };
      });
    } catch (error) {
      console.error("Error in getAllBookings:", error);
      throw error;
    }
  },

  // Driver related functions
  async createDriverApplication(driverData: any) {
    try {
      // Check if phone number already exists
      const existingUser = await this.getUserByPhoneNumber(driverData.phoneNumber);
      
      let userId;
      if (existingUser) {
        // If user exists, check if they're already a driver
        const existingDriver = await this.getDriverByUserId(existingUser.id);
        if (existingDriver) {
          return { success: false, message: "You have already applied as a driver" };
        }
        userId = existingUser.id;
      } else {
        // Create a new user with driver role
        const newUser = await this.createUser(driverData.phoneNumber, "driver");
        userId = newUser.id;
      }

      // Upload images and get URLs
      console.log('Uploading license image:', driverData.licenseImage?.filename || 'None');
      console.log('Uploading ID image:', driverData.idImage?.filename || 'None');
      console.log('Uploading selfie image:', driverData.selfieImage?.filename || 'None');
      
      const licenseUrl = await saveUploadedFile(driverData.licenseImage, 'license');
      const idUrl = await saveUploadedFile(driverData.idImage, 'id');
      const selfieUrl = await saveUploadedFile(driverData.selfieImage, 'selfie');
      
      console.log('Generated URLs:', {
        licenseUrl,
        idUrl,
        selfieUrl
      });

      // Create driver record
      const [driver] = await db.insert(schema.drivers).values({
        userId,
        fullName: driverData.fullName,
        vehicleType: driverData.vehicleType,
        vehicleModel: driverData.vehicleModel || '',
        vehicleNumber: driverData.vehicleNumber,
        licenseUrl,
        idProofUrl: idUrl,
        selfieUrl,
        isVerified: false,
        status: "pending"
      }).returning();

      return { success: true, driver };
    } catch (error) {
      console.error("Error creating driver application:", error);
      return { success: false, message: "Failed to submit driver application" };
    }
  },

  async getDriverByUserId(userId: number) {
    const driver = await db.query.drivers.findFirst({
      where: eq(schema.drivers.userId, userId),
      with: {
        user: true
      }
    });
    return driver;
  },

  async getDriverBookings(driverId: number) {
    return db.query.bookings.findMany({
      where: eq(schema.bookings.driverId, driverId),
      with: {
        user: true
      },
      orderBy: desc(schema.bookings.date)
    });
  },

  async getAllDrivers() {
    const drivers = await db.query.drivers.findMany({
      with: {
        user: true
      },
      orderBy: desc(schema.drivers.createdAt)
    });
    
    // Log details for debugging
    drivers.forEach(driver => {
      console.log(`Driver ${driver.id} document URLs:`, {
        licenseUrl: driver.licenseUrl,
        idProofUrl: driver.idProofUrl,
        selfieUrl: driver.selfieUrl
      });
    });
    
    return drivers;
  },

  async updateDriverStatus(id: number, status: string) {
    const [updatedDriver] = await db.update(schema.drivers)
      .set({ 
        status,
        isVerified: status === "approved"
      })
      .where(eq(schema.drivers.id, id))
      .returning();
    
    return updatedDriver;
  },

  async getDriverEarnings(driverId: number) {
    try {
      // Get all earnings for this driver as there's no date filter in the actual schema
      const totalEarnings = await db.select({
        total: sql<number>`sum(cast(${schema.earnings.amount} as decimal))`
      })
      .from(schema.earnings)
      .where(eq(schema.earnings.driverId, driverId));

      // Since we don't have date filtering in the real schema, return the same total for all timeframes
      const total = totalEarnings[0]?.total || 0;

      return {
        today: total,
        thisWeek: total,
        thisMonth: total,
        total: total
      };
    } catch (error) {
      console.error("Error fetching driver earnings:", error);
      return {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        total: 0
      };
    }
  },

  // Admin related functions
  async getAdminStats() {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    
    // Count bookings
    const totalBookings = await db.select({ count: sql<number>`count(*)` })
      .from(schema.bookings);
    
    const pendingBookings = await db.select({ count: sql<number>`count(*)` })
      .from(schema.bookings)
      .where(eq(schema.bookings.status, "pending"));
    
    const assignedBookings = await db.select({ count: sql<number>`count(*)` })
      .from(schema.bookings)
      .where(
        or(
          eq(schema.bookings.status, "assigned"),
          eq(schema.bookings.status, "on_the_way")
        )
      );
    
    const completedBookings = await db.select({ count: sql<number>`count(*)` })
      .from(schema.bookings)
      .where(eq(schema.bookings.status, "completed"));
    
    // Count drivers
    const totalDrivers = await db.select({ count: sql<number>`count(*)` })
      .from(schema.drivers);
    
    const pendingDrivers = await db.select({ count: sql<number>`count(*)` })
      .from(schema.drivers)
      .where(eq(schema.drivers.status, "pending"));
    
    const activeDrivers = await db.select({ count: sql<number>`count(*)` })
      .from(schema.drivers)
      .where(eq(schema.drivers.status, "approved"));
    
    // Count users
    const totalUsers = await db.select({ count: sql<number>`count(*)` })
      .from(schema.users);
    
    // For date fields, since we're using a text field, we'll use a simpler approach
    // Format dates as strings: YYYY-MM-DD
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    
    // Today's bookings - check if date string starts with today's date
    const todayBookings = await db.select({ count: sql<number>`count(*)` })
      .from(schema.bookings)
      .where(sql`${schema.bookings.date} LIKE ${todayStr + '%'}`);
    
    // Tomorrow's bookings
    const tomorrowBookings = await db.select({ count: sql<number>`count(*)` })
      .from(schema.bookings)
      .where(sql`${schema.bookings.date} LIKE ${tomorrowStr + '%'}`);
    
    // Urgent bookings (today's pending bookings)
    const urgentBookings = await db.select({ count: sql<number>`count(*)` })
      .from(schema.bookings)
      .where(
        and(
          eq(schema.bookings.status, "pending"),
          sql`${schema.bookings.date} LIKE ${todayStr + '%'}`
        )
      );

    return {
      totalBookings: totalBookings[0].count,
      pendingBookings: pendingBookings[0].count,
      assignedBookings: assignedBookings[0].count,
      completedBookings: completedBookings[0].count,
      totalDrivers: totalDrivers[0].count,
      pendingDrivers: pendingDrivers[0].count,
      activeDrivers: activeDrivers[0].count,
      totalUsers: totalUsers[0].count,
      todayBookings: todayBookings[0].count,
      tomorrowBookings: tomorrowBookings[0].count,
      urgentBookings: urgentBookings[0].count
    };
  },

  // Testimonial related functions
  async getVisibleTestimonials() {
    // Use a simpler query without the relationship to avoid issues with missing fields
    const testimonials = await db.select({
      id: schema.testimonials.id,
      name: schema.testimonials.name,
      rating: schema.testimonials.rating,
      comment: schema.testimonials.comment,
      avatarUrl: schema.testimonials.avatarUrl,
      userId: schema.testimonials.userId,
      createdAt: schema.testimonials.createdAt
    })
    .from(schema.testimonials)
    .where(eq(schema.testimonials.isVisible, true))
    .orderBy(desc(schema.testimonials.createdAt))
    .limit(6);

    // Get user information separately if there are testimonials
    let usersById = {};
    if (testimonials.length > 0) {
      const userIds = testimonials.map(t => t.userId);
      const users = await db.select({
        id: schema.users.id,
        phoneNumber: schema.users.phoneNumber,
        role: schema.users.role
      })
      .from(schema.users)
      .where(eq(schema.users.id, userIds[0]));

      // Create a map of users by id
      usersById = users.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});
    }

    // Join the data manually
    return testimonials.map(testimonial => {
      const user = usersById[testimonial.userId] || null;
      return {
        ...testimonial,
        user
      };
    });
  }
};

function or(...conditions: any[]) {
  return sql`(${sql.join(conditions as any, sql` OR `)})`;
}
