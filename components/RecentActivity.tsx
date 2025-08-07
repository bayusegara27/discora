import React from "react";

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

  return (
    <div className="bg-surface p-6 rounded-lg shadow-lg h-full">
      <h3 className="text-lg font-semibold mb-4 text-text-primary">
        Recent Activity
      </h3>
      {items.length > 0 ? (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 text-text-secondary mt-1">
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm text-text-primary">{item.text}</p>
                <p className="text-xs text-text-secondary">
                  {timeSince(new Date(item.timestamp))}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center text-text-secondary py-8">
          <p>No recent activity to display.</p>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
