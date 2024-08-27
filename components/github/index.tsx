'use client'

import dynamic from 'next/dynamic'
import { ListRepositoriesSkelton } from './list-repositories-skeleton'
import { AnalysisModesSkeleton } from './analysis-modes-skeleton'
import { AnalysisResultSkeleton } from './analysis-result-skeleton'

export { spinner } from './spinner'
export { BotCard, BotMessage, SystemMessage } from './message'

const ListRepositories = dynamic(() => import('./list-repositories').then(mod => mod.ListRepositories), {
  ssr: false,
  loading: () => <ListRepositoriesSkelton />
})

const RepositoryInfo = dynamic(() => import('./repository-info').then(mod => mod.RepositoryInfo), {
  ssr: false,
  loading: () => <ListRepositoriesSkelton />
})

const AnalysisMode = dynamic(() => import('./analysis-mode').then(mod => mod.AnalysisMode), {
  ssr: false,
  loading: () => <AnalysisModesSkeleton />
})

const AnalysisResult = dynamic(() => import('./analysis-result').then(mod => mod.AnalysisResult), {
  ssr: false,
  loading: () => <AnalysisResultSkeleton />
})

export { ListRepositories, AnalysisMode, AnalysisResult, RepositoryInfo }