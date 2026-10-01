type SkeletonProps = {
  className: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return <span className={`block animate-pulse bg-slate-200 ${className}`} />;
}
