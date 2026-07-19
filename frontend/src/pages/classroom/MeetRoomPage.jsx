import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { meetingService } from '../../services/meetingService';
import { useAuth } from '../../context/AuthContext';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  MessageSquare,
  Users,
  PhoneOff,
  Check,
  X,
  Send,
  Clock,
  Sparkles,
  ShieldCheck,
  Copy,
  Monitor,
  MonitorOff,
  UserX,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Helper WebRTC Media Stream Video Player Component
const VideoStream = ({ stream, isMuted = false, className = '' }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isMuted}
      className={className}
    />
  );
};

const MeetRoomPage = () => {
  const { classId, meetId } = useParams();
  const { user, isFaculty, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmitted, setIsAdmitted] = useState(false);
  const [isLobbyWaiting, setIsLobbyWaiting] = useState(false);

  // Hardware Media States
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  // Media Streams
  const [mediaStream, setMediaStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  // Side Drawer UI
  const [activeDrawer, setActiveDrawer] = useState(null); // 'participants' or 'chat'
  const [chatText, setChatText] = useState('');

  const isHost =
    meeting?.host?._id === user?.id ||
    meeting?.host === user?.id ||
    isFaculty ||
    isAdmin;

  // Initialize Hardware Camera & Microphone
  const initSystemHardware = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setMediaStream(stream);
      }
    } catch (err) {
      console.warn('System media devices fallback:', err.message);
    }
  };

  const cleanupStreams = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
  };

  // Poll meeting details & check if meeting was ended or student was kicked
  const syncMeeting = async () => {
    try {
      const data = await meetingService.getMeetingDetails(meetId);
      if (data.success && data.meeting) {
        const currentUserId = (user?._id || user?.id || '')?.toString();

        // Eject if host ended meeting
        if (data.meeting.status === 'ended') {
          toast.error('The host teacher has ended the meeting session.');
          cleanupStreams();
          navigate(`/classroom/${classId}`);
          return;
        }

        // Eject if student was kicked by host
        const isKicked = data.meeting?.kickedParticipants?.some((kp) => {
          const kId = typeof kp === 'object' ? kp?._id?.toString() : kp?.toString();
          return kId && kId === currentUserId;
        });

        if (isKicked && !isHost && !isAdmin) {
          toast.error('You have been removed from the meeting by the teacher.');
          cleanupStreams();
          navigate(`/classroom/${classId}`);
          return;
        }

        setMeeting(data.meeting);

        const hostIdStr = (data.meeting?.host?._id || data.meeting?.host || '')?.toString();
        const isHostOrAdmitted =
          isHost ||
          isFaculty ||
          isAdmin ||
          (currentUserId && hostIdStr && currentUserId === hostIdStr) ||
          data.meeting?.admittedParticipants?.some((p) => {
            const pId = typeof p === 'object' ? (p?._id ? p._id.toString() : '') : p?.toString();
            return pId && currentUserId && pId === currentUserId;
          });

        if (isHostOrAdmitted) {
          if (!isAdmitted) {
            setIsAdmitted(true);
            setIsLobbyWaiting(false);
            initSystemHardware();
          }
        } else {
          setIsAdmitted(false);
        }
      }
    } catch (error) {
      console.log('Error syncing meeting state:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncMeeting();
    const interval = setInterval(syncMeeting, 3000); // Polling every 3s
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Broadcast Mic / Cam / Screen Share state changes
  useEffect(() => {
    if (isAdmitted) {
      meetingService.updateMediaState(meetId, {
        micOn,
        camOn,
        isScreenSharing: isSharingScreen,
      }).catch(() => {});
    }
  }, [micOn, camOn, isSharingScreen, isAdmitted, meetId]);

  // Window unload listener to remove participant
  useEffect(() => {
    const handleUnload = () => {
      meetingService.leaveMeeting(meetId);
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      meetingService.leaveMeeting(meetId);
      cleanupStreams();
    };
  }, [meetId]);

  // Hardware Camera Toggle
  const toggleCamera = () => {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !camOn;
      }
    }
    setCamOn(!camOn);
    toast(camOn ? 'Camera Turned Off' : 'Camera Turned On', { icon: camOn ? '📷' : '📹' });
  };

  // Hardware Mic Toggle
  const toggleMicrophone = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micOn;
      }
    }
    setMicOn(!micOn);
    toast(micOn ? 'Microphone Muted' : 'Microphone Unmuted', { icon: micOn ? '🔇' : '🎙️' });
  };

  // Screen Sharing Option
  const toggleScreenShare = async () => {
    if (isSharingScreen) {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
      setIsSharingScreen(false);
      setScreenStream(null);
      await meetingService.updateMediaState(meetId, { micOn, camOn, isScreenSharing: false }).catch(() => {});
      toast('Screen Sharing Stopped');
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
          setScreenStream(stream);
          setIsSharingScreen(true);
          await meetingService.updateMediaState(meetId, { micOn, camOn, isScreenSharing: true }).catch(() => {});
          toast.success('🖥️ Desktop Screen Sharing Started');

          stream.getVideoTracks()[0].onended = async () => {
            setIsSharingScreen(false);
            setScreenStream(null);
            await meetingService.updateMediaState(meetId, { micOn, camOn, isScreenSharing: false }).catch(() => {});
          };
        } else {
          toast.error('Screen sharing not supported in this browser');
        }
      } catch (error) {
        console.warn('Screen share cancelled or failed:', error.message);
      }
    }
  };

  // Request to Join Lobby
  const handleRequestJoin = async () => {
    if (isHost || isFaculty || isAdmin) {
      setIsAdmitted(true);
      setIsLobbyWaiting(false);
      initSystemHardware();
      return;
    }

    setIsLobbyWaiting(true);
    try {
      const res = await meetingService.requestJoin(meetId);
      if (res.success) {
        if (res.isAdmitted) {
          setIsAdmitted(true);
          setIsLobbyWaiting(false);
          initSystemHardware();
          toast.success('Admitted to meeting!');
        } else {
          toast.success('Join request sent to teacher');
        }
      }
    } catch (error) {
      toast.error('Failed to request join');
    }
  };

  // Host Admit / Deny Student
  const handleRespondJoin = async (studentId, action) => {
    try {
      const res = await meetingService.respondJoinRequest(meetId, studentId, action);
      if (res.success) {
        toast.success(`Student request ${action === 'admit' ? 'Admitted' : 'Denied'}`);
        syncMeeting();
      }
    } catch (error) {
      toast.error('Failed to respond to join request');
    }
  };

  // Host Admit All Students at Once
  const handleAdmitAll = async () => {
    try {
      const res = await meetingService.admitAllJoinRequests(meetId);
      if (res.success) {
        toast.success('All pending student requests admitted!');
        syncMeeting();
      }
    } catch (error) {
      toast.error('Failed to admit all students');
    }
  };

  // Host Remove / Kick Student Anytime
  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Remove this student from the live call?')) return;
    try {
      const res = await meetingService.removeParticipant(meetId, studentId);
      if (res.success) {
        toast.success('Student removed from live call');
        syncMeeting();
      }
    } catch (error) {
      toast.error('Failed to remove student');
    }
  };

  // Toggle Raise Hand
  const handleToggleRaiseHand = async () => {
    try {
      const res = await meetingService.toggleRaiseHand(meetId);
      if (res.success) {
        setHandRaised(res.isHandRaised);
        toast(res.isHandRaised ? '✋ Hand Raised' : 'Hand Lowered', { icon: '✋' });
        syncMeeting();
      }
    } catch (error) {
      toast.error('Failed to toggle raise hand');
    }
  };

  // Send In-Call Chat Message
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatText.trim()) return;

    try {
      const res = await meetingService.sendChatMessage(meetId, chatText);
      if (res.success) {
        setChatText('');
        syncMeeting();
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  // End Call for Everyone (Host) or Leave Call (Student)
  const handleLeaveCall = async () => {
    cleanupStreams();
    try {
      await meetingService.leaveMeeting(meetId);
    } catch (e) {
      console.log('Error leaving meeting:', e);
    }

    if (isHost) {
      await meetingService.endMeeting(meetId);
      toast.success('Meeting session ended for everyone.');
    } else {
      toast('Left the meeting session.');
    }
    navigate(`/classroom/${classId}`);
  };

  const copyMeetLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Meeting link copied to clipboard!');
  };

  // Unique Admitted Participants (Deduplicated)
  const uniqueAdmittedParticipants = Array.from(
    new Map(
      (meeting?.admittedParticipants || [])
        .filter((p) => p && (p._id || p))
        .map((p) => [typeof p === 'object' ? p._id.toString() : p.toString(), p])
    ).values()
  );

  // Active Screen Sharer Details
  const activeSharerId = meeting?.activeScreenSharer?.userId
    ? (meeting.activeScreenSharer.userId._id || meeting.activeScreenSharer.userId).toString()
    : null;
  const activeSharerName = meeting?.activeScreenSharer?.userName;
  const showScreenStage = isSharingScreen || (activeSharerId && activeSharerName);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-400">Connecting to StuVaradhi Live Call...</p>
        </div>
      </div>
    );
  }

  // Pre-Join Lobby View for Students needing Permission
  if (!isAdmitted && !isHost && !isFaculty && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="glass-card max-w-lg w-full p-8 rounded-3xl border border-slate-800 bg-slate-900/90 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-brand-600/20 text-brand-400 flex items-center justify-center mx-auto ring-4 ring-brand-500/20">
            <Sparkles className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black">{meeting?.title || 'Virtual Classroom Meeting'}</h2>
            <p className="text-xs text-slate-400 mt-1">StuVaradhi Encrypted Live Call Room</p>
          </div>

          {isLobbyWaiting ? (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 space-y-2">
              <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-xs">
                <Clock className="w-4 h-4 animate-spin" />
                <span>Waiting for teacher permission to admit you...</span>
              </div>
              <p className="text-[11px] text-slate-400">Please stay on this page. Your host teacher will let you in shortly.</p>
            </div>
          ) : (
            <button
              onClick={handleRequestJoin}
              className="w-full py-3.5 rounded-2xl font-bold text-xs text-white bg-brand-600 hover:bg-brand-700 shadow-glow transition-all"
            >
              Ask Permission to Join Call
            </button>
          )}

          <button
            onClick={() => navigate(`/classroom/${classId}`)}
            className="text-xs text-slate-500 hover:text-slate-300 underline block mx-auto"
          >
            Cancel & Return to Classroom
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col justify-between overflow-hidden relative font-sans">
      {/* Header Bar */}
      <header className="px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black text-xs shadow-glow">
            SV
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white">{meeting?.title}</h1>
            <p className="text-[10px] text-slate-400">Host: {meeting?.host?.name || 'Faculty Instructor'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={copyMeetLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Share Link
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            Encrypted Live Call
          </span>
        </div>
      </header>

      {/* Host Real-Time Lobby Admission Alert Banner */}
      {isHost && meeting?.pendingRequests?.length > 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 glass-panel p-4 rounded-2xl border border-amber-500/50 bg-slate-900/95 text-white space-y-3 shadow-2xl min-w-[340px]">
          <div className="flex items-center justify-between text-xs font-bold text-amber-400">
            <span>Students asking to join ({meeting.pendingRequests.length})</span>
            <button
              onClick={handleAdmitAll}
              className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" /> Admit All Students
            </button>
          </div>

          <div className="space-y-2 max-h-36 overflow-y-auto">
            {meeting.pendingRequests.map((reqUser) => (
              <div key={reqUser._id} className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 text-xs">
                <span className="font-semibold text-slate-200">{reqUser.name}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRespondJoin(reqUser._id, 'admit')}
                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Admit
                  </button>
                  <button
                    onClick={() => handleRespondJoin(reqUser._id, 'deny')}
                    className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Call View Layout */}
      <div className="flex-1 p-4 md:p-6 flex gap-4 overflow-hidden relative">
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          
          {/* Main Google Meet-Style Screen Sharing Presenter Stage */}
          {showScreenStage && (
            <div className="relative bg-slate-900 rounded-3xl border-2 border-indigo-500/80 overflow-hidden flex-1 min-h-[320px] flex items-center justify-center shadow-2xl">
              {isSharingScreen && screenStream ? (
                <VideoStream stream={screenStream} isMuted={true} className="w-full h-full object-contain bg-black" />
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3 p-8 text-center bg-slate-950/90 w-full h-full">
                  <Monitor className="w-16 h-16 text-indigo-400 animate-pulse" />
                  <p className="text-sm font-bold text-white">Live Desktop Screen Presentation in Progress</p>
                  <p className="text-xs text-slate-400">Presenter: {activeSharerName || 'Presenter'}</p>
                </div>
              )}
              <div className="absolute top-4 left-4 bg-indigo-950/90 border border-indigo-700 px-4 py-2 rounded-2xl text-xs font-black text-indigo-200 flex items-center gap-2 shadow-lg z-10">
                <Monitor className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span>Active Screen Presentation: {activeSharerName || user?.name}</span>
              </div>
            </div>
          )}

          {/* Video Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto">
            {/* Local Video Tile */}
            <div className="relative bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden min-h-[220px] max-h-[380px] flex items-center justify-center shadow-lg">
              {camOn && mediaStream ? (
                <VideoStream stream={mediaStream} isMuted={true} className="w-full h-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-2xl font-black text-white ring-4 ring-slate-700">
                  {user?.name?.charAt(0)}
                </div>
              )}

              {/* Raised Hand Badge Overlay */}
              {handRaised && (
                <div className="absolute top-4 right-4 bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce z-10">
                  <Hand className="w-4 h-4" /> Hand Raised
                </div>
              )}

              <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 z-10">
                <span>{user?.name} (You)</span>
                {micOn ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
              </div>
            </div>

            {/* Other Admitted Participants Video Tiles (Deduplicated) */}
            {uniqueAdmittedParticipants
              .filter((p) => {
                if (!p) return false;
                const pId = typeof p === 'object' ? (p._id ? p._id.toString() : '') : p?.toString();
                const currentUserId = (user?._id || user?.id || '')?.toString();
                return pId && currentUserId && pId !== currentUserId;
              })
              .map((part) => {
                const partIdStr = typeof part === 'object' ? part._id?.toString() : part.toString();
                const isPartHost = partIdStr === (meeting?.host?._id ? meeting.host._id.toString() : meeting?.host?.toString());
                const hasHandUp = meeting?.raisedHands?.some((h) => {
                  const hId = typeof h === 'object' ? (h._id ? h._id.toString() : '') : h.toString();
                  return hId === partIdStr;
                });
                const partName = typeof part === 'object' ? part.name : 'Participant';
                const partImg = typeof part === 'object' ? part.profileImage : '';

                // Get participant media state
                const pMediaState = meeting?.participantMediaStates?.find(
                  (ms) => (ms.user?._id || ms.user)?.toString() === partIdStr
                );
                const isPartCamOn = pMediaState ? pMediaState.camOn : true;
                const isPartMicOn = pMediaState ? pMediaState.micOn : true;

                return (
                  <div
                    key={partIdStr || Math.random()}
                    className="relative bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden min-h-[220px] max-h-[380px] flex items-center justify-center shadow-lg"
                  >
                    {isPartCamOn && partImg ? (
                      <img
                        src={partImg}
                        alt={partName}
                        className="w-full h-full object-cover opacity-90"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-black text-3xl shadow-glow ring-4 ring-slate-800">
                        {partName?.charAt(0) || 'P'}
                      </div>
                    )}

                    {hasHandUp && (
                      <div className="absolute top-4 right-4 bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce z-10">
                        <Hand className="w-4 h-4" /> Hand Raised
                      </div>
                    )}

                    <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 z-10">
                      <span>{partName} {isPartHost && '(Host)'}</span>
                      {isPartMicOn ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Side Panel Drawer (Participants or Q&A Chat) */}
        {activeDrawer && (
          <aside className="w-80 bg-slate-900 rounded-3xl border border-slate-800 flex flex-col justify-between overflow-hidden shadow-2xl z-40">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                {activeDrawer === 'participants' ? 'People in Call' : 'In-Call Q&A Chat'}
              </h4>
              <button onClick={() => setActiveDrawer(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeDrawer === 'participants' && (
              <div className="p-4 flex-1 overflow-y-auto space-y-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Host Teacher</p>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 text-xs">
                  <span className="font-bold text-white">{meeting?.host?.name || 'Faculty Mentor'}</span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">Host</span>
                </div>

                <p className="text-[11px] font-bold text-slate-400 uppercase pt-2">Students ({uniqueAdmittedParticipants.length})</p>
                {uniqueAdmittedParticipants.map((p) => {
                  const pId = p._id || p;
                  const isPartHost = pId?.toString() === (meeting?.host?._id || meeting?.host)?.toString();
                  if (isPartHost) return null;

                  return (
                    <div key={pId} className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-slate-300 font-semibold">{p.name || 'Student'}</span>
                        {meeting?.raisedHands?.some((h) => (h._id || h) === pId) && (
                          <span className="text-amber-400 font-bold">✋ Raised</span>
                        )}
                      </div>

                      {(isHost || isFaculty || isAdmin) && (
                        <button
                          onClick={() => handleRemoveStudent(pId)}
                          className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-400 hover:text-rose-200 text-[10px] font-bold flex items-center gap-1 border border-rose-900/50"
                          title="Remove student from meeting"
                        >
                          <UserX className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeDrawer === 'chat' && (
              <div className="flex-1 flex flex-col justify-between p-4 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {meeting?.messages?.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">No chat messages yet. Ask a question below.</p>
                  ) : (
                    meeting?.messages?.map((msg, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-brand-400">{msg.senderName}</span>
                          <span className="text-slate-500 text-[9px]">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-snug">{msg.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendChat} className="pt-3 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder="Type in-call question..."
                    className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-800 border border-slate-700 text-white focus:outline-none"
                  />
                  <button type="submit" className="p-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Floating Control Bar */}
      <footer className="px-6 py-4 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-center gap-4 z-30">
        <button
          onClick={toggleMicrophone}
          className={`p-3.5 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center ${
            micOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-600 text-white hover:bg-rose-700'
          }`}
          title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleCamera}
          className={`p-3.5 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center ${
            camOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-600 text-white hover:bg-rose-700'
          }`}
          title={camOn ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3.5 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center ${
            isSharingScreen ? 'bg-indigo-600 text-white ring-4 ring-indigo-400' : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
          title={isSharingScreen ? 'Stop Screen Sharing' : 'Share Screen Presentation'}
        >
          {isSharingScreen ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </button>

        <button
          onClick={handleToggleRaiseHand}
          className={`p-3.5 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center ${
            handRaised ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-400' : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
          title={handRaised ? 'Lower Hand' : 'Raise Hand'}
        >
          <Hand className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveDrawer(activeDrawer === 'participants' ? null : 'participants')}
          className={`p-3.5 rounded-2xl font-bold transition-all shadow-lg relative ${
            activeDrawer === 'participants' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
          title="View People in Call"
        >
          <Users className="w-5 h-5" />
          {uniqueAdmittedParticipants.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-brand-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
              {uniqueAdmittedParticipants.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveDrawer(activeDrawer === 'chat' ? null : 'chat')}
          className={`p-3.5 rounded-2xl font-bold transition-all shadow-lg relative ${
            activeDrawer === 'chat' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
          title="Open Q&A Chat"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        <button
          onClick={handleLeaveCall}
          className="px-6 py-3.5 rounded-2xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-glow flex items-center gap-2 ml-4"
        >
          <PhoneOff className="w-5 h-5" />
          {isHost ? 'End Call for All' : 'Leave Call'}
        </button>
      </footer>
    </div>
  );
};

export default MeetRoomPage;
