import { z } from "zod"
import Category from "./mongodb/database/models/category.model"

export const EventFormSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  description: z.string()
    .min(3, {
      message: "Description must be at least 3 characters.",
    })
    .max(400, {
      message: "Description must be less than 400 characters.",
    }),
    location: z.string()
    .min(3, {
      message: "Location must be at least 3 characters.",
    })
    .max(400, {
        message: "Location must be less than 400 characters.",
      }),
      imageUrl: z.string(),
      startDateTime: z.date(),
      endDateTime: z.date(),
      CategoryId: z.string(),
      price: z.string(),
      isFree: z.boolean(),
      url: z.string().url()

      
     
})
