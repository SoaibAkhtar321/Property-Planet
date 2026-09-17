"use client"

// Phase 7: this used to be static template markup ("You have 3 new
// mails", "Your listing post has been approved", "Your meeting is
// cancelled") shown to every buyer/seller regardless of whether any of
// it was true -- fabricated notification content. The real
// `notifications` table has existed since 0022_site_visit_cancellation.sql
// (site-visit-cancellation is the only event that currently writes to
// it), with RLS already scoping reads/updates to
// `recipient_id = auth.uid()`. This component now reads that table
// directly instead of rendering invented events.
//
// No new notification-producing events are added here -- per the Phase 7
// brief ("do not fabricate notification functionality"), the only real
// backend trigger today is the seller-cancellation notification. Listing
// approval/rejection, buyer-enquiry-confirmation, etc. are not wired to
// write to `notifications` yet, so they correctly don't appear here
// until that backend work is actually done.

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

import notificationIcon_3 from "@/assets/images/dashboard/icon/icon_38.svg";

interface NotificationRow {
   id: string;
   type: string;
   message: string;
   read: boolean;
   created_at: string;
}

const formatRelativeTime = (iso: string): string => {
   const diffMs = Date.now() - new Date(iso).getTime();
   const minutes = Math.floor(diffMs / 60000);
   if (minutes < 1) return "just now";
   if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
   const hours = Math.floor(minutes / 60);
   if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
   const days = Math.floor(hours / 24);
   return `${days} day${days === 1 ? "" : "s"} ago`;
};

interface NotificationProps {
   /** Lets the header show/hide its unread badge-pill from real data. */
   onUnreadCountChange?: (count: number) => void;
}

const Notification = ({ onUnreadCountChange }: NotificationProps) => {
   const [notifications, setNotifications] = useState<NotificationRow[]>([]);
   const [loaded, setLoaded] = useState(false);

   useEffect(() => {
      let cancelled = false;
      const supabase = createClient();

      (async () => {
         const {
            data: { user },
         } = await supabase.auth.getUser();
         if (!user || cancelled) return;

         const { data } = await supabase
            .from("notifications")
            .select("id, type, message, read, created_at")
            .order("created_at", { ascending: false })
            .limit(10);

         if (cancelled) return;
         const rows = data ?? [];
         setNotifications(rows);
         setLoaded(true);
         onUnreadCountChange?.(rows.filter((r) => !r.read).length);
      })();

      return () => {
         cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   const markRead = async (id: string) => {
      setNotifications((prev) => {
         const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
         onUnreadCountChange?.(next.filter((n) => !n.read).length);
         return next;
      });
      const supabase = createClient();
      await supabase.from("notifications").update({ read: true }).eq("id", id);
   };

   return (
      <ul className="dropdown-menu" aria-labelledby="notification-dropdown">
         <li>
            <h4>Notification</h4>
            <ul className="style-none notify-list">
               {!loaded ? (
                  <li className="d-flex align-items-center">
                     <div className="flex-fill ps-2">
                        <span className="time">Loading...</span>
                     </div>
                  </li>
               ) : notifications.length === 0 ? (
                  <li className="d-flex align-items-center">
                     <div className="flex-fill ps-2">
                        <span className="time">No notifications yet.</span>
                     </div>
                  </li>
               ) : (
                  notifications.map((n) => (
                     <li
                        key={n.id}
                        className={`d-flex align-items-center${n.read ? "" : " unread"}`}
                        role={n.read ? undefined : "button"}
                        onClick={n.read ? undefined : () => markRead(n.id)}
                        style={n.read ? undefined : { cursor: "pointer" }}
                     >
                        <Image src={notificationIcon_3} alt="" className="lazy-img icon" />
                        <div className="flex-fill ps-2">
                           <h6>{n.message}</h6>
                           <span className="time">{formatRelativeTime(n.created_at)}</span>
                        </div>
                     </li>
                  ))
               )}
            </ul>
         </li>
      </ul>
   )
}

export default Notification
