import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";

import { NutrisenseDigital } from "@/pages/NutrisenseDigital";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#fafaf3] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#9df197] animate-pulse" />
        <p className="[font-family:'Manrope',Helvetica] text-[#5d6058] text-sm">Loading NutriSense...</p>
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />

      <Route path="/">
        {isAuthenticated ? <NutrisenseDigital activePage="pantry" /> : <LandingPage />}
      </Route>
      <Route path="/dashboard">
        {isAuthenticated ? <NutrisenseDigital activePage="dashboard" /> : <LandingPage />}
      </Route>
      <Route path="/log-meal">
        {isAuthenticated ? <NutrisenseDigital activePage="log-meal" /> : <LandingPage />}
      </Route>
      <Route path="/insights">
        {isAuthenticated ? <NutrisenseDigital activePage="insights" /> : <LandingPage />}
      </Route>
      <Route path="/profile">
        {isAuthenticated ? <NutrisenseDigital activePage="profile" /> : <LandingPage />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
