// src/lib/services/lead.service.ts

import { leadRepository } from "@/lib/repositories/lead.repository";
import { customerRepository } from "@/lib/repositories/customer.repository";
import { userRepository } from "@/lib/repositories/user.repository";
import { prisma } from "@/lib/prisma";
import type { CreateLeadInput, UpdateLeadInput } from "@/lib/validators/lead.validator";
import type { LeadStatus } from "@prisma/client";

class LeadError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export const leadService = {
  async create(organizationId: string, createdById: string, input: CreateLeadInput) {
    if (input.email) {
      const existing = await leadRepository.findByEmail(input.email, organizationId);
      if (existing) {
        throw new LeadError("A lead with this email already exists", 409);
      }
    }

    if (input.assignedToId) {
      const assignee = await userRepository.findById(input.assignedToId);
      if (!assignee || assignee.organizationId !== organizationId) {
        throw new LeadError("Assigned user not found in this organization", 422);
      }
    }

    return leadRepository.create({
      organizationId,
      createdById,
      fullName: input.fullName,
      email: input.email || null,
      phone: input.phone || null,
      companyName: input.companyName || null,
      source: input.source,
      notes: input.notes || null,
      assignedToId: input.assignedToId || null,
    });
  },

  async list(
    organizationId: string,
    query: { search?: string; status?: LeadStatus; assignedToId?: string },
    pagination: { skip: number; take: number }
  ) {
    return leadRepository.findMany({
      organizationId,
      search: query.search,
      status: query.status,
      assignedToId: query.assignedToId,
      skip: pagination.skip,
      take: pagination.take,
    });
  },

  async getById(id: string, organizationId: string) {
    const lead = await leadRepository.findById(id, organizationId);
    if (!lead) {
      throw new LeadError("Lead not found", 404);
    }
    return lead;
  },

  async update(id: string, organizationId: string, input: UpdateLeadInput) {
    const existing = await leadRepository.findById(id, organizationId);
    if (!existing) {
      throw new LeadError("Lead not found", 404);
    }

    if (existing.status === "CONVERTED") {
      throw new LeadError("Cannot edit a lead that has already been converted", 409);
    }

    const result = await leadRepository.update(id, organizationId, input);
    if (result.count === 0) {
      throw new LeadError("Lead not found", 404);
    }

    return leadRepository.findById(id, organizationId);
  },

  async updateStatus(id: string, organizationId: string, status: LeadStatus) {
    const existing = await leadRepository.findById(id, organizationId);
    if (!existing) {
      throw new LeadError("Lead not found", 404);
    }
    if (existing.status === "CONVERTED") {
      throw new LeadError("Cannot change status of a converted lead", 409);
    }
    if (status === "CONVERTED") {
      throw new LeadError("Use the /convert endpoint to convert a lead", 400);
    }

    await leadRepository.update(id, organizationId, { status });
    return leadRepository.findById(id, organizationId);
  },

  async assign(id: string, organizationId: string, assignedToId: string) {
    const existing = await leadRepository.findById(id, organizationId);
    if (!existing) {
      throw new LeadError("Lead not found", 404);
    }

    const assignee = await userRepository.findById(assignedToId);
    if (!assignee || assignee.organizationId !== organizationId) {
      throw new LeadError("Assigned user not found in this organization", 422);
    }

    await leadRepository.update(id, organizationId, { assignedToId });
    return leadRepository.findById(id, organizationId);
  },

async convertToCustomer(id: string, organizationId: string, createdById: string) {
  const lead = await leadRepository.findById(id, organizationId);
  if (!lead) {
    throw new LeadError("Lead not found", 404);
  }
  if (lead.status === "CONVERTED") {
    throw new LeadError("Lead has already been converted", 409);
  }

  return prisma.$transaction(async () => {
    const customer = await customerRepository.createFromLead({
      organizationId,
      createdById,
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      companyName: lead.companyName,
    });

    await leadRepository.update(id, organizationId, {
      status: "CONVERTED",
      convertedCustomerId: customer.id,
    });

    return customer;
  });
},

  async delete(id: string, organizationId: string) {
    const result = await leadRepository.softDelete(id, organizationId);
    if (result.count === 0) {
      throw new LeadError("Lead not found", 404);
    }
  },
};

export { LeadError };