import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <SignIn 
      appearance={{
        elements: {
          formButtonPrimary: 'primary-gradient',
          footerActionLink: 'primary-text-gradient hover:text-primary-500'
        }
      }}
      path="/sign-in"
      routing="path"
      signUpUrl="/sign-up"
      afterSignInUrl="/"
    />
  )
}
