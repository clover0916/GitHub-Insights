'use client'

import { useActions, useUIState } from 'ai/rsc'

import type { AI } from '@/lib/chat/actions'

interface AnalysisResultProps {
  type: 'history' | 'folder' | 'code'
  content: string
}

export function AnalysisResult({ props: { type, content } }: { props: AnalysisResultProps }) {
  const [, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()

  const titleMap = {
    history: 'Project History Analysis',
    folder: 'Folder Structure Analysis',
    code: 'Code Analysis'
  }

  return (
    <div className="rounded-lg bg-zinc-800 p-4">
      <h2 className="mb-4 text-xl font-bold text-zinc-300">{titleMap[type]}</h2>
      <div className="mb-4 whitespace-pre-wrap text-sm text-zinc-400">{content}</div>
      <button
        className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
        onClick={async () => {
          const response = await submitUserMessage(`Explain the ${titleMap[type]} in more detail`)
          setMessages(currentMessages => [...currentMessages, response])
        }}
      >
        Request More Details
      </button>
      <div className="mt-4 text-center text-sm text-zinc-500">
        This analysis is based on the current state of the repository. For the most up-to-date information, please refer to the actual GitHub repository.
      </div>
    </div>
  )
}