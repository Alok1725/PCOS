import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { User, Settings, Save, CheckCircle2, ShieldAlert, AlertTriangle, ShieldCheck, ChevronRight, Clock } from 'lucide-react';
import { api } from '../lib/api';

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fullName, setFullName] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formWeight, setFormWeight] = useState('');
  const [formHeight, setFormHeight] = useState('');
  const [assessments, setAssessments] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.get(`/api/profile/${user.id}`);
        if (data) {
          setFullName(data.full_name || '');
          setFormAge(data.age?.toString() || '');
          setFormWeight(data.weight_kg?.toString() || '');
          setFormHeight(data.height_cm?.toString() || '');
        }
      } catch (err) { console.error('Fetch profile err:', err); }
      finally { setLoading(false); }
    };
    if (user) fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    api.get(`/api/assessments/${user.id}`)
      .then(d => setAssessments(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [user]);

  const handleSave = async () => {
    setSaving(true); setSaveSuccess(false);
    try {
      await api.patch(`/api/profile/${user.id}`, {
        full_name: fullName.trim() || null,
        age: parseInt(formAge) || null,
        weight_kg: parseFloat(formWeight) || null,
        height_cm: parseFloat(formHeight) || null,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Save error:', err);
      alert('Error saving profile.');
    } finally { setSaving(false); }
  };

  const getRiskIcon = (level) => {
    if (level === 'pcos_positive') return <ShieldAlert className="h-4 w-4 text-rose-500" />;
    if (level === 'at_risk') return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    return <ShieldCheck className="h-4 w-4 text-emerald-500" />;
  };
  const getRiskColor = (level) => {
    if (level === 'pcos_positive') return 'border-rose-500 bg-rose-500/10';
    if (level === 'at_risk') return 'border-amber-500 bg-amber-500/10';
    return 'border-emerald-500 bg-emerald-500/10';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background gradient-mesh-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-muted-foreground">Manage your personal information and health profile.</p>
          </div>

          <div className="grid gap-6 stagger-in">
            {/* Personal Information */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" /> Personal Information
                </CardTitle>
                <CardDescription>Basic details used for health screening</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? <div className="h-40 skeleton-shimmer rounded-md" /> : (
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input placeholder="Enter your full name" value={fullName} onChange={e => setFullName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Age</Label>
                        <Input type="number" placeholder="e.g. 25" value={formAge} onChange={e => setFormAge(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Weight (kg)</Label>
                        <Input type="number" step="0.1" placeholder="e.g. 58" value={formWeight} onChange={e => setFormWeight(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Height (cm)</Label>
                        <Input type="number" placeholder="e.g. 162" value={formHeight} onChange={e => setFormHeight(e.target.value)} />
                      </div>
                    </div>
                    <div className="pt-4 flex justify-end items-center gap-3">
                      {saveSuccess && (
                        <span className="text-sm text-emerald-600 flex items-center gap-1 fade-in">
                          <CheckCircle2 className="h-4 w-4" /> Saved successfully!
                        </span>
                      )}
                      <Button type="submit" disabled={saving}>
                        <Save className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Account Details */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-muted-foreground" /> Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Email Address</p>
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded-md">{user?.email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => alert('Password reset flow would go here')}>
                  Reset Password
                </Button>
              </CardContent>
            </Card>

            {/* Medical History Timeline */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-violet-500" /> Medical History Timeline
                </CardTitle>
                <CardDescription>All your assessments and key findings</CardDescription>
              </CardHeader>
              <CardContent>
                {assessments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">No assessments yet.</p>
                    <Button asChild size="sm" className="mt-3">
                      <Link to="/upload">Upload Your First Report</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                    <div className="space-y-6">
                      {assessments.map((a, i) => (
                        <Link key={a.id} to={`/results/${a.id}`} className="block group">
                          <div className="relative flex items-start gap-4 pl-10">
                            {/* Timeline dot */}
                            <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${getRiskColor(a.risk_level)} mt-1.5`} />
                            {/* Content */}
                            <div className="flex-1 p-3 rounded-lg border hover:border-primary/30 hover:bg-muted/30 transition-all">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  {getRiskIcon(a.risk_level)}
                                  <span className="text-sm font-semibold capitalize">{a.risk_level?.replace('_', ' ')}</span>
                                  <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full">Score: {a.risk_score}/100</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{a.ai_summary}</p>
                              <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                                {new Date(a.created_at).toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
