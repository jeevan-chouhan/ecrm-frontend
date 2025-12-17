/// <reference types="vite/client" />

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

