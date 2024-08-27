import { Skeleton } from "../ui/skeleton"

export const ListRepositoriesSkelton = () => {
  return (
    <div className="mb-4 flex flex-col gap-2 pb-4">
      <Skeleton className="flex h-9 w-full flex-row gap-2 rounded-lg p-2 " />
      <Skeleton className="flex h-9 w-full flex-row gap-2 rounded-lg p-2" />
    </div>
  )
}
