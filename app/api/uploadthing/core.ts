import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      try {
        const { userId } = await auth();

        // If you throw, the user will not be able to upload
        if (!userId) throw new UploadThingError("Unauthorized");

        // Whatever is returned here is accessible in onUploadComplete as `metadata`
        return { userId };
      } catch (error) {
        throw new UploadThingError("Unauthorized");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      console.log("file object", file);
      console.log("metadata object", metadata);

      // Return the file URL to the client
      return { ufsUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
