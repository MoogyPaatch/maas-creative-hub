import { useState } from "react";
import { ImageOff } from "lucide-react";

interface Props {
  src: string;
  alt: string;
  className?: string;
}

const ImageWithFallback = ({ src, alt, className }: Props) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted/80 ${className || ""}`}>
        <ImageOff className="mb-2 h-8 w-8 text-muted-foreground/50" />
        <span className="text-xs text-muted-foreground">Visuel en cours de génération...</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
};

export default ImageWithFallback;
