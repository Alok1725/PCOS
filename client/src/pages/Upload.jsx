import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { UploadCloud, File, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'both'; // 'usg', 'blood', or 'both'

  const [usgFile, setUsgFile] = useState(null);
  const [bloodFile, setBloodFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const onDropUsg = useCallback(acceptedFiles => {
    if (acceptedFiles?.length > 0) setUsgFile(acceptedFiles[0]);
  }, []);

  const onDropBlood = useCallback(acceptedFiles => {
    if (acceptedFiles?.length > 0) setBloodFile(acceptedFiles[0]);
  }, []);

  const { getRootProps: getUsgProps, getInputProps: getUsgInput } = useDropzone({ 
    onDrop: onDropUsg,
    accept: { 'image/jpeg': [], 'image/png': [], 'application/pdf': [] },
    maxFiles: 1
  });

  const { getRootProps: getBloodProps, getInputProps: getBloodInput } = useDropzone({ 
    onDrop: onDropBlood,
    accept: { 'application/pdf': [], 'image/jpeg': [], 'image/png': [] },
    maxFiles: 1
  });

  const handleUploadAndAnalyze = async () => {
    if (!usgFile && !bloodFile) return;
    setLoading(true);
    setErrorMsg('');
    
    try {
      let usgReportId = null;
      let bloodReportId = null;

      // 1. Upload USG
      if (usgFile) {
        setStatusMsg('Uploading Ultrasound Image...');
        const formData = new FormData();
        formData.append('file', usgFile);
        formData.append('userId', user.id);
        formData.append('reportType', 'ultrasound');
        const res = await axios.post('http://localhost:3001/api/upload/report', formData);
        usgReportId = res.data.reportId;
      }

      // 2. Upload Blood Report
      if (bloodFile) {
        setStatusMsg('Uploading Blood Report...');
        const formData = new FormData();
        formData.append('file', bloodFile);
        formData.append('userId', user.id);
        formData.append('reportType', 'blood_test');
        const res = await axios.post('http://localhost:3001/api/upload/report', formData);
        bloodReportId = res.data.reportId;
      }

      // 3. Analyze
      setStatusMsg('Running AI Analysis. This may take a minute...');
      const analyzeRes = await axios.post('http://localhost:3001/api/analyze', {
        userId: user.id,
        usgReportId,
        bloodReportId
      });

      if (analyzeRes.data?.assessment?.id) {
        setStatusMsg('Analysis complete! Redirecting...');
        setTimeout(() => {
          navigate(`/results/${analyzeRes.data.assessment.id}`);
        }, 1000);
      } else {
        throw new Error('Analysis returned no assessment ID');
      }

    } catch (err) {
      console.error('Upload process error:', err);
      setErrorMsg(err.response?.data?.error || 'An error occurred during upload or analysis.');
      setLoading(false);
    }
  };

  const removeUsg = (e) => { e.stopPropagation(); setUsgFile(null); };
  const removeBlood = (e) => { e.stopPropagation(); setBloodFile(null); };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 md:ml-0 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Upload Reports</h1>
            <p className="text-muted-foreground">
              Please provide clear, readable images or PDFs for accurate AI extraction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* USG Dropzone */}
            {(initialType === 'both' || initialType === 'usg') && (
              <Card className="border-2 border-dashed overflow-hidden hover:border-primary/50 transition-colors">
                <CardContent className="p-0">
                  <div {...getUsgProps()} className="flex flex-col items-center justify-center p-8 h-64 cursor-pointer text-center bg-secondary/10 hover:bg-secondary/20 transition-colors">
                    <input {...getUsgInput()} />
                    {usgFile ? (
                      <div className="flex flex-col items-center space-y-3">
                        <CheckCircle2 className="h-10 w-10 text-primary" />
                        <p className="font-medium text-sm w-48 truncate">{usgFile.name}</p>
                        <Button variant="outline" size="sm" onClick={removeUsg}>Remove</Button>
                      </div>
                    ) : (
                      <>
                        <div className="p-4 bg-primary/10 rounded-full mb-4">
                          <ImageIcon className="h-8 w-8 text-primary" />
                        </div>
                        <p className="font-medium">Ultrasound (USG) Image</p>
                        <p className="text-xs text-muted-foreground mt-1">Upload scan image or radiologist report</p>
                        <p className="text-[10px] text-emerald-600 mt-2 font-medium">✓ AI Vision can read raw ultrasound scans</p>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">PDF, JPG, PNG</p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Blood Dropzone */}
            {(initialType === 'both' || initialType === 'blood') && (
              <Card className="border-2 border-dashed overflow-hidden hover:border-accent/50 transition-colors">
                <CardContent className="p-0">
                  <div {...getBloodProps()} className="flex flex-col items-center justify-center p-8 h-64 cursor-pointer text-center bg-accent/5 hover:bg-accent/10 transition-colors">
                    <input {...getBloodInput()} />
                    {bloodFile ? (
                      <div className="flex flex-col items-center space-y-3">
                        <CheckCircle2 className="h-10 w-10 text-accent" />
                        <p className="font-medium text-sm w-48 truncate">{bloodFile.name}</p>
                        <Button variant="outline" size="sm" onClick={removeBlood}>Remove</Button>
                      </div>
                    ) : (
                      <>
                        <div className="p-4 bg-accent/10 rounded-full mb-4">
                          <File className="h-8 w-8 text-accent" />
                        </div>
                        <p className="font-medium">Blood Test Report</p>
                        <p className="text-xs text-muted-foreground mt-1">Drag & drop or click to select</p>
                        <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider">PDF, JPG, PNG</p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          {errorMsg && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm font-medium border border-destructive/20">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col items-center justify-center pt-8 border-t space-y-4">
            <Button 
              size="lg" 
              className="w-full max-w-sm h-14 text-lg" 
              disabled={(!usgFile && !bloodFile) || loading}
              onClick={handleUploadAndAnalyze}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Analyze Now'
              )}
            </Button>
            
            {loading && statusMsg && (
              <p className="text-sm text-primary animate-pulse font-medium">{statusMsg}</p>
            )}
            
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-4">
              <UploadCloud className="h-3 w-3" />
              Secure, encrypted upload. Medical disclaimer applies.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
