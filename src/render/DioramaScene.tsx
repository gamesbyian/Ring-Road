import type { ReactNode } from "react";

interface DioramaSceneProps {
  title: ReactNode;
  board: ReactNode;
  controls: ReactNode;
  status: ReactNode;
  navigation: ReactNode;
}

export function DioramaScene({ title, board, controls, status, navigation }: DioramaSceneProps) {
  return (
    <section className="diorama-scene" aria-label="Ring Road play area">
      <div className="scene-backdrop" aria-hidden="true">
        <div className="scene-sky" />
        <div className="scene-horizon" />
        <div className="scene-rear-architecture">
          <span className="scene-tower scene-tower-left" />
          <span className="scene-arch" />
          <span className="scene-tower scene-tower-right" />
        </div>
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
        <div className="scene-step scene-step-back" />
        <div className="scene-step scene-step-front" />
      </div>
    </section>
  );
}
