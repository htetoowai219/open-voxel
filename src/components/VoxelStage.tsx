import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type {
  VoxelAnimationClip,
  VoxelComment,
  VoxelUnitDefinition,
} from '../types/voxel';
import { VoxelSceneRig } from '../engine/voxelScene';
import type { Theme } from '../utils/theme';
import { cn } from '../utils/cn';

interface VoxelStageProps {
  unit: VoxelUnitDefinition;
  clip: VoxelAnimationClip;
  params: Record<string, number>;
  frame: number;
  visibility: Record<string, boolean>;
  selectedPartId: string | null;
  onSelectPart: (partId: string | null) => void;
  showPivots: boolean;
  wireframe: boolean;
  theme: Theme;
  comments: VoxelComment[];
  className?: string;
}

export function VoxelStage({
  unit,
  clip,
  params,
  frame,
  visibility,
  selectedPartId,
  onSelectPart,
  showPivots,
  wireframe,
  theme,
  comments,
  className,
}: VoxelStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const rigRef = useRef<VoxelSceneRig | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const onSelectRef = useRef(onSelectPart);
  onSelectRef.current = onSelectPart;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = 'block h-full w-full';
    host.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const rig = new VoxelSceneRig(unit, {
      mode: 'standard',
      showPivots,
      wireframe,
    });
    rigRef.current = rig;

    const gridColors =
      theme === 'dark'
        ? { major: 0x52525b, minor: 0x27272a }
        : { major: 0x9ca3af, minor: 0xd4d4d8 };
    const grid = new THREE.GridHelper(80, 80, gridColors.major, gridColors.minor);
    const gridMaterial = grid.material as THREE.Material;
    gridMaterial.transparent = true;
    gridMaterial.opacity = theme === 'dark' ? 0.5 : 0.58;
    rig.scene.add(grid);

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    rig.bounds.getSize(size);
    rig.bounds.getCenter(center);
    const maxSpan = Math.max(size.x, size.y, size.z, 8);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 1000);
    camera.position.set(
      center.x + maxSpan * 1.35,
      center.y + maxSpan * 0.9,
      center.z + maxSpan * 1.7,
    );
    camera.lookAt(center);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(center);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = maxSpan * 0.8;
    controls.maxDistance = maxSpan * 5;
    controls.maxPolarAngle = Math.PI * 0.88;
    controls.update();

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

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pointerDown = { x: 0, y: 0 };
    const onPointerDown = (event: PointerEvent) => {
      pointerDown.x = event.clientX;
      pointerDown.y = event.clientY;
    };
    const onPointerUp = (event: PointerEvent) => {
      const distance = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
      if (distance > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(rig.getSelectableMeshes(), false);
      const first = hits[0];
      if (!first) {
        onSelectRef.current(null);
        return;
      }
      const partId = first.object.userData.partId;
      onSelectRef.current(typeof partId === 'string' ? partId : null);
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    let raf = 0;
    const tick = () => {
      controls.update();
      renderer.render(rig.scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      rig.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      rigRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
    };
  }, [unit, theme]);

  useEffect(() => {
    rigRef.current?.setWireframe(wireframe);
  }, [wireframe]);

  useEffect(() => {
    rigRef.current?.setPivotsVisible(showPivots);
  }, [showPivots]);

  useEffect(() => {
    rigRef.current?.setSelectedPart(selectedPartId);
  }, [selectedPartId, unit, theme]);

  useEffect(() => {
    rigRef.current?.apply(clip, frame, params, visibility);
  }, [clip, frame, params, visibility, unit, theme]);

  useEffect(() => {
    rigRef.current?.setCommentPins(comments, clip.id, frame);
  }, [comments, clip.id, frame, theme]);

  return (
    <div
      ref={hostRef}
      className={cn('stage-dots relative h-full w-full overflow-hidden', className)}
      aria-label="Interactive 3D voxel stage"
    />
  );
}
