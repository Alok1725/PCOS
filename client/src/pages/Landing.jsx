import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  UploadCloud, Activity, ClipboardList, ShieldCheck, Heart, Brain, Sparkles,
  Users, BarChart3, ArrowRight, ChevronDown, Star, Droplets, Smile
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';

// Scroll-triggered animation hook
function useInView(ref, threshold = 0.15) {
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsInView(true);
    }, { threshold });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return isInView;
}

function AnimatedSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// Counter animation
function AnimatedCounter({ end, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref);
  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, end]);
  return <span ref={ref}>{count}{suffix}</span>;
}

const features = [
  { icon: UploadCloud, title: 'Smart Upload', desc: 'Upload ultrasound images & blood reports. Our AI extracts values automatically.', color: 'from-pink-500 to-rose-500' },
  { icon: Brain, title: 'AI Analysis', desc: 'Powered by Llama 3.3, our AI cross-references your values with clinical indicators.', color: 'from-violet-500 to-purple-500' },
  { icon: BarChart3, title: 'Risk Assessment', desc: 'Get a clear risk score and understand your PCOS status with visual breakdowns.', color: 'from-blue-500 to-cyan-500' },
  { icon: Heart, title: 'Cycle Tracking', desc: 'Track your periods, predict next cycles, and monitor patterns over time.', color: 'from-rose-500 to-pink-500' },
  { icon: Sparkles, title: 'AI Wellness Plans', desc: 'Personalized diet, exercise, and lifestyle plans generated just for you.', color: 'from-amber-500 to-orange-500' },
  { icon: Users, title: 'Community', desc: 'Connect with others on the same journey. Share tips and support each other.', color: 'from-emerald-500 to-green-500' },
];

const testimonials = [
  { name: 'Priya S.', quote: 'CycleSync helped me understand my PCOS risk before I even showed major symptoms. The AI recommendations are spot on!', rating: 5 },
  { name: 'Anjali M.', quote: 'The period tracker and symptom heatmap gave me patterns I never noticed. My gynecologist was impressed!', rating: 5 },
  { name: 'Riya K.', quote: 'Finally an app that takes PCOS seriously. The diet swaps and wellness plans changed my daily routine.', rating: 5 },
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        {/* ═══ Hero Section ═══ */}
        <section className="relative w-full py-20 md:py-32 lg:py-40 overflow-hidden">
          {/* Background gradient mesh */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-rose-50/50 to-white dark:from-gray-900 dark:via-pink-950/20 dark:to-gray-900" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-pink-200/30 dark:bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-rose-200/20 dark:bg-rose-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="container relative px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-8 text-center">
              <AnimatedSection>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 mb-4">
                  <Sparkles className="h-3.5 w-3.5 text-pink-500" />
                  <span className="text-xs font-semibold text-pink-600 dark:text-pink-400">AI-Powered PCOS Screening</span>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={100}>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl">
                  <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 bg-clip-text text-transparent">Know Your Cycle.</span>
                  <br />
                  <span className="text-foreground">Own Your Health.</span>
                </h1>
              </AnimatedSection>

              <AnimatedSection delay={200}>
                <p className="mx-auto max-w-[600px] text-muted-foreground text-lg md:text-xl leading-relaxed">
                  Upload your ultrasound images and blood reports. Get AI-powered risk assessments
                  and personalized wellness recommendations for PCOS.
                </p>
              </AnimatedSection>

              <AnimatedSection delay={300}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild size="lg" className="h-12 px-8 text-base bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-500/25">
                    <Link to="/signup">
                      Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                    Learn More <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={400}>
                <div className="flex items-center gap-6 text-sm text-muted-foreground mt-4">
                  <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-emerald-500" /> 100% Private</span>
                  <span className="flex items-center gap-1"><Brain className="h-4 w-4 text-violet-500" /> AI Powered</span>
                  <span className="flex items-center gap-1"><Heart className="h-4 w-4 text-pink-500" /> Free to Use</span>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* ═══ Stats Counter Section ═══ */}
        <section className="w-full py-16 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cGF0aCBkPSJNMzYgMzRjMC0yIDEtMyAzLTNoMmMyIDAgMyAxIDMgM3YyYzAgMi0xIDMtMyAzaC0yYy0yIDAtMy0xLTMtM3YtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <AnimatedSection>
                <p className="text-4xl md:text-5xl font-bold"><AnimatedCounter end={10000} suffix="+" /></p>
                <p className="text-white/80 text-sm mt-1">Reports Analyzed</p>
              </AnimatedSection>
              <AnimatedSection delay={100}>
                <p className="text-4xl md:text-5xl font-bold"><AnimatedCounter end={95} suffix="%" /></p>
                <p className="text-white/80 text-sm mt-1">Accuracy Rate</p>
              </AnimatedSection>
              <AnimatedSection delay={200}>
                <p className="text-4xl md:text-5xl font-bold"><AnimatedCounter end={5000} suffix="+" /></p>
                <p className="text-white/80 text-sm mt-1">Happy Users</p>
              </AnimatedSection>
              <AnimatedSection delay={300}>
                <p className="text-4xl md:text-5xl font-bold"><AnimatedCounter end={4} suffix="/5" /></p>
                <p className="text-white/80 text-sm mt-1">User Rating</p>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* ═══ Features Grid ═══ */}
        <section id="features" className="w-full py-20 md:py-28">
          <div className="container px-4 md:px-6 mx-auto">
            <AnimatedSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
                <p className="text-muted-foreground max-w-lg mx-auto">A complete wellness toolkit designed specifically for women managing or preventing PCOS.</p>
              </div>
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <AnimatedSection key={f.title} delay={i * 100}>
                  <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card/80 backdrop-blur">
                    <CardContent className="pt-6 space-y-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg`}>
                        <f.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold">{f.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ How It Works ═══ */}
        <section id="how-it-works" className="w-full py-20 md:py-28 bg-muted/30">
          <div className="container px-4 md:px-6 mx-auto">
            <AnimatedSection>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-center mb-16">How It Works</h2>
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-pink-300 via-rose-300 to-pink-300 dark:from-pink-800 dark:via-rose-800 dark:to-pink-800" />

              {[
                { step: '1', icon: UploadCloud, title: 'Upload Reports', desc: 'Securely upload your ultrasound images and clinical lab reports in seconds.', color: 'from-pink-500 to-rose-500' },
                { step: '2', icon: Brain, title: 'AI Analysis', desc: 'Our advanced AI extracts values and cross-references them with medical indicators.', color: 'from-violet-500 to-purple-500' },
                { step: '3', icon: ClipboardList, title: 'Get Your Plan', desc: 'Receive a personalized wellness plan and understand your current risk level.', color: 'from-emerald-500 to-green-500' },
              ].map((item, i) => (
                <AnimatedSection key={item.step} delay={i * 150}>
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-xl z-10`}>
                      <item.icon className="h-7 w-7 text-white" />
                      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center text-xs font-bold text-pink-500">{item.step}</div>
                    </div>
                    <h3 className="text-xl font-bold">{item.title}</h3>
                    <p className="text-muted-foreground max-w-xs">{item.desc}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Dashboard Features Showcase ═══ */}
        <section className="w-full py-20 md:py-28">
          <div className="container px-4 md:px-6 mx-auto">
            <AnimatedSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Personal Health Dashboard</h2>
                <p className="text-muted-foreground max-w-lg mx-auto">Track everything in one place — from symptoms to moods, water intake to cycle predictions.</p>
              </div>
            </AnimatedSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Heart, label: 'Cycle Tracking', emoji: '🩸', bg: 'bg-pink-500/10', text: 'text-pink-500' },
                { icon: Activity, label: 'Symptom Heatmap', emoji: '📊', bg: 'bg-violet-500/10', text: 'text-violet-500' },
                { icon: Droplets, label: 'Water Tracker', emoji: '💧', bg: 'bg-blue-500/10', text: 'text-blue-500' },
                { icon: Smile, label: 'Mood Journal', emoji: '😊', bg: 'bg-amber-500/10', text: 'text-amber-500' },
                { icon: Brain, label: 'AI Health Tips', emoji: '✨', bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
                { icon: BarChart3, label: 'Risk Analysis', emoji: '📈', bg: 'bg-rose-500/10', text: 'text-rose-500' },
                { icon: Sparkles, label: 'Diet Swaps', emoji: '🥗', bg: 'bg-orange-500/10', text: 'text-orange-500' },
                { icon: Users, label: 'Community', emoji: '👩‍👩‍👧', bg: 'bg-teal-500/10', text: 'text-teal-500' },
              ].map((item, i) => (
                <AnimatedSection key={item.label} delay={i * 60}>
                  <div className={`${item.bg} rounded-xl p-4 text-center hover:scale-105 transition-transform cursor-default`}>
                    <span className="text-2xl mb-2 block">{item.emoji}</span>
                    <p className={`text-xs font-semibold ${item.text}`}>{item.label}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Testimonials ═══ */}
        <section className="w-full py-20 md:py-28 bg-muted/30">
          <div className="container px-4 md:px-6 mx-auto">
            <AnimatedSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by Women Everywhere</h2>
                <p className="text-muted-foreground">Real stories from real users managing their health with CycleSync.</p>
              </div>
            </AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <AnimatedSection key={t.name} delay={i * 150}>
                  <Card className="h-full border-0 shadow-lg bg-card/80 backdrop-blur">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex gap-0.5">
                        {Array.from({ length: t.rating }).map((_, j) => (
                          <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground italic leading-relaxed">"{t.quote}"</p>
                      <div className="flex items-center gap-3 pt-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold">
                          {t.name[0]}
                        </div>
                        <p className="text-sm font-semibold">{t.name}</p>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CTA Section ═══ */}
        <section className="w-full py-20 md:py-28">
          <div className="container px-4 md:px-6 mx-auto">
            <AnimatedSection>
              <div className="relative rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 p-12 md:p-16 text-center text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Take Control?</h2>
                  <p className="text-white/90 max-w-md mx-auto mb-8 text-lg">
                    Join thousands of women who are managing their PCOS journey with confidence.
                  </p>
                  <Button asChild size="lg" className="h-12 px-8 text-base bg-white text-pink-600 hover:bg-white/90 shadow-xl">
                    <Link to="/signup">Start Your Journey <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </main>

      <footer className="w-full py-6 border-t bg-muted/20">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 px-4 md:px-6 mx-auto">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CycleSync. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground max-w-lg text-center md:text-right">
            Disclaimer: CycleSync is a screening tool only, not a substitute for professional medical diagnosis.
            Always consult with a qualified healthcare provider for medical advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
