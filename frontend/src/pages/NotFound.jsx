import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="not-found-page">
      <h1>404</h1>
      <p>The page you are looking for does not exist.</p>
      <Link className="btn btn-primary" to="/">Back home</Link>
    </section>
  );
}
