import { useEffect, useState, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Activity, Droplets, Smile, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { requestNotificationPermission, sendPushNotification } from '../utils/pushNotifications';

const API = `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}`}/api`;

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Fetch server notifications + generate smart reminders
  useEffect(() => {
    if (!user) return;

    // Request push notification permissions on mount
    requestNotificationPermission();

    const fetchAll = async () => {
      try {
        // Fetch from server
        const serverRes = await fetch(`${API}/notifications/${user.id}`);
        const serverNotifs = await serverRes.json();

        // Fetch today's logs to build smart reminders
        const today = new Date().toISOString().split('T')[0];
        const [symptomsRes, waterRes, moodRes, assessRes, settingsRes, suppsRes] = await Promise.all([
          fetch(`${API}/symptoms/${user.id}`).then(r => r.json()).catch(() => []),
          fetch(`${API}/water/${user.id}`).then(r => r.json()).catch(() => ({ glasses: 0 })),
          fetch(`${API}/mood/${user.id}`).then(r => r.json()).catch(() => []),
          fetch(`${API}/assessments/${user.id}`).then(r => r.json()).catch(() => []),
          fetch(`${API}/settings/${user.id}`).then(r => r.json()).catch(() => ({})),
          fetch(`${API}/supplements/${user.id}`).then(r => r.json()).catch(() => []),
        ]);

        const userSettings = settingsRes || {};
        const remindSymptoms = userSettings.remind_symptoms !== false;
        const remindWater = userSettings.remind_water !== false;
        const remindMood = userSettings.remind_mood !== false;

        const symptoms = Array.isArray(symptomsRes) ? symptomsRes : [];
        const moods = Array.isArray(moodRes) ? moodRes : [];
        const assessments = Array.isArray(assessRes) ? assessRes : [];
        const supplements = Array.isArray(suppsRes) ? suppsRes : [];

        const hasLoggedSymptoms = symptoms.some(s => s.log_date === today);
        const hasLoggedWater = (waterRes?.glasses || 0) > 0;
        const hasLoggedMood = moods.some(m => m.log_date === today);
        const hasAssessments = assessments.length > 0;

        // Build smart reminder notifications (local, client-side)
        const smartReminders = [];
        const reminderReadKey = `cyclesync_reminders_read_${user.id}_${today}`;
        const readReminders = JSON.parse(localStorage.getItem(reminderReadKey) || '[]');
        
        // Push notification logic
        const currentHour = new Date().getHours();
        const shouldPushWater = remindWater && !hasLoggedWater && currentHour >= 12; // e.g. prompt at noon
        const shouldPushStats = (remindSymptoms || remindMood) && (!hasLoggedSymptoms || !hasLoggedMood) && currentHour >= 18; // e.g. prompt in evening

        if (!hasLoggedSymptoms && remindSymptoms) {
          const id = `reminder_symptoms_${today}`;
          smartReminders.push({
            id, type: 'reminder', title: 'Log Your Symptoms', 
            message: "You haven't logged any symptoms today. Tracking daily helps the AI give better insights!",
            created_at: new Date().toISOString(), is_read: readReminders.includes(id), is_local: true,
          });
        }
        if (!hasLoggedMood && remindMood) {
          const id = `reminder_mood_${today}`;
          smartReminders.push({
            id, type: 'reminder', title: 'How Are You Feeling?',
            message: "Take a moment to log your mood. It helps track emotional patterns alongside physical symptoms.",
            created_at: new Date().toISOString(), is_read: readReminders.includes(id), is_local: true,
          });
        }
        
        if (shouldPushStats) {
           sendPushNotification('Time for Daily Log!', { 
             body: "You haven't logged your health stats today. Take a quick moment for yourself!",
             id: `push_stats_${today}`
           });
        }

        if (!hasLoggedWater && remindWater) {
          const id = `reminder_water_${today}`;
          smartReminders.push({
            id, type: 'reminder', title: 'Track Water Intake',
            message: "Staying hydrated is crucial for hormonal balance. Log your water intake today!",
            created_at: new Date().toISOString(), is_read: readReminders.includes(id), is_local: true,
          });
          
          if (shouldPushWater) {
             sendPushNotification('Hydration Reminder 💧', {
               body: "Don't forget to drink water today! Your body will thank you.",
               id: `push_water_${today}`
             });
          }
        }
        if (!hasAssessments) {
          const id = `reminder_upload_${today}`;
          smartReminders.push({
            id, type: 'reminder', title: 'Upload Your First Report',
            message: "Get started by uploading an ultrasound or blood test report for your personalized PCOS screening.",
            created_at: new Date().toISOString(), is_read: readReminders.includes(id), is_local: true,
          });
        }
        
        // Supplements Reminders
        supplements.forEach(supp => {
          if (!supp.takenToday) {
             // Check if it's the right time of day based on timing
             const timing = supp.timing || 'morning';
             let isDue = false;
             
             if (timing === 'morning' && currentHour >= 6 && currentHour < 12) isDue = true;
             else if (timing === 'afternoon' && currentHour >= 12 && currentHour < 18) isDue = true;
             else if (timing === 'night' && currentHour >= 18) isDue = true;
             
             if (isDue) {
                const id = `reminder_supp_${supp.id}_${today}`;
                smartReminders.push({
                  id, type: 'reminder', title: `Supplement: ${supp.name}`,
                  message: `It's time to take your ${supp.name}. ${supp.hint?.hint || ''}`,
                  created_at: new Date().toISOString(), is_read: readReminders.includes(id), is_local: true,
                });
                
                sendPushNotification(`Time for: ${supp.name}`, {
                   body: `Reminder: It's time to take ${supp.name}.`,
                   id: `push_supp_${supp.id}_${today}`
                });
             }
          }
        });

        // Merge: smart reminders on top, then server notifications
        const allNotifs = [...smartReminders, ...(Array.isArray(serverNotifs) ? serverNotifs : [])];
        setNotifications(allNotifs);
      } catch {
        setNotifications([]);
      }
    };

    fetchAll();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Mark all as read when opening the dropdown
  const handleOpen = () => {
    const wasOpen = open;
    setOpen(!open);

    if (!wasOpen) {
      // Mark all unread as read
      const today = new Date().toISOString().split('T')[0];
      const reminderReadKey = `cyclesync_reminders_read_${user?.id}_${today}`;

      // Mark local reminders as read in localStorage
      const localIds = notifications.filter(n => n.is_local && !n.is_read).map(n => n.id);
      if (localIds.length > 0) {
        const existing = JSON.parse(localStorage.getItem(reminderReadKey) || '[]');
        localStorage.setItem(reminderReadKey, JSON.stringify([...existing, ...localIds]));
      }

      // Mark server notifications as read
      const hasServerUnread = notifications.some(n => !n.is_local && !n.is_read);
      if (hasServerUnread && user) {
        fetch(`${API}/notifications/read-all/${user.id}`, { method: 'PATCH' }).catch(() => {});
      }

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const markRead = (id) => {
    const notif = notifications.find(n => n.id === id);
    if (!notif || notif.is_read) return;

    if (notif.is_local) {
      const today = new Date().toISOString().split('T')[0];
      const reminderReadKey = `cyclesync_reminders_read_${user?.id}_${today}`;
      const existing = JSON.parse(localStorage.getItem(reminderReadKey) || '[]');
      localStorage.setItem(reminderReadKey, JSON.stringify([...existing, id]));
    } else {
      fetch(`${API}/notifications/${id}/read`, { method: 'PATCH' }).catch(() => {});
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const typeIcon = { info: '💡', reminder: '⏰', alert: '⚠️', tip: '✨' };

  const getTimeAgo = (dateStr) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={handleOpen} className="relative p-2 rounded-lg hover:bg-muted transition-colors">
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-ring">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 glass-card rounded-xl shadow-2xl z-50 overflow-hidden fade-in">
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">You're all caught up! 🎉</p>
              </div>
            ) : notifications.map(n => (
              <div
                key={n.id}
                className={`p-3 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer ${!n.is_read ? 'bg-primary/5' : ''}`}
                onClick={() => markRead(n.id)}
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm flex-shrink-0 mt-0.5">{typeIcon[n.type] || '💡'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${!n.is_read ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[9px] text-muted-foreground/60 mt-1">{getTimeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
