"use client";

import * as z from "zod";
import { Resolver, useForm } from "react-hook-form";
import { useOrganization } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";
import Image from "next/image";
import { Paperclip, X } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { PostValidation } from "@/lib/validations/post";
import { createPost } from "@/lib/actions/post.actions";
import { useUploadThing } from "@/lib/uploadthing";

interface Props {
  userId: string;
}

function MakePost({ userId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { organization } = useOrganization();
  const { startUpload } = useUploadThing("postImage");

  const [files, setFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const form = useForm<z.infer<typeof PostValidation>>({
    resolver: zodResolver(PostValidation) as Resolver<
      z.output<typeof PostValidation>
    >,
    defaultValues: {
      post: "",
      accountId: userId,
      images: [],
    },
  });

  const handleImage = (
    e: ChangeEvent<HTMLInputElement>,
    fieldChange: (value: string[]) => void,
  ) => {
    e.preventDefault();

    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);

      // Limit to 4 images total
      if (files.length + newFiles.length > 4) {
        alert("You can only upload up to 4 images");
        return;
      }

      setFiles([...files, ...newFiles]);

      // Create previews
      newFiles.forEach((file) => {
        if (!file.type.includes("image")) return;

        const fileReader = new FileReader();
        fileReader.onload = (event) => {
          const imageDataUrl = event.target?.result?.toString() || "";
          setImagePreviews((prev) => [...prev, imageDataUrl]);
        };
        fileReader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (
    index: number,
    fieldChange: (value: string[]) => void,
  ) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);

    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const onSubmit = async (values: z.infer<typeof PostValidation>) => {
    let uploadedImageUrls: string[] = [];

    // Upload images if any
    if (files.length > 0) {
      const imgRes = await startUpload(files);
      if (imgRes) {
        uploadedImageUrls = imgRes.map((res) => res.ufsUrl);
      }
    }

    await createPost({
      text: values.post,
      author: userId,
      communityId: organization ? organization.id : null,
      path: pathname,
      images: uploadedImageUrls, // Pass images to action
    });

    router.push("/");
  };

  return (
    <Form {...form}>
      <form
        className="mt-10 flex flex-col gap-6"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="post"
          render={({ field }) => (
            <FormItem className="flex w-full flex-col gap-3">
              <FormLabel className="text-base-semibold text-light-2">
                Content
              </FormLabel>

              <FormControl>
                <>
                  {/* Textarea + Attachment Icon Wrapper */}
                  <div className="relative w-full">
                    <Textarea
                      {...field}
                      placeholder="What's on your mind?"
                      className="pr-12 min-h-35 resize-none no-focus border border-dark-4 bg-dark-3 text-light-1 outline-none"
                    />

                    {/* Attachment Icon */}
                    {files.length < 4 && (
                      <button
                        type="button"
                        onClick={() =>
                          document.getElementById("post-image-upload")?.click()
                        }
                        className="absolute right-3 bottom-3 text-light-2 hover:text-primary-500 transition"
                      >
                        <Paperclip size={18} />
                      </button>
                    )}

                    {/* Hidden File Input */}
                    <input
                      id="post-image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleImage(e, () => {})}
                    />
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <Image
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            width={100}
                            height={100}
                            className="rounded-lg object-cover w-full h-24"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index, () => {})}
                            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} className="text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="bg-primary-500">
          Make Post
        </Button>
      </form>
    </Form>
  );
}

export default MakePost;
