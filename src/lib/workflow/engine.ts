// src/lib/workflow/engine.ts

import { Prisma } from "@prisma/client";
import { workflowRepository } from "@/lib/repositories/workflow.repository";
import { executeAction } from "@/lib/workflow/actionExecutor";
import type { WorkflowTriggerType } from "@prisma/client";

interface Condition {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
  value: string | number | boolean;
}

function evaluateCondition(condition: Condition, data: Record<string, unknown>): boolean {
  const actual = data[condition.field];
  if (actual === undefined) return false;

  switch (condition.operator) {
    case "equals":
      return actual === condition.value;
    case "not_equals":
      return actual !== condition.value;
    case "contains":
      return typeof actual === "string" && actual.includes(String(condition.value));
    case "greater_than":
      return typeof actual === "number" && actual > Number(condition.value);
    case "less_than":
      return typeof actual === "number" && actual < Number(condition.value);
    default:
      return false;
  }
}

function evaluateConditions(conditions: Condition[] | null, data: Record<string, unknown>): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((c) => evaluateCondition(c, data));
}

export async function triggerWorkflows(
  organizationId: string,
  triggerType: WorkflowTriggerType,
  triggerData: Record<string, unknown>
): Promise<void> {
  const workflows = await workflowRepository.findActiveByTrigger(organizationId, triggerType);

  for (const workflow of workflows) {
    const conditionsMatch = evaluateConditions(
      workflow.conditions as Condition[] | null,
      triggerData
    );

    if (!conditionsMatch) continue;

    const results = [];
    let hasFailure = false;

    for (const action of workflow.actions) {
      try {
        const result = await executeAction(
          action.actionType,
          action.config as Record<string, unknown>,
          { organizationId, triggerData }
        );
        results.push(result);
        if (!result.success) hasFailure = true;
      } catch (error) {
        hasFailure = true;
        results.push({
          actionType: action.actionType,
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    await workflowRepository.logRun({
      workflowId: workflow.id,
      status: hasFailure ? (results.some((r) => r.success) ? "PARTIAL" : "FAILED") : "SUCCESS",
      triggerData: triggerData as Prisma.InputJsonValue,
      resultLog: results as unknown as Prisma.InputJsonValue,
    });
  }
}