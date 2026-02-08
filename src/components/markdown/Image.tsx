import { memo } from "react";

export const Image = memo(function Image({
  src,
  alt,
}: {
  src?: string;
  alt?: string;
}) {
  return (
    <img
      src={src}
      alt={alt ?? ""}
      loading="lazy"
      className="max-w-full rounded-lg my-2"
    />
  );
});
