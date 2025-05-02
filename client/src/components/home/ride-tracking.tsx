import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import LoginModal from "@/components/auth/login-modal";

interface Driver {
  id: number;
  fullName: string;
  vehicleType: string;
  vehicleNumber: string;
  phoneNumber: string;
}

interface Booking {
  id: number;
  pickupLocation: string;
  dropLocation: string;
  date: string;
  rideType: string;
  status: string;
  driver?: Driver;
  estimatedFare: number;
}

export default function RideTracking() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings', user?.id],
    enabled: !!user,
  });

  const activeBooking = bookings?.find(booking => 
    ["assigned", "on_the_way"].includes(booking.status)
  );
  
  const pastBookings = bookings?.filter(booking => 
    booking.status === "completed"
  ).slice(0, 3);

  const handleFindRides = () => {
    if (!user) {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <section id="trackingSection" className="py-10">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h2 className="font-heading font-bold text-2xl mb-6 text-primary">{t("track_your_ride")}</h2>
          
          <div className="space-y-6">
            {/* Search Form */}
            {!user && (
              <div className="flex space-x-2">
                <Input 
                  type="text" 
                  placeholder={t("enter_your_phone_number")} 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  className="bg-primary text-white"
                  onClick={handleFindRides}
                >
                  {t("find_rides")}
                </Button>
              </div>
            )}
            
            {/* Active Ride (if any) */}
            {isLoading ? (
              <div className="border border-neutral-200 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start mb-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-8 w-full" />
                <div className="flex space-x-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ) : activeBooking ? (
              <div className="border border-neutral-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{activeBooking.pickupLocation} to {activeBooking.dropLocation}</h3>
                    <p className="text-sm text-foreground">
                      {format(new Date(activeBooking.date), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                    {activeBooking.status === "assigned" ? t("assigned") : t("on_the_way")}
                  </span>
                </div>
                
                {activeBooking.driver && (
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="material-icon text-gray-600">person</span>
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium">{activeBooking.driver.fullName}</h4>
                      <div className="flex items-center">
                        <span className="text-sm text-foreground">
                          {activeBooking.driver.vehicleType} • {activeBooking.driver.vehicleNumber}
                        </span>
                      </div>
                    </div>
                    <a href={`tel:${activeBooking.driver.phoneNumber}`} className="ml-auto bg-green-500 text-white p-2 rounded-full">
                      <span className="material-icon">call</span>
                    </a>
                  </div>
                )}
                
                <div className="bg-neutral-100 p-3 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="material-icon text-primary">location_on</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activeBooking.pickupLocation}</p>
                      <p className="text-xs text-foreground">{t("pickup_location")}</p>
                    </div>
                  </div>
                  <div className="h-8 border-l-2 border-dashed border-neutral-400 ml-3"></div>
                  <div className="flex items-center space-x-3">
                    <span className="material-icon text-accent">flag</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activeBooking.dropLocation}</p>
                      <p className="text-xs text-foreground">{t("drop_location")}</p>
                    </div>
                  </div>
                </div>
                
                {activeBooking.status === "on_the_way" && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>{t("driver_on_the_way")}</span>
                      <span>ETA: 15 mins</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: "40%" }}></div>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 flex space-x-2">
                  <Button
                    variant="outline"
                    className="flex-1 py-2 border border-primary text-primary rounded-lg text-sm font-medium"
                  >
                    {t("cancel_ride")}
                  </Button>
                  <a 
                    href="https://wa.me/919855884407" 
                    className="flex-1 py-2 bg-secondary text-primary rounded-lg text-sm font-medium hover:bg-opacity-90 transition-all flex items-center justify-center"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="mr-1">{t("contact_admin")}</span>
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/512px-WhatsApp.svg.png" 
                      alt="WhatsApp" 
                      className="h-4 w-4"
                    />
                  </a>
                </div>
              </div>
            ) : user ? (
              <div className="text-center py-6">
                <p className="text-foreground mb-4">{t("no_active_rides")}</p>
                <Button className="bg-primary text-white">{t("book_a_ride")}</Button>
              </div>
            ) : null}
            
            {/* Past Rides */}
            {user && pastBookings && pastBookings.length > 0 && (
              <div>
                <h3 className="font-heading font-medium text-lg mb-3">{t("past_rides")}</h3>
                
                {pastBookings.map(booking => (
                  <div key={booking.id} className="border border-neutral-200 rounded-lg p-4 mb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{booking.pickupLocation} to {booking.dropLocation}</h4>
                        <p className="text-sm text-foreground">
                          {format(new Date(booking.date), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        {t("completed")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        {booking.driver ? `${t("driver")}: ${booking.driver.fullName}` : t("no_driver_assigned")}
                      </span>
                    </div>
                  </div>
                ))}
                
                <div className="text-center mt-4">
                  <Link href="/booking-history" className="text-primary font-medium text-sm hover:underline">
                    {t("view_all_rides")}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
      />
    </section>
  );
}
