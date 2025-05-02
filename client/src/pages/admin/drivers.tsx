import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

interface Driver {
  id: number;
  userId: number;
  fullName: string;
  age?: number; // Optional fields based on actual schema
  experience?: number;
  vehicleType: string;
  vehicleModel?: string;
  vehicleNumber: string;
  licenseUrl?: string;
  idProofUrl?: string; // Changed from idUrl to match database schema
  selfieUrl?: string;
  isVerified: boolean;
  status: string;
  createdAt: string;
  user: {
    phoneNumber: string;
  };
}

export default function AdminDrivers() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const { data: drivers, isLoading } = useQuery<Driver[]>({
    queryKey: ['/api/admin/drivers'],
    enabled: !!user && user.role === 'admin',
  });

  const updateDriverMutation = useMutation({
    mutationFn: async ({ driverId, status }: { driverId: number, status: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/drivers/${driverId}/status`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/drivers'] });
      setIsViewModalOpen(false);
      toast({
        title: t("status_updated"),
        description: t("driver_status_updated_success"),
      });
    },
    onError: (error) => {
      toast({
        title: t("update_failed"),
        description: t("driver_status_update_error"),
        variant: "destructive",
      });
      console.error("Status update error:", error);
    },
  });

  const filteredDrivers = drivers?.filter(driver => {
    // Apply status filter
    if (statusFilter !== "all" && driver.status !== statusFilter) {
      return false;
    }
    
    // Apply vehicle type filter
    if (vehicleFilter !== "all" && driver.vehicleType !== vehicleFilter) {
      return false;
    }
    
    // Apply search filter
    if (searchTerm && !driver.fullName.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !driver.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !driver.user.phoneNumber.includes(searchTerm)) {
      return false;
    }
    
    return true;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleUpdateStatus = (status: string) => {
    if (selectedDriver) {
      updateDriverMutation.mutate({ driverId: selectedDriver.id, status });
    }
  };

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
              <CardTitle className="text-2xl font-bold text-primary">{t("manage_drivers")}</CardTitle>
              <CardDescription>{t("approve_reject_drivers")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Input
                placeholder={t("search_name_phone_vehicle")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select 
              defaultValue="all" 
              onValueChange={setStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("filter_by_status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all_statuses")}</SelectItem>
                <SelectItem value="pending">{t("pending")}</SelectItem>
                <SelectItem value="approved">{t("approved")}</SelectItem>
                <SelectItem value="rejected">{t("rejected")}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              defaultValue="all" 
              onValueChange={setVehicleFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("filter_by_vehicle")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all_vehicles")}</SelectItem>
                <SelectItem value="hatchback">Hatchback</SelectItem>
                <SelectItem value="sedan">Sedan</SelectItem>
                <SelectItem value="suv">SUV</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Drivers Table */}
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : filteredDrivers && filteredDrivers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("driver_name")}</TableHead>
                  <TableHead>{t("contact")}</TableHead>
                  <TableHead>{t("vehicle_details")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell>
                      <div className="font-medium">{driver.fullName}</div>
                      <div className="text-sm text-muted-foreground">
                        {t("age")}: {driver.age} • {t("exp")}: {driver.experience} {t("years")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <a href={`tel:${driver.user.phoneNumber}`} className="text-primary">
                        {driver.user.phoneNumber}
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{driver.vehicleType}</div>
                      <div className="text-sm text-muted-foreground">{driver.vehicleNumber}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(driver.status)}>
                        {driver.status === "pending" ? t("pending") : 
                         driver.status === "approved" ? t("approved") : 
                         driver.status === "rejected" ? t("rejected") : driver.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedDriver(driver);
                          setIsViewModalOpen(true);
                        }}
                      >
                        {t("view_details")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t("no_drivers_found")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Driver Details Modal */}
      {selectedDriver && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("driver_details")}</DialogTitle>
              <DialogDescription>
                {t("view_driver_documents_and_information")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 my-4">
              <div>
                <h3 className="font-medium mb-2">{t("personal_information")}</h3>
                <p><span className="text-muted-foreground">{t("name")}:</span> {selectedDriver.fullName}</p>
                <p><span className="text-muted-foreground">{t("age")}:</span> {selectedDriver.age}</p>
                <p><span className="text-muted-foreground">{t("phone")}:</span> {selectedDriver.user.phoneNumber}</p>
                <p><span className="text-muted-foreground">{t("experience")}:</span> {selectedDriver.experience} {t("years")}</p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">{t("vehicle_information")}</h3>
                <p><span className="text-muted-foreground">{t("type")}:</span> {selectedDriver.vehicleType}</p>
                <p><span className="text-muted-foreground">{t("number")}:</span> {selectedDriver.vehicleNumber}</p>
                <p>
                  <span className="text-muted-foreground">{t("status")}:</span> 
                  <Badge className={`ml-2 ${getStatusBadgeColor(selectedDriver.status)}`}>
                    {selectedDriver.status === "pending" ? t("pending") : 
                     selectedDriver.status === "approved" ? t("approved") : 
                     selectedDriver.status === "rejected" ? t("rejected") : selectedDriver.status}
                  </Badge>
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">{t("documents")}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-2">
                  <p className="text-sm text-center font-medium mb-2">{t("driving_license")}</p>
                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                    <img 
                      src={selectedDriver.licenseUrl} 
                      alt={t("driving_license")} 
                      className="max-h-full rounded-md"
                      onError={(e) => {
                        console.log('License image failed to load:', selectedDriver.licenseUrl);
                        (e.target as HTMLImageElement).src = "https://placehold.co/300x200?text=License+Image";
                      }}
                    />
                  </div>
                </div>
                
                <div className="border rounded-lg p-2">
                  <p className="text-sm text-center font-medium mb-2">{t("id_card")}</p>
                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                    <img 
                      src={selectedDriver.idProofUrl} 
                      alt={t("id_card")} 
                      className="max-h-full rounded-md"
                      onError={(e) => {
                        console.log('ID image failed to load:', selectedDriver.idProofUrl);
                        (e.target as HTMLImageElement).src = "https://placehold.co/300x200?text=ID+Image";
                      }}
                    />
                  </div>
                </div>
                
                <div className="border rounded-lg p-2">
                  <p className="text-sm text-center font-medium mb-2">{t("selfie_with_license")}</p>
                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                    <img 
                      src={selectedDriver.selfieUrl} 
                      alt={t("selfie")} 
                      className="max-h-full rounded-md"
                      onError={(e) => {
                        console.log('Selfie image failed to load:', selectedDriver.selfieUrl);
                        (e.target as HTMLImageElement).src = "https://placehold.co/300x200?text=Selfie+Image";
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              {selectedDriver.status === "pending" && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => handleUpdateStatus("rejected")}
                    disabled={updateDriverMutation.isPending}
                  >
                    {t("reject")}
                  </Button>
                  <Button 
                    onClick={() => handleUpdateStatus("approved")}
                    disabled={updateDriverMutation.isPending}
                  >
                    {t("approve")}
                  </Button>
                </>
              )}
              {selectedDriver.status === "approved" && (
                <Button 
                  variant="destructive" 
                  onClick={() => handleUpdateStatus("rejected")}
                  disabled={updateDriverMutation.isPending}
                >
                  {t("deactivate_driver")}
                </Button>
              )}
              {selectedDriver.status === "rejected" && (
                <Button 
                  onClick={() => handleUpdateStatus("approved")}
                  disabled={updateDriverMutation.isPending}
                >
                  {t("activate_driver")}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
