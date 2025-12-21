export const getRiskBadgeClass = (count: number): string => {
  if (count === 0) return "badge-success";
  if (count <= 3) return "badge-info";
  if (count <= 10) return "badge-warning";
  return "badge-error";
};

/**
 * Returns risk level label based on vulnerability count
 */
export const getRiskLevel = (count: number): string => {
  if (count === 0) return "Safe";
  if (count <= 3) return "Low";
  if (count <= 10) return "Medium";
  return "High";
};

/**
 * Returns Tailwind text color class based on severity
 */
export const getSeverityTextColor = (severity: string): string => {
  const normalizedSeverity = severity?.toLowerCase() ?? "";
  switch (normalizedSeverity) {
    case "critical":
      return "text-red-600 dark:text-red-400";
    case "high":
      return "text-orange-500 dark:text-orange-400";
    case "medium":
    case "moderate":
      return "text-yellow-600 dark:text-yellow-400";
    case "low":
      return "text-blue-500 dark:text-blue-400";
    default:
      return "text-green-600 dark:text-green-400";
  }
};

/**
 * Returns Tailwind background color class based on severity
 */
export const getSeverityBgColor = (severity: string): string => {
  const normalizedSeverity = severity?.toLowerCase() ?? "";
  switch (normalizedSeverity) {
    case "critical":
      return "bg-red-500";
    case "high":
      return "bg-orange-500";
    case "medium":
    case "moderate":
      return "bg-yellow-500";
    case "low":
      return "bg-blue-500";
    default:
      return "bg-green-500";
  }
};

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
