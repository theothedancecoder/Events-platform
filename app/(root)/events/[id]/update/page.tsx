import EventForm from '@/components/ui/shared/EventForm'
import { getEventById } from '@/lib/actions/event.actions'
import { auth } from '@clerk/nextjs/server'

type UpdateEventProps = {
  params: Promise<{
    id: string
  }>
}

const UpdateEvent = async ({ params }: UpdateEventProps) => {
  const awaitedParams = await params;
  const { userId } = await auth()
  if (!userId) return null
  
  const event = await getEventById(awaitedParams.id)
  if (!event) return null

  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center">Update Event</h3>
      </section>

      <div className="wrapper my-8">
        <EventForm 
          type="Update" 
          event={event} 
          eventId={id}
          userId={userId}
        />
      </div>
    </>
  )
}

export default UpdateEvent
