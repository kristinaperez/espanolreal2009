import type { Metadata } from "next";
import Link from "next/link";
import { publishedStories } from "@/lib/stories";
export const metadata: Metadata = {title:"100 причин выучить испанский | EspañolReal",description:"Настоящие причины учить испанский: семья, переезд, работа и жизнь в Испании.",alternates:{canonical:"https://espanolreal.es/ru/100-prichin-uchit-ispanskiy/"}};
export default function StoriesIndex(){return <main className="mx-auto max-w-3xl px-5 py-12"><h1 className="text-3xl font-bold">100 причин выучить испанский</h1><p className="mt-4">Истории о том, зачем нам нужен живой испанский.</p><div className="mt-8 grid gap-6">{publishedStories.map(s=><article key={s.slug} className="rounded-xl border p-5"><h2 className="text-xl font-semibold"><Link href={`/ru/zachem-uchit-ispanskiy/${s.slug}`}>{s.title}</Link></h2><p className="mt-2">{s.intro}</p></article>)}</div></main>}
