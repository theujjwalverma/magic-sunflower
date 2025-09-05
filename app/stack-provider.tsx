"use client";

import { StackProvider, StackTheme } from "@stackframe/stack";

const stackApp = {
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || "",
  publishableClientKey:
    process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || "",
};

export function StackProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StackProvider app={stackApp as any}>
      <StackTheme>{children}</StackTheme>
    </StackProvider>
  );
}

export { useUser } from "@stackframe/stack";
