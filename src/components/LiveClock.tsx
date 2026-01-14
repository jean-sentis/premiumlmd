import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getDemoNow } from "@/lib/site-config";
const LiveClock = () => {
  const [currentTime, setCurrentTime] = useState(getDemoNow());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getDemoNow());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format: "sam. 3 janvier 10:25:35" (toujours 3 janvier en mode démo)
  const formattedDate = format(currentTime, "EEE d MMMM HH:mm:ss", {
    locale: fr
  });
  return (
    <div className="inline-block">
      <span className="font-serif text-sm font-medium tracking-tight whitespace-nowrap">
        {formattedDate}
      </span>
    </div>
  );
};
export default LiveClock;