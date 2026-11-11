import { NextRequest } from "next/server";
import { z } from "zod";
import { authUserSchema } from "@/features/auth/schemas/session-schema";
import { forwardApi } from "@/lib/server/backend-route";

export async function PATCH(request: NextRequest) { return forwardApi(request, "/account/profile", z.object({ user: authUserSchema })); }
