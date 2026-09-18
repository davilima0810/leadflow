"use client";

import type { BrandImageDisplay } from "../types/flow";

type BrandImageProps = {
  className?: string;
  display: BrandImageDisplay;
  src: string | null;
};

export function BrandImage({ className = "", display, src }: BrandImageProps) {
  if (!src) {
    return null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      className={`brand-image ${className}`}
      data-display={display}
      src={src}
      onError={(event) => {
        event.currentTarget.hidden = true;
      }}
    />
  );
}
