/**
 * Centralized Severity Color Configuration
 * All severity-related styling should use these functions for consistency
 */

export type SeverityLevel = "CRITICAL" | "HIGH" | "MODERATE" | "MEDIUM" | "LOW" | "UNKNOWN";

/**
 * Get DaisyUI badge class for severity level
 * Each severity has a distinct color:
 * - CRITICAL: error (red)
 * - HIGH: warning (orange/amber)  
 * - MODERATE/MEDIUM: accent (purple/violet)
 * - LOW: info (blue)
 * - UNKNOWN: ghost (gray)
 */
export function getSeverityBadgeClass(severity: string): string {
  const classes: Record<string, string> = {
    CRITICAL: "badge-error",
    HIGH: "badge-warning",
    MODERATE: "badge-accent",
    MEDIUM: "badge-accent",
    LOW: "badge-info",
    UNKNOWN: "badge-ghost",
  };
  return classes[severity.toUpperCase()] || classes.UNKNOWN;
}

/**
 * Get text color class for severity level
 */
export function getSeverityTextClass(severity: string): string {
  const classes: Record<string, string> = {
    CRITICAL: "text-error",
    HIGH: "text-warning",
    MODERATE: "text-accent",
    MEDIUM: "text-accent",
    LOW: "text-info",
    UNKNOWN: "text-base-content/50",
  };
  return classes[severity.toUpperCase()] || classes.UNKNOWN;
}

/**
 * Get background color class for severity cards/containers
 */
export function getSeverityBgClass(severity: string): string {
  const classes: Record<string, string> = {
    CRITICAL: "bg-error/10 text-error border-error/30",
    HIGH: "bg-warning/10 text-warning border-warning/30",
    MODERATE: "bg-accent/10 text-accent border-accent/30",
    MEDIUM: "bg-accent/10 text-accent border-accent/30",
    LOW: "bg-info/10 text-info border-info/30",
    UNKNOWN: "bg-base-200 text-base-content/60 border-base-content/20",
  };
  return classes[severity.toUpperCase()] || classes.UNKNOWN;
}

/**
 * Get border color class for severity
 */
export function getSeverityBorderClass(severity: string): string {
  const classes: Record<string, string> = {
    CRITICAL: "border-error",
    HIGH: "border-warning",
    MODERATE: "border-accent",
    MEDIUM: "border-accent",
    LOW: "border-info",
    UNKNOWN: "border-base-content/30",
  };
  return classes[severity.toUpperCase()] || classes.UNKNOWN;
}

/**
 * Get severity level from CVSS score
 */
export function getSeverityFromScore(score: number): SeverityLevel {
  if (score >= 9) return "CRITICAL";
  if (score >= 7) return "HIGH";
  if (score >= 4) return "MODERATE";
  if (score > 0) return "LOW";
  return "UNKNOWN";
}

/**
 * Get severity label from CVSS score
 */
export function getSeverityLabel(score: number): string {
  const severity = getSeverityFromScore(score);
  return severity.charAt(0) + severity.slice(1).toLowerCase();
}

/**
 * Ordered severity levels for consistent display
 */
export const SEVERITY_ORDER: SeverityLevel[] = ["CRITICAL", "HIGH", "MODERATE", "LOW", "UNKNOWN"];

/**
 * DaisyUI CSS variable mappings for severity levels
 * These map to DaisyUI's oklch color variables
 */
export const SEVERITY_CSS_VARS: Record<string, string> = {
  CRITICAL: "--er",    // error
  HIGH: "--wa",        // warning
  MODERATE: "--a",     // accent
  MEDIUM: "--a",       // accent (same as moderate)
  LOW: "--in",         // info
  UNKNOWN: "--bc",     // base-content
};

/**
 * DaisyUI CSS variable mappings for node types
 */
export const NODE_TYPE_CSS_VARS: Record<string, string> = {
  REPOSITORY: "--p",   // primary
  PACKAGE: "--s",      // secondary
  SCAN: "--su",        // success
  DEFAULT: "--bc",     // base-content
};

/**
 * Fallback hex colors when CSS variables aren't available (e.g., SSR)
 * These should roughly match common DaisyUI themes
 */
const FALLBACK_COLORS: Record<string, string> = {
  "--er": "#ef4444",   // error - red
  "--wa": "#f59e0b",   // warning - amber  
  "--a": "#2dd4bf",    // accent - teal (common in many themes)
  "--in": "#3b82f6",   // info - blue
  "--su": "#22c55e",   // success - green
  "--p": "#7c3aed",    // primary - violet
  "--s": "#f472b6",    // secondary - pink
  "--bc": "#6b7280",   // base-content - gray
};

/**
 * Get actual color value from DaisyUI CSS variable
 * Reads from CSS variables at runtime, falls back only during SSR
 * @param cssVar - CSS variable name (e.g., "--er", "--wa")
 * @returns Color string (oklch or hex fallback)
 */
export function getCssVarColor(cssVar: string): string {
  // SSR fallback - use hex colors
  if (globalThis.window === undefined) {
    return FALLBACK_COLORS[cssVar] || "#6b7280";
  }
  
  // Client-side - read from CSS variables
  try {
    const style = getComputedStyle(document.documentElement);
    const val = style.getPropertyValue(cssVar).trim();
    if (val) {
      return `oklch(${val})`;
    }
  } catch {
    // Fallback if getComputedStyle fails
  }
  
  return FALLBACK_COLORS[cssVar] || "#6b7280";
}

/**
 * Get hex color for severity level (uses DaisyUI CSS variables)
 * @param severity - Severity level string
 * @returns Color string from CSS variable or fallback
 */
export function getSeverityHexColor(severity: string): string {
  const cssVar = SEVERITY_CSS_VARS[severity?.toUpperCase()] || SEVERITY_CSS_VARS.UNKNOWN;
  return getCssVarColor(cssVar);
}

/**
 * Get hex color for node type (uses DaisyUI CSS variables)
 * @param nodeType - Node type string
 * @returns Color string from CSS variable or fallback
 */
export function getNodeTypeHexColor(nodeType: string): string {
  const cssVar = NODE_TYPE_CSS_VARS[nodeType?.toUpperCase()] || NODE_TYPE_CSS_VARS.DEFAULT;
  return getCssVarColor(cssVar);
}

/**
 * Legend items for severity in graph visualizations
 * Uses DaisyUI color classes for consistent theming
 */
export const SEVERITY_LEGEND_ITEMS = [
  { label: "Critical", colorClass: "bg-error" },
  { label: "High", colorClass: "bg-warning" },
  { label: "Moderate", colorClass: "bg-accent" },
  { label: "Low", colorClass: "bg-info" },
  { label: "Unknown", colorClass: "bg-base-content/50" },
];

/**
 * Full legend items including node types
 * Uses DaisyUI color classes for consistent theming
 */
export const FULL_LEGEND_ITEMS = [
  { label: "Repository", colorClass: "bg-primary" },
  { label: "Package", colorClass: "bg-secondary" },
  { label: "Critical", colorClass: "bg-error" },
  { label: "High", colorClass: "bg-warning" },
  { label: "Moderate", colorClass: "bg-accent" },
  { label: "Low", colorClass: "bg-info" },
  { label: "Scan", colorClass: "bg-success" },
];

export const SEVERITY_COLORS: Record<string, string> = {
    CRITICAL: "#ef4444",
    HIGH: "#f59e0b",
    MODERATE: "#2dd4bf",
    MEDIUM: "#2dd4bf",
    LOW: "#3b82f6",
    UNKNOWN: "#6b7280",
};