import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Booking {
  id: number;
  pickupLocation: string;
  dropLocation: string;
  date: string;
  passengers: number;
  rideType: string;
  status: string;
  estimatedFare: number;
  user: {
    id: number;
    phoneNumber: string;
  };
  luggage: boolean;
  kids: boolean;
  elderPassenger: boolean;
  pets: boolean;
  specialRequests?: string;
}

interface EarningsSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
}

export default function DriverDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: driver, isLoading: isDriverLoading } = useQuery({
    queryKey: ['/api/drivers/me'],
    enabled: !!user && user.role === 'driver',
  });

  const { data: bookings, isLoading: isBookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/drivers/bookings'],
    enabled: !!user && user.role === 'driver',
  });

  const { data: earnings, isLoading: isEarningsLoading } = useQuery<EarningsSummary>({
    queryKey: ['/api/drivers/earnings'],
    enabled: !!user && user.role === 'driver',
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number, status: string }) => {
      const response = await apiRequest("PATCH", `/api/bookings/${bookingId}/status`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drivers/bookings'] });
      toast({
        title: t("status_updated"),
        description: t("booking_status_updated_success"),
      });
    },
    onError: (error) => {
      toast({
        title: t("update_failed"),
        description: t("booking_status_update_error"),
        variant: "destructive",
      });
      console.error("Status update error:", error);
    },
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "on_the_way":
        return "bg-amber-100 text-amber-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "assigned":
        return t("assigned");
      case "on_the_way":
        return t("on_the_way");
      case "completed":
        return t("completed");
      default:
        return status;
    }
  };

  const filteredBookings = bookings?.filter(booking => 
    statusFilter === "all" || booking.status === statusFilter
  );

  const handleStatusUpdate = (bookingId: number, status: string) => {
    updateStatusMutation.mutate({ bookingId, status });
  };

  // If the user is not a driver, show an access denied message
  if (user && user.role !== 'driver') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">{t("access_denied")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t("driver_access_only")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary mb-6">{t("driver_dashboard")}</h1>
      
      {/* Driver Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">{t("driver_status")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isDriverLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ) : driver ? (
            <div className="flex flex-col md:flex-row justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="w-16 h-16 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                  <span className="material-icon text-primary text-3xl">person</span>
                </div>
                <div className="ml-4">
                  <h3 className="font-bold text-lg">{driver.fullName}</h3>
                  <p className="text-muted-foreground">{driver.vehicleType} • {driver.vehicleNumber}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Badge className={driver.isVerified ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                  {driver.isVerified ? t("verified") : t("verification_pending")}
                </Badge>
              </div>
            </div>
          ) : (
            <p>{t("driver_info_not_found")}</p>
          )}
        </CardContent>
      </Card>
      
      {/* Tabs for different sections */}
      <Tabs defaultValue="bookings">
        <TabsList className="mb-4">
          <TabsTrigger value="bookings">{t("assigned_rides")}</TabsTrigger>
          <TabsTrigger value="earnings">{t("earnings")}</TabsTrigger>
        </TabsList>
        
        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle>{t("assigned_rides")}</CardTitle>
                <Select 
                  defaultValue="all" 
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t("select_status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("all_statuses")}</SelectItem>
                    <SelectItem value="assigned">{t("assigned")}</SelectItem>
                    <SelectItem value="on_the_way">{t("on_the_way")}</SelectItem>
                    <SelectItem value="completed">{t("completed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isBookingsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : filteredBookings && filteredBookings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("booking_details")}</TableHead>
                      <TableHead>{t("pickup_drop")}</TableHead>
                      <TableHead>{t("passenger_info")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("fare")}</TableHead>
                      <TableHead>{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="font-medium">#{booking.id}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(booking.date), "MMM d, yyyy • h:mm a")}
                          </div>
                          <div className="text-sm">{booking.rideType}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="material-icon text-primary text-sm align-middle mr-1">location_on</span> 
                            {booking.pickupLocation}
                          </div>
                          <div className="text-sm mt-1">
                            <span className="material-icon text-accent text-sm align-middle mr-1">flag</span> 
                            {booking.dropLocation}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <a href={`tel:${booking.user.phoneNumber}`} className="text-primary">
                              {booking.user.phoneNumber}
                            </a>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {booking.passengers} {t("passengers")}
                            {booking.luggage && `, ${t("luggage")}`}
                            {booking.kids && `, ${t("kids")}`}
                            {booking.elderPassenger && `, ${t("elder")}`}
                            {booking.pets && `, ${t("pets")}`}
                          </div>
                          {booking.specialRequests && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {t("notes")}: {booking.specialRequests}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(booking.status)}>
                            {getStatusLabel(booking.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>₹{booking.estimatedFare}</TableCell>
                        <TableCell>
                          {booking.status === "assigned" && (
                            <Button 
                              size="sm"
                              onClick={() => handleStatusUpdate(booking.id, "on_the_way")}
                              disabled={updateStatusMutation.isPending}
                            >
                              {t("start_ride")}
                            </Button>
                          )}
                          {booking.status === "on_the_way" && (
                            <Button 
                              size="sm"
                              onClick={() => handleStatusUpdate(booking.id, "completed")}
                              disabled={updateStatusMutation.isPending}
                            >
                              {t("complete_ride")}
                            </Button>
                          )}
                          <a 
                            href={`https://wa.me/${booking.user.phoneNumber.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block mt-2 text-green-600 text-sm hover:underline"
                          >
                            <span className="material-icon text-sm align-middle mr-1">whatsapp</span>
                            {t("message")}
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mx-auto mb-4">
                    <span className="material-icon text-primary text-3xl">search_off</span>
                  </div>
                  <p className="text-muted-foreground">{t("no_assigned_rides")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Earnings Tab */}
        <TabsContent value="earnings">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t("today")}</CardDescription>
              </CardHeader>
              <CardContent>
                {isEarningsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold">₹{earnings?.today || 0}</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t("this_week")}</CardDescription>
              </CardHeader>
              <CardContent>
                {isEarningsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold">₹{earnings?.thisWeek || 0}</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t("this_month")}</CardDescription>
              </CardHeader>
              <CardContent>
                {isEarningsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold">₹{earnings?.thisMonth || 0}</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t("total_earnings")}</CardDescription>
              </CardHeader>
              <CardContent>
                {isEarningsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold">₹{earnings?.total || 0}</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>{t("completed_rides")}</CardTitle>
            </CardHeader>
            <CardContent>
              {isBookingsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : bookings?.filter(b => b.status === "completed").length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("date")}</TableHead>
                      <TableHead>{t("ride_details")}</TableHead>
                      <TableHead>{t("passenger")}</TableHead>
                      <TableHead>{t("fare")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings
                      .filter(b => b.status === "completed")
                      .map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            {format(new Date(booking.date), "MMM d, yyyy")}
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(booking.date), "h:mm a")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{booking.pickupLocation} to {booking.dropLocation}</div>
                            <div className="text-xs text-muted-foreground">{booking.rideType}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{booking.user.phoneNumber}</div>
                            <div className="text-xs text-muted-foreground">{booking.passengers} {t("passengers")}</div>
                          </TableCell>
                          <TableCell className="font-medium">₹{booking.estimatedFare}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t("no_completed_rides")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
