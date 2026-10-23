import type { VoxelComment } from '../types/voxel';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status}).`);
  }
  return payload;
}

export function deleteUnit(unitId: string): Promise<{ ok: boolean }> {
  return request(`/api/units/${unitId}`, { method: 'DELETE' });
}

export function deletePart(unitId: string, partId: string): Promise<{ ok: boolean }> {
  return request(`/api/units/${unitId}/parts/${partId}`, { method: 'DELETE' });
}

export function saveClipParams(
  unitId: string,
  clipId: string,
  params: Record<string, number>,
): Promise<{ ok: boolean; updated: number; missing: string[] }> {
  return request(`/api/units/${unitId}/clips/${clipId}/params`, {
    method: 'POST',
    body: JSON.stringify({ params }),
  });
}

export function fetchComments(unitId: string): Promise<{ comments: VoxelComment[] }> {
  return request(`/api/units/${unitId}/comments`);
}

export function addComment(
  unitId: string,
  comment: { clipId: string; frame: number; partId?: string; text: string },
): Promise<{ comment: VoxelComment }> {
  return request(`/api/units/${unitId}/comments`, {
    method: 'POST',
    body: JSON.stringify(comment),
  });
}
