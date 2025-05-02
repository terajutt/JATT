import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  assignedBookings: number;
  completedBookings: number;
  totalDrivers: number;
  pendingDrivers: number;
  activeDrivers: number;
  totalUsers: number;
  todayBookings: number;
  tomorrowBookings: number;
  urgentBookings: number;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("week");

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/stats'],
    enabled: !!user && user.role === 'admin',
  });

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">{t("admin_dashboard")}</h1>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Link href="/admin/bookings">
            <Button size="sm" variant="outline">
              {t("manage_bookings")}
            </Button>
          </Link>
          <Link href="/admin/drivers">
            <Button size="sm" variant="outline">
              {t("manage_drivers")}
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">{t("total_bookings")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{stats?.totalBookings || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">{t("active_drivers")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{stats?.activeDrivers || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">{t("total_users")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">{t("pending_approvals")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{stats?.pendingDrivers || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Booking Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">{t("pending_bookings")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{stats?.pendingBookings || 0}</span>
                <Link href="/admin/bookings?status=pending">
                  <Button size="sm" variant="outline">{t("view")}</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">{t("assigned_bookings")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{stats?.assignedBookings || 0}</span>
                <Link href="/admin/bookings?status=assigned">
                  <Button size="sm" variant="outline">{t("view")}</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">{t("completed_bookings")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{stats?.completedBookings || 0}</span>
                <Link href="/admin/bookings?status=completed">
                  <Button size="sm" variant="outline">{t("view")}</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("quick_actions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/admin/bookings" className="p-4 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors">
              <div className="flex items-center">
                <span className="material-icon text-primary mr-3 text-2xl">directions_car</span>
                <div>
                  <div className="font-medium text-lg">{t("manage_bookings")}</div>
                  <p className="text-sm text-muted-foreground">{t("assign_drivers_to_bookings")}</p>
                </div>
              </div>
            </Link>
            
            <Link href="/admin/drivers" className="p-4 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors">
              <div className="flex items-center">
                <span className="material-icon text-primary mr-3 text-2xl">person</span>
                <div>
                  <div className="font-medium text-lg">{t("manage_drivers")}</div>
                  <p className="text-sm text-muted-foreground">{t("approve_reject_drivers")}</p>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      {/* WhatsApp Contact */}
      <Card>
        <CardHeader>
          <CardTitle>{t("contact_whatsapp")}</CardTitle>
          <CardDescription>{t("contact_whatsapp_description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 bg-neutral-50 rounded-lg">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/512px-WhatsApp.svg.png" 
              alt="WhatsApp" 
              className="h-16 w-16 mb-4"
            />
            <p className="text-xl font-bold mb-2">+91 9855884407</p>
            <p className="text-center text-gray-600 mb-4">{t("whatsapp_admin_info")}</p>
            <a 
              href="https://wa.me/919855884407" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-all inline-flex items-center"
            >
              <span className="mr-2">{t("open_whatsapp")}</span>
              <span className="material-icon">open_in_new</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
