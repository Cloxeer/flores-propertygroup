/**
 * ELI5: The strip across the top: breadcrumb, search, help, bell, profile, and the Team/Client switch.
 * What: Topbar header, mobile search panel and mode bar (Team workspace / Client view toggle).
 * Owns: top-of-page chrome markup; search/dialog state lives in the Hub parent.
 * Depends on: Primitives (Avatar), lucide-react.
 */
import {
  Bell,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  House,
  Search,
  Users,
  X,
} from "lucide-react";
import { useIsMobile } from "@/contexts/HubContext";
import { Avatar } from "@/components/hub/Primitives";

export interface HubTopBarProps {
  path: string;
  pageLabel: string;
  clientMode: boolean;
  demo: boolean;
  saving: boolean;
  userName: string;
  search: string;
  mobileSearchOpen: boolean;
  hasPendingTasks: boolean;
  onSearchChange: (value: string) => void;
  onOpenMore: () => void;
  onToggleMobileSearch: () => void;
  onCloseMobileSearch: () => void;
  onOpenHelp: () => void;
  onOpenNotifications: () => void;
  onNavigate: (path: string) => void;
}

const SEARCHABLE_PATHS: string[] = ["/", "/transactions"];

export function HubTopBar({
  path,
  pageLabel,
  clientMode,
  demo,
  saving,
  userName,
  search,
  mobileSearchOpen,
  hasPendingTasks,
  onSearchChange,
  onOpenMore,
  onToggleMobileSearch,
  onCloseMobileSearch,
  onOpenHelp,
  onOpenNotifications,
  onNavigate,
}: HubTopBarProps) {
  const ensureSearchablePage = () => {
    if (!SEARCHABLE_PATHS.includes(path)) {
      onNavigate("/transactions");
    }
  };

  const isMobile = useIsMobile();
  const profileName = demo ? "Anela Flores" : userName;

  let modeNote: string;
  if (demo) {
    modeNote = "Demo workspace · fictional transactions";
  } else if (saving) {
    modeNote = "Saving…";
  } else {
    modeNote = "Private workspace · saved on this device";
  }

  return (
    <>
      <header className="topbar">
        <div className="breadcrumb">
          <span className="breadcrumb-root">Workspace</span>
          <ChevronRight size={12} />
          <strong>{pageLabel}</strong>
          <span className={`demo-pill ${demo ? "" : "private-pill"}`}>{demo ? "Demo" : "Private"}</span>
        </div>
        <div className="topbar-actions">
          <button
            className="mobile-search-toggle icon-button"
            aria-label="Search clients and homes"
            aria-expanded={mobileSearchOpen}
            onClick={() => {
              ensureSearchablePage();
              onToggleMobileSearch();
            }}
          >
            <Search size={20} />
          </button>
          <div className="global-search">
            <Search size={15} />
            <input
              aria-label="Search transactions"
              placeholder="Find a client or a home…"
              value={search}
              onChange={(event) => {
                onSearchChange(event.target.value);
                ensureSearchablePage();
              }}
            />
            {search ? (
              <button aria-label="Clear search" onClick={() => onSearchChange("")}>
                <X size={13} />
              </button>
            ) : (
              <span>⌕</span>
            )}
          </div>
          <button className="icon-button" title="Workspace help" onClick={onOpenHelp}>
            <CircleHelp size={18} />
          </button>
          <button
            className="icon-button notification-button"
            aria-label="Open notifications"
            onClick={onOpenNotifications}
          >
            <Bell size={18} />
            {hasPendingTasks && <span />}
          </button>
          <div className="profile-divider" />
          <button className="profile-button" onClick={isMobile ? onOpenMore : () => onNavigate("/settings")}>
            <Avatar name={profileName} small />
            <span>
              {profileName}
              <small>{demo ? "Team leader · demo" : "Private · this device"}</small>
            </span>
            <ChevronDown size={12} />
          </button>
        </div>
      </header>
      {mobileSearchOpen && (
        <div className="mobile-search-panel">
          <Search size={19} />
          <input
            autoFocus
            type="search"
            aria-label="Search clients and homes"
            placeholder="Client name or home address…"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <button className="icon-button" aria-label="Close search" onClick={onCloseMobileSearch}>
            <X size={19} />
          </button>
        </div>
      )}
      <div className={`mode-bar ${clientMode ? "is-client" : ""}`}>
        <div className="mode-switch">
          <button className={clientMode ? "" : "active"} onClick={() => onNavigate("/")}>
            <Users size={14} />
            Team workspace
          </button>
          <button
            className={clientMode ? "active" : ""}
            onClick={() => onNavigate("/client-preview")}
          >
            <House size={14} />
            Client view
          </button>
        </div>
        <span className="mode-note">
          <span className={`small-dot ${demo ? "gold" : "sage"}`} />
          {modeNote}
        </span>
      </div>
    </>
  );
}
