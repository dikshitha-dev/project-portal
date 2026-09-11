import { supabase } from "../supabase/client";
import type { NotificationItem } from "@/types";

export const notificationsService = {
  async getAll(): Promise<{ notifications: NotificationItem[]; unread_count: number }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthenticated");

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const unreadCount = (data || []).filter((n) => !n.is_read).length;
    return { notifications: (data || []) as NotificationItem[], unread_count: unreadCount };
  },

  async markAsRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    return { message: "Marked as read" };
  },

  async markAllAsRead() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthenticated");

    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id);
    return { message: "All marked as read" };
  },

  async delete(id: string) {
    await supabase.from("notifications").delete().eq("id", id);
    return { message: "Notification deleted" };
  },

  async sendNotification(payload: { user_id: string; title: string; message: string; type?: string; link?: string }) {
    await supabase.from("notifications").insert({
      user_id: payload.user_id,
      title: payload.title,
      message: payload.message,
      type: payload.type || "info",
      link: payload.link || null,
    });
  },
};
