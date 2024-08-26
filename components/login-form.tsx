'use client'

import React from 'react'
import { IconGitHub, IconSpinner } from './ui/icons'
import { cn, } from '@/lib/utils'
import { Button, ButtonProps } from './ui/button'
import { signIn } from "next-auth/react"

export default function LoginForm() {
  return (
    <div className="flex flex-col items-center gap-4 space-y-3">
      <div className="w-full flex-1 rounded-lg border bg-white px-6 pb-4 pt-8 shadow-md md:w-96 dark:bg-zinc-950">
        <h1 className="mb-3 text-2xl font-bold">続行するにはログインしてください。</h1>
        <LoginButton />
      </div>
    </div>
  )
}

interface LoginButtonProps extends ButtonProps {
  showGithubIcon?: boolean
  text?: string
}

function LoginButton({
  text = 'Login with GitHub',
  showGithubIcon = true,
  className,
  ...props
}: LoginButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  return (
    <Button
      variant="outline"
      onClick={() => {
        setIsLoading(true)
        // next-auth signIn() function doesn't work yet at Edge Runtime due to usage of BroadcastChannel
        signIn('github', { callbackUrl: `/` })
      }}
      disabled={isLoading}
      className={cn(className)}
      {...props}
    >
      {isLoading ? (
        <IconSpinner className="mr-2 animate-spin" />
      ) : showGithubIcon ? (
        <IconGitHub className="mr-2" />
      ) : null}
      {text}
    </Button>
  )
}
