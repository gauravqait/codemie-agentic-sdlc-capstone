import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div>
      <h2>Page not found</h2>
      <p>
        <Link to="/tickets">Go to tickets</Link>
      </p>
    </div>
  );
}
