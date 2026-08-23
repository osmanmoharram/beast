export function Spinner({ label = 'Loading' }: { label?: string }) {
    return (
        <p className="state" role="status">
            <span className="spinner" aria-hidden="true" />
            {label}…
        </p>
    );
}
