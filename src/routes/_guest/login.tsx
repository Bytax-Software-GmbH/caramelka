import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "#/components/ck/button";
import { Input } from "#/components/ck/input";
import { Logo } from "#/components/ck/logo";
import { Eyebrow } from "#/components/ck/primitives";
import { authClient } from "#/lib/auth/auth-client";

export const Route = createFileRoute("/_guest/login")({
  head: () => ({
    meta: [{ title: "Anmelden | Caramelka Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: LoginForm,
});

function LoginForm() {
  const { redirectUrl } = Route.useRouteContext();

  const { mutate: emailLoginMutate, isPending } = useMutation({
    mutationFn: async (data: { email: string; password: string }) =>
      await authClient.signIn.email(
        { ...data, callbackURL: redirectUrl },
        {
          onError: ({ error }) => {
            toast.error(error.message || "Anmeldung fehlgeschlagen.");
          },
          // better-auth triggers a hard navigation on login
        },
      ),
  });

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    if (!email || !password) return;
    emailLoginMutate({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4">
        <Link to="/" aria-label="Zur Startseite">
          <Logo />
        </Link>
        <Eyebrow as="p" dashed>
          Admin-Anmeldung
        </Eyebrow>
      </div>
      <div className="flex flex-col gap-4">
        <Input label="E-Mail" name="email" type="email" readOnly={isPending} required />
        <Input label="Passwort" name="password" type="password" readOnly={isPending} required />
        <Button
          type="submit"
          size="lg"
          block
          className="mt-2"
          disabled={isPending}
          icon={isPending ? <LoaderCircleIcon className="animate-spin" /> : undefined}
        >
          {isPending ? "Anmelden …" : "Anmelden"}
        </Button>
      </div>
      <p className="text-center text-ink-muted ck-body-sm">
        Noch kein Konto?{" "}
        <Link to="/signup" className="border-b border-hairline-accent text-brand">
          Registrieren
        </Link>
      </p>
    </form>
  );
}
