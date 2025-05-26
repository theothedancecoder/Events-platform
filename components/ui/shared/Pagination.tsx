"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import React from 'react'
import { Button } from '../button'
import { formUrlQuery } from '@/lib/utils'

type PaginationProps = {
  page: number | string,
  totalPages: number,
  urlParamName?: string,
}

const Pagination = ({
  page,
  totalPages,
  urlParamName = 'page'
}: PaginationProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const onClick = (btnType: string) => {
    try {
      const pageValue = btnType === 'next' 
        ? Number(page) + 1 
        : Number(page) - 1

      // Validate page value
      if (pageValue < 1 || pageValue > totalPages) {
        console.warn('Invalid page number:', pageValue);
        return;
      }

      const newUrl = formUrlQuery({
        params: searchParams.toString(),
        key: urlParamName,
        value: pageValue.toString(),
      })

      router.push(newUrl, { scroll: false })
    } catch (error) {
      console.error('Error in pagination:', error);
      // Keep the current URL if there's an error
      router.push(window.location.pathname + window.location.search);
    }
  }

  // Don't render pagination if there's only one page or no pages
  if (totalPages <= 1) return null;

  return (
    <div className='flex gap-2'>
      <Button 
        size="lg"
        variant="outline"
        className='w-28'
        onClick={() => onClick('prev')}
        disabled={Number(page) <= 1}
      >
        Previous
      </Button>

      <Button 
        size="lg"
        variant="outline"
        className='w-28'
        onClick={() => onClick('next')}
        disabled={Number(page) >= totalPages}
      >
        Next
      </Button>
    </div>
  )
}

export default Pagination
