export const formatLastSeen = (isoString?: string | null): string => {
  if (!isoString) return "Offline";
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 2) return "Active just now";
    if (diffMins < 60) return `Last seen ${diffMins} minutes ago`;
    if (diffHours === 1) return "Last seen 1 hour ago";
    if (diffHours < 24) return `Last seen ${diffHours} hours ago`;
    if (diffDays === 1) return "Last seen yesterday";
    if (diffDays < 7) return `Last seen ${diffDays} days ago`;
    return `Last seen ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`;
  } catch {
    return "Offline";
  }
};

export const formatTime = (isoString?: string | null): string => {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};
