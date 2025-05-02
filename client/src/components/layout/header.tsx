import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useTranslation } from "react-i18next";
import LoginModal from "@/components/auth/login-modal";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="font-heading font-bold text-xl text-primary">JATT</span>
            <span className="font-heading font-bold text-xl text-secondary ml-1">AIRLINES</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="mr-2 text-sm font-medium">ENG</span>
            <label className="relative inline-block w-10 h-5 cursor-pointer">
              <input 
                type="checkbox" 
                className="opacity-0 w-0 h-0"
                checked={language === "pa"}
                onChange={() => setLanguage(language === "en" ? "pa" : "en")}
              />
              <span className={`absolute inset-0 ${language === "pa" ? "bg-primary" : "bg-muted"} rounded-full transition-all duration-300 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-4 after:w-4 after:rounded-full after:transition-all ${language === "pa" ? "after:translate-x-5" : ""}`}></span>
            </label>
            <span className="ml-2 text-sm font-medium">ਪੰਜਾਬੀ</span>
          </div>
          
          {user ? (
            <div className="flex items-center space-x-1">
              <span className="text-sm text-foreground">{user.phoneNumber}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <span className="material-icon text-primary">person</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {user.role === "user" && (
                    <DropdownMenuItem onClick={() => navigate("/booking-history")}>
                      {t("booking_history")}
                    </DropdownMenuItem>
                  )}
                  {user.role === "driver" && (
                    <DropdownMenuItem onClick={() => navigate("/driver/dashboard")}>
                      {t("driver_dashboard")}
                    </DropdownMenuItem>
                  )}
                  {user.role === "admin" && (
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      {t("admin_dashboard")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button 
              className="bg-primary text-white"
              onClick={() => setIsLoginModalOpen(true)}
            >
              {t("login")}
            </Button>
          )}
        </div>
      </div>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
      />
    </header>
  );
}
