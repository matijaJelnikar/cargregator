// Makes with an SVG in public/logos (see its README); the rest show their initials.
const LOGOS = new Set(
  "audi bmw chevrolet citroen dacia ds fiat ford honda hyundai jeep kia mazda mg mini mitsubishi nissan opel peugeot polestar porsche renault seat skoda smart subaru suzuki tesla toyota volkswagen volvo".split(" "),
);

const initials = (name: string) =>
  name
    .split(/[\s-]+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** A make's logo drawn in the current text colour (a CSS mask), so it follows light and dark themes. */
export function MakeLogo({ makeId, name, className = "size-10" }: { makeId: string; name: string; className?: string }) {
  if (!LOGOS.has(makeId)) {
    return (
      <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-full border border-border font-mono text-xs font-semibold ${className}`}>
        {initials(name)}
      </span>
    );
  }
  const mask = `url(/logos/${makeId}.svg) center / contain no-repeat`;
  return <span aria-hidden className={`block shrink-0 bg-current ${className}`} style={{ mask, WebkitMask: mask }} />;
}
