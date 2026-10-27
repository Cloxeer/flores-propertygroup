/**
 * ELI5: The little "Demo workspace / My private workspace" picker in the sidebar.
 * What: Selector button plus dropdown to flip between the sample workspace and the private one.
 * Owns: dropdown open state and the demo/private switch actions.
 * Depends on: HubContext (via props from HubSidebar).
 */
import { useState } from "react";
import { Check, ChevronDown, LockKeyhole, Sparkles } from "lucide-react";

export interface WorkspaceSwitcherProps {
  demo: boolean;
  onSetDemo: (demo: boolean) => void;
  onNavigate: (path: string) => void;
}

export function WorkspaceSwitcher({
  demo,
  onSetDemo,
  onNavigate,
}: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);

  const choose = (nextDemo: boolean) => {
    onSetDemo(nextDemo);
    setOpen(false);
    onNavigate("/");
  };

  return (
    <>
      <button className="workspace-selector" onClick={() => setOpen(!open)}>
        <span className="workspace-mark">F</span>
        <span>
          <strong>{demo ? "Demo workspace" : "My private workspace"}</strong>
          <small>{demo ? "Take a look around" : "Your home journeys"}</small>
        </span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="workspace-dropdown">
          <button onClick={() => choose(true)}>
            <Sparkles size={14} />
            Explore sample workspace
            {demo && <Check size={14} />}
          </button>
          <button onClick={() => choose(false)}>
            <LockKeyhole size={14} />
            My private workspace
            {!demo && <Check size={14} />}
          </button>
        </div>
      )}
    </>
  );
}
