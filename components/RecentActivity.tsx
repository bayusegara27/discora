import React, { useState, useEffect } from "react";

export interface ActivityItem {
  id: string;
  icon: React.ReactNode;
  text: React.ReactNode;
  timestamp: string;
}

interface RecentActivityProps {
  items: ActivityItem[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ items }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const timeSince = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
  };

  const jakartaTimezone = 'Asia/Jakarta';
  const jakartaTime = currentTime.toLocaleTimeString('en-GB', { timeZone: jakartaTimezone, hour: '2-digit', minute: '2-digit' });
  const jakartaDate = currentTime.toLocaleDateString('en-US', { timeZone: jakartaTimezone, weekday: 'long', day: 'numeric', month: 'long' });
  const utcTime = currentTime.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' });


  return (
    <div className="bg-surface/50 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-lg h-full flex flex-col space-y-6">
      {/* Date and Time Header */}
      <div>
        <p className="text-5xl font-bold text-accent -mb-1">
          {jakartaTime}
        </p>
        <p className="font-semibold text-text-secondary tracking-wide">
          {jakartaDate}
          <span className="ml-2 text-xs uppercase bg-secondary/50 px-1.5 py-0.5 rounded">WIB</span>
        </p>
        <p className="text-xs text-text-secondary/70 mt-1">
          (Data &amp; charts are in UTC: {utcTime} UTC)
        </p>
      </div>

      <hr className="border-white/10" />

      {/* Recent Activity Section */}
      <div className="flex-grow">
        <h3 className="text-lg font-semibold mb-4 text-text-primary">
          Recent Activity
        </h3>
        {items.length > 0 ? (
          <div className="relative">
            <div className="absolute left-3.5 top-0 h-full w-0.5 bg-white/10"></div>
            <ul className="space-y-6">
              {items.map((item) => (
                <li key={item.id} className="flex items-start space-x-4 relative">
                  <div className="flex-shrink-0 bg-secondary/80 text-accent rounded-full p-2 z-10">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-text-primary leading-tight">{item.text}</p>
                    <p className="text-xs text-text-secondary pt-1">
                      {timeSince(new Date(item.timestamp))}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center text-text-secondary py-8">
            <p>No recent activity to display.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;