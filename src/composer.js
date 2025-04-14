import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { DotScreenShader } from 'three/examples/jsm/shaders/DotScreenShader.js';

const BrightnessShader = {
  uniforms: {
    tDiffuse: { value: null },
    brightness: { value: 1.0 }, // 1 = normal, >1 = brighter, <1 = darker
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float brightness;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      color.rgb *= brightness;
      gl_FragColor = color;
    }
  `
};

const PixelationShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2() },
    pixelSize: { value: 3.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float pixelSize;
    varying vec2 vUv;
    void main() {
      vec2 dxy = pixelSize / resolution;
      vec2 coord = dxy * floor(vUv / dxy);
      gl_FragColor = texture2D(tDiffuse, coord);
    }
  `
};

const NoiseShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0.0 },
    amount: { value: 0.03 }, // noise intensity
    scale: { value: 2.0 },   // noise scale/size
    speed: { value: 1.0 },   // noise speed
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float amount;
    uniform float scale;
    uniform float speed;
    varying vec2 vUv;

    float random(vec2 co) {
      return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }

    void main() {
      vec2 scaledUV = vUv * scale; // Apply scale to UV coordinates
      float noise = random(scaledUV * speed + time); // Apply speed and time
      vec4 color = texture2D(tDiffuse, vUv);
      color.rgb += amount * (noise - 0.5);
      gl_FragColor = color;
    }
  `
};


const GrayscaleShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 1.0 }, // 1 = full grayscale, 0 = full color
    brightness: { value: 2.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    uniform float brightness;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      vec3 grayscale = vec3(gray) * brightness;
      gl_FragColor = vec4(mix(color.rgb, grayscale, amount), color.a);
    }
  `
};


const ToonShaderBW = {
  uniforms: {
    tDiffuse: { value: null },
    levels: { value: 3.0 } // number of shading steps (e.g. 3 or 4 bands)
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float levels;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float intensity = dot(color.rgb, vec3(0.299, 0.587, 0.114)); // perceived brightness
      float stepped = floor(intensity * levels) / (levels - 1.0);
      vec3 toon = vec3(stepped);
      gl_FragColor = vec4(toon, color.a);
    }
  `
};
const ToonShader = {
  uniforms: {
    tDiffuse: { value: null },
    levels: { value: 4.0 } // how many color bands
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float levels;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      // Quantize each RGB channel separately
      vec3 toon = floor(color.rgb * levels) / levels;
      gl_FragColor = vec4(toon, color.a);
    }
  `
};


export function setupPostProcessing(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const pixelPass = new ShaderPass(PixelationShader);
  pixelPass.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
  composer.addPass(pixelPass);

  const noisePass = new ShaderPass(NoiseShader);
  composer.addPass(noisePass);

  const greyPass = new ShaderPass(GrayscaleShader)
  greyPass.uniforms.amount.value = 1.0;
  composer.addPass(greyPass)

  const dotScreenPass = new ShaderPass(DotScreenShader);
  dotScreenPass.uniforms['scale'].value = 1;     // dot size
  dotScreenPass.uniforms['angle'].value = Math.PI / 4; // 45 degrees
  composer.addPass(dotScreenPass);

  const toonPass = new ShaderPass(ToonShader);
  //const toonPass = new ShaderPass(ToonShaderBW);
  toonPass.uniforms.levels.value = 4.0; // play with this: 2–5 looks good
  composer.addPass(toonPass);

  const brightnessPass = new ShaderPass(BrightnessShader);
  brightnessPass.uniforms.brightness.value = 1.5; // Adjust as needed
  composer.addPass(brightnessPass);

  return { composer, pixelPass, noisePass, greyPass, dotScreenPass, toonPass, brightnessPass};
}
