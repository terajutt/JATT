import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

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
  createdAt: string;
}

export default function BookingHistory() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings', user?.id],
    enabled: !!user,
  });

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return t("pending");
      case "assigned":
        return t("assigned");
      case "on_the_way":
        return t("on_the_way");
      case "completed":
        return t("completed");
      case "cancelled":
        return t("cancelled");
      default:
        return status;
    }
  };

  const filteredBookings = bookings?.filter(booking => 
    statusFilter === "all" || booking.status === statusFilter
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">{t("booking_history")}</CardTitle>
          <CardDescription>{t("view_all_your_past_rides")}</CardDescription>
          
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t("filter_by_status")}:</span>
              <Select 
                defaultValue="all" 
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("select_status")} />
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
            </div>
            <Button className="bg-primary text-white">{t("book_new_ride")}</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("from_to")}</TableHead>
                  <TableHead>{t("ride_type")}</TableHead>
                  <TableHead>{t("driver")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      {format(new Date(booking.date), "MMM d, yyyy")}
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(booking.date), "h:mm a")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{booking.pickupLocation}</div>
                      <div className="text-xs text-muted-foreground">{booking.dropLocation}</div>
                    </TableCell>
                    <TableCell>{booking.rideType}</TableCell>
                    <TableCell>
                      {booking.driver ? (
                        <div>
                          <div>{booking.driver.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {booking.driver.vehicleType} • {booking.driver.vehicleNumber}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{t("not_assigned")}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(booking.status)}>
                        {getStatusLabel(booking.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {booking.status === "pending" && (
                        <Button variant="outline" size="sm">{t("cancel")}</Button>
                      )}
                      {(booking.status === "assigned" || booking.status === "on_the_way") && booking.driver && (
                        <a 
                          href={`tel:${booking.driver.phoneNumber}`}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-green-500 text-white hover:bg-green-600 h-9 px-3"
                        >
                          <span className="material-icon mr-1">call</span> {t("call")}
                        </a>
                      )}
                      {booking.status === "completed" && (
                        <Button variant="outline" size="sm">{t("details")}</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">{t("no_bookings_found")}</p>
              <Button className="bg-primary text-white">{t("book_your_first_ride")}</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
