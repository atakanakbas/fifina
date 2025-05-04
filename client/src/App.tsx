import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ExchangeManagement from "@/pages/ExchangeManagement";

function NavigationBar() {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="text-xl font-bold">Crypto RSI Tracker</div>
        <div className="flex space-x-6">
          <Link href="/" className="hover:text-blue-300">Dashboard</Link>
          <Link href="/exchange-management" className="hover:text-blue-300">Exchange Management</Link>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <>
      <NavigationBar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/exchange-management" component={ExchangeManagement} />
        <Route component={NotFound} />
      </Switch>
    </>
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
