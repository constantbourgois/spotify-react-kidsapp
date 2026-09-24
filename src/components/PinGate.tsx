import { useState } from "react";

type Props = { pin: string; onUnlock: () => void; onCancel: () => void };

export function PinGate({ pin, onUnlock, onCancel }: Props) {
  const [entered, setEntered] = useState("");
  const [wrong, setWrong] = useState(false);

  const press = (digit: string) => {
    const next = entered + digit;
    setWrong(false);
    if (next.length < pin.length) return setEntered(next);
    if (next === pin) return onUnlock();
    setEntered("");
    setWrong(true);
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Code parent">
      <div className={`pin-card${wrong ? " pin-card--wrong" : ""}`}>
        <h2>Code parent</h2>
        <div className="pin-dots">
          {Array.from({ length: pin.length }, (_, i) => (
            <span key={i} className={`pin-dot${i < entered.length ? " pin-dot--filled" : ""}`} />
          ))}
        </div>
        <div className="keypad">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button key={d} onClick={() => press(d)}>
              {d}
            </button>
          ))}
          <button className="keypad__cancel" onClick={onCancel}>
            Annuler
          </button>
          <button onClick={() => press("0")}>0</button>
          <button className="keypad__cancel" onClick={() => setEntered((e) => e.slice(0, -1))} aria-label="Effacer">
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
