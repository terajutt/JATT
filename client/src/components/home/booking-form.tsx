import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoginModal from "@/components/auth/login-modal";

const bookingFormSchema = z.object({
  pickupLocation: z.string().min(3, "Pickup location must be at least 3 characters"),
  dropLocation: z.string().min(3, "Drop location must be at least 3 characters"),
  date: z.string().nonempty("Date is required"),
  time: z.string().nonempty("Time is required"),
  passengers: z.string().nonempty("Number of passengers is required"),
  rideType: z.string().nonempty("Ride type is required"),
  luggage: z.boolean().default(false),
  kids: z.boolean().default(false),
  elderPassenger: z.boolean().default(false),
  pets: z.boolean().default(false),
  specialRequests: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

export default function BookingForm() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      pickupLocation: "",
      dropLocation: "",
      date: format(new Date(), "yyyy-MM-dd"),
      time: "",
      passengers: "",
      rideType: "",
      luggage: false,
      kids: false,
      elderPassenger: false,
      pets: false,
      specialRequests: "",
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormValues) => {
      const response = await apiRequest("POST", "/api/bookings", {
        ...data,
        userId: user?.id,
        datetime: `${data.date}T${data.time}`,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Booking Created",
        description: "Your booking has been sent successfully. We'll contact you shortly.",
      });
      
      // Open WhatsApp with booking details
      const whatsappMessage = `New Booking Request from JATT AIRLINES:
Pickup: ${data.pickupLocation}
Drop: ${data.dropLocation}
Date: ${format(new Date(data.date), "dd MMM yyyy")}
Time: ${data.time}
Passengers: ${data.passengers}
Ride Type: ${data.rideType}
${data.luggage ? '✓ Luggage\n' : ''}${data.kids ? '✓ Kids\n' : ''}${data.elderPassenger ? '✓ Elder Passenger\n' : ''}${data.pets ? '✓ Pets\n' : ''}
${data.specialRequests ? `Special Requests: ${data.specialRequests}\n` : ''}
Contact: ${user?.phoneNumber}`;
      
      const encodedMessage = encodeURIComponent(whatsappMessage);
      window.open(`https://wa.me/919855884407?text=${encodedMessage}`, '_blank');
      
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was an error creating your booking. Please try again.",
        variant: "destructive",
      });
      console.error("Booking error:", error);
    },
  });

  const onSubmit = (values: BookingFormValues) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    
    createBookingMutation.mutate(values);
  };

  // No fare calculation as per client requirements - customer will receive pricing via WhatsApp

  return (
    <section id="bookingSection" className="py-10">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h2 className="font-heading font-bold text-2xl mb-6 text-primary">{t("book_your_ride")}</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Locations */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="pickupLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pickup_location")}</FormLabel>
                      <FormControl>
                        <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden">
                          <span className="material-icon text-primary p-3">location_on</span>
                          <Input 
                            placeholder={t("enter_pickup_address")} 
                            className="border-0 focus-visible:ring-0" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dropLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("drop_location")}</FormLabel>
                      <FormControl>
                        <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden">
                          <span className="material-icon text-accent p-3">flag</span>
                          <Input 
                            placeholder={t("enter_destination_address")} 
                            className="border-0 focus-visible:ring-0" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("date")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("time")}</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Passengers & Ride Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="passengers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("number_of_passengers")}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_passengers")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 {t("passenger")}</SelectItem>
                          <SelectItem value="2">2 {t("passengers")}</SelectItem>
                          <SelectItem value="3">3 {t("passengers")}</SelectItem>
                          <SelectItem value="4">4 {t("passengers")}</SelectItem>
                          <SelectItem value="5+">5+ {t("passengers")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="rideType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("type_of_ride")}</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_ride_type")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="local">{t("local")}</SelectItem>
                          <SelectItem value="outstation">{t("outstation")}</SelectItem>
                          <SelectItem value="roundtrip">{t("round_trip")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Add-ons */}
              <div>
                <FormLabel className="block text-sm font-medium text-foreground mb-3">
                  {t("additional_requirements")}
                </FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <FormField
                    control={form.control}
                    name="luggage"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange} 
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">{t("luggage")}</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="kids"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange} 
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">{t("kids")}</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="elderPassenger"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange} 
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">{t("elder_passenger")}</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="pets"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange} 
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">{t("pets")}</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Special Requests */}
              <FormField
                control={form.control}
                name="specialRequests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("special_requests")}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t("special_requests_placeholder")} 
                        className="h-24 resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Submit */}
              <Button 
                type="submit" 
                className="w-full bg-primary text-white py-4 h-auto rounded-lg font-bold text-lg"
                disabled={createBookingMutation.isPending}
              >
                <span className="mr-2">{t("book_via_whatsapp")}</span>
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/512px-WhatsApp.svg.png" 
                  alt="WhatsApp" 
                  className="h-5 w-5"
                />
              </Button>
            </form>
          </Form>
        </div>
      </div>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => {
          setIsLoginModalOpen(false);
          form.handleSubmit(onSubmit)();
        }}
      />
    </section>
  );
}
