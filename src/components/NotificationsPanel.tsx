import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Bell, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function NotificationsPanel() {
  const { data: notifications = [] } = useNotifications();
  const navigate = useNavigate();

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-9 w-9"
      onClick={() => navigate("/dashboard/activity")}
    >
      <Heart className="h-4 w-4" />

      {unread > 0 && (
        <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Button>
  );
}