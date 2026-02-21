import { useEffect, useState } from "react";

export default function GraceCountdown({ endsAt }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.max(0, endsAt - Date.now());
      setTimeLeft(Math.ceil(diff / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt]);

  if (timeLeft <= 0) return null;

  return (
    <div className="position-fixed top-0 start-0 w-100 vh-100 
                bg-dark bg-opacity-75 
                d-flex flex-column 
                justify-content-center 
                align-items-center 
                text-white text-center 
                z-3">
      <div className="bg-black bg-opacity-50 p-4 rounded shadow-lg">
        <div className="spinner-border text-light mb-3" role="status" />
        <h5 className="mb-2">Admin Disconnected</h5>
        <p className="mb-0">
          Reconnecting in <span className="fw-bold">{timeLeft}s</span>…
        </p>
      </div>

    </div>
  );
}
