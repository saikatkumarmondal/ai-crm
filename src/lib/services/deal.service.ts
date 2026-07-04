// src/lib/services/deal.service.ts

import { dealRepository } from "@/lib/repositories/deal.repository";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { userRepository } from "@/lib/repositories/user.repository";
import type { CreateDealInput, UpdateDealInput } from "@/lib/validators/deal.validator";
import type { DealStage } from "@prisma/client";

class DealError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export const dealService = {
  async create(organizationId: string, createdById: string, input: CreateDealInput) {
    // Verify customer exists and belongs to org
    const customer = await customerRepository.findById(input.customerId, organizationId);
    if (!customer) {
      throw new DealError("Customer not found", 404);
    }

    // Verify owner if provided
    if (input.ownerId) {
      const owner = await userRepository.findById(input.ownerId);
      if (!owner || owner.organizationId !== organizationId) {
        throw new DealError("Deal owner not found in this organization", 422);
      }
    }

    return dealRepository.create({
      organizationId,
      customerId: input.customerId,
      createdById,
      title: input.title,
      value: input.value,
      currency: input.currency || "BDT",
      stage: input.stage || "QUALIFICATION",
      probability: input.probability || 10,
      expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : null,
      notes: input.notes || null,
      ownerId: input.ownerId || null,
    });
  },

  async list(
    organizationId: string,
    query: { search?: string; stage?: DealStage; ownerId?: string; customerId?: string },
    pagination: { skip: number; take: number }
  ) {
    return dealRepository.findMany({
      organizationId,
      search: query.search,
      stage: query.stage,
      ownerId: query.ownerId,
      customerId: query.customerId,
      skip: pagination.skip,
      take: pagination.take,
    });
  },

  async getById(id: string, organizationId: string) {
    const deal = await dealRepository.findById(id, organizationId);
    if (!deal) {
      throw new DealError("Deal not found", 404);
    }
    return deal;
  },

  async update(id: string, organizationId: string, input: UpdateDealInput) {
    const existing = await dealRepository.findById(id, organizationId);
    if (!existing) {
      throw new DealError("Deal not found", 404);
    }

    // Verify customer if provided
    if (input.customerId && input.customerId !== existing.customerId) {
      const customer = await customerRepository.findById(input.customerId, organizationId);
      if (!customer) {
        throw new DealError("Customer not found", 404);
      }
    }

    // Verify owner if provided
    if (input.ownerId !== undefined && input.ownerId !== null) {
      const owner = await userRepository.findById(input.ownerId);
      if (!owner || owner.organizationId !== organizationId) {
        throw new DealError("Deal owner not found in this organization", 422);
      }
    }

    const updateData: any = {};
    if (input.title) updateData.title = input.title;
    if (input.value !== undefined) updateData.value = input.value;
    if (input.currency) updateData.currency = input.currency;
    if (input.stage) updateData.stage = input.stage;
    if (input.probability !== undefined) updateData.probability = input.probability;
    if (input.expectedCloseDate !== undefined)
      updateData.expectedCloseDate = input.expectedCloseDate
        ? new Date(input.expectedCloseDate)
        : null;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.ownerId !== undefined) updateData.ownerId = input.ownerId;
    if (input.customerId) updateData.customerId = input.customerId;

    const result = await dealRepository.update(id, organizationId, updateData);
    if (result.count === 0) {
      throw new DealError("Deal not found", 404);
    }

    return dealRepository.findById(id, organizationId);
  },

  async updateStage(id: string, organizationId: string, stage: DealStage) {
    const existing = await dealRepository.findById(id, organizationId);
    if (!existing) {
      throw new DealError("Deal not found", 404);
    }

    const updateData: any = { stage };

    // Auto-close deal if moving to WON or LOST
    if (stage === "WON" || stage === "LOST") {
      updateData.closedAt = new Date();
    }

    await dealRepository.update(id, organizationId, updateData);
    return dealRepository.findById(id, organizationId);
  },

  async delete(id: string, organizationId: string) {
    const existing = await dealRepository.findById(id, organizationId);
    if (!existing) {
      throw new DealError("Deal not found", 404);
    }

    const result = await dealRepository.delete(id, organizationId);
    if (result.count === 0) {
      throw new DealError("Deal not found", 404);
    }

    return { id, message: "Deal deleted successfully" };
  },

  async getPipelineStats(organizationId: string) {
    return dealRepository.getDealsByStage(organizationId);
  },
};
