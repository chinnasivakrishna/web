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
  Volume2,
  Maximize,
  Minimize,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Google / Cloudflare Public STUN Servers for NAT Traversal
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ],
};

// Fallback Canvas Stream for View-only / Disabled Camera Mode
const createDummyStream = () => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 640, 360);
    }
    const canvasStream = canvas.captureStream ? canvas.captureStream(10) : null;
    const videoTrack = canvasStream ? canvasStream.getVideoTracks()[0] : null;

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const dst = audioCtx.createMediaStreamDestination();
    osc.connect(dst);
    osc.start();
    const audioTrack = dst.stream.getAudioTracks()[0];
    if (audioTrack) audioTrack.enabled = false;

    const tracks = [];
    if (videoTrack) tracks.push(videoTrack);
    if (audioTrack) tracks.push(audioTrack);
    return new MediaStream(tracks);
  } catch (e) {
    console.warn('Fallback dummy stream creation failed:', e.message);
    return new MediaStream();
  }
};

// WebRTC Video Stream Player Component
const VideoStream = ({ stream, isMuted = false, className = '' }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current
        .play()
        .catch((err) => console.log('Video play policy handled:', err.message));
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
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
  // Map Key: targetSocketId -> { pc, stream, user, iceQueue, micOn, camOn, isScreenSharing }
  const peersRef = useRef(new Map());
  const [remotePeers, setRemotePeers] = useState([]);

  // Screen Sharing State across peers
  const [activeScreenSharer, setActiveScreenSharer] = useState(null); // { socketId, userId, userName }
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

    peersRef.current.forEach(({ pc }) => {
      if (pc) pc.close();
    });
    peersRef.current.clear();
    setRemotePeers([]);
  }, [screenStream]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

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

  const removePeer = useCallback(
    (socketId) => {
      if (peersRef.current.has(socketId)) {
        const { pc } = peersRef.current.get(socketId);
        if (pc) pc.close();
        peersRef.current.delete(socketId);
        updateRemotePeersState();
      }
    },
    [updateRemotePeersState]
  );

  // Process and drain ICE Candidate Queue after remote description is set
  const processIceQueue = async (targetSocketId) => {
    if (peersRef.current.has(targetSocketId)) {
      const peerItem = peersRef.current.get(targetSocketId);
      if (peerItem && peerItem.pc && peerItem.iceQueue.length > 0) {
        while (peerItem.iceQueue.length > 0) {
          const cand = peerItem.iceQueue.shift();
          try {
            await peerItem.pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {
            console.warn('ICE candidate addition handled:', e.message);
          }
        }
      }
    }
  };

  // Create a WebRTC PeerConnection with ICE Candidate Queueing & Full Track Exchange
  const createPeerConnection = useCallback(
    (targetSocketId, remoteUser, isInitiator = false) => {
      if (peersRef.current.has(targetSocketId)) {
        return peersRef.current.get(targetSocketId).pc;
      }

      const socket = getSocket();
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local media tracks to PeerConnection (If sharing screen, send screenStream video track)
      const activeStream = (isSharingScreen && screenStream) ? screenStream : (localStreamRef.current || createDummyStream());
      if (activeStream) {
        activeStream.getTracks().forEach((track) => {
          try {
            pc.addTrack(track, activeStream);
          } catch (e) {
            console.warn('Add track error:', e.message);
          }
        });
      }

      // If sharing screen, also send microphone audio track if available
      if (isSharingScreen && screenStream && localStreamRef.current) {
        const micAudioTrack = localStreamRef.current.getAudioTracks()[0];
        if (micAudioTrack && !pc.getSenders().some((s) => s.track && s.track.kind === 'audio')) {
          try {
            pc.addTrack(micAudioTrack, localStreamRef.current);
          } catch (e) {
            console.warn('Add mic track during screen share error:', e.message);
          }
        }
      }

      // Handle ICE Candidate generation
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc-ice-candidate', {
            toSocketId: targetSocketId,
            candidate: event.candidate,
          });
        }
      };

      // Auto-restart ICE on connection failure
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed') {
          console.warn('WebRTC ICE Failed - Restarting ICE...');
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

      // Handle Remote Tracks (Video & Audio)
      pc.ontrack = (event) => {
        let remoteStream = (event.streams && event.streams[0]) || null;
        if (!remoteStream) {
          remoteStream = new MediaStream();
        }
        if (event.track && !remoteStream.getTracks().some((t) => t.id === event.track.id)) {
          remoteStream.addTrack(event.track);
        }

        const peerItem = peersRef.current.get(targetSocketId);
        if (peerItem) {
          peerItem.stream = remoteStream;
          peersRef.current.set(targetSocketId, peerItem);
        }

        updateRemotePeersState();
      };

      peersRef.current.set(targetSocketId, {
        pc,
        stream: null,
        user: remoteUser,
        iceQueue: [],
        micOn: remoteUser?.micOn ?? true,
        camOn: remoteUser?.camOn ?? true,
        isScreenSharing: remoteUser?.isScreenSharing ?? false,
      });

      // If initiator/caller, create SDP offer
      if (isInitiator) {
        pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
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
          .catch((err) => console.error('Error creating WebRTC SDP offer:', err));
      }

      return pc;
    },
    [micOn, camOn, user, removePeer, updateRemotePeersState, isSharingScreen, screenStream]
  );

  // Dynamically resolve remote presenter screen stream whenever activeScreenSharer or remotePeers change
  useEffect(() => {
    if (activeScreenSharer && !isSharingScreen) {
      let foundStream = null;
      if (peersRef.current.has(activeScreenSharer.socketId)) {
        foundStream = peersRef.current.get(activeScreenSharer.socketId).stream;
      }
      if (!foundStream && activeScreenSharer.userId) {
        const sharerIdStr = activeScreenSharer.userId.toString();
        peersRef.current.forEach((peerData) => {
          const pId = (peerData.user?._id || peerData.user?.id || '')?.toString();
          if (pId && pId === sharerIdStr) {
            foundStream = peerData.stream;
          }
        });
      }
      if (!foundStream && activeScreenSharer.socketId) {
        const peer = remotePeers.find((p) => p.socketId === activeScreenSharer.socketId);
        if (peer) foundStream = peer.stream;
      }
      setRemoteScreenStream(foundStream);
    } else if (!activeScreenSharer) {
      setRemoteScreenStream(null);
    }
  }, [activeScreenSharer, remotePeers, isSharingScreen]);

  // Sync local tracks to all open Peer Connections
  useEffect(() => {
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getTracks();
      peersRef.current.forEach(({ pc }) => {
        const senders = pc.getSenders();
        tracks.forEach((track) => {
          const alreadyAdded = senders.some((s) => s.track && s.track.kind === track.kind);
          if (!alreadyAdded) {
            try {
              pc.addTrack(track, localStreamRef.current);
            } catch (e) {
              console.warn('Add track to peer error:', e.message);
            }
          }
        });
      });
    }
  }, [localStream]);

  // Initialize Microphone & Camera hardware
  const initSystemHardware = async () => {
    if (localStreamRef.current) return localStreamRef.current;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        let stream = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true,
          });
        } catch (videoErr) {
          console.warn('Video access failed, falling back to Audio-only:', videoErr.message);
          toast('Camera access unavailable. Fallback to Microphone-only mode.', { icon: '🎙️' });
          setCamOn(false);
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
      console.warn('Hardware media fallback to dummy stream:', err.message);
      toast.error('Could not access microphone/camera. Connected in View-only mode.');
      setCamOn(false);
      setMicOn(false);

      const dummy = createDummyStream();
      setLocalStream(dummy);
      localStreamRef.current = dummy;
      return dummy;
    }
    return null;
  };

  // Fetch initial meeting details once
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
          meetingService.requestJoin(meetId).catch(() => {});
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

  // Background Metadata Refresh (Runs every 3.5 seconds)
  useEffect(() => {
    let syncInterval = null;
    if (isAdmitted) {
      syncInterval = setInterval(async () => {
        try {
          const data = await meetingService.getMeetingDetails(meetId);
          if (data.success && data.meeting) {
            setMeeting(data.meeting);
            if (data.meeting.messages) setMessages(data.meeting.messages);
            if (data.meeting.pendingRequests) setPendingLobbyUsers(data.meeting.pendingRequests);
            if (data.meeting.raisedHands) setRaisedHandsList(data.meeting.raisedHands);
          }
        } catch (e) {
          console.log('Background sync check:', e.message);
        }
      }, 3500);
    }
    return () => {
      if (syncInterval) clearInterval(syncInterval);
    };
  }, [isAdmitted, meetId]);

  // Fallback Polling while waiting in lobby
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

  // Request peers ONCE when user is admitted (Do NOT re-trigger on micOn/camOn changes!)
  useEffect(() => {
    if (isAdmitted && user && meetId) {
      const socket = getSocket();
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
      socket.emit('request-peers', { meetId });
    }
  }, [isAdmitted, user, meetId]);

  // Main Socket Signaling & Event Listeners
  useEffect(() => {
    fetchMeetingDetailsOnce();

    const socket = initSocket();

    const handleSocketConnect = () => {
      if (user && meetId && isAdmitted) {
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
        socket.emit('request-peers', { meetId });
      }
    };
    socket.on('connect', handleSocketConnect);

    socket.on('existing-participants', (existingUsers) => {
      existingUsers.forEach(({ socketId: peerSocketId, user: peerUser }) => {
        if (peerSocketId !== socket.id) {
          createPeerConnection(peerSocketId, peerUser, true);
        }
      });
    });

    socket.on('user-joined', ({ socketId: newSocketId, user: newUser }) => {
      if (!peersRef.current.has(newSocketId)) {
        toast.success(`${newUser?.name || 'Participant'} joined the call`);
      }
      createPeerConnection(newSocketId, newUser, false);
    });

    socket.on('webrtc-offer', async ({ fromSocketId, offer, callerUser }) => {
      try {
        const pc = createPeerConnection(fromSocketId, callerUser, false);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await processIceQueue(fromSocketId);

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
            await processIceQueue(fromSocketId);
          }
        }
      } catch (err) {
        console.error('Error handling WebRTC answer:', err);
      }
    });

    socket.on('webrtc-ice-candidate', async ({ fromSocketId, candidate }) => {
      try {
        if (peersRef.current.has(fromSocketId)) {
          const peerItem = peersRef.current.get(fromSocketId);
          const pc = peerItem.pc;
          if (pc && candidate) {
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
              peerItem.iceQueue.push(candidate);
            }
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

    socket.on('lobby-student-response', async ({ studentId, action }) => {
      const currentUserId = (user?._id || user?.id)?.toString();
      if (studentId?.toString() === currentUserId) {
        if (action === 'admit') {
          setIsAdmitted(true);
          setIsLobbyWaiting(false);
          await initSystemHardware();
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
          socket.emit('request-peers', { meetId });
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
      socket.emit('request-peers', { meetId });
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
  ]);

  // Window unload listener
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

  // Desktop Screen Sharing Toggle
  const toggleScreenShare = async () => {
    const socket = getSocket();

    if (isSharingScreen) {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
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

          peersRef.current.forEach(({ pc }) => {
            const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
            if (sender && screenVideoTrack) {
              sender.replaceTrack(screenVideoTrack);
            } else if (screenVideoTrack) {
              pc.addTrack(screenVideoTrack, stream);
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

  // Request Join Lobby
  const handleRequestJoin = async () => {
    if (isHost || isFaculty || isAdmin) {
      setIsAdmitted(true);
      setIsLobbyWaiting(false);
      await initSystemHardware();
      meetingService.requestJoin(meetId).catch(() => {});
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

  // Host Respond Join
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

  // Host Admit All
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

  // Host Remove Student
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

  // Send Chat Message
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

  // Leave / End Call
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

  // Enable audio playback if blocked by Chrome Autoplay Policy
  const enableAudioPlayback = () => {
    setAutoplayBlocked(false);
    peersRef.current.forEach(({ stream }) => {
      if (stream) {
        const audioTracks = stream.getAudioTracks();
        audioTracks.forEach((track) => (track.enabled = true));
      }
    });
    toast.success('Audio output enabled!');
  };

  const currentUserId = (user?._id || user?.id || '')?.toString();
  const hostUserId = (meeting?.host?._id || meeting?.host || '')?.toString();

  // Unified Remote Participants list: merges DB admitted participants and Socket WebRTC peers
  const combinedRemoteParticipants = Array.from(
    new Map([
      // 1. All DB admitted participants (except current user)
      ...(meeting?.admittedParticipants || [])
        .filter((p) => {
          if (!p) return false;
          const pId = typeof p === 'object' ? (p._id ? p._id.toString() : '') : p.toString();
          return pId && currentUserId && pId !== currentUserId;
        })
        .map((p) => {
          const pId = typeof p === 'object' ? p._id.toString() : p.toString();
          const matchingPeer = remotePeers.find((rp) => {
            if (!rp) return false;
            const rpUserId = (rp.user?._id || rp.user?.id || '')?.toString();
            return (rpUserId && rpUserId === pId) || rp.socketId === pId;
          });
          return [
            pId,
            {
              participantId: pId,
              socketId: matchingPeer?.socketId || null,
              name: typeof p === 'object' ? p.name : 'Participant',
              role: typeof p === 'object' ? p.role : 'student',
              stream: matchingPeer?.stream || null,
              micOn: matchingPeer ? matchingPeer.micOn : true,
              camOn: matchingPeer ? matchingPeer.camOn : true,
              isScreenSharing: matchingPeer ? matchingPeer.isScreenSharing : false,
            },
          ];
        }),
      // 2. Active WebRTC socket remote peers
      ...remotePeers
        .filter((rp) => {
          const rpId = (rp.user?._id || rp.user?.id || rp.socketId)?.toString();
          return rpId && currentUserId && rpId !== currentUserId;
        })
        .map((rp) => {
          const rpId = (rp.user?._id || rp.user?.id || rp.socketId)?.toString();
          return [
            rpId,
            {
              participantId: rpId,
              socketId: rp.socketId,
              name: rp.user?.name || 'Participant',
              role: rp.user?.role || 'student',
              stream: rp.stream,
              micOn: rp.micOn,
              camOn: rp.camOn,
              isScreenSharing: rp.isScreenSharing,
            },
          ];
        }),
    ]).values()
  );

  // Active Screen Share Stream calculation
  const showScreenStage = isSharingScreen || activeScreenSharer !== null;
  const activeSharerPeer = activeScreenSharer
    ? (peersRef.current.get(activeScreenSharer.socketId) ||
       combinedRemoteParticipants.find((p) => p.socketId === activeScreenSharer.socketId || p.participantId === activeScreenSharer.userId?.toString()))
    : null;

  if (loading) {
    return (
      <div className="h-[100dvh] bg-slate-950 flex items-center justify-center text-white">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-400">Connecting to StuVaradhi Live Call...</p>
        </div>
      </div>
    );
  }

  // Pre-Join Lobby View for Students
  if (!isAdmitted && !isHost && !isFaculty && !isAdmin) {
    return (
      <div className="h-[100dvh] bg-slate-950 text-white flex items-center justify-center p-6">
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
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-slate-950 text-white flex flex-col justify-between overflow-hidden relative font-sans">
      {/* Chrome Autoplay Unlock Banner */}
      {autoplayBlocked && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 border border-indigo-400">
          <Volume2 className="w-4 h-4 animate-pulse" />
          <span>Click to enable speaker audio playback</span>
          <button onClick={enableAudioPlayback} className="bg-white text-indigo-950 px-3 py-1 rounded-xl text-[11px] font-black">
            Enable Audio
          </button>
        </div>
      )}

      {/* Header Bar */}
      <header className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black text-xs shadow-glow">
            SV
          </div>
          <div>
            <h1 className="font-extrabold text-xs sm:text-sm text-white truncate max-w-[180px] sm:max-w-xs">{meeting?.title}</h1>
            <p className="text-[10px] text-slate-400 hidden sm:block">Host: {meeting?.host?.name || 'Faculty Instructor'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={copyMeetLink}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Copy Share Link</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1"
            title="Toggle Fullscreen Mode"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>

          <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            Encrypted WebRTC Call
          </span>
        </div>
      </header>

      {/* Host Real-Time Lobby Admission Banner */}
      {isHost && pendingLobbyUsers.length > 0 && (
        <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 glass-panel p-4 rounded-2xl border border-amber-500/50 bg-slate-900/95 text-white space-y-3 shadow-2xl min-w-[300px] sm:min-w-[340px]">
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

      {/* Main Call View Layout */}
      <div className="flex-1 p-2 sm:p-4 md:p-6 flex flex-col lg:flex-row gap-3 sm:gap-4 overflow-hidden relative">
        
        {/* Main Stage (Shared Desktop Presentation) */}
        {showScreenStage && (
          <div className="flex-1 bg-slate-900 rounded-2xl sm:rounded-3xl border-2 border-indigo-500/80 overflow-hidden min-h-[220px] sm:min-h-[300px] flex items-center justify-center shadow-2xl relative">
            {isSharingScreen && screenStream ? (
              <VideoStream key="local-screen-share" stream={screenStream} isMuted={true} className="w-full h-full object-contain bg-black" />
            ) : (
              <VideoStream
                key={`remote-screen-${activeScreenSharer?.socketId || activeScreenSharer?.userId}`}
                stream={remoteScreenStream || activeSharerPeer?.stream}
                isMuted={false}
                className="w-full h-full object-contain bg-black"
              />
            )}

            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-indigo-950/90 border border-indigo-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl text-[11px] sm:text-xs font-black text-indigo-200 flex items-center gap-2 shadow-lg z-10">
              <Monitor className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>Active Presentation: {activeScreenSharer?.userName || user?.name}</span>
            </div>
          </div>
        )}

        {/* Participant Video Tiles Grid */}
        <div
          className={`${
            showScreenStage
              ? 'w-full lg:w-80 flex lg:flex-col gap-3 sm:gap-4 overflow-x-auto lg:overflow-y-auto max-h-[160px] sm:max-h-[220px] lg:max-h-full shrink-0'
              : 'flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 overflow-y-auto'
          }`}
        >
          {/* Local Video Tile (Self) */}
          <div className="relative bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-800 overflow-hidden min-h-[150px] sm:min-h-[200px] lg:min-h-[220px] max-h-[360px] flex items-center justify-center shadow-lg shrink-0 w-52 sm:w-64 lg:w-full">
            {camOn && localStream ? (
              <VideoStream stream={localStream} isMuted={true} className="w-full h-full object-cover" />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800 flex items-center justify-center text-xl sm:text-2xl font-black text-white ring-4 ring-slate-700">
                {user?.name?.charAt(0) || 'Y'}
              </div>
            )}

            {handRaised && (
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-amber-500 text-slate-950 font-black text-[10px] sm:text-xs px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-lg flex items-center gap-1 animate-bounce z-10">
                <Hand className="w-3.5 h-3.5" /> Raised
              </div>
            )}

            <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-2 z-10">
              <span className="truncate max-w-[120px]">{user?.name} (You)</span>
              {micOn ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
            </div>
          </div>

          {/* Combined Remote Participants */}
          {combinedRemoteParticipants.map(({ participantId, socketId: peerSocketId, stream: peerStream, name: peerName, micOn: pMic, camOn: pCam }) => {
            const hasHandUp = raisedHandsList.some(
              (h) => (h._id || h).toString() === participantId
            );

            return (
              <div
                key={peerSocketId || participantId}
                className="relative bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-800 overflow-hidden min-h-[150px] sm:min-h-[200px] lg:min-h-[220px] max-h-[360px] flex items-center justify-center shadow-lg shrink-0 w-52 sm:w-64 lg:w-full"
              >
                {/* Live WebRTC Video Stream Player */}
                {pCam && peerStream ? (
                  <VideoStream key={peerSocketId || participantId} stream={peerStream} isMuted={false} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-glow ring-4 ring-slate-800">
                    {peerName?.charAt(0) || 'P'}
                  </div>
                )}

                {/* Remote Audio Track Player */}
                {peerStream && (
                  <audio
                    ref={(audioEl) => {
                      if (audioEl && audioEl.srcObject !== peerStream) {
                        audioEl.srcObject = peerStream;
                        audioEl.play().catch((err) => {
                          console.log('Audio autoplay policy handled:', err.message);
                          setAutoplayBlocked(true);
                        });
                      }
                    }}
                    autoPlay
                    className="hidden"
                  />
                )}

                {hasHandUp && (
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-amber-500 text-slate-950 font-black text-[10px] sm:text-xs px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-lg flex items-center gap-1 animate-bounce z-10">
                    <Hand className="w-3.5 h-3.5" /> Raised
                  </div>
                )}

                <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-2 z-10">
                  <span className="truncate max-w-[120px]">{peerName}</span>
                  {pMic ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Side Panel Drawer */}
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

                <p className="text-[11px] font-bold text-slate-400 uppercase pt-2">Connected Participants ({combinedRemoteParticipants.length + 1})</p>
                
                {/* Local User */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 text-xs">
                  <span className="text-slate-300 font-semibold">{user?.name} (You)</span>
                  {handRaised && <span className="text-amber-400 font-bold">✋ Raised</span>}
                </div>

                {/* Combined Remote Users */}
                {combinedRemoteParticipants.map(({ participantId, name: pName, role: pRole }) => {
                  const isHandUp = raisedHandsList.some((h) => (h._id || h).toString() === participantId);

                  return (
                    <div key={participantId} className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-slate-300 font-semibold">{pName}</span>
                        {pRole === 'admin' && <span className="text-[9px] bg-purple-950 text-purple-400 px-1.5 py-0.5 rounded font-bold">Admin</span>}
                        {pRole === 'faculty' && <span className="text-[9px] bg-indigo-950 text-indigo-400 px-1.5 py-0.5 rounded font-bold">Faculty</span>}
                        {isHandUp && <span className="text-amber-400 font-bold">✋ Raised</span>}
                      </div>

                      {(isHost || isFaculty || isAdmin) && participantId && (
                        <button
                          onClick={() => handleRemoveStudent(participantId)}
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
      <footer className="px-3 sm:px-6 py-3 sm:py-4 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-center gap-2 sm:gap-4 z-30 shrink-0">
        <button
          onClick={toggleMicrophone}
          className={`p-3 sm:p-3.5 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center ${
            micOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-600 text-white hover:bg-rose-700'
          }`}
          title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {micOn ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        <button
          onClick={toggleCamera}
          className={`p-3 sm:p-3.5 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center ${
            camOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-600 text-white hover:bg-rose-700'
          }`}
          title={camOn ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {camOn ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3 sm:p-3.5 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center ${
            isSharingScreen ? 'bg-indigo-600 text-white ring-4 ring-indigo-400' : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
          title={isSharingScreen ? 'Stop Screen Sharing' : 'Share Screen Presentation'}
        >
          {isSharingScreen ? <MonitorOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        <button
          onClick={handleToggleRaiseHand}
          className={`p-3 sm:p-3.5 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center ${
            handRaised ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-400' : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
          title={handRaised ? 'Lower Hand' : 'Raise Hand'}
        >
          <Hand className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          onClick={() => setActiveDrawer(activeDrawer === 'participants' ? null : 'participants')}
          className={`p-3 sm:p-3.5 rounded-2xl font-bold transition-all shadow-lg relative ${
            activeDrawer === 'participants' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
          title="View People in Call"
        >
          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="absolute -top-1 -right-1 bg-brand-500 text-white font-black text-[10px] w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center">
            {combinedRemoteParticipants.length + 1}
          </span>
        </button>

        <button
          onClick={() => setActiveDrawer(activeDrawer === 'chat' ? null : 'chat')}
          className={`p-3 sm:p-3.5 rounded-2xl font-bold transition-all shadow-lg relative ${
            activeDrawer === 'chat' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
          title="Open Q&A Chat"
        >
          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-3 sm:p-3.5 rounded-2xl font-bold transition-all shadow-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center sm:hidden"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>

        <button
          onClick={handleLeaveCall}
          className="px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-glow flex items-center gap-1.5 sm:gap-2"
        >
          <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">{isHost ? 'End Call for All' : 'Leave Call'}</span>
          <span className="sm:hidden">Leave</span>
        </button>
      </footer>
    </div>
  );
};

export default MeetRoomPage;
