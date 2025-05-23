import { clerkClient, WebhookEvent } from '@clerk/clerk-sdk-node'
import { createUser, deleteUser, updateUser} from '@/lib/actions/user.actions'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // Get the request body
  const payload = await req.json()
  const evt: WebhookEvent = payload; // Assuming the payload is already a WebhookEvent

  const eventType = evt.type

  // 🟢 Handle user.created
  if (eventType === 'user.created') {
    const { id, email_addresses, image_url, first_name, last_name, username } = evt.data

    const user = {
      clerkId: id,
      email: email_addresses[0]?.email_address,
      username: username!,
      firstName: first_name ,
      lastName: last_name,
      photo: image_url,
    }

    try {
      const newUser = await createUser(user)

      if (!newUser ) {
        throw new Error('Failed to create user in database')
      }

      await clerkClient.users.updateUserMetadata(id, {
        publicMetadata: {
          userId: newUser ._id,
        },
      })

      return NextResponse.json({ message: 'OK', user: newUser  })
    } catch (error) {
      console.error('Error in user.created webhook:', error)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }
  }

  // 🟢 Handle user.updated
  if (eventType === 'user.updated') {
    const { id, image_url, first_name, last_name, username } = evt.data

    const user = {
      firstName: first_name,
      lastName: last_name,
      username: username!,
      photo: image_url,
    }

    const updatedUser  = await updateUser (id, user)

    return NextResponse.json({ message: 'OK', user: updatedUser  })
  }

  // 🟢 Handle user.deleted
  if (eventType === 'user.deleted') {
    const { id } = evt.data

    const deletedUser  = await deleteUser (id!)

    return NextResponse.json({ message: 'OK', user: deletedUser  })
  }

  return new Response('', { status: 200 })
}
