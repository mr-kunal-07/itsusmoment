import { Home, CalendarHeart, MessageCircleHeart, Upload, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewType } from "@/components/AppSidebar";

interface Props {
  selectedView: ViewType;
  onSelectView: (view: ViewType) => void;
  onUpload: () => void;
}

const navItems = [
  { id: "all"      as ViewType, label: "Files",    icon: Home },
  { id: "timeline" as ViewType, label: "Memories", icon: CalendarHeart },
  { id: "chat"     as ViewType, label: "Chat",     icon: MessageCircleHeart },
  { id: "billing"  as ViewType, label: "Plans",    icon: CreditCard },
];

export function MobileBottomNav({ selectedView, onSelectView, onUpload }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-background border-t border-border safe-area-bottom">
      {/* Safe-area padding on notched devices */}
      <div className="flex items-center h-16">

        {/* Files */}
        <NavBtn id="all" label="Files" icon={Home} selectedView={selectedView} onSelectView={onSelectView} />

        {/* Memories */}
        <NavBtn id="timeline" label="Memories" icon={CalendarHeart} selectedView={selectedView} onSelectView={onSelectView} />

        {/* Upload FAB — centre */}
        <button
          onClick={onUpload}
          aria-label="Upload"
          className="relative flex flex-col items-center justify-center flex-1 py-2 group"
        >
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center -mt-6 shadow-lg ring-4 ring-background transition-transform active:scale-95 group-active:scale-95">
            <Upload className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground mt-0.5">Upload</span>
        </button>

        {/* Chat */}
        <NavBtn id="chat" label="Chat" icon={MessageCircleHeart} selectedView={selectedView} onSelectView={onSelectView} />

        {/* Plans */}
        <NavBtn id="billing" label="Plans" icon={CreditCard} selectedView={selectedView} onSelectView={onSelectView} />

      </div>
    </nav>
  );
}

function NavBtn({
  id, label, icon: Icon, selectedView, onSelectView,
}: {
  id: ViewType; label: string; icon: React.ElementType;
  selectedView: ViewType; onSelectView: (v: ViewType) => void;
}) {
  const isActive = selectedView === id;
  return (
    <button
      onClick={() => onSelectView(id)}
      aria-label={label}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors relative",
        isActive ? "text-foreground" : "text-muted-foreground"
      )}
    >
      {/* Active indicator pill */}
      {isActive && (
        <span className="absolute top-1 left-1/2 -translate-x-1/2 h-1 w-5 rounded-full bg-primary" />
      )}
      <Icon className={cn("h-5 w-5 transition-transform mt-1", isActive && "scale-110")} />
      <span className={cn("text-[10px] font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
    </button>
  );
}
