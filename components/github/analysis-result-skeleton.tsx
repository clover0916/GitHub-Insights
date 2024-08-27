import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Skeleton } from "../ui/skeleton"

export const AnalysisResultSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="w-32 h-9" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {Array.from({ length: Math.floor(Math.random() * 5) + 4 }).map((_, i) => (
          <Skeleton key={i} className="w-full h-3 mt-2" />
        ))}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <Skeleton className="w-32 h-9" />
        <CardDescription className="text-center text-sm text-zinc-500">
          <Skeleton className="w-32 h-3 mt-2" />
        </CardDescription>
      </CardFooter>
    </Card>
  )
}