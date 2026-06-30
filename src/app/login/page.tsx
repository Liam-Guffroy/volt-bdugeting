import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { isAuthenticated } from "@/lib/session";
import { LoginForm } from "./login-form";
import { ThemeToggle } from "../theme-toggle";

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-primary">Vlot</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Je persoonlijke budgetplanner
        </p>
      </div>
      <Card className="p-6">
        <LoginForm />
      </Card>
    </main>
  );
}
