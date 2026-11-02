"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Newspaper } from "lucide-react";
import { button } from "@/components/ui";
import { carLinks, type CarLinkInput } from "@/lib/carLinks";
import type { Dict } from "@/lib/i18n";

/** Promote Slovenian road tests to visitors in Slovenia, in either UI language. */
export function CarTestButton({ car, dict }: { car: CarLinkInput; dict: Dict }) {
  const test = carLinks(car).find((link) => link.id === "tests" && link.exact);
  const hasTest = !!test;
  const [inSlovenia, setInSlovenia] = useState(false);

  useEffect(() => {
    if (!hasTest) return;
    const controller = new AbortController();
    fetch("/api/visitor-country/", { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!controller.signal.aborted) setInSlovenia(data?.country === "SI");
      })
      .catch(() => { /* Keep the shortcut hidden when location is unavailable. */ });
    return () => controller.abort();
  }, [hasTest]);

  if (!test || !inSlovenia) return null;
  return (
    <a href={test.url} target="_blank" rel="noopener noreferrer" className={button("secondary", { small: true })} title={dict.carInfo.link.tests.label}>
      <Newspaper className="size-4" aria-hidden />
      {dict.carInfo.linkKind.test} · {dict.carInfo.link.tests.label}
      <ExternalLink className="size-3.5" aria-hidden />
    </a>
  );
}
