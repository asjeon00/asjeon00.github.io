import { useEffect } from 'react'
import { useControls, folder, button, Leva } from 'leva'
import type { GradientControls, PrismControls, WindControls } from '../prism/types'
import {
  DEFAULT_GRADIENT_CONTROLS,
  DEFAULT_PRISM_CONTROLS,
  DEFAULT_WIND_CONTROLS,
  DEFAULT_CAMERA_PITCH_DEGREES,
  DEFAULT_CAMERA_YAW_DEGREES,
  CAMERA_FOV_DEGREES,
} from '../prism/types'
import { globalPaperController } from '../prism/pipelines/light/passes/paper/paper-controller'

export interface PrismLevaPanelProps {
  readonly onControlsChange: (controls: Partial<PrismControls>) => void
  readonly isVisible?: boolean
}

export function PrismLevaPanel({ onControlsChange, isVisible = true }: PrismLevaPanelProps) {
  const [controls, set] = useControls(() => ({
    '🎥 Camera Controls': folder({
      enableCameraControls: {
        value: false,
        label: 'Access Camera Controls',
      },
      mouseOrbit: {
        value: true,
        label: 'Mouse Orbit Parallax',
        render: (get) => get('🎥 Camera Controls.enableCameraControls'),
      },
      cameraPitch: {
        value: DEFAULT_CAMERA_PITCH_DEGREES,
        min: -50,
        max: 50,
        step: 1,
        label: 'Overlooking Tilt (°)',
        render: (get) => get('🎥 Camera Controls.enableCameraControls'),
      },
      cameraYaw: {
        value: DEFAULT_CAMERA_YAW_DEGREES,
        min: -90,
        max: 90,
        step: 1,
        label: 'Camera Yaw (°)',
        render: (get) => get('🎥 Camera Controls.enableCameraControls'),
      },
      cameraFov: {
        value: CAMERA_FOV_DEGREES,
        min: 20,
        max: 85,
        step: 1,
        label: 'Field of View (°)',
        render: (get) => get('🎥 Camera Controls.enableCameraControls'),
      },
      'Reset Camera': button(() => {
        set({
          cameraPitch: DEFAULT_CAMERA_PITCH_DEGREES,
          cameraYaw: DEFAULT_CAMERA_YAW_DEGREES,
          cameraFov: CAMERA_FOV_DEGREES,
          mouseOrbit: true,
        })
      }),
    }),

    '🎋 Baduk Board': folder({
      gridSpacing: {
        value: DEFAULT_GRADIENT_CONTROLS.gridSpacing,
        min: 0.15,
        max: 0.65,
        step: 0.01,
        label: 'Grid Spacing',
      },
      gridLineWidth: {
        value: DEFAULT_GRADIENT_CONTROLS.gridLineWidth,
        min: 0.0005,
        max: 0.006,
        step: 0.0001,
        label: 'Line Width',
      },
      gridOpacity: {
        value: DEFAULT_GRADIENT_CONTROLS.gridOpacity,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Grid & Star Points',
      },
      boardOffsetX: {
        value: DEFAULT_GRADIENT_CONTROLS.boardOffsetX,
        min: -3.0,
        max: 3.0,
        step: 0.05,
        label: 'Board Left Shift',
      },
    }),

    '📜 Fine Art Paper (Under Beads)': folder({
      'Slide Paper In/Out': button(() => {
        globalPaperController.toggle();
      }),
      paperGrain: {
        value: 0.75,
        min: 0.0,
        max: 2.0,
        step: 0.05,
        label: 'Pulp Grain',
        onChange: (v) => globalPaperController.setControls({ grain: v }),
      },
      paperFiberScale: {
        value: 220.0,
        min: 50.0,
        max: 500.0,
        step: 10.0,
        label: 'Fiber Scale',
        onChange: (v) => globalPaperController.setControls({ fiberScale: v }),
      },
      paperRoughness: {
        value: 0.36,
        min: 0.0,
        max: 1.0,
        step: 0.02,
        label: 'Surface Relief',
        onChange: (v) => globalPaperController.setControls({ roughness: v }),
      },
      paperTranslucency: {
        value: 0.45,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        label: 'Translucency',
        onChange: (v) => globalPaperController.setControls({ translucency: v }),
      },
      paperWarmth: {
        value: 0.55,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        label: 'Ivory Warmth',
        onChange: (v) => globalPaperController.setControls({ warmth: v }),
      },
      paperWaveCurl: {
        value: 0.085,
        min: 0.0,
        max: 0.25,
        step: 0.005,
        label: 'Slide Wave Curl',
        onChange: (v) => globalPaperController.setControls({ waveCurl: v }),
      },
    }),

    'Polished Granite / Marble': folder({
      colorHighlight: {
        value: DEFAULT_GRADIENT_CONTROLS.colorHighlight,
        label: 'Marble Highlight',
      },
      colorMid: {
        value: DEFAULT_GRADIENT_CONTROLS.colorMid,
        label: 'Stone Midtone',
      },
      colorShadow: {
        value: DEFAULT_GRADIENT_CONTROLS.colorShadow,
        label: 'Deep Vein / Shade',
      },
      graniteScale: {
        value: DEFAULT_GRADIENT_CONTROLS.graniteScale,
        min: 0.3,
        max: 4.0,
        step: 0.1,
        label: 'Vein Scale',
      },
      graniteRoughness: {
        value: DEFAULT_GRADIENT_CONTROLS.graniteRoughness,
        min: 0.0,
        max: 1.0,
        step: 0.02,
        label: 'Mineral Noise',
      },
      graniteNormalStrength: {
        value: DEFAULT_GRADIENT_CONTROLS.graniteNormalStrength,
        min: 0.0,
        max: 0.5,
        step: 0.01,
        label: 'Polish Bump Depth',
      },
      spotCenterX: {
        value: DEFAULT_GRADIENT_CONTROLS.spotCenterX,
        min: -1.5,
        max: 1.5,
        step: 0.01,
        label: 'Spot Center X',
      },
      spotCenterY: {
        value: DEFAULT_GRADIENT_CONTROLS.spotCenterY,
        min: -1.5,
        max: 1.5,
        step: 0.01,
        label: 'Spot Center Y',
      },
      spotRadius: {
        value: DEFAULT_GRADIENT_CONTROLS.spotRadius,
        min: 0.1,
        max: 3.0,
        step: 0.05,
        label: 'Spot Radius',
      },
      spotGlow: {
        value: DEFAULT_GRADIENT_CONTROLS.spotGlow,
        min: 0.2,
        max: 5.0,
        step: 0.1,
        label: 'Spot Glow Rate',
      },
      darkFalloffStart: {
        value: DEFAULT_GRADIENT_CONTROLS.darkFalloffStart,
        min: -1.0,
        max: 3.0,
        step: 0.05,
        label: 'Dark Falloff Start',
      },
      darkFalloffEnd: {
        value: DEFAULT_GRADIENT_CONTROLS.darkFalloffEnd,
        min: -3.0,
        max: 1.0,
        step: 0.05,
        label: 'Dark Falloff End',
      },
      vignette: {
        value: DEFAULT_GRADIENT_CONTROLS.vignette,
        min: 0.1,
        max: 2.0,
        step: 0.05,
        label: 'Vignette Radius',
      },
    }),

    'Lighting & Exposure': folder({
      directExposure: {
        value: DEFAULT_GRADIENT_CONTROLS.directExposure,
        min: 0.1,
        max: 3.0,
        step: 0.05,
        label: 'Direct Exposure',
      },
      lightmapMix: {
        value: DEFAULT_GRADIENT_CONTROLS.lightmapMix,
        min: 0.0,
        max: 1.0,
        step: 0.02,
        label: 'Lightmap Influence',
      },
      ambientFill: {
        value: DEFAULT_PRISM_CONTROLS.lightMode.wall.ambientFill,
        min: 0.0,
        max: 2.0,
        step: 0.02,
        label: 'Ambient Fill',
      },
      wallNormalStrength: {
        value: DEFAULT_PRISM_CONTROLS.lightMode.wall.normalStrength,
        min: 0.0,
        max: 2.0,
        step: 0.05,
        label: 'Wall Normal Mult',
      },
    }),

    '🍃 Wind & Leaf Shadows': folder({
      windEnabled: {
        value: DEFAULT_WIND_CONTROLS.enabled,
        label: 'Wind Active',
      },
      windSpeed: {
        value: DEFAULT_WIND_CONTROLS.speed,
        min: 0.1,
        max: 2.0,
        step: 0.05,
        label: 'Wind Speed',
      },
      windStrength: {
        value: DEFAULT_WIND_CONTROLS.strength,
        min: 0.0,
        max: 1.5,
        step: 0.05,
        label: 'Branch Sway Amp',
      },
      rustleFreq: {
        value: DEFAULT_WIND_CONTROLS.rustleFreq,
        min: 0.2,
        max: 3.0,
        step: 0.1,
        label: 'Leaf Deflection',
      },
      leafShadowStrength: {
        value: DEFAULT_WIND_CONTROLS.leafShadowStrength,
        min: 0.0,
        max: 1.0,
        step: 0.02,
        label: 'Shadow Depth',
      },
      leafShimmer: {
        value: DEFAULT_WIND_CONTROLS.leafShimmer,
        min: 0.0,
        max: 1.0,
        step: 0.02,
        label: 'Sun Shimmer',
      },
    }),

    '🔮 Crystal Glass Go Stones': folder({
      glassIor: {
        value: DEFAULT_PRISM_CONTROLS.glass.transmission.light.ior,
        min: 1.0,
        max: 2.5,
        step: 0.005,
        label: 'Index of Refraction',
      },
      reflectionStrength: {
        value: DEFAULT_PRISM_CONTROLS.glass.reflection.light.reflectionStrength,
        min: 0.0,
        max: 6.0,
        step: 0.1,
        label: 'Stone Reflection',
      },
      beamOpacity: {
        value: DEFAULT_PRISM_CONTROLS.lightFade.beamOpacity,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        label: 'Beam Opacity',
      },
    }),

    Presets: folder({
      'Carrara Marble & Glass': button(() => {
        set({
          colorHighlight: '#dae2ef',
          colorMid: '#ffffff',
          colorShadow: '#838383',
          spotCenterX: 0.0,
          spotCenterY: 0.0,
          spotRadius: 1.35,
          spotGlow: 1.2,
          darkFalloffStart: 2.5,
          darkFalloffEnd: -2.5,
          vignette: 1.15,
          gridSpacing: 0.39,
          gridLineWidth: 0.0025,
          gridOpacity: 0.85,
          boardOffsetX: 0,
          graniteScale: 2.2,
          graniteRoughness: 0.25,
          graniteNormalStrength: 0.16,
          directExposure: 1.0,
          lightmapMix: 0.18,
          cameraPitch: -5,
          cameraYaw: 0,
          cameraFov: CAMERA_FOV_DEGREES,
          glassIor: 1.645,
          reflectionStrength: 3.0,
        })
      }),
      'Nero Marquina Baduk': button(() => {
        set({
          colorHighlight: '#5b6b82',
          colorMid: '#202733',
          colorShadow: '#070a0f',
          spotCenterX: -0.3,
          spotCenterY: 0.18,
          spotRadius: 1.1,
          spotGlow: 1.8,
          darkFalloffStart: 1.2,
          darkFalloffEnd: -0.7,
          vignette: 1.25,
          gridSpacing: 0.28,
          gridLineWidth: 0.0016,
          gridOpacity: 0.80,
          graniteScale: 2.6,
          graniteRoughness: 0.35,
          graniteNormalStrength: 0.20,
          directExposure: 1.15,
          lightmapMix: 0.12,
          cameraPitch: 28,
          cameraYaw: 0,
          cameraFov: CAMERA_FOV_DEGREES,
          glassIor: 1.68,
          reflectionStrength: 3.8,
        })
      }),
      'Imperial Green Jade': button(() => {
        set({
          colorHighlight: '#b9dec8',
          colorMid: '#2d5743',
          colorShadow: '#091c13',
          spotCenterX: -0.25,
          spotCenterY: 0.12,
          spotRadius: 1.25,
          spotGlow: 1.4,
          darkFalloffStart: 1.35,
          darkFalloffEnd: -0.7,
          vignette: 1.1,
          gridSpacing: 0.28,
          gridLineWidth: 0.0018,
          gridOpacity: 0.80,
          graniteScale: 2.0,
          graniteRoughness: 0.28,
          graniteNormalStrength: 0.17,
          directExposure: 1.05,
          lightmapMix: 0.15,
          cameraPitch: 25,
          cameraYaw: 0,
          cameraFov: CAMERA_FOV_DEGREES,
          glassIor: 1.65,
          reflectionStrength: 3.2,
        })
      }),
      'Spline Slate': button(() => {
        set({
          colorHighlight: '#d2daf0',
          colorMid: '#768396',
          colorShadow: '#121721',
          spotCenterX: -0.35,
          spotCenterY: 0.15,
          spotRadius: 1.0,
          spotGlow: 1.6,
          darkFalloffStart: 1.3,
          darkFalloffEnd: -0.65,
          vignette: 1.0,
          gridSpacing: 0.32,
          gridLineWidth: 0.0016,
          gridOpacity: 0.40,
          graniteScale: 1.8,
          graniteRoughness: 0.30,
          graniteNormalStrength: 0.12,
          directExposure: 1.0,
          lightmapMix: 0.15,
          cameraPitch: 26,
          cameraYaw: 0,
          cameraFov: CAMERA_FOV_DEGREES,
        })
      }),
      'Reset All': button(() => {
        set({
          cameraPitch: DEFAULT_CAMERA_PITCH_DEGREES,
          cameraYaw: DEFAULT_CAMERA_YAW_DEGREES,
          cameraFov: CAMERA_FOV_DEGREES,
          enableCameraControls: false,
          colorHighlight: DEFAULT_GRADIENT_CONTROLS.colorHighlight,
          colorMid: DEFAULT_GRADIENT_CONTROLS.colorMid,
          colorShadow: DEFAULT_GRADIENT_CONTROLS.colorShadow,
          spotCenterX: DEFAULT_GRADIENT_CONTROLS.spotCenterX,
          spotCenterY: DEFAULT_GRADIENT_CONTROLS.spotCenterY,
          spotRadius: DEFAULT_GRADIENT_CONTROLS.spotRadius,
          spotGlow: DEFAULT_GRADIENT_CONTROLS.spotGlow,
          darkFalloffStart: DEFAULT_GRADIENT_CONTROLS.darkFalloffStart,
          darkFalloffEnd: DEFAULT_GRADIENT_CONTROLS.darkFalloffEnd,
          vignette: DEFAULT_GRADIENT_CONTROLS.vignette,
          gridSpacing: DEFAULT_GRADIENT_CONTROLS.gridSpacing,
          gridLineWidth: DEFAULT_GRADIENT_CONTROLS.gridLineWidth,
          gridOpacity: DEFAULT_GRADIENT_CONTROLS.gridOpacity,
          graniteScale: DEFAULT_GRADIENT_CONTROLS.graniteScale,
          graniteRoughness: DEFAULT_GRADIENT_CONTROLS.graniteRoughness,
          graniteNormalStrength: DEFAULT_GRADIENT_CONTROLS.graniteNormalStrength,
          directExposure: DEFAULT_GRADIENT_CONTROLS.directExposure,
          lightmapMix: DEFAULT_GRADIENT_CONTROLS.lightmapMix,
          ambientFill: DEFAULT_PRISM_CONTROLS.lightMode.wall.ambientFill,
          wallNormalStrength: DEFAULT_PRISM_CONTROLS.lightMode.wall.normalStrength,
          glassIor: DEFAULT_PRISM_CONTROLS.glass.transmission.light.ior,
          reflectionStrength: DEFAULT_PRISM_CONTROLS.glass.reflection.light.reflectionStrength,
          beamOpacity: DEFAULT_PRISM_CONTROLS.lightFade.beamOpacity,
          windEnabled: DEFAULT_WIND_CONTROLS.enabled,
          windSpeed: DEFAULT_WIND_CONTROLS.speed,
          windStrength: DEFAULT_WIND_CONTROLS.strength,
          rustleFreq: DEFAULT_WIND_CONTROLS.rustleFreq,
          leafShadowStrength: DEFAULT_WIND_CONTROLS.leafShadowStrength,
          leafShimmer: DEFAULT_WIND_CONTROLS.leafShimmer,
        })
      }),
    }),
  }))

  useEffect(() => {
    const gradient: GradientControls = {
      colorHighlight: controls.colorHighlight,
      colorMid: controls.colorMid,
      colorShadow: controls.colorShadow,
      spotCenterX: controls.spotCenterX,
      spotCenterY: controls.spotCenterY,
      spotRadius: controls.spotRadius,
      spotGlow: controls.spotGlow,
      darkFalloffStart: controls.darkFalloffStart,
      darkFalloffEnd: controls.darkFalloffEnd,
      vignette: controls.vignette,
      gridSpacing: controls.gridSpacing,
      gridLineWidth: controls.gridLineWidth,
      gridOpacity: controls.gridOpacity,
      boardOffsetX: controls.boardOffsetX,
      graniteScale: controls.graniteScale,
      graniteRoughness: controls.graniteRoughness,
      graniteNormalStrength: controls.graniteNormalStrength,
      directExposure: controls.directExposure,
      lightmapMix: controls.lightmapMix,
    }

    const wind: WindControls = {
      enabled: controls.windEnabled,
      speed: controls.windSpeed,
      strength: controls.windStrength,
      rustleFreq: controls.rustleFreq,
      leafShadowStrength: controls.leafShadowStrength,
      leafShimmer: controls.leafShimmer,
    }

    onControlsChange({
      gradient,
      wind,
      cameraPitch: controls.enableCameraControls ? controls.cameraPitch : DEFAULT_CAMERA_PITCH_DEGREES,
      cameraYaw: controls.enableCameraControls ? controls.cameraYaw : DEFAULT_CAMERA_YAW_DEGREES,
      cameraFov: controls.enableCameraControls ? controls.cameraFov : CAMERA_FOV_DEGREES,
      cameraOrbitEnabled: controls.enableCameraControls && controls.mouseOrbit,
      wallColor: controls.colorShadow,
      lightMode: {
        ...DEFAULT_PRISM_CONTROLS.lightMode,
        wall: {
          ...DEFAULT_PRISM_CONTROLS.lightMode.wall,
          ambientFill: controls.ambientFill,
          normalStrength: controls.wallNormalStrength,
        },
      },
      glass: {
        ...DEFAULT_PRISM_CONTROLS.glass,
        transmission: {
          ...DEFAULT_PRISM_CONTROLS.glass.transmission,
          light: {
            ...DEFAULT_PRISM_CONTROLS.glass.transmission.light,
            ior: controls.glassIor,
          },
        },
        reflection: {
          ...DEFAULT_PRISM_CONTROLS.glass.reflection,
          light: {
            ...DEFAULT_PRISM_CONTROLS.glass.reflection.light,
            reflectionStrength: controls.reflectionStrength,
          },
        },
      },
      lightFade: {
        ...DEFAULT_PRISM_CONTROLS.lightFade,
        beamOpacity: controls.beamOpacity,
      },
    })
  }, [controls, onControlsChange])

  return (
    <Leva
      hidden={!isVisible}
      titleBar={{
        title: 'Baduk Marble Studio Controls',
        drag: true,
        filter: false,
      }}
      collapsed={false}
      theme={{
        colors: {
          elevation1: '#14171f',
          elevation2: '#1b202c',
          elevation3: '#262d3d',
          accent1: '#6366f1',
          accent2: '#4f46e5',
          accent3: '#4338ca',
          highlight1: '#ffffff',
          highlight2: '#cbd5e1',
          highlight3: '#94a3b8',
          vivid1: '#6366f1',
        },
        radii: {
          xs: '4px',
          sm: '6px',
          lg: '8px',
        },
      }}
    />
  )
}
