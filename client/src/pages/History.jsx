import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Calendar, ChevronRight } from 'lucide-react';

export default function History() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}`}/api/assessments/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setAssessments(data);
        }
      } catch (err) {
        console.error('Failed to load history', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchHistory();
  }, [user]);

  const getRiskColor = (level) => {
    switch (level) {
      case 'pcos_positive': return 'destructive';
      case 'at_risk': return 'secondary';
      case 'none': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assessment History</h1>
            <p className="text-muted-foreground">View your past AI screening results and track your health journey.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                 <Calendar className="h-5 w-5 text-primary" />
                 Past Reports
              </CardTitle>
              <CardDescription>All your historical uploads and assessments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-md" />)}
                </div>
              ) : assessments.length === 0 ? (
                 <div className="text-center py-12 text-muted-foreground">
                   No assessments found. Upload a report to get started.
                 </div>
              ) : (
                <div className="space-y-3">
                  {assessments.map(assessment => (
                    <div 
                      key={assessment.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">
                            {new Date(assessment.created_at).toLocaleDateString(undefined, {
                              year: 'numeric', month: 'long', day: 'numeric'
                            })}
                          </span>
                          <Badge variant={getRiskColor(assessment.risk_level)} className="text-[10px] uppercase">
                            {assessment.risk_level.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex gap-2">
                           {assessment.blood_report && <span>• Blood Report</span>}
                           {assessment.usg_report && <span>• Ultrasound</span>}
                        </div>
                      </div>
                      
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/results/${assessment.id}`}>
                          View <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
