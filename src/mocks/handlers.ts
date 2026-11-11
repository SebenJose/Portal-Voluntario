import type { RequestHandler } from "msw";
import { dashboardPresentationHandlers } from "@/features/dashboard/mocks/handlers";
import { publicOrganizationHandlers } from "@/features/organizations/mocks/handlers";

// Only explicit presentation routes are mocked. Account operations always reach NestJS.
export const handlers = [
  ...publicOrganizationHandlers,
  ...dashboardPresentationHandlers,
] satisfies Array<RequestHandler>;
