import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import User from '@/lib/mongodb/database/models/user.model'
import { connectToDatabase } from '@/lib/mongodb/database'

interface UserWebhookData {
  id: string;
  email_addresses: { email_address: string }[];
  image_url: string;
  first_name: string;
  last_name: string;
  username: string | null;
}

export async function POST(req: Request) {
  try {
    console.log('🟢 Webhook endpoint hit');
    
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
    if (!WEBHOOK_SECRET) {
      throw new Error('Missing WEBHOOK_SECRET')
    }

    // Get the headers
    const headersList = headers();
    const svix_id = headersList.get?.("svix-id");
    const svix_timestamp = headersList.get?.("svix-timestamp");
    const svix_signature = headersList.get?.("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      throw new Error('Missing svix headers')
    }

    // Get the body
    const payload = await req.json()
    const body = JSON.stringify(payload);

    // Verify the payload with the headers
    const wh = new Webhook(WEBHOOK_SECRET);
    const evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent

    console.log('🟢 Event type:', evt.type);

    // Handle the webhook
    if (evt.type === 'user.created') {
      const { id, email_addresses, image_url, first_name, last_name, username } = evt.data as UserWebhookData;
      console.log('🟢 User data:', { id, email_addresses, image_url, first_name, last_name, username });

      if (!id) {
        throw new Error('Missing user ID')
      }

      try {
        // Connect to database
        await connectToDatabase()

        // Check if user already exists
        const existingUser = await User.findOne({ clerkId: id })
        if (existingUser) {
          console.log('🟢 User already exists:', existingUser);
          return NextResponse.json({ message: 'User already exists', user: existingUser })
        }

        // Create new user
        const newUserData = {
          clerkId: id,
          email: email_addresses[0]?.email_address || `${id}@example.com`,
          username: username || email_addresses[0]?.email_address?.split('@')[0] || id,
          firstName: first_name || 'Anonymous',
          lastName: last_name || 'User',
          photo: image_url || `https://ui-avatars.com/api/?name=${first_name || 'Anonymous'}+${last_name || 'User'}`
        }

        console.log('🟢 Creating new user:', newUserData);
        const user = await User.create(newUserData)
        console.log('🟢 User created successfully:', user);

        return NextResponse.json({ message: 'User created', user })
      } catch (dbError: any) {
        console.error('❌ Database error:', dbError);
        
        // If it's a duplicate key error, try to return the existing user
        if (dbError.code === 11000) {
          const existingUser = await User.findOne({ clerkId: id })
          if (existingUser) {
            console.log('🟢 Found existing user after error:', existingUser);
            return NextResponse.json({ message: 'User already exists', user: existingUser })
          }
        }
        throw dbError
      }
    }

    return NextResponse.json({ message: 'OK' })
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
