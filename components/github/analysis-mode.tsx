'use client'

import { useActions, useUIState } from 'ai/rsc'

import type { AI } from '@/lib/chat/actions'

interface AnalysisModeProps {
  mode: string
  title: string
  description: string
}

const analysisModes: AnalysisModeProps[] = [
  { mode: 'history', title: 'Project History', description: 'Analyze commit history and project evolution' },
  { mode: 'folder', title: 'Folder Structure', description: 'Examine repository folder organization' },
  { mode: 'code', title: 'Code Analysis', description: 'Perform in-depth code review and analysis' }
]

export function AnalysisMode() {
  const [, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 overflow-y-scroll pb-4 text-sm sm:flex-row">
        {analysisModes.map(mode => (
          <button
            key={mode.mode}
            className="flex cursor-pointer flex-col gap-2 rounded-lg bg-zinc-800 p-4 text-left hover:bg-zinc-700 sm:w-64"
            onClick={async () => {
              const response = await submitUserMessage(`Perform ${mode.title} analysis`)
              setMessages(currentMessages => [...currentMessages, response])
            }}
          >
            <div className="text-lg font-bold text-zinc-300">{mode.title}</div>
            <div className="text-sm text-zinc-500">{mode.description}</div>
          </button>
        ))}
      </div>
      <div className="p-4 text-center text-sm text-zinc-500">
        Select an analysis mode to examine the repository in detail.
      </div>
    </div>
  )
}