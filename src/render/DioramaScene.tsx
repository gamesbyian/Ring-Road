import type { ReactNode } from "react";
import { DIORAMA_ASSETS } from "../assets/diorama/manifest";

interface DioramaSceneProps {
  title: ReactNode;
  board: ReactNode;
  controls: ReactNode;
  status: ReactNode;
  navigation: ReactNode;
}

interface ScenicPictureProps {
  role: "backdrop" | "rearArchitecture" | "foreground";
  className: string;
  fetchPriority?: "high" | "auto";
}

function ScenicPicture({ role, className, fetchPriority = "auto" }: ScenicPictureProps) {
  const desktop = DIORAMA_ASSETS.desktop[role];
  const mobile = DIORAMA_ASSETS.mobile[role];

  return (
    <picture className={className} aria-hidden="true">
      <source media="(max-width: 720px)" srcSet={mobile.src} />
      <img
        src={desktop.src}
        width={desktop.width}
        height={desktop.height}
        alt=""
        loading="eager"
        decoding="async"
        fetchPriority={fetchPriority}
        draggable={false}
        data-mobile-src={mobile.src}
        data-desktop-src={desktop.src}
      />
    </picture>
  );
}

export function DioramaScene({ title, board, controls, status, navigation }: DioramaSceneProps) {
  return (
    <section className="diorama-scene" aria-label="Ring Road play area">
      <div className="scene-backdrop" aria-hidden="true">
        <ScenicPicture role="backdrop" className="scene-art scene-art-backdrop" fetchPriority="high" />
        <ScenicPicture role="rearArchitecture" className="scene-art scene-art-rear" />
      </div>

      <div className="scene-title-slot">{title}</div>

      <div className="scene-play-plane">
        <div className="scene-board-slot">
          <div className="scene-board-plinth" aria-hidden="true" />
          {board}
          <div className="scene-status-slot">{status}</div>
        </div>

        <div className="scene-controls-slot">
          {controls}
        </div>
      </div>

      <div className="scene-navigation-slot">{navigation}</div>

      <div className="scene-foreground" aria-hidden="true">
        <ScenicPicture role="foreground" className="scene-art scene-art-foreground" />
      </div>
    </section>
  );
}
