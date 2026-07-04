// src/lib/services/customer.service.ts

import { customerRepository } from "@/lib/repositories/customer.repository";
import type { CreateCustomerInput, UpdateCustomerInput } from "@/lib/validators/customer.validator";
import type { CustomerStatus } from "@prisma/client";

class CustomerError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export const customerService = {
  async create(organizationId: string, createdById: string, input: CreateCustomerInput) {
    if (input.email) {
      const existing = await customerRepository.findByEmail(input.email, organizationId);
      if (existing) {
        throw new CustomerError("A customer with this email already exists", 409);
      }
    }

    return customerRepository.create({
      organizationId,
      createdById,
      ...input,
    });
  },

  async list(
    organizationId: string,
    query: { search?: string; status?: CustomerStatus },
    pagination: { skip: number; take: number }
  ) {
    return customerRepository.findMany({
      organizationId,
      search: query.search,
      status: query.status,
      skip: pagination.skip,
      take: pagination.take,
    });
  },

  async getById(id: string, organizationId: string) {
    const customer = await customerRepository.findById(id, organizationId);
    if (!customer) {
      throw new CustomerError("Customer not found", 404);
    }
    return customer;
  },

  async update(id: string, organizationId: string, input: UpdateCustomerInput) {
    const existing = await customerRepository.findById(id, organizationId);
    if (!existing) {
      throw new CustomerError("Customer not found", 404);
    }

    if (input.email && input.email !== existing.email) {
      const emailTaken = await customerRepository.findByEmail(input.email, organizationId);
      if (emailTaken) {
        throw new CustomerError("A customer with this email already exists", 409);
      }
    }

    const result = await customerRepository.update(id, organizationId, input);
    if (result.count === 0) {
      throw new CustomerError("Customer not found", 404);
    }

    return customerRepository.findById(id, organizationId);
  },

  async delete(id: string, organizationId: string) {
    const result = await customerRepository.softDelete(id, organizationId);
    if (result.count === 0) {
      throw new CustomerError("Customer not found", 404);
    }
  },
};

export { CustomerError };