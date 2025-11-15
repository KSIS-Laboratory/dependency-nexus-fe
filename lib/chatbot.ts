/**
 * Chatbot API Client
 * Handles communication with the backend chatbot service
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CHATBOT_API = `${API_BASE_URL}/api/chatbot`;

export interface MessageEntity {
  name: string;
  type: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  entities?: MessageEntity[];
}

export interface ChatResponse {
  conversation_id: string;
  user_message: string;
  assistant_response: string;
  entities: MessageEntity[];
  response_entities: MessageEntity[];
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
}

export class ChatbotClient {
  private conversationId: string | null = null;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Create a new conversation
   */
  async createConversation(): Promise<string> {
    try {
      const response = await fetch(`${CHATBOT_API}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: this.userId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.statusText}`);
      }

      const data = await response.json();
      this.conversationId = data.conversation_id;
      return data.conversation_id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  }

  /**
   * Send a message and get a response
   */
  async sendMessage(message: string): Promise<ChatResponse> {
    if (!this.conversationId) {
      throw new Error("No active conversation. Call createConversation first.");
    }

    try {
      const response = await fetch(`${CHATBOT_API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation_id: this.conversationId,
          message: message,
          user_id: this.userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending message:", error);
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
}
