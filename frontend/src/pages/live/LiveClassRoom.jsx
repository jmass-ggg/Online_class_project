// LiveClassRoom.jsx
import { useMemo, useState } from "react";
import {
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  Chat,
  TrackToggle,
  DisconnectButton,
  useParticipants,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { useNavigate, useParams } from "react-router-dom";
import {
  clearLiveKitSession,
  getLiveKitSession,
} from "../../utils/livekitHelpers";
import "../../styles/livekit.css";

function Initials({ value }) {
  return String(value || "?").charAt(0).toUpperCase();
}

function NexusVideoRoom({ session, connection }) {
  const [activePanel, setActivePanel] = useState("messages");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showMore, setShowMore] = useState(false);

  const participants = useParticipants();

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

  const mainTrack = useMemo(() => {
    return (
      screenShareTrack ||
      cameraTracks.find((trackRef) => !trackRef.participant?.isLocal) ||
      cameraTracks[0]
    );
  }, [screenShareTrack, cameraTracks]);

  const sideTracks = cameraTracks.filter((trackRef) => trackRef !== mainTrack);

  const hostName =
    mainTrack?.participant?.name ||
    mainTrack?.participant?.identity ||
    connection?.participantName ||
    "Host";

  const meetingTitle = session?.title || "Project Phoenix Design Sync";

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

  return (
    <div className={`nexus-video-shell ${sidebarOpen ? "" : "sidebar-closed"}`}>
      <header className="nexus-topbar">
        <div className="nexus-brand">Nexus Video</div>

        <div className="nexus-live">
          <span />
          Recording
          <strong>LIVE</strong>
        </div>

        <h1>{meetingTitle}</h1>

        <div className="nexus-top-actions">
          <button type="button" onClick={toggleFullscreen} title="Fullscreen">
            ⛶
          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen((value) => !value)}
            title="Toggle side panel"
          >
            ☰
          </button>
        </div>
      </header>

      <aside className="nexus-filmstrip">
        {sideTracks.length > 0
          ? sideTracks.slice(0, 4).map((trackRef) => (
              <div
                className="nexus-thumb"
                key={`${trackRef.participant?.identity}-${trackRef.source}`}
              >
                <ParticipantTile trackRef={trackRef} />
                <div className="nexus-thumb-name">
                  {trackRef.participant?.name ||
                    trackRef.participant?.identity ||
                    "Participant"}
                </div>
              </div>
            ))
          : participants.slice(0, 4).map((participant) => (
              <div
                className="nexus-thumb placeholder"
                key={participant.identity}
              >
                <div className="nexus-thumb-avatar">
                  <Initials value={participant.name || participant.identity} />
                </div>
                <div className="nexus-thumb-name">
                  {participant.name || participant.identity}
                </div>
              </div>
            ))}
      </aside>

      <main className="nexus-stage">
        <section className="nexus-main-card">
          {mainTrack ? (
            <ParticipantTile trackRef={mainTrack} className="nexus-main-tile" />
          ) : (
            <div className="nexus-waiting">
              Turn on camera or share your screen
            </div>
          )}

          <div className="nexus-nameplate">
            <strong>{hostName}</strong>
            <em>{screenShareTrack ? "is presenting" : "(Host)"}</em>
          </div>

          <div className="nexus-control-dock">
            <TrackToggle
              source={Track.Source.Microphone}
              className="zoom-control"
            >
              <span className="zoom-icon">🎙️</span>
              <small>Mute</small>
            </TrackToggle>

            <TrackToggle source={Track.Source.Camera} className="zoom-control">
              <span className="zoom-icon">🎥</span>
              <small>Video</small>
            </TrackToggle>

            <TrackToggle
              source={Track.Source.ScreenShare}
              className="zoom-control share"
            >
              <span className="zoom-icon">⬆</span>
              <small>Share</small>
            </TrackToggle>

            <button
              type="button"
              className="zoom-control long"
              onClick={() => {
                setSidebarOpen(true);
                setActivePanel("participants");
              }}
            >
              <span className="zoom-icon">👥</span>
              <small>People</small>
            </button>

            <button
              type="button"
              className="zoom-control long"
              onClick={() => {
                setSidebarOpen(true);
                setActivePanel("messages");
              }}
            >
              <span className="zoom-icon">💬</span>
              <small>Chat</small>
            </button>

            <div className="more-wrap">
              <button
                type="button"
                className="zoom-control long"
                onClick={() => setShowMore((value) => !value)}
              >
                <span className="zoom-icon">⋯</span>
                <small>More</small>
              </button>

              {showMore && (
                <div className="more-menu">
                  <button type="button" onClick={toggleFullscreen}>
                    Full screen
                  </button>

                  <button
                    type="button"
                    onClick={() => setSidebarOpen((value) => !value)}
                  >
                    {sidebarOpen ? "Hide side panel" : "Show side panel"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSidebarOpen(true);
                      setActivePanel("messages");
                    }}
                  >
                    Open chat
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSidebarOpen(true);
                      setActivePanel("participants");
                    }}
                  >
                    Open participants
                  </button>
                </div>
              )}
            </div>

            <DisconnectButton className="zoom-leave long">
              <span className="zoom-icon">☎</span>
              <small>Leave</small>
            </DisconnectButton>
          </div>
        </section>
      </main>

      <aside className="nexus-panel">
        <div className="nexus-panel-head">
          <h2>Project Sync</h2>
          <p>{participants.length || 1} Participants</p>
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
          <div className="nexus-people-list">
            {participants.map((participant) => (
              <div className="nexus-person" key={participant.identity}>
                <div>
                  <Initials value={participant.name || participant.identity} />
                </div>
                <span>{participant.name || participant.identity}</span>
                <small>{participant.isLocal ? "You" : "Participant"}</small>
              </div>
            ))}
          </div>
        )}

        {activePanel === "polls" && (
          <div className="nexus-empty">No active polls</div>
        )}
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