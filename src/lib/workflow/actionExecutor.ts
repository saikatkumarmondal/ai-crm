// src/lib/workflow/actionExecutor.ts

import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/geminiClient";
import type { WorkflowActionType } from "@prisma/client";

export interface ActionContext {
  organizationId: string;
  triggerData: Record<string, unknown>;
}

export interface ActionResult {
  actionType: WorkflowActionType;
  success: boolean;
  message: string;
}

async function executeAssignUser(config: Record<string, unknown>, ctx: ActionContext): Promise<ActionResult> {
  const userId = config.assignToUserId as string | undefined;
  const leadId = ctx.triggerData.leadId as string | undefined;

  if (!userId || !leadId) {
    return { actionType: "ASSIGN_USER", success: false, message: "Missing userId or leadId" };
  }

  await prisma.lead.updateMany({
    where: { id: leadId, organizationId: ctx.organizationId },
    data: { assignedToId: userId },
  });

  return { actionType: "ASSIGN_USER", success: true, message: `Lead assigned to user ${userId}` };
}

async function executeUpdateStatus(config: Record<string, unknown>, ctx: ActionContext): Promise<ActionResult> {
  const entityType = config.entityType as "LEAD" | "CUSTOMER" | undefined;
  const status = config.status as string | undefined;
  const entityId = (ctx.triggerData.leadId ?? ctx.triggerData.customerId) as string | undefined;

  if (!entityType || !status || !entityId) {
    return { actionType: "UPDATE_STATUS", success: false, message: "Missing entityType, status, or entityId" };
  }

  if (entityType === "LEAD") {
    await prisma.lead.updateMany({
      where: { id: entityId, organizationId: ctx.organizationId },
      data: { status: status as never },
    });
  } else {
    await prisma.customer.updateMany({
      where: { id: entityId, organizationId: ctx.organizationId },
      data: { status: status as never },
    });
  }

  return { actionType: "UPDATE_STATUS", success: true, message: `${entityType} status updated to ${status}` };
}

async function executeAiSummary(_config: Record<string, unknown>, ctx: ActionContext): Promise<ActionResult> {
  const prompt = `Summarize this CRM event in one sentence: ${JSON.stringify(ctx.triggerData)}`;
  const summary = await generateText(prompt);
  return { actionType: "AI_SUMMARY", success: true, message: summary };
}

async function executeAiEmailDraft(config: Record<string, unknown>, ctx: ActionContext): Promise<ActionResult> {
  const purpose = (config.purpose as string) ?? "general follow-up";
  const prompt = `Write a short professional follow-up email. Purpose: ${purpose}. Context: ${JSON.stringify(ctx.triggerData)}`;
  const emailBody = await generateText(prompt);
  return { actionType: "AI_EMAIL_DRAFT", success: true, message: emailBody };
}

async function executeStubAction(actionType: WorkflowActionType, config: Record<string, unknown>): Promise<ActionResult> {
  return {
    actionType,
    success: true,
    message: `${actionType} executed (stub) with config: ${JSON.stringify(config)}`,
  };
}

export async function executeAction(
  actionType: WorkflowActionType,
  config: Record<string, unknown>,
  ctx: ActionContext
): Promise<ActionResult> {
  switch (actionType) {
    case "ASSIGN_USER":
      return executeAssignUser(config, ctx);
    case "UPDATE_STATUS":
      return executeUpdateStatus(config, ctx);
    case "AI_SUMMARY":
      return executeAiSummary(config, ctx);
    case "AI_EMAIL_DRAFT":
      return executeAiEmailDraft(config, ctx);
    case "SEND_EMAIL":
    case "NOTIFY_TEAM":
    case "CREATE_TASK":
      return executeStubAction(actionType, config);
    default:
      return { actionType, success: false, message: "Unknown action type" };
  }
}