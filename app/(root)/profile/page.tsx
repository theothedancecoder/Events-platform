import Collection from '@/components/ui/shared/Collection'
import { Button } from '@/components/ui/button'
import { getEventsByUser } from '@/lib/actions/event.actions'
import { getOrdersByUser } from '@/lib/actions/order.actions'
import { SearchParamProps } from '@/types'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import React from 'react'
import { IOrder } from '@/lib/mongodb/database/models/order.model'

const ProfilePage = async ({ searchParams }: SearchParamProps) => {
  const { sessionClaims } = await auth();
  const userId = sessionClaims?.userId as string;

  const ordersPage = Number((await searchParams)?.ordersPage) || 1;
  const eventsPage = Number((await searchParams)?.eventsPage) || 1;

  let orders = null;
  let orderedEvents: IOrder[] = [];
  let organizedEvents = null;
  let organizerNotFound = false;

  try {
    orders = await getOrdersByUser({ userId, page: ordersPage });
    orderedEvents = orders?.data.map((order: IOrder) => order.event) || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
  }

  try {
    organizedEvents = await getEventsByUser({ userId, page: eventsPage });
  } catch (error) {
    if (error.message === 'Organizer not found') {
      organizerNotFound = true;
    } else {
      console.error('Error fetching organized events:', error);
    }
  }

  if (organizerNotFound) {
    return (
      <section className="wrapper my-8">
        <h3 className="text-red-600 text-center">
          Organizer profile not found. Please ensure your account is properly set up.
        </h3>
      </section>
    );
  }

  return (
    <>
      {/* My Tickets */}
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <div className="wrapper flex items-center justify-center sm:justify-between">
          <h3 className='h3-bold text-center sm:text-left'>My Tickets</h3>
          <Button asChild size="lg" className="button hidden sm:flex">
            <Link href="/#events">
              Explore More Events
            </Link>
          </Button>
        </div>
      </section>

      <section className="wrapper my-8">
        <Collection 
          data={orderedEvents}
          emptyTitle="No event tickets purchased yet"
          emptyStateSubtext="No worries - plenty of exciting events to explore!"
          collectionType="My_Tickets"
          limit={3}
          page={ordersPage}
          urlParamName="ordersPage"
          totalPages={orders?.totalPages}
        />
      </section>

      {/* Events Organized */}
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <div className="wrapper flex items-center justify-center sm:justify-between">
          <h3 className='h3-bold text-center sm:text-left'>Events Organized</h3>
          <Button asChild size="lg" className="button hidden sm:flex">
            <Link href="/events/create">
              Create New Event
            </Link>
          </Button>
        </div>
      </section>

      <section className="wrapper my-8">
        <Collection 
          data={organizedEvents?.data}
          emptyTitle="No events have been created yet"
          emptyStateSubtext="Go create some now"
          collectionType="Events_Organized"
          limit={3}
          page={eventsPage}
          urlParamName="eventsPage"
          totalPages={organizedEvents?.totalPages}
        />
      </section>
    </>
  )
}

export default ProfilePage
