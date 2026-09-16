import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "#/components/ck/button";
import { Input } from "#/components/ck/input";
import { Logo } from "#/components/ck/logo";
import { Eyebrow } from "#/components/ck/primitives";
import { authClient } from "#/lib/auth/auth-client";
import { authQueryOptions } from "#/lib/auth/queries";

export const Route = createFileRoute("/_guest/signup")({
  head: () => ({
    meta: [{ title: "Registrieren | Caramelka Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: SignupForm,
});

function SignupForm() {
  const { redirectUrl } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutate: signupMutate, isPending } = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      await authClient.signUp.email(
        { ...data, callbackURL: redirectUrl },
        {
          onError: ({ error }) => {
            toast.error(error.message || "Registrierung fehlgeschlagen.");
          },
          onSuccess: () => {
            queryClient.removeQueries({ queryKey: authQueryOptions().queryKey });
            navigate({ to: redirectUrl });
          },
        },
      );
    },
  });

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm_password") as string;
    if (!name || !email || !password || !confirmPassword) return;
    if (password !== confirmPassword) {
      toast.error("Passwörter stimmen nicht überein.");
      return;
    }
    signupMutate({ name, email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4">
        <Link to="/" aria-label="Zur Startseite">
          <Logo />
        </Link>
        <Eyebrow as="p" dashed>
          Admin-Konto anlegen
        </Eyebrow>
      </div>
      <div className="flex flex-col gap-4">
        <Input label="Name" name="name" type="text" readOnly={isPending} required />
        <Input label="E-Mail" name="email" type="email" readOnly={isPending} required />
        <Input label="Passwort" name="password" type="password" readOnly={isPending} required />
        <Input
          label="Passwort bestätigen"
          name="confirm_password"
          type="password"
          readOnly={isPending}
          required
        />
        <Button
          type="submit"
          size="lg"
          block
          className="mt-2"
          disabled={isPending}
          icon={isPending ? <LoaderCircleIcon className="animate-spin" /> : undefined}
        >
          {isPending ? "Registrieren …" : "Registrieren"}
        </Button>
      </div>
      <p className="text-center text-ink-muted ck-body-sm">
        Schon ein Konto?{" "}
        <Link to="/login" className="border-b border-hairline-accent text-brand">
          Anmelden
        </Link>
      </p>
    </form>
  );
}
