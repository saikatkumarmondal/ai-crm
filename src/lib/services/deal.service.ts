// src/lib/services/deal.service.ts

import { dealRepository } from "@/lib/repositories/deal.repository";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { userRepository } from "@/lib/repositories/user.repository";
import { DEAL_STAGE_DEFAULT_PROBABILITY, DEAL_CLOSED_STAGES } from "@/lib/constants/dealStage";
import { triggerWorkflows } from "@/lib/workflow/engine";
import type { CreateDealInput, UpdateDealInput, UpdateDealStageInput } from "@/lib/validators/deal.validator";
import type { DealStage } from "@prisma/client";

class DealError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function assertCustomerExists(customerId: string, organizationId: string) {
  const customer = await customerRepository.findById(customerId, organizationId);
  if (!customer) {
    throw new DealError("Customer not found", 404);
  }
}

async function assertOwnerValid(ownerId: string, organizationId: string) {
  const owner = await userRepository.findById(ownerId);
  if (!owner || owner.organizationId !== organizationId) {
    throw new DealError("Owner not found in this organization", 422);
  }
}

export const dealService = {
  async create(organizationId: string, createdById: string, input: CreateDealInput) {
    await assertCustomerExists(input.customerId, organizationId);
    if (input.ownerId) {
      await assertOwnerValid(input.ownerId, organizationId);
    }

    return dealRepository.create({
      organizationId,
      createdById,
      customerId: input.customerId,
      title: input.title,
      value: input.value,
      currency: input.currency ?? "BDT",
      expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : null,
      ownerId: input.ownerId ?? createdById,
      notes: input.notes || null,
      probability: DEAL_STAGE_DEFAULT_PROBABILITY.QUALIFICATION,
    });
  },

  async list(
    organizationId: string,
    query: { search?: string; stage?: DealStage; ownerId?: string; customerId?: string },
    pagination: { skip: number; take: number }
  ) {
    return dealRepository.findMany({
      organizationId,
      ...query,
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
    if (DEAL_CLOSED_STAGES.includes(existing.stage)) {
      throw new DealError("Cannot edit a deal that is already closed (WON/LOST)", 409);
    }
    if (input.ownerId) {
      await assertOwnerValid(input.ownerId, organizationId);
    }

    const result = await dealRepository.update(id, organizationId, {
      ...input,
      expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : undefined,
    });

    if (result.count === 0) {
      throw new DealError("Deal not found", 404);
    }
    return dealRepository.findById(id, organizationId);
  },

 async updateStage(id: string, organizationId: string, input: UpdateDealStageInput){
    const existing = await dealRepository.findById(id, organizationId);
    if (!existing) {
      throw new DealError("Deal not found", 404);
    }
    if (DEAL_CLOSED_STAGES.includes(existing.stage)) {
      throw new DealError("Deal is already closed and cannot change stage", 409);
    }

    const isClosing = DEAL_CLOSED_STAGES.includes(input.stage);

    await dealRepository.update(id, organizationId, {
      stage: input.stage,
      probability: input.probability ?? DEAL_STAGE_DEFAULT_PROBABILITY[input.stage],
      lostReason: input.stage === "LOST" ? input.lostReason : null,
      closedAt: isClosing ? new Date() : null,
    });

    const updatedDeal = await dealRepository.findById(id, organizationId);

    if (input.stage === "WON") {
      triggerWorkflows(organizationId, "DEAL_WON", {
        dealId: id,
        title: updatedDeal?.title,
        value: updatedDeal ? Number(updatedDeal.value) : 0,
      }).catch((err) => console.error("Workflow trigger error (DEAL_WON):", err));
    } else if (input.stage === "LOST") {
      triggerWorkflows(organizationId, "DEAL_LOST", {
        dealId: id,
        title: updatedDeal?.title,
        lostReason: input.lostReason,
      }).catch((err) => console.error("Workflow trigger error (DEAL_LOST):", err));
    }

    return updatedDeal;
  },

  async delete(id: string, organizationId: string) {
    const result = await dealRepository.softDelete(id, organizationId);
    if (result.count === 0) {
      throw new DealError("Deal not found", 404);
    }
  },

  async pipelineSummary(organizationId: string) {
  const grouped = await dealRepository.pipelineSummary(organizationId);
  return grouped.map((g) => ({
    stage: g.stage,
    count: g._count._all,
    totalValue: g._sum.value ?? 0,
  }));

  },
};

export { DealError };