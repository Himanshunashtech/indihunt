"use client";

import Image from "next/image";
import React, { useState } from "react";

interface OptimizedImgProps {
  src: string | undefined | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  /** If true, uses fill layout (parent must be position:relative) */
  fill?: boolean;
  /** Quality 1-100, default 75 */
  quality?: number;
  sizes?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  onError?: () => void;
  decoding?: "async" | "auto" | "sync";
}

/**
 * Drop-in replacement for raw <Image> tags.
 * Proxies external images through Next.js image optimizer (/_next/image)
 * which auto-converts to WebP/AVIF, resizes, and caches with CDN headers.
 *
 * Usage:
 *   <OptimizedImg src={url} alt="desc" width={48} height={48} className="..." />
 *   // or for fill mode (parent needs relative positioning):
 *   <OptimizedImg src={url} alt="desc" fill className="object-cover" />
 */
export default function OptimizedImg({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  quality = 75,
  sizes,
  style,
  onClick,
  onError: onErrorProp,
}: OptimizedImgProps) {
  const [hasError, setHasError] = useState(false);

  // Fallback for missing or broken images
  if (!src || hasError) {
    const initials = alt?.charAt(0)?.toUpperCase() || "?";
    return (
      <div
        className={`flex items-center justify-center bg-muted text-muted-foreground font-semibold ${className || ""}`}
        style={{
          width: fill ? "100%" : width,
          height: fill ? "100%" : height,
          ...style,
        }}
        onClick={onClick}
      >
        {initials}
      </div>
    );
  }

  const handleError = () => {
    setHasError(true);
    onErrorProp?.();
  };

  // Determine default sizes for responsive loading
  const defaultSizes = sizes || (fill ? "(max-width: 768px) 100vw, 50vw" : undefined);

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        quality={quality}
        className={className}
        sizes={defaultSizes}
        priority={priority}
        style={{ objectFit: "cover", ...style }}
        onError={handleError}
        onClick={onClick}
        unoptimized={src.startsWith("data:") || src.startsWith("blob:")}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 48}
      height={height || 48}
      quality={quality}
      className={className}
      sizes={defaultSizes}
      priority={priority}
      style={style}
      onError={handleError}
      onClick={onClick}
      unoptimized={src.startsWith("data:") || src.startsWith("blob:")}
    />
  );
}
