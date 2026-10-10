import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, X } from "lucide-react";
const FeedbackContext = createContext<(message: string) => void>(() => {});
export const useFeedback = () => useContext(FeedbackContext);
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<{ message: string; at: number } | null>(
    null,
  );
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  return (
    <FeedbackContext.Provider
      value={(message) => setNotice({ message, at: Date.now() })}
    >
      {children}
      {notice && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          <span>{notice.message}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice(null)}
          >
            <X size={17} />
          </button>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}
export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="skeleton" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <span key={i} style={{ width: `${100 - i * 12}%` }} />
      ))}
    </div>
  );
}
