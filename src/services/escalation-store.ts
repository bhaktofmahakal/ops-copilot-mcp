import { Redis } from "@upstash/redis";
import { Escalation, EscalationStatus, DiscrepancyType, EscalationEvidence } from "../types.js";

export interface CreateEscalationInput {
  order_id: string;
  discrepancy_type: DiscrepancyType;
  severity: "low" | "medium" | "high" | "critical";
  diagnosis: string;
  evidence: EscalationEvidence;
  recommended_action: string;
}

export interface ListEscalationsFilter {
  order_id?: string;
  status?: EscalationStatus;
  limit?: number;
  offset?: number;
}

export class EscalationStoreService {
  private inMemoryMap: Map<string, Escalation> = new Map();
  private redisClient: Redis | null = null;
  private nextIdSequence = 4001;

  constructor() {
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
    if (url && token) {
      this.redisClient = new Redis({ url, token });
    }
  }

  async create(input: CreateEscalationInput): Promise<Escalation> {
    const now = new Date().toISOString();
    const escalation_id = `ESC-${this.nextIdSequence++}`;

    const newEscalation: Escalation = {
      escalation_id,
      order_id: input.order_id,
      discrepancy_type: input.discrepancy_type,
      severity: input.severity,
      diagnosis: input.diagnosis,
      evidence: input.evidence,
      recommended_action: input.recommended_action,
      status: "open",
      created_at: now,
      updated_at: now
    };

    if (this.redisClient) {
      try {
        await this.redisClient.set(`escalation:${escalation_id}`, JSON.stringify(newEscalation));
        await this.redisClient.sadd("escalation_ids", escalation_id);
      } catch (err) {
        console.warn("Failed writing to Upstash Redis, falling back to memory store:", err);
        this.inMemoryMap.set(escalation_id, newEscalation);
      }
    } else {
      this.inMemoryMap.set(escalation_id, newEscalation);
    }

    return newEscalation;
  }

  async getById(escalation_id: string): Promise<Escalation | null> {
    if (this.redisClient) {
      try {
        const raw = await this.redisClient.get<string>(`escalation:${escalation_id}`);
        if (!raw) return null;
        return typeof raw === "string" ? JSON.parse(raw) : (raw as unknown as Escalation);
      } catch (err) {
        console.warn("Failed reading from Upstash Redis, falling back to memory store:", err);
      }
    }
    return this.inMemoryMap.get(escalation_id) || null;
  }

  async list(filter: ListEscalationsFilter = {}): Promise<{ total: number; count: number; offset: number; escalations: Escalation[]; has_more: boolean; next_offset?: number }> {
    let allEscalations: Escalation[] = [];

    if (this.redisClient) {
      try {
        const ids = await this.redisClient.smembers("escalation_ids");
        for (const id of ids) {
          const esc = await this.getById(id);
          if (esc) allEscalations.push(esc);
        }
      } catch (err) {
        console.warn("Failed listing from Upstash Redis, falling back to memory store:", err);
        allEscalations = Array.from(this.inMemoryMap.values());
      }
    } else {
      allEscalations = Array.from(this.inMemoryMap.values());
    }

    // Filter
    if (filter.order_id) {
      allEscalations = allEscalations.filter((e) => e.order_id === filter.order_id);
    }
    if (filter.status) {
      allEscalations = allEscalations.filter((e) => e.status === filter.status);
    }

    // Sort newest first
    allEscalations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = allEscalations.length;
    const offset = filter.offset || 0;
    const limit = filter.limit || 20;

    const items = allEscalations.slice(offset, offset + limit);
    const has_more = total > offset + items.length;

    return {
      total,
      count: items.length,
      offset,
      escalations: items,
      has_more,
      ...(has_more ? { next_offset: offset + items.length } : {})
    };
  }

  // Helper for unit test resets
  clearInMemory(): void {
    this.inMemoryMap.clear();
    this.nextIdSequence = 4001;
  }
}

export const escalationStore = new EscalationStoreService();
