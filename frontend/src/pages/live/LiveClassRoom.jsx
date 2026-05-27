import { useEffect, useMemo, useState } from "react";
import {
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  Chat,
  TrackToggle,
  DisconnectButton,
  useParticipants,
  useTracks,
} 
from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import {
  clearLiveKitSession,
  getLiveKitSession,
} from "../../utils/livekitHelpers";
import "../../styles/livekit.css";

function Icon({ name }) {
  const icons = {
    micOff: (
      <path d="M16 9v1a4 4 0 0 1-.46 1.87M12 18v3M8 21h8M5 9v1a7 7 0 0 0 9.48 6.55M12 3a3 3 0 0 1 3 3v3M9 9V6a3 3 0 0 1 4.52-2.59M3 3l18 18" />
    ),
    mic: (
      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3ZM19 10v1a7 7 0 0 1-14 0v-1M12 18v3M8 21h8" />
    ),
    video: (
      <path d="M15 10l5-3v10l-5-3v-4ZM4 6h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
    ),
    videoOff: (
      <path d="M10.66 6H13a2 2 0 0 1 2 2v2.34l5-3.34v10l-3.4-2.27M15 15.5V16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h1M3 3l18 18" />
    ),
    share: <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />,
    leave: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.86.32 1.7.59 2.5a2 2 0 0 1-.45 2.11L8 9.59a16 16 0 0 0 6.41 6.41l1.26-1.26a2 2 0 0 1 2.11-.45c.8.27 1.64.47 2.5.59A2 2 0 0 1 22 16.92Z" />
    ),
    pin: <path d="M12 17v5M5 17h14M9 3h6l1 7 3 3v2H5v-2l3-3 1-7Z" />,
    fullscreen: <path d="M8 3H3v5M21 8V3h-5M3 16v5h5M16 21h5v-5" />,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  };

  return (
    <svg
      className="nexus-svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

function Initials({ value }) {
  return String(value || "?").trim().charAt(0).toUpperCase();
}

function getName(participant, fallback = "Participant") {
  return participant?.name || participant?.identity || fallback;
}

function normalizeRole(role) {
  return String(role || "").toUpperCase();
}

function getParticipantRole(participant, currentUserRole) {
  if (participant?.isLocal && currentUserRole) {
    return normalizeRole(currentUserRole);
  }

  try {
    const metadata = participant?.metadata ? JSON.parse(participant.metadata) : null;
    return normalizeRole(metadata?.role || metadata?.user_role || "");
  } catch {
    return normalizeRole(participant?.metadata || "");
  }
}

function MediaStatus({ participant }) {
  return (
    <div className="nexus-media-status">
      <span className={participant?.isMicrophoneEnabled ? "on" : "off"}>
        {participant?.isMicrophoneEnabled ? <Icon name="mic" /> : <Icon name="micOff" />}
      </span>

      <span className={participant?.isCameraEnabled ? "on" : "off"}>
        {participant?.isCameraEnabled ? <Icon name="video" /> : <Icon name="videoOff" />}
      </span>
    </div>
  );
}
function ParticipantMiniTile({ participant, trackRef, isPinned, onPin }) {
  const name = getName(participant);

  return (
    <div
      className={`nexus-thumb ${participant?.isSpeaking ? "speaking" : ""} ${
        isPinned ? "pinned" : ""
      }`}
    >
      {trackRef ? (
        <ParticipantTile trackRef={trackRef} />
      ) : (
        <div className="nexus-thumb-placeholder">
          <div className="nexus-thumb-avatar">
            <Initials value={name} />
          </div>
        </div>
      )}

      <button
        className={`nexus-pin-btn ${isPinned ? "active" : ""}`}
        type="button"
        onClick={() => onPin(participant.identity)}
        title={isPinned ? "Unpin video" : "Pin video"}
      >
        <Icon name="pin" />
      </button>

      <div className="nexus-thumb-name">
        <span>{name}</span>
        <MediaStatus participant={participant} />
      </div>
    </div>
  );
}
function ParticipantsPanel({
  participants,
  pinnedIdentity,
  onPin,
  currentUserRole,
}) {
    return (
      <div className="nexus-people-list">
        <div className="nexus-panel-count">
          {participants.length || 1} participant{participants.length === 1 ? "" : "s"}
        </div>

        {participants.map((participant) => {
          const name = getName(participant);
          const role = getParticipantRole(participant, currentUserRole);
          const isTeacher = role === "TEACHER";
          const isPinned = pinnedIdentity === participant.identity;

          return (
            <div
              className={`nexus-person ${isTeacher ? "host" : ""}`}
              key={participant.identity}
            >
              <div className="nexus-person-avatar">
                <Initials value={name} />
                <span className="online-dot" />
              </div>

              <div className="nexus-person-info">
                <strong>{name}</strong>
                <small>
                  {isTeacher ? "Teacher / Host" : participant.isLocal ? "You" : "Student"}
                </small>
              </div>

              <MediaStatus participant={participant} />

              <button
                className={`person-pin ${isPinned ? "active" : ""}`}
                type="button"
                onClick={() => onPin(participant.identity)}
                title={isPinned ? "Unpin video" : "Pin video"}
              >
                <Icon name="pin" />
              </button>
            </div>
          );
        })}
      </div>
    );
}

function PollsPanel() {
  return (
    <div className="nexus-empty">
      <div className="nexus-empty-icon">📊</div>
      <h3>No polls created yet.</h3>
      <p>Create a poll to quickly collect answers from students.</p>
      <button className="nexus-poll-btn" type="button">
        Create poll
      </button>
    </div>
  );
}

function NexusVideoRoom({ session, connection }) {
  const [activePanel, setActivePanel] = useState("messages");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pinnedIdentity, setPinnedIdentity] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const participants = useParticipants();

  useEffect(() => {
    let mounted = true;

    async function loadMe() {
      try {
        const response = await axiosClient.get("/me/");
        if (mounted) setCurrentUser(response.data);
      } catch {
        if (mounted) setCurrentUser(null);
      }
    }

    loadMe();

    return () => {
      mounted = false;
    };
  }, []);

  const currentUserRole = normalizeRole(
    currentUser?.role || connection?.role || connection?.user?.role
  );

  const trackRefs = useTracks(
    [
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Camera, withPlaceholder: true },
    ],
    { onlySubscribed: false }
  );

  const screenShareTrack = trackRefs.find(
    (trackRef) => trackRef.source === Track.Source.ScreenShare
  );

  const cameraTracks = trackRefs.filter(
    (trackRef) => trackRef.source === Track.Source.Camera
  );

  const localParticipant =
    participants.find((participant) => participant.isLocal) || participants[0];

  const teacherParticipant =
    participants.find((participant) => {
      const role = getParticipantRole(participant, currentUserRole);
      return role === "TEACHER";
    }) || (currentUserRole === "TEACHER" ? localParticipant : null);

  const pinnedParticipant = pinnedIdentity
    ? participants.find((participant) => participant.identity === pinnedIdentity)
    : null;

  const mainParticipant = useMemo(() => {
    if (pinnedParticipant) return pinnedParticipant;
    if (screenShareTrack?.participant) return screenShareTrack.participant;
    if (teacherParticipant) return teacherParticipant;

    return (
      participants.find((participant) => !participant.isLocal) ||
      localParticipant ||
      participants[0]
    );
  }, [
    pinnedParticipant,
    screenShareTrack,
    teacherParticipant,
    participants,
    localParticipant,
  ]);

  const mainTrack = useMemo(() => {
    if (pinnedIdentity) {
      const pinnedTrack = cameraTracks.find(
        (trackRef) => trackRef.participant?.identity === pinnedIdentity
      );

      if (pinnedTrack) return pinnedTrack;
    }

    if (screenShareTrack) return screenShareTrack;

    if (mainParticipant) {
      return (
        cameraTracks.find(
          (trackRef) => trackRef.participant?.identity === mainParticipant.identity
        ) || null
      );
    }

    return cameraTracks[0] || null;
  }, [pinnedIdentity, cameraTracks, screenShareTrack, mainParticipant]);

  const sideParticipants = useMemo(() => {
    if (!participants.length) return [];
    if (participants.length === 1) return participants;

    return participants.filter(
      (participant) => participant.identity !== mainParticipant?.identity
    );
  }, [participants, mainParticipant]);

  const meetingTitle =
    session?.title || session?.name || "Project Phoenix Design Sync";

  const mainName = getName(
    mainParticipant,
    connection?.participantName || currentUser?.full_name || "Host"
  );

  const isPinned = Boolean(
    pinnedIdentity && mainParticipant?.identity === pinnedIdentity
  );

  const handlePin = (identity) => {
    setPinnedIdentity((current) => (current === identity ? null : identity));
  };

  const toggleFullscreen = async () => {
    const element = document.querySelector(".nexus-video-shell");

    try {
      if (!document.fullscreenElement) {
        await element?.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      return;
    }
  };

  const mainRole = getParticipantRole(mainParticipant, currentUserRole);

  return (
    <div className={`nexus-video-shell ${sidebarOpen ? "" : "sidebar-closed"}`}>
      <header className="nexus-topbar">
        <div className="nexus-brand">TeachNest Live</div>

        <div className="nexus-live">
          <span />
          Recording
          <strong>LIVE</strong>
        </div>

        <h1>{meetingTitle}</h1>

        <div className="nexus-top-actions">
          <button type="button" onClick={toggleFullscreen} title="Fullscreen">
            <Icon name="fullscreen" />
          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen((value) => !value)}
            title="Toggle side panel"
          >
            <Icon name="menu" />
          </button>
        </div>
      </header>

      <aside className="nexus-filmstrip">
        {sideParticipants.map((participant) => {
          const trackRef = cameraTracks.find(
            (item) => item.participant?.identity === participant.identity
          );

          return (
            <ParticipantMiniTile
              key={participant.identity}
              participant={participant}
              trackRef={trackRef}
              isPinned={pinnedIdentity === participant.identity}
              onPin={handlePin}
            />
          );
        })}
      </aside>

      <main className="nexus-stage">
        <section className={`nexus-main-card ${isPinned ? "is-pinned" : ""}`}>
          {mainTrack ? (
            <ParticipantTile trackRef={mainTrack} className="nexus-main-tile" />
          ) : (
            <div className="nexus-main-placeholder">
              <div className="nexus-main-avatar">
                <Initials value={mainName} />
              </div>
            </div>
          )}

          {(isPinned || screenShareTrack || mainRole === "TEACHER") && (
            <div className="nexus-pinned-label">
              {isPinned ? "Pinned" : screenShareTrack ? "Presenting" : "Teacher"}
            </div>
          )}

          <div className="nexus-nameplate">
            <div className="name-avatar">
              <Initials value={mainName} />
            </div>

            <div>
              <strong>{mainName}</strong>
              <em>
                {mainRole === "TEACHER"
                  ? "Teacher / Host"
                  : mainParticipant?.isLocal
                    ? "You"
                    : "Participant"}
              </em>
            </div>

            {isPinned && (
              <button
                type="button"
                className="unpin-btn"
                onClick={() => setPinnedIdentity(null)}
              >
                Unpin
              </button>
            )}
          </div>

          <div className="nexus-control-dock compact-controls">
            <TrackToggle
              source={Track.Source.Microphone}
              showIcon={false}
              className={`zoom-control ${
                localParticipant?.isMicrophoneEnabled ? "is-on" : "is-off"
              }`}
            >
              <span className="zoom-icon">
                <Icon
                  name={localParticipant?.isMicrophoneEnabled ? "mic" : "micOff"}
                />
              </span>
              <small>
                {localParticipant?.isMicrophoneEnabled ? "Mute" : "Unmute"}
              </small>
            </TrackToggle>

            <TrackToggle
              source={Track.Source.Camera}
              showIcon={false}
              className={`zoom-control ${
                localParticipant?.isCameraEnabled ? "is-on" : "is-off"
              }`}
            >
              <span className="zoom-icon">
                <Icon
                  name={localParticipant?.isCameraEnabled ? "video" : "videoOff"}
                />
              </span>
              <small>
                {localParticipant?.isCameraEnabled ? "Video off" : "Video"}
              </small>
            </TrackToggle>

            <TrackToggle
              source={Track.Source.ScreenShare}
              showIcon={false}
              className="zoom-control share"
            >
              <span className="zoom-icon">
                <Icon name="share" />
              </span>
              <small>Share</small>
            </TrackToggle>

            <DisconnectButton className="zoom-leave long">
              <span className="zoom-icon">
                <Icon name="leave" />
              </span>
              <small>Leave</small>
            </DisconnectButton>
          </div>
        </section>
      </main>

      <aside className={`nexus-panel ${sidebarOpen ? "open" : ""}`}>
        <div className="nexus-panel-head">
          <div>
            <h2>Project Sync</h2>
            <p>
              {participants.length || 1} Participant
              {participants.length === 1 ? "" : "s"}
            </p>
          </div>

          <button
            type="button"
            className="panel-close"
            onClick={() => setSidebarOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="nexus-tabs">
          <button
            className={activePanel === "messages" ? "active" : ""}
            onClick={() => setActivePanel("messages")}
            type="button"
          >
            Messages
          </button>

          <button
            className={activePanel === "participants" ? "active" : ""}
            onClick={() => setActivePanel("participants")}
            type="button"
          >
            Participants
          </button>

          <button
            className={activePanel === "polls" ? "active" : ""}
            onClick={() => setActivePanel("polls")}
            type="button"
          >
            Polls
          </button>
        </div>

        {activePanel === "messages" && (
          <div className="nexus-chat">
            <Chat />
          </div>
        )}

        {activePanel === "participants" && (
          <ParticipantsPanel
            participants={participants}
            pinnedIdentity={pinnedIdentity}
            onPin={handlePin}
            currentUserRole={currentUserRole}
          />
        )}

        {activePanel === "polls" && <PollsPanel />}
      </aside>

      <RoomAudioRenderer />
    </div>
  );
}

export default function LiveClassRoom() {
  const { id } = useParams();
  const navigate = useNavigate();

  const connection = getLiveKitSession(id);
  const session = connection?.session || {};
  const serverUrl = connection?.serverUrl;
  const participantToken = connection?.participantToken;

  const navigateBack = () => {
    clearLiveKitSession(id);
    navigate(-1);
  };

  if (!serverUrl || !participantToken) {
    return (
      <main className="live-missing">
        <div className="auth-card">
          <h1>Live class connection data missing.</h1>
          <p>Please join again from your sessions page.</p>
          <button
            className="btn btn-primary"
            type="button"
            onClick={navigateBack}
          >
            Back to sessions
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="live-page">
      <LiveKitRoom
        token={participantToken}
        serverUrl={serverUrl}
        connect
        video={false}
        audio={false}
        onDisconnected={navigateBack}
        data-lk-theme="default"
        className="livekit-custom-room"
      >
        <NexusVideoRoom session={session} connection={connection} />
      </LiveKitRoom>
    </main>
  );
}