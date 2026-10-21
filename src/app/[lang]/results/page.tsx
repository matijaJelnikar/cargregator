import { Suspense } from "react";
import { ResultsView } from "@/components/ResultsView";
import { getDictionary } from "../dictionaries";

export default async function ResultsPage({ params }: PageProps<"/[lang]/results">) {
  const { lang, dict } = await getDictionary((await params).lang);
  return (
    <Suspense>
      <ResultsView lang={lang} dict={dict} />
    </Suspense>
  );
}
