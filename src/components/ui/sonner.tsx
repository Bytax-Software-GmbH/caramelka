"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/** Toasts im Stil des Design Systems: Kakao-Grund, roségolder Titel. */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" strokeWidth={1.5} />,
        info: <InfoIcon className="size-4" strokeWidth={1.5} />,
        warning: <TriangleAlertIcon className="size-4" strokeWidth={1.5} />,
        error: <OctagonXIcon className="size-4" strokeWidth={1.5} />,
        loading: <Loader2Icon className="size-4 animate-spin" strokeWidth={1.5} />,
      }}
      style={
        {
          "--normal-bg": "var(--cocoa-800)",
          "--normal-text": "var(--cream-100)",
          "--normal-border": "transparent",
          "--border-radius": "var(--radius-sm)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
