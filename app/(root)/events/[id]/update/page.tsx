import EventForm from '@/components/ui/shared/EventForm'
import { getEventById } from '@/lib/actions/event.actions'
import { auth } from '@clerk/nextjs/server'
import React from 'react'
import { Metadata } from 'next'

// Use Next.js defined type for params:
interface PageProps {
  params: {
    id: string
  }
}

const UpdateEvent = async ({ params }: PageProps) => {
  const { sessionClaims } = await auth()
  const userId = sessionClaims?.sub as string
  const event = await getEventById(params.id)

  return (
    <>
      <section className='bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10'>
        <h3 className='wrapper h3-bold text-center'>Update Event</h3>
      </section>
      
      <div className="wrapper my-8">
        <EventForm userId={userId} type="Update" event={event} />
      </div>
    </>
  )
}

export default UpdateEvent
