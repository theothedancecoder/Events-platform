"use client"

import { IEvent } from '@/lib/mongodb/database/models/event.model'
import { SignedOut } from '@clerk/clerk-react'
import { SignedIn, useUser } from '@clerk/nextjs'
import React from 'react'
import { Button } from '../button'
import Link from 'next/link'
import Checkout from './Checkout'

const CheckoutButton = ({ event }: { event: IEvent }) => {
  const { user } = useUser()
  const userId = user?.id
  const hasEventFinished = new Date(event.endDateTime) < new Date()

  return (
    <div className='flex items-center gap-3'>
      {hasEventFinished ? (
        <p className='p-2 text-red-400'>Sorry, tickets are no longer available</p>
      ) : (
        <>
          <SignedOut>
            <Button asChild className='button rounded-full' size='lg'>
              <Link href="/sign-in">
                Get Tickets
              </Link>
            </Button>
          </SignedOut>
          <SignedIn>
            {userId && <Checkout event={event} userId={userId} />}
          </SignedIn>
        </>
      )}
    </div>
  )
}

export default CheckoutButton
