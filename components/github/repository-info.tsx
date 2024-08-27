'use client'

import React from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, GitFork, Star, Clock, Users, Calendar, Link, ExternalLink, Cake, RefreshCcw, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { components } from '@octokit/openapi-types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '../ui/button';
import { useActions, useUIState } from 'ai/rsc';
import { AI } from '@/lib/chat/actions';
import { nanoid } from '@/lib/utils';
import { UserMessage } from './message';

type RepoResponse = components["schemas"]["full-repository"];
type RepositoryInfoProps = {
  props: {
    repo: RepoResponse
  }
}

export function RepositoryInfo({ props: { repo } }: RepositoryInfoProps) {
  const [, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('ja-JP', options);
  };

  return (
    <div>
      <Card className="w-[400px]">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={repo.owner.avatar_url} alt={repo.owner.login} />
              <AvatarFallback>{repo.owner.login.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl font-bold">{repo.name}</CardTitle>
              <p className="text-sm text-gray-500">by {repo.owner.login}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">{repo.description}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">{repo.language}</Badge>
            {repo.license && <Badge variant="outline">{repo.license.name}</Badge>}
          </div>
          <div className='flex flex-wrap gap-2 mb-4'>
            <Badge variant="outline" className="flex items-center gap-1">
              <Cake className="w-3 h-3" />

              {formatDate(repo.created_at)}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <RefreshCcw className="w-3 h-3" />
              {formatDate(repo.pushed_at)}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span>{repo.subscribers_count} subscribers</span>
            </div>
            <div className="flex items-center space-x-2">
              <GitFork className="w-4 h-4 text-gray-500" />
              <span>{repo.forks} forks</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-gray-500" />
              <span>{repo.stargazers_count} stars</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-gray-500" />
              <span>{repo.watchers} watchers</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className='flex items-center gap-1 text-sm hover:underline underline-offset-4'>
            <p>GitHubで見る</p>
            <ExternalLink className="w-3 h-3" />
          </a>

          <div className="text-sm text-gray-500">
            {repo.open_issues_count} open issues
          </div>
        </CardFooter>
      </Card>
      <div className="flex space-x-2 mt-4">
        <Button
          variant="outline"
          onClick={async () => {
            setMessages(currentMessages => [
              ...currentMessages,
              {
                id: nanoid(),
                display: <UserMessage>コードを分析する</UserMessage>
              }
            ])

            const responseMessage = await submitUserMessage(
              "コードを分析する"
            )

            setMessages(currentMessages => [
              ...currentMessages,
              responseMessage
            ])
          }}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          コードを分析する
        </Button>
      </div>
    </div>
  );
}