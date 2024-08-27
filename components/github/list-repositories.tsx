'use client'

import React, { useState } from 'react'
import { useActions, useUIState } from 'ai/rsc'
import { components } from "@octokit/openapi-types";
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { Button } from '@/components/ui/button'

import type { AI } from '@/lib/chat/actions'
import { IconCheck, IconChevronUpDown } from '../ui/icons';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type Repository = components["schemas"]["repository"];

type ListRepositoriesProps = {
  props: {
    repositories: Repository[]
  }
}

export function ListRepositories({ props: { repositories } }: ListRepositoriesProps) {
  const [, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  return (
    <div>
      <div className="flex flex-col gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex"
            >
              {value
                ? (() => {
                  console.log(value);
                  const repository = repositories.find(
                    (repository) =>
                      `${repository.owner.login}/${repository.name}` === value
                  );

                  return (
                    <>
                      {repository?.owner.avatar_url && (
                        <Image
                          src={repository.owner.avatar_url}
                          alt=""
                          width={20}
                          height={20}
                          className="rounded-full mr-2"
                        />
                      )}
                      {repository?.owner.login}/{repository?.name}
                    </>
                  );
                })()
                : "リポジトリを選択"}
              <IconChevronUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="リポジトリを検索" />
              <CommandList>
                <CommandEmpty>リポジトリが見つかりません</CommandEmpty>
                <CommandGroup>
                  {repositories.map((repository) => (
                    <CommandItem
                      key={repository.id}
                      value={`${repository.owner.login}/${repository.name}`}
                      onSelect={(currentValue: React.SetStateAction<string>) => {
                        setValue(currentValue === value ? "" : currentValue);
                        setOpen(false);
                      }}
                      className="white-space-nowrap"
                    >
                      <IconCheck
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === `${repository.owner.login}/${repository.name}`
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <Image
                        src={repository.owner.avatar_url}
                        alt=""
                        width={20}
                        height={20}
                        className="rounded-full mr-2"
                      />
                      {repository.owner.login}/{repository.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Button
          onClick={async () => {
            const response = await submitUserMessage(value);

            setMessages(currentMessages => [...currentMessages, response])
          }}
        >
          選択
        </Button>
      </div>
      <div className="mt-4 text-center text-sm text-zinc-500">
        分析を開始するために、リポジトリを選択してください。
      </div>
    </div>
  );
}