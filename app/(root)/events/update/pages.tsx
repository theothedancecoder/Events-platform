import EventForm from '@/components/ui/shared/EventForm'
import { auth } from '@clerk/nextjs/server'
import React from 'react'

const UpdateEvents = async() => {
  
    const {sessionClaims} = await auth()

    const userId = sessionClaims?.userId as string
    return (
      <>
      <section className='bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10'>
       <h3 className='wrapper h3-bold text-center'>Create Event</h3>
      </section>
      
      <div className="wrapper my-8">
      <EventForm userId={userId} type ="update" />
    </div>
    </>
  )
}

export default UpdateEvents
