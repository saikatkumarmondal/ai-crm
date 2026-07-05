// src/lib/repositories/workflow.repository.ts

import { prisma } from "@/lib/prisma";
import { Prisma, WorkflowTriggerType, WorkflowRunStatus } from "@prisma/client";

const workflowInclude = {
  actions: { orderBy: { order: "asc" as const } },
} satisfies Prisma.WorkflowInclude;

export const workflowRepository = {
  create(data: Prisma.WorkflowUncheckedCreateInput & { actions: Prisma.WorkflowActionUncheckedCreateWithoutWorkflowInput[] }) {
    const { actions, ...workflowData } = data;
    return prisma.workflow.create({
      data: {
        ...workflowData,
        actions: { create: actions },
      },
      include: workflowInclude,
    });
  },

  findById(id: string, organizationId: string) {
    return prisma.workflow.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: workflowInclude,
    });
  },

  async findMany(organizationId: string, skip: number, take: number) {
    const where = { organizationId, deletedAt: null };
    const [items, total] = await Promise.all([
      prisma.workflow.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: workflowInclude,
      }),
      prisma.workflow.count({ where }),
    ]);
    return { items, total };
  },

  findActiveByTrigger(organizationId: string, triggerType: WorkflowTriggerType) {
    return prisma.workflow.findMany({
      where: { organizationId, triggerType, isActive: true, deletedAt: null },
      include: workflowInclude,
    });
  },

  update(id: string, organizationId: string, data: Prisma.WorkflowUpdateInput) {
    return prisma.workflow.updateMany({
      where: { id, organizationId, deletedAt: null },
      data,
    });
  },

  async replaceActions(workflowId: string, actions: Prisma.WorkflowActionUncheckedCreateWithoutWorkflowInput[]) {
    await prisma.workflowAction.deleteMany({ where: { workflowId } });
    await prisma.workflowAction.createMany({
      data: actions.map((a) => ({ ...a, workflowId })),
    });
  },

  softDelete(id: string, organizationId: string) {
    return prisma.workflow.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  },

  logRun(params: {
    workflowId: string;
    status: WorkflowRunStatus;
    triggerData: Prisma.InputJsonValue;
    resultLog: Prisma.InputJsonValue;
    errorMessage?: string;
  }) {
    return prisma.workflowRun.create({ data: params });
  },

  findRuns(workflowId: string, take: number) {
    return prisma.workflowRun.findMany({
      where: { workflowId },
      orderBy: { createdAt: "desc" },
      take,
    });
  },
};