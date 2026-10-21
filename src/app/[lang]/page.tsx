import { Suspense } from "react";
import { SearchForm } from "@/components/SearchForm";
import { getDictionary } from "./dictionaries";

export default async function SearchPage({ params }: PageProps<"/[lang]">) {
  const { lang, dict } = await getDictionary((await params).lang);
  return (
    <Suspense>
      <SearchForm lang={lang} dict={dict} />
    </Suspense>
  );
}
