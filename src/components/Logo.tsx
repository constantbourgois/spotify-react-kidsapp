import type { CSSProperties } from "react";
import { LOGO_INK, LOGO_LETTERS, LOGO_VIEWBOX } from "./logo-paths";

/**
 * Logo « txiki » aux lettres-animaux, repris du site Txiki (haurrak). En SVG dans la page pour l'animer
 * (styles.css, « Logo animé ») : les lettres tombent l'une après l'autre, puis les oreilles remuent, les yeux
 * clignent et les moustaches du x frétillent. Le fichier d'origine reste public/logo-txiki.svg.
 */
export function Logo({ height = 48 }: { height?: number }) {
  return (
    <svg viewBox={LOGO_VIEWBOX} height={height} className="txiki-logo" role="img" aria-label="txiki">
      {LOGO_LETTERS.map((l, i) => (
        <g key={l.id} className="logo-letter" style={{ "--i": i } as CSSProperties}>
          {l.shapes.map((s, j) =>
            s.rect ? (
              <rect key={j} x={s.rect[0]} y={s.rect[1]} width={s.rect[2]} height={s.rect[3]} fill={s.fill} />
            ) : (
              <path key={j} d={s.d} fill={s.fill} />
            ),
          )}
          {l.ears.length > 0 && (
            <g className="logo-ears">
              {l.ears.map((d, j) => (
                <path key={j} d={d} fill={LOGO_INK} />
              ))}
            </g>
          )}
          {l.whiskers.length > 0 && (
            <g className="logo-whiskers">
              {l.whiskers.map((d, j) => (
                <path key={j} d={d} fill={LOGO_INK} />
              ))}
            </g>
          )}
          <g className="logo-eyes">
            {l.eyes.map(([cx, cy, r], j) => (
              <circle key={j} cx={cx} cy={cy} r={r} fill={LOGO_INK} />
            ))}
          </g>
        </g>
      ))}
    </svg>
  );
}

/** Emblème des petites tailles : la tête du lapin jaune (le premier « i » du logo). */
export function Bunny({ size = 40 }: { size?: number }) {
  return <img className="bunny" src="/lapin-txiki.svg" alt="" width={size} height={size} draggable={false} />;
}

/** Mascottes Txiki posées aux bords de l'écran : pure décoration. */
export function Mascots() {
  return (
    <div className="mascots" aria-hidden="true">
      {["soleil", "corail", "violet", "bleu", "jaune", "etoile"].map((name) => (
        <img key={name} className={`mascot mascot--${name}`} src={`/mascottes/${name}.svg`} alt="" draggable={false} />
      ))}
    </div>
  );
}
