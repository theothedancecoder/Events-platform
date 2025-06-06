"use client"

import Image from 'next/image';
import { useEffect, useState } from 'react'
import { Input } from '../input';
import { formUrlQuery, removeKeysFromQuery } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';

const Search = ({ placeholder = 'Search title...' }: { placeholder?: string }) => {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      try {
        let newUrl = '';
        const currentParams = searchParams.toString();

        if(query) {
          newUrl = formUrlQuery({
            params: currentParams,
            key: 'query',
            value: query
          })
        } else {
          newUrl = removeKeysFromQuery({
            params: currentParams,
            keysToRemove: ['query']
          })
        }

        router.push(newUrl, { scroll: false });
      } catch (error) {
        console.error('Error in search:', error);
        // Keep the current URL if there's an error
        router.push(window.location.pathname + window.location.search);
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn);
  }, [query, searchParams, router])

  return (
    <div className="flex-center min-h-[54px] w-full overflow-hidden rounded-full bg-grey-50 px-4 py-2">
      <Image 
        src="/assets/icons/search.svg" 
        alt="search" 
        width={24} 
        height={24} 
      />
      <Input 
        type="text"
        placeholder={placeholder}
        onChange={(e) => setQuery(e.target.value)}
        value={query}
        className="p-regular-16 border-0 bg-grey-50 outline-offset-0 placeholder:text-grey-500 focus:border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  )
}

export default Search
