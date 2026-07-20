import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { classroomService } from '../../services/classroomService';
import { meetingService } from '../../services/meetingService';
import { certificateService } from '../../services/certificateService';
import { useAuth } from '../../context/AuthContext';
import CertificateTemplate from '../../components/certificate/CertificateTemplate';
import {
  BookOpen,
  Users,
  Video,
  FileText,
  Upload,
  Download,
  MessageSquare,
  Sparkles,
  Plus,
  X,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  CheckCircle2,
  Send,
  Clock,
  Award,
  Check,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ClassroomDetailPage = () => {
  const { id } = useParams();
  const { user, isFaculty, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resources'); // 'resources', 'announcements', 'doubts', or 'certificates'

  const currentUserId = (user?._id || user?.id)?.toString();
  const hasPendingDoubt = classroom?.doubts?.some((d) => {
    const sId = typeof d.student === 'object' ? d.student?._id?.toString() : d.student?.toString();
    return sId === currentUserId && d.status === 'pending';
  });

  // File upload modal state
  const [uploadModal, setUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileData, setFileData] = useState({ title: '', fileUrl: '', fileType: 'pdf' });
  const [uploading, setUploading] = useState(false);

  // Announcement state
  const [announcementText, setAnnouncementText] = useState('');

  // Doubts state
  const [askDoubtModal, setAskDoubtModal] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [replyDoubtModal, setReplyDoubtModal] = useState(null); // stores active doubt object to reply
  const [answerText, setAnswerText] = useState('');

  // Certificate state
  const [classroomCertificates, setClassroomCertificates] = useState([]);
  const [viewCertModal, setViewCertModal] = useState(null);
  const [issuingCertId, setIssuingCertId] = useState(null);

  const fetchClassroom = async () => {
    try {
      const data = await classroomService.getClassroomById(id);
      if (data.success) {
        setClassroom(data.classroom);
      }
    } catch (error) {
      toast.error('Failed to load classroom details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificates = async () => {
    try {
      if (isFaculty || isAdmin) {
        const res = await certificateService.getClassroomCertificates(id);
        if (res.success) {
          setClassroomCertificates(res.certificates || []);
        }
      } else {
        const res = await certificateService.getMyCertificates();
        if (res.success) {
          const myCert = (res.certificates || []).find(
            (c) => (c.classroom?._id || c.classroom)?.toString() === id
          );
          if (myCert) setClassroomCertificates([myCert]);
        }
      }
    } catch (err) {
      console.log('Error loading certificates:', err.message);
    }
  };

  useEffect(() => {
    fetchClassroom();
    fetchCertificates();
  }, [id]);

  const handleUploadFile = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const res = await classroomService.uploadResource(id, {
        title: fileData.title,
        fileUrl: fileData.fileUrl,
        fileType: fileData.fileType,
        file: selectedFile,
      });

      if (res.success) {
        toast.success('Resource saved to backend server and shared!');
        setUploadModal(false);
        setSelectedFile(null);
        setFileData({ title: '', fileUrl: '', fileType: 'pdf' });
        fetchClassroom();
      }
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementText) return;

    try {
      const res = await classroomService.postAnnouncement(id, announcementText);
      if (res.success) {
        toast.success('Announcement posted');
        setAnnouncementText('');
        fetchClassroom();
      }
    } catch (error) {
      toast.error('Failed to post announcement');
    }
  };

  const handleAskDoubt = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    try {
      const res = await classroomService.askDoubt(id, questionText);
      if (res.success) {
        toast.success('Doubt submitted to teacher!');
        setAskDoubtModal(false);
        setQuestionText('');
        fetchClassroom();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit doubt');
    }
  };

  const handleAnswerDoubt = async (e) => {
    e.preventDefault();
    if (!answerText.trim() || !replyDoubtModal) return;

    try {
      const res = await classroomService.answerDoubt(id, replyDoubtModal._id, answerText);
      if (res.success) {
        toast.success('Doubt marked as resolved!');
        setReplyDoubtModal(null);
        setAnswerText('');
        fetchClassroom();
      }
    } catch (error) {
      toast.error('Failed to answer doubt');
    }
  };

  const handleStartOrJoinMeet = async () => {
    const meetId = `meet-${id}`;
    if (isFaculty || isAdmin) {
      try {
        const res = await meetingService.createMeeting(`Live Class: ${classroom.title}`, id);
        if (res.success) {
          toast.success('Live Virtual Meeting Initialized');
          navigate(res.joinUrl);
          return;
        }
      } catch (error) {
        console.log('Error launching meeting:', error);
      }
    }
    navigate(`/classroom/${id}/meet/${meetId}`);
  };

  // Faculty Mark Course Completed & Issue Certificate
  const handleIssueCertificate = async (studentId) => {
    setIssuingCertId(studentId);
    try {
      const res = await certificateService.issueCertificate({
        studentId,
        classroomId: id,
        grade: 'Excellence',
      });

      if (res.success && res.certificate) {
        toast.success('🎓 Course Completed & Certificate Issued Successfully!');
        setViewCertModal(res.certificate);
        fetchCertificates();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to issue certificate');
    } finally {
      setIssuingCertId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="p-8 text-center text-slate-500">
        <h2 className="text-xl font-bold">Classroom Not Found</h2>
      </div>
    );
  }

  const canShareFiles = isFaculty || isAdmin;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Classroom Hero Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 text-white space-y-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                CODE: {classroom.code}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-indigo-300">{classroom.subject}</span>
            </div>
            <h1 className="text-3xl font-black">{classroom.title}</h1>
            <p className="text-xs text-slate-300 max-w-2xl">{classroom.description}</p>
          </div>

          <button
            onClick={handleStartOrJoinMeet}
            className="w-full md:w-auto px-6 py-3.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 shadow-glow transition-all flex items-center justify-center gap-2"
          >
            <Video className="w-4 h-4" />
            {isFaculty ? 'Launch Live Meeting Session' : isAdmin ? 'Join Live Meeting' : 'Join Live Class Meeting'}
          </button>
        </div>

        {/* Assigned Mentor Details */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            {classroom.faculty?.profileImage ? (
              <img
                src={classroom.faculty.profileImage}
                alt={classroom.faculty.name}
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-400"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm ring-2 ring-indigo-400">
                {classroom.faculty?.name?.charAt(0) || 'F'}
              </div>
            )}
            <div>
              <p className="font-bold text-white">{classroom.faculty?.name || 'Primary Faculty'}</p>
              <p className="text-[11px] text-slate-400">{classroom.faculty?.department || 'Lead Instructor'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              {classroom.students?.length || 0} Enrolled Students
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-400" />
              {classroom.resources?.length || 0} Shared Documents
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => setActiveTab('resources')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'resources'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Classroom Shared Files & Resources ({classroom.resources?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('doubts')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'doubts'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Doubts & Q&A Clearing ({classroom.doubts?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'announcements'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Class Feed & Announcements ({classroom.announcements?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('certificates')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'certificates'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            Certificates & Completion 🎓
          </button>
        </div>

        {canShareFiles && activeTab === 'resources' && (
          <button
            onClick={() => setUploadModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Upload File / Image
          </button>
        )}

        {activeTab === 'doubts' && (
          <div>
            {hasPendingDoubt ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                <span>Pending Doubt Under Review (1 max)</span>
              </div>
            ) : (
              <button
                onClick={() => setAskDoubtModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm"
              >
                <HelpCircle className="w-4 h-4" />
                Ask a Doubt / Question
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tab 1: Shared Files & Resources */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          {classroom.resources?.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl text-center space-y-2 border border-slate-200 dark:border-slate-800">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-900 dark:text-white">No Shared Files Yet</p>
              <p className="text-xs text-slate-500">Teacher shared documents and images saved on server will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classroom.resources.map((res, idx) => (
                <div
                  key={idx}
                  className="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        {res.fileType || 'Document'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(res.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">{res.title}</h4>
                    <p className="text-[11px] text-slate-500">Uploaded by {res.uploadedBy?.name || 'Instructor'}</p>
                  </div>

                  <a
                    href={res.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Saved File
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Doubts & Q&A Clearing */}
      {activeTab === 'doubts' && (
        <div className="space-y-4">
          {classroom.doubts?.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl text-center space-y-2 border border-slate-200 dark:border-slate-800">
              <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-900 dark:text-white">No Doubts Raised Yet</p>
              <p className="text-xs text-slate-500">Students can ask questions here for teacher clarification.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {classroom.doubts.map((doubt) => (
                <div
                  key={doubt._id}
                  className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {doubt.student?.name || 'Student'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(doubt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{doubt.question}</p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        doubt.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {doubt.status}
                    </span>
                  </div>

                  {/* Answers */}
                  {doubt.answers?.length > 0 && (
                    <div className="pl-4 border-l-2 border-indigo-500 space-y-2">
                      {doubt.answers.map((ans, aIdx) => (
                        <div key={aIdx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                          <p className="font-bold text-indigo-600 dark:text-indigo-400">
                            {ans.author?.name || 'Faculty Instructor'}
                          </p>
                          <p className="text-slate-700 dark:text-slate-300">{ans.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Faculty Reply Action */}
                  {(isFaculty || isAdmin) && doubt.status === 'pending' && (
                    <button
                      onClick={() => setReplyDoubtModal(doubt)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Answer & Resolve Doubt
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          {canShareFiles && (
            <form onSubmit={handlePostAnnouncement} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <textarea
                rows={3}
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Write an announcement for all classroom students..."
                className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Post Announcement
              </button>
            </form>
          )}

          <div className="space-y-4">
            {classroom.announcements?.map((anc) => (
              <div key={anc._id} className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{anc.author?.name || 'Instructor'}</span>
                  <span className="text-[10px] text-slate-400">{new Date(anc.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{anc.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Certificates & Course Completion 🎓 */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-indigo-500/20 bg-slate-900 text-white space-y-3 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black">Official Course Completion Credentials</h3>
                <p className="text-xs text-slate-400">
                  {isFaculty || isAdmin
                    ? 'Faculty Control: Mark student as completed to automatically generate & issue official QR-verifiable certificate.'
                    : 'Download your official QR-verifiable Course Completion Certificate in PNG & PDF formats.'}
                </p>
              </div>
            </div>
          </div>

          {/* Faculty Student Completion List */}
          {(isFaculty || isAdmin) ? (
            <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Enrolled Students ({classroom.students?.length || 0})
              </h4>

              {classroom.students?.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No students currently enrolled in this classroom.</p>
              ) : (
                <div className="space-y-3">
                  {classroom.students?.map((studentObj) => {
                    const sId = typeof studentObj === 'object' ? (studentObj._id || studentObj.id)?.toString() : studentObj?.toString();
                    const sName = typeof studentObj === 'object' ? studentObj.name : 'Student';
                    const sEmail = typeof studentObj === 'object' ? studentObj.email : '';
                    
                    const existingCert = classroomCertificates.find(
                      (c) => (c.student?._id || c.student)?.toString() === sId
                    );

                    return (
                      <div
                        key={sId}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                            {sName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{sName}</p>
                            <p className="text-[11px] text-slate-400">{sEmail}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                          {existingCert ? (
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Completed 🎓
                              </span>

                              <button
                                onClick={() => setViewCertModal(existingCert)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 shadow-sm"
                              >
                                <Eye className="w-3.5 h-3.5" /> View Certificate
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleIssueCertificate(sId)}
                              disabled={issuingCertId === sId}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-glow transition-all flex items-center gap-1.5"
                            >
                              <Award className="w-4 h-4" />
                              {issuingCertId === sId ? 'Generating Certificate...' : 'Mark Completed & Issue Certificate'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Student Certificate View */
            <div className="space-y-6">
              {classroomCertificates.length === 0 ? (
                <div className="glass-card p-12 rounded-3xl text-center space-y-3 border border-slate-200 dark:border-slate-800">
                  <Award className="w-10 h-10 text-slate-400 mx-auto" />
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Certificate Pending</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Your host faculty mentor will mark your course as completed upon verifying your classroom performance. Your verifiable certificate will appear here.
                  </p>
                </div>
              ) : (
                <CertificateTemplate certificate={classroomCertificates[0]} showActions={true} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Shared File Upload */}
      {uploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Upload Shared Material</h3>
              <button onClick={() => setUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadFile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={fileData.title}
                  onChange={(e) => setFileData({ ...fileData, title: e.target.value })}
                  placeholder="e.g. Lecture Notes & Source Code"
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Select File from Device</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Or Provide Direct File URL</label>
                <input
                  type="text"
                  value={fileData.fileUrl}
                  onChange={(e) => setFileData({ ...fileData, fileUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md flex items-center justify-center gap-2"
              >
                {uploading ? 'Saving File to Server...' : 'Upload & Save to Backend'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Student Ask Doubt */}
      {askDoubtModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Ask a Doubt / Question</h3>
              <button onClick={() => setAskDoubtModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAskDoubt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Question / Doubt Details</label>
                <textarea
                  rows={4}
                  required
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Explain your question or confusion in detail..."
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-brand-600 hover:bg-brand-700 shadow-md"
              >
                Submit Question to Mentor
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Faculty / Admin Answer Doubt */}
      {replyDoubtModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Clear Student Doubt</h3>
              <button onClick={() => setReplyDoubtModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
              <p className="font-bold text-slate-900 dark:text-white">Doubt: {replyDoubtModal.question}</p>
              <p className="text-[10px] text-slate-500">Asked by {replyDoubtModal.student?.name}</p>
            </div>

            <form onSubmit={handleAnswerDoubt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Your Explanation / Answer</label>
                <textarea
                  rows={4}
                  required
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Type clear solution or guidance to resolve this doubt..."
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-md"
              >
                Clear Doubt & Send Answer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Full Certificate Preview & Download Modal */}
      {viewCertModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card max-w-5xl w-full p-6 rounded-3xl border border-slate-800 bg-slate-900 text-white space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-white">Course Completion Certificate Preview</h3>
              </div>
              <button onClick={() => setViewCertModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <CertificateTemplate certificate={viewCertModal} showActions={true} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomDetailPage;
