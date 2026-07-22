import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { certificateService } from '../../services/certificateService';
import CertificateTemplate from '../../components/certificate/CertificateTemplate';
import { ShieldCheck, CheckCircle2, AlertTriangle, ArrowLeft, ExternalLink, Sparkles, Award } from 'lucide-react';

const VerifyCertificatePage = () => {
  const { certificateId } = useParams();
  const navigate = useNavigate();

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await certificateService.verifyCertificate(certificateId);
        if (data.success && data.certificate) {
          setCertificate(data.certificate);
        } else {
          setError(data.message || 'Invalid certificate ID');
        }
      } catch (err) {
        console.error('Certificate verification failed:', err);
        setError('Certificate Not Found. This serial ID is not registered in the StuVaradhi registry.');
      } finally {
        setLoading(false);
      }
    };

    if (certificateId) {
      fetchVerification();
    }
  }, [certificateId]);

  const formattedCompletedDate = certificate?.issueDate
    ? new Date(certificate.issueDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="min-h-screen bg-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Verification Header Navigation Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/95 p-1.5 flex items-center justify-center shadow-md">
              <img src="/logo.png" alt="StuVaradhi Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-white">StuVaradhi Academic Verification</h1>
              <p className="text-xs text-slate-400">Official Authenticated Credential Registry</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-400">Verifying credential against registry database...</p>
          </div>
        ) : error ? (
          <div className="glass-card max-w-lg mx-auto p-8 rounded-3xl border border-rose-800/60 bg-rose-950/30 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-rose-900/50 text-rose-400 flex items-center justify-center mx-auto ring-4 ring-rose-500/20">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white">Unverified Certificate ID</h2>
            <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
            <p className="text-[11px] text-slate-500 font-mono pt-2">Serial Query: {certificateId}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Official Trustworthy Verification Summary Card */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border-2 border-emerald-500/60 bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-950 text-white space-y-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold ring-4 ring-emerald-500/20">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-emerald-400 flex items-center gap-2">
                    Certificate Verified ✅
                  </h2>
                  <p className="text-xs text-slate-400">Official Authenticated StuVaradhi Academic Registry</p>
                </div>
              </div>

              {/* Exact Key Details List Requested by User */}
              <div className="space-y-3.5 text-sm font-medium">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-800/80 gap-1">
                  <span className="text-slate-400 uppercase text-xs tracking-wider font-semibold">Student:</span>
                  <span className="font-extrabold text-white text-base capitalize">{certificate.studentName}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-800/80 gap-1">
                  <span className="text-slate-400 uppercase text-xs tracking-wider font-semibold">Course:</span>
                  <span className="font-extrabold text-indigo-400 text-base">{certificate.courseTitle}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-800/80 gap-1">
                  <span className="text-slate-400 uppercase text-xs tracking-wider font-semibold">Duration:</span>
                  <span className="font-bold text-slate-200">{certificate.course?.duration || '2 Months Internship Program'}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-800/80 gap-1">
                  <span className="text-slate-400 uppercase text-xs tracking-wider font-semibold">Completed:</span>
                  <span className="font-bold text-slate-200">{formattedCompletedDate}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-800/80 gap-1">
                  <span className="text-slate-400 uppercase text-xs tracking-wider font-semibold">Certificate ID:</span>
                  <span className="font-mono font-black text-amber-400 text-base">{certificate.certificateId}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 gap-1">
                  <span className="text-slate-400 uppercase text-xs tracking-wider font-semibold">Status:</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-500/50 w-fit">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Valid
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Certificate View & PNG/PDF Download Actions */}
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-200 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Official Certificate Document Preview
              </h3>

              <CertificateTemplate certificate={certificate} showActions={true} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyCertificatePage;
