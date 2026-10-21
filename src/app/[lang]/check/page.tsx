import { Suspense } from "react";
import { CheckCar } from "@/components/CheckCar";
import { getDictionary } from "../dictionaries";

export default async function CheckPage({ params }: PageProps<"/[lang]/check">) {
  const { lang, dict } = await getDictionary((await params).lang);
  return (
    <Suspense>
      <CheckCar lang={lang} dict={dict} />
    </Suspense>
  );
}
