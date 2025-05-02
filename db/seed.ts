import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { addDays, subDays, format } from "date-fns";

async function seed() {
  try {
    console.log("Seeding database...");
    
    // Check if admin user exists
    const adminPhone = "9855884407"; // Admin phone number
    let adminUser = await db.query.users.findFirst({
      where: eq(schema.users.phoneNumber, adminPhone)
    });

    if (!adminUser) {
      console.log("Creating admin user...");
      const [newAdmin] = await db.insert(schema.users).values({
        phoneNumber: adminPhone,
        role: "admin"
      }).returning();
      adminUser = newAdmin;
      console.log("Admin user created!");
    }

    // Create test users if they don't exist
    const testPhones = ["9876543210", "9876543211", "9876543212"];
    for (const phone of testPhones) {
      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.phoneNumber, phone)
      });

      if (!existingUser) {
        console.log(`Creating test user: ${phone}`);
        await db.insert(schema.users).values({
          phoneNumber: phone,
          role: "user"
        });
      }
    }

    // Create driver users if they don't exist
    const driverPhones = ["9876543220", "9876543221", "9876543222"];
    const driverNames = ["Gurpreet Singh", "Manpreet Singh", "Harjinder Singh"];
    const vehicleTypes = ["sedan", "suv", "hatchback"];
    const vehicleNumbers = ["PB10AB1234", "PB08CD5678", "PB02EF9012"];
    
    for (let i = 0; i < driverPhones.length; i++) {
      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.phoneNumber, driverPhones[i])
      });

      let userId;
      if (!existingUser) {
        console.log(`Creating driver user: ${driverPhones[i]}`);
        const [newUser] = await db.insert(schema.users).values({
          phoneNumber: driverPhones[i],
          role: "driver"
        }).returning();
        userId = newUser.id;
      } else {
        userId = existingUser.id;
      }

      // Check if driver exists
      const existingDriver = await db.query.drivers.findFirst({
        where: eq(schema.drivers.userId, userId)
      });

      if (!existingDriver) {
        console.log(`Creating driver: ${driverNames[i]}`);
        
        // Generate mock file URLs
        const licenseHash = createHash('md5').update(driverNames[i] + 'license').digest('hex');
        const idHash = createHash('md5').update(driverNames[i] + 'id').digest('hex');
        const selfieHash = createHash('md5').update(driverNames[i] + 'selfie').digest('hex');
        
        await db.insert(schema.drivers).values({
          userId,
          fullName: driverNames[i],
          age: 30 + i,
          experience: 5 + i,
          vehicleType: vehicleTypes[i],
          vehicleNumber: vehicleNumbers[i],
          licenseUrl: `https://storage.jattairlines.com/license/${licenseHash}.jpg`,
          idUrl: `https://storage.jattairlines.com/id/${idHash}.jpg`,
          selfieUrl: `https://storage.jattairlines.com/selfie/${selfieHash}.jpg`,
          isVerified: true,
          status: "approved"
        });
      }
    }

    // Create some bookings
    const bookingStatuses = ["completed", "completed", "assigned", "on_the_way", "pending"];
    const pickupLocations = ["Amritsar", "Ludhiana", "Chandigarh", "Patiala", "Jalandhar"];
    const dropLocations = ["Mohali", "Delhi", "Shimla", "Bathinda", "Pathankot"];
    const rideTypes = ["local", "outstation", "roundtrip", "local", "outstation"];
    
    const userIds = (await db.select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.role, "user"))
      .limit(3))
      .map(u => u.id);

    const driverIds = (await db.select({ id: schema.drivers.id })
      .from(schema.drivers)
      .where(eq(schema.drivers.status, "approved"))
      .limit(3))
      .map(d => d.id);

    // Clear existing bookings for clean seed
    const existingBookingsCount = await db.select({ count: schema.bookings.id }).from(schema.bookings);
    
    if (existingBookingsCount.length === 0 || existingBookingsCount[0].count === 0) {
      console.log("Creating sample bookings...");
      
      const now = new Date();
      
      for (let i = 0; i < 20; i++) {
        const randomUserIndex = Math.floor(Math.random() * userIds.length);
        const randomDriverIndex = Math.floor(Math.random() * driverIds.length);
        const randomStatusIndex = Math.floor(Math.random() * bookingStatuses.length);
        const randomLocationIndex = i % pickupLocations.length;
        
        const status = bookingStatuses[randomStatusIndex];
        const bookingDate = addDays(now, Math.floor(Math.random() * 5) - 2); // -2 to +2 days from now
        
        // Random fare between 500 and 2000
        const fare = Math.floor(500 + Math.random() * 1500);
        
        const bookingData = {
          userId: userIds[randomUserIndex],
          pickupLocation: pickupLocations[randomLocationIndex],
          dropLocation: dropLocations[randomLocationIndex],
          date: bookingDate,
          passengers: Math.floor(1 + Math.random() * 4),
          rideType: rideTypes[randomLocationIndex],
          luggage: Math.random() > 0.5,
          kids: Math.random() > 0.7,
          elderPassenger: Math.random() > 0.7,
          pets: Math.random() > 0.8,
          specialRequests: Math.random() > 0.7 ? "Please arrive on time" : null,
          estimatedFare: fare,
          status
        };
        
        // Only assign driver for assigned/on_the_way/completed bookings
        if (status !== "pending") {
          bookingData.driverId = driverIds[randomDriverIndex];
        }
        
        const [booking] = await db.insert(schema.bookings).values(bookingData).returning();
        
        // Create earnings for completed bookings
        if (status === "completed" && booking.driverId) {
          await db.insert(schema.earnings).values({
            driverId: booking.driverId,
            bookingId: booking.id,
            amount: booking.estimatedFare,
            date: bookingDate
          });
        }
      }
    }

    // Create testimonials
    const existingTestimonialsCount = await db.select({ count: schema.testimonials.id }).from(schema.testimonials);
    
    if (existingTestimonialsCount.length === 0 || existingTestimonialsCount[0].count === 0) {
      console.log("Creating testimonials...");
      
      const testimonialData = [
        {
          name: "Rajinder Singh",
          rating: 5,
          comment: "Excellent service! Driver was punctual and very professional. The car was clean and comfortable. Will definitely use JATT AIRLINES again."
        },
        {
          name: "Simran Kaur",
          rating: 4,
          comment: "Booking through WhatsApp was so convenient! The driver was friendly and got me to my destination on time despite heavy traffic. Great experience."
        },
        {
          name: "Gurpreet Singh",
          rating: 5,
          comment: "Used JATT AIRLINES for an emergency trip from Amritsar to Chandigarh. The response was quick and the journey was comfortable. Highly recommended!"
        }
      ];
      
      for (let i = 0; i < testimonialData.length; i++) {
        await db.insert(schema.testimonials).values({
          userId: userIds[i % userIds.length],
          name: testimonialData[i].name,
          rating: testimonialData[i].rating,
          comment: testimonialData[i].comment,
          isVisible: true
        });
      }
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
