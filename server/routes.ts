import express, { type Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@db";
import { z } from "zod";
import * as schema from "@shared/schema";
import bcrypt from "bcrypt";
import axios from "axios";

// Setup multer for file upload
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use absolute path directly
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const PgSession = connectPgSimple(session);

  // Session configuration
  app.use(
    session({
      store: new PgSession({
        pool: pool,
        tableName: "session",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "jatt-airlines-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
      },
    })
  );

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Passport
  passport.use(
    new LocalStrategy(
      {
        usernameField: "phoneNumber",
        passwordField: "otp",
      },
      async (phoneNumber, otp, done) => {
        try {
          const result = await storage.verifyOtp(phoneNumber, otp);
          if (result.success) {
            return done(null, result.user);
          } else {
            return done(null, false, { message: "Invalid OTP" });
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Serialize and deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Define API routes with /api prefix
  const apiPrefix = "/api";

  // Serve static files from uploads directory
  app.use('/uploads', express.static('./uploads'));

  // Authentication routes
  app.post(`${apiPrefix}/auth/send-otp`, async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      // Validate phone number
      if (!phoneNumber.match(/^\d{10}$/)) {
        return res.status(400).json({ message: "Invalid phone number. Must be 10 digits." });
      }

      // Send OTP
      const result = await storage.sendOtp(phoneNumber);
      
      if (result.success) {
        res.status(200).json({ message: "OTP sent successfully" });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post(`${apiPrefix}/auth/verify-otp`, async (req, res) => {
    try {
      const { phoneNumber, otp } = req.body;
      
      // Validate inputs
      if (!phoneNumber || !otp) {
        return res.status(400).json({ message: "Phone number and OTP are required" });
      }

      // Verify OTP
      const result = await storage.verifyOtp(phoneNumber, otp);
      
      if (result.success) {
        // Login the user
        req.login(result.user, (err) => {
          if (err) {
            return res.status(500).json({ message: "Login failed" });
          }
          return res.status(200).json({ message: "OTP verified successfully", user: result.user });
        });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  app.get(`${apiPrefix}/auth/me`, (req, res) => {
    if (req.isAuthenticated()) {
      res.status(200).json({ user: req.user });
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  app.post(`${apiPrefix}/auth/logout`, (req, res) => {
    req.logout(() => {
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Helper middleware to check authentication
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Helper middleware to check if user is admin
  const isAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user.role === "admin") {
      return next();
    }
    res.status(403).json({ message: "Forbidden. Admin access required." });
  };

  // Helper middleware to check if user is driver
  const isDriver = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user.role === "driver") {
      return next();
    }
    res.status(403).json({ message: "Forbidden. Driver access required." });
  };

  // Booking routes
  app.post(`${apiPrefix}/bookings`, isAuthenticated, async (req, res) => {
    try {
      const bookingData = {
        userId: req.user.id,
        pickupLocation: req.body.pickupLocation,
        dropLocation: req.body.dropLocation,
        date: new Date(`${req.body.date}T${req.body.time}`),
        passengers: parseInt(req.body.passengers),
        rideType: req.body.rideType,
        luggage: req.body.luggage,
        kids: req.body.kids,
        elderPassenger: req.body.elderPassenger,
        pets: req.body.pets,
        specialRequests: req.body.specialRequests,
        // We still calculate fare for admin records, but don't display it to users
        estimatedFare: calculateFare(req.body.rideType, req.body.pickupLocation, req.body.dropLocation),
      };

      // Create the booking
      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.get(`${apiPrefix}/bookings`, isAuthenticated, async (req, res) => {
    try {
      const bookings = await storage.getUserBookings(req.user.id);
      res.status(200).json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.patch(`${apiPrefix}/bookings/:id/status`, isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Validate status
      if (!["pending", "assigned", "on_the_way", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Get the booking
      const booking = await storage.getBookingById(parseInt(id));
      
      // Check if booking exists
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if user has permission to update the booking
      if (req.user.role === "user" && booking.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden. You can only update your own bookings." });
      }

      if (req.user.role === "driver") {
        // Get driver info
        const driver = await storage.getDriverByUserId(req.user.id);
        
        // Check if driver is assigned to this booking
        if (!driver || booking.driverId !== driver.id) {
          return res.status(403).json({ message: "Forbidden. You can only update bookings assigned to you." });
        }

        // Drivers can only update to on_the_way or completed
        if (!["on_the_way", "completed"].includes(status)) {
          return res.status(403).json({ message: "Forbidden. You can only mark rides as 'on the way' or 'completed'." });
        }
      }

      // Update booking status
      const updatedBooking = await storage.updateBookingStatus(parseInt(id), status);
      res.status(200).json(updatedBooking);
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Driver routes
  app.post(`${apiPrefix}/drivers/signup`, upload.fields([
    { name: 'licenseImage', maxCount: 1 },
    { name: 'idImage', maxCount: 1 },
    { name: 'selfieImage', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const { fullName, phoneNumber, vehicleType, vehicleModel, vehicleNumber } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Validate required fields
      if (!fullName || !phoneNumber || !vehicleType || !vehicleNumber) {
        return res.status(400).json({ message: "Full name, phone number, vehicle type, and vehicle number are required" });
      }

      // Validate files
      if (!files.licenseImage || !files.idImage || !files.selfieImage) {
        return res.status(400).json({ message: "All documents must be uploaded" });
      }

      // Process and store the driver application
      const result = await storage.createDriverApplication({
        fullName,
        phoneNumber,
        vehicleType,
        vehicleModel,
        vehicleNumber,
        licenseImage: files.licenseImage[0],
        idImage: files.idImage[0],
        selfieImage: files.selfieImage[0],
      });

      if (result.success) {
        res.status(201).json({ message: "Driver application submitted successfully" });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Error creating driver application:", error);
      res.status(500).json({ message: "Failed to submit driver application" });
    }
  });

  app.get(`${apiPrefix}/drivers/me`, isDriver, async (req, res) => {
    try {
      const driver = await storage.getDriverByUserId(req.user.id);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      res.status(200).json(driver);
    } catch (error) {
      console.error("Error fetching driver:", error);
      res.status(500).json({ message: "Failed to fetch driver information" });
    }
  });

  app.get(`${apiPrefix}/drivers/bookings`, isDriver, async (req, res) => {
    try {
      const driver = await storage.getDriverByUserId(req.user.id);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      
      const bookings = await storage.getDriverBookings(driver.id);
      res.status(200).json(bookings);
    } catch (error) {
      console.error("Error fetching driver bookings:", error);
      res.status(500).json({ message: "Failed to fetch driver bookings" });
    }
  });

  app.get(`${apiPrefix}/drivers/earnings`, isDriver, async (req, res) => {
    try {
      const driver = await storage.getDriverByUserId(req.user.id);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      
      const earnings = await storage.getDriverEarnings(driver.id);
      res.status(200).json(earnings);
    } catch (error) {
      console.error("Error fetching driver earnings:", error);
      res.status(500).json({ message: "Failed to fetch driver earnings" });
    }
  });

  // Admin routes
  app.get(`${apiPrefix}/admin/stats`, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.status(200).json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin statistics" });
    }
  });

  app.get(`${apiPrefix}/admin/bookings`, isAdmin, async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.status(200).json(bookings);
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get(`${apiPrefix}/admin/drivers`, isAdmin, async (req, res) => {
    try {
      const drivers = await storage.getAllDrivers();
      res.status(200).json(drivers);
    } catch (error) {
      console.error("Error fetching all drivers:", error);
      res.status(500).json({ message: "Failed to fetch drivers" });
    }
  });

  app.patch(`${apiPrefix}/admin/drivers/:id/status`, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Validate status
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedDriver = await storage.updateDriverStatus(parseInt(id), status);
      res.status(200).json(updatedDriver);
    } catch (error) {
      console.error("Error updating driver status:", error);
      res.status(500).json({ message: "Failed to update driver status" });
    }
  });

  app.patch(`${apiPrefix}/admin/bookings/:id/assign`, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { driverId } = req.body;
      
      if (!driverId) {
        return res.status(400).json({ message: "Driver ID is required" });
      }

      const updatedBooking = await storage.assignDriverToBooking(parseInt(id), parseInt(driverId));
      res.status(200).json(updatedBooking);
    } catch (error) {
      console.error("Error assigning driver to booking:", error);
      res.status(500).json({ message: "Failed to assign driver to booking" });
    }
  });

  // Testimonial routes
  app.get(`${apiPrefix}/testimonials`, async (req, res) => {
    try {
      let testimonials = await storage.getVisibleTestimonials();
      
      // If the testimonials array is empty, create a default placeholder
      if (!testimonials || testimonials.length === 0) {
        res.status(200).json([]);
      } else {
        res.status(200).json(testimonials);
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      // Return empty array instead of error for better UX
      res.status(200).json([]);
    }
  });

  return httpServer;
}

// Helper function to calculate estimated fare
function calculateFare(rideType: string, pickup: string, dropoff: string): number {
  // In a real-world scenario, this would call a distance calculator API
  // For this demo, we'll use a simplified calculation
  const baseRates = {
    local: 500,
    outstation: 1000,
    roundtrip: 1500
  };
  
  // Add some randomness to simulate real calculation
  const baseRate = baseRates[rideType as keyof typeof baseRates] || 500;
  const randomFactor = 0.85 + (Math.random() * 0.3); // 0.85 to 1.15
  
  return Math.round(baseRate * randomFactor);
}
