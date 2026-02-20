import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ZoneCatalog from "./pages/ZoneCatalog";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import ScrollToTopOnNavigate from "./components/shared/ScrollToTopOnNavigate";
import { CartProvider } from "./context/CartContext";
import { CartNotificationProvider } from "./context/CartNotificationContext";

import DevSwitcher from "./components/DevSwitcher";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <CartNotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <DevSwitcher />
            <ScrollToTopOnNavigate />
            <Routes>
              {/* 
                CRITICAL: Static routes (/auth, /admin) MUST be declared BEFORE 
                the dynamic /:zone route. React Router matches in order, so /:zone 
                would capture "auth" or "admin" as a zone slug if placed first.
              */}
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              {/* Zone-based catalogs — validated inside ZoneCatalog against ZONE_CONFIGS */}
              <Route path="/:zone" element={<ZoneCatalog />} />
              {/* Default redirect to polanco */}
              <Route path="/" element={<Navigate to="/polanco" replace />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartNotificationProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
