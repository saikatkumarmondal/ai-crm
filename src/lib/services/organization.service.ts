import { organizationRepository } from "@/lib/repositories/organization.repository";
import { userRepository } from "@/lib/repositories/user.repository";

class OrganizationError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

function slugify(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
}

export const organizationService = {
  async createForUser(userId: string, organizationName: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new OrganizationError("User not found", 404);
    }
    if (user.organizationId) {
      throw new OrganizationError("User already belongs to an organization", 409);
    }

    const { organization } = await organizationRepository.createForUser(
      userId,
      organizationName,
      slugify(organizationName)
    );

    return organization;
  },
};

export { OrganizationError };