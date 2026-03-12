import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  { title: 'Welcome to CycleSync! 🌸', description: 'Your AI-powered PCOS health companion. Let\'s take a quick tour of what you can do.', emoji: '👋' },
  { title: 'Upload Your Reports', description: 'Upload USG and blood test reports. Our AI will analyze them for PCOS indicators, hormone imbalances, and more.', emoji: '📄' },
  { title: 'Get AI Analysis', description: 'Receive a detailed risk assessment with extracted hormone values, AI summary, and personalized recommendations.', emoji: '🧠' },
  { title: 'Track Your Health', description: 'Log your periods, symptoms, water intake, and mood daily. See trends and patterns over time on your dashboard.', emoji: '📊' },
  { title: 'Find Specialists', description: 'Find nearby gynecologists, endocrinologists, and labs directly from your results. Book telehealth consultations.', emoji: '🩺' },
  { title: 'Join the Community', description: 'Connect with other PCOS warriors. Share stories, tips, and support each other anonymously.', emoji: '💜' },
  { title: 'You\'re All Set! 🎉', description: 'Start by uploading your first report or explore your dashboard. Your AI assistant is always available via the chat button.', emoji: '🚀' },
];

export default function OnboardingTour() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    // Per-user onboarding — each account gets their own flag
    const key = `cyclesync-onboarding-done-${user.id}`;
    const seen = localStorage.getItem(key);
    if (!seen) setShow(true);
    else setShow(false);
  }, [user]);

  const finish = () => {
    setShow(false);
    if (user) localStorage.setItem(`cyclesync-onboarding-done-${user.id}`, 'true');
  };

  if (!show) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden border border-border">
        {/* Gradient decoration */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500" />

        {/* Skip button */}
        <button onClick={finish} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>

        {/* Content */}
        <div className="text-center pt-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-violet-500/20 flex items-center justify-center text-3xl mx-auto mb-4 animate-float">
            {current.emoji}
          </div>
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{current.title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{current.description}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 my-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-pink-500' : 'w-1.5 bg-gray-300 dark:bg-gray-600'}`} />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)} className="flex-1">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
          <Button
            size="sm"
            onClick={isLast ? finish : () => setStep(s => s + 1)}
            className="flex-1 bg-gradient-to-r from-pink-500 to-violet-500 text-white hover:from-pink-600 hover:to-violet-600"
          >
            {isLast ? (
              <><Sparkles className="h-4 w-4 mr-1" /> Get Started</>
            ) : (
              <>Next <ChevronRight className="h-4 w-4 ml-1" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
