import { PageHeader, Card, Skeleton } from "@/app/components/ui";

export default function MarketsLoading() {
  return (
    <div className="space-y-12">
      <PageHeader
        title="Browse markets"
        subtitle="Find local farmers markets near you."
      />
      <Card padding="md">
        <h2 className="section-heading mb-4">Filter</h2>
        <div className="flex flex-wrap items-end gap-4">
          <Skeleton className="h-10 min-w-[200px] flex-1" lines={1} />
          <Skeleton className="h-10 min-w-[140px]" lines={1} />
          <Skeleton className="h-5 w-32" lines={1} />
        </div>
      </Card>
      <section>
        <h2 className="section-heading mb-4">Results</h2>
        <Skeleton lines={6} className="py-8" />
      </section>
    </div>
  );
}
