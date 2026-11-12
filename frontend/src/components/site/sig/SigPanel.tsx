import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useMediaQuery } from "@/lib/hooks";
import { setSig, sigPos, useSig } from "./store";

const EFFECTS: [string, string][] = [
  ["hello", "Waves and says hello"],
  ["dance", "Hops side to side"],
  ["party", "Pixel confetti"],
  ["sleep", "Naps until you move"],
  ["play", "Catch-me game"],
  ["radio", "Headphones, on air"],
  ["grad", "Mortarboard outfit"],
  ["lab", "Goggles outfit"],
  ["normal", "Removes the outfit"],
  ["fault", "Turns amber"],
  ["train", "Three epochs"],
  ["gate", "Scrolls to the Gate"],
  ["research", "Scrolls to Research"],
  ["papers", "Scrolls to Publications"],
  ["awards", "Scrolls to Recognition"],
  ["experience", "Scrolls to Experience"],
  ["about", "Scrolls to About"],
  ["contact", "Scrolls to Contact"],
  ["cv", "Points at the CV button"],
  ["jaideep", "Meets his creator"],
  ["bye", "Waves and hides"],
  ["help", "Opens this panel"],
];

const TIPS = [
  "Drag him and throw him",
  "Hold on him to pet him",
  "Double-tap him to play catch-me",
  "Tap him 10 times for silly lines",
];

/** Sig’s secrets: anchored near Sig on desktop, a bottom sheet on phones. */
export default function SigPanel({ onWord }: { onWord: (w: string) => void }) {
  const { panelOpen } = useSig();
  const touch = useMediaQuery("(pointer: coarse)");
  const phone = useMediaQuery("(max-width: 767.9px)") || touch;

  let style: React.CSSProperties | undefined;
  if (!phone && panelOpen) {
    const w = 380;
    const left = Math.max(16, Math.min(window.innerWidth - w - 16, sigPos.x + 28 - w / 2));
    const bottom = Math.max(16, window.innerHeight - sigPos.y + 12);
    style = { left, bottom, width: w };
  }

  return (
    <Dialog.Root open={panelOpen} onOpenChange={(o) => setSig({ panelOpen: o })}>
      <Dialog.Portal>
        <Dialog.Backdrop className={phone ? "menu-backdrop sig-panel-backdrop" : "sig-panel-backdrop-clear"} />
        <Dialog.Popup
          className={`sig-panel ${phone ? "sig-panel-sheet" : "sig-panel-pop"}`}
          style={style}
          data-lenis-prevent
          data-testid="sig-panel"
        >
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-h3">Sig’s secrets</Dialog.Title>
            <Dialog.Close className="btn-ghost btn-s" aria-label="Close Sig’s secrets" data-testid="sig-panel-close">
              <X size={16} aria-hidden="true" />
            </Dialog.Close>
          </div>
          <p className="mono mt-5 text-muted-dark">{touch ? "Tap a word to try it" : "Type a word anywhere"}</p>
          <ul className="sig-words mt-3">
            {EFFECTS.map(([w, effect]) => (
              <li key={w}>
                <button
                  type="button"
                  className="sig-word"
                  onClick={() => {
                    setSig({ panelOpen: false });
                    window.setTimeout(() => onWord(w), 60);
                  }}
                  data-testid={`sig-word-${w}`}
                >
                  <span className="mono sig-word-chip">{w}</span>
                  <span className="text-small text-muted-dark">{effect}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mono mt-6 text-muted-dark">Try this</p>
          <ul className="mt-2">
            {TIPS.map((t) => (
              <li key={t} className="text-small py-1">
                {t}
              </li>
            ))}
          </ul>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
