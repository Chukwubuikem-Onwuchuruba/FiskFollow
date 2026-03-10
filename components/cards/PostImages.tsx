"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Props {
  images: string[];
}

export default function PostImages({ images }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prev = () =>
    setLightboxIndex((i) => (i! > 0 ? i! - 1 : images.length - 1));
  const next = () =>
    setLightboxIndex((i) => (i! < images.length - 1 ? i! + 1 : 0));

  // Single image — just show it clickable
  if (images.length === 1) {
    return (
      <>
        <div
          className="relative w-full aspect-square mt-3 cursor-zoom-in"
          onClick={() => openLightbox(0)}
        >
          <Image
            src={images[0]}
            alt="Post image"
            fill
            className="rounded-lg object-cover"
          />
        </div>

        {lightboxIndex !== null && (
          <Lightbox
            images={images}
            index={lightboxIndex}
            onClose={closeLightbox}
            onPrev={prev}
            onNext={next}
          />
        )}
      </>
    );
  }

  // Multiple images — carousel
  return (
    <>
      <div className="mt-3 w-full">
        <Carousel opts={{ loop: true }} className="w-full">
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={index}>
                <div
                  className="relative w-full aspect-square cursor-zoom-in"
                  onClick={() => openLightbox(index)}
                >
                  <Image
                    src={image}
                    alt={`Post image ${index + 1}`}
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-2">
          {images.map((_, index) => (
            <div
              key={index}
              className="w-1.5 h-1.5 rounded-full bg-gray-1 opacity-60"
            />
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prev}
          onNext={next}
        />
      )}
    </>
  );
}

function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition cursor-pointer"
        onClick={onClose}
      >
        <X className="w-8 h-8" />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <p className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-small-regular">
          {index + 1} / {images.length}
        </p>
      )}

      {/* Image */}
      <div
        className="relative w-full max-w-3xl max-h-[85vh] aspect-square mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[index]}
          alt={`Image ${index + 1}`}
          fill
          className="object-contain"
        />
      </div>

      {/* Prev/Next buttons */}
      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 text-white hover:text-gray-300 transition cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          <button
            className="absolute right-4 text-white hover:text-gray-300 transition cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
          >
            <ChevronRight className="w-10 h-10" />
          </button>
        </>
      )}
    </div>
  );
}
