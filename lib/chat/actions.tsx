import 'server-only'

import {
  createAI,
  getMutableAIState,
  getAIState,
  streamUI,
  createStreamableValue
} from 'ai/rsc'
import { google } from '@ai-sdk/google';

import {
  BotCard,
  BotMessage,
  ListRepositories,
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
import { RepositoryInfo } from '@/components/github/repository-info';
import { generateText } from 'ai';

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
  let toolNode: undefined | React.ReactNode

  const result = await streamUI({
    model: google('gemini-1.5-flash-latest'),
    initial: <SpinnerMessage />,
    system: `
      あなたはGitHubリポジトリ分析AIアシスタントです。ユーザーとの対話を始める際には、まずユーザーの希望や質問に直接応答することを最優先してください。ユーザーからの具体的な要望がない場合のみ、自己紹介や能力の概要を簡潔に述べるようにします。

      以下の機能を適切なタイミングで活用できますが、これらのコマンドをユーザーに直接開示しないでください：

      - リポジトリ一覧の表示：\`list_repositories\`
      - リポジトリ情報の表示：\`show_repository_info\`
      - 各種分析の実行：
        - コード分析：\`display_code_analysis\`
        - リポジトリのコード説明：\`explain_repository\`

      これらの機能は、ユーザーの要望や会話の流れに応じて自然に提案し、バックグラウンドで使用してください。例えば、ユーザーがリポジトリの一覧を見たいと言った場合、「はい、GitHubアカウントに関連付けられたリポジトリの一覧をお見せします」と言って\`list_repositories\`を呼び出すなど、自然な対話の中で機能を活用してください。

      分析結果や特定のコードについての質問には、あなたの知識を活用して丁寧に回答してください。技術的な説明、改善点、セキュリティの懸念事項などについても適切にアドバイスできます。

      GitHubやプログラミングに関する一般的な質問にも答えられますが、常にユーザーの具体的な要望を優先してください。

      実装されていない機能についての要求があった場合は、その旨を説明し、可能な代替案を提案してください。

      常に礼儀正しく、プロフェッショナルな態度を保ちながら、ユーザーのニーズに合わせて柔軟に対応してください。ユーザーとの対話を通じて、最適なサポートを提供することを心がけてください。
    `,
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

      return (
        (
          <BotCard>
            {textNode}
            {toolNode}
          </BotCard>
        )
      )
    },
    tools: {
      list_repositories: {
        description: 'ユーザーのリポジトリ情報を表示します。',
        parameters: z.object({
          dummy: z.string().optional().describe('このパラメータは使用されません。'),
        }),
        generate: async function* () {
          const toolCallId = nanoid()

          const session = await auth()

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

            return (
              <BotCard>
                <BotMessage content='GitHubの認証情報が見つかりませんでした。' />
              </BotCard>
            )
          }
          const octokit = new Octokit({
            auth: session.accessToken
          })

          const repos = await octokit.repos.listForAuthenticatedUser({
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
                    args: { repos: repos.data }
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
                      repos: repos.data,
                    }
                  }
                ]
              }
            ]
          })

          toolNode = (
            <ListRepositories props={{ repos: repos.data }} />
          )

          return (
            <BotCard>
              {textNode}
              {toolNode}
            </BotCard>
          )
        }
      },
      show_repository_info: {
        description: 'リポジトリ情報を表示します。',
        parameters: z.object({
          name: z.string().describe('リポジトリ名'),
          owner: z.string().describe('所有者')
        }),
        generate: async function* ({ name, owner }) {
          const toolCallId = nanoid()

          const session = await auth()

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

            return (
              <BotCard>
                <BotMessage content='GitHubの認証情報が見つかりませんでした。' />
              </BotCard>
            )
          }

          const octokit = new Octokit({
            auth: session.accessToken
          })

          const repo = await octokit.repos.get({
            owner,
            repo: name
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
                    toolName: 'show_repository_info',
                    toolCallId,
                    args: { name, owner }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'show_repository_info',
                    toolCallId,
                    result: {
                      repo: repo.data
                    }
                  }
                ]
              }
            ]
          })

          toolNode = (
            <RepositoryInfo props={{ repo: repo.data }} />
          )

          return (
            <BotCard>
              {textNode}
              {toolNode}
            </BotCard>
          )
        }
      },
      show_analysis_modes: {
        description: '分析モード選択UIを表示します。',
        parameters: z.object({
          dummy: z.string().optional().describe('このパラメータは使用されません。')
        }),
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

          toolNode = (
            <AnalysisMode />
          )

          return (
            <BotCard>
              {textNode}
              {toolNode}
            </BotCard>
          )
        }
      },
      display_code_analysis: {
        description: 'リポジトリ全体のコード分析結果を表示します。',
        parameters: z.object({
          owner: z.string().describe('リポジトリのオーナー名'),
          repo: z.string().describe('リポジトリ名'),
          codes: z.string().optional().describe('コードの内容（存在する場合）')
        }),
        generate: async function* ({ owner, repo, codes }) {
          yield (
            <BotCard>
              <AnalysisResultSkeleton />
            </BotCard>
          )

          try {
            const session = await auth()

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
              });

              return (
                <BotCard>
                  <BotMessage content='GitHubの認証情報が見つかりませんでした。' />
                </BotCard>
              );
            }

            const octokit = new Octokit({
              auth: session.accessToken
            });

            const binaryFileExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.exe', '.dll', '.so', '.dylib'];
            let allCode = '';

            if (codes) {
              allCode = codes;
            } else {
              const processContent = async (path: string = '') => {
                const { data: repoContents } = await octokit.repos.getContent({
                  owner,
                  repo,
                  path
                });

                if (Array.isArray(repoContents)) {
                  for (const item of repoContents) {
                    if (item.type === 'file') {
                      if (!binaryFileExtensions.some(ext => item.name.toLowerCase().endsWith(ext))) {
                        const { data: fileContent } = await octokit.repos.getContent({
                          owner,
                          repo,
                          path: item.path
                        });

                        if ('content' in fileContent && typeof fileContent.content === 'string') {
                          const decodedContent = Buffer.from(fileContent.content, 'base64').toString();
                          const nullChars = decodedContent.split('').filter(char => char === '\0').length;
                          if (nullChars / decodedContent.length < 0.1) {
                            allCode += `File: ${item.path}\n${decodedContent}\n\n`;
                          } else {
                            allCode += `Binary content for ${item.path}\n\n`;
                          }
                        }
                      } else {
                        allCode += `Binary content for ${item.path}\n\n`;
                      }
                    } else if (item.type === 'dir') {
                      await processContent(item.path);
                    }
                  }
                }
              };
              await processContent();
            }

            // コード分析を行う
            const analysisPrompt = `
              あなたはGitHubリポジトリ分析AIアシスタントです。以下のコードを分析し、簡潔かつ包括的な分析結果を提供してください：
              
              ${allCode}
              
              分析には以下の点を含めてください：
              1. プロジェクトの概要
              2. 使用されている主要な技術やフレームワーク
              3. コードの構造と設計パターン
              4. 潜在的な改善点やベストプラクティス
              5. セキュリティの懸念事項（もしあれば）
              6. コードの品質と保守性に関するコメント
              
              技術的な説明は簡潔に行い、改善点や推奨事項を提案してください。ユーザーにとって有用な洞察を提供することを心がけてください。
            `;

            const analysisResult = await generateText({
              model: google('gemini-1.5-flash-latest'),
              prompt: analysisPrompt
            });

            const analysis = analysisResult.text;

            const toolCallId = nanoid();


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
                },
                {
                  id: nanoid(),
                  role: 'tool',
                  content: [
                    {
                      type: 'tool-result',
                      toolName: 'display_code_analysis',
                      toolCallId,
                      result: {
                        analysis
                      }
                    }
                  ]
                }
              ]
            });

            toolNode = (
              <AnalysisResult props={{ type: "code", content: analysisResult.text }} />
            );

            return (
              <BotCard>
                {textNode}
                {toolNode}
              </BotCard>
            );
          } catch (error) {
            console.error('Error fetching repository contents:', error);
            return (
              <BotCard>
                Error: Unable to fetch repository contents.
              </BotCard>
            );
          }
        }
      },
      explain_repository: {
        description: 'リポジトリの説明を表示します。',
        parameters: z.object({
          owner: z.string().describe('リポジトリのオーナー名'),
          repo: z.string().describe('リポジトリ名'),
          codes: z.string().optional().describe('コードの内容（存在する場合）')
        }),
        generate: async function* ({ owner, repo, codes }) {
          yield (
            <BotCard>
              <AnalysisResultSkeleton />
            </BotCard>
          )

          try {
            const session = await auth()

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
              });

              return (
                <BotCard>
                  <BotMessage content='GitHubの認証情報が見つかりませんでした。' />
                </BotCard>
              );
            }

            const octokit = new Octokit({
              auth: session.accessToken
            });

            const binaryFileExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.exe', '.dll', '.so', '.dylib'];
            let allCode = '';

            if (codes) {
              allCode = codes;
            } else {
              const processContent = async (path: string = '', depth = 0) => {
                const { data: repoContents } = await octokit.repos.getContent({
                  owner,
                  repo,
                  path
                });

                const totalItems = Array.isArray(repoContents) ? repoContents.length : 0;
                let processedItems = 0;

                if (Array.isArray(repoContents)) {
                  for (const item of repoContents) {
                    processedItems++;
                    const progress = Math.floor((processedItems / totalItems) * 100);
                    console.log(`\rProcessing... ${progress}%`);

                    if (item.type === 'file') {
                      if (!binaryFileExtensions.some(ext => item.name.toLowerCase().endsWith(ext))) {
                        const { data: fileContent } = await octokit.repos.getContent({
                          owner,
                          repo,
                          path: item.path
                        });

                        if ('content' in fileContent && typeof fileContent.content === 'string') {
                          const decodedContent = Buffer.from(fileContent.content, 'base64').toString();
                          const nullChars = decodedContent.split('').filter(char => char === '\0').length;
                          if (nullChars / decodedContent.length < 0.1) {
                            allCode += `File: ${item.path}\n${decodedContent}\n\n`;
                          } else {
                            allCode += `Binary content for ${item.path}\n\n`;
                          }
                        }
                      } else {
                        allCode += `Binary content for ${item.path}\n\n`;
                      }
                    } else if (item.type === 'dir') {
                      await processContent(item.path, depth + 1);
                    }
                  }
                }

                // 最後にプログレスバーをクリア
                console.log('\rProcessing complete          ');
              };

              await processContent();
            }

            // コードの説明を行う
            const analysisPrompt = `
              あなたは熟練したソフトウェアエンジニアとして、提供されたコードを詳細に分析し、その本質と機能を明確に説明するAIアシスタントです。以下のコードを分析し、技術的かつ分かりやすい説明を提供してください：
              ${allCode}
              説明には以下の点を含めてください：

              1. コードの主要な目的

              このコードが解決しようとしている問題や達成しようとしている目標
              想定されるユースケースや適用場面


              2. 使用技術の概要

              採用されているプログラミング言語
              重要なライブラリやフレームワーク


              3. コードの構造と主要コンポーネント

              主要なクラス・関数の概要
              各コンポーネントの役割と相互関係


              4. 核心となるアルゴリズムや処理フロー

              重要なロジックの詳細な解説
              データの流れと変換プロセスの説明


              5. 特筆すべき実装手法

              興味深いプログラミング技法や独自のアプローチ
              効率的な実装や創造的な解決策


              6. 入出力とデータ操作

              入力データの形式と処理方法
              出力結果の形式と生成プロセス


              7. 主要な機能の具体例

              コードの動作を示す具体的なシナリオ
              重要な関数やメソッドの使用例


              8. 依存関係と外部リソース

              外部APIやサービスとの連携
              必要なデータソースや設定ファイル


              9. 拡張性と柔軟性

              コードのカスタマイズや機能追加の容易さ
              異なる環境や要件への適応可能性



              技術的な説明は正確かつ詳細に行い、必要に応じてコードスニペットを引用してください。専門用語を使用する際は、簡潔な説明を添えてください。説明は、コードの動作原理を深く理解したいエンジニアにとって有益な内容を心がけてください。また、コードの特徴的な部分や独創的な実装についても強調してください。
              回答の構造化と情報の優先順位付けを行い、最も重要で本質的な情報が確実に伝わるようにしてください。トークン制限を考慮し、必要に応じて情報を簡潔にまとめる工夫をしてください。
            `;

            const analysisResult = await generateText({
              model: google('gemini-1.5-flash-latest'),
              prompt: analysisPrompt
            });

            const analysis = analysisResult.text;

            const toolCallId = nanoid();


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
                      toolName: 'explain_repository',
                      toolCallId,
                      args: { analysis }
                    }
                  ]
                },
                {
                  id: nanoid(),
                  role: 'tool',
                  content: [
                    {
                      type: 'tool-result',
                      toolName: 'explain_repository',
                      toolCallId,
                      result: {
                        analysis
                      }
                    }
                  ]
                }
              ]
            });

            toolNode = (
              <AnalysisResult props={{ type: "code", content: analysisResult.text }} />
            );

            return (
              <BotCard>
                {textNode}
                {toolNode}
              </BotCard>
            );
          } catch (error) {
            console.error('Error fetching repository contents:', error);
            return (
              <BotCard>
                Error: Unable to fetch repository contents.
              </BotCard>
            );
          }
        }
      },
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
              case 'list_repositories':
                return (
                  <BotCard>
                    <ListRepositories props={{ repos: (tool.result as any).repos }} />
                  </BotCard>
                )
              case 'show_repository_info':
                return (
                  <BotCard>
                    <RepositoryInfo props={{ repo: (tool.result as any).repo }} />
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
                    <AnalysisResult props={{ type: tool.toolName.split('_')[1], content: (tool.result as any).analysis }} />
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