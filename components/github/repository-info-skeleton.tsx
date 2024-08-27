'use client'

import React from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, GitFork, Star, Users, Cake, RefreshCcw, } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from '../ui/skeleton';

export function RepositoryInfoSkeleton() {

  return (
    <div>
      <Card className="w-[400px]">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Avatar className="h-10 w-10">
              <Skeleton className="h-10 w-10 rounded-full" />
            </Avatar>
            <div>
              <CardTitle className="text-xl font-bold">
                <Skeleton className="h-6 w-40" />
              </CardTitle>
              <p className="text-sm text-gray-500">
                <Skeleton className="h-4 w-20" />
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">
            <Skeleton className="h-4 w-60" />
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">
              <Skeleton className="h-4 w-10" />
            </Badge>
            <Badge variant="outline">
              <Skeleton className="h-4 w-20" />
            </Badge>
          </div>
          <div className='flex flex-wrap gap-2 mb-4'>
            <Badge variant="outline" className="flex items-center gap-1">
              <Cake className="w-3 h-3" />
              <Skeleton className="h-4 w-20" />
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <RefreshCcw className="w-3 h-3" />
              <Skeleton className="h-4 w-20" />
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span>
                <Skeleton className="h-4 w-10" />
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <GitFork className="w-4 h-4 text-gray-500" />
              <span>
                <Skeleton className="h-4 w-10" />
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-gray-500" />
              <span>
                <Skeleton className="h-4 w-10" />
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-gray-500" />
              <span>
                <Skeleton className="h-4 w-10" />
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Skeleton className="h-4 w-20" />

          <div className="text-sm text-gray-500">
            <Skeleton className="h-4 w-10" />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}