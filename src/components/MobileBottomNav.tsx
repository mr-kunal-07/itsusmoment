import { Home, CalendarHeart, Trophy, MessageCircleHeart, Upload, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewType } from "@/components/AppSidebar";

interface Props {
  selectedView: ViewType;
  onSelectView: (view: ViewType) => void;
  onUpload: () => void;
}

const navItems = [
  { id: "all" as ViewType, label: "Files", icon: Home },
  { id: "timeline" as ViewType, label: "Memories", icon: CalendarHeart },
  { id: "activity" as ViewType, label: "Activity", icon: Activity },
  { id: "chat" as ViewType, label: "Chat", icon: MessageCircleHeart },
];

export function MobileBottomNav({ selectedView, onSelectView, onUpload }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-background/95 backdrop-blur-md border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around px-1 h-16">
        {navItems.map((item, index) => {
          const isActive = selectedView === item.id;
          // Insert Upload button in the center (after index 1)
          const showUploadBefore = index === 2;

          return (
            <div key={item.id} className="contents">
              {showUploadBefore && (
                <button
                  onClick={onUpload}
                  className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2"
                >
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-lg -mt-5 border-2 border-background">
                    <Upload className="h-4 w-4 text-primary-foreground" />
                  </div>
                </button>
              )}
              <button
                onClick={() => onSelectView(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
