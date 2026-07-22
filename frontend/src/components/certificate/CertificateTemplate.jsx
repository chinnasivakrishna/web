import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, ShieldCheck, Share2, Sparkles, Award } from 'lucide-react';
import toast from 'react-hot-toast';

const CertificateTemplate = ({ certificate, showActions = true }) => {
  const certRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!certificate) return null;

  const {
    certificateId,
    studentName,
    courseTitle,
    instructorName,
    issueDate,
    grade = 'Excellence',
  } = certificate;

  const formattedDate = new Date(issueDate || Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Direct HTTP/HTTPS Verification URL for QR Code Scanners
  const redirectUrl = `${window.location.origin}/verify/${certificateId}`;

  // Download as High-Resolution PNG Image with Pixel-Perfect Style Preservation
  const downloadPNG = async () => {
    if (!certRef.current) return;
    setDownloading(true);
    const toastId = toast.loading('Generating High-Resolution PNG Certificate...');

    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 3, // 3x ultra-high resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fcfaf7',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1000,
        windowHeight: 700,
      });

      const link = document.createElement('a');
      link.download = `StuVaradhi_Certificate_${certificateId}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();

      toast.success('Certificate PNG Downloaded Successfully! 🎓', { id: toastId });
    } catch (err) {
      console.error('PNG download error:', err);
      toast.error('Failed to export PNG certificate', { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  // Download as Official Vector PDF Document with Pixel-Perfect Style Preservation
  const downloadPDF = async () => {
    if (!certRef.current) return;
    setDownloading(true);
    const toastId = toast.loading('Exporting Official PDF Document...');

    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fcfaf7',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1000,
        windowHeight: 700,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`StuVaradhi_Certificate_${certificateId}.pdf`);

      toast.success('Official Certificate PDF Exported! 📜', { id: toastId });
    } catch (err) {
      console.error('PDF download error:', err);
      toast.error('Failed to export PDF certificate', { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  const copyVerifyLink = () => {
    navigator.clipboard.writeText(redirectUrl);
    toast.success('Public Verification Link copied to clipboard!');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Action Controls */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-xl">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-200">Official Authenticated Credential</p>
              <p className="text-[11px] text-slate-400">ID: {certificateId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={downloadPNG}
              disabled={downloading}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-glow transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>

            <button
              onClick={downloadPDF}
              disabled={downloading}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-glow transition-all flex items-center gap-1.5"
            >
              <Award className="w-4 h-4" />
              Download PDF
            </button>

            <button
              onClick={copyVerifyLink}
              className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              Copy Verification URL
            </button>
          </div>
        </div>
      )}

      {/* Royal Certificate Canvas DOM Node with Blurred Background Image & Pixel-Perfect Dimensions */}
      <div className="overflow-x-auto pb-4 flex justify-center">
        <div
          ref={certRef}
          style={{
            width: '1000px',
            height: '700px',
            backgroundColor: '#fcfaf7',
            color: '#0c1838',
            padding: '40px 52px',
            position: 'relative',
            boxSizing: 'border-box',
            border: '14px solid #0c1838',
            fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 25px 50px -12px rgba(12, 24, 56, 0.4)',
            overflow: 'hidden',
          }}
        >
          {/* Blurred Background Image Watermark Overlay */}
          <img
            src="/cert-bg.png"
            alt="Certificate Watermark Pattern"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.14,
              filter: 'blur(3px) contrast(1.1)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          {/* Inner Golden Border Frame */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              right: '16px',
              bottom: '16px',
              border: '2px solid #d4af37',
              pointerEvents: 'none',
              boxSizing: 'border-box',
              zIndex: 2,
            }}
          />

          {/* Top Golden Header Text */}
          <div
            style={{
              position: 'absolute',
              top: '24px',
              left: '48px',
              right: '48px',
              display: 'flex',
              justifyContent: 'space-between',
              color: '#9a7b2c',
              fontSize: '10px',
              fontFamily: 'Arial, sans-serif',
              fontWeight: 'bold',
              letterSpacing: '1px',
              pointerEvents: 'none',
              zIndex: 5,
            }}
          >
            <span>❖ STUVARADHI ACADEMIC REGISTRY ❖</span>
            <span>❖ VERIFIED CREDENTIAL ❖</span>
          </div>

          {/* Bottom Golden Footer Text */}
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '48px',
              right: '48px',
              display: 'flex',
              justifyContent: 'space-between',
              color: '#9a7b2c',
              fontSize: '10px',
              fontFamily: 'Arial, sans-serif',
              fontWeight: 'bold',
              letterSpacing: '1px',
              pointerEvents: 'none',
              zIndex: 5,
            }}
          >
            <span>❖ SECURE QR VERIFIED ❖</span>
            <span>❖ OFFICIAL DOCUMENT ❖</span>
          </div>

          {/* Corner Rosette Accents */}
          <div style={{ position: 'absolute', top: '22px', left: '22px', width: '24px', height: '24px', borderTop: '2px solid #d4af37', borderLeft: '2px solid #d4af37', pointerEvents: 'none', zIndex: 5 }} />
          <div style={{ position: 'absolute', top: '22px', right: '22px', width: '24px', height: '24px', borderTop: '2px solid #d4af37', borderRight: '2px solid #d4af37', pointerEvents: 'none', zIndex: 5 }} />
          <div style={{ position: 'absolute', bottom: '22px', left: '22px', width: '24px', height: '24px', borderBottom: '2px solid #d4af37', borderLeft: '2px solid #d4af37', pointerEvents: 'none', zIndex: 5 }} />
          <div style={{ position: 'absolute', bottom: '22px', right: '22px', width: '24px', height: '24px', borderBottom: '2px solid #d4af37', borderRight: '2px solid #d4af37', pointerEvents: 'none', zIndex: 5 }} />

          {/* Header Section with Official StuVaradhi Emblem Logo */}
          <div style={{ textAlign: 'center', paddingTop: '10px', zIndex: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '2px' }}>
              <img
                src="/logo.png"
                alt="StuVaradhi Official Logo"
                style={{ width: '64px', height: '64px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
              />
              <span style={{ fontFamily: 'Arial, sans-serif', fontSize: '24px', fontWeight: '900', letterSpacing: '4px', color: '#0c1838', marginTop: '2px' }}>
                STUVARADHI
              </span>
            </div>
            <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '3.5px', fontWeight: '800', color: '#9a7b2c', margin: 0 }}>
              Institute of Technology & Virtual Learning
            </p>
            
            <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '2px', color: '#0c1838', textTransform: 'uppercase', marginTop: '12px', marginBottom: '6px' }}>
              Certificate of Completion
            </h1>
            <div style={{ width: '160px', height: '2px', backgroundColor: '#d4af37', margin: '0 auto' }} />
          </div>

          {/* Body Section */}
          <div style={{ textAlign: 'center', zIndex: 10, paddingLeft: '32px', paddingRight: '32px' }}>
            <p style={{ fontStyle: 'italic', fontSize: '15px', color: '#334155', margin: '4px 0 8px' }}>
              This is to certify that
            </p>

            {/* Student Name */}
            <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#0c1838', letterSpacing: '1px', textTransform: 'capitalize', borderBottom: '2px solid #d4af37', paddingBottom: '6px', display: 'inline-block', paddingLeft: '36px', paddingRight: '36px', margin: '0 0 8px 0' }}>
              {studentName}
            </h2>

            <p style={{ fontSize: '13.5px', lineHeight: '1.5', color: '#334155', maxWidth: '620px', margin: '8px auto 4px' }}>
              has successfully fulfilled all curriculum requirements, practical assessments, and project evaluations for the specialized program in
            </p>

            {/* Course Title */}
            <h3 style={{ fontFamily: 'Arial, sans-serif', fontSize: '22px', fontWeight: '900', color: '#9a7b2c', textTransform: 'uppercase', letterSpacing: '1px', margin: '4px 0 8px' }}>
              {courseTitle}
            </h3>

            <p style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', fontWeight: '600', color: '#475569', margin: '6px 0 0 0' }}>
              Grade Standard: <span style={{ color: '#0c1838', fontWeight: '800' }}>{grade}</span> &nbsp;|&nbsp; Completed: <span style={{ color: '#0c1838', fontWeight: '800' }}>{formattedDate}</span>
            </p>
          </div>

          {/* Footer Section: QR Code, Official Logo Watermark Seal & Signatures */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'flex-end', paddingTop: '10px', marginBottom: '10px', borderTop: '1px solid rgba(212, 175, 55, 0.35)', zIndex: 10 }}>
            
            {/* Left: Scannable Verification QR Code */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '6px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.6)' }}>
                <QRCodeSVG value={redirectUrl} size={66} level="M" includeMargin={false} />
              </div>
              <div style={{ textAlign: 'left', fontFamily: 'Arial, sans-serif' }}>
                <p style={{ fontSize: '9.5px', fontWeight: '800', textTransform: 'uppercase', color: '#9a7b2c', margin: '0 0 2px 0' }}>
                  <ShieldCheck style={{ width: '12px', height: '12px', display: 'inline', marginRight: '3px', color: '#059669' }} /> Scan to Verify
                </p>
                <p style={{ fontSize: '8.5px', fontFamily: 'monospace', color: '#334155', fontWeight: '800', margin: '0 0 2px 0' }}>ID: {certificateId}</p>
                <p style={{ fontSize: '8px', color: '#64748b', margin: 0 }}>stuvaradhi.org/verify</p>
              </div>
            </div>

            {/* Center: Official StuVaradhi Logo Watermark Seal */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '74px', height: '74px', borderRadius: '50%', background: 'linear-gradient(135deg, #fef08a, #d4af37, #9a7b2c)', color: '#0c1838', border: '3.5px solid #0c1838', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justify: 'center', padding: '4px', boxShadow: '0 8px 12px -2px rgba(0,0,0,0.15)' }}>
                <img
                  src="/logo.png"
                  alt="Official Watermark Seal"
                  style={{ width: '32px', height: '32px', objectFit: 'contain', filter: 'brightness(0.95)' }}
                />
                <span style={{ fontFamily: 'Arial, sans-serif', fontSize: '6px', fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', lineHeight: '1', letterSpacing: '-0.1px', marginTop: '2px' }}>
                  OFFICIAL SEAL<br />VERIFIED CREDENTIAL
                </span>
              </div>
            </div>

            {/* Right: Instructor Signatures */}
            <div style={{ textAlign: 'right', fontFamily: 'Arial, sans-serif' }}>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '16.5px', fontWeight: 'bold', color: '#0c1838', borderBottom: '1px solid #94a3b8', paddingBottom: '2px', display: 'inline-block' }}>
                  {instructorName}
                </div>
                <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#9a7b2c', textTransform: 'uppercase', margin: '2px 0 0 0' }}>Faculty Mentor & Instructor</p>
              </div>

              <div>
                <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '16.5px', fontWeight: 'bold', color: '#0c1838', borderBottom: '1px solid #94a3b8', paddingBottom: '2px', display: 'inline-block' }}>
                  Dr. Rajesh Verma
                </div>
                <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#0c1838', textTransform: 'uppercase', margin: '2px 0 0 0' }}>Academic Director & Founder</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateTemplate;
