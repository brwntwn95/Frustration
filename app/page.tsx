'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Crosshair,
  Dices,
  HeartPulse,
  RotateCw,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { HEROES, type Hero, type HeroRole } from './heroes';
import './roulette.css';

type Mode = 'names' | 'heroes' | 'stadium';
type RoleFilter = 'all' | HeroRole;
type SquadPool = 'standard' | 'stadium';

type WheelItem = {
  id: string;
  name: string;
  image?: string;
  role?: HeroRole;
  stadium?: boolean;
};

type Player = {
  id: string;
  name: string;
};

type SquadAssignment = {
  playerId: string;
  playerName: string;
  hero: Hero;
};

const DEFAULT_NAMES = 'Alex\nJamie\nMorgan\nRiley\nSam';
const ALL_ROLES: HeroRole[] = ['tank', 'damage', 'support'];

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

function RoleGlyph({ role }: { role: HeroRole }) {
  if (role === 'tank') return <Shield aria-hidden="true" />;
  if (role === 'damage') return <Crosshair aria-hidden="true" />;
  return <HeartPulse aria-hidden="true" />;
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
  const [mode, setMode] = useState<Mode>('names');
  const [role, setRole] = useState<RoleFilter>('all');
  const [squadPool, setSquadPool] = useState<SquadPool>('standard');
  const [nameInput, setNameInput] = useState(DEFAULT_NAMES);
  const [playerRoles, setPlayerRoles] = useState<Record<string, HeroRole[]>>({});
  const [assignments, setAssignments] = useState<SquadAssignment[]>([]);
  const [squadRolling, setSquadRolling] = useState(false);
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
    setAssignments([]);
  }, [nameInput]);

  const customNames: Player[] = useMemo(
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

  const wheelItems: WheelItem[] = heroPool;
  const canSpin = wheelItems.length >= 2 && !spinning;

  function rolesFor(playerId: string) {
    return playerRoles[playerId] ?? ALL_ROLES;
  }

  function changeMode(nextMode: Mode) {
    if (spinning || squadRolling) return;
    setMode(nextMode);
    setWinner(null);
    setAssignments([]);
  }

  function changeRole(nextRole: RoleFilter) {
    if (spinning) return;
    setRole(nextRole);
    setWinner(null);
  }

  function changeSquadPool(nextPool: SquadPool) {
    if (squadRolling) return;
    setSquadPool(nextPool);
    setAssignments([]);
  }

  function togglePlayerRole(playerId: string, selectedRole: HeroRole) {
    if (squadRolling) return;
    const current = rolesFor(playerId);
    const isSelected = current.includes(selectedRole);
    if (isSelected && current.length === 1) return;

    setPlayerRoles((previous) => ({
      ...previous,
      [playerId]: isSelected
        ? current.filter((item) => item !== selectedRole)
        : ALL_ROLES.filter((item) => [...current, selectedRole].includes(item)),
    }));
    setAssignments([]);
  }

  function rollSquad() {
    if (customNames.length === 0 || squadRolling) return;

    const usedHeroes = new Set<string>();
    const nextAssignments = customNames.map((player) => {
      const allowedRoles = rolesFor(player.id);
      const eligible = HEROES.filter(
        (hero) =>
          allowedRoles.includes(hero.role) &&
          (squadPool === 'standard' || hero.stadium),
      );
      const unused = eligible.filter((hero) => !usedHeroes.has(hero.key));
      const available = unused.length > 0 ? unused : eligible;
      const hero = available[randomIndex(available.length)];
      usedHeroes.add(hero.key);
      return { playerId: player.id, playerName: player.name, hero };
    });

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setAssignments([]);
    setSquadRolling(true);
    window.setTimeout(() => {
      setAssignments(nextAssignments);
      setSquadRolling(false);
    }, reducedMotion ? 80 : 650);
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

  const assignmentMap = new Map(
    assignments.map((assignment) => [assignment.playerId, assignment]),
  );

  const poolTitle =
    mode === 'names'
      ? 'Squad role setup'
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
        <section
          className={`wheel-panel ${mode === 'names' ? 'squad-mode' : ''}`}
          aria-labelledby="wheel-title"
        >
          <div className="panel-kicker">
            <span>01</span>
            <p id="wheel-title">
              {mode === 'names' ? 'Roll the whole squad' : 'Your selection wheel'}
            </p>
          </div>

          {mode === 'names' ? (
            <>
              <div
                className={`squad-stage ${squadRolling ? 'is-rolling' : ''}`}
                aria-live="polite"
              >
                <div className="squad-stage-heading">
                  <div>
                    <span>{squadPool === 'stadium' ? 'Stadium pool' : 'Full hero pool'}</span>
                    <h1>Everyone gets a hero</h1>
                  </div>
                  <strong>{customNames.length} players</strong>
                </div>

                <div className="squad-board">
                  {customNames.map((player, index) => {
                    const assignment = assignmentMap.get(player.id);
                    const allowedRoles = rolesFor(player.id);
                    return (
                      <article
                        className={`squad-player-card ${assignment ? 'has-assignment' : ''}`}
                        key={player.id}
                      >
                        <span className="player-number">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="squad-avatar">
                          {assignment ? (
                            <img
                              src={assignment.hero.image}
                              alt={`${assignment.hero.name} portrait`}
                            />
                          ) : (
                            <Dices aria-hidden="true" />
                          )}
                        </div>
                        <div className="squad-player-info">
                          <small>{player.name}</small>
                          <strong>
                            {squadRolling
                              ? 'Rolling…'
                              : assignment
                                ? assignment.hero.name
                                : 'Waiting to roll'}
                          </strong>
                          {assignment ? (
                            <span className="assigned-role" data-role={assignment.hero.role}>
                              <RoleGlyph role={assignment.hero.role} />
                              {ROLE_META[assignment.hero.role].short}
                            </span>
                          ) : (
                            <div className="allowed-role-pills">
                              {allowedRoles.map((item) => (
                                <span key={item}>{ROLE_META[item].short}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                  {customNames.length === 0 && (
                    <div className="empty-squad">
                      <Users aria-hidden="true" />
                      <strong>Add your group</strong>
                      <span>Enter at least one name to roll the squad.</span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                className="spin-button squad-roll-button"
                size="lg"
                onClick={rollSquad}
                disabled={customNames.length === 0 || squadRolling}
              >
                <Dices data-icon="inline-start" aria-hidden="true" />
                {squadRolling ? 'Rolling everyone…' : 'Roll the whole squad'}
              </Button>
            </>
          ) : (
            <>
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
            </>
          )}
        </section>

        <aside
          className={`control-panel ${mode === 'names' ? 'squad-controls' : ''}`}
          aria-label="Wheel controls"
        >
          <div className="panel-kicker">
            <span>02</span>
            <p>Build your pool</p>
          </div>

          <div className="control-block">
            <div className="control-heading">
              <div>
                <span>Roll mode</span>
                <small>Assign the squad or spin one hero</small>
              </div>
              <strong>{mode === 'names' ? customNames.length : wheelItems.length}</strong>
            </div>

            <div className="mode-tabs" role="group" aria-label="Roll mode">
              <Button
                variant={mode === 'names' ? 'default' : 'ghost'}
                aria-pressed={mode === 'names'}
                onClick={() => changeMode('names')}
              >
                <Users aria-hidden="true" /> Squad
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
            <>
              <div className="control-block name-control">
                <label htmlFor="names">Player names</label>
                <small>One per line, or separate with commas. Everyone rolls together.</small>
                <Textarea
                  id="names"
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value)}
                  placeholder={'Alex\nJamie\nMorgan'}
                  disabled={squadRolling}
                />
                <div className="input-footer">
                  <span>{customNames.length} players ready</span>
                  <Button
                    type="button"
                    variant="link"
                    size="xs"
                    onClick={() => setNameInput('')}
                    disabled={squadRolling}
                  >
                    Clear all
                  </Button>
                </div>
              </div>

              <div className="control-block">
                <div className="control-heading role-heading">
                  <div>
                    <span>Squad hero pool</span>
                    <small>Roll from every hero or Stadium-only heroes</small>
                  </div>
                </div>
                <div className="pool-switch" role="group" aria-label="Squad hero pool">
                  <Button
                    variant={squadPool === 'standard' ? 'default' : 'outline'}
                    aria-pressed={squadPool === 'standard'}
                    onClick={() => changeSquadPool('standard')}
                  >
                    <Crosshair aria-hidden="true" /> All heroes
                  </Button>
                  <Button
                    variant={squadPool === 'stadium' ? 'default' : 'outline'}
                    aria-pressed={squadPool === 'stadium'}
                    onClick={() => changeSquadPool('stadium')}
                  >
                    <img className="stadium-tab-icon" src="/stadium-icon.svg" alt="" />
                    Stadium
                  </Button>
                </div>
              </div>

              <div className="control-block">
                <div className="control-heading role-heading">
                  <div>
                    <span>Roles per player</span>
                    <small>Select one role or leave multiple roles enabled</small>
                  </div>
                </div>
                <div className="player-role-list">
                  {customNames.map((player) => {
                    const selectedRoles = rolesFor(player.id);
                    return (
                      <div className="player-role-row" key={player.id}>
                        <strong>{player.name}</strong>
                        <div className="player-role-buttons" role="group" aria-label={`${player.name} roles`}>
                          {ALL_ROLES.map((item) => (
                            <Button
                              key={item}
                              size="xs"
                              variant={selectedRoles.includes(item) ? 'default' : 'outline'}
                              aria-pressed={selectedRoles.includes(item)}
                              onClick={() => togglePlayerRole(player.id, item)}
                              title={ROLE_META[item].label}
                            >
                              <RoleGlyph role={item} />
                              <span>{ROLE_META[item].short}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {customNames.length === 0 && (
                    <p className="role-list-empty">Add names to choose their roles.</p>
                  )}
                </div>
              </div>
            </>
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
            {mode === 'stadium' || (mode === 'names' && squadPool === 'stadium') ? (
              <img src="/stadium-icon.svg" alt="" />
            ) : mode === 'heroes' ? (
              <Crosshair aria-hidden="true" />
            ) : (
              <Users aria-hidden="true" />
            )}
            <div>
              <small>{mode === 'names' ? 'Current squad' : 'Current wheel'}</small>
              <strong>
                {mode === 'names'
                  ? `${customNames.length} players · ${squadPool === 'stadium' ? 'Stadium' : 'All heroes'}`
                  : `${wheelItems.length} eligible heroes`}
              </strong>
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
              ? 'Each player can queue for one role or stay flexible across several roles.'
              : `${wheelItems.length} heroes match your current mode and role filter.`}
          </p>
        </div>

        {mode === 'names' ? (
          <div className="role-overview-grid">
            {customNames.map((player, index) => {
              const assignment = assignmentMap.get(player.id);
              return (
                <article className="role-overview-card" key={player.id}>
                  <b>{String(index + 1).padStart(2, '0')}</b>
                  {assignment ? (
                    <img src={assignment.hero.image} alt="" />
                  ) : (
                    <span className="overview-placeholder"><Users aria-hidden="true" /></span>
                  )}
                  <div>
                    <strong>{player.name}</strong>
                    <small>{assignment ? assignment.hero.name : 'Not rolled yet'}</small>
                    <div>
                      {rolesFor(player.id).map((item) => (
                        <span key={item} data-role={item}>{ROLE_META[item].short}</span>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
            {customNames.length === 0 && (
              <p className="empty-pool">Your squad will appear here.</p>
            )}
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
