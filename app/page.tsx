'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Crosshair,
  HeartPulse,
  RotateCw,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { HEROES, type HeroRole } from './heroes';
import './roulette.css';

type Mode = 'names' | 'heroes' | 'stadium';
type RoleFilter = 'all' | HeroRole;

type WheelItem = {
  id: string;
  name: string;
  image?: string;
  role?: HeroRole;
  stadium?: boolean;
};

const DEFAULT_NAMES = 'Alex\nJamie\nMorgan\nRiley\nSam\nTaylor';

const WHEEL_COLORS = [
  '#f0642d',
  '#18a7c9',
  '#7956d8',
  '#f1b93a',
  '#df4779',
  '#3ebf86',
  '#ec7d26',
  '#4578dc',
];

const ROLE_META: Record<HeroRole, { label: string; short: string }> = {
  tank: { label: 'Tank', short: 'Tank' },
  damage: { label: 'Damage', short: 'DPS' },
  support: { label: 'Support', short: 'Support' },
};

function randomIndex(length: number) {
  if (length <= 1) return 0;
  const max = Math.floor(0xffffffff / length) * length;
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= max);
  return buffer[0] % length;
}

function Wheel({
  items,
  rotation,
  spinning,
  duration,
}: {
  items: WheelItem[];
  rotation: number;
  spinning: boolean;
  duration: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const size = 900;
    const center = size / 2;
    const radius = center - 18;
    canvas.width = size;
    canvas.height = size;
    context.clearRect(0, 0, size, size);

    context.beginPath();
    context.arc(center, center, radius + 8, 0, Math.PI * 2);
    context.fillStyle = '#edf3f7';
    context.fill();

    const safeItems = items.length > 0 ? items : [{ id: 'empty', name: 'Add entries' }];
    const slice = (Math.PI * 2) / safeItems.length;
    const fontSize = safeItems.length > 36 ? 15 : safeItems.length > 20 ? 18 : 23;

    safeItems.forEach((item, index) => {
      const start = -Math.PI / 2 + index * slice;
      const end = start + slice;

      context.beginPath();
      context.moveTo(center, center);
      context.arc(center, center, radius, start, end);
      context.closePath();
      context.fillStyle = WHEEL_COLORS[index % WHEEL_COLORS.length];
      context.fill();
      context.strokeStyle = 'rgba(255,255,255,.46)';
      context.lineWidth = safeItems.length > 30 ? 1 : 2;
      context.stroke();

      context.save();
      context.translate(center, center);
      context.rotate(start + slice / 2);
      context.textAlign = 'right';
      context.textBaseline = 'middle';
      context.fillStyle = '#ffffff';
      context.font = `800 ${fontSize}px var(--font-geist-sans), Arial`;
      context.shadowColor = 'rgba(12, 20, 34, .35)';
      context.shadowBlur = 4;
      const maxChars = safeItems.length > 40 ? 12 : 18;
      const label =
        item.name.length > maxChars ? `${item.name.slice(0, maxChars - 1)}…` : item.name;
      context.fillText(label, radius - 28, 0);
      context.restore();
    });

    context.beginPath();
    context.arc(center, center, 72, 0, Math.PI * 2);
    context.fillStyle = '#101a2b';
    context.fill();
    context.strokeStyle = '#ffffff';
    context.lineWidth = 10;
    context.stroke();
  }, [items]);

  return (
    <div className="wheel-frame" aria-hidden="true">
      <div className="wheel-pointer" />
      <canvas
        ref={canvasRef}
        className="wheel-canvas"
        style={{
          transform: `rotate(${rotation}deg)`,
          transitionDuration: `${duration}ms`,
          transitionTimingFunction: spinning
            ? 'cubic-bezier(.12,.67,.09,1)'
            : 'ease-out',
        }}
      />
      <div className="wheel-hub">
        <RotateCw aria-hidden="true" />
      </div>
    </div>
  );
}

export default function Home() {
  const [mode, setMode] = useState<Mode>('heroes');
  const [role, setRole] = useState<RoleFilter>('all');
  const [nameInput, setNameInput] = useState(DEFAULT_NAMES);
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<WheelItem | null>(null);
  const [duration, setDuration] = useState(4800);

  useEffect(() => {
    const savedNames = window.localStorage.getItem('group-up-names');
    if (savedNames) setNameInput(savedNames);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('group-up-names', nameInput);
  }, [nameInput]);

  const customNames = useMemo(
    () =>
      nameInput
        .split(/[\n,]+/)
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name, index) => ({ id: `name-${index}-${name}`, name })),
    [nameInput],
  );

  const heroPool = useMemo(
    () =>
      HEROES.filter((hero) => {
        if (mode === 'stadium' && !hero.stadium) return false;
        return role === 'all' || hero.role === role;
      }).map((hero) => ({ id: hero.key, ...hero })),
    [mode, role],
  );

  const wheelItems: WheelItem[] = mode === 'names' ? customNames : heroPool;
  const canSpin = wheelItems.length >= 2 && !spinning;

  function changeMode(nextMode: Mode) {
    if (spinning) return;
    setMode(nextMode);
    setWinner(null);
  }

  function changeRole(nextRole: RoleFilter) {
    if (spinning) return;
    setRole(nextRole);
    setWinner(null);
  }

  function spin() {
    if (!canSpin) return;

    const selectedIndex = randomIndex(wheelItems.length);
    const selected = wheelItems[selectedIndex];
    const sliceDegrees = 360 / wheelItems.length;
    const target = 360 - (selectedIndex + 0.5) * sliceDegrees;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const spinDuration = reducedMotion ? 280 : 4800;
    const turns = reducedMotion ? 1 : 6 + randomIndex(3);
    const nextRotation =
      Math.ceil(rotationRef.current / 360) * 360 + turns * 360 + target;

    setWinner(null);
    setSpinning(true);
    setDuration(spinDuration);
    setRotation(nextRotation);
    rotationRef.current = nextRotation;

    window.setTimeout(() => {
      setWinner(selected);
      setSpinning(false);
    }, spinDuration + 80);
  }

  const poolTitle =
    mode === 'names'
      ? 'Names on the wheel'
      : mode === 'stadium'
        ? 'Stadium hero pool'
        : 'Eligible heroes';

  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Group Up home">
          <span className="brand-mark"><Users aria-hidden="true" /></span>
          <span>
            <strong>GROUP UP</strong>
            <small>Hero roulette</small>
          </span>
        </a>
        <div className="season-pill">
          <span className="live-dot" />
          Season 4 roster · 53 heroes
        </div>
      </header>

      <section className="workspace" id="top">
        <section className="wheel-panel" aria-labelledby="wheel-title">
          <div className="panel-kicker">
            <span>01</span>
            <p id="wheel-title">Your selection wheel</p>
          </div>

          <div className="wheel-stage">
            <Wheel
              items={wheelItems}
              rotation={rotation}
              spinning={spinning}
              duration={duration}
            />

            <div className={`winner-card ${winner ? 'is-visible' : ''}`} aria-live="polite">
              {winner ? (
                <>
                  {winner.image ? (
                    <img src={winner.image} alt="" />
                  ) : (
                    <span className="winner-initial">{winner.name.charAt(0)}</span>
                  )}
                  <div>
                    <small>Locked in</small>
                    <strong>{winner.name}</strong>
                    {winner.role && <span>{ROLE_META[winner.role].label}</span>}
                  </div>
                </>
              ) : (
                <>
                  <span className="winner-placeholder"><Sparkles aria-hidden="true" /></span>
                  <div>
                    <small>{spinning ? 'Rolling…' : 'Ready'}</small>
                    <strong>{spinning ? 'Good luck!' : 'Spin to choose'}</strong>
                  </div>
                </>
              )}
            </div>
          </div>

          <Button
            className="spin-button"
            size="lg"
            onClick={spin}
            disabled={!canSpin}
          >
            <RotateCw data-icon="inline-start" aria-hidden="true" />
            {spinning ? 'Spinning…' : 'Spin the wheel'}
          </Button>
          {wheelItems.length < 2 && (
            <p className="spin-hint">Add at least two names before spinning.</p>
          )}
        </section>

        <aside className="control-panel" aria-label="Wheel controls">
          <div className="panel-kicker">
            <span>02</span>
            <p>Build your pool</p>
          </div>

          <div className="control-block">
            <div className="control-heading">
              <div>
                <span>Wheel mode</span>
                <small>Choose what you want to roll</small>
              </div>
              <strong>{wheelItems.length}</strong>
            </div>

            <div className="mode-tabs" role="group" aria-label="Wheel mode">
              <Button
                variant={mode === 'names' ? 'default' : 'ghost'}
                aria-pressed={mode === 'names'}
                onClick={() => changeMode('names')}
              >
                <Users aria-hidden="true" /> Names
              </Button>
              <Button
                variant={mode === 'heroes' ? 'default' : 'ghost'}
                aria-pressed={mode === 'heroes'}
                onClick={() => changeMode('heroes')}
              >
                <Crosshair aria-hidden="true" /> Heroes
              </Button>
              <Button
                variant={mode === 'stadium' ? 'default' : 'ghost'}
                aria-pressed={mode === 'stadium'}
                onClick={() => changeMode('stadium')}
              >
                <img className="stadium-tab-icon" src="/stadium-icon.svg" alt="" /> Stadium
              </Button>
            </div>
          </div>

          {mode === 'names' ? (
            <div className="control-block name-control">
              <label htmlFor="names">Player names</label>
              <small>One per line, or separate with commas. Add as many as you like.</small>
              <Textarea
                id="names"
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder={'Alex\nJamie\nMorgan'}
                disabled={spinning}
              />
              <div className="input-footer">
                <span>{customNames.length} names ready</span>
                <button type="button" onClick={() => setNameInput('')} disabled={spinning}>
                  Clear all
                </button>
              </div>
            </div>
          ) : (
            <div className="control-block">
              <div className="control-heading role-heading">
                <div>
                  <span>Role filter</span>
                  <small>Only include the role your group needs</small>
                </div>
              </div>
              <div className="role-grid" role="group" aria-label="Hero role filter">
                <Button
                  variant={role === 'all' ? 'default' : 'outline'}
                  aria-pressed={role === 'all'}
                  onClick={() => changeRole('all')}
                >
                  <Sparkles aria-hidden="true" /> All
                </Button>
                <Button
                  variant={role === 'tank' ? 'default' : 'outline'}
                  aria-pressed={role === 'tank'}
                  onClick={() => changeRole('tank')}
                >
                  <Shield aria-hidden="true" /> Tank
                </Button>
                <Button
                  variant={role === 'damage' ? 'default' : 'outline'}
                  aria-pressed={role === 'damage'}
                  onClick={() => changeRole('damage')}
                >
                  <Crosshair aria-hidden="true" /> DPS
                </Button>
                <Button
                  variant={role === 'support' ? 'default' : 'outline'}
                  aria-pressed={role === 'support'}
                  onClick={() => changeRole('support')}
                >
                  <HeartPulse aria-hidden="true" /> Healer / Support
                </Button>
              </div>
            </div>
          )}

          <div className="pool-summary">
            {mode === 'stadium' ? (
              <img src="/stadium-icon.svg" alt="" />
            ) : mode === 'heroes' ? (
              <Crosshair aria-hidden="true" />
            ) : (
              <Users aria-hidden="true" />
            )}
            <div>
              <small>Current wheel</small>
              <strong>{wheelItems.length} eligible {mode === 'names' ? 'players' : 'heroes'}</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="pool-section" aria-labelledby="pool-title">
        <div className="pool-header">
          <div>
            <span className="eyebrow">Live pool</span>
            <h2 id="pool-title">{poolTitle}</h2>
          </div>
          <p>
            {mode === 'names'
              ? 'Every name below has an equal chance of being selected.'
              : `${wheelItems.length} heroes match your current mode and role filter.`}
          </p>
        </div>

        {mode === 'names' ? (
          <div className="name-pool">
            {customNames.map((item, index) => (
              <span key={item.id}>
                <b>{String(index + 1).padStart(2, '0')}</b>
                {item.name}
              </span>
            ))}
            {customNames.length === 0 && <p className="empty-pool">Your names will appear here.</p>}
          </div>
        ) : (
          <div className="hero-grid">
            {heroPool.map((hero) => (
              <article className="hero-card" key={hero.id}>
                <div className="hero-portrait">
                  <img src={hero.image} alt={`${hero.name} portrait`} loading="lazy" />
                  {hero.stadium && (
                    <span className="stadium-badge" title="Available in Stadium">
                      <img src="/stadium-icon.svg" alt="Stadium" />
                    </span>
                  )}
                </div>
                <div className="hero-info">
                  <strong>{hero.name}</strong>
                  <span data-role={hero.role}>{ROLE_META[hero.role].short}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer>
        <p>Fan-made group picker · Hero roster current through D.Mon</p>
        <p>Overwatch and all hero artwork are trademarks and property of Blizzard Entertainment.</p>
      </footer>
    </main>
  );
}
