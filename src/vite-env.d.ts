/// <reference types="vite/client" />
/// <reference types="@webgpu/types" />

declare module "*.wgsl" {
  const source: { readonly version: 1; readonly wgsl: string };
  export default source;
}
