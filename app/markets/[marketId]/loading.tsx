import { Skeleton } from "@/app/components/ui";

export default function MarketDetailLoading() {
  return (
    <div className="space-y-12">
      <Skeleton className="h-5 w-32" lines={1} />
      <header className="space-y-2">
        <Skeleton className="h-9 w-64" lines={1} />
        <Skeleton className="h-5 w-48" lines={1} />
        <Skeleton className="h-4 w-full max-w-md" lines={1} />
      </header>
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card-organic p-5">
          <Skeleton className="mb-2 h-3 w-20" lines={1} />
          <Skeleton className="h-4 w-full" lines={1} />
        </div>
        <div className="card-organic p-5">
          <Skeleton className="mb-2 h-3 w-16" lines={1} />
          <Skeleton className="h-6 w-24" lines={1} />
        </div>
        <div className="card-organic p-5">
          <Skeleton className="mb-2 h-3 w-20" lines={1} />
          <Skeleton className="h-8 w-16" lines={1} />
        </div>
      </section>
      <section>
        <Skeleton className="mb-4 h-6 w-56" lines={1} />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-organic p-5">
              <div className="mb-3 flex items-center gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" lines={1} />
                <Skeleton className="h-4 w-32" lines={1} />
              </div>
              <Skeleton lines={3} />
            </div>
          ))}
        </div>
      </section>
      <section>
        <Skeleton className="mb-4 h-6 w-48" lines={1} />
        <Skeleton lines={5} className="py-4" />
      </section>
    </div>
  );
}
