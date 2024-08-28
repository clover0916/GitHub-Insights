
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export const AnalysisResultSkeleton = () => {
  const [isProcessingSlow, setIsProcessingSlow] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsProcessingSlow(true);
    }, 30000);

    return () => clearTimeout(timeout);
  }, []);

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
      {isProcessingSlow && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-900 bg-opacity-50">
          <p className="text-white text-lg">コードの処理が通常よりも時間がかかっています...</p>
        </div>
      )}
    </Card>
  );
};