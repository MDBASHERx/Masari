import "../../styles/loading.css";

export default function LoadingIndicator({ children, announce = true }) {
    return <span className="loading-indicator" role={announce ? "status" : undefined}>
        <span className="loading-indicator__ring" aria-hidden="true" />
        <span>{children}</span>
    </span>;
}
