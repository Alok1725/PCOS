import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Settings as SettingsIcon, Bell, Trash2, Download, Shield, Clock, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';

const API = `${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}`}/api`;

// ═══ Custom Clock Time Picker ═══
function ClockTimePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const [hour, minute] = (value || '09:00').split(':').map(Number);
  const [period, setPeriod] = useState(hour >= 12 ? 'PM' : 'AM');
  const [displayHour, setDisplayHour] = useState(hour % 12 || 12);
  const [displayMinute, setDisplayMinute] = useState(minute);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const updateTime = (h, m, p) => {
    let h24 = h;
    if (p === 'AM' && h === 12) h24 = 0;
    else if (p === 'PM' && h !== 12) h24 = h + 12;
    onChange(`${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  const adjustHour = (delta) => {
    const newH = ((displayHour - 1 + delta + 12) % 12) + 1;
    setDisplayHour(newH);
    updateTime(newH, displayMinute, period);
  };

  const adjustMinute = (delta) => {
    const newM = (displayMinute + delta + 60) % 60;
    setDisplayMinute(newM);
    updateTime(displayHour, newM, period);
  };

  const togglePeriod = () => {
    const newP = period === 'AM' ? 'PM' : 'AM';
    setPeriod(newP);
    updateTime(displayHour, displayMinute, newP);
  };

  // Format for display
  const formattedTime = `${displayHour}:${String(displayMinute).padStart(2, '0')} ${period}`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-background hover:bg-muted/50 transition-colors"
      >
        <Clock className="h-4 w-4 text-pink-500" />
        <span className="text-sm font-medium">{formattedTime}</span>
      </button>

      {open && (
        <div className="absolute right-0 bottom-12 glass-card rounded-xl shadow-2xl z-50 p-4 fade-in w-56">
          <p className="text-[10px] font-semibold text-muted-foreground mb-3 text-center">SET REMINDER TIME</p>

          <div className="flex items-center justify-center gap-2">
            {/* Hour */}
            <div className="flex flex-col items-center">
              <button onClick={() => adjustHour(1)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <ChevronUp className="h-4 w-4" />
              </button>
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
                <span className="text-xl font-bold text-pink-600 dark:text-pink-400">{String(displayHour).padStart(2, '0')}</span>
              </div>
              <button onClick={() => adjustHour(-1)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <ChevronDown className="h-4 w-4" />
              </button>
              <span className="text-[9px] text-muted-foreground mt-0.5">Hour</span>
            </div>

            <span className="text-xl font-bold text-muted-foreground mt-[-16px]">:</span>

            {/* Minute */}
            <div className="flex flex-col items-center">
              <button onClick={() => adjustMinute(5)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <ChevronUp className="h-4 w-4" />
              </button>
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
                <span className="text-xl font-bold text-pink-600 dark:text-pink-400">{String(displayMinute).padStart(2, '0')}</span>
              </div>
              <button onClick={() => adjustMinute(-5)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <ChevronDown className="h-4 w-4" />
              </button>
              <span className="text-[9px] text-muted-foreground mt-0.5">Minute</span>
            </div>

            {/* AM/PM */}
            <div className="flex flex-col items-center">
              <button onClick={togglePeriod} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <ChevronUp className="h-4 w-4" />
              </button>
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <span className="text-lg font-bold">{period}</span>
              </div>
              <button onClick={togglePeriod} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <ChevronDown className="h-4 w-4" />
              </button>
              <span className="text-[9px] text-muted-foreground mt-0.5">Period</span>
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="w-full mt-3 text-xs font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg py-1.5 hover:from-pink-600 hover:to-rose-600 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

// ═══ Settings Page ═══
export default function Settings() {
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState({
    remind_symptoms: true,
    remind_water: true,
    remind_mood: true,
    reminder_time: '09:00',
    email_digest: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch(`${API}/settings/${user.id}`)
      .then(r => r.json())
      .then(d => setSettings(s => ({ ...s, ...d })))
      .catch(() => {});
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${API}/settings/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await fetch(`${API}/settings/${user.id}`, { method: 'DELETE' });
      signOut();
    } catch {
      setDeleting(false);
    }
  };

  const handleExportData = async () => {
    try {
      const [profile, assessments, symptoms, water, mood, cycle] = await Promise.all([
        fetch(`${API}/profile/${user.id}`).then(r => r.json()).catch(() => null),
        fetch(`${API}/assessments/${user.id}`).then(r => r.json()).catch(() => []),
        fetch(`${API}/symptoms/${user.id}`).then(r => r.json()).catch(() => []),
        fetch(`${API}/water/${user.id}`).then(r => r.json()).catch(() => null),
        fetch(`${API}/mood/${user.id}`).then(r => r.json()).catch(() => []),
        fetch(`${API}/cycle/${user.id}`).then(r => r.json()).catch(() => []),
      ]);
      const data = { profile, assessments, symptoms, water, mood, cycle, exported_at: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cyclesync_data_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  };

  const Toggle = ({ checked, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-pink-500' : 'bg-muted'}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background gradient-mesh-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full pb-24 md:pb-0">
        <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <SettingsIcon className="h-7 w-7 text-pink-500" /> Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your preferences and data</p>
          </div>

          {/* In-app Reminder Preferences */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="h-4 w-4 text-pink-500" /> In-App Reminder Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[10px] text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                These reminders appear in your <strong>notification bell 🔔</strong> on the dashboard when you haven't logged daily activities.
              </p>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Symptom Reminders</p>
                  <p className="text-xs text-muted-foreground">Show notification if symptoms haven't been logged today</p>
                </div>
                <Toggle checked={settings.remind_symptoms} onChange={v => setSettings(s => ({ ...s, remind_symptoms: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Water Intake Reminders</p>
                  <p className="text-xs text-muted-foreground">Show notification if water hasn't been tracked today</p>
                </div>
                <Toggle checked={settings.remind_water} onChange={v => setSettings(s => ({ ...s, remind_water: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Mood Check-ins</p>
                  <p className="text-xs text-muted-foreground">Show notification if mood hasn't been logged today</p>
                </div>
                <Toggle checked={settings.remind_mood} onChange={v => setSettings(s => ({ ...s, remind_mood: v }))} />
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Reminder Time</p>
                    <p className="text-xs text-muted-foreground">When reminders become active each day</p>
                  </div>
                  <ClockTimePicker
                    value={settings.reminder_time}
                    onChange={v => setSettings(s => ({ ...s, reminder_time: v }))}
                  />
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
                {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" /> Data & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Export My Data</p>
                  <p className="text-xs text-muted-foreground">Download all your health data as JSON</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-2" /> Export
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Your Email</p>
                  <p className="text-xs text-muted-foreground">{user?.email || 'Not available'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="glass-card border-destructive/30">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" /> Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!deleteConfirm ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Delete Account & Data</p>
                    <p className="text-xs text-muted-foreground">Permanently delete all your data. This cannot be undone.</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(true)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </div>
              ) : (
                <div className="bg-destructive/5 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-semibold text-destructive">Are you absolutely sure?</p>
                  <p className="text-xs text-muted-foreground">This will permanently delete all your assessments, symptom logs, mood data, cycle history, community posts, and settings.</p>
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={handleDeleteAccount} disabled={deleting}>
                      {deleting ? 'Deleting...' : 'Yes, Delete Everything'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
