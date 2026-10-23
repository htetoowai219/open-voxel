import * as THREE from 'three';
import type {
  VoxelAnimationClip,
  VoxelComment,
  VoxelPart,
  VoxelUnitDefinition,
  VoxelVfxParticle,
} from '../types/voxel';

export type SceneMaterialMode = 'standard' | 'toon';

export interface VoxelSceneOptions {
  mode?: SceneMaterialMode;
  wireframe?: boolean;
  showPivots?: boolean;
}

interface PartRuntime {
  part: VoxelPart;
  group: THREE.Group;
  mesh: THREE.InstancedMesh;
  material: THREE.MeshStandardMaterial | THREE.MeshToonMaterial;
  parentGroup: THREE.Group;
  basePosition: THREE.Vector3;
}

const MAX_VFX_PARTICLES = 900;

function createToonGradient(): THREE.DataTexture {
  const texture = new THREE.DataTexture(
    new Uint8Array([76, 150, 255]),
    3,
    1,
    THREE.RedFormat,
  );
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function partDepth(part: VoxelPart, map: Map<string, VoxelPart>, seen = new Set<string>()): number {
  if (!part.parentId || seen.has(part.id)) return 0;
  const parent = map.get(part.parentId);
  if (!parent) return 0;
  seen.add(part.id);
  return 1 + partDepth(parent, map, seen);
}

export class VoxelSceneRig {
  readonly scene = new THREE.Scene();
  readonly root = new THREE.Group();
  readonly bounds = new THREE.Box3();
  private readonly parts = new Map<string, PartRuntime>();
  private readonly partOrder: PartRuntime[] = [];
  private readonly pivotGroup = new THREE.Group();
  private readonly pinGroup = new THREE.Group();
  private readonly vfxMesh: THREE.InstancedMesh;
  private readonly vfxMaterial: THREE.MeshBasicMaterial;
  private readonly toonGradient: THREE.DataTexture | null;
  private selectedPartId: string | null = null;

  constructor(
    public readonly unit: VoxelUnitDefinition,
    private readonly options: VoxelSceneOptions = {},
  ) {
    this.scene.add(this.root);
    const mode = options.mode ?? 'standard';
    this.toonGradient = mode === 'toon' ? createToonGradient() : null;

    const partMap = new Map(unit.parts.map((part) => [part.id, part]));
    const sorted = [...unit.parts].sort((a, b) => partDepth(a, partMap) - partDepth(b, partMap));

    for (const part of sorted) {
      const parentRuntime = part.parentId ? this.parts.get(part.parentId) : undefined;
      const parentGroup = parentRuntime?.group ?? this.root;
      const parentPivot = parentRuntime?.part.pivot ?? ([0, 0, 0] as [number, number, number]);
      const group = new THREE.Group();
      const basePosition = new THREE.Vector3(
        part.pivot[0] - parentPivot[0],
        part.pivot[1] - parentPivot[1],
        part.pivot[2] - parentPivot[2],
      );
      group.position.copy(basePosition);
      parentGroup.add(group);

      const material =
        mode === 'toon'
          ? new THREE.MeshToonMaterial({
              color: 0xffffff,
              gradientMap: this.toonGradient ?? undefined,
              wireframe: options.wireframe ?? false,
            })
          : new THREE.MeshStandardMaterial({
              color: 0xffffff,
              roughness: 0.82,
              metalness: 0.04,
              flatShading: true,
              wireframe: options.wireframe ?? false,
            });

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const mesh = new THREE.InstancedMesh(geometry, material, Math.max(part.voxels.length, 1));
      mesh.count = part.voxels.length;
      mesh.frustumCulled = false;
      mesh.userData.partId = part.id;
      const matrix = new THREE.Matrix4();
      const color = new THREE.Color();
      const local = new THREE.Vector3();
      for (let index = 0; index < part.voxels.length; index += 1) {
        const voxel = part.voxels[index];
        local.set(
          voxel.x - part.pivot[0],
          voxel.y - part.pivot[1],
          voxel.z - part.pivot[2],
        );
        matrix.makeTranslation(local.x, local.y, local.z);
        mesh.setMatrixAt(index, matrix);
        color.set(voxel.color);
        mesh.setColorAt(index, color);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      group.add(mesh);

      const runtime: PartRuntime = {
        part,
        group,
        mesh,
        material,
        parentGroup,
        basePosition,
      };
      this.parts.set(part.id, runtime);
      this.partOrder.push(runtime);
    }

    const box = new THREE.Box3();
    const point = new THREE.Vector3();
    for (const part of unit.parts) {
      for (const voxel of part.voxels) {
        point.set(voxel.x, voxel.y, voxel.z);
        box.expandByPoint(point);
      }
    }
    if (box.isEmpty()) {
      box.set(new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, 2, 1));
    }
    box.expandByScalar(0.75);
    this.bounds.copy(box);

    this.buildPivotGizmos();
    this.pivotGroup.visible = options.showPivots ?? false;
    this.root.add(this.pivotGroup);
    this.root.add(this.pinGroup);

    const hemisphere = new THREE.HemisphereLight(0xffffff, 0x52525b, 1.8);
    this.scene.add(hemisphere);
    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(18, 32, 22);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xb8d4ff, 1.1);
    fill.position.set(-22, 12, -18);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.8);
    rim.position.set(0, 10, -28);
    this.scene.add(rim);

    this.vfxMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      vertexColors: false,
    });
    const vfxGeometry = new THREE.BoxGeometry(1, 1, 1);
    this.vfxMesh = new THREE.InstancedMesh(vfxGeometry, this.vfxMaterial, MAX_VFX_PARTICLES);
    this.vfxMesh.count = 0;
    this.vfxMesh.frustumCulled = false;
    this.vfxMesh.renderOrder = 2;
    this.scene.add(this.vfxMesh);
  }

  private buildPivotGizmos(): void {
    const material = new THREE.MeshBasicMaterial({ color: 0x38bdf8, depthTest: false });
    const activeMaterial = new THREE.MeshBasicMaterial({ color: 0xfacc15, depthTest: false });
    for (const runtime of this.partOrder) {
      const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.34), material);
      marker.position.set(runtime.part.pivot[0], runtime.part.pivot[1], runtime.part.pivot[2]);
      marker.renderOrder = 3;
      marker.userData.pivotPartId = runtime.part.id;
      this.pivotGroup.add(marker);
      if (runtime.part.id === this.selectedPartId) {
        marker.material = activeMaterial;
      }
    }
  }

  apply(
    clip: VoxelAnimationClip,
    frame: number,
    params: Record<string, number>,
    visibility: Record<string, boolean> = {},
  ): void {
    const result = clip.evaluate(frame, clip.frames, params);
    for (const runtime of this.partOrder) {
      const transform = result.parts[runtime.part.id] ?? {};
      runtime.group.position.copy(runtime.basePosition);
      runtime.group.position.x += transform.tx ?? 0;
      runtime.group.position.y += transform.ty ?? 0;
      runtime.group.position.z += transform.tz ?? 0;
      runtime.group.rotation.set(
        transform.rx ?? 0,
        transform.ry ?? 0,
        transform.rz ?? 0,
        'XYZ',
      );
      const scale = transform.scale ?? 1;
      runtime.group.scale.setScalar(scale);
      runtime.group.visible = visibility[runtime.part.id] !== false && transform.visible !== false;
    }
    this.setVfx(result.vfx ?? []);
  }

  setVfx(particles: VoxelVfxParticle[]): void {
    const count = Math.min(particles.length, MAX_VFX_PARTICLES);
    this.vfxMesh.count = count;
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const color = new THREE.Color();
    for (let index = 0; index < count; index += 1) {
      const particle = particles[index];
      const opacity = particle.opacity ?? 1;
      const visibleScale = opacity <= 0.02 ? 0 : particle.size ?? 0.5;
      position.set(particle.x, particle.y, particle.z);
      rotation.set(particle.rx ?? 0, particle.ry ?? 0, particle.rz ?? 0);
      quaternion.setFromEuler(rotation);
      scale.setScalar(visibleScale);
      matrix.compose(position, quaternion, scale);
      this.vfxMesh.setMatrixAt(index, matrix);
      color.set(particle.color);
      this.vfxMesh.setColorAt(index, color);
    }
    this.vfxMesh.instanceMatrix.needsUpdate = true;
    if (this.vfxMesh.instanceColor) this.vfxMesh.instanceColor.needsUpdate = true;
  }

  setPartVisibility(partId: string, visible: boolean): void {
    const runtime = this.parts.get(partId);
    if (runtime) runtime.group.visible = visible;
  }

  setPivotsVisible(visible: boolean): void {
    this.pivotGroup.visible = visible;
  }

  setWireframe(wireframe: boolean): void {
    for (const runtime of this.partOrder) {
      runtime.material.wireframe = wireframe;
    }
  }

  setSelectedPart(partId: string | null): void {
    this.selectedPartId = partId;
    for (const runtime of this.partOrder) {
      const selected = runtime.part.id === partId;
      runtime.material.emissive.set(selected ? 0x1e40af : 0x000000);
      runtime.material.emissiveIntensity = selected ? 0.55 : 0;
    }
    const pivotMaterial = new THREE.MeshBasicMaterial({ color: 0xfacc15, depthTest: false });
    const normalMaterial = new THREE.MeshBasicMaterial({ color: 0x38bdf8, depthTest: false });
    this.pivotGroup.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = child.userData.pivotPartId === partId ? pivotMaterial : normalMaterial;
      }
    });
  }

  setCommentPins(comments: VoxelComment[], clipId: string, frame: number): void {
    this.clearPins();
    const active = comments.filter(
      (comment) => comment.clipId === clipId && Math.abs(comment.frame - frame) <= 2,
    );
    const material = new THREE.MeshBasicMaterial({ color: 0xf43f5e, depthTest: false });
    for (const comment of active) {
      const part = this.parts.get(comment.partId ?? '');
      const pivot = part?.part.pivot ?? [0, 20, 0];
      const pin = new THREE.Mesh(new THREE.ConeGeometry(0.46, 1.1, 4), material);
      pin.position.set(pivot[0], pivot[1] + 3.4, pivot[2]);
      pin.rotation.z = Math.PI;
      pin.renderOrder = 4;
      this.pinGroup.add(pin);
    }
  }

  private clearPins(): void {
    for (const child of [...this.pinGroup.children]) {
      this.pinGroup.remove(child);
      if (child instanceof THREE.Mesh) child.geometry.dispose();
    }
  }

  getSelectableMeshes(): THREE.Object3D[] {
    return this.partOrder.map((runtime) => runtime.mesh);
  }

  dispose(): void {
    this.scene.traverse((object) => {
      if (object instanceof THREE.InstancedMesh || object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          material.dispose();
        }
      }
    });
    this.toonGradient?.dispose();
    this.vfxMaterial.dispose();
  }
}
