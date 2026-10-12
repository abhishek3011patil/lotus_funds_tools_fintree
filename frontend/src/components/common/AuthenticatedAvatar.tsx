import { useEffect, useState } from "react";
import Avatar, { type AvatarProps } from "@mui/material/Avatar";

type Props = Omit<AvatarProps, "src"> & {
  filename?: string | null;
};

export default function AuthenticatedAvatar({ filename, ...props }: Props) {
  const [loaded, setLoaded] = useState<{ filename: string; src: string }>();

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | undefined;
    if (!filename) return () => controller.abort();

    const basename = filename.split(/[\\/]/).pop();
    if (!basename) return () => controller.abort();
    fetch(`${import.meta.env.VITE_API_URL || ""}/uploads/${encodeURIComponent(basename)}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Image unavailable");
        objectUrl = URL.createObjectURL(await response.blob());
        if (!controller.signal.aborted) setLoaded({ filename, src: objectUrl });
      })
      .catch(() => {});

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [filename]);

  return <Avatar {...props} src={loaded?.filename === filename ? loaded.src : undefined} />;
}
