/**
 * ELI5: The main screen of the app: menu on the left, top bar, and whichever page you picked.
 * What: Hub shell; owns search/dialog/mobile-nav state, picks the view for the current route and mounts dialogs.
 * Owns: layout composition and route-to-view switching for the hub routes.
 * Depends on: HubSidebar, HubTopBar, HubTransactionsView, HubInfoDialogs, page components, HubContext, wouter.
 */
import { Suspense, lazy, useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { useHub } from "@/contexts/HubContext";
import { PageSkeleton } from "@/components/hub/PageSkeleton";
import { todayInDenver } from "@/lib/dates";
import { Dashboard } from "@/components/hub/Dashboard";
import { HelpDialog, NotificationsDialog } from "@/components/hub/HubInfoDialogs";
import { HubSidebar, SUPPORT_NAV_ITEMS, WORKSPACE_NAV_ITEMS } from "@/components/hub/HubSidebar";
import { HubTopBar } from "@/components/hub/HubTopBar";
import { MobileNavigation } from "@/components/hub/MobileNavigation";
import { CalendarPage } from "@/components/hub/CalendarPage";
import { DocumentsPage } from "@/components/hub/DocumentsPage";
import { MessagesPage } from "@/components/hub/MessagesPage";
import { TasksPage } from "@/components/hub/TasksPage";
import { HubTransactionsView } from "@/components/hub/HubTransactionsView";

/** The five everyday screens ship with the shell so tapping them is instant; rarer screens and dialogs load on demand and are warmed in idle time. */
const loadClientJourney = () => import("@/components/hub/ClientJourney").then((module) => ({ default: module.ClientJourney }));
const ClientJourney = lazy(loadClientJourney);
const loadIntegrationsPage = () => import("@/components/hub/IntegrationsPage").then((module) => ({ default: module.IntegrationsPage }));
const IntegrationsPage = lazy(loadIntegrationsPage);
const loadSettingsPage = () => import("@/components/hub/SettingsPage").then((module) => ({ default: module.SettingsPage }));
const SettingsPage = lazy(loadSettingsPage);
const loadTransactionDetail = () => import("@/components/hub/TransactionDetail").then((module) => ({ default: module.TransactionDetail }));
const TransactionDetail = lazy(loadTransactionDetail);
const loadTransactionFormDialog = () => import("@/components/hub/TransactionForm").then((module) => ({ default: module.TransactionFormDialog }));
const TransactionFormDialog = lazy(loadTransactionFormDialog);
const loadVendorsPage = () => import("@/components/hub/VendorsPage").then((module) => ({ default: module.VendorsPage }));
const VendorsPage = lazy(loadVendorsPage);
const PAGE_LOADERS = [loadClientJourney, loadIntegrationsPage, loadSettingsPage, loadTransactionDetail, loadTransactionFormDialog, loadVendorsPage];

const CLIENT_MODE_PATHS: string[] = ["/client-preview", "/home-hub"];
const DEFAULT_PAGE_LABEL = "Overview";
const CLIENT_PAGE_LABEL = "Client experience";

export default function Hub() {
  const { state, demo, setDemo, loading, saving, userName } = useHub();
  const [location, navigate] = useLocation();
  const routeSearch = useSearch();
  const path = location.split("?")[0];

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [openTransactionId, setOpenTransactionId] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const syncOnline = () => setOnline(navigator.onLine);
    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);
    return () => {
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOnline);
    };
  }, []);


  useEffect(() => {
    const warm = () => PAGE_LOADERS.forEach((load) => void load());
    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(warm);
      return () => window.cancelIdleCallback(handle);
    }
    const timer = window.setTimeout(warm, 400);
    return () => window.clearTimeout(timer);
  }, []);

  const clientMode = CLIENT_MODE_PATHS.includes(path);
  const knownNavItem = WORKSPACE_NAV_ITEMS.concat(SUPPORT_NAV_ITEMS).find(
    (item) => item.path === path,
  );
  const pageLabel = knownNavItem?.label || (clientMode ? CLIENT_PAGE_LABEL : DEFAULT_PAGE_LABEL);
  const openTransaction = state.transactions.find(
    (transaction) => transaction.id === openTransactionId,
  );
  const dueTasks = state.tasks.filter((task) => !task.complete && task.due <= todayInDenver());
  const openTransactionById = (transactionId: string) => setOpenTransactionId(transactionId);

  let content;
  if (loading) {
    content = (
      <div className="loading-screen">
        <span className="loading-spinner" />
        <h2>Gathering your home journeys…</h2>
      </div>
    );
  } else {
    content = (
      <Suspense fallback={<PageSkeleton />}>
        {path === "/" && (
          <Dashboard onOpen={openTransactionById} onNew={() => setFormOpen(true)} search={search} />
        )}
        {path === "/transactions" && (
          <HubTransactionsView
            transactions={state.transactions}
            search={search}
            routeSearch={routeSearch}
            onOpen={openTransactionById}
            onNew={() => setFormOpen(true)}
          />
        )}
        {path === "/tasks" && <TasksPage onOpen={openTransactionById} />}
        {path === "/calendar" && <CalendarPage onOpen={openTransactionById} />}
        {path === "/messages" && <MessagesPage />}
        {path === "/documents" && <DocumentsPage />}
        {path === "/vendors" && <VendorsPage />}
        {path === "/integrations" && <IntegrationsPage />}
        {path === "/settings" && <SettingsPage />}
        {path === "/client-preview" && <ClientJourney />}
        {path === "/home-hub" && <ClientJourney forceHome />}
      </Suspense>
    );
  }

  return (
    <div className={`workspace ${clientMode ? "client-mode" : ""}`}>
      <HubSidebar
        path={path}
        clientMode={clientMode}
        demo={demo}
        saving={saving}
        online={online}
        pendingTaskCount={dueTasks.length}
        hasMessages={state.messages.length > 0}
        onSetDemo={setDemo}
        onNavigate={navigate}
      />
      <div className="workspace-main">
        <HubTopBar
          path={path}
          pageLabel={pageLabel}
          clientMode={clientMode}
          demo={demo}
          saving={saving}
          userName={userName}
          search={search}
          mobileSearchOpen={mobileSearchOpen}
          hasPendingTasks={dueTasks.length > 0}
          onSearchChange={setSearch}
          onOpenMore={() => setMoreOpen(true)}
          onToggleMobileSearch={() => setMobileSearchOpen((isOpen) => !isOpen)}
          onCloseMobileSearch={() => {
            setSearch("");
            setMobileSearchOpen(false);
          }}
          onOpenHelp={() => setHelpOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onNavigate={navigate}
        />
        <main className={`main-content ${clientMode ? "client-content" : ""}`}>{content}</main>
        <footer className="workspace-footer">
          <span>Made for the moments that move you.</span>
          <span>
            <LockKeyhole size={11} />
            Flores Property Group · Transaction Hub
          </span>
        </footer>
      </div>
      <MobileNavigation
        moreOpen={moreOpen}
        onMoreOpenChange={setMoreOpen}
        path={path}
        onNavigate={navigate}
        pending={dueTasks.length}
        demo={demo}
        onWorkspace={() => {
          setDemo(!demo);
          navigate("/");
        }}
      />
      <Suspense fallback={null}>
        {formOpen && <TransactionFormDialog open onClose={() => setFormOpen(false)} />}
        {openTransaction && (
          <TransactionDetail transaction={openTransaction} onClose={() => setOpenTransactionId(null)} />
        )}
      </Suspense>
      <NotificationsDialog
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        dueTasks={dueTasks}
        transactions={state.transactions}
        onOpenTransaction={openTransactionById}
      />
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
