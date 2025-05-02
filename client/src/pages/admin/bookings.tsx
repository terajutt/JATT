import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface Driver {
  id: number;
  fullName: string;
  vehicleType: string;
  vehicleNumber: string;
  isVerified: boolean;
  status: string;
  user: {
    phoneNumber: string;
  };
}

interface Booking {
  id: number;
  pickupLocation: string;
  dropLocation: string;
  date: string;
  passengers: number;
  rideType: string;
  status: string;
  estimatedFare: number;
  luggage: boolean;
  kids: boolean;
  elderPassenger: boolean;
  pets: boolean;
  specialRequests?: string;
  createdAt: string;
  driver?: Driver;
  user: {
    id: number;
    phoneNumber: string;
  };
}

const assignDriverSchema = z.object({
  driverId: z.string({
    required_error: "Driver is required",
  }),
});

export default function AdminBookings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Parse URL query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1]);
    const status = searchParams.get('status');
    const filter = searchParams.get('filter');
    
    if (status) {
      setStatusFilter(status);
    }
    
    if (filter) {
      setDateFilter(filter);
    }
  }, [location]);

  const { data: bookings, isLoading: isBookingsLoading } = useQuery<Booking[]>({
    queryKey: ['/api/admin/bookings'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: drivers, isLoading: isDriversLoading } = useQuery<Driver[]>({
    queryKey: ['/api/admin/drivers'],
    enabled: !!user && user.role === 'admin',
  });

  const assignDriverForm = useForm<z.infer<typeof assignDriverSchema>>({
    resolver: zodResolver(assignDriverSchema),
    defaultValues: {
      driverId: "",
    },
  });

  const assignDriverMutation = useMutation({
    mutationFn: async (data: { bookingId: number, driverId: number }) => {
      const response = await apiRequest("PATCH", `/api/admin/bookings/${data.bookingId}/assign`, {
        driverId: data.driverId,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      setIsAssignModalOpen(false);
      toast({
        title: t("driver_assigned"),
        description: t("driver_assigned_success"),
      });
    },
    onError: (error) => {
      toast({
        title: t("assignment_failed"),
        description: t("driver_assignment_error"),
        variant: "destructive",
      });
      console.error("Driver assignment error:", error);
    },
  });

  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number, status: string }) => {
      const response = await apiRequest("PATCH", `/api/bookings/${bookingId}/status`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      setIsViewModalOpen(false);
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

  const onAssignDriver = (values: z.infer<typeof assignDriverSchema>) => {
    if (selectedBooking) {
      assignDriverMutation.mutate({
        bookingId: selectedBooking.id,
        driverId: parseInt(values.driverId),
      });
    }
  };

  const handleCancelBooking = () => {
    if (selectedBooking) {
      updateBookingStatusMutation.mutate({
        bookingId: selectedBooking.id,
        status: "cancelled",
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "on_the_way":
        return "bg-amber-100 text-amber-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredBookings = bookings?.filter(booking => {
    // Apply status filter
    if (statusFilter !== "all" && booking.status !== statusFilter) {
      return false;
    }
    
    // Apply date filter
    if (dateFilter !== "all") {
      const bookingDate = new Date(booking.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (dateFilter === "today" && 
          !(bookingDate.getDate() === today.getDate() &&
            bookingDate.getMonth() === today.getMonth() &&
            bookingDate.getFullYear() === today.getFullYear())) {
        return false;
      }
      
      if (dateFilter === "tomorrow" && 
          !(bookingDate.getDate() === tomorrow.getDate() &&
            bookingDate.getMonth() === tomorrow.getMonth() &&
            bookingDate.getFullYear() === tomorrow.getFullYear())) {
        return false;
      }
      
      // Urgent bookings: today's bookings that are pending
      if (dateFilter === "urgent" && 
          !(bookingDate.getDate() === today.getDate() &&
            bookingDate.getMonth() === today.getMonth() &&
            bookingDate.getFullYear() === today.getFullYear() &&
            booking.status === "pending")) {
        return false;
      }
    }
    
    // Apply search filter
    if (searchTerm && !booking.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !booking.dropLocation.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !booking.user.phoneNumber.includes(searchTerm)) {
      return false;
    }
    
    return true;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Filter only approved drivers for assignment
  const availableDrivers = drivers?.filter(driver => 
    driver.status === "approved" && driver.isVerified
  );

  // If the user is not an admin, show an access denied message
  if (user && user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">{t("access_denied")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t("admin_access_only")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <CardTitle className="text-2xl font-bold text-primary">{t("manage_bookings")}</CardTitle>
              <CardDescription>{t("assign_drivers_and_manage_bookings")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Input
                placeholder={t("search_location_phone")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select 
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("filter_by_status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all_statuses")}</SelectItem>
                <SelectItem value="pending">{t("pending")}</SelectItem>
                <SelectItem value="assigned">{t("assigned")}</SelectItem>
                <SelectItem value="on_the_way">{t("on_the_way")}</SelectItem>
                <SelectItem value="completed">{t("completed")}</SelectItem>
                <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={dateFilter}
              onValueChange={setDateFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("filter_by_date")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all_dates")}</SelectItem>
                <SelectItem value="today">{t("today")}</SelectItem>
                <SelectItem value="tomorrow">{t("tomorrow")}</SelectItem>
                <SelectItem value="urgent">{t("urgent")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Bookings Table */}
          {isBookingsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : filteredBookings && filteredBookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("booking_details")}</TableHead>
                  <TableHead>{t("customer")}</TableHead>
                  <TableHead>{t("ride_info")}</TableHead>
                  <TableHead>{t("driver")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
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
                    </TableCell>
                    <TableCell>
                      <a href={`tel:${booking.user.phoneNumber}`} className="text-primary">
                        {booking.user.phoneNumber}
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{booking.pickupLocation} → {booking.dropLocation}</div>
                      <div className="text-xs text-muted-foreground">
                        {booking.rideType} • {booking.passengers} {t("passengers")}
                        {booking.luggage && ` • ${t("luggage")}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.driver ? (
                        <div>
                          <div className="font-medium">{booking.driver.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {booking.driver.vehicleType} • {booking.driver.vehicleNumber}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">{t("not_assigned")}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(booking.status)}>
                        {booking.status === "pending" ? t("pending") :
                         booking.status === "assigned" ? t("assigned") :
                         booking.status === "on_the_way" ? t("on_the_way") :
                         booking.status === "completed" ? t("completed") :
                         booking.status === "cancelled" ? t("cancelled") : booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setIsViewModalOpen(true);
                          }}
                        >
                          {t("view")}
                        </Button>
                        
                        {booking.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setIsAssignModalOpen(true);
                            }}
                          >
                            {t("assign")}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t("no_bookings_found")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{t("booking_details")}</DialogTitle>
              <DialogDescription>
                {t("view_booking_details_and_passenger_information")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 my-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">{t("booking_information")}</h3>
                  <p><span className="text-muted-foreground">{t("booking_id")}:</span> #{selectedBooking.id}</p>
                  <p><span className="text-muted-foreground">{t("date_time")}:</span> {format(new Date(selectedBooking.date), "MMM d, yyyy h:mm a")}</p>
                  <p><span className="text-muted-foreground">{t("ride_type")}:</span> {selectedBooking.rideType}</p>
                  <p><span className="text-muted-foreground">{t("passengers")}:</span> {selectedBooking.passengers}</p>
                  <p>
                    <span className="text-muted-foreground">{t("status")}:</span> 
                    <Badge className={`ml-2 ${getStatusBadgeColor(selectedBooking.status)}`}>
                      {selectedBooking.status === "pending" ? t("pending") :
                       selectedBooking.status === "assigned" ? t("assigned") :
                       selectedBooking.status === "on_the_way" ? t("on_the_way") :
                       selectedBooking.status === "completed" ? t("completed") :
                       selectedBooking.status === "cancelled" ? t("cancelled") : selectedBooking.status}
                    </Badge>
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">{t("customer_information")}</h3>
                  <p><span className="text-muted-foreground">{t("phone")}:</span> {selectedBooking.user.phoneNumber}</p>
                  <p>
                    <span className="text-muted-foreground">{t("requirements")}:</span> 
                    <span className="ml-1">
                      {[
                        selectedBooking.luggage ? t("luggage") : null,
                        selectedBooking.kids ? t("kids") : null,
                        selectedBooking.elderPassenger ? t("elder") : null,
                        selectedBooking.pets ? t("pets") : null
                      ].filter(Boolean).join(", ") || t("none")}
                    </span>
                  </p>
                  {selectedBooking.specialRequests && (
                    <p>
                      <span className="text-muted-foreground">{t("special_requests")}:</span> 
                      <span className="ml-1">{selectedBooking.specialRequests}</span>
                    </p>
                  )}
                  <p><span className="text-muted-foreground">{t("fare")}:</span> ₹{selectedBooking.estimatedFare}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">{t("locations")}</h3>
                <div className="bg-neutral-100 p-3 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="material-icon text-primary">location_on</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{selectedBooking.pickupLocation}</p>
                      <p className="text-xs text-muted-foreground">{t("pickup_location")}</p>
                    </div>
                  </div>
                  <div className="h-8 border-l-2 border-dashed border-neutral-400 ml-3"></div>
                  <div className="flex items-center space-x-3">
                    <span className="material-icon text-accent">flag</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{selectedBooking.dropLocation}</p>
                      <p className="text-xs text-muted-foreground">{t("drop_location")}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedBooking.driver && (
                <div>
                  <h3 className="font-medium mb-2">{t("assigned_driver")}</h3>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                      <span className="material-icon text-primary">person</span>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">{selectedBooking.driver.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedBooking.driver.vehicleType} • {selectedBooking.driver.vehicleNumber}
                      </p>
                    </div>
                    <div className="ml-auto">
                      {selectedBooking.driver.user && selectedBooking.driver.user.phoneNumber ? (
                        <a 
                          href={`tel:${selectedBooking.driver.user.phoneNumber}`} 
                          className="text-primary text-sm hover:underline"
                        >
                          {selectedBooking.driver.user.phoneNumber}
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <a 
                  href={`https://wa.me/${selectedBooking.user.phoneNumber.replace(/\D/g, '')}`}
                  className="flex items-center text-green-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/512px-WhatsApp.svg.png" 
                    alt="WhatsApp" 
                    className="h-5 w-5 mr-1"
                  />
                  {t("message_customer")}
                </a>
                
                {selectedBooking.driver && selectedBooking.driver.user && selectedBooking.driver.user.phoneNumber && (
                  <a 
                    href={`https://wa.me/${selectedBooking.driver.user.phoneNumber.replace(/\D/g, '')}`}
                    className="flex items-center text-green-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/512px-WhatsApp.svg.png" 
                      alt="WhatsApp" 
                      className="h-5 w-5 mr-1"
                    />
                    {t("message_driver")}
                  </a>
                )}
              </div>
            </div>
            
            <DialogFooter>
              {selectedBooking.status === "pending" && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleCancelBooking}
                    disabled={updateBookingStatusMutation.isPending}
                  >
                    {t("cancel_booking")}
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsViewModalOpen(false);
                      setIsAssignModalOpen(true);
                    }}
                    disabled={updateBookingStatusMutation.isPending}
                  >
                    {t("assign_driver")}
                  </Button>
                </>
              )}
              {(selectedBooking.status === "assigned" || selectedBooking.status === "on_the_way") && (
                <Button 
                  variant="destructive" 
                  onClick={handleCancelBooking}
                  disabled={updateBookingStatusMutation.isPending}
                >
                  {t("cancel_booking")}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Assign Driver Modal */}
      {selectedBooking && (
        <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t("assign_driver")}</DialogTitle>
              <DialogDescription>
                {format(new Date(selectedBooking.date), "MMM d, yyyy h:mm a")} - {selectedBooking.pickupLocation} to {selectedBooking.dropLocation}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...assignDriverForm}>
              <form onSubmit={assignDriverForm.handleSubmit(onAssignDriver)} className="space-y-4">
                <FormField
                  control={assignDriverForm.control}
                  name="driverId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("select_driver")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_driver")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isDriversLoading ? (
                            <SelectItem value="loading" disabled>{t("loading_drivers")}</SelectItem>
                          ) : availableDrivers && availableDrivers.length > 0 ? (
                            availableDrivers.map((driver) => (
                              <SelectItem key={driver.id} value={driver.id.toString()}>
                                {driver.fullName} - {driver.vehicleType} ({driver.vehicleNumber})
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>{t("no_available_drivers")}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAssignModalOpen(false)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button 
                    type="submit"
                    disabled={assignDriverMutation.isPending || isDriversLoading || !availableDrivers?.length}
                  >
                    {assignDriverMutation.isPending ? t("assigning") : t("assign_driver")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
