import { useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";

import "@livekit/components-styles";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("access") || ""
  );

  const [sessionId, setSessionId] = useState("");
  const [connection, setConnection] = useState(null);
  const [message, setMessage] = useState("");

  async function login(e) {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify(data, null, 2));
      }

      localStorage.setItem("access", data.access);
      setAccessToken(data.access);
      setMessage("Login successful.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function callSessionAction(action) {
    setMessage("");

    if (!accessToken) {
      setMessage("Please login first.");
      return;
    }

    if (!sessionId) {
      setMessage("Please enter class session ID.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ClassSession/${sessionId}/${action}/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify(data, null, 2));
      }

      setConnection({
        serverUrl: data.server_url,
        token: data.participant_token,
        roomName: data.room_name,
      });

      setMessage(`${action} success.`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  function logout() {
    localStorage.removeItem("access");
    setAccessToken("");
    setConnection(null);
    setMessage("Logged out.");
  }

  if (connection) {
    return (
      <LiveKitRoom
        serverUrl={connection.serverUrl}
        token={connection.token}
        connect={true}
        audio={true}
        video={true}
        data-lk-theme="default"
        style={{ height: "100vh" }}
        onDisconnected={() => setConnection(null)}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    );
  }

  return (
    <div className="page">
      <div className="card">
        <h1>Live Class Test</h1>

        <form onSubmit={login} className="section">
          <h2>1. Login</h2>

          <input
            type="email"
            placeholder="teacher/student email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Login</button>

          {accessToken && (
            <button type="button" onClick={logout} className="danger">
              Logout
            </button>
          )}
        </form>

        <div className="section">
          <h2>2. Enter Class Session ID</h2>

          <input
            placeholder="Example: 9c6e3b7d-8dff-4dcb-9ec9-7e2bf2195a74"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
          />
        </div>

        <div className="section">
          <h2>3. Start or Join</h2>

          <button onClick={() => callSessionAction("start")}>
            Start as Teacher
          </button>

          <button onClick={() => callSessionAction("join")}>
            Join as Student
          </button>
        </div>

        {message && <pre>{message}</pre>}
      </div>
    </div>
  );
}

export default App;