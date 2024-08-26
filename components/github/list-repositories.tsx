'use client'

import { useState } from 'react'
import { useActions, useUIState } from 'ai/rsc'
import { components } from "@octokit/openapi-types";

import type { AI } from '@/lib/chat/actions'

type Repository = components["schemas"]["repository"];

type ListRepositoriesProps = {
  props: {
    repositories: Repository[]
  }
}

export function ListRepositories({ props: { repositories } }: ListRepositoriesProps) {
  const [, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()
  const [owner, setOwner] = useState('')
  const [repo, setRepo] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const response = await submitUserMessage(`リポジトリの分析: ${owner}/${repo}`)
    setMessages((currentMessages: any) => [
      ...currentMessages,
      response.newMessage
    ])
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="リポジトリの所有者"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          className="rounded-lg bg-zinc-800 p-2 text-white"
        />
        <input
          type="text"
          placeholder="リポジトリ名"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          className="rounded-lg bg-zinc-800 p-2 text-white"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
        >
          リポジトリの分析
        </button>
      </form>
      <div className="mt-4 text-center text-sm text-zinc-500">
        GitHubのリポジトリの所有者と名前を入力して、分析を開始します。
      </div>
    </div>
  )
}