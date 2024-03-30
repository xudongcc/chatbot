'use client'

import * as React from 'react'
import { type DialogProps } from '@radix-ui/react-dialog'
import { toast } from 'sonner'

import { ServerActionResult, type Chat } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { IconSpinner } from '@/components/ui/icons'
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'

interface ChatShareDialogProps extends DialogProps {
  chat: Pick<Chat, 'id' | 'title' | 'messages'>
  shareChat: (id: string) => ServerActionResult<Chat>
  onCopy: () => void
}

export function ChatShareDialog({
  chat,
  shareChat,
  onCopy,
  ...props
}: ChatShareDialogProps) {
  const { copyToClipboard } = useCopyToClipboard({ timeout: 1000 })
  const [isSharePending, startShareTransition] = React.useTransition()

  const copyShareLink = React.useCallback(
    async (chat: Chat) => {
      if (!chat.sharePath) {
        return toast.error('无法将分享链接复制到剪贴板')
      }

      const url = new URL(window.location.href)
      url.pathname = chat.sharePath
      copyToClipboard(url.toString())
      onCopy()
      toast.success('分享链接已复制到剪贴板')
    },
    [copyToClipboard, onCopy]
  )

  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>分享会话链接</DialogTitle>
          <DialogDescription>
            任何拥有会话链接的人都可以查看共享聊天。
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 space-y-1 text-sm border rounded-md">
          <div className="font-medium">{chat.title}</div>
          <div className="text-muted-foreground">
            {chat.messages.length} messages
          </div>
        </div>
        <DialogFooter className="items-center">
          <Button
            disabled={isSharePending}
            onClick={() => {
              // @ts-ignore
              startShareTransition(async () => {
                const result = await shareChat(chat.id)

                if (result && 'error' in result) {
                  toast.error(result.error)
                  return
                }

                copyShareLink(result)
              })
            }}
          >
            {isSharePending ? (
              <>
                <IconSpinner className="mr-2 animate-spin" />
                复制中...
              </>
            ) : (
              <>复制链接</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
