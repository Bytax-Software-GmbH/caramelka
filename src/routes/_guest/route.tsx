import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { authQueryOptions } from "#/lib/auth/queries";

export const Route = createFileRoute("/_guest")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    // Redirect path when user is already present,
    // or after successful login/signup
    const REDIRECT_URL = "/app";

    const user = await context.queryClient.ensureQueryData({
      ...authQueryOptions(),
      revalidateIfStale: true,
    });
    if (user) {
      throw redirect({
        to: REDIRECT_URL,
      });
    }

    return {
      redirectUrl: REDIRECT_URL,
    };
  },
});

/** Anmeldung im Panel mit Roségold-Oberkante, wie der Dialog des Systems. */
function RouteComponent() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-page p-6">
      <div className="w-full max-w-sm rounded-md border border-t-2 border-hairline border-t-accent bg-surface p-8 shadow-md">
        <Outlet />
      </div>
    </div>
  );
}
