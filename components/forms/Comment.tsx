"use client";

import { z } from "zod";
import Image from "next/image";
import { Resolver, useForm } from "react-hook-form";
import { usePathname } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, ChangeEvent, useRef } from "react";
import { Paperclip, X } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

import { Button } from "../ui/button";

import { CommentValidation } from "@/lib/validations/post";
import { addCommentToPost } from "@/lib/actions/post.actions";
import { useUploadThing } from "@/lib/uploadthing";
import { Textarea } from "../ui/textarea";

interface Props {
  postId: string;
  currentUserImg: string;
  currentUserId: string;
}

function Comment({ postId, currentUserImg, currentUserId }: Props) {
  const pathname = usePathname();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const { startUpload } = useUploadThing("postImage");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const form = useForm<z.infer<typeof CommentValidation>>({
    resolver: zodResolver(CommentValidation) as Resolver<
      z.output<typeof CommentValidation>
    >,
    defaultValues: {
      post: "",
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

  const removeImage = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);

    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const onSubmit = async (values: z.infer<typeof CommentValidation>) => {
    setIsSubmitting(true);

    try {
      let uploadedImageUrls: string[] = [];

      // Upload images if any
      if (files.length > 0) {
        const imgRes = await startUpload(files);
        if (imgRes) {
          uploadedImageUrls = imgRes.map((res) => res.ufsUrl);
        }
      }

      await addCommentToPost({
        postId,
        commentText: values.post,
        userId: JSON.parse(currentUserId),
        path: pathname,
        images: uploadedImageUrls,
      });

      form.reset();
      setFiles([]);
      setImagePreviews([]);
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Form {...form}>
      <form
        className="comment-form flex flex-col gap-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem className="flex w-full gap-3">
              <FormLabel>
                <Image
                  src={currentUserImg}
                  alt="current_user"
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
              </FormLabel>

              <div className="flex flex-col w-full gap-3">
                <FormControl>
                  <>
                    {/* Textarea + Icon Wrapper */}
                    <div className="relative w-full">
                      <Textarea
                        {...field}
                        placeholder="Comment..."
                        className="pr-12 min-h-25 resize-none no-focus text-light-1 outline-none"
                        disabled={isSubmitting}
                      />

                      {/* Attachment Icon */}
                      <button
                        type="button"
                        onClick={triggerFileInput}
                        className="absolute right-3 bottom-3 text-light-2 hover:text-primary-500 transition"
                        disabled={isSubmitting}
                      >
                        <Paperclip size={18} />
                      </button>

                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleImage(e, field.onChange)}
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
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              disabled={isSubmitting}
                            >
                              <X size={14} className="text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                </FormControl>
              </div>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="comment-form_btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Replying..." : "Reply"}
        </Button>
      </form>
    </Form>
  );
}

export default Comment;
