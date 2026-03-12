import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  MapPin, Star, ExternalLink, Loader2, Stethoscope, Heart, Sparkles, Navigation,
  Video, ChevronDown, ChevronUp, MessageCircle, Send, Trash2
} from 'lucide-react';

const API = 'http://localhost:3001/api';

const SPECIALIST_TYPES = [
  { id: 'gynecologist', title: 'Gynecologist', subtitle: 'PCOS diagnosis, menstrual issues', icon: Heart, color: 'from-pink-500 to-rose-500', searchQuery: 'gynecologist+doctor+near+me' },
  { id: 'endocrinologist', title: 'Endocrinologist', subtitle: 'Hormonal imbalances, insulin', icon: Sparkles, color: 'from-purple-500 to-violet-500', searchQuery: 'endocrinologist+doctor+near+me' },
  { id: 'dermatologist', title: 'Dermatologist', subtitle: 'Acne, hirsutism, hair loss', icon: Stethoscope, color: 'from-amber-500 to-orange-500', searchQuery: 'dermatologist+doctor+near+me' },
];

const TELEHEALTH_PLATFORMS = [
  { name: 'Practo', url: 'https://www.practo.com/consult/gynecologist', desc: 'Video consult with top gynecologists', logo: '🩺', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
  { name: 'Apollo 24|7', url: 'https://www.apollo247.com/specialties/gynaecology', desc: 'AI-powered doctor matching for PCOS', logo: '🏥', color: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
  { name: 'DocOn', url: 'https://www.docon.co.in/', desc: 'Instant video consultations 24/7', logo: '📱', color: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800' },
  { name: 'Tata 1mg', url: 'https://www.1mg.com/online-doctor-consultation', desc: 'Affordable specialist consultations', logo: '💊', color: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800' },
];

const FAQ_QUESTIONS = [
  'What is PCOS and what causes it?',
  'Can PCOS be cured permanently?',
  'What foods should I eat and avoid with PCOS?',
  'How does PCOS affect fertility?',
  'What are the best exercises for managing PCOS?',
  'How do I know if my PCOS is getting better?',
  'Should I take supplements for PCOS?',
  'Can stress make PCOS worse?',
];

export default function Consult() {
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSpecialist, setActiveSpecialist] = useState(SPECIALIST_TYPES[0]);
  const [activeTab, setActiveTab] = useState('find');

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ doctorName: '', specialty: '', location: '', rating: 5, reviewText: '' });
  const [postingReview, setPostingReview] = useState(false);

  // FAQ state
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [faqAnswers, setFaqAnswers] = useState({});
  const [faqLoading, setFaqLoading] = useState(null);
  const [latestRisk, setLatestRisk] = useState('none');

  useEffect(() => { detectLocation(); }, []);

  useEffect(() => {
    fetch(`${API}/reviews`).then(r => r.json()).then(d => setReviews(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch(`${API}/assessments/${user.id}`).then(r => r.json()).then(d => {
      if (Array.isArray(d) && d.length > 0) setLatestRisk(d[0].risk_level || 'none');
    }).catch(() => {});
  }, [user]);

  const detectLocation = () => {
    setLoading(true); setError('');
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
  };

  const getGoogleMapsSearchUrl = (query) => location ? `https://www.google.com/maps/search/${query}/@${location.lat},${location.lng},13z` : `https://www.google.com/maps/search/${query}`;
  const getGoogleMapsEmbedUrl = () => location ? `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${activeSpecialist.searchQuery}&center=${location.lat},${location.lng}&zoom=13` : null;

  const handlePostReview = async () => {
    if (!reviewForm.doctorName.trim()) return;
    setPostingReview(true);
    try {
      const res = await fetch(`${API}/reviews`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...reviewForm }),
      });
      const data = await res.json();
      setReviews(prev => [data, ...prev]);
      setReviewForm({ doctorName: '', specialty: '', location: '', rating: 5, reviewText: '' });
      setShowReviewForm(false);
    } catch (e) { console.error(e); }
    finally { setPostingReview(false); }
  };

  const handleFaqExpand = async (question) => {
    if (expandedFaq === question) { setExpandedFaq(null); return; }
    setExpandedFaq(question);
    if (faqAnswers[question]) return;
    setFaqLoading(question);
    try {
      const res = await fetch(`${API}/ai/faq`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, riskLevel: latestRisk }),
      });
      const data = await res.json();
      setFaqAnswers(prev => ({ ...prev, [question]: data.answer }));
    } catch { setFaqAnswers(prev => ({ ...prev, [question]: 'Unable to load answer.' })); }
    finally { setFaqLoading(null); }
  };

  const embedUrl = getGoogleMapsEmbedUrl();

  const TABS = [
    { id: 'find', label: '🗺️ Find Doctors' },
    { id: 'telehealth', label: '📹 Telehealth' },
    { id: 'reviews', label: '⭐ Reviews' },
    { id: 'faq', label: '❓ FAQ' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background gradient-mesh-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Consult & Care 🩺</h1>
              <p className="text-muted-foreground mt-1">
                {locationName ? <>Showing results near <span className="font-medium text-foreground">{locationName}</span></> : 'Find specialists, book consultations, read reviews'}
              </p>
            </div>
            {location && (
              <div className="flex items-center gap-2 text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <MapPin className="h-3.5 w-3.5" /> Location detected
              </div>
            )}
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-xs px-4 py-2 rounded-xl whitespace-nowrap font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ═══ FIND DOCTORS TAB ═══ */}
          {activeTab === 'find' && (
            <div className="space-y-4 fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {SPECIALIST_TYPES.map((type) => {
                  const isActive = activeSpecialist.id === type.id;
                  const IconComp = type.icon;
                  return (
                    <Card key={type.id} className={`cursor-pointer glass-card-hover ${isActive ? 'ring-2 ring-primary shadow-md' : ''}`} onClick={() => setActiveSpecialist(type)}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center flex-shrink-0`}>
                          <IconComp className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{type.title}</h3>
                          <p className="text-[10px] text-muted-foreground">{type.subtitle}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {loading ? (
                <Card className="glass-card"><CardContent className="flex flex-col items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary mb-4" /><p className="text-muted-foreground">Detecting location...</p></CardContent></Card>
              ) : error ? (
                <Card className="glass-card"><CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4"><MapPin className="h-12 w-12 text-muted-foreground/30" /><p className="text-muted-foreground">{error}</p><Button onClick={detectLocation} variant="outline"><Navigation className="mr-2 h-4 w-4" /> Try Again</Button></CardContent></Card>
              ) : (
                <Card className="glass-card overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <activeSpecialist.icon className="h-4 w-4 text-primary" /> {activeSpecialist.title}s near you
                      </CardTitle>
                      <Button size="sm" variant="outline" onClick={() => window.open(getGoogleMapsSearchUrl(activeSpecialist.searchQuery), '_blank')}>
                        <ExternalLink className="mr-2 h-3.5 w-3.5" /> Google Maps
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {embedUrl ? (
                      <iframe title="Nearby Doctors" src={embedUrl} width="100%" height="400" style={{ border: 0 }} allowFullScreen loading="lazy" className="rounded-b-xl" />
                    ) : (
                      <div className="h-[400px] bg-muted flex items-center justify-center text-muted-foreground">Map unavailable</div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ═══ TELEHEALTH TAB ═══ */}
          {activeTab === 'telehealth' && (
            <div className="space-y-4 fade-in stagger-in">
              <p className="text-sm text-muted-foreground">Book a video consultation with PCOS specialists from home 📹</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TELEHEALTH_PLATFORMS.map(platform => (
                  <Card key={platform.name} className="glass-card-hover">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-xl ${platform.color} border flex items-center justify-center text-2xl flex-shrink-0`}>
                          {platform.logo}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{platform.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5 mb-3">{platform.desc}</p>
                          <Button size="sm" className="w-full" onClick={() => window.open(platform.url, '_blank')}>
                            <Video className="mr-2 h-3.5 w-3.5" /> Book Consultation
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ═══ REVIEWS TAB ═══ */}
          {activeTab === 'reviews' && (
            <div className="space-y-4 fade-in">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Share and read experiences from other patients ⭐</p>
                <Button size="sm" onClick={() => setShowReviewForm(!showReviewForm)}>
                  <Send className="h-3.5 w-3.5 mr-1.5" /> Write Review
                </Button>
              </div>

              {showReviewForm && (
                <Card className="glass-card fade-in-up">
                  <CardContent className="pt-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input placeholder="Doctor's Name *" value={reviewForm.doctorName} onChange={e => setReviewForm(p => ({ ...p, doctorName: e.target.value }))} />
                      <Input placeholder="Specialty (e.g. Gynecologist)" value={reviewForm.specialty} onChange={e => setReviewForm(p => ({ ...p, specialty: e.target.value }))} />
                    </div>
                    <Input placeholder="Location / City" value={reviewForm.location} onChange={e => setReviewForm(p => ({ ...p, location: e.target.value }))} />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">Rating:</span>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setReviewForm(p => ({ ...p, rating: n }))}>
                          <Star className={`h-5 w-5 transition-colors ${n <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={reviewForm.reviewText}
                      onChange={e => setReviewForm(p => ({ ...p, reviewText: e.target.value }))}
                      placeholder="Share your experience..."
                      className="w-full p-3 rounded-xl border bg-transparent text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button size="sm" onClick={handlePostReview} disabled={postingReview || !reviewForm.doctorName.trim()}>
                        {postingReview ? 'Posting...' : 'Submit Review'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {reviews.length === 0 ? (
                <Card className="glass-card"><CardContent className="py-12 text-center"><p className="text-sm text-muted-foreground">No reviews yet. Be the first to share!</p></CardContent></Card>
              ) : (
                <div className="space-y-3 stagger-in">
                  {reviews.map(review => (
                    <Card key={review.id} className="glass-card">
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-sm">{review.doctor_name}</h4>
                            <p className="text-[10px] text-muted-foreground">
                              {review.specialty && `${review.specialty} • `}{review.location || ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} />
                            ))}
                          </div>
                        </div>
                        {review.review_text && <p className="text-xs text-muted-foreground leading-relaxed">{review.review_text}</p>}
                        {review.visit_date && <p className="text-[9px] text-muted-foreground/60 mt-1.5">Visited: {new Date(review.visit_date).toLocaleDateString()}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ FAQ TAB ═══ */}
          {activeTab === 'faq' && (
            <div className="space-y-2 fade-in">
              <p className="text-sm text-muted-foreground mb-4">Common PCOS questions — answers personalized to your health profile by AI 🧠</p>
              {FAQ_QUESTIONS.map(question => {
                const isExpanded = expandedFaq === question;
                const isLoading = faqLoading === question;
                return (
                  <Card key={question} className="glass-card overflow-hidden">
                    <button
                      onClick={() => handleFaqExpand(question)}
                      className="w-full text-left p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                    >
                      <span className="text-sm font-medium pr-4">{question}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t fade-in">
                        {isLoading ? (
                          <div className="flex items-center gap-2 py-3">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="text-xs text-muted-foreground">AI is generating a personalized answer...</span>
                          </div>
                        ) : (
                          <div className="pt-3">
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{faqAnswers[question]}</p>
                            <p className="text-[9px] text-muted-foreground/50 mt-2 flex items-center gap-1">
                              <Sparkles className="h-3 w-3" /> Personalized to your PCOS profile • Not medical advice
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-muted/50 p-4 rounded-lg text-center">
            <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
              <strong>Note:</strong> Doctor listings are from Google Maps. CycleSync does not endorse any provider. Always verify credentials.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
