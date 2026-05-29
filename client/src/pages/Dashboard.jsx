import { useEffect, useState, useCallback } from 'react';

const PCOS_SUPPLEMENTS = [
  'Inositol (Myo-Inositol)',
  'D-Chiro-Inositol',
  'Myo-Inositol + D-Chiro-Inositol',
  'Metformin',
  'Vitamin D3',
  'Vitamin B12',
  'Vitamin B6',
  'Spearmint Tea',
  'Spearmint Extract',
  'Magnesium Glycinate',
  'Omega-3 Fish Oil',
  'NAC (N-Acetyl Cysteine)',
  'Berberine',
  'Zinc',
  'Iron',
  'Chromium Picolinate',
  'Coenzyme Q10',
  'Probiotics',
  'Evening Primrose Oil',
  'Ashwagandha',
  'Vitex (Chasteberry)',
  'Folate / Folic Acid',
];
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import Sidebar from '../components/layout/Sidebar';
import NotificationBell from '../components/NotificationBell';
import QuoteBanner from '../components/QuoteBanner';
import {
  Upload, FileText, Activity, Droplets, Smile, Frown, Meh, Moon as MoonIcon,
  Angry, ChevronLeft, ChevronRight, Flame, Sparkles, Heart, TrendingUp,
  Calendar, Zap, RefreshCw, Brain, AlertCircle, TrendingDown, CheckCircle2,
  Clock, Target, BarChart3, Pill, Camera, X as XIcon, Plus, Trash2
} from 'lucide-react';

import { api } from '../lib/api';

const SYMPTOMS = [
  { id: 'acne', label: 'Acne', emoji: '😣' },
  { id: 'bloating', label: 'Bloating', emoji: '🫃' },
  { id: 'fatigue', label: 'Fatigue', emoji: '😴' },
  { id: 'mood_swings', label: 'Mood Swings', emoji: '🎭' },
  { id: 'hair_loss', label: 'Hair Loss', emoji: '💇' },
  { id: 'cramps', label: 'Cramps', emoji: '⚡' },
  { id: 'headache', label: 'Headache', emoji: '🤕' },
  { id: 'insomnia', label: 'Insomnia', emoji: '🌙' },
];

const MOODS = [
  { id: 'happy', emoji: '😊', label: 'Happy', color: 'from-emerald-400 to-green-500' },
  { id: 'neutral', emoji: '😐', label: 'Okay', color: 'from-blue-400 to-cyan-500' },
  { id: 'sad', emoji: '😢', label: 'Sad', color: 'from-violet-400 to-purple-500' },
  { id: 'angry', emoji: '😡', label: 'Stressed', color: 'from-red-400 to-rose-500' },
  { id: 'tired', emoji: '😴', label: 'Tired', color: 'from-amber-400 to-orange-500' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Widget states
  const [cycleLogs, setCycleLogs] = useState([]);
  const [calMonth, setCalMonth] = useState(new Date());
  const [todaySymptoms, setTodaySymptoms] = useState([]);
  const [symptomLogs, setSymptomLogs] = useState([]);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [moodLogs, setMoodLogs] = useState([]);
  const [todayMood, setTodayMood] = useState(null);
  const [tips, setTips] = useState([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [activeTip, setActiveTip] = useState(0);

  // New: Phase 2 widgets
  const [weeklyDigest, setWeeklyDigest] = useState(null);
  const [digestLoading, setDigestLoading] = useState(false);
  const [riskTrend, setRiskTrend] = useState(null);
  const [trendLoading, setTrendLoading] = useState(false);

  // Supplement Tracker state
  const [supplements, setSupplements] = useState([]);
  const [suppLoading, setSuppLoading] = useState(false);
  const [newSuppName, setNewSuppName] = useState('');
  const [newSuppTiming, setNewSuppTiming] = useState('morning');
  const [addingSupp, setAddingSupp] = useState(false);
  const [showAddSupp, setShowAddSupp] = useState(false);

  // Food Scorer state
  const [foodImage, setFoodImage] = useState(null);   // base64
  const [foodMime, setFoodMime] = useState('image/jpeg');
  const [foodPreview, setFoodPreview] = useState(null);
  const [foodScore, setFoodScore] = useState(null);
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodError, setFoodError] = useState('');

  // Fetch all data
  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    setLoading(true);
    setSuppLoading(true);

    Promise.all([
      api.get(`/api/profile/${userId}`).catch(() => null),
      api.get(`/api/assessments/${userId}`).catch(() => []),
      api.get(`/api/cycle/${userId}`).catch(() => []),
      api.get(`/api/symptoms/${userId}`).catch(() => []),
      api.get(`/api/water/${userId}`).catch(() => ({ glasses: 0 })),
      api.get(`/api/mood/${userId}`).catch(() => []),
      api.get(`/api/supplements/${userId}`).catch(() => []),
    ]).then(([prof, assess, cycles, symps, water, moods, supps]) => {
      setProfile(prof);
      setAssessments(Array.isArray(assess) ? assess : []);
      setCycleLogs(Array.isArray(cycles) ? cycles : []);
      setSymptomLogs(Array.isArray(symps) ? symps : []);
      setWaterGlasses(water?.glasses || 0);
      setMoodLogs(Array.isArray(moods) ? moods : []);
      setSupplements(Array.isArray(supps) ? supps : []);
      setSuppLoading(false);
      const today = new Date().toISOString().split('T')[0];
      const todayLog = (Array.isArray(symps) ? symps : []).find(s => s.log_date === today);
      if (todayLog) setTodaySymptoms(todayLog.symptoms || []);
      const todayMoodLog = (Array.isArray(moods) ? moods : []).find(m => m.log_date === today);
      if (todayMoodLog) setTodayMood(todayMoodLog.mood);
      setLoading(false);
    });
  }, [user]);

  // Fetch AI tips
  useEffect(() => {
    if (!user) return;
    setTipsLoading(true);
    const latestRisk = assessments[0]?.risk_level || 'none';
    api.post('/api/ai/tips', { riskLevel: latestRisk, symptoms: todaySymptoms })
      .then(d => { setTips(d.tips || []); setTipsLoading(false); })
      .catch(() => setTipsLoading(false));
  }, [user, assessments.length]);

  // Fetch AI Weekly Digest
  useEffect(() => {
    if (!user) return;
    setDigestLoading(true);
    api.post('/api/ai/weekly-digest', {})
      .then(d => { setWeeklyDigest(d); setDigestLoading(false); })
      .catch(() => setDigestLoading(false));
  }, [user]);

  // Fetch AI Risk Trend
  useEffect(() => {
    if (!user || assessments.length < 2) return;
    setTrendLoading(true);
    api.post('/api/ai/risk-trend', {})
      .then(d => { setRiskTrend(d); setTrendLoading(false); })
      .catch(() => setTrendLoading(false));
  }, [user, assessments.length]);

  // Auto-rotate tips
  useEffect(() => {
    if (tips.length <= 1) return;
    const interval = setInterval(() => setActiveTip(p => (p + 1) % tips.length), 5000);
    return () => clearInterval(interval);
  }, [tips.length]);

  // ─── Handlers ─────────────────────────────────
  const handleWater = async (action) => {
    const next = action === 'add' ? Math.min(waterGlasses + 1, 12) : Math.max(waterGlasses - 1, 0);
    setWaterGlasses(next);
    await api.post('/api/water', { glasses: next }).catch(() => {});
  };

  const handleSymptomToggle = async (symptomId) => {
    const updated = todaySymptoms.includes(symptomId)
      ? todaySymptoms.filter(s => s !== symptomId)
      : [...todaySymptoms, symptomId];
    setTodaySymptoms(updated);
    await api.post('/api/symptoms', { symptoms: updated, severity: updated.length }).catch(() => {});
  };

  const handleMood = async (moodId) => {
    setTodayMood(moodId);
    await api.post('/api/mood', { mood: moodId }).catch(() => {});
  };

  const handleLogPeriod = async () => {
    const today = new Date().toISOString().split('T')[0];
    const ongoing = cycleLogs.find(c => !c.end_date);
    if (ongoing) {
      await api.patch(`/api/cycle/${ongoing.id}`, { endDate: today });
      setCycleLogs(prev => prev.map(c => c.id === ongoing.id ? { ...c, end_date: today } : c));
    } else {
      const data = await api.post('/api/cycle', { startDate: today });
      setCycleLogs(prev => [data, ...prev]);
    }
  };

  // ─── Supplement handlers ──────────────────────────────
  const handleToggleSupp = async (supp) => {
    const next = !supp.takenToday;
    setSupplements(prev => prev.map(s => s.id === supp.id ? { ...s, takenToday: next } : s));
    await api.patch(`/api/supplements/${supp.id}/toggle`, { taken: next }).catch(() => {});
  };

  const handleAddSupp = async () => {
    if (!newSuppName.trim()) return;
    setAddingSupp(true);
    try {
      const data = await api.post('/api/supplements', { name: newSuppName.trim(), timing: newSuppTiming });
      setSupplements(prev => [...prev, data]);
      setNewSuppName('');
      setShowAddSupp(false);
    } catch {} finally { setAddingSupp(false); }
  };

  const handleDeleteSupp = async (id) => {
    setSupplements(prev => prev.filter(s => s.id !== id));
    await api.delete(`/api/supplements/${id}`).catch(() => {});
  };

  // ─── Food Scorer handlers ─────────────────────────────
  const handleFoodImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFoodScore(null);
    setFoodError('');
    setFoodPreview(URL.createObjectURL(file));

    // Compress image via canvas before base64 encoding (avoids 413)
    const img = new Image();
    img.onload = () => {
      const MAX = 800; // max dimension in px
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75); // JPEG, 75% quality
      setFoodMime('image/jpeg');
      setFoodImage(dataUrl.split(',')[1]); // base64 only
    };
    img.src = URL.createObjectURL(file);
  };

  const handleScoreFood = async () => {
    if (!foodImage) return;
    setFoodLoading(true);
    setFoodError('');
    try {
      const data = await api.post('/api/food-score', { imageBase64: foodImage, mimeType: foodMime, riskLevel });
      setFoodScore(data);
    } catch { setFoodError('Failed to analyse. Please try again.'); }
    finally { setFoodLoading(false); }
  };

  // ─── Computed values ──────────────────────────
  const latestAssessment = assessments[0];
  const healthScore = latestAssessment?.risk_score ?? null;
  const riskLevel = latestAssessment?.risk_level || 'none';
  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  const lastPeriod = cycleLogs[0];
  const daysSincePeriod = lastPeriod?.start_date
    ? Math.floor((Date.now() - new Date(lastPeriod.start_date).getTime()) / 86400000)
    : null;

  // Period prediction with accuracy
  const completedCycles = cycleLogs.filter(c => c.start_date && c.end_date);
  const cycleLengths = [];
  for (let i = 0; i < cycleLogs.length - 1; i++) {
    if (cycleLogs[i].start_date && cycleLogs[i + 1].start_date) {
      const days = Math.floor((new Date(cycleLogs[i].start_date) - new Date(cycleLogs[i + 1].start_date)) / 86400000);
      if (days > 15 && days < 60) cycleLengths.push(days);
    }
  }
  const avgCycleLength = cycleLengths.length > 0 ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length) : 28;
  const nextPeriodDays = daysSincePeriod !== null ? Math.max(0, avgCycleLength - daysSincePeriod) : null;
  const predictionAccuracy = cycleLengths.length >= 3 ? Math.min(95, 60 + cycleLengths.length * 5) : cycleLengths.length > 0 ? 40 + cycleLengths.length * 10 : null;
  const ongoingPeriod = cycleLogs.find(c => !c.end_date);

  // Health score color
  const scoreColor = healthScore === null ? 'text-muted-foreground'
    : healthScore <= 30 ? 'text-emerald-500'
    : healthScore <= 60 ? 'text-amber-500'
    : 'text-rose-500';
  const scoreRingColor = healthScore === null ? 'stroke-muted'
    : healthScore <= 30 ? 'stroke-emerald-500'
    : healthScore <= 60 ? 'stroke-amber-500'
    : 'stroke-rose-500';

  // Calendar helpers
  const calYear = calMonth.getFullYear();
  const calMon = calMonth.getMonth();
  const daysInMonth = new Date(calYear, calMon + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMon, 1).getDay();
  const calDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  const isPeriodDay = (day) => {
    if (!day) return false;
    const dateStr = `${calYear}-${String(calMon + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return cycleLogs.some(c => {
      const start = c.start_date;
      const end = c.end_date || new Date().toISOString().split('T')[0];
      return dateStr >= start && dateStr <= end;
    });
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && calMon === today.getMonth() && calYear === today.getFullYear();
  };

  // Symptom heatmap — last 30 days
  const heatmapDays = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split('T')[0];
    const log = symptomLogs.find(s => s.log_date === dateStr);
    const count = log?.symptoms?.length || 0;
    return { date: d, dateStr, count, day: d.getDate() };
  });



  if (loading) return (
    <div className="flex h-screen overflow-hidden bg-background gradient-mesh-bg">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="space-y-3 w-64">
          <div className="h-4 skeleton-shimmer rounded w-3/4 mx-auto" />
          <div className="h-4 skeleton-shimmer rounded w-full" />
          <div className="h-4 skeleton-shimmer rounded w-2/3 mx-auto" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background gradient-mesh-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full pb-24 md:pb-0">
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Hello {firstName} 👋</h1>
              <p className="text-sm text-muted-foreground mt-1">Here's your health overview for today</p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
          </div>

          {/* Quote Banner */}
          <QuoteBanner riskLevel={riskLevel} />



          {/* ═══ ROW 1: Health Score + Quick Stats ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-in">
            {/* Health Score Ring */}
            <Card className="glass-card card-hover">
              <CardContent className="pt-6 flex flex-col items-center">
                <div className="relative w-32 h-32 mb-3">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" strokeWidth="8" className="score-ring-bg" />
                    <circle
                      cx="60" cy="60" r="52" fill="none" strokeWidth="8"
                      className={`score-ring-fill ${scoreRingColor}`}
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 52}`}
                      strokeDashoffset={healthScore !== null ? `${2 * Math.PI * 52 * (1 - healthScore / 100)}` : `${2 * Math.PI * 52}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold count-up ${scoreColor}`}>{healthScore !== null ? healthScore : '—'}</span>
                    <span className="text-[10px] text-muted-foreground">Risk Score</span>
                  </div>
                </div>
                <p className="text-xs font-semibold capitalize">{riskLevel.replace('_', ' ')}</p>
                <p className="text-[10px] text-muted-foreground">Based on latest assessment</p>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="md:col-span-2 grid grid-cols-2 gap-3">
              <Card className="glass-card card-hover">
                <CardContent className="pt-5 pb-4 text-center">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center mx-auto mb-2">
                    <Calendar className="h-5 w-5 text-pink-500" />
                  </div>
                  <p className="text-2xl font-bold count-up">{daysSincePeriod !== null ? daysSincePeriod : '—'}</p>
                  <p className="text-[10px] text-muted-foreground">Days Since Period</p>
                </CardContent>
              </Card>
              <Card className="glass-card card-hover">
                <CardContent className="pt-5 pb-4 text-center">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mx-auto mb-2">
                    <Target className="h-5 w-5 text-violet-500" />
                  </div>
                  <p className="text-2xl font-bold count-up">{nextPeriodDays !== null ? `~${nextPeriodDays}` : '—'}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Days to Next Cycle
                    {predictionAccuracy && <span className="text-emerald-500 ml-1">({predictionAccuracy}% acc)</span>}
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-card card-hover">
                <CardContent className="pt-5 pb-4 text-center">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                    <FileText className="h-5 w-5 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold count-up">{assessments.length}</p>
                  <p className="text-[10px] text-muted-foreground">Assessments Done</p>
                </CardContent>
              </Card>
              <Card className="glass-card card-hover">
                <CardContent className="pt-5 pb-4 text-center">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
                    <Flame className="h-5 w-5 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold count-up">{symptomLogs.length}</p>
                  <p className="text-[10px] text-muted-foreground">Days Tracked</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ═══ ROW 2: Symptom Heatmap + AI Risk Trend ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Symptom Heatmap */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-rose-500" /> 30-Day Symptom Heatmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-10 gap-1">
                  {heatmapDays.map((d, i) => {
                    const intensity = d.count === 0 ? 'bg-muted' : d.count <= 2 ? 'bg-rose-200 dark:bg-rose-900/40' : d.count <= 4 ? 'bg-rose-400 dark:bg-rose-700' : 'bg-rose-600 dark:bg-rose-500';
                    return (
                      <div key={i} className="relative group">
                        <div className={`w-full aspect-square rounded-sm ${intensity} transition-all hover:scale-125 cursor-default`} />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                          {d.date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}: {d.count} symptoms
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <span>Less</span>
                    <div className="w-3 h-3 rounded-sm bg-muted" />
                    <div className="w-3 h-3 rounded-sm bg-rose-200 dark:bg-rose-900/40" />
                    <div className="w-3 h-3 rounded-sm bg-rose-400 dark:bg-rose-700" />
                    <div className="w-3 h-3 rounded-sm bg-rose-600 dark:bg-rose-500" />
                    <span>More</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">{symptomLogs.length} days logged</span>
                </div>
              </CardContent>
            </Card>

            {/* AI Risk Trend */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" /> AI Risk Trend
                  </CardTitle>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">AI ✨</span>
                </div>
              </CardHeader>
              <CardContent>
                {trendLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 skeleton-shimmer rounded w-3/4" />
                    <div className="h-3 skeleton-shimmer rounded w-full" />
                    <div className="h-3 skeleton-shimmer rounded w-2/3" />
                  </div>
                ) : riskTrend?.analysis ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {riskTrend.analysis.trend === 'improving' ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center"><TrendingDown className="h-4 w-4 text-emerald-500" /></div>
                      ) : riskTrend.analysis.trend === 'worsening' ? (
                        <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-rose-500" /></div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center"><BarChart3 className="h-4 w-4 text-blue-500" /></div>
                      )}
                      <div>
                        <p className="text-xs font-semibold capitalize">{riskTrend.analysis.trend}</p>
                        <p className="text-[10px] text-muted-foreground">{riskTrend.assessmentCount} assessments analyzed</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{riskTrend.analysis.summary}</p>
                    <div className="bg-primary/5 rounded-lg p-2.5">
                      <p className="text-xs font-medium text-primary">{riskTrend.analysis.celebration}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <BarChart3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Upload at least 2 reports to see your risk trend analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ═══ ROW 3: Cycle Calendar + Symptom Tracker ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cycle Tracker Calendar */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-500" /> Cycle Tracker
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCalMonth(new Date(calYear, calMon - 1))} className="p-1 rounded hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
                    <span className="text-xs font-medium w-24 text-center">{calMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                    <button onClick={() => setCalMonth(new Date(calYear, calMon + 1))} className="p-1 rounded hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <span key={d} className="text-[10px] font-semibold text-muted-foreground">{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calDays.map((day, i) => {
                    const period = isPeriodDay(day);
                    const td = isToday(day);
                    return (
                      <div
                        key={i}
                        className={`h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all
                          ${!day ? '' : period ? 'bg-pink-500 text-white shadow-sm' : td ? 'ring-2 ring-primary bg-primary/10 font-bold' : 'hover:bg-muted cursor-default'}
                        `}
                      >
                        {day || ''}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-pink-500" /> Period</span>
                    <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded ring-2 ring-primary" /> Today</span>
                  </div>
                  <Button size="sm" variant={ongoingPeriod ? 'destructive' : 'default'} className="h-7 text-xs" onClick={handleLogPeriod}>
                    {ongoingPeriod ? 'End Period' : 'Log Period Start'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Symptom Tracker */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-violet-500" /> Today's Symptoms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {SYMPTOMS.map(s => {
                    const active = todaySymptoms.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSymptomToggle(s.id)}
                        className={`flex flex-col items-center p-2.5 rounded-xl border transition-all duration-200 text-center
                          ${active
                            ? 'border-violet-500 bg-violet-500/10 shadow-sm scale-105'
                            : 'border-transparent bg-muted/50 hover:bg-muted hover:scale-102'
                          }
                        `}
                      >
                        <span className="text-lg mb-1">{s.emoji}</span>
                        <span className="text-[10px] font-medium leading-tight">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
                {todaySymptoms.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-3 text-center">
                    {todaySymptoms.length} symptom{todaySymptoms.length > 1 ? 's' : ''} logged today ✓
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ═══ ROW 4: Water + Mood + AI Tips ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Water Intake */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" /> Water Intake
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <button onClick={() => handleWater('remove')} className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-lg font-bold transition-transform active:scale-90">−</button>
                  <div className="text-center">
                    <span className="text-3xl font-bold text-blue-500 count-up">{waterGlasses}</span>
                    <span className="text-muted-foreground text-sm">/8</span>
                  </div>
                  <button onClick={() => handleWater('add')} className="w-8 h-8 rounded-full bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center text-lg font-bold transition-transform active:scale-90">+</button>
                </div>
                <div className="flex justify-center gap-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className={`w-5 h-8 rounded-md border transition-all duration-300 ${i < waterGlasses ? 'bg-blue-500/80 border-blue-500' : 'bg-muted border-border'}`}>
                      <div className={`w-full rounded-md water-fill ${i < waterGlasses ? 'h-full bg-blue-400/40' : 'h-0'}`} />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  {waterGlasses >= 8 ? '🎉 Goal reached!' : `${8 - waterGlasses} more to go`}
                </p>
              </CardContent>
            </Card>

            {/* Mood Journal */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Smile className="h-4 w-4 text-amber-500" /> How are you feeling?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-2 mb-3">
                  {MOODS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleMood(m.id)}
                      className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200
                        ${todayMood === m.id
                          ? `bg-gradient-to-br ${m.color} text-white shadow-md scale-110`
                          : 'hover:bg-muted hover:scale-105'
                        }
                      `}
                    >
                      <span className="text-xl">{m.emoji}</span>
                      <span className="text-[9px] font-medium mt-0.5">{m.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-center gap-1.5 mt-2">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const date = new Date(); date.setDate(date.getDate() - (6 - i));
                    const dateStr = date.toISOString().split('T')[0];
                    const log = moodLogs.find(m => m.log_date === dateStr);
                    const moodData = log ? MOODS.find(m => m.id === log.mood) : null;
                    return (
                      <div key={i} className="flex flex-col items-center gap-0.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${moodData ? `bg-gradient-to-br ${moodData.color} text-white` : 'bg-muted'}`}>
                          {moodData ? moodData.emoji : '·'}
                        </div>
                        <span className="text-[8px] text-muted-foreground">{date.toLocaleDateString('en', { weekday: 'narrow' })}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* AI Tips Carousel */}
            <Card className="glass-card overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-pink-500" /> AI Health Tips
                  </CardTitle>
                  <span className="text-[9px] bg-pink-500/10 text-pink-600 dark:text-pink-400 font-bold px-2 py-0.5 rounded-full">AI ✨</span>
                </div>
              </CardHeader>
              <CardContent>
                {tipsLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 skeleton-shimmer rounded w-3/4" />
                    <div className="h-3 skeleton-shimmer rounded w-full" />
                    <div className="h-3 skeleton-shimmer rounded w-2/3" />
                  </div>
                ) : tips.length > 0 ? (
                  <div className="relative min-h-[100px]">
                    <div className="fade-in" key={activeTip}>
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-lg flex-shrink-0">{tips[activeTip]?.emoji || '💡'}</span>
                        <div>
                          <p className="text-xs font-semibold">{tips[activeTip]?.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{tips[activeTip]?.tip}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center gap-1 mt-3">
                      {tips.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveTip(i)}
                          className={`h-1 rounded-full transition-all ${i === activeTip ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30'}`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Upload a report to get personalized tips!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ═══ ROW 5: AI Weekly Digest ═══ */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-violet-500" /> Weekly Health Digest
                </CardTitle>
                <span className="text-[9px] bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold px-2 py-0.5 rounded-full">AI ✨</span>
              </div>
            </CardHeader>
            <CardContent>
              {digestLoading ? (
                <div className="space-y-2">
                  <div className="h-4 skeleton-shimmer rounded w-full" />
                  <div className="h-3 skeleton-shimmer rounded w-3/4" />
                  <div className="h-3 skeleton-shimmer rounded w-1/2" />
                </div>
              ) : weeklyDigest?.summary ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{weeklyDigest.summary}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Highlights */}
                    {weeklyDigest.highlights?.length > 0 && (
                      <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/10">
                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Highlights</p>
                        <ul className="space-y-1">
                          {weeklyDigest.highlights.map((h, i) => (
                            <li key={i} className="text-[11px] text-muted-foreground">• {h}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Improvements */}
                    {weeklyDigest.improvements?.length > 0 && (
                      <div className="bg-amber-500/5 rounded-xl p-3 border border-amber-500/10">
                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> To Improve</p>
                        <ul className="space-y-1">
                          {weeklyDigest.improvements.map((h, i) => (
                            <li key={i} className="text-[11px] text-muted-foreground">• {h}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Tracking Score */}
                    <div className="bg-primary/5 rounded-xl p-3 border border-primary/10 flex flex-col items-center justify-center">
                      <p className="text-[10px] font-bold text-primary mb-1">Tracking Score</p>
                      <p className="text-3xl font-bold text-primary">{weeklyDigest.trackingScore || '—'}<span className="text-sm text-muted-foreground">/10</span></p>
                      <p className="text-[10px] text-muted-foreground mt-1">{weeklyDigest.encouragement}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Brain className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Start tracking daily to unlock your AI weekly digest!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ═══ ROW 6A: Supplement Tracker ═══ */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Pill className="h-4 w-4 text-violet-500" /> Supplement & Medication Tracker
                </CardTitle>
                <button
                  onClick={() => setShowAddSupp(v => !v)}
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 hover:bg-violet-200 transition-colors"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">Track your daily supplements — Inositol, Vitamin D, Spearmint & more</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Add supplement form */}
              {showAddSupp && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800">
                  <input
                    type="text" placeholder="Type supplement name..."
                    list="supp-suggestions"
                    value={newSuppName} onChange={e => setNewSuppName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddSupp()}
                    className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground/60"
                    autoFocus
                  />
                  <datalist id="supp-suggestions">
                    {PCOS_SUPPLEMENTS.map(s => <option key={s} value={s} />)}
                  </datalist>
                  <select
                    value={newSuppTiming} onChange={e => setNewSuppTiming(e.target.value)}
                    className="text-[10px] bg-white dark:bg-muted border rounded-lg px-1.5 py-1"
                  >
                    <option value="morning">Morning</option>
                    <option value="with_meal">With Meal</option>
                    <option value="evening">Evening</option>
                    <option value="bedtime">Bedtime</option>
                  </select>
                  <button onClick={handleAddSupp} disabled={addingSupp || !newSuppName.trim()}
                    className="text-[10px] font-bold px-3 py-1 rounded-lg bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 transition-colors">
                    {addingSupp ? '...' : 'Add'}
                  </button>
                  <button onClick={() => setShowAddSupp(false)} className="text-muted-foreground hover:text-foreground"><XIcon className="h-3.5 w-3.5" /></button>
                </div>
              )}

              {suppLoading ? (
                <div className="flex items-center gap-2 py-4">
                  <div className="w-4 h-4 rounded-full border-2 border-violet-300 border-t-violet-600 animate-spin" />
                  <p className="text-xs text-muted-foreground">Loading supplements...</p>
                </div>
              ) : supplements.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <Pill className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                  <p className="text-xs text-muted-foreground">No supplements added yet.</p>
                  <button onClick={() => setShowAddSupp(true)} className="text-xs text-violet-600 hover:underline">+ Add your first supplement</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {supplements.map(s => {
                    const timingLabels = { morning: '🌅 Morning', with_meal: '🍽️ With Meal', evening: '🌇 Evening', bedtime: '🌙 Bedtime' };
                    return (
                      <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                        s.takenToday ? 'border-violet-300 bg-violet-50/60 dark:border-violet-700 dark:bg-violet-950/20' : 'border-border hover:bg-muted/30'
                      }`}>
                        {/* Checkbox */}
                        <button
                          onClick={() => handleToggleSupp(s)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                            s.takenToday
                              ? 'bg-violet-500 text-white shadow-sm scale-110'
                              : 'border-2 border-muted-foreground/30 hover:border-violet-400'
                          }`}
                        >
                          {s.takenToday && <CheckCircle2 className="h-4 w-4" />}
                        </button>

                        {/* Name + hint */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium leading-tight ${s.takenToday ? 'line-through text-muted-foreground' : ''}`}>{s.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-muted-foreground">{timingLabels[s.timing] || s.timing}</span>
                            {s.hint?.hint && <span className="text-[9px] bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full">{s.hint.hint}</span>}
                          </div>
                        </div>

                        {/* Delete */}
                        <button onClick={() => handleDeleteSupp(s.id)} className="text-muted-foreground/40 hover:text-rose-500 transition-colors flex-shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                  <p className="text-[10px] text-muted-foreground text-center pt-1">
                    {supplements.filter(s => s.takenToday).length}/{supplements.length} taken today
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ═══ ROW 6B: Food PCOS Scorer ═══ */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Camera className="h-4 w-4 text-emerald-500" /> Food PCOS Scorer
                </CardTitle>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">AI ✨ Vision</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Photo your meal → AI rates it 0–100 for PCOS-friendliness → get a swap tip</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Upload area */}
                <div className="sm:w-48 flex-shrink-0">
                  <label htmlFor="food-upload" className={`flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                    foodPreview ? 'border-transparent p-0 overflow-hidden' : 'border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                  }`}>
                    {foodPreview ? (
                      <img src={foodPreview} alt="Meal preview" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center p-4">
                        <Camera className="h-8 w-8 text-emerald-400" />
                        <p className="text-xs text-muted-foreground">Click to upload meal photo</p>
                        <p className="text-[9px] text-muted-foreground/60">JPG, PNG, WEBP</p>
                      </div>
                    )}
                  </label>
                  <input id="food-upload" type="file" accept="image/*" className="hidden" onChange={handleFoodImage} />
                  {foodPreview && (
                    <button
                      onClick={handleScoreFood}
                      disabled={foodLoading || !foodImage}
                      className="mt-2 w-full py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-sm disabled:opacity-50 transition-all"
                    >
                      {foodLoading ? 'Analysing...' : '✨ Score My Meal'}
                    </button>
                  )}
                </div>

                {/* Results */}
                <div className="flex-1">
                  {!foodPreview && (
                    <div className="flex flex-col items-center justify-center h-36 text-center gap-2">
                      <span className="text-4xl">🥗</span>
                      <p className="text-xs text-muted-foreground">Upload a photo of your meal to get your PCOS score</p>
                    </div>
                  )}
                  {foodLoading && (
                    <div className="flex flex-col items-center justify-center h-36 gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-emerald-300 border-t-emerald-600 animate-spin" />
                      <p className="text-xs text-muted-foreground">AI is identifying your food...</p>
                    </div>
                  )}
                  {foodError && <p className="text-xs text-rose-500 mt-4">{foodError}</p>}
                  {foodScore && !foodLoading && (
                    <div className="space-y-3">
                      {/* Score meter */}
                      <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                            <circle cx="40" cy="40" r="32" fill="none" strokeWidth="7" className="stroke-muted" />
                            <circle cx="40" cy="40" r="32" fill="none" strokeWidth="7"
                              strokeLinecap="round"
                              strokeDasharray={`${2 * Math.PI * 32}`}
                              strokeDashoffset={foodScore.score !== null ? `${2 * Math.PI * 32 * (1 - foodScore.score / 100)}` : `${2 * Math.PI * 32}`}
                              className={foodScore.score >= 70 ? 'stroke-emerald-500' : foodScore.score >= 40 ? 'stroke-amber-500' : 'stroke-rose-500'}
                              style={{ transition: 'stroke-dashoffset 1s ease' }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-lg font-bold ${foodScore.score >= 70 ? 'text-emerald-600' : foodScore.score >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {foodScore.score ?? '?'}
                            </span>
                            <span className="text-[8px] text-muted-foreground">/ 100</span>
                          </div>
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${foodScore.score >= 70 ? 'text-emerald-600' : foodScore.score >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {foodScore.verdict}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{foodScore.message}</p>
                          {foodScore.swapTip && (
                            <p className="text-[10px] mt-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-lg">
                              🔄 <span className="font-semibold">Swap:</span> {foodScore.swapTip}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Foods detected */}
                      {foodScore.foods?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {foodScore.positives?.map((p, i) => (
                            <span key={i} className="text-[9px] bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">✓ {p.split(' —')[0].split(':')[0]}</span>
                          ))}
                          {foodScore.negatives?.map((n, i) => (
                            <span key={i} className="text-[9px] bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full">✗ {n.split(' —')[0].split(':')[0]}</span>
                          ))}
                        </div>
                      )}

                      <button onClick={() => { setFoodPreview(null); setFoodImage(null); setFoodScore(null); }} className="text-[10px] text-muted-foreground hover:text-foreground">
                        ↺ Try another meal
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ═══ ROW 7: Recent Assessments ═══ */}
          {assessments.length > 0 && (
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Recent Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {assessments.slice(0, 3).map((a) => (
                    <Link key={a.id} to={`/results/${a.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-8 rounded-full ${a.risk_level === 'pcos_positive' ? 'bg-rose-500' : a.risk_level === 'at_risk' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        <div>
                          <p className="text-sm font-medium group-hover:text-primary transition-colors">Assessment — {new Date(a.created_at).toLocaleDateString()}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{a.risk_level?.replace('_', ' ')} • Score: {a.risk_score}/100</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
}
