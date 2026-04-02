"use client";

import MuxPlayer from "@mux/mux-player-react";

type Props = {
  playbackId: string;
  title: string;
};

export function MuxVideoPlayer({ playbackId, title }: Props) {
  return (
    <MuxPlayer
      playbackId={playbackId}
      metadataVideoTitle={title}
      accentColor="rgb(59 130 246)"
      className="aspect-video w-full overflow-hidden rounded-lg bg-black"
    />
  );
}
