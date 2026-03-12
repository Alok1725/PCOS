import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles } from 'lucide-react';

export default function QuoteBanner({ riskLevel }) {
  const { user } = useAuth();
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    // Check if we already fetched today
    const cached = localStorage.getItem('cyclesync-daily-quote');
    if (cached) {
      try {
        const { data, date } = JSON.parse(cached);
        if (date === new Date().toISOString().split('T')[0]) {
          setQuote(data);
          return;
        }
      } catch {}
    }

    // Fetch new quote
    fetch('http://localhost:3001/api/ai/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ riskLevel: riskLevel || 'none', userName: '' }),
    })
      .then(r => r.json())
      .then(data => {
        setQuote(data);
        localStorage.setItem('cyclesync-daily-quote', JSON.stringify({
          data,
          date: new Date().toISOString().split('T')[0]
        }));
      })
      .catch(() => setQuote({ quote: "Every step you take towards understanding your body is a step towards healing.", author: "CycleSync AI" }));
  }, [riskLevel]);

  if (!quote) return null;

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-500/10 via-pink-500/10 to-amber-500/10 dark:from-violet-500/20 dark:via-pink-500/15 dark:to-amber-500/10 p-4 border border-white/10 fade-in-up">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium italic leading-relaxed">"{quote.quote}"</p>
          <p className="text-[10px] text-muted-foreground mt-1.5">— {quote.author || 'CycleSync AI'}</p>
        </div>
      </div>
    </div>
  );
}
