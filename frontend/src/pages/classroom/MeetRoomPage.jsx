import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { meetingService } from '../../services/meetingService';
import { useAuth } from '../../context/AuthContext';
import { initSocket, getSocket } from '../../services/socket';
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

// WebRTC STUN Server configuration for peer connection NAT traversal
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

// WebRTC Media Stream Video Player Component for Local & Remote Participants
const VideoStream = ({ stream, isMuted = false, className = '' }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current
        .play()
        .catch((err) => console.log('Video autoplay handled:', err.message));
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      webkit-playsinline="true"
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

  // Local Media Streams
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const localStreamRef = useRef(null);

  // WebRTC Peer Connections map & Remote Streams state
  // key: socketId, value: { peerConnection, stream, user, micOn, camOn, isScreenSharing }
  const peersRef = useRef(new Map());
  const [remotePeers, setRemotePeers] = useState([]);

  // Screen Sharing State across peers
  const [activeScreenSharer, setActiveScreenSharer] = useState(null);
  const [remoteScreenStream, setRemoteScreenStream] = useState(null);

  // Side Drawer UI
  const [activeDrawer, setActiveDrawer] = useState(null); // 'participants' or 'chat'
  const [chatText, setChatText] = useState('');
  const [messages, setMessages] = useState([]);
  const [pendingLobbyUsers, setPendingLobbyUsers] = useState([]);
  const [raisedHandsList, setRaisedHandsList] = useState([]);

  const isHost =
    meeting?.host?._id === user?.id ||
    meeting?.host === user?.id ||
    isFaculty ||
    isAdmin;

  // Cleanup WebRTC & Hardware Media Streams
  const cleanupStreams = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
    }

    // Close all Peer Connections
    peersRef.current.forEach(({ pc }) => {
      if (pc) pc.close();
    });
    peersRef.current.clear();
    setRemotePeers([]);
  }, [screenStream]);

  // Update Remote Peers React state
  const updateRemotePeersState = useCallback(() => {
    const list = Array.from(peersRef.current.entries()).map(([sId, data]) => ({
      socketId: sId,
      stream: data.stream,
      user: data.user,
      micOn: data.micOn,
      camOn: data.camOn,
      isScreenSharing: data.isScreenSharing,
    }));
    setRemotePeers(list);
  }, []);

  const removePeer = useCallback((socketId) => {
    if (peersRef.current.has(socketId)) {
      const { pc } = peersRef.current.get(socketId);
      if (pc) pc.close();
      peersRef.current.delete(socketId);
      updateRemotePeersState();
    }
  }, [updateRemotePeersState]);

  // Create a WebRTC PeerConnection for a target remote socket
  const createPeerConnection = useCallback(
    (targetSocketId, remoteUser, isInitiator = false) => {
      if (peersRef.current.has(targetSocketId)) {
        return peersRef.current.get(targetSocketId).pc;
      }

      const socket = getSocket();
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local media tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc-ice-candidate', {
            toSocketId: targetSocketId,
            candidate: event.candidate,
          });
        }
      };

      // Handle ICE Disconnect / Network Failure Auto-Restart
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed') {
          console.warn('WebRTC ICE Connection Failed - Restarting ICE...');
          pc.restartIce();
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          removePeer(targetSocketId);
        }
      };

      // Handle Remote Tracks (Audio & Video)
      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        if (!remoteStream) return;

        peersRef.current.set(targetSocketId, {
          pc,
          stream: remoteStream,
          user: remoteUser,
          micOn: remoteUser?.micOn ?? true,
          camOn: remoteUser?.camOn ?? true,
          isScreenSharing: remoteUser?.isScreenSharing ?? false,
        });

        updateRemotePeersState();
      };

      peersRef.current.set(targetSocketId, {
        pc,
        stream: null,
        user: remoteUser,
        micOn: remoteUser?.micOn ?? true,
        camOn: remoteUser?.camOn ?? true,
        isScreenSharing: remoteUser?.isScreenSharing ?? false,
      });

      // If caller/initiator, create SDP offer
      if (isInitiator) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            socket.emit('webrtc-offer', {
              toSocketId: targetSocketId,
              offer: pc.localDescription,
              callerUser: {
                _id: user?._id || user?.id,
                name: user?.name,
                micOn,
                camOn,
              },
            });
          })
          .catch((err) => console.error('Error creating SDP offer:', err));
      }

      return pc;
    },
    [micOn, camOn, user, removePeer, updateRemotePeersState]
  );

  // Initialize Microphone & Camera hardware with automatic fallbacks
  const initSystemHardware = async () => {
    if (localStreamRef.current) return localStreamRef.current;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        let stream = null;
        try {
          // Attempt Full Audio + Video
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true,
          });
        } catch (videoErr) {
          console.warn('Video access failed, falling back to Audio-only:', videoErr.message);
          toast('Camera access unavailable. Fallback to Microphone-only mode.', { icon: '🎙️' });
          setCamOn(false);
          // Fallback to Audio only
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
        }

        setLocalStream(stream);
        localStreamRef.current = stream;
        return stream;
      }
    } catch (err) {
      console.warn('Hardware media fallback to view-only mode:', err.message);
      toast.error('Could not access microphone/camera. Connected in View-only mode.');
      setCamOn(false);
      setMicOn(false);
    }
    return null;
  };

  // Fetch initial meeting details
  const fetchMeetingDetailsOnce = async () => {
    try {
      const data = await meetingService.getMeetingDetails(meetId);
      if (data.success && data.meeting) {
        if (data.meeting.status === 'ended') {
          toast.error('The host teacher has ended this meeting.');
          navigate(`/classroom/${classId}`);
          return;
        }

        setMeeting(data.meeting);
        setMessages(data.meeting.messages || []);
        setPendingLobbyUsers(data.meeting.pendingRequests || []);
        setRaisedHandsList(data.meeting.raisedHands || []);

        const currentUserId = (user?._id || user?.id || '')?.toString();
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
          setIsAdmitted(true);
          setIsLobbyWaiting(false);
          await initSystemHardware();
        } else {
          setIsAdmitted(false);
        }
      }
    } catch (error) {
      console.error('Error loading meeting details:', error);
      toast.error('Could not load meeting session.');
    } finally {
      setLoading(false);
    }
  };

  // Fallback Polling while student is waiting in lobby to ensure admission happens smoothly
  useEffect(() => {
    let lobbyInterval = null;
    if (!isAdmitted && user) {
      lobbyInterval = setInterval(async () => {
        try {
          const data = await meetingService.getMeetingDetails(meetId);
          if (data.success && data.meeting) {
            const currentUserId = (user?._id || user?.id || '')?.toString();
            const isNowAdmitted = data.meeting?.admittedParticipants?.some((p) => {
              const pId = typeof p === 'object' ? (p?._id ? p._id.toString() : '') : p?.toString();
              return pId && currentUserId && pId === currentUserId;
            });

            if (isNowAdmitted) {
              setIsAdmitted(true);
              setIsLobbyWaiting(false);
              await initSystemHardware();
              toast.success('You have been admitted to the meeting!');
            }
          }
        } catch (err) {
          console.log('Lobby poll error:', err.message);
        }
      }, 2500);
    }

    return () => {
      if (lobbyInterval) clearInterval(lobbyInterval);
    };
  }, [isAdmitted, user, meetId]);

  // Main Socket Signaling & Event Listeners
  useEffect(() => {
    fetchMeetingDetailsOnce();

    const socket = initSocket();

    // ALWAYS emit join-room so socket server has user registered in room (even in lobby mode)
    if (user && meetId) {
      socket.emit('join-room', {
        meetId,
        user: {
          _id: user._id || user.id,
          name: user.name,
          profileImage: user.profileImage,
          role: user.role,
          micOn,
          camOn,
        },
      });
    }

    // Auto re-join room if socket reconnects
    const handleSocketConnect = () => {
      if (user && meetId) {
        socket.emit('join-room', {
          meetId,
          user: {
            _id: user._id || user.id,
            name: user.name,
            profileImage: user.profileImage,
            role: user.role,
            micOn,
            camOn,
          },
        });
      }
    };
    socket.on('connect', handleSocketConnect);

    // Socket Signaling Event Handlers
    socket.on('existing-participants', (existingUsers) => {
      if (!isAdmitted) return;
      existingUsers.forEach(({ socketId: peerSocketId, user: peerUser }) => {
        if (peerSocketId !== socket.id) {
          createPeerConnection(peerSocketId, peerUser, true);
        }
      });
    });

    socket.on('user-joined', ({ socketId: newSocketId, user: newUser }) => {
      if (isAdmitted) {
        toast.success(`${newUser.name || 'Participant'} joined the call`);
        createPeerConnection(newSocketId, newUser, false);
      }
    });

    socket.on('webrtc-offer', async ({ fromSocketId, offer, callerUser }) => {
      if (!isAdmitted) return;
      try {
        const pc = createPeerConnection(fromSocketId, callerUser, false);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc-answer', {
          toSocketId: fromSocketId,
          answer: pc.localDescription,
        });
      } catch (err) {
        console.error('Error handling WebRTC offer:', err);
      }
    });

    socket.on('webrtc-answer', async ({ fromSocketId, answer }) => {
      try {
        if (peersRef.current.has(fromSocketId)) {
          const { pc } = peersRef.current.get(fromSocketId);
          if (pc && pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
        }
      } catch (err) {
        console.error('Error handling WebRTC answer:', err);
      }
    });

    socket.on('webrtc-ice-candidate', async ({ fromSocketId, candidate }) => {
      try {
        if (peersRef.current.has(fromSocketId)) {
          const { pc } = peersRef.current.get(fromSocketId);
          if (pc && candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });

    socket.on('participant-media-changed', ({ socketId: sId, micOn: pMic, camOn: pCam, isScreenSharing: pScreen }) => {
      if (peersRef.current.has(sId)) {
        const item = peersRef.current.get(sId);
        item.micOn = pMic;
        item.camOn = pCam;
        item.isScreenSharing = pScreen;
        updateRemotePeersState();
      }
    });

    socket.on('screen-share-updated', ({ socketId: sId, userId: sUserId, userName: sName, isSharing }) => {
      if (isSharing) {
        setActiveScreenSharer({ socketId: sId, userId: sUserId, userName: sName });
        toast(`${sName || 'A user'} started sharing screen`, { icon: '🖥️' });

        if (peersRef.current.has(sId)) {
          const peerItem = peersRef.current.get(sId);
          if (peerItem.stream) {
            setRemoteScreenStream(peerItem.stream);
          }
        }
      } else {
        setActiveScreenSharer(null);
        setRemoteScreenStream(null);
        toast('Screen sharing ended');
      }
    });

    socket.on('chat-message-received', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('raise-hand-updated', ({ userId: rUserId, isHandRaised: rStatus }) => {
      setRaisedHandsList((prev) => {
        const uIdStr = rUserId?.toString();
        if (rStatus) {
          if (!prev.some((h) => (h._id || h).toString() === uIdStr)) {
            return [...prev, { _id: rUserId }];
          }
          return prev;
        } else {
          return prev.filter((h) => (h._id || h).toString() !== uIdStr);
        }
      });
    });

    socket.on('lobby-student-request', ({ user: reqUser }) => {
      setPendingLobbyUsers((prev) => {
        const rId = (reqUser._id || reqUser.id)?.toString();
        if (!prev.some((u) => (u._id || u.id)?.toString() === rId)) {
          return [...prev, reqUser];
        }
        return prev;
      });
      toast(`Student ${reqUser.name} requested to join the call`, { icon: '🙋‍♂️' });
    });

    // Real-Time Lobby Admission Response Handler
    socket.on('lobby-student-response', async ({ studentId, action }) => {
      const currentUserId = (user?._id || user?.id)?.toString();
      if (studentId?.toString() === currentUserId) {
        if (action === 'admit') {
          setIsAdmitted(true);
          setIsLobbyWaiting(false);
          await initSystemHardware();
          toast.success('You have been admitted to the meeting!');
        } else {
          setIsLobbyWaiting(false);
          toast.error('Your request to join was denied by host teacher.');
        }
      }

      setPendingLobbyUsers((prev) =>
        prev.filter((u) => (u._id || u.id)?.toString() !== studentId?.toString())
      );
    });

    socket.on('lobby-admit-all-response', async () => {
      setIsAdmitted(true);
      setIsLobbyWaiting(false);
      await initSystemHardware();
      setPendingLobbyUsers([]);
      toast.success('You have been admitted to the meeting!');
    });

    socket.on('participant-kicked', ({ studentId }) => {
      const currentUserId = (user?._id || user?.id)?.toString();
      if (studentId?.toString() === currentUserId && !isHost) {
        toast.error('You have been removed from the meeting by the host.');
        cleanupStreams();
        navigate(`/classroom/${classId}`);
      }
    });

    socket.on('meeting-ended', () => {
      toast.error('The host teacher has ended the meeting session.');
      cleanupStreams();
      navigate(`/classroom/${classId}`);
    });

    socket.on('user-left', ({ socketId: leftSocketId }) => {
      removePeer(leftSocketId);
    });

    return () => {
      socket.off('connect', handleSocketConnect);
      socket.off('existing-participants');
      socket.off('user-joined');
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
      socket.off('participant-media-changed');
      socket.off('screen-share-updated');
      socket.off('chat-message-received');
      socket.off('raise-hand-updated');
      socket.off('lobby-student-request');
      socket.off('lobby-student-response');
      socket.off('lobby-admit-all-response');
      socket.off('participant-kicked');
      socket.off('meeting-ended');
      socket.off('user-left');
    };
  }, [
    isAdmitted,
    meetId,
    user,
    classId,
    navigate,
    createPeerConnection,
    isHost,
    cleanupStreams,
    removePeer,
    micOn,
    camOn,
  ]);

  // Window unload listener to leave room cleanly
  useEffect(() => {
    const handleUnload = () => {
      cleanupStreams();
      meetingService.leaveMeeting(meetId).catch(() => {});
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [meetId, cleanupStreams]);

  // Hardware Camera Toggle
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !camOn;
      }
    }
    const newCamState = !camOn;
    setCamOn(newCamState);

    const socket = getSocket();
    socket.emit('media-state-toggle', {
      meetId,
      micOn,
      camOn: newCamState,
      isScreenSharing,
    });

    meetingService.updateMediaState(meetId, { micOn, camOn: newCamState, isScreenSharing }).catch(() => {});
    toast(newCamState ? 'Camera Turned On' : 'Camera Turned Off', { icon: newCamState ? '📹' : '📷' });
  };

  // Hardware Mic Toggle
  const toggleMicrophone = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micOn;
      }
    }
    const newMicState = !micOn;
    setMicOn(newMicState);

    const socket = getSocket();
    socket.emit('media-state-toggle', {
      meetId,
      micOn: newMicState,
      camOn,
      isScreenSharing,
    });

    meetingService.updateMediaState(meetId, { micOn: newMicState, camOn, isScreenSharing }).catch(() => {});
    toast(newMicState ? 'Microphone Unmuted' : 'Microphone Muted', { icon: newMicState ? '🎙️' : '🔇' });
  };

  // Screen Sharing Toggle (WebRTC Track Replacement)
  const toggleScreenShare = async () => {
    const socket = getSocket();

    if (isSharingScreen) {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
      setIsSharingScreen(false);
      setScreenStream(null);

      // Revert video track in all active peer connections back to camera
      if (localStreamRef.current) {
        const camVideoTrack = localStreamRef.current.getVideoTracks()[0];
        peersRef.current.forEach(({ pc }) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender && camVideoTrack) {
            sender.replaceTrack(camVideoTrack);
          }
        });
      }

      socket.emit('screen-share-changed', { meetId, isSharing: false });
      meetingService.updateMediaState(meetId, { micOn, camOn, isScreenSharing: false }).catch(() => {});
      toast('Screen Sharing Stopped');
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: 'always' },
            audio: true,
          });
          setScreenStream(stream);
          setIsSharingScreen(true);

          const screenVideoTrack = stream.getVideoTracks()[0];

          // Replace camera track with desktop screen track in peer connections
          peersRef.current.forEach(({ pc }) => {
            const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
            if (sender && screenVideoTrack) {
              sender.replaceTrack(screenVideoTrack);
            }
          });

          socket.emit('screen-share-changed', {
            meetId,
            isSharing: true,
            userName: user?.name,
          });

          meetingService.updateMediaState(meetId, { micOn, camOn, isScreenSharing: true }).catch(() => {});
          toast.success('🖥️ Desktop Screen Sharing Started');

          screenVideoTrack.onended = () => {
            setIsSharingScreen(false);
            setScreenStream(null);
            if (localStreamRef.current) {
              const camVideoTrack = localStreamRef.current.getVideoTracks()[0];
              peersRef.current.forEach(({ pc }) => {
                const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
                if (sender && camVideoTrack) {
                  sender.replaceTrack(camVideoTrack);
                }
              });
            }
            socket.emit('screen-share-changed', { meetId, isSharing: false });
            meetingService.updateMediaState(meetId, { micOn, camOn, isScreenSharing: false }).catch(() => {});
          };
        } else {
          toast.error('Screen sharing capture is desktop-only on Mobile Chrome');
        }
      } catch (error) {
        console.warn('Screen share cancelled:', error.message);
      }
    }
  };

  // Student Request to Join Lobby
  const handleRequestJoin = async () => {
    if (isHost || isFaculty || isAdmin) {
      setIsAdmitted(true);
      setIsLobbyWaiting(false);
      await initSystemHardware();
      return;
    }

    setIsLobbyWaiting(true);
    try {
      const res = await meetingService.requestJoin(meetId);
      if (res.success) {
        if (res.isAdmitted) {
          setIsAdmitted(true);
          setIsLobbyWaiting(false);
          await initSystemHardware();
          toast.success('Admitted to meeting!');
        } else {
          const socket = getSocket();
          socket.emit('lobby-request-join', { meetId, user });
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
        const socket = getSocket();
        socket.emit('lobby-respond-join', { meetId, studentId, action });
        toast.success(`Student request ${action === 'admit' ? 'Admitted' : 'Denied'}`);
        setPendingLobbyUsers((prev) =>
          prev.filter((u) => (u._id || u.id)?.toString() !== studentId?.toString())
        );
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
        const socket = getSocket();
        socket.emit('lobby-admit-all', { meetId });
        toast.success('All pending student requests admitted!');
        setPendingLobbyUsers([]);
      }
    } catch (error) {
      toast.error('Failed to admit all students');
    }
  };

  // Host Remove / Kick Student
  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Remove this student from the live call?')) return;
    try {
      const res = await meetingService.removeParticipant(meetId, studentId);
      if (res.success) {
        const socket = getSocket();
        socket.emit('kick-participant', { meetId, studentId });
        toast.success('Student removed from live call');
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
        const newHandState = res.isHandRaised;
        setHandRaised(newHandState);
        const socket = getSocket();
        socket.emit('raise-hand-toggle', {
          meetId,
          userId: user?._id || user?.id,
          isHandRaised: newHandState,
        });
        toast(newHandState ? '✋ Hand Raised' : 'Hand Lowered', { icon: '✋' });
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
      if (res.success && res.message) {
        const socket = getSocket();
        socket.emit('chat-message-send', { meetId, message: res.message });
        setChatText('');
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  // Leave Call or End Call
  const handleLeaveCall = async () => {
    const socket = getSocket();
    cleanupStreams();

    try {
      await meetingService.leaveMeeting(meetId);
    } catch (e) {
      console.log('Error leaving meeting API:', e);
    }

    if (isHost) {
      socket.emit('end-meeting-session', { meetId });
      await meetingService.endMeeting(meetId).catch(() => {});
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

  // Active Screen Share view logic
  const showScreenStage = isSharingScreen || activeScreenSharer !== null;

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
            Encrypted WebRTC Call
          </span>
        </div>
      </header>

      {/* Host Real-Time Lobby Admission Alert Banner */}
      {isHost && pendingLobbyUsers.length > 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 glass-panel p-4 rounded-2xl border border-amber-500/50 bg-slate-900/95 text-white space-y-3 shadow-2xl min-w-[340px]">
          <div className="flex items-center justify-between text-xs font-bold text-amber-400">
            <span>Students asking to join ({pendingLobbyUsers.length})</span>
            <button
              onClick={handleAdmitAll}
              className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" /> Admit All
            </button>
          </div>

          <div className="space-y-2 max-h-36 overflow-y-auto">
            {pendingLobbyUsers.map((reqUser) => (
              <div key={reqUser._id || reqUser.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 text-xs">
                <span className="font-semibold text-slate-200">{reqUser.name}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRespondJoin(reqUser._id || reqUser.id, 'admit')}
                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Admit
                  </button>
                  <button
                    onClick={() => handleRespondJoin(reqUser._id || reqUser.id, 'deny')}
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

      {/* Main Call View Layout (Google Meet-Style Responsive Layout) */}
      <div className="flex-1 p-4 md:p-6 flex flex-col lg:flex-row gap-4 overflow-hidden relative">
        
        {/* Main Stage (Shared Desktop Presentation) */}
        {showScreenStage && (
          <div className="flex-1 bg-slate-900 rounded-3xl border-2 border-indigo-500/80 overflow-hidden min-h-[300px] flex items-center justify-center shadow-2xl relative">
            {isSharingScreen && screenStream ? (
              <VideoStream stream={screenStream} isMuted={true} className="w-full h-full object-contain bg-black" />
            ) : remoteScreenStream ? (
              <VideoStream stream={remoteScreenStream} isMuted={false} className="w-full h-full object-contain bg-black" />
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3 p-8 text-center bg-slate-950/90 w-full h-full">
                <Monitor className="w-16 h-16 text-indigo-400 animate-pulse" />
                <p className="text-sm font-bold text-white">Live Desktop Screen Presentation in Progress</p>
                <p className="text-xs text-slate-400">Presenter: {activeScreenSharer?.userName || 'Presenter'}</p>
              </div>
            )}

            <div className="absolute top-4 left-4 bg-indigo-950/90 border border-indigo-700 px-4 py-2 rounded-2xl text-xs font-black text-indigo-200 flex items-center gap-2 shadow-lg z-10">
              <Monitor className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>Active Presentation: {activeScreenSharer?.userName || user?.name}</span>
            </div>
          </div>
        )}

        {/* Participant Video Tiles Grid */}
        <div
          className={`${
            showScreenStage
              ? 'w-full lg:w-80 flex lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto max-h-[220px] lg:max-h-full'
              : 'flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto'
          }`}
        >
          {/* Local Video Tile (Self) */}
          <div className="relative bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden min-h-[200px] lg:min-h-[220px] max-h-[360px] flex items-center justify-center shadow-lg shrink-0 w-64 lg:w-full">
            {camOn && localStream ? (
              <VideoStream stream={localStream} isMuted={true} className="w-full h-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-2xl font-black text-white ring-4 ring-slate-700">
                {user?.name?.charAt(0) || 'Y'}
              </div>
            )}

            {/* Local Raised Hand Badge */}
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

          {/* Remote Participants WebRTC Video Tiles */}
          {remotePeers.map(({ socketId: peerSocketId, stream: peerStream, user: peerUser, micOn: pMic, camOn: pCam }) => {
            const peerIdStr = (peerUser?._id || peerUser?.id || '')?.toString();
            const hasHandUp = raisedHandsList.some(
              (h) => (h._id || h).toString() === peerIdStr
            );

            return (
              <div
                key={peerSocketId}
                className="relative bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden min-h-[200px] lg:min-h-[220px] max-h-[360px] flex items-center justify-center shadow-lg shrink-0 w-64 lg:w-full"
              >
                {/* Live WebRTC Video Stream Player */}
                {pCam && peerStream ? (
                  <VideoStream stream={peerStream} isMuted={false} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-black text-3xl shadow-glow ring-4 ring-slate-800">
                    {peerUser?.name?.charAt(0) || 'P'}
                  </div>
                )}

                {/* Remote Audio Track Player (In case video is hidden/off, audio still plays) */}
                {peerStream && (
                  <audio
                    ref={(audioEl) => {
                      if (audioEl && audioEl.srcObject !== peerStream) {
                        audioEl.srcObject = peerStream;
                        audioEl.play().catch(() => {});
                      }
                    }}
                    autoPlay
                    className="hidden"
                  />
                )}

                {hasHandUp && (
                  <div className="absolute top-4 right-4 bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce z-10">
                    <Hand className="w-4 h-4" /> Hand Raised
                  </div>
                )}

                <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 z-10">
                  <span>{peerUser?.name || 'Participant'}</span>
                  {pMic ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Side Panel Drawer (Participants or Q&A Chat) */}
        {activeDrawer && (
          <aside className="w-full lg:w-80 bg-slate-900 rounded-3xl border border-slate-800 flex flex-col justify-between overflow-hidden shadow-2xl z-40">
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

                <p className="text-[11px] font-bold text-slate-400 uppercase pt-2">Connected Participants ({remotePeers.length + 1})</p>
                
                {/* Local User */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 text-xs">
                  <span className="text-slate-300 font-semibold">{user?.name} (You)</span>
                  {handRaised && <span className="text-amber-400 font-bold">✋ Raised</span>}
                </div>

                {/* Remote Users */}
                {remotePeers.map(({ socketId: sId, user: pUser }) => {
                  const pId = pUser?._id || pUser?.id;
                  const isHandUp = raisedHandsList.some((h) => (h._id || h).toString() === pId?.toString());

                  return (
                    <div key={sId} className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-slate-300 font-semibold">{pUser?.name || 'Student'}</span>
                        {isHandUp && <span className="text-amber-400 font-bold">✋ Raised</span>}
                      </div>

                      {(isHost || isFaculty || isAdmin) && pId && (
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
                  {messages.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">No chat messages yet. Ask a question below.</p>
                  ) : (
                    messages.map((msg, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-brand-400">{msg.senderName}</span>
                          <span className="text-slate-500 text-[9px]">{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
      <footer className="px-6 py-4 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-center gap-3 sm:gap-4 z-30 flex-wrap">
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
          <span className="absolute -top-1 -right-1 bg-brand-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
            {remotePeers.length + 1}
          </span>
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
          className="px-6 py-3.5 rounded-2xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-glow flex items-center gap-2"
        >
          <PhoneOff className="w-5 h-5" />
          {isHost ? 'End Call for All' : 'Leave Call'}
        </button>
      </footer>
    </div>
  );
};

export default MeetRoomPage;
