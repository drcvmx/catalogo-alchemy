import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Width for Supabase storage transform (thumbnail optimization) */
  transformWidth?: number;
  /** Height for Supabase storage transform */
  transformHeight?: number;
  /** Show skeleton placeholder while loading */
  showSkeleton?: boolean;
  /** Additional wrapper className */
  wrapperClassName?: string;
}

/**
 * Applies Supabase Storage image transforms for resizing on the CDN.
 * Only works for URLs from our Supabase storage bucket.
 */
function getTransformedUrl(src: string, width?: number, height?: number): string {
  if (!width && !height) return src;
  if (!src.includes('/storage/v1/object/public/')) return src;

  // Convert /object/public/ → /render/image/public/ and add transform params
  const transformed = src.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );

  const params = new URLSearchParams();
  if (width) params.set('width', String(width));
  if (height) params.set('height', String(height));
  params.set('resize', 'contain');
  params.set('quality', '80');

  const separator = transformed.includes('?') ? '&' : '?';
  return `${transformed}${separator}${params.toString()}`;
}

const OptimizedImage = ({
  src,
  alt,
  className,
  wrapperClassName,
  transformWidth,
  transformHeight,
  showSkeleton = true,
  loading = 'lazy',
  decoding = 'async',
  ...props
}: OptimizedImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const optimizedSrc = src ? getTransformedUrl(src, transformWidth, transformHeight) : '';

  // If the image is already cached by the browser, mark as loaded immediately
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [optimizedSrc]);

  if (!src || error) {
    return (
      <div className={cn('bg-muted flex items-center justify-center', wrapperClassName || className)}>
        <span className="text-[10px] text-muted-foreground">Sin imagen</span>
      </div>
    );
  }

  return (
    <div className={cn('relative', wrapperClassName)} style={props.style}>
      {/* Skeleton placeholder */}
      {showSkeleton && !loaded && (
        <div className={cn('absolute inset-0 animate-pulse bg-muted/60 z-10', className)} />
      )}
      <img
        ref={imgRef}
        src={optimizedSrc}
        alt={alt || ''}
        loading={loading}
        decoding={decoding as any}
        className={cn(
          'transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
