import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { Logo } from "#/components/ck/logo";
import { SignOutButton } from "#/components/sign-out-button";

export const Route = createFileRoute("/_auth/app")({
  head: () => ({ meta: [{ title: "Admin | Caramelka" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const navCls =
  "ck-nav-link text-espresso/60 transition-colors hover:text-espresso [&.active]:text-caramel-deep";

function AdminLayout() {
  return (
    <div className="min-h-svh bg-creme">
      <header className="sticky top-0 z-40 border-b border-espresso/12 bg-creme/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 md:px-8">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              <Logo size="sm" />
              <span className="font-mono text-[10px] tracking-wider text-espresso/50">ADMIN</span>
            </Link>
            <nav className="flex items-center gap-6" aria-label="Admin">
              <Link to="/app" activeOptions={{ exact: true }} className={navCls}>
                Bestellungen
              </Link>
              <Link to="/app/produkte" className={navCls}>
                Produkte
              </Link>
              <Link to="/app/fuellungen" className={navCls}>
                Füllungen
              </Link>
            </nav>
          </div>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}
