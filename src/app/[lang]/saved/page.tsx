import { SavedList } from "@/components/SavedList";
import { getDictionary } from "../dictionaries";

export default async function SavedPage({ params }: PageProps<"/[lang]/saved">) {
  const { lang, dict } = await getDictionary((await params).lang);
  return <SavedList lang={lang} dict={dict} />;
}
