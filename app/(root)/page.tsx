
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
   <>
   <section className="bg-primary-50 bg-dotted-pattern bg-contain py-5 md:py-10">
    <div className="wrapper grid grid-cols-1 gap-5 md:grid-cols-2 2xl:gap-0">
      <div className="flex flex-col justify-center gap-8">
        <h1 className="h1-bold">Built for Hosts, <br/>Loved by Guests.Your Events,<br/> Our platform! </h1>
        <p className="p-regular-20 md:p-regular-24">You bring the vision—we’ll handle the rest. From idea to celebration, we help you turn special moments into lasting memories.</p>
        <Button size="lg" asChild className="button w-full sm:w-fit">
          <Link href="#events">
          Explore Now</Link>
        </Button>
      </div>
      <Image 
        src="/assets/images/hero.png" 
        alt="hero image"
        width={1000}
        height={1000}
        className="max-h-[70vh] object-contain object-center 2xl:max-h-[50vh] md:order-last"
      />

    </div>
    
    </section>
    
    <section id="events" className="wrapper my-8 flex flex-col gap-8 md:gap-12">
      <div className="flex w-full flex-col gap-5 md:flex-row">
        search
        category
      </div>


      <h2 className="h2-bold"> Trusted by <br/>Event Organisers worldwide</h2></section></>
   
  );
}
