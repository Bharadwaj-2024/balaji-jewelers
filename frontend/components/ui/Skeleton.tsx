// components/ui/Skeleton.tsx
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-sm overflow-hidden">
      <div className="skeleton h-52 w-full" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="flex justify-between items-center">
          <div className="skeleton h-5 w-24 rounded" />
          <div className="skeleton h-8 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}

export function TextSkeleton({ width = 'w-full', height = 'h-4' }: { width?: string; height?: string }) {
  return <div className={`skeleton ${width} ${height} rounded`} />;
}
