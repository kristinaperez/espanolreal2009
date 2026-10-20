export function ArticleBody({ body }: { body: string }) {
  return <div className="space-y-5 break-words leading-8">{body.split(/\n\s*\n/).map((block, i) => {
    if (block.startsWith("## ")) return <h2 key={i} className="pt-4 text-2xl font-extrabold">{block.slice(3)}</h2>;
    if (block.startsWith("### ")) return <h3 key={i} className="pt-3 text-xl font-bold">{block.slice(4)}</h3>;
    return <p key={i} className="whitespace-pre-wrap">{block}</p>;
  })}</div>;
}
