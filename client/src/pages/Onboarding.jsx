import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Progress } from '../components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';

const SYMPTOMS_LIST = [
  { id: 'irregular_periods', label: 'Irregular periods' },
  { id: 'acne', label: 'Acne' },
  { id: 'hair_loss', label: 'Hair loss' },
  { id: 'weight_gain', label: 'Weight gain' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'mood_swings', label: 'Mood swings' },
  { id: 'excess_facial_hair', label: 'Excess facial hair' },
  { id: 'difficulty_conceiving', label: 'Difficulty conceiving' },
];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    height: '',
    weight: '',
    cycleRegularity: '',
    lastPeriodDate: '',
    symptoms: [],
  });

  useEffect(() => {
    const checkProfile = async () => {
      if (user) {
         const { data } = await supabase.from('profiles').select('id').eq('id', user.id).single();
         // If a profile exists, maybe skip onboarding, but for now we let them update it
      }
    };
    checkProfile();
  }, [user]);

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleSymptomToggle = (symptomId) => {
    setFormData((prev) => {
      const isSelected = prev.symptoms.includes(symptomId);
      if (isSelected) {
        return { ...prev, symptoms: prev.symptoms.filter((id) => id !== symptomId) };
      } else {
        return { ...prev, symptoms: [...prev.symptoms, symptomId] };
      }
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const updates = {
        id: user.id,
        full_name: formData.fullName,
        age: parseInt(formData.age),
        height_cm: parseFloat(formData.height),
        weight_kg: parseFloat(formData.weight),
        cycle_regularity: formData.cycleRegularity,
        last_period_date: formData.lastPeriodDate || null,
        symptoms: formData.symptoms,
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-secondary/20">
      <div className="w-full max-w-lg space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-center text-primary">Let's built your profile</h1>
          <Progress value={(step / 3) * 100} className="h-2" />
          <p className="text-center text-sm text-muted-foreground">Step {step} of 3</p>
        </div>

        <Card className="shadow-lg border-none mt-4">
          <CardContent className="pt-6">
            {step === 1 && (
              <div className="space-y-4 fade-in">
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Tell us a bit about yourself.</CardDescription>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    value={formData.fullName} 
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                    placeholder="Jane Doe"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" type="number" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input id="weight" type="number" step="0.1" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input id="height" type="number" value={formData.height} onChange={(e) => setFormData({...formData, height: e.target.value})} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 fade-in">
                <CardTitle>Menstrual History</CardTitle>
                <CardDescription>Help us understand your cycle.</CardDescription>
                
                <div className="space-y-2">
                  <Label>Cycle Regularity</Label>
                  <Select value={formData.cycleRegularity} onValueChange={(val) => setFormData({...formData, cycleRegularity: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select regularity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular (21-35 days)</SelectItem>
                      <SelectItem value="irregular">Irregular (Varies widely)</SelectItem>
                      <SelectItem value="absent">Absent (No periods)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastPeriod">Last Period Date</Label>
                  <Input 
                    id="lastPeriod" 
                    type="date" 
                    value={formData.lastPeriodDate} 
                    onChange={(e) => setFormData({...formData, lastPeriodDate: e.target.value})}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 fade-in">
                <CardTitle>Symptoms</CardTitle>
                <CardDescription>Select any symptoms you consistently experience.</CardDescription>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {SYMPTOMS_LIST.map((symptom) => (
                    <div key={symptom.id} className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-secondary/20 cursor-pointer" onClick={() => handleSymptomToggle(symptom.id)}>
                      <Checkbox 
                        id={symptom.id} 
                        checked={formData.symptoms.includes(symptom.id)}
                        onCheckedChange={() => handleSymptomToggle(symptom.id)}
                      />
                      <Label htmlFor={symptom.id} className="cursor-pointer">{symptom.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between pb-6">
            {step > 1 ? (
              <Button variant="outline" onClick={handlePrev}>Back</Button>
            ) : (
              <div></div> // Spacer
            )}
            
            {step < 3 ? (
              <Button onClick={handleNext} disabled={step === 1 && (!formData.fullName || !formData.age)}>
                Next Step
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : 'Complete Profile'}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
