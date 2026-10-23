import type { Voxel, VoxelPart, VoxelVector3 } from '../types/voxel';

export type CylinderAxis = 'x' | 'y' | 'z';

function key(x: number, y: number, z: number): string {
  return `${x}|${y}|${z}`;
}

export function dedupeVoxels(voxels: Voxel[]): Voxel[] {
  const map = new Map<string, Voxel>();
  for (const voxel of voxels) {
    map.set(key(voxel.x, voxel.y, voxel.z), voxel);
  }
  return Array.from(map.values());
}

export function translateVoxels(voxels: Voxel[], dx: number, dy: number, dz: number): Voxel[] {
  return voxels.map((voxel) => ({
    ...voxel,
    x: voxel.x + dx,
    y: voxel.y + dy,
    z: voxel.z + dz,
  }));
}

export function fillBox(
  x1: number,
  y1: number,
  z1: number,
  x2: number,
  y2: number,
  z2: number,
  color: string,
): Voxel[] {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  const minZ = Math.min(z1, z2);
  const maxZ = Math.max(z1, z2);
  const voxels: Voxel[] = [];
  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      for (let z = minZ; z <= maxZ; z += 1) {
        voxels.push({ x, y, z, color });
      }
    }
  }
  return voxels;
}

export function fillSphere(
  cx: number,
  cy: number,
  cz: number,
  radius: number,
  color: string,
): Voxel[] {
  const voxels: Voxel[] = [];
  const r = Math.max(0, radius);
  const limit = Math.ceil(r);
  for (let x = -limit; x <= limit; x += 1) {
    for (let y = -limit; y <= limit; y += 1) {
      for (let z = -limit; z <= limit; z += 1) {
        if (x * x + y * y + z * z <= r * r + r * 0.35) {
          voxels.push({ x: cx + x, y: cy + y, z: cz + z, color });
        }
      }
    }
  }
  return voxels;
}

export function fillCylinder(
  cx: number,
  y1: number,
  y2: number,
  cz: number,
  radius: number,
  color: string,
  axis: CylinderAxis = 'y',
): Voxel[] {
  const voxels: Voxel[] = [];
  const start = Math.min(y1, y2);
  const end = Math.max(y1, y2);
  const r = Math.max(0, radius);
  const limit = Math.ceil(r);
  for (let span = start; span <= end; span += 1) {
    for (let a = -limit; a <= limit; a += 1) {
      for (let b = -limit; b <= limit; b += 1) {
        if (a * a + b * b > r * r + r * 0.35) continue;
        if (axis === 'y') {
          voxels.push({ x: cx + a, y: span, z: cz + b, color });
        } else if (axis === 'x') {
          voxels.push({ x: span, y: cx + a, z: cz + b, color });
        } else {
          voxels.push({ x: cx + a, y: cz + b, z: span, color });
        }
      }
    }
  }
  return voxels;
}

export function setVoxel(x: number, y: number, z: number, color: string): Voxel[] {
  return [{ x, y, z, color }];
}

export function carveBox(
  voxels: Voxel[],
  x1: number,
  y1: number,
  z1: number,
  x2: number,
  y2: number,
  z2: number,
): Voxel[] {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  const minZ = Math.min(z1, z2);
  const maxZ = Math.max(z1, z2);
  return voxels.filter(
    (voxel) =>
      voxel.x < minX ||
      voxel.x > maxX ||
      voxel.y < minY ||
      voxel.y > maxY ||
      voxel.z < minZ ||
      voxel.z > maxZ,
  );
}

export function mirrorX(voxels: Voxel[]): Voxel[] {
  return dedupeVoxels([
    ...voxels,
    ...voxels
      .filter((voxel) => voxel.x !== 0)
      .map((voxel) => ({ ...voxel, x: -voxel.x })),
  ]);
}

export function extrudePattern(
  grid2D: string[],
  paletteMap: Record<string, string>,
  depth: number,
): Voxel[] {
  const voxels: Voxel[] = [];
  const rows = grid2D.length;
  const layers = Math.max(1, Math.floor(depth));
  for (let row = 0; row < rows; row += 1) {
    const line = grid2D[row];
    for (let col = 0; col < line.length; col += 1) {
      const color = paletteMap[line[col]];
      if (!color) continue;
      const x = col - Math.floor(line.length / 2);
      const y = rows - 1 - row;
      for (let z = 0; z < layers; z += 1) {
        voxels.push({ x, y, z, color });
      }
    }
  }
  return dedupeVoxels(voxels);
}

export class VoxelBuilder {
  voxels: Voxel[] = [];

  add(...voxels: Voxel[]): this {
    this.voxels.push(...voxels);
    return this;
  }

  fillBox(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, color: string): this {
    return this.add(...fillBox(x1, y1, z1, x2, y2, z2, color));
  }

  fillSphere(cx: number, cy: number, cz: number, radius: number, color: string): this {
    return this.add(...fillSphere(cx, cy, cz, radius, color));
  }

  fillCylinder(
    cx: number,
    y1: number,
    y2: number,
    cz: number,
    radius: number,
    color: string,
    axis: CylinderAxis = 'y',
  ): this {
    return this.add(...fillCylinder(cx, y1, y2, cz, radius, color, axis));
  }

  setVoxel(x: number, y: number, z: number, color: string): this {
    return this.add(...setVoxel(x, y, z, color));
  }

  carveBox(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): this {
    this.voxels = carveBox(this.voxels, x1, y1, z1, x2, y2, z2);
    return this;
  }

  mirrorX(): this {
    this.voxels = mirrorX(this.voxels);
    return this;
  }

  translate(dx: number, dy: number, dz: number): this {
    this.voxels = translateVoxels(this.voxels, dx, dy, dz);
    return this;
  }

  extrude(grid2D: string[], paletteMap: Record<string, string>, depth: number): this {
    return this.add(...extrudePattern(grid2D, paletteMap, depth));
  }

  build(): Voxel[] {
    return dedupeVoxels(this.voxels);
  }
}

export class VoxelPartBuilder extends VoxelBuilder {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly pivot: VoxelVector3,
    public readonly parentId?: string,
  ) {
    super();
  }

  end(): VoxelPart {
    return {
      id: this.id,
      name: this.name,
      parentId: this.parentId,
      pivot: this.pivot,
      voxels: this.build(),
    };
  }
}

export function part(
  id: string,
  name: string,
  pivot: VoxelVector3,
  parentId?: string,
): VoxelPartBuilder {
  return new VoxelPartBuilder(id, name, pivot, parentId);
}

export function voxelTextRotateX(voxels: Voxel[], degrees: number): Voxel[] {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return voxels.map((voxel) => ({
    ...voxel,
    y: Math.round(voxel.y * cos - voxel.z * sin),
    z: Math.round(voxel.y * sin + voxel.z * cos),
  }));
}
