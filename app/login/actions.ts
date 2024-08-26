'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { ResultCode } from '@/lib/utils'

interface Result {
  type: string
  resultCode: ResultCode
}

export async function authenticateWithGitHub(): Promise<Result> {
  try {
    await signIn('github', { redirect: false })
    return {
      type: 'success',
      resultCode: ResultCode.UserLoggedIn
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        type: 'error',
        resultCode: ResultCode.UnknownError
      }
    }
    return {
      type: 'error',
      resultCode: ResultCode.UnknownError
    }
  }
}
