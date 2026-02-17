import { PageHeader, Card, Skeleton } from "@/app/components/ui";

export default function DashboardLoading() {
  return (
    <div className="space-y-10">
      <PageHeader
        title="Dashboard"
        subtitle="Manage your account and activity."
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <Card padding="md">
          <Skeleton className="mb-4 h-6 w-40" lines={1} />
          <Skeleton lines={3} />
        </Card>
        <Card padding="md">
          <Skeleton className="mb-4 h-6 w-32" lines={1} />
          <Skeleton lines={3} />
        </Card>
      </div>
      <section>
        <Skeleton className="mb-4 h-6 w-48" lines={1} />
        <Skeleton lines={5} className="py-8" />
      </section>
    </div>
  );
}
