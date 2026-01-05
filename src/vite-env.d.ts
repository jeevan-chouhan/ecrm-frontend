/// <reference types="vite/client" />

// Environment variables type definition
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // Add more env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// SVG imports as React components
declare module "*.svg?react" {
  import * as React from "react";
  const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;
  export default ReactComponent;
}

// SVG imports as URL
declare module "*.svg" {
  const src: string;
  export default src;
}

