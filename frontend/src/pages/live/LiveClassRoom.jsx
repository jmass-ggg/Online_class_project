import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { useNavigate, useParams } from "react-router-dom";
import { clearLiveKitSession, getLiveKitSession } from "../../utils/livekitHelpers";

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
          <p>Please join again from your sessions page so the backend can return a LiveKit server URL and token.</p>
          <button className="btn btn-primary" type="button" onClick={() => navigateBack()}>Back to sessions</button>
        </div>
      </main>
    );
  }

  return (
    <main className="live-page">
      <header className="live-topbar">
        <div>
          <h1>{session.title || "Live Class"}</h1>
          <p>{session.course_title || "Course"} • {session.classroom_name || connection.roomName || "Classroom"}</p>
        </div>
        <span className="status-badge status-live">LIVE</span>
        <button className="btn btn-secondary" type="button" onClick={navigateBack}>Leave class</button>
      </header>
      <section className="live-stage">
        <LiveKitRoom token={participantToken} serverUrl={serverUrl} connect video audio onDisconnected={navigateBack}>
          <VideoConference />
        </LiveKitRoom>
      </section>
    </main>
  );
}
