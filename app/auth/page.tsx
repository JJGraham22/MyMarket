import { PageHeader, Card } from "@/app/components/ui";
import { AuthForm } from "./AuthForm";

export const metadata = {
  title: "Sign in — My Market",
};

interface AuthPageProps {
  searchParams: Promise<{ next?: string }> | { next?: string };
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await Promise.resolve(searchParams);
  const next = typeof params.next === "string" ? params.next : undefined;

  return (
    <div className="mx-auto max-w-md space-y-10 py-8">
      <PageHeader
        title="Welcome back"
        subtitle="Sign in or create an account to get started."
        className="text-center"
      />
      <Card padding="lg" className="p-6 sm:p-8">
        <AuthForm next={next} />
      </Card>
    </div>
  );
}
