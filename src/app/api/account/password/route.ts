import { NextRequest } from "next/server";
import { forwardNoContent } from "@/lib/server/backend-route";

export async function PATCH(request: NextRequest) { return forwardNoContent(request, "/account/password"); }
