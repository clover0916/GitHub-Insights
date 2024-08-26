import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  streamUI,
  createStreamableValue
} from 'ai/rsc'
import { createGoogleGenerativeAI } from '@ai-sdk/google';

import {
  spinner,
  BotCard,
  BotMessage,
  SystemMessage,
  RepositoryInfo,
  AnalysisMode,
  AnalysisResult
} from '@/components/github'

import { z } from 'zod'
import { ListRepositoriesSkelton } from '@/components/github/list-repositories-skeleton'
import { AnalysisModesSkeleton } from '@/components/github/analysis-modes-skeleton'
import { AnalysisResultSkeleton } from '@/components/github/analysis-result-skeleton'
import {
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid
} from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/github/message'
import { Chat, Message } from '@/lib/types'
import { auth } from '@/auth'
import { Octokit } from "@octokit/rest";

const google = createGoogleGenerativeAI({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string
});

async function submitUserMessage(content: string) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  const result = await streamUI({
    model: google('gemini-1.5-pro-exp-0801', {
      structuredOutputs: false,
    }),
    initial: <SpinnerMessage />,
    system: `\
    あなたはGitHubリポジトリ分析AIアシスタントです。ユーザーがGitHubリポジトリを分析する際に、ステップバイステップでサポートを提供します。ユーザーとリポジトリの詳細について話し合い、分析モードの選択や結果の解釈をサポートします。

    1. ユーザーのGitHubアカウントに関連付けられたリポジトリ一覧を取得するには、\`list_repositories\`を呼び出します。これにより、ユーザーが所有または貢献しているリポジトリのリストが表示されます。

    2. ユーザーがリストからリポジトリを選択するか、URLを直接入力した場合、\`set_repository\`を呼び出してそのリポジトリを分析対象として設定します。

    3. ユーザーが分析モードを選択する必要がある場合は、\`show_analysis_modes\`を呼び出して分析モード選択UIを表示します。

    4. 選択された分析モードに応じて、以下の関数を呼び出します：
      - プロジェクト履歴の分析結果を表示する場合：\`display_history_analysis\`
      - フォルダ内容の分析結果を表示する場合：\`display_folder_analysis\`
      - リポジトリ全体のコード分析結果を表示する場合：\`display_code_analysis\`

    5. []内のメッセージは、UI要素またはユーザーイベントを意味します。例：
      - "[ユーザーがリポジトリ 'octocat/Hello-World' を選択しました]"
      - "[ユーザーが分析モード2を選択しました]"

    ユーザーが分析結果の詳細な説明を求めた場合や、コードの特定の部分について質問した場合は、あなたの知識を活用して丁寧に回答してください。技術的な説明や、コードの改善点、セキュリティの懸念事項などについても適切にアドバイスできます。

    ユーザーが実装されていない機能を要求した場合は、現在のデモではその機能が利用できないことを説明し、代替案を提案してください。

    それ以外にも、必要に応じてユーザーとチャットしたり、GitHubやプログラミングに関する一般的な質問に答えたりすることができます。常に礼儀正しく、プロフェッショナルな態度を保ちながら、ユーザーのニーズに合わせて柔軟に対応してください。`,
    messages: [
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} />
      }

      if (done) {
        textStream.done()
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content
            }
          ]
        })
      } else {
        textStream.update(delta)
      }

      return textNode
    },
    tools: {
      list_repositories: {
        description: 'ユーザーのリポジトリ情報を表示します。',
        parameters: z.string().optional().describe('このパラメーターは使用されません。'),
        generate: async function* () {
          yield (
            <BotCard>
              <ListRepositoriesSkelton />
            </BotCard>
          )

          await sleep(1000)

          const toolCallId = nanoid()

          const session = await auth() // Githubの認証情報を取得

          if (!session) {
            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: 'GitHubの認証情報が見つかりませんでした。'
                }
              ]
            })

            return
          }

          // リポジトリ情報を取得
          const octokit = new Octokit({
            auth: session.accessToken
          })

          const repositories = await octokit.repos.listForAuthenticatedUser({
            per_page: 100
          })

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'list_repositories',
                    toolCallId,
                    args: {}
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'list_repositories',
                    toolCallId,
                    result: {
                      repositories: repositories.data
                    }
                  }
                ]
              }
            ]
          })

          return (
            <BotCard>
              <RepositoryInfo props={{ repositories: repositories.data }} />
            </BotCard>
          )
        }
      },
      show_analysis_modes: {
        description: '分析モード選択UIを表示します。',
        parameters: z.string().optional().describe('このパラメーターは使用されません。'),
        generate: async function* () {
          yield (
            <BotCard>
              <AnalysisModesSkeleton />
            </BotCard>
          )

          await sleep(1000)

          const toolCallId = nanoid()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'show_analysis_modes',
                    toolCallId,
                    args: {}
                  }
                ]
              }
            ]
          })

          return (
            <BotCard>
              <AnalysisMode />
            </BotCard>
          )
        }
      },
      display_history_analysis: {
        description: 'プロジェクト履歴の分析結果を表示します。',
        parameters: z.object({
          analysis: z.string().describe('分析結果の内容')
        }),
        generate: async function* ({ analysis }) {
          yield (
            <BotCard>
              <AnalysisResultSkeleton />
            </BotCard>
          )

          await sleep(1000)

          const toolCallId = nanoid()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'display_history_analysis',
                    toolCallId,
                    args: { analysis }
                  }
                ]
              }
            ]
          })

          return (
            <BotCard>
              <AnalysisResult props={{ type: "history", content: analysis }} />
            </BotCard>
          )
        }
      },
      display_folder_analysis: {
        description: 'フォルダ内容の分析結果を表示します。',
        parameters: z.object({
          analysis: z.string().describe('分析結果の内容')
        }),
        generate: async function* ({ analysis }) {
          yield (
            <BotCard>
              <AnalysisResultSkeleton />
            </BotCard>
          )

          await sleep(1000)

          const toolCallId = nanoid()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'display_folder_analysis',
                    toolCallId,
                    args: { analysis }
                  }
                ]
              }
            ]
          })

          return (
            <BotCard>
              <AnalysisResult props={{ type: "folder", content: analysis }} />
            </BotCard>
          )
        }
      },
      display_code_analysis: {
        description: 'リポジトリ全体のコード分析結果を表示します。',
        parameters: z.object({
          analysis: z.string().describe('分析結果の内容')
        }),
        generate: async function* ({ analysis }) {
          yield (
            <BotCard>
              <AnalysisResultSkeleton />
            </BotCard>
          )

          await sleep(1000)

          const toolCallId = nanoid()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'display_code_analysis',
                    toolCallId,
                    args: { analysis }
                  }
                ]
              }
            ]
          })

          return (
            <BotCard>
              <AnalysisResult props={{ type: "code", content: analysis }} />
            </BotCard>
          )
        }
      }
    }
  })

  return {
    id: nanoid(),
    display: result.value
  }
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState() as Chat

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  onSetAIState: async ({ state }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`

      const firstMessageContent = messages[0].content as string
      const title = firstMessageContent.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'tool' ? (
          message.content.map((tool: any) => { // Add type annotation for 'tool'
            switch (tool.toolName) {
              case 'get_repository_info':
                return (
                  <BotCard>
                    <RepositoryInfo props={{ repositories: (tool.result as any).repositories }} /> // Add type annotation for 'tool.result'
                  </BotCard>
                )
              case 'show_analysis_modes':
                return (
                  <BotCard>
                    <AnalysisMode />
                  </BotCard>
                )
              case 'display_history_analysis':
              case 'display_folder_analysis':
              case 'display_code_analysis':
                return (
                  <BotCard>
                    <AnalysisResult props={{ type: tool.toolName.split('_')[1], content: (tool.result as any).analysis }} /> // Add type annotation for 'tool.result'
                  </BotCard>
                )
              default:
                return null
            }
          })
        ) : message.role === 'user' ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === 'assistant' &&
          typeof message.content === 'string' ? (
          <BotMessage content={message.content} />
        ) : null
    }))
}