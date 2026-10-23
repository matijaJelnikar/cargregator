import { CarFront } from "lucide-react";
import type { CarGeneration } from "@/lib/carinfoDb";
import { t, type Dict } from "@/lib/i18n";

/**
 * A generation's photo from R2 with the credit line its licence requires, or a placeholder. Plain <img>: the photos
 * are already resized WebP and the Workers deployment has no image optimizer.
 */
export function CarPhoto({ gen, alt, dict, priority = false, className = "" }: { gen: CarGeneration; alt: string; dict: Dict; priority?: boolean; className?: string }) {
  const c = dict.carInfo;
  return (
    <figure className={className}>
      <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-border bg-surface-low">
        {gen.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={gen.image_url}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-subtle">
            <CarFront className="size-10" strokeWidth={1.25} aria-hidden />
            <span className="text-xs">{c.noPhoto}</span>
          </div>
        )}
      </div>
      {gen.image_url && gen.image_credit && (
        <figcaption className="mt-1 truncate text-[11px] text-subtle">
          {gen.image_source_url ? (
            <a href={gen.image_source_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {t(c.photoCredit, { author: gen.image_credit, license: gen.image_license ?? "" })}
            </a>
          ) : (
            t(c.photoCredit, { author: gen.image_credit, license: gen.image_license ?? "" })
          )}
        </figcaption>
      )}
    </figure>
  );
}
