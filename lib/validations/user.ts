import * as z from "zod";

export const UserValidation = z.object({
  profile_photo: z.string().url().nonempty(),
  name: z
    .string()
    .min(3, { error: "Minimum 3 characters." })
    .max(30, { error: "Maximum 30 caracters." }),
  username: z
    .string()
    .min(3, { error: "Minimum 3 characters." })
    .max(30, { error: "Maximum 30 caracters." }),
  bio: z
    .string()
    .min(3, { error: "Minimum 3 characters." })
    .max(1000, { error: "Maximum 1000 caracters." }),
});
