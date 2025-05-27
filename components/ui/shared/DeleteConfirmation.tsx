'use client'

import { useTransition, useState } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { useUser } from '@clerk/nextjs'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

import { deleteEvent } from '@/lib/actions/event.actions'

export const DeleteConfirmation = ({ eventId }: { eventId: string }) => {
  const pathname = usePathname()
  let [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const { user } = useUser()

  const handleDelete = async () => {
    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    try {
      setError(null)
      const result = await deleteEvent({ 
        userId: user.id,
        eventId, 
        path: pathname 
      })

      if (!result?.success) {
        throw new Error('Failed to delete event')
      }

      // Force reload the page to show the updated list
      window.location.reload()
    } catch (err) {
      console.error('Error deleting event:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete event')
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger>
        <Image src="/assets/icons/delete.svg" alt="edit" width={20} height={20} />
      </AlertDialogTrigger>

      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
          <AlertDialogDescription className="p-regular-16 text-grey-600">
            This will permanently delete this event and all associated orders
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="p-regular-16 text-red-500 mt-2">
            {error}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>

          <AlertDialogAction
            onClick={() => startTransition(handleDelete)}
            className={error ? 'bg-red-500 hover:bg-red-600' : ''}>
            {isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
