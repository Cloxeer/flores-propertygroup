/**
 * ELI5: The row of buttons at the bottom of a phone, plus a "More" drawer for the rest.
 * What: Mobile bottom navigation bar with a pending-task badge and a "More" sheet listing secondary pages.
 * Owns: MobileNavigation, PRIMARY_NAV_ITEMS and MORE_NAV_ITEMS.
 * Depends on: Primitives (HubDialog), lucide-react icons.
 */
import {
  ArrowRight,
  CalendarDays,
  CheckCheck,
  ChevronRight,
  Ellipsis,
  FolderClosed,
  Handshake,
  House,
  LayoutDashboard,
  LockKeyhole,
  MessageSquare,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { HubDialog } from "@/components/hub/Primitives";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { path: "/", label: "Today", icon: LayoutDashboard },
  { path: "/transactions", label: "Homes", icon: House },
  { path: "/tasks", label: "Tasks", icon: CheckCheck },
  { path: "/messages", label: "Messages", icon: MessageSquare },
];

export const MORE_NAV_ITEMS: NavItem[] = [
  { path: "/calendar", label: "Calendar", icon: CalendarDays },
  { path: "/documents", label: "Key documents", icon: FolderClosed },
  { path: "/vendors", label: "Service providers", icon: Handshake },
  { path: "/settings", label: "Settings & offline access", icon: Settings },
  { path: "/client-preview", label: "Preview the client journey", icon: House },
];

interface MobileNavigationProps {
  moreOpen: boolean;
  onMoreOpenChange: (open: boolean) => void;
  path: string;
  onNavigate: (path: string) => void;
  pending: number;
  demo: boolean;
  onWorkspace: () => void;
}

export function MobileNavigation({
  moreOpen,
  onMoreOpenChange,
  path,
  onNavigate,
  pending,
  demo,
  onWorkspace,
}: MobileNavigationProps) {
  const setMoreOpen = onMoreOpenChange;

  const go = (target: string) => {
    setMoreOpen(false);
    onNavigate(target);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <>
      <nav className="mobile-bottom-nav" aria-label="Main phone navigation">
        {PRIMARY_NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            className={`mobile-nav-item ${path === item.path ? "active" : ""}`}
            aria-current={path === item.path ? "page" : undefined}
            onClick={() => go(item.path)}
          >
            <span className="mobile-nav-icon">
              <item.icon size={21} />
              {item.path === "/tasks" && pending > 0 && (
                <span className="mobile-nav-badge">{pending > 9 ? "9+" : pending}</span>
              )}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
        <button
          className={`mobile-nav-item ${MORE_NAV_ITEMS.some((item) => item.path === path) ? "active" : ""}`}
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(true)}
        >
          <Ellipsis size={21} />
          <span>More</span>
        </button>
      </nav>
      <HubDialog
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="More"
        description="The rest of your workspace, one tap away."
      >
        <div className="mobile-more-grid">
          {MORE_NAV_ITEMS.map((item) => (
            <button key={item.path} onClick={() => go(item.path)}>
              <item.icon size={21} />
              <span>{item.label}</span>
              <ChevronRight size={17} />
            </button>
          ))}
        </div>
        <div className="form-note">
          <LockKeyhole size={17} />
          <span>
            {demo ? "You are exploring fictional demo data." : "You are in your private workspace, saved on this device."}
          </span>
        </div>
        <button
          className="button secondary"
          onClick={() => {
            setMoreOpen(false);
            onWorkspace();
          }}
        >
          <Users size={17} />
          {demo ? "Open my private workspace" : "Explore the demo workspace"}
          <ArrowRight size={16} />
        </button>
        <button
          className="text-button"
          onClick={() => {
            setMoreOpen(false);
            onNavigate("~/");
          }}
        >
          About this preview
        </button>
      </HubDialog>
    </>
  );
}
