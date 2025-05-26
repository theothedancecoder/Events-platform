import CheckoutButton from '@/components/ui/shared/CheckoutButton';
import Collection from '@/components/ui/shared/Collection';
import { getEventById, getRelatedEventsByCategory } from '@/lib/actions/event.actions'
import Event from '@/lib/mongodb/database/models/event.model';
import { formatDateTime } from '@/lib/utils';
import { SearchParamProps } from '@/types'
import Image from 'next/image';

function isValidImageUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    // Allow URLs from known upload domains without typical image extensions
    const allowedHostnames = ['utfs.io', 'sea1.ingest.uploadthing.com', 'yfg7y7pev1.ufs.sh'];
    if (allowedHostnames.includes(parsedUrl.hostname)) {
      return true;
    }
    // Basic check for image file extensions
    return /\.(jpeg|jpg|gif|png|webp|svg|bmp|tiff?)$/i.test(parsedUrl.pathname);
  } catch {
    return false;
  }
}

const EventDetails = async (props: SearchParamProps) => {
  const resolvedParams = await props.params;
  const resolvedSearchParams = await props.searchParams;
  const id = resolvedParams.id;

  const event = await getEventById(id);

  const relatedEvents = await getRelatedEventsByCategory({
    categoryId: event.category._id,
    eventId: event._id,
    page: resolvedSearchParams.page as string
  }) ?? [];

  const hasValidImage = event.imageUrl && isValidImageUrl(event.imageUrl);

  return (
    <>
      <section className="flex justify-center bg-primary-50 bg-dotted-pattern bg-contain">
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:max-w-7xl">
          
          {/* ✅ Conditionally render image to avoid missing src error */}
          {hasValidImage ? (
            <img 
              src={event.imageUrl}
              alt="hero image"
              width={1000}
              height={1000}
              className="h-full min-h-[300px] object-cover object-center"
            />
          ) : (
            <div className="h-[300px] w-full bg-gray-200 flex items-center justify-center">
              <p className="text-gray-500">No image available</p>
            </div>
          )}

          <div className="flex w-full flex-col gap-8 p-5 md:p-10">
            <div className="flex flex-col gap-6">
              <h2 className="h2-bold">{event.title}</h2>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex gap-3">
                  <p className="p-bold-20 rounded-full bg-green-500/10 px-5 py-2 text-green-700">
                    {event.isFree ? 'FREE' : `$${event.price}`}
                  </p>
                  <p className="p-medium-16 rounded-full bg-grey-500/10 px-4 py-2.5 text-grey-500">
                    {event.category.name}
                  </p>
                </div>

                <p className="p-medium-18 ml-2 mt-2 sm:mt-0">
                  by{' '}
                  <span className="text-primary-500">
                    {event.organizer.firstName} {event.organizer.lastName}
                  </span>
                </p>
              </div>
            </div>
            {/*Checkout Button*/}
            <CheckoutButton event={event}/>

            <div className="flex flex-col gap-5">
              <div className="flex gap-2 md:gap-3">
                <Image src="/assets/icons/calendar.svg" alt="calendar" width={32} height={32} />
                <div className="p-medium-16 lg:p-regular-20 flex flex-wrap items-center gap-2">
                  <p>
                    {formatDateTime(event.startDateTime).dateOnly} -{' '}
                    {formatDateTime(event.startDateTime).timeOnly}
                  </p>
                  <p>
                    {formatDateTime(event.endDateTime).dateOnly} -{' '}
                    {formatDateTime(event.endDateTime).timeOnly}
                  </p>
                </div>
              </div>

              <div className="p-regular-20 flex items-center gap-3">
                <Image src="/assets/icons/location.svg" alt="location" width={32} height={32} />
                <p className="p-medium-16 lg:p-regular-20">{event.location}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="p-bold-20 text-grey-600">What You'll Learn:</p>
              <p className="p-medium-16 lg:p-regular-18">{event.description}</p>
              <p className="p-medium-16 lg:p-regular-18 truncate text-primary-500 underline">
                {event.url}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* EVENTS with the same category */}
      <section className="wrapper my-8 flex flex-col gap-8 md:gap-12">
        <h2 className="h2-bold">Related Events</h2>
        <Collection
          data={relatedEvents?.data ?? []}
          emptyTitle="No Events Found"
          emptyStateSubtext="Come back later"
          collectionType="All_Events"
          limit={6}
          page={1}
          totalPages={relatedEvents?.totalPages ?? 2}
        />
      </section>
    </>
  )
}

export default EventDetails
