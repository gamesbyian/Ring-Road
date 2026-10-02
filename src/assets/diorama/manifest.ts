import desktopBackdrop from "./desktop/backdrop.svg";
import desktopRearArchitecture from "./desktop/rear-architecture.svg";
import desktopForeground from "./desktop/foreground.svg";
import parchmentGrain from "./textures/parchment-grain.png";
import stoneGrain from "./textures/stone-grain.png";
import paintGrain from "./textures/paint-grain.png";

export type DioramaAssetRole = "backdrop" | "rear-architecture" | "foreground";
export type DioramaAssetVariant = "desktop";
export type DioramaTextureRole = "parchment-grain" | "stone-grain" | "paint-grain";

export interface DioramaAsset {
  readonly role: DioramaAssetRole;
  readonly variant: DioramaAssetVariant;
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly format: "svg";
  readonly critical: true;
  readonly loading: "eager";
  readonly provenance: "authored-in-repo";
}

export const DIORAMA_ASSETS = {
  desktop: {
    backdrop: {
      role: "backdrop",
      variant: "desktop",
      src: desktopBackdrop,
      width: 1440,
      height: 1000,
      format: "svg",
      critical: true,
      loading: "eager",
      provenance: "authored-in-repo",
    },
    rearArchitecture: {
      role: "rear-architecture",
      variant: "desktop",
      src: desktopRearArchitecture,
      width: 1180,
      height: 420,
      format: "svg",
      critical: true,
      loading: "eager",
      provenance: "authored-in-repo",
    },
    foreground: {
      role: "foreground",
      variant: "desktop",
      src: desktopForeground,
      width: 1440,
      height: 220,
      format: "svg",
      critical: true,
      loading: "eager",
      provenance: "authored-in-repo",
    },
  },
} as const satisfies Record<DioramaAssetVariant, Record<string, DioramaAsset>>;

export interface DioramaTexture {
  readonly role: DioramaTextureRole;
  readonly src: string;
  readonly width: 64;
  readonly height: 64;
  readonly format: "png";
  readonly provenance: "authored-in-repo";
}

export const DIORAMA_TEXTURES = {
  parchment: {
    role: "parchment-grain",
    src: parchmentGrain,
    width: 64,
    height: 64,
    format: "png",
    provenance: "authored-in-repo",
  },
  stone: {
    role: "stone-grain",
    src: stoneGrain,
    width: 64,
    height: 64,
    format: "png",
    provenance: "authored-in-repo",
  },
  paint: {
    role: "paint-grain",
    src: paintGrain,
    width: 64,
    height: 64,
    format: "png",
    provenance: "authored-in-repo",
  },
} as const satisfies Record<string, DioramaTexture>;
