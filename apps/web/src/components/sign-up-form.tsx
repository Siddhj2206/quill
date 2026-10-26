"use client";

import { Button } from "@quill/ui/components/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@quill/ui/components/field";
import { Input } from "@quill/ui/components/input";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/utils/trpc";

const handlePattern = /^[a-z0-9_]{3,15}$/;

export default function SignUpForm() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: { name: "", email: "", handle: "", password: "" },
    onSubmit: async ({ value }) => {
      const handle = value.handle.toLowerCase();
      const available = await queryClient.fetchQuery(
        trpc.users.handleAvailable.queryOptions(handle),
      );
      if (!available) {
        toast.error("That handle is already taken. Try another one.");
        return;
      }

      await authClient.signUp.email(
        { name: value.name, email: value.email, handle, password: value.password },
        {
          onSuccess: () => {
            router.push("/home");
            router.refresh();
          },
          onError: (error) => {
            toast.error(error.error.message || "Could not create the account. Check the fields.");
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.email("Enter a valid email address"),
        handle: z
          .string()
          .toLowerCase()
          .regex(handlePattern, "Use 3 to 15 letters, numbers or underscores"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-medium">Sign up</h1>
        <p className="text-muted-foreground">Your handle is your public name.</p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field name="name">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  autoComplete="name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <FieldError
                  errors={field.state.meta.errors.map((error) => ({
                    message: typeof error === "string" ? error : error?.message,
                  }))}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="handle">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>Handle</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  autoComplete="username"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value.toLowerCase())}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <FieldError
                  errors={field.state.meta.errors.map((error) => ({
                    message: typeof error === "string" ? error : error?.message,
                  }))}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  autoComplete="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <FieldError
                  errors={field.state.meta.errors.map((error) => ({
                    message: typeof error === "string" ? error : error?.message,
                  }))}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  autoComplete="new-password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <FieldError
                  errors={field.state.meta.errors.map((error) => ({
                    message: typeof error === "string" ? error : error?.message,
                  }))}
                />
              </Field>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => ({
              canSubmit: state.canSubmit,
              isSubmitting: state.isSubmitting,
            })}
          >
            {({ canSubmit, isSubmitting }) => (
              <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? "Creating account..." : "Sign up"}
              </Button>
            )}
          </form.Subscribe>
        </FieldGroup>
      </form>

      <p className="text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Log in
        </Link>
      </p>
    </div>
  );
}
