import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  ShieldAlert, AlertTriangle, ShieldCheck, Download, Bookmark, BookmarkCheck,
  MapPin, ExternalLink, ChevronDown, ChevronUp, Stethoscope, FlaskConical, X, Loader2, TrendingUp,
  Brain, RefreshCw, Sparkles, ArrowRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';

// ══════════════════════════════════════════════════════════════════════
// Inline Doctor/Lab Search Panel
// ══════════════════════════════════════════════════════════════════════
function DoctorSearchPanel({ type, riskLevel, onClose }) {
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isLab = type === 'lab';

  const getSearchQuery = () => {
    if (isLab) return 'pathology+lab+blood+test+near+me';
    if (riskLevel === 'pcos_positive') return 'best+PCOS+specialist+gynecologist+near+me';
    if (riskLevel === 'at_risk') return 'gynecologist+endocrinologist+near+me';
    return 'gynecologist+women+health+near+me';
  };

  const getSeverityMessage = () => {
    if (isLab) {
      return {
        title: 'Nearby Pathology Labs & Sample Collection',
        subtitle: 'Get your hormone levels tested — LH, FSH, AMH, Testosterone, Fasting Insulin',
        urgency: riskLevel === 'pcos_positive' ? 'Urgent testing recommended' : 'Recommended for screening',
        urgencyColor: riskLevel === 'pcos_positive' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }
    if (riskLevel === 'pcos_positive') {
      return { title: 'PCOS Specialist Consultation — Urgent', subtitle: 'Based on your results, we strongly recommend consulting a PCOS specialist immediately', urgency: 'High priority — book within this week', urgencyColor: 'bg-red-100 text-red-700 border-red-200' };
    }
    if (riskLevel === 'at_risk') {
      return { title: 'Gynecologist / Endocrinologist Consultation', subtitle: 'Your screening shows some risk indicators. A specialist visit can help with early intervention', urgency: 'Moderate priority — schedule within 2 weeks', urgencyColor: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { title: 'Routine Gynecologist Check-Up', subtitle: 'Maintain your health with regular screening visits', urgency: 'Routine — annual checkup recommended', urgencyColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  useEffect(() => {
    if (!navigator.geolocation) { setError('Geolocation not supported.'); setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12`);
          const data = await res.json();
          setLocationName(data.address?.city || data.address?.town || data.address?.state_district || 'your area');
        } catch { setLocationName('your area'); }
        setLoading(false);
      },
      () => { setError('Location access denied.'); setLoading(false); },
      { timeout: 10000 }
    );
  }, []);

  const searchQuery = getSearchQuery();
  const severity = getSeverityMessage();
  const getEmbedUrl = () => location ? `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${searchQuery}&center=${location.lat},${location.lng}&zoom=14` : null;
  const getGoogleMapsUrl = () => location ? `https://www.google.com/maps/search/${searchQuery}/@${location.lat},${location.lng},14z` : `https://www.google.com/maps/search/${searchQuery}`;

  const onlineLabLinks = [
    { name: 'Thyrocare', url: 'https://www.thyrocare.com/', desc: 'Affordable hormone panel tests with home sample collection' },
    { name: 'Practo', url: 'https://www.practo.com/tests', desc: 'Book lab tests online with free home sample pickup' },
    { name: '1mg Labs', url: 'https://www.1mg.com/labs', desc: 'PCOS hormone profile packages with doorstep collection' },
  ];

  return (
    <div className="mt-4 border-2 border-primary/20 rounded-xl overflow-hidden bg-white shadow-lg animate-in slide-in-from-top-2 duration-300">
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isLab ? <FlaskConical className="h-5 w-5" /> : <Stethoscope className="h-5 w-5" />}
            <div>
              <h3 className="font-bold text-sm">{severity.title}</h3>
              <p className="text-white/80 text-xs mt-0.5">{severity.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="px-4 pt-3">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${severity.urgencyColor}`}>⚡ {severity.urgency}</span>
      </div>
      <div className="px-4 pt-3 pb-2">
        {locationName && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Showing results near <span className="font-medium text-foreground">{locationName}</span>
          </p>
        )}
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12 px-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-3" />
          <span className="text-sm text-muted-foreground">Detecting your location...</span>
        </div>
      ) : error ? (
        <div className="py-8 px-4 text-center"><p className="text-sm text-muted-foreground">{error}</p></div>
      ) : (
        <div className="px-4 pb-4 space-y-3">
          <div className="rounded-lg overflow-hidden border">
            <iframe title={isLab ? "Nearby Labs" : "Nearby Doctors"} src={getEmbedUrl()} width="100%" height="350" style={{ border: 0 }} allowFullScreen loading="lazy" className="rounded-lg" />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button size="sm" className="flex-1" onClick={() => window.open(getGoogleMapsUrl(), '_blank')}>
              <ExternalLink className="mr-2 h-3.5 w-3.5" /> {isLab ? 'View All Labs on Google Maps' : 'View All Doctors on Google Maps'}
            </Button>
            {!isLab && riskLevel === 'pcos_positive' && (
              <Button size="sm" variant="outline" className="flex-1" onClick={() => window.open(location ? `https://www.google.com/maps/search/endocrinologist+hormone+specialist+near+me/@${location.lat},${location.lng},14z` : `https://www.google.com/maps/search/endocrinologist+hormone+specialist+near+me`, '_blank')}>
                <ExternalLink className="mr-2 h-3.5 w-3.5" /> Also Find Endocrinologists
              </Button>
            )}
          </div>
          {isLab && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Online Sample Collection Services</p>
              <div className="space-y-2">
                {onlineLabLinks.map((lab) => (
                  <a key={lab.name} href={lab.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/30 hover:bg-primary/5 transition-colors group">
                    <div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">{lab.name}</p>
                      <p className="text-xs text-muted-foreground">{lab.desc}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0 ml-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground text-center pt-2">Click on map pins to see doctor names, ratings, reviews & directions</p>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// CSS Stick Figure Animations for common exercises
// ══════════════════════════════════════════════════════════════════════
const STICK_FIGURE_MAP = {
  squat: 'squat', 'body weight squat': 'squat', 'chair squat': 'squat',
  plank: 'plank', 'forearm plank': 'plank', 'side plank': 'plank',
  walk: 'walk', 'brisk walk': 'walk', 'walking': 'walk', 'treadmill': 'walk',
  yoga: 'yoga', 'cat cow': 'yoga', 'child pose': 'yoga', 'cobra': 'yoga', 'downward dog': 'yoga', 'sun salutation': 'yoga',
  breathe: 'breathe', 'deep breath': 'breathe', 'breathing': 'breathe', 'pranayama': 'breathe', 'anulom': 'breathe',
  stretch: 'stretch', 'hamstring stretch': 'stretch', 'hip stretch': 'stretch', 'cool down': 'stretch',
};

function getStickType(name) {
  const lower = (name || '').toLowerCase();
  for (const [key, val] of Object.entries(STICK_FIGURE_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

function StickFigureAnim({ type }) {
  const base = 'stroke-current text-violet-500';
  const figures = {
    squat: (
      <svg viewBox="0 0 80 100" className="w-full h-full" fill="none" strokeWidth="3" strokeLinecap="round">
        <style>{`@keyframes squat{0%,100%{transform:translateY(0)}50%{transform:translateY(10px)}} .sq{animation:squat 1.2s ease-in-out infinite;transform-origin:50% 60%}`}</style>
        <g className={`sq ${base}`}>
          <circle cx="40" cy="14" r="8" />
          <line x1="40" y1="22" x2="40" y2="52" />
          <line x1="40" y1="30" x2="20" y2="45" />
          <line x1="40" y1="30" x2="60" y2="45" />
          <line x1="40" y1="52" x2="26" y2="75" />
          <line x1="40" y1="52" x2="54" y2="75" />
          <line x1="26" y1="75" x2="20" y2="90" />
          <line x1="54" y1="75" x2="60" y2="90" />
        </g>
      </svg>
    ),
    plank: (
      <svg viewBox="0 0 100 60" className="w-full h-full" fill="none" strokeWidth="3" strokeLinecap="round">
        <style>{`@keyframes plankpulse{0%,100%{opacity:1}50%{opacity:.6}} .pl{animation:plankpulse 2s ease-in-out infinite}`}</style>
        <g className={`pl ${base}`}>
          <circle cx="82" cy="20" r="7" />
          <line x1="75" y1="26" x2="15" y2="40" />
          <line x1="62" y1="29" x2="68" y2="48" />
          <line x1="50" y1="32" x2="56" y2="50" />
          <line x1="15" y1="40" x2="12" y2="52" />
          <line x1="20" y1="42" x2="18" y2="54" />
        </g>
      </svg>
    ),
    walk: (
      <svg viewBox="0 0 80 100" className="w-full h-full" fill="none" strokeWidth="3" strokeLinecap="round">
        <style>{`@keyframes walkleg{0%,100%{transform:rotate(-20deg)}50%{transform:rotate(20deg)}} @keyframes walkarm{0%,100%{transform:rotate(20deg)}50%{transform:rotate(-20deg)}} .wl{animation:walkleg 0.8s ease-in-out infinite;transform-origin:40px 52px} .wa{animation:walkarm 0.8s ease-in-out infinite;transform-origin:40px 32px}`}</style>
        <g className={base}>
          <circle cx="40" cy="13" r="8" />
          <line x1="40" y1="21" x2="40" y2="52" />
          <g className="wl"><line x1="40" y1="52" x2="25" y2="75" /><line x1="25" y1="75" x2="18" y2="90" /></g>
          <line x1="40" y1="52" x2="55" y2="75" /><line x1="55" y1="75" x2="62" y2="90" />
          <g className="wa"><line x1="40" y1="30" x2="20" y2="46" /></g>
          <line x1="40" y1="30" x2="60" y2="46" />
        </g>
      </svg>
    ),
    yoga: (
      <svg viewBox="0 0 100 80" className="w-full h-full" fill="none" strokeWidth="3" strokeLinecap="round">
        <style>{`@keyframes yogawave{0%,100%{transform:scaleY(1)}50%{transform:scaleY(0.92)}} .yg{animation:yogawave 2.5s ease-in-out infinite;transform-origin:50% 50%}`}</style>
        <g className={`yg ${base}`}>
          <circle cx="50" cy="14" r="7" />
          <line x1="50" y1="21" x2="50" y2="50" />
          <line x1="50" y1="32" x2="20" y2="22" />
          <line x1="50" y1="32" x2="80" y2="22" />
          <line x1="50" y1="50" x2="28" y2="65" />
          <line x1="50" y1="50" x2="72" y2="65" />
          <line x1="28" y1="65" x2="28" y2="75" />
          <line x1="72" y1="65" x2="72" y2="75" />
        </g>
      </svg>
    ),
    breathe: (
      <svg viewBox="0 0 80 100" className="w-full h-full" fill="none" strokeWidth="3" strokeLinecap="round">
        <style>{`@keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}} .br{animation:breathe 3s ease-in-out infinite;transform-origin:40px 50px}`}</style>
        <g className={`br ${base}`}>
          <circle cx="40" cy="13" r="8" />
          <line x1="40" y1="21" x2="40" y2="55" />
          <line x1="40" y1="32" x2="18" y2="48" />
          <line x1="40" y1="32" x2="62" y2="48" />
          <line x1="40" y1="55" x2="28" y2="78" />
          <line x1="40" y1="55" x2="52" y2="78" />
          <line x1="28" y1="78" x2="24" y2="92" />
          <line x1="52" y1="78" x2="56" y2="92" />
          <ellipse cx="40" cy="38" rx="10" ry="7" strokeDasharray="4 3" opacity="0.4" />
        </g>
      </svg>
    ),
    stretch: (
      <svg viewBox="0 0 100 80" className="w-full h-full" fill="none" strokeWidth="3" strokeLinecap="round">
        <style>{`@keyframes stretcharm{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-18deg)}} .st{animation:stretcharm 2s ease-in-out infinite;transform-origin:50px 30px}`}</style>
        <g className={base}>
          <circle cx="50" cy="13" r="7" />
          <line x1="50" y1="20" x2="50" y2="48" />
          <g className="st"><line x1="50" y1="30" x2="18" y2="24" /></g>
          <line x1="50" y1="30" x2="82" y2="24" />
          <line x1="50" y1="48" x2="30" y2="70" />
          <line x1="50" y1="48" x2="70" y2="70" />
          <line x1="30" y1="70" x2="22" y2="78" />
          <line x1="70" y1="70" x2="78" y2="78" />
        </g>
      </svg>
    ),
  };
  return figures[type] || null;
}

// ──────────────────────────────────────────────────────────────────────
// Exercise preview panel — stick figure animation + YouTube search link
// ──────────────────────────────────────────────────────────────────────
const EXERCISE_TIPS = {
  squat: ['Keep knees behind your toes', 'Chest up, back straight', 'Lower until thighs are parallel', 'Push through heels to rise'],
  plank: ['Body in a straight line', 'Core tight — do not sag hips', 'Breathe steadily throughout', 'Gaze slightly forward'],
  walk: ['Arms relaxed at your sides', 'Land heel first, roll to toe', 'Maintain a steady brisk pace', 'Great for insulin sensitivity'],
  yoga: ['Move slowly with each breath', 'Never force a deep stretch', 'Hold each pose 5–10 breaths', 'Calms hormones and cortisol'],
  breathe: ['Inhale 4 counts, hold 4, exhale 6', 'Breathe into belly not chest', 'Reduces cortisol significantly', 'Best done on an empty stomach'],
  stretch: ['Hold each stretch 20–30 seconds', 'Never bounce in a stretch', 'Breathe out as you deepen it', 'Best performed after warm-up'],
};

function ExerciseVideoPanel({ exerciseName, onClose }) {
  const [videoId, setVideoId] = useState(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);

  const stickType = getStickType(exerciseName);
  const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exerciseName} exercise tutorial for women beginners PCOS`)}`;

  useEffect(() => {
    setVideoLoading(true);
    setVideoError(false);
    setVideoId(null);
    fetch(`http://localhost:3001/api/exercise-video?q=${encodeURIComponent(exerciseName)}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { if (data.videoId) setVideoId(data.videoId); else setVideoError(true); })
      .catch(() => setVideoError(true))
      .finally(() => setVideoLoading(false));
  }, [exerciseName]);

  return (
    <div className="mt-2 rounded-xl overflow-hidden border-2 border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:from-violet-950/30 dark:via-purple-950/20 dark:to-indigo-950/20 animate-in slide-in-from-top-2 fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white">
        <div className="flex items-center gap-2">
          <span className="text-sm">▶</span>
          <p className="text-xs font-bold">How to: {exerciseName}</p>
          {videoLoading && <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full animate-pulse">Finding video...</span>}
          {videoId && !videoLoading && <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full">▶ Video ready</span>}
        </div>
        <button onClick={onClose} className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xs transition-colors">✕</button>
      </div>

      {/* Main content — two panels side by side */}
      <div className="flex flex-col sm:flex-row">

        {/* Left: Stick figure animation */}
        {stickType && (
          <div className="sm:w-44 flex-shrink-0 flex flex-col items-center justify-center py-5 px-4 bg-white/70 dark:bg-white/5 border-b sm:border-b-0 sm:border-r border-violet-100 dark:border-violet-800">
            <div className="w-28 h-28">
              <StickFigureAnim type={stickType} />
            </div>
            <p className="text-[9px] text-violet-600 dark:text-violet-400 font-bold uppercase tracking-widest mt-2 text-center">Live Animation</p>
            {/* Form tips */}
            {EXERCISE_TIPS[stickType] && (
              <ul className="mt-3 space-y-1 w-full">
                {EXERCISE_TIPS[stickType].map((tip, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[10px] text-foreground/70">
                    <span className="text-violet-400 font-bold flex-shrink-0">✓</span>{tip}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Right: Embedded YouTube video */}
        <div className="flex-1 flex flex-col">
          {videoLoading && (
            <div className="flex-1 flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-violet-300 border-t-violet-600 animate-spin" />
              <p className="text-xs text-muted-foreground">Finding best video for "{exerciseName}"...</p>
            </div>
          )}

          {!videoLoading && videoId && (
            <>
              <iframe
                title={`${exerciseName} tutorial`}
                src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0`}
                width="100%"
                height="240"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
              <div className="px-3 py-2 flex items-center justify-between bg-white/40 dark:bg-black/20">
                <p className="text-[10px] text-muted-foreground">💡 Check proper form before starting</p>
                <a href={ytSearchUrl} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] font-semibold text-violet-600 hover:text-violet-800 dark:text-violet-400 transition-colors">
                  More videos ↗
                </a>
              </div>
            </>
          )}

          {!videoLoading && videoError && (
            <div className="flex-1 flex flex-col items-center justify-center p-5 gap-3">
              <p className="text-xs text-muted-foreground text-center">Couldn't load inline video. Watch directly on YouTube:</p>
              <a href={ytSearchUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-xs font-bold shadow-md transition-all">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1C4.5 20.4 12 20.4 12 20.4s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z" />
                </svg>
                Watch on YouTube ↗
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Exercise Plan Card — wraps sections + per-exercise Watch button state
// ──────────────────────────────────────────────────────────────────────
function ExercisePlanCard({ plan, riskColor, intensityColor }) {
  const [openVideoKey, setOpenVideoKey] = useState(null); // "sectionIdx-exIdx"

  const toggleVideo = (key) => setOpenVideoKey(prev => prev === key ? null : key);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className={`text-lg ${riskColor}`}>{plan.label}</CardTitle>
          <span className="text-[9px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            ▶ Tap any exercise to watch tutorial
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{plan.tagline}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {(plan.sections || []).map((section, si) => (
          <div key={section.category}>
            <h4 className="font-bold text-sm mb-3 pb-2 border-b">{section.category}</h4>
            <div className="space-y-2">
              {(section.exercises || []).map((ex, ei) => {
                const key = `${si}-${ei}`;
                const isOpen = openVideoKey === key;
                return (
                  <div key={ei}>
                    <div
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer
                        ${isOpen
                          ? 'border-violet-300 bg-violet-50/60 dark:border-violet-700 dark:bg-violet-950/20 shadow-sm'
                          : 'hover:bg-muted/30 hover:border-violet-200'
                        }`}
                      onClick={() => toggleVideo(key)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{ei + 1}</span>
                        <div>
                          <p className="font-medium text-sm">{ex.name}</p>
                          <p className="text-xs text-muted-foreground">{ex.detail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${intensityColor(ex.intensity)}`}>{ex.intensity}</span>
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all duration-200 flex items-center gap-1
                          ${isOpen
                            ? 'bg-violet-500 text-white border-violet-500'
                            : 'bg-white dark:bg-muted text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-700 hover:bg-violet-50'
                          }`}>
                          {isOpen ? '✕ Hide' : '▶ Watch'}
                        </span>
                      </div>
                    </div>
                    {isOpen && (
                      <ExerciseVideoPanel
                        exerciseName={ex.name}
                        category={section.category}
                        onClose={() => setOpenVideoKey(null)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div className="p-4 border-t bg-muted/30 rounded-b-lg -mx-6 -mb-6">
          <p className="text-[11px] text-muted-foreground text-center">
            {plan.tips || '🏋️ Always warm up before exercising • Listen to your body'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════
// AI-POWERED WELLNESS PLAN — Personalized Diet + Exercise
// ══════════════════════════════════════════════════════════════════════
function DietPrefSlider({ value, onChange, disabled }) {
  const isVeg = value === 'veg';
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Your Dietary Preference</p>
      <div
        role="switch"
        aria-checked={!isVeg}
        onClick={() => !disabled && onChange(isVeg ? 'nonveg' : 'veg')}
        className={`relative flex items-center w-52 h-11 rounded-full cursor-pointer select-none transition-all duration-300 shadow-inner border-2 ${
          isVeg
            ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-700'
            : 'bg-orange-50 border-orange-300 dark:bg-orange-950/30 dark:border-orange-700'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md'}`}
      >
        {/* Gliding pill */}
        <span
          className={`absolute top-1 h-8 w-[calc(50%-4px)] rounded-full shadow-md flex items-center justify-center gap-1 text-white text-xs font-bold transition-all duration-300 ease-in-out ${
            isVeg
              ? 'left-1 bg-gradient-to-r from-emerald-500 to-green-500'
              : 'left-[calc(50%+3px)] bg-gradient-to-r from-orange-500 to-amber-500'
          }`}
        >
          <span className="text-sm">{isVeg ? '🥦' : '🍗'}</span>
          <span>{isVeg ? 'Veg' : 'Non-Veg'}</span>
        </span>
        {/* Labels */}
        <span className={`flex-1 text-center text-xs font-semibold transition-colors duration-200 ${isVeg ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`}>🥦 Veg</span>
        <span className={`flex-1 text-center text-xs font-semibold transition-colors duration-200 ${!isVeg ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`}>🍗 Non-Veg</span>
      </div>
      <p className="text-[10px] text-muted-foreground">
        {isVeg ? 'Plan will be 100% vegetarian — no meat, fish or eggs' : 'Plan may include chicken, fish & eggs (no red meat)'}
      </p>
    </div>
  );
}

function WellnessPlanSection({ riskLevel, riskScore, parsedValues, aiSummary, profile }) {
  const [activeTab, setActiveTab] = useState('diet');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);
  const [dietPref, setDietPref] = useState('veg');
  const [planPref, setPlanPref] = useState('veg'); // the pref used for the currently shown plan

  const fetchPlan = async (prefOverride) => {
    const pref = prefOverride ?? dietPref;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:3001/api/wellness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riskLevel, riskScore, parsedValues, aiSummary, profile, dietaryPreference: pref }),
      });
      if (!res.ok) throw new Error('Failed to generate plan');
      const data = await res.json();
      setPlan(data);
      setPlanPref(pref);
      setGenerated(true);
    } catch (err) {
      console.error('Wellness plan error:', err);
      setError('Failed to generate your wellness plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!generated && !loading) fetchPlan('veg');
  }, []);

  const intensityColor = (i) => {
    const l = (i || '').toLowerCase();
    if (l === 'high') return 'bg-red-100 text-red-700';
    if (l === 'moderate') return 'bg-amber-100 text-amber-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  const riskColor = riskLevel === 'pcos_positive' ? 'text-rose-600' : riskLevel === 'at_risk' ? 'text-amber-600' : 'text-emerald-600';

  // Check if the user has changed pref since last generation
  const prefChanged = generated && dietPref !== planPref;

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">Your Wellness Plan</h2>
        <span className="text-[10px] bg-violet-100 text-violet-700 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">✨ AI-Personalized</span>
      </div>
      <p className="text-muted-foreground text-sm mb-6">Generated by AI based on your specific hormone levels, BMI, and screening results</p>

      {/* ── Veg / Non-Veg Slider ── */}
      {!loading && (
        <div className={`mb-6 p-5 rounded-2xl border-2 transition-all duration-300 ${
          dietPref === 'veg'
            ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/20'
            : 'border-orange-200 bg-orange-50/60 dark:border-orange-800 dark:bg-orange-950/20'
        }`}>
          <DietPrefSlider value={dietPref} onChange={setDietPref} disabled={loading} />
          {prefChanged && (
            <div className="mt-4 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ You changed your preference — regenerate to apply it
              </p>
              <Button
                size="sm"
                onClick={() => fetchPlan(dietPref)}
                disabled={loading}
                className={`${dietPref === 'nonveg' ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600' : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600'} text-white border-0`}
              >
                {dietPref === 'veg' ? '🥦' : '🍗'} Regenerate as {dietPref === 'veg' ? 'Vegetarian' : 'Non-Veg'}
              </Button>
            </div>
          )}
        </div>
      )}

      {loading && (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center animate-pulse">
              <span className="text-xl">🧠</span>
            </div>
            <div>
              <p className="font-semibold text-sm">Generating your personalized plan...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Creating a {dietPref === 'veg' ? '🥦 vegetarian' : '🍗 non-veg'} plan based on your hormone levels & BMI
              </p>
            </div>
            <div className="flex gap-1 mt-2">
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </CardContent>
        </Card>
      )}

      {error && !loading && (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-destructive text-sm">{error}</p>
            <Button onClick={() => fetchPlan(dietPref)} variant="outline" size="sm">🔄 Try Again</Button>
          </CardContent>
        </Card>
      )}

      {plan && !loading && (
        <>
          <div className="flex gap-2 mb-6">
            <button onClick={() => setActiveTab('diet')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${activeTab === 'diet' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              🥗 Diet Planner
              <span className={`ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${planPref === 'veg' ? 'bg-emerald-200 text-emerald-800' : 'bg-orange-200 text-orange-800'} ${activeTab === 'diet' ? 'bg-white/20 text-white' : ''}`}>
                {planPref === 'veg' ? '🥦 Veg' : '🍗 Non-Veg'}
              </span>
            </button>
            <button onClick={() => setActiveTab('exercise')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${activeTab === 'exercise' ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              🏋️ Exercise Plan
            </button>
          </div>

          {activeTab === 'diet' && plan.diet && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className={`text-lg ${riskColor}`}>{plan.diet.label}</CardTitle>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    planPref === 'veg'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-orange-50 text-orange-700 border-orange-300'
                  }`}>
                    {planPref === 'veg' ? '🥦 Vegetarian Plan' : '🍗 Non-Veg Plan'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{plan.diet.tagline}</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-[90px]">Day</th>
                        <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Breakfast</th>
                        <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Snack</th>
                        <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Lunch</th>
                        <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Eve Snack</th>
                        <th className="text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Dinner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(plan.diet.meals || []).map((meal, i) => (
                        <tr key={meal.day || i} className={`border-t ${i % 2 === 0 ? 'bg-card' : 'bg-muted/20'} hover:bg-primary/5 transition-colors`}>
                          <td className="p-3 font-bold text-primary text-xs">{meal.day}</td>
                          <td className="p-3 text-xs">{meal.breakfast}</td>
                          <td className="p-3 text-xs text-muted-foreground">{meal.snack1}</td>
                          <td className="p-3 text-xs">{meal.lunch}</td>
                          <td className="p-3 text-xs text-muted-foreground">{meal.snack2}</td>
                          <td className="p-3 text-xs">{meal.dinner}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t bg-muted/30">
                  <p className="text-[11px] text-muted-foreground text-center">
                    {plan.diet.tips || '💧 Drink 8–10 glasses of water daily • Consult a nutritionist for adjustments'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'exercise' && plan.exercise && (
            <ExercisePlanCard plan={plan.exercise} riskColor={riskColor} intensityColor={intensityColor} />
          )}

          <div className="flex justify-center mt-4">
            <Button variant="outline" size="sm" onClick={() => fetchPlan(dietPref)} disabled={loading}>🔄 Regenerate Plan</Button>
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Helper — detect clickable medical recommendations
// ══════════════════════════════════════════════════════════════════════
function getRecActionType(title) {
  const lower = (title || '').toLowerCase();
  if (lower.includes('consult') || lower.includes('gynecol') || lower.includes('endocrin') || lower.includes('specialist') || lower.includes('doctor') || lower.includes('appointment')) return 'doctor';
  if (lower.includes('hormon') || lower.includes('testing') || lower.includes('blood') || lower.includes('lab') || lower.includes('test')) return 'lab';
  return null;
}

// ══════════════════════════════════════════════════════════════════════
// Doctor Appointment Prep — AI-generated personalised questions
// ══════════════════════════════════════════════════════════════════════
const CATEGORY_COLORS = {
  Hormones: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  Insulin: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Fertility: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  Lifestyle: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Medication: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  'Follow-up': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
};

function DoctorPrepCard({ riskLevel, parsedValues, aiSummary }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (result) { setOpen(true); return; }
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/ai/doctor-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riskLevel, parsedValues, aiSummary }),
      });
      const data = await res.json();
      setResult(data);
    } catch { setResult({ questions: [], appointmentTip: 'Could not generate questions. Please try again.' }); }
    finally { setLoading(false); }
  };

  const handleCopy = () => {
    if (!result?.questions) return;
    const text = result.questions.map((q, i) => `${i + 1}. [${q.category}] ${q.question}\n   Why: ${q.why}`).join('\n\n');
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <Card className="glass-card border-indigo-200/50 dark:border-indigo-800/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="text-xl">🩺</span> Doctor Appointment Prep
          </CardTitle>
          <span className="text-[9px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full">AI ✨</span>
        </div>
        <p className="text-xs text-muted-foreground">AI generates personalised questions for your doctor based on YOUR hormone values — not generic advice.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {!open ? (
          <button
            onClick={generate}
            className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xl">📋</div>
              <div className="text-left">
                <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Prepare for My Doctor Visit</p>
                <p className="text-xs text-muted-foreground">Get 6–8 personalised questions based on your lab results</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Your Questions ({result?.questions?.length || '...'})</p>
              <div className="flex gap-2">
                {result?.questions?.length > 0 && (
                  <button
                    onClick={handleCopy}
                    className="text-[10px] font-semibold px-3 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 transition-colors"
                  >
                    {copied ? '✓ Copied!' : '📋 Copy All'}
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-[10px] text-muted-foreground hover:text-foreground">
                  ✕ Close
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin" />
                <p className="text-xs text-muted-foreground">Analysing your hormone values...</p>
              </div>
            ) : result?.questions?.length > 0 ? (
              <div className="space-y-2">
                {result.questions.map((q, i) => (
                  <div key={i} className="p-3 rounded-xl border border-border hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors bg-muted/20">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[q.category] || 'bg-gray-100 text-gray-600'}`}>
                            {q.category}
                          </span>
                        </div>
                        <p className="text-xs font-medium leading-snug">{q.question}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 italic">💡 {q.why}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {result.appointmentTip && (
                  <div className="mt-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800">
                    <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 mb-1">💼 Appointment Tip</p>
                    <p className="text-xs text-muted-foreground">{result.appointmentTip}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">{result?.appointmentTip || 'No questions generated. Try again.'}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Main Results Page
// ══════════════════════════════════════════════════════════════════════
export default function Results() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedRecs, setSavedRecs] = useState(new Set());
  const [openPanel, setOpenPanel] = useState(null);
  const [allAssessments, setAllAssessments] = useState([]);

  useEffect(() => {
    if (!user) return;
    fetch(`http://localhost:3001/api/assessments/${user.id}`)
      .then(r => r.json())
      .then(d => setAllAssessments(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/assessments/detail/${id}`);
        if (!res.ok) throw new Error('Failed to fetch assessment');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Error fetching results:', err);
        setError('Failed to load assessment details.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDownloadPDF = () => {
    if (!data) return;
    const { assessment, recommendations } = data;
    const pv = assessment?.blood_report?.parsed_values || {};
    const doc = new jsPDF();
    const pink = [236, 72, 153];
    const darkGray = [55, 65, 81];
    const lightGray = [107, 114, 128];
    
    // Header
    doc.setFillColor(...pink);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('CycleSync', 15, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('PCOS Screening Report', 15, 28);
    doc.text(`Generated: ${new Date().toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' })}`, 15, 35);
    
    let y = 52;
    // Risk
    doc.setTextColor(...darkGray);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Risk Level: ${assessment.risk_level?.toUpperCase().replace('_', ' ')}`, 15, y);
    doc.text(`Score: ${assessment.risk_score || 'N/A'}/100`, 150, y);
    y += 12;
    
    // AI Summary
    doc.setFontSize(12);
    doc.text('AI Summary', 15, y);
    y += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...lightGray);
    const summaryLines = doc.splitTextToSize(assessment.ai_summary || 'No summary', 180);
    doc.text(summaryLines, 15, y);
    y += summaryLines.length * 5 + 8;
    
    // Clinical Values
    doc.setTextColor(...darkGray);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Clinical Values', 15, y);
    y += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const vals = [
      ['LH', pv.lh, 'mIU/mL'], ['FSH', pv.fsh, 'mIU/mL'], ['AMH', pv.amh, 'ng/mL'],
      ['Testosterone', pv.testosterone, 'ng/mL'], ['Fasting Insulin', pv.fasting_insulin, 'µIU/mL']
    ];
    vals.forEach(([label, val, unit]) => {
      doc.setTextColor(...lightGray);
      doc.text(`${label}: ${val || 'N/A'} ${unit}`, 15, y);
      y += 5;
    });
    y += 5;
    
    // Recommendations
    ['diet', 'exercise', 'lifestyle', 'medical'].forEach(cat => {
      const catRecs = recommendations.filter(r => r.category === cat);
      if (catRecs.length === 0) return;
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setTextColor(...pink);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${cat.charAt(0).toUpperCase() + cat.slice(1)} Recommendations`, 15, y);
      y += 6;
      catRecs.forEach(rec => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setTextColor(...darkGray);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`• ${rec.title}`, 15, y);
        y += 4;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...lightGray);
        const descLines = doc.splitTextToSize(rec.description || '', 175);
        doc.text(descLines, 18, y);
        y += descLines.length * 4 + 3;
      });
      y += 3;
    });
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(...lightGray);
      doc.text('CycleSync is a screening tool only. Not a substitute for professional medical diagnosis.', 15, 287);
      doc.text(`Page ${i} of ${pageCount}`, 185, 287);
    }
    
    doc.save(`CycleSync_Report_${new Date(assessment.created_at).toISOString().split('T')[0]}.pdf`);
  };

  const toggleSaveRec = (recId) => {
    setSavedRecs(prev => {
      const next = new Set(prev);
      if (next.has(recId)) next.delete(recId); else next.add(recId);
      return next;
    });
  };

  if (loading) return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center flex-col space-y-4">
        <p className="text-destructive font-medium">{error || "Data not found"}</p>
        <Button asChild><Link to="/dashboard">Back to Dashboard</Link></Button>
      </div>
    </div>
  );

  const { assessment, recommendations } = data;
  const parsedValues = assessment?.blood_report?.parsed_values || {};

  let BannerIcon = ShieldCheck;
  let bannerColors = "bg-gradient-to-r from-emerald-400 to-teal-500 text-white";
  let bannerMessage = "No PCOS indicators detected. Keep maintaining your healthy habits!";
  if (assessment.risk_level === 'pcos_positive') {
    BannerIcon = ShieldAlert;
    bannerColors = "bg-gradient-to-r from-rose-500 to-red-600 text-white";
    bannerMessage = "Our AI has detected indicators consistent with PCOS.";
  } else if (assessment.risk_level === 'at_risk') {
    BannerIcon = AlertTriangle;
    bannerColors = "bg-gradient-to-r from-amber-400 to-orange-500 text-white";
    bannerMessage = "Some indicators suggest you may develop PCOS. Early action helps.";
  }

  const groupedRecs = {
    diet: recommendations.filter(r => r.category === 'diet'),
    exercise: recommendations.filter(r => r.category === 'exercise'),
    lifestyle: recommendations.filter(r => r.category === 'lifestyle'),
    medical: recommendations.filter(r => r.category === 'medical'),
  };

  const LabValue = ({ label, value, unit, isHighRisk }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-card/50">
      <span className="font-medium text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-bold">{value !== null && value !== undefined ? value : 'N/A'} {unit}</span>
        {value && <div className={`w-2 h-2 rounded-full ${isHighRisk ? 'bg-destructive' : 'bg-green-500'}`} />}
      </div>
    </div>
  );

  const MedicalRecCard = ({ rec }) => {
    const isSaved = savedRecs.has(rec.id);
    const actionType = getRecActionType(rec.title);
    const isPanelOpen = openPanel?.recId === rec.id;
    return (
      <div key={rec.id}>
        <div className="group relative">
          <div className="flex justify-between items-start">
            <h4 className="font-semibold text-sm mb-1 pr-16">{rec.title}</h4>
            {rec.frequency && (
              <span className="text-[10px] bg-secondary text-secondary-foreground font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0">{rec.frequency}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {actionType && (
              <Button size="sm" className="h-7 text-xs" variant={isPanelOpen ? "secondary" : "default"} onClick={() => setOpenPanel(isPanelOpen ? null : { recId: rec.id, type: actionType })}>
                {actionType === 'doctor' ? <><Stethoscope className="h-3 w-3 mr-1" /> {isPanelOpen ? 'Hide Doctors' : 'Find Doctors Nearby'}</> : <><FlaskConical className="h-3 w-3 mr-1" /> {isPanelOpen ? 'Hide Labs' : 'Find Labs Nearby'}</>}
                {isPanelOpen ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </Button>
            )}
          </div>
        </div>
        {isPanelOpen && <DoctorSearchPanel type={actionType} riskLevel={assessment.risk_level} onClose={() => setOpenPanel(null)} />}
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full">
        <div className={`w-full p-6 flex flex-col md:flex-row items-center justify-center gap-4 shadow-sm ${bannerColors}`}>
          <BannerIcon className="h-10 w-10 opacity-90" />
          <div className="text-center md:text-left">
            <h2 className="text-xl font-bold uppercase tracking-wider mb-1">{assessment.risk_level.replace('_', ' ')}</h2>
            <p className="text-white/90 font-medium">{bannerMessage}</p>
          </div>
        </div>

        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-24 md:pb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight">Assessment Details</h1>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}><Download className="mr-2 h-4 w-4" /> Download Report</Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>AI Summary</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed text-sm">{assessment.ai_summary}</p>
                <div className="mt-4 pt-4 border-t flex justify-between items-center text-xs text-muted-foreground">
                  <span>Assessed on: {new Date(assessment.created_at).toLocaleDateString()}</span>
                  <span className="flex flex-col items-end">Powered by Llama 3.3 AI<span className="text-[10px] opacity-70">Screening context only</span></span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Extracted Clinical Values</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <LabValue label="LH (Luteinizing Hormone)" value={parsedValues.lh} unit="mIU/mL" isHighRisk={parsedValues.lh > parsedValues.fsh * 2} />
                <LabValue label="FSH (Follicle-Stimulating)" value={parsedValues.fsh} unit="mIU/mL" isHighRisk={false} />
                <LabValue label="AMH (Anti-Mullerian)" value={parsedValues.amh} unit="ng/mL" isHighRisk={parsedValues.amh > 4.7} />
                <LabValue label="Testosterone" value={parsedValues.testosterone} unit="ng/mL" isHighRisk={parsedValues.testosterone > 0.6} />
                <LabValue label="Fasting Insulin" value={parsedValues.fasting_insulin} unit="µIU/mL" isHighRisk={parsedValues.fasting_insulin > 15} />
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6 mt-8">Your Personalized Plan</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(groupedRecs).map(([cat, recs]) => {
                if (recs.length === 0) return null;
                const isMedical = cat === 'medical';
                return (
                  <Card key={cat} className={`h-full ${isMedical ? 'md:col-span-2 border-primary/20' : ''}`}>
                    <CardHeader className="pb-3 border-b">
                      <CardTitle className="capitalize text-lg text-primary flex items-center gap-2">
                        {isMedical && <Stethoscope className="h-5 w-5" />}
                        {cat} Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-5">
                      {isMedical ? (
                        recs.map(rec => <MedicalRecCard key={rec.id} rec={rec} />)
                      ) : (
                        recs.map(rec => {
                          const isSaved = savedRecs.has(rec.id);
                          return (
                            <div key={rec.id} className="group relative">
                              <div className="flex justify-between items-start">
                                <h4 className="font-semibold text-sm mb-1 pr-16">{rec.title}</h4>
                                {rec.frequency && <span className="text-[10px] bg-secondary text-secondary-foreground font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0">{rec.frequency}</span>}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>

                            </div>
                          );
                        })
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* AI-Powered Wellness Plan */}
          {/* Progress Chart — Risk Score Over Time */}
          {allAssessments.length > 1 && (
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-violet-500" /> Your PCOS Journey — Risk Score Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={allAssessments.slice().reverse().map(a => ({
                    date: new Date(a.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
                    score: a.risk_score || 0,
                    level: a.risk_level?.replace('_', ' ')
                  }))}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(349, 71%, 68%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(349, 71%, 68%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip content={({ active, payload }) => active && payload?.length ? (
                      <div className="glass-card p-2 rounded-lg text-xs">
                        <p className="font-semibold">{payload[0].payload.date}</p>
                        <p>Score: <span className="font-bold">{payload[0].value}</span>/100</p>
                        <p className="capitalize text-muted-foreground">{payload[0].payload.level}</p>
                      </div>
                    ) : null} />
                    <Area type="monotone" dataKey="score" stroke="hsl(349, 71%, 68%)" fill="url(#scoreGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <WellnessPlanSection
            riskLevel={assessment.risk_level}
            riskScore={assessment.risk_score}
            parsedValues={parsedValues}
            aiSummary={assessment.ai_summary}
            profile={data.profile || {}}
          />

          {/* ═══ AI Symptom Pattern Analysis ═══ */}
          <SymptomPatternsCard userId={user?.id} />

          {/* ═══ AI Smart Diet Swap ═══ */}
          <DietSwapCard riskLevel={assessment.risk_level} />

          {/* ═══ Doctor Appointment Prep AI ═══ */}
          <DoctorPrepCard
            riskLevel={assessment.risk_level}
            parsedValues={parsedValues}
            aiSummary={assessment.ai_summary}
          />

          <div className="bg-muted p-4 rounded-lg text-center mt-12 mb-8">
            <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
              <strong>Disclaimer:</strong> CycleSync is a screening and educational tool designed to highlight potential indicators of PCOS based on uploaded reports. It is <strong>NOT</strong> a substitute for professional medical diagnosis or treatment. Always consult with a qualified endocrinologist or gynecologist.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

// ═══ AI Symptom Patterns Component ═══
function SymptomPatternsCard({ userId }) {
  const [patterns, setPatterns] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPatterns = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/ai/symptom-patterns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      setPatterns(data);
    } catch { setPatterns(null); }
    setLoading(false);
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-violet-500" /> AI Symptom Pattern Analysis
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold px-2 py-0.5 rounded-full">AI ✨</span>
            {!patterns && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={fetchPatterns} disabled={loading}>
                {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                Analyze Patterns
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 skeleton-shimmer rounded w-3/4" />
            <div className="h-3 skeleton-shimmer rounded w-full" />
            <div className="h-3 skeleton-shimmer rounded w-2/3" />
          </div>
        ) : patterns?.patterns?.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">{patterns.summary}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {patterns.patterns.map((p, i) => (
                <div key={i} className={`p-3 rounded-lg border ${
                  p.severity === 'warning' ? 'bg-amber-500/5 border-amber-500/20'
                  : p.severity === 'positive' ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-blue-500/5 border-blue-500/20'
                }`}>
                  <p className="text-xs font-semibold mb-1">{p.emoji} {p.title}</p>
                  <p className="text-[11px] text-muted-foreground">{p.description}</p>
                </div>
              ))}
            </div>
            {patterns.mostCommon && (
              <p className="text-[10px] text-muted-foreground">
                Most frequent: <span className="font-semibold text-foreground">{patterns.mostCommon}</span> · Trend: <span className="font-semibold capitalize text-foreground">{patterns.trend}</span>
              </p>
            )}
          </div>
        ) : patterns ? (
          <p className="text-xs text-muted-foreground text-center py-3">{patterns.summary || 'Not enough data yet. Log symptoms daily on the Dashboard!'}</p>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-3">Click "Analyze Patterns" to get AI insights from your symptom logs</p>
        )}
      </CardContent>
    </Card>
  );
}

// ═══ AI Smart Diet Swap Component ═══
function DietSwapCard({ riskLevel }) {
  const [swap, setSwap] = useState(null);
  const [loading, setLoading] = useState(false);
  const meals = ['White Rice', 'White Bread', 'Sugary Cereal', 'Pasta', 'Fried Snacks', 'Ice Cream', 'Soda', 'Chips'];

  const fetchSwap = async (meal) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/ai/diet-swap', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentMeal: meal || meals[Math.floor(Math.random() * meals.length)], mealType: 'any', riskLevel }),
      });
      setSwap(await res.json());
    } catch { setSwap(null); }
    setLoading(false);
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-pink-500" /> Smart Diet Swap
          </CardTitle>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => fetchSwap()} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
            {swap ? 'Try Another' : 'Get Swap'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 skeleton-shimmer rounded w-1/2" />
            <div className="h-3 skeleton-shimmer rounded w-3/4" />
          </div>
        ) : swap ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-rose-500/5 border border-rose-500/20 rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">Instead of</p>
                <p className="text-sm font-semibold text-rose-500">{swap.original}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">Try this</p>
                <p className="text-sm font-semibold text-emerald-500">{swap.alternative}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{swap.reason}</p>
            {swap.benefits?.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {swap.benefits.map((b, i) => (
                  <span key={i} className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">✓ {b}</span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="text-xs text-muted-foreground">Click "Get Swap" to discover PCOS-friendly food alternatives!</p>
            <div className="flex gap-1 flex-wrap justify-center mt-2">
              {meals.slice(0, 4).map(m => (
                <button key={m} onClick={() => fetchSwap(m)} className="text-[10px] px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors">{m}</button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
