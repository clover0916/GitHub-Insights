'use client'

import { useActions, useUIState } from 'ai/rsc'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import type { AI } from '@/lib/chat/actions'
import { MemoizedReactMarkdown } from '../markdown'

interface AnalysisResultProps {
  type: 'history' | 'folder' | 'code'
  content: string
}

export function AnalysisResult({ props: { type, content } }: { props: AnalysisResultProps }) {
  const [, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()

  const titleMap = {
    history: 'プロジェクト履歴の分析',
    folder: 'フォルダ構造の分析',
    code: 'コードの分析'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{titleMap[type]}</CardTitle>
      </CardHeader>
      <CardContent>
        <MemoizedReactMarkdown className="whitespace-pre-wrap text-sm ">{content}</MemoizedReactMarkdown>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <Button
          onClick={async () => {
            const response = await submitUserMessage(`詳細についての${titleMap[type]}を説明してください`)
            setMessages(currentMessages => [...currentMessages, response])
          }}
        >
          詳細をリクエストする
        </Button>
        <CardDescription className="text-center text-sm text-zinc-500">
          この分析は、リポジトリの現在の状態に基づいています。最新の情報については、実際のGitHubリポジトリを参照してください。
        </CardDescription>
      </CardFooter>
    </Card>
  )
}