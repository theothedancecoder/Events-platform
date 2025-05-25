'use client'

import { Dispatch, SetStateAction, useState } from 'react'
import { UploadDropzone } from '@/lib/uploadthing'
import { Button } from '@/components/ui/button'

type FileUploaderProps = {
  onFieldChange: (url: string) => void
  imageUrl: string
  setFiles: Dispatch<SetStateAction<File[]>>
}

export function FileUploader({ imageUrl, onFieldChange, setFiles }: FileUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState<boolean>(false)

  return (
    <div className="flex-center bg-dark-3 flex h-72 cursor-pointer flex-col overflow-hidden rounded-xl bg-grey-50">
      {imageUrl ? (
        <div className="flex h-full w-full flex-1 justify-center">
          <img
            src={imageUrl}
            alt="image"
            width={250}
            height={250}
            className="w-full object-cover object-center"
          />
        </div>
      ) : (
        <div className="flex-center flex-col py-5 text-grey-500">
          <UploadDropzone
            endpoint="imageUploader"
            onUploadProgress={(progress) => {
              setUploadProgress(progress)
            }}
            onUploadBegin={() => {
              setIsUploading(true)
            }}
            onClientUploadComplete={(res) => {
              setIsUploading(false)
              if (res?.[0]) {
                setFiles([]) // Clear files or set appropriately if needed
                onFieldChange(res[0].ufsUrl)
              }
            }}
            onUploadError={(error: Error) => {
              setIsUploading(false)
              console.log('Error uploading file:', error.message)
            }}
            config={{
              mode: "auto",
              appendOnPaste: true
            }}
          />
          
          {!isUploading && (
            <>
              <img src="/assets/icons/upload.svg" width={77} height={77} alt="file upload" />
              <h3 className="mb-2 mt-2">Drag photo here</h3>
              <p className="p-medium-12 mb-4">SVG, PNG, JPG up to 4MB</p>
            </>
          )}
          
          {isUploading && (
            <div className="flex-center flex-col gap-2">
              <img src="/assets/icons/spinner.svg" width={50} height={50} alt="loading" className="animate-spin" />
              <p className="text-grey-600">Uploading... {uploadProgress}%</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
