/**
 * ELI5: The left-hand menu: logo, workspace picker, page links and the help card.
 * What: Sidebar aside with workspace + support nav lists, unread/pending badges and connection status.
 * Owns: WORKSPACE_NAV_ITEMS, SUPPORT_NAV_ITEMS and the sidebar markup.
 * Depends on: WorkspaceSwitcher, MobileNavigation (NavItem type), constants.
 */
import {
  CalendarDays,
  CheckCheck,
  FolderClosed,
  Handshake,
  House,
  LayoutDashboard,
  MessageSquare,
  PlugZap,
  Settings,
  Ellipsis,
} from "lucide-react";
import { WorkspaceSwitcher } from "@/components/hub/WorkspaceSwitcher";
import type { NavItem } from "@/components/hub/MobileNavigation";
import { FALLBACK_HOME_IMAGE } from "@/lib/constants";

export const WORKSPACE_NAV_ITEMS: NavItem[] = [
  { path: "/", label: "Overview", icon: LayoutDashboard },
  { path: "/transactions", label: "Transactions", icon: House },
  { path: "/tasks", label: "My tasks", icon: CheckCheck },
  { path: "/calendar", label: "Calendar", icon: CalendarDays },
  { path: "/messages", label: "Messages", icon: MessageSquare },
];

/** Secondary destinations, folded behind one "More" disclosure so the menu shows five choices. */
export const SUPPORT_NAV_ITEMS: NavItem[] = [
  { path: "/documents", label: "Document vault", icon: FolderClosed },
  { path: "/vendors", label: "Trusted vendors", icon: Handshake },
  { path: "/integrations", label: "Integrations", icon: PlugZap },
  { path: "/settings", label: "Settings", icon: Settings },
];

export interface HubSidebarProps {
  path: string;
  clientMode: boolean;
  demo: boolean;
  saving: boolean;
  online: boolean;
  pendingTaskCount: number;
  hasMessages: boolean;
  onSetDemo: (demo: boolean) => void;
  onNavigate: (path: string) => void;
}

export function HubSidebar({
  path,
  clientMode,
  demo,
  saving,
  online,
  pendingTaskCount,
  hasMessages,
  onSetDemo,
  onNavigate,
}: HubSidebarProps) {
  const moreActive = SUPPORT_NAV_ITEMS.some((item) => item.path === path);
  let statusText: string;
  if (!online) {
    statusText = "Offline · cached views only";
  } else if (saving) {
    statusText = "Saving your changes…";
  } else if (demo) {
    statusText = "Sample data · saved locally";
  } else {
    statusText = "Private account workspace";
  }

  return (
    <aside className="sidebar">
      <button
        className="brand"
        onClick={() => onNavigate("/")}
        aria-label="Flores Property Group overview"
      >
        <img src={FALLBACK_HOME_IMAGE} alt="Flores Property Group logo" />
        <span>
          <strong>flores</strong>
          <small>PROPERTY GROUP</small>
        </span>
      </button>
      <div className="hub-label">
        <span />
        TRANSACTION HUB
        <span />
      </div>
      <WorkspaceSwitcher
        demo={demo}
        onSetDemo={onSetDemo}
        onNavigate={onNavigate}
      />
      <div className="sidebar-section-label">{clientMode ? "YOUR HOME JOURNEY" : "WORKSPACE"}</div>
      <nav>
        {WORKSPACE_NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            className={path === item.path ? "active" : ""}
            onClick={() => onNavigate(item.path)}
          >
            <item.icon size={17} />
            <span>{item.label}</span>
            {item.path === "/tasks" && pendingTaskCount > 0 && <small>{pendingTaskCount}</small>}
            {item.path === "/messages" && hasMessages && <span className="nav-unread" />}
          </button>
        ))}
      </nav>
      <details className="sidebar-more" open={moreActive}>
        <summary>
          <Ellipsis size={17} />
          <span>More</span>
        </summary>
        <nav>
          {SUPPORT_NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              className={path === item.path ? "active" : ""}
              onClick={() => onNavigate(item.path)}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </details>
      <div className="sidebar-bottom">
        <button className="text-button" onClick={() => onNavigate("~/")}>
          About this preview
        </button>
        <div className="sidebar-status">
          <span className={`small-dot ${online ? "sage" : "gold"}`} />
          {statusText}
        </div>
        <span className="sidebar-copyright">Thoughtfully guided. Flores Property Group.</span>
      </div>
    </aside>
  );
}
