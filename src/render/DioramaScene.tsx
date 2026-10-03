import type { ReactNode } from "react";
import { DIORAMA_ASSETS } from "../assets/diorama/manifest";

interface DioramaSceneProps {
  title: ReactNode;
  board: ReactNode;
  controls: ReactNode;
  status: ReactNode;
  navigation: ReactNode;
  moves: ReactNode;
  goal: ReactNode;
  solution: ReactNode;
}

interface ScenicPictureProps {
  role: "backdrop" | "rearArchitecture" | "foreground";
  className: string;
  fetchPriority?: "high" | "auto";
}

function ScenicPicture({ role, className, fetchPriority = "auto" }: ScenicPictureProps) {
  const desktop = DIORAMA_ASSETS.desktop[role];
  return (
    <picture className={className} aria-hidden="true">
      <img
        src={desktop.src}
        width={desktop.width}
        height={desktop.height}
        alt=""
        loading="eager"
        decoding="async"
        fetchPriority={fetchPriority}
        draggable={false}
        data-desktop-src={desktop.src}
      />
    </picture>
  );
}

export function DioramaScene({ title, board, controls, status, navigation, moves, goal, solution }: DioramaSceneProps) {
  return (
    <section className="diorama-scene reference-first-scene" aria-label="Ring Road play area">
      <div className="reference-scene-matte" aria-hidden="true">
        <img
          src={DIORAMA_ASSETS.desktop.referenceSceneryMatte.src}
          width={DIORAMA_ASSETS.desktop.referenceSceneryMatte.width}
          height={DIORAMA_ASSETS.desktop.referenceSceneryMatte.height}
          alt=""
          decoding="async"
          draggable={false}
        />
      </div>
      <div className="reference-scene-props" aria-hidden="true">
        <span className="reference-tower reference-tower-left" />
        <span className="reference-tower reference-tower-right" />
        <span className="reference-banner reference-banner-left" />
        <span className="reference-banner reference-banner-right" />
        <span className="reference-tree reference-tree-a" />
        <span className="reference-tree reference-tree-b" />
        <span className="reference-tree reference-tree-c" />
        <span className="reference-crystal reference-crystal-a" />
        <span className="reference-crystal reference-crystal-b" />
        <span className="reference-waterfall reference-waterfall-left" />
        <span className="reference-waterfall reference-waterfall-right" />
      </div>
      <div className="scene-backdrop" aria-hidden="true">
        <ScenicPicture role="backdrop" className="scene-art scene-art-backdrop" fetchPriority="high" />
        <ScenicPicture role="rearArchitecture" className="scene-art scene-art-rear" />
      </div>

      <div className="scene-title-slot">{title}</div>

      <div className="scene-play-plane">
        <div className="scene-board-slot">
          <div className="reference-rear-road" aria-hidden="true" />
          <div className="scene-board-plinth" aria-hidden="true">
            <span className="arena-banner arena-banner-1" />
            <span className="arena-banner arena-banner-2" />
            <span className="arena-banner arena-banner-4" />
            <span className="arena-banner arena-banner-5" />
          </div>
          {board}
          <div className="reference-front-road" aria-hidden="true" />
          <div className="scene-status-slot">{status}</div>
        </div>

        <div className="scene-controls-slot">
          {controls}
        </div>
      </div>

      <div className="scene-navigation-slot">{navigation}</div>
      <div className="reference-moves-slot">{moves}</div>
      <div className="reference-goal-slot">{goal}</div>
      <div className="reference-solution-slot">{solution}</div>

      <div className="scene-foreground" aria-hidden="true">
        <ScenicPicture role="foreground" className="scene-art scene-art-foreground" />
      </div>
    </section>
  );
}
