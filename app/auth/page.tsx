import { AuthForm } from "./AuthForm";

export const metadata = {
  title: "Sign in — My Market",
};

export default function AuthPage() {
  return (
    <div className="mx-auto max-w-md space-y-10 py-8">
      <header className="space-y-3 text-center">
        <h1 className="page-heading">Welcome back</h1>
        <p className="page-subheading mx-auto">
          Sign in or create an account to get started.
        </p>
      </header>
      <div className="card-organic p-6 sm:p-8">
        <AuthForm />
      </div>
    </div>
  );
}
