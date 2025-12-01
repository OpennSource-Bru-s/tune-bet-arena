import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import Store from "./pages/Store";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import Streaming from "./pages/Streaming";
import Social from "./pages/Social";
import Statistics from "./pages/Statistics";
import Tournaments from "./pages/Tournaments";
import Referrals from "./pages/Referrals";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SettingsProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/lobby" element={<Lobby />} />
            <Route path="/game/:gameId" element={<Game />} />
            <Route path="/store" element={<Store />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/streaming" element={<Streaming />} />
            <Route path="/social" element={<Social />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/referrals" element={<Referrals />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
