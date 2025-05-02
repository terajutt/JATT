import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
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
import DriverSignupModal from "./driver-signup-modal";

const phoneSchema = z.object({
  phoneNumber: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isDriverSignupOpen, setIsDriverSignupOpen] = useState(false);

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phoneNumber: "",
    },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });
  
  // For debugging
  console.log("OTP form state:", otpForm.formState);

  useEffect(() => {
    if (!isOpen) {
      // Reset forms when modal closes
      phoneForm.reset();
      otpForm.reset();
      setStep("phone");
    }
  }, [isOpen, phoneForm, otpForm]);

  const sendOtpMutation = useMutation({
    mutationFn: async (data: PhoneFormValues) => {
      const response = await apiRequest("POST", "/api/auth/send-otp", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setPhoneNumber(phoneForm.getValues().phoneNumber);
      setStep("otp");
      toast({
        title: "OTP Sent",
        description: "A verification code has been sent to your phone",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
      console.error("OTP error:", error);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (data: OtpFormValues) => {
      console.log("Verifying OTP:", data.otp, "for phone:", phoneNumber);
      const response = await apiRequest("POST", "/api/auth/verify-otp", {
        phoneNumber,
        otp: data.otp,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      login(data.user);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      onClose();
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Invalid OTP. Please try again.",
        variant: "destructive",
      });
      console.error("Verification error:", error);
    },
  });

  const onSendOtp = (values: PhoneFormValues) => {
    sendOtpMutation.mutate(values);
  };

  const onVerifyOtp = (values: OtpFormValues) => {
    verifyOtpMutation.mutate(values);
  };

  // No longer need separate input handlers since we're using a single OTP input field

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-2xl text-primary">
              {t("login")}
            </DialogTitle>
            <DialogDescription>
              {step === "phone" 
                ? t("login_description") 
                : t("otp_verification_description")}
            </DialogDescription>
          </DialogHeader>

          {step === "phone" ? (
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onSendOtp)} className="space-y-6">
                <FormField
                  control={phoneForm.control}
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
                            placeholder={t("enter_10_digit_mobile")} 
                            {...field} 
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary text-white" 
                  disabled={sendOtpMutation.isPending}
                >
                  {sendOtpMutation.isPending ? t("sending") : t("send_otp")}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium leading-none">
                  {t("otp_verification")}
                </label>
                
                <div className="flex flex-col items-center gap-4 mt-2">
                  <div className="flex w-full items-center justify-center space-x-2">
                    <input
                      type="tel"
                      className="flex h-14 w-full rounded-md border border-input bg-background px-3 py-2 text-center text-2xl"
                      placeholder="Enter OTP"
                      value={otpForm.watch("otp") || ''}
                      onChange={(e) => {
                        // Only allow digits
                        let value = e.target.value.replace(/\D/g, '');
                        // Limit to 6 digits
                        if (value.length > 6) value = value.slice(0, 6);
                        otpForm.setValue("otp", value);
                        console.log("OTP entered:", value);
                      }}
                      min="0"
                      max="999999"
                      step="1"
                      inputMode="numeric"
                    />
                  </div>
                  
                  <p className="text-sm text-center">
                    {t("otp_sent_message")} <button type="button" className="text-primary font-medium" onClick={() => setStep("phone")}>{t("resend")}</button>
                  </p>
                </div>
              </div>
              
              <Button 
                type="button" 
                className="w-full bg-primary text-white text-lg py-6" 
                disabled={verifyOtpMutation.isPending || !otpForm.watch("otp") || otpForm.watch("otp").length < 6}
                onClick={() => {
                  const otp = otpForm.watch("otp");
                  console.log("Verifying OTP manually:", otp);
                  if (otp && otp.length === 6) {
                    verifyOtpMutation.mutate({otp});
                  } else {
                    toast({
                      title: "Error",
                      description: "Please enter a valid 6-digit OTP",
                      variant: "destructive"
                    });
                  }
                }}
              >
                {verifyOtpMutation.isPending ? t("verifying") : t("verify_login")}
              </Button>
            </div>
          )}

          <div className="mt-4 text-center">
            <p className="text-sm text-foreground">
              {t("new_to_jatt_airlines")} 
              <Button 
                type="button" 
                variant="link" 
                className="p-0 h-auto" 
                onClick={() => {
                  onClose();
                  setIsDriverSignupOpen(true);
                }}
              >
                {t("driver_signup")}
              </Button>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <DriverSignupModal 
        isOpen={isDriverSignupOpen}
        onClose={() => setIsDriverSignupOpen(false)}
        onShowLogin={() => {
          setIsDriverSignupOpen(false);
          onClose(); // Make sure original modal stays closed
          // Reopen login modal after a short delay
          setTimeout(() => onClose(), 100);
        }}
      />
    </>
  );
}
