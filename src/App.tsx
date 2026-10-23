import { useEffect, useState } from 'react';
import { HomeDashboard, type DashboardTab } from './components/HomeDashboard';
import { StudioEditor } from './components/StudioEditor';
import { getUnitDefinition } from './units';

interface RouteState {
  unitId: string | null;
  animId: string | null;
  tab: DashboardTab;
}

function readRoute(): RouteState {
  const params = new URLSearchParams(window.location.search);
  const unitId = params.get('unit');
  const animId = params.get('anim');
  const tab: DashboardTab = params.get('tab') === 'vfx' ? 'vfx' : 'sprites';
  return { unitId, animId, tab };
}

function pushRoute(url: string): void {
  window.history.pushState({}, '', url);
}

export default function App() {
  const [route, setRoute] = useState<RouteState>(readRoute);

  useEffect(() => {
    const onPopState = () => setRoute(readRoute());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const unit = route.unitId ? getUnitDefinition(route.unitId) : undefined;
    document.title = unit ? `${unit.name} — Open-Voxel Studio` : 'Open-Voxel — Voxel Sprite Studio';
  }, [route.unitId]);

  const openUnit = (unitId: string, clipId?: string) => {
    const params = new URLSearchParams({ unit: unitId });
    if (clipId) params.set('anim', clipId);
    pushRoute(`/?${params.toString()}`);
    setRoute(readRoute());
  };

  const closeStudio = () => {
    pushRoute('/');
    setRoute(readRoute());
  };

  if (route.unitId) {
    return <StudioEditor unitId={route.unitId} initialAnim={route.animId} onBack={closeStudio} />;
  }

  return <HomeDashboard initialTab={route.tab} onOpenUnit={openUnit} />;
}
