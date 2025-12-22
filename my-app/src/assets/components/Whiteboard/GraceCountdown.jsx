import { useEffect,useState } from "react";

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
    <div className="graceOverlay">
      Admin disconnected  
      <br />
      Reconnecting in {timeLeft}s…
    </div>
  );
}
