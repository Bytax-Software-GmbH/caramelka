import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { Badge } from "#/components/ck/badge";
import { Logo } from "#/components/ck/logo";
import { SignOutButton } from "#/components/sign-out-button";

export const Route = createFileRoute("/_auth/app")({
  head: () => ({ meta: [{ title: "Admin | Caramelka" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const navCls =
  "ck-label whitespace-nowrap border-b border-transparent pb-0.5 text-rosegold-300 transition-colors duration-(--dur-fast) ease-out hover:text-cream-100 [&.active]:border-rosegold-500 [&.active]:text-rosegold-500";

const navItems = [
  { to: "/app", label: "Bestellungen", exact: true },
  { to: "/app/produkte", label: "Produkte" },
  { to: "/app/fuellungen", label: "Füllungen" },
] as const;

/** Admin-Shell: Burgund-Header wie im Shop, mit Navigation und Abmelden. */
function AdminLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <header className="sticky top-0 z-40 border-b border-hairline-inverse bg-inverse">
        <div className="mx-auto flex h-[72px] w-full max-w-page items-center justify-between gap-6 px-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3" aria-label="Zur Startseite">
              <Logo size="sm" onDark />
              <Badge tone="accent">Admin</Badge>
            </Link>
            <nav className="hidden items-center gap-6 sm:flex" aria-label="Admin">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: "exact" in item && item.exact }}
                  className={navCls}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <SignOutButton />
        </div>
        <nav
          className="flex gap-6 overflow-x-auto border-t border-hairline-inverse px-6 py-3 sm:hidden"
          aria-label="Admin"
        >
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: "exact" in item && item.exact }}
              className={navCls}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-page flex-1 px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
