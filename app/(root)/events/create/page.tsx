import EventForm from "@/components/ui/shared/EventForm";
import { auth } from "@clerk/nextjs/server";
import { createUser } from "@/lib/actions/user.actions";

const CreateEvent = async () => {
  const { sessionClaims, userId } = await auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Get user details from session claims
  const user = {
    clerkId: userId,
    email: sessionClaims?.email as string,
    username: sessionClaims?.username as string,
    firstName: sessionClaims?.firstName as string,
    lastName: sessionClaims?.lastName as string,
    photo: sessionClaims?.photo as string
  };

  // Create or get existing user in MongoDB
  await createUser(user);

  return (
    <>
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center">Create Event</h3>
      </section>

      <div className="wrapper my-8">
        <EventForm userId={userId} type="Create" />
      </div>
    </>
  )
}

export default CreateEvent
