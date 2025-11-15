export const formatDateTime = (timestamp?: string) => {
  if (!timestamp) return "No scans recorded";
  return new Date(timestamp).toLocaleString();
};

export const formatRelativeTime = (timestamp?: string) => {
  if (!timestamp) return "Not scanned yet";
  const diff = Date.now() - new Date(timestamp).getTime();
  if (diff < 0) return "In progress";

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
};

export const getRiskBadgeClass = (count: number) => {
  if (count === 0) return "badge badge-success badge-lg";
  if (count <= 5) return "badge badge-warning badge-lg";
  return "badge badge-error badge-lg";
};
