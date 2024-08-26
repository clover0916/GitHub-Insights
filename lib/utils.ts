import { clsx, type ClassValue } from 'clsx'
import { customAlphabet } from 'nanoid'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  7
) // 7-character random string

export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init)

  if (!res.ok) {
    const json = await res.json()
    if (json.error) {
      const error = new Error(json.error) as Error & {
        status: number
      }
      error.status = res.status
      throw error
    } else {
      throw new Error('An unexpected error occurred')
    }
  }

  return res.json()
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value)

export const runAsyncFnWithoutBlocking = (
  fn: (...args: any) => Promise<any>
) => {
  fn()
}

export const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms))

export const getStringFromBuffer = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

export enum ResultCode {
  InvalidCredentials = 'INVALID_CREDENTIALS',
  InvalidSubmission = 'INVALID_SUBMISSION',
  UserAlreadyExists = 'USER_ALREADY_EXISTS',
  UnknownError = 'UNKNOWN_ERROR',
  UserCreated = 'USER_CREATED',
  UserLoggedIn = 'USER_LOGGED_IN'
}

export const getMessageFromCode = (resultCode: string) => {
  switch (resultCode) {
    case ResultCode.InvalidCredentials:
      return '無効な資格情報です！'
    case ResultCode.InvalidSubmission:
      return '無効な提出です、もう一度お試しください！'
    case ResultCode.UserAlreadyExists:
      return 'ユーザーは既に存在しています、ログインしてください！'
    case ResultCode.UserCreated:
      return 'ユーザーが作成されました、ようこそ！'
    case ResultCode.UnknownError:
      return '何か問題が発生しました、もう一度お試しください！'
    case ResultCode.UserLoggedIn:
      return 'ログインしました！'
  }
}

export function format(date: Date, formatString: string) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ]

  return formatString
    .replace('yyyy', year.toString())
    .replace('yy', String(year).slice(-2))
    .replace('LLL', monthNames[month])
    .replace('MM', String(month + 1).padStart(2, '0'))
    .replace('dd', String(day).padStart(2, '0'))
    .replace('d', day.toString())
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

export function parseISO(dateString: string) {
  return new Date(dateString)
}

export function subMonths(date: Date, amount: number) {
  const newDate: Date = new Date(date)
  newDate.setMonth(newDate.getMonth() - amount)
  return newDate
}
