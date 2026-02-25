import * as z from "zod";

export const PostValidation = z.object({
  post: z.string().nonempty().min(3, { message: "Minimum 3 characters." }),
  accountId: z.string(),
  images: z.array(z.url()).default([]),
});

export const CommentValidation = z.object({
  post: z.string().nonempty().min(3, { message: "Minimum 3 characters." }),
  images: z.array(z.url()).default([]),
});
