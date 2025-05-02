import { Switch, Route, Link } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import { LanguageProvider } from "@/hooks/use-language";

import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import EmergencyContact from "@/components/layout/emergency-contact";

import Home from "@/pages/home";
import BookingHistory from "@/pages/booking-history";
import DriverDashboard from "@/pages/driver/dashboard";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminDrivers from "@/pages/admin/drivers";
import AdminBookings from "@/pages/admin/bookings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/booking-history" component={BookingHistory} />
      <Route path="/driver/dashboard" component={DriverDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/drivers" component={AdminDrivers} />
      <Route path="/admin/bookings" component={AdminBookings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              <Router />
            </main>
            <Footer />
            <EmergencyContact />
            <Toaster />
          </div>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
