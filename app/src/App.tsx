/**
 * ELI5: The app's switchboard: wraps everything in helpers and picks the right screen for the address.
 * What: Providers (ErrorBoundary, Theme, Tooltip, Toaster, Hub) plus the route table: landing page at the front
 *       door, the hub under /app, the client portal under /client/:token.
 * Owns: top-level routing and provider order.
 * Depends on: pages/Landing, pages/Hub, pages/NotFound, ClientPortal, contexts, lib/router-hook.
 */
import { Suspense, lazy } from "react";
import { Route, Router, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HubProvider } from "@/contexts/HubContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Hub from "@/pages/Hub";
import Landing from "@/pages/Landing";
import NotFound from "@/pages/NotFound";
import { routerHooks } from "@/lib/router-hook";

const ClientPortal = lazy(() => import("@/components/hub/ClientPortal").then((module) => ({ default: module.ClientPortal })));

const HUB_ROUTES: string[] = [
  "/",
  "/transactions",
  "/tasks",
  "/calendar",
  "/messages",
  "/documents",
  "/vendors",
  "/integrations",
  "/settings",
  "/client-preview",
  "/home-hub",
];

/** Inside <Route path="/app" nest>, the location is relative to /app. */
function HubRoutes() {
  const [location] = useLocation();
  return HUB_ROUTES.includes(location) ? <Hub /> : <NotFound />;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/app" nest>
        <HubRoutes />
      </Route>
      <Route path="/client/:token">
        {(params) => (
          <Suspense fallback={null}>
            <ClientPortal token={params.token} />
          </Suspense>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="bottom-right" />
          <HubProvider>
            <Router hook={routerHooks.hook} searchHook={routerHooks.searchHook}>
              <AppRoutes />
            </Router>
          </HubProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
