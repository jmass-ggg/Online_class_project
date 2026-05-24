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

function ZoomLikeClassroom({ session, connection }) {
  const [activePanel, setActivePanel] = useState("chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  const meetingTitle = session.title || "Live Class";
  const meetingSubtitle = `${session.course_title || "Course"} • ${
    session.classroom_name || connection.roomName || "Classroom"
  }`;

  const toggleFullscreen = async () => {
    const element = document.querySelector(".zoom-classroom-shell");

    try {
      if (!document.fullscreenElement) {
        await element?.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      // Ignore fullscreen errors from browser restrictions.
    }
  };

  return (
    <div className={`zoom-classroom-shell ${sidebarOpen ? "" : "sidebar-closed"}`}>
      <section className="zoom-video-area">
        <header className="zoom-meeting-header">
          <div>
            <div className="zoom-eyebrow">
              <span className="zoom-live-dot" />
              Live classroom
            </div>
            <h1>{meetingTitle}</h1>
            <p>{meetingSubtitle}</p>
          </div>

          <div className="zoom-header-actions">
            <div className="zoom-count-pill">
              {participants.length} participant{participants.length === 1 ? "" : "s"}
            </div>

            <button
              className="zoom-icon-btn"
              type="button"
              onClick={toggleFullscreen}
              title="Fullscreen"
            >
              ⛶
            </button>

            <button
              className="zoom-icon-btn"
              type="button"
              onClick={() => setSidebarOpen((value) => !value)}
              title="Toggle panel"
            >
              {sidebarOpen ? "☰" : "💬"}
            </button>
          </div>
        </header>

        <main className="zoom-stage-wrap">
          <div className="zoom-main-video">
            {mainTrack ? (
              <ParticipantTile trackRef={mainTrack} className="zoom-main-tile" />
            ) : (
              <div className="zoom-video-placeholder">
                Waiting for teacher or participants...
              </div>
            )}

            <div className="zoom-reaction-bar" aria-hidden="true">
              <span>👏</span>
              <span>👍</span>
              <span>😊</span>
              <span>❤️</span>
              <span>✋</span>
            </div>
          </div>

          <aside className="zoom-thumbnail-rail">
            {sideTracks.length ? (
              sideTracks.slice(0, 5).map((trackRef) => (
                <ParticipantTile
                  key={`${trackRef.participant?.identity}-${trackRef.source}`}
                  trackRef={trackRef}
                  className="zoom-thumb-tile"
                />
              ))
            ) : (
              <div className="zoom-thumb-empty">
                <span>No other cameras</span>
              </div>
            )}
          </aside>
        </main>

        <footer className="zoom-bottom-bar">
          <div className="zoom-left-controls">
            <span className="zoom-room-name">
              {connection.roomName || "Classroom room"}
            </span>
          </div>

          <div className="zoom-center-controls">
            <TrackToggle
              source={Track.Source.Microphone}
              className="zoom-control-btn"
            >
              🎙️ Mic
            </TrackToggle>

            <TrackToggle source={Track.Source.Camera} className="zoom-control-btn">
              🎥 Camera
            </TrackToggle>

            <TrackToggle
              source={Track.Source.ScreenShare}
              className="zoom-control-btn"
            >
              🖥️ Share
            </TrackToggle>

            <button
              className="zoom-control-btn"
              type="button"
              onClick={() => setActivePanel("participants")}
            >
              👥 People
            </button>

            <button
              className="zoom-control-btn"
              type="button"
              onClick={() => {
                setSidebarOpen(true);
                setActivePanel("chat");
              }}
            >
              💬 Chat
            </button>
          </div>

          <div className="zoom-right-controls">
            <DisconnectButton className="zoom-leave-btn">
              Leave
            </DisconnectButton>
          </div>
        </footer>
      </section>

      <aside className="zoom-side-panel">
        <div className="zoom-panel-tabs">
          <button
            type="button"
            className={activePanel === "chat" ? "active" : ""}
            onClick={() => setActivePanel("chat")}
          >
            Chat
          </button>

          <button
            type="button"
            className={activePanel === "participants" ? "active" : ""}
            onClick={() => setActivePanel("participants")}
          >
            Participants
          </button>
        </div>

        {activePanel === "chat" ? (
          <div className="zoom-chat-panel">
            <Chat />
          </div>
        ) : (
          <div className="zoom-participants-panel">
            <div className="zoom-panel-heading">
              <h2>Participants</h2>
              <span>{participants.length}</span>
            </div>

            <div className="zoom-people-list">
              {participants.map((participant) => (
                <div className="zoom-person-row" key={participant.identity}>
                  <div className="zoom-avatar">
                    {String(participant.name || participant.identity || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div>
                    <strong>{participant.name || participant.identity}</strong>
                    <span>{participant.isLocal ? "You" : "Participant"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
          <p>
            Please join again from your sessions page so the backend can return a
            LiveKit server URL and token.
          </p>
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
        video
        audio
        onDisconnected={navigateBack}
        data-lk-theme="default"
        className="livekit-custom-room"
      >
        <ZoomLikeClassroom session={session} connection={connection} />
      </LiveKitRoom>
    </main>
  );
}