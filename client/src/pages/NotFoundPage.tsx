import { Link } from 'react-router-dom';

export function NotFoundPage() {
    return (
        <div className="narrow" style={{ textAlign: 'center' }}>
            <h1>Not found</h1>
            <p className="muted">That page does not exist.</p>
            <Link to="/posts" className="button">
                Back to posts
            </Link>
        </div>
    );
}
