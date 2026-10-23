import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { VfxCatalogEntry } from '../engine/vfxCatalog';
import { cn } from '../utils/cn';

interface VfxPreviewProps {
  entry: VfxCatalogEntry;
  className?: string;
}

const MAX_PARTICLES = 700;

export function VfxPreview({ entry, className }: VfxPreviewProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
    camera.position.set(14, 11, 18);
    camera.lookAt(0, 4.5, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = 'block h-full w-full';
    host.appendChild(renderer.domElement);

    const grid = new THREE.GridHelper(28, 28, 0x52525b, 0x3f3f46);
    const gridMaterial = grid.material as THREE.Material;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.28;
    grid.position.y = 0;
    scene.add(grid);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    const mesh = new THREE.InstancedMesh(geometry, material, MAX_PARTICLES);
    mesh.count = 0;
    mesh.frustumCulled = false;
    scene.add(mesh);

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const color = new THREE.Color();

    const resize = () => {
      const width = host.clientWidth || 1;
      const height = host.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let raf = 0;
    const started = performance.now();
    const renderLoop = (now: number) => {
      const elapsed = now - started;
      const progress = (elapsed % 1850) / 1850;
      const particles = entry.spawn(progress, 19);
      mesh.count = Math.min(particles.length, MAX_PARTICLES);
      for (let index = 0; index < mesh.count; index += 1) {
        const particle = particles[index];
        const size = (particle.size ?? 0.5) * (particle.opacity && particle.opacity <= 0.02 ? 0 : 1);
        position.set(particle.x, particle.y, particle.z);
        rotation.set(particle.rx ?? 0, particle.ry ?? 0, particle.rz ?? 0);
        quaternion.setFromEuler(rotation);
        scale.setScalar(size);
        matrix.compose(position, quaternion, scale);
        mesh.setMatrixAt(index, matrix);
        color.set(particle.color);
        mesh.setColorAt(index, color);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(renderLoop);
    };
    raf = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      geometry.dispose();
      material.dispose();
      grid.geometry.dispose();
      gridMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [entry]);

  return <div ref={hostRef} className={cn('relative overflow-hidden', className)} />;
}
