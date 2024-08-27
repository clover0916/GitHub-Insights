import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <h1 className="text-lg font-semibold">
          Repository Insights (非公式)
        </h1>
        <p>
          これはGitHubのリポジトリを分析するためのツールです。
        </p>
        <p>
          Github公式はこのツールに関して一切の関係がありません。
        </p>
        <p>
          開始するには、GitHubアカウントでログインしてください。
        </p>
      </div>
    </div>
  )
}
