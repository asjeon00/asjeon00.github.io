# vgpu · WebGPU 3D Hero & Pipeline DAG Recreation

Recreation of the interactive 3D hero section and WebGPU pipeline DAG debugger from [vgpu.sh](https://vgpu.sh).

## Features

- **3D Procedural Glass Prism**: Extruded triangle with 0.8mm filleted bevels, Snell's law refraction, internal caustics, and Cauchy spectral dispersion (64 wavelengths).
- **Architectural Studio Wall (Light Mode)**: 
  - 512×512 baked procedural plaster noise texture (`wall-material`)
  - 768×512 photographic incident light mask (`wall-global-light-mask.webp`)
  - Tangent micro-normals and roughness derived from plaster height differentials
  - Geometric cast shadow and contact ambient occlusion beneath the prism base
  - Real-time rainbow dispersion modulating the wall plaster grain
- **Deep Space Void (Dark Mode)**:
  - 2,200 volumetric floating dust particles
  - 5-tier separable bloom blur passes
  - Infinite black void (`#000000`)
- **WebGPU Pipeline DAG Debugger (`?debug`)**:
  - Full ReactFlow DAG visualization with live WebGPU parameter sliders, color pickers, and dropdowns
  - Real-time uniform buffer updates and live GPU texture previews
  - Pan, zoom, and draggable node positioning
  - Quality preference toggles (`Auto`, `High`, `Low`) and Theme switcher (`Auto`, `Light`, `Dark`)
  - Copy modified parameter diffs and pop-out window support

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### URLs
- Hero landing view: `http://localhost:5173/`
- WebGPU Pipeline DAG inspector: `http://localhost:5173/?debug`
