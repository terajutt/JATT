import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const driverSignupSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  phoneNumber: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
  vehicleType: z.string().min(1, "Please enter your vehicle type"),
  vehicleModel: z.string().min(1, "Please enter your vehicle model"),
  vehicleNumber: z.string().min(5, "Please enter a valid vehicle number"),
  licenseImage: z.instanceof(File).optional(),
  idImage: z.instanceof(File).optional(),
  selfieImage: z.instanceof(File).optional(),
  agreeTerms: z.boolean().refine((val) => val === true, "You must agree to the terms"),
});

type DriverSignupFormValues = z.infer<typeof driverSignupSchema>;

interface DriverSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowLogin: () => void;
}

export default function DriverSignupModal({ isOpen, onClose, onShowLogin }: DriverSignupModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  const form = useForm<DriverSignupFormValues>({
    resolver: zodResolver(driverSignupSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      vehicleType: "",
      vehicleModel: "",
      vehicleNumber: "",
      agreeTerms: false,
    },
  });

  const driverSignupMutation = useMutation({
    mutationFn: async (data: DriverSignupFormValues) => {
      // Create form data for file upload
      const formData = new FormData();
      formData.append("fullName", data.fullName);
      formData.append("phoneNumber", data.phoneNumber);
      formData.append("vehicleType", data.vehicleType);
      formData.append("vehicleModel", data.vehicleModel);
      formData.append("vehicleNumber", data.vehicleNumber);
      
      if (licenseFile) formData.append("licenseImage", licenseFile);
      if (idFile) formData.append("idImage", idFile);
      if (selfieFile) formData.append("selfieImage", selfieFile);

      // Use fetch directly for FormData
      const response = await fetch("/api/drivers/signup", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit driver application");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your driver application has been submitted successfully. We'll review it shortly.",
      });
      onClose();
      form.reset();
      setLicenseFile(null);
      setIdFile(null);
      setSelfieFile(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit application. Please try again.",
        variant: "destructive",
      });
      console.error("Driver signup error:", error);
    },
  });

  const onSubmit = (values: DriverSignupFormValues) => {
    if (!licenseFile || !idFile || !selfieFile) {
      toast({
        title: "Missing Documents",
        description: "Please upload all required documents.",
        variant: "destructive",
      });
      return;
    }

    driverSignupMutation.mutate(values);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (file: File | null) => void) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading font-bold text-2xl text-primary">
            {t("driver_signup")}
          </DialogTitle>
          <DialogDescription>
            {t("driver_signup_description")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("full_name")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("phone_number")}</FormLabel>
                    <div className="flex">
                      <div className="flex items-center bg-neutral-100 px-3 rounded-l-lg border border-r-0 border-neutral-200">
                        <span className="text-foreground">+91</span>
                      </div>
                      <FormControl>
                        <Input 
                          type="tel" 
                          pattern="[0-9]{10}" 
                          className="rounded-l-none" 
                          placeholder={t("10_digit_mobile")} 
                          {...field} 
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("vehicle_type")}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Hatchback, Sedan, SUV" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="vehicleModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("vehicle_model")}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Swift, Alto, Scorpio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <FormField
                control={form.control}
                name="vehicleNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("vehicle_number")}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. PB10AB1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <FormLabel className="block text-sm font-medium text-foreground mb-3">
                {t("document_uploads")}
              </FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-dashed border-neutral-300 rounded-lg p-4 text-center">
                  <span className="material-icon text-neutral-400 text-3xl">drive_file_rename_outline</span>
                  <p className="text-sm font-medium mt-2">{t("driving_license")}</p>
                  <input 
                    type="file" 
                    id="licenseUpload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setLicenseFile)}
                  />
                  <label htmlFor="licenseUpload" className="block mt-2 text-xs text-primary cursor-pointer">
                    {licenseFile ? licenseFile.name : t("upload_image")}
                  </label>
                </div>
                
                <div className="border border-dashed border-neutral-300 rounded-lg p-4 text-center">
                  <span className="material-icon text-neutral-400 text-3xl">badge</span>
                  <p className="text-sm font-medium mt-2">{t("id_card")}</p>
                  <input 
                    type="file" 
                    id="idUpload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setIdFile)}
                  />
                  <label htmlFor="idUpload" className="block mt-2 text-xs text-primary cursor-pointer">
                    {idFile ? idFile.name : t("upload_image")}
                  </label>
                </div>
              </div>
            </div>
            
            <div className="border border-dashed border-neutral-300 rounded-lg p-4 text-center">
              <span className="material-icon text-neutral-400 text-3xl">face</span>
              <p className="text-sm font-medium mt-2">{t("selfie_with_license")}</p>
              <input 
                type="file" 
                id="selfieUpload" 
                className="hidden" 
                accept="image/*"
                onChange={(e) => handleFileChange(e, setSelfieFile)}
              />
              <label htmlFor="selfieUpload" className="block mt-2 text-xs text-primary cursor-pointer">
                {selfieFile ? selfieFile.name : t("upload_image")}
              </label>
            </div>
            
            <FormField
              control={form.control}
              name="agreeTerms"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-2">
                  <FormControl>
                    <Checkbox 
                      checked={field.value} 
                      onCheckedChange={field.onChange} 
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm text-foreground">
                      {t("agree_terms")} <a href="#" className="text-primary">{t("terms_of_service")}</a> {t("and")} <a href="#" className="text-primary">{t("privacy_policy")}</a>. {t("confirm_information_accurate")}
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-primary text-white" 
              disabled={driverSignupMutation.isPending}
            >
              {driverSignupMutation.isPending ? t("submitting") : t("submit_application")}
            </Button>
          </form>
        </Form>

        <div className="mt-4 text-center">
          <p className="text-sm text-foreground">
            {t("already_registered")} 
            <Button 
              type="button" 
              variant="link" 
              className="p-0 h-auto" 
              onClick={onShowLogin}
            >
              {t("login_here")}
            </Button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
