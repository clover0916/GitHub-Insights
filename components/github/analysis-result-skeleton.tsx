export const AnalysisResultSkeleton = () => {
  return (
    <div className="mb-4 flex flex-col gap-2 overflow-y-scroll pb-4 text-sm">
      <div className="h-[20px] w-full rounded-lg bg-zinc-800"></div>
      <div className="h-[20px] w-3/4 rounded-lg bg-zinc-800"></div>
      <div className="h-[20px] w-1/2 rounded-lg bg-zinc-800"></div>
      <div className="mt-2 h-[100px] w-full rounded-lg bg-zinc-800"></div>
    </div>
  )
}