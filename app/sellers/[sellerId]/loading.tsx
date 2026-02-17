import { Skeleton } from "@/app/components/ui";

export default function SellerProfileLoading() {
  return (
    <div>
      <div className="relative -mx-4 -mt-6 mb-8 overflow-hidden rounded-b-2xl">
        <Skeleton className="h-48 w-full sm:h-56" lines={1} />
        <div className="absolute left-4 top-4">
          <Skeleton className="h-9 w-36 rounded-lg" lines={1} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          <div className="flex items-end gap-4">
            <Skeleton className="h-20 w-20 shrink-0 rounded-xl" lines={1} />
            <div className="mb-1 min-w-0 flex-1 space-y-2">
              <Skeleton className="h-7 w-48" lines={1} />
              <Skeleton className="h-4 w-32" lines={1} />
            </div>
          </div>
        </div>
      </div>
      <div className="mb-8 flex gap-3">
        <Skeleton className="h-6 w-16 rounded-full" lines={1} />
        <Skeleton className="h-5 w-24" lines={1} />
      </div>
      <div className="mb-8">
        <Skeleton lines={3} />
      </div>
      <section className="mb-10">
        <Skeleton className="mb-4 h-6 w-24" lines={1} />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-organic p-5">
              <Skeleton className="h-5 w-3/4" lines={1} />
              <Skeleton className="mt-2 h-4 w-1/2" lines={1} />
            </div>
          ))}
        </div>
      </section>
      <section>
        <Skeleton className="mb-4 h-6 w-44" lines={1} />
        <Skeleton lines={4} className="py-4" />
      </section>
    </div>
  );
}
