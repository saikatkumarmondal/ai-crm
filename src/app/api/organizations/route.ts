import { withAuth } from "@/lib/middleware/withAuth";
import { createOrganizationSchema } from "@/lib/validators/organization.validator";
import { organizationService, OrganizationError } from "@/lib/services/organization.service";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export const POST = withAuth(async (request, _context, auth) => {
  try {
    const body = await request.json();
    const parsed = createOrganizationSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Validation failed", 422, parsed.error.flatten());
    }

    const organization = await organizationService.createForUser(
      auth.userId,
      parsed.data.organizationName
    );

    return successResponse({ organization }, 201);
  } catch (error) {
    if (error instanceof OrganizationError) {
      return errorResponse(error.message, error.status);
    }
    console.error("Create organization error:", error);
    return errorResponse("Internal server error", 500);
  }
});