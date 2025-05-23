import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/clerk-sdk-node'
import { createUser, deleteUser, updateUser } from '@/lib/actions/user.actions'
import { NextResponse } from 'next/server'
import { clerkClient } from '@clerk/clerk-sdk-node'

export async function POST(req: Request) {
  try {
    console.log('🟢 Webhook endpoint hit!');
    
    // Verify the webhook
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
    if (!WEBHOOK_SECRET) {
      console.error('❌ No webhook secret found');
      throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
    }

    console.log('🟢 Found webhook secret');

    // Get the headers
    const headersList = await headers();
    const svix_id = headersList.get("svix-id");
    const svix_timestamp = headersList.get("svix-timestamp");
    const svix_signature = headersList.get("svix-signature");

    console.log('🟢 Headers:', { svix_id, svix_timestamp, svix_signature });

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('❌ Missing svix headers');
      return new Response('Error occurred -- no svix headers', {
        status: 400
      })
    }

    // Get the body
    const payload = await req.json()
    console.log('🟢 Received payload:', payload);
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent
      console.log('🟢 Webhook verified successfully');
    } catch (err) {
      console.error('❌ Error verifying webhook:', err);
      return new Response('Error occurred', {
        status: 400
      })
    }

    const eventType = evt.type;
    console.log('🟢 Event type:', eventType);

    if (eventType === 'user.created') {
      const { id, email_addresses, image_url, first_name, last_name, username } = evt.data
      console.log('🟢 User data received:', { id, email_addresses, image_url, first_name, last_name, username });

      const generatedUsername = username || email_addresses[0]?.email_address?.split('@')[0] || id;

      const user = {
        clerkId: id,
        email: email_addresses[0]?.email_address,
        username: generatedUsername,
        firstName: first_name || generatedUsername,
        lastName: last_name || '',
        photo: image_url || `https://ui-avatars.com/api/?name=${generatedUsername}&background=random`,
      }

      console.log('🟢 Attempting to create user:', JSON.stringify(user, null, 2));

      try {
        const newUser = await createUser(user)

        if (!newUser) {
          console.error('❌ User creation returned null');
          throw new Error('Failed to create user in database')
        }

        console.log('🟢 User created successfully:', JSON.stringify(newUser, null, 2));

        await clerkClient.users.updateUserMetadata(id, {
          publicMetadata: {
            userId: newUser._id,
          },
        })

        console.log('🟢 Updated Clerk metadata');

        return NextResponse.json({ message: 'OK', user: newUser })
      } catch (error) {
        console.error('❌ Error in user creation:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }
    }

    if (eventType === 'user.updated') {
      const { id, image_url, first_name, last_name, username } = evt.data
      console.log('🟢 Update user data received:', { id, image_url, first_name, last_name, username });

      const user = {
        firstName: first_name || '',
        lastName: last_name || '',
        username: username || id,
        photo: image_url || `https://ui-avatars.com/api/?name=${username || id}&background=random`,
      }

      const updatedUser = await updateUser(id, user)
      console.log('🟢 User updated successfully:', JSON.stringify(updatedUser, null, 2));
      return NextResponse.json({ message: 'OK', user: updatedUser })
    }

    if (eventType === 'user.deleted') {
      const { id } = evt.data
      console.log('🟢 Delete user request received for id:', id);
      const deletedUser = await deleteUser(id!)
      console.log('🟢 User deleted successfully:', JSON.stringify(deletedUser, null, 2));
      return NextResponse.json({ message: 'OK', user: deletedUser })
    }

    return new Response('', { status: 200 })
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response('Internal Server Error', { status: 500 })
  }
}
