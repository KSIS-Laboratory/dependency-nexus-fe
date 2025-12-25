/**
 * Chatbot API Client
 * Handles communication with the backend chatbot service
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CHATBOT_API = `${API_BASE_URL}/api/chatbot`;

export type ChatbotContextPayload = {
  message: string;
  autoSend?: boolean;
};

const CHATBOT_CONTEXT_EVENT = "chatbot:context" as const;

export function triggerChatbotContext(payload: ChatbotContextPayload) {
  if (globalThis.window === undefined) {
    return;
  }

  const event = new CustomEvent(CHATBOT_CONTEXT_EVENT, { detail: payload });
  globalThis.window.dispatchEvent(event);
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatResponse {
  conversation_id: string;
  user_message: string;
  assistant_response: string;
  timestamp: string;
}

export interface ConversationHistory {
  conversation_id: string;
  messages: ChatMessage[];
  message_count: number;
}

export interface ConversationSummary {
  conversation_id: string;
  summary: string;
}

export interface HealthStatus {
  status: "healthy" | "unhealthy";
  neo4j?: string;
  llama?: string;
  error?: string;
  hybrid_rag?: {
    enabled: boolean;
    qdrant: string;
    embeddings: string;
    vector_count: number;
  };
}

export interface RemediationStep {
  package: string;
  vulnerability_id: string;
  severity: string;
  summary: string;
  fixed_versions: string[];
  current_version: string;
}

export interface RepositoryAnalysis {
  repo_id: string;
  repo_name: string;
  owner: string;
  scan_timestamp: string;
  total_vulnerabilities: number;
  severity_breakdown: {
    CRITICAL: number;
    HIGH: number;
    MODERATE: number;
    LOW: number;
    UNKNOWN: number;
  };
  affected_packages: string[];
  remediation_steps: RemediationStep[];
}

export interface RemediationGuidance {
  repo_id: string;
  total_vulnerabilities: number;
  priority_order: Array<{
    id: string;
    summary: string;
    severity: string;
    affected_package: string;
    current_version: string;
  }>;
  remediation_plan: Array<{
    priority: number;
    vulnerability_id: string;
    severity: string;
    package: string;
    action: string;
  }>;
}

export class ChatbotClient {
  private conversationId: string | null = null;
  private readonly userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Send a message and get a response
   */
  async sendMessage(message: string): Promise<ChatResponse> {
    try {
      const payload: Record<string, unknown> = {
        message: message,
        user_id: this.userId,
      };

      if (this.conversationId) {
        payload.conversation_id = this.conversationId;
      }

      const response = await fetch(`${CHATBOT_API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      const data: ChatResponse = await response.json();
      this.conversationId = data.conversation_id ?? this.conversationId;
      return data;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  /**
   * Stream a message response token-by-token
   * @param message - User message to send
   * @param onToken - Callback for each token received
   * @param onComplete - Callback when streaming is complete
   * @param onError - Callback on error
   */
  async sendMessageStream(
    message: string,
    onToken: (token: string) => void,
    onComplete?: (fullResponse: string) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    try {
      const payload: Record<string, unknown> = {
        message: message,
        user_id: this.userId,
      };

      if (this.conversationId) {
        payload.conversation_id = this.conversationId;
      }

      const response = await fetch(`${CHATBOT_API}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to start stream: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body reader available");
      }

      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // Parse SSE events
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === "start" && data.conversation_id) {
                this.conversationId = data.conversation_id;
              } else if (data.type === "token" && data.content) {
                fullResponse += data.content;
                onToken(data.content);
              } else if (data.type === "done") {
                onComplete?.(fullResponse);
              } else if (data.type === "error") {
                onError?.(data.message || "Unknown streaming error");
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (error) {
      console.error("Error streaming message:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      onError?.(errorMsg);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  async getHistory(): Promise<ConversationHistory> {
    if (!this.conversationId) {
      throw new Error("No active conversation.");
    }

    try {
      const response = await fetch(
        `${CHATBOT_API}/conversations/${this.conversationId}/history`
      );

      if (!response.ok) {
        throw new Error(`Failed to get history: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting history:", error);
      throw error;
    }
  }

  /**
   * Get conversation summary
   */
  async getSummary(): Promise<ConversationSummary> {
    if (!this.conversationId) {
      throw new Error("No active conversation.");
    }

    try {
      const response = await fetch(
        `${CHATBOT_API}/conversations/${this.conversationId}/summary`
      );

      if (!response.ok) {
        throw new Error(`Failed to get summary: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting summary:", error);
      throw error;
    }
  }

  /**
   * Check chatbot health
   */
  static async checkHealth(): Promise<HealthStatus> {
    try {
      const response = await fetch(`${CHATBOT_API}/health`);

      if (!response.ok) {
        return {
          status: "unhealthy",
          error: `Health check failed: ${response.statusText}`,
        };
      }

      return await response.json();
    } catch (error) {
      console.error("Error checking health:", error);
      return {
        status: "unhealthy",
        error: String(error),
      };
    }
  }

  /**
   * Set the conversation ID (for resuming conversations)
   */
  setConversationId(id: string): void {
    this.conversationId = id;
  }

  /**
   * Get the current conversation ID
   */
  getConversationId(): string | null {
    return this.conversationId;
  }

  /**
   * Analyze repository vulnerabilities
   */
  static async analyzeRepository(
    repoId: string,
    repoName: string,
    owner: string,
    vulnerabilities: any[],
    scanTimestamp: string
  ): Promise<RepositoryAnalysis> {
    try {
      const response = await fetch(`${CHATBOT_API}/repositories/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo_id: repoId,
          repo_name: repoName,
          owner: owner,
          vulnerabilities: vulnerabilities,
          scan_timestamp: scanTimestamp,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze repository: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error analyzing repository:", error);
      throw error;
    }
  }

  /**
   * Get remediation guidance for a repository
   */
  static async getRemediationGuidance(
    repoId: string
  ): Promise<RemediationGuidance> {
    try {
      const response = await fetch(
        `${CHATBOT_API}/repositories/${repoId}/remediation`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get remediation guidance: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting remediation guidance:", error);
      throw error;
    }
  }

  /**
   * Extract vulnerability context from a JSON file for LLM prompt enhancement
   */
  static async extractVulnerabilityContext(
    filePath: string,
    options?: {
      filterSeverity?: string[];
      maxVulns?: number;
      includeHeader?: boolean;
    }
  ): Promise<VulnerabilityContextResponse> {
    try {
      const response = await fetch(`${CHATBOT_API}/vulnerabilities/extract-context`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_path: filePath,
          filter_severity: options?.filterSeverity,
          max_vulns: options?.maxVulns ?? 20,
          include_header: options?.includeHeader ?? true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to extract vulnerability context: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error extracting vulnerability context:", error);
      throw error;
    }
  }

  /**
   * Extract detailed vulnerability data from a JSON file
   */
  static async extractVulnerabilities(
    filePath: string,
    options?: {
      filterSeverity?: string[];
      maxVulns?: number;
    }
  ): Promise<VulnerabilityExtractionResponse> {
    try {
      const response = await fetch(`${CHATBOT_API}/vulnerabilities/extract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_path: filePath,
          filter_severity: options?.filterSeverity,
          max_vulns: options?.maxVulns ?? 50,
          include_header: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to extract vulnerabilities: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error extracting vulnerabilities:", error);
      throw error;
    }
  }

  /**
   * Extract vulnerability context for a repository from MinIO storage
   * Automatically fetches the latest scan and extracts context for LLM
   */
  static async extractRepositoryContext(
    repoId: string,
    maxVulns: number = 15
  ): Promise<VulnerabilityContextResponse> {
    try {
      const response = await fetch(
        `${CHATBOT_API}/repository/${encodeURIComponent(repoId)}/context?max_vulns=${maxVulns}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to extract repository context: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error extracting repository context:", error);
      throw error;
    }
  }
}

// ============================================
// Vulnerability Extraction Types & Functions
// ============================================

export interface ExtractedVulnerability {
  id: string;
  severity: string;
  package: string;
  current_version: string;
  ecosystem: string;
  summary: string;
  affected: string[];
  fixed: string[];
  cwe: string[];
  aliases: string[];
}

export interface VulnerabilityContextResponse {
  context: string;
  vulnerability_count: number;
  severity_counts: Record<string, number>;
  summary: string;
}

export interface VulnerabilityExtractionResponse {
  vulnerabilities: ExtractedVulnerability[];
  total_count: number;
  severity_breakdown: Record<string, number>;
  affected_packages: string[];
}

/**
 * Re-export severity utilities from centralized module for backward compatibility
 */
export { 
  getSeverityTextClass as getSeverityColor, 
  getSeverityBadgeClass 
} from "./severity";

