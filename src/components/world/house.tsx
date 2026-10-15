import type { ReactNode } from "react";

const names = ["Фундамент", "Стены", "Крыша", "Дверь", "Первое окно", "Второе окно", "Ступеньки", "Крыльцо", "Свет в окнах", "Табличка «Мой дом»"];
export function House({ count }: { count: number }) {
  function part(index: number, children: ReactNode) {
    return <g key={index} data-built={count > index} className={count > index ? "world-built" : "world-outline"}><title>{names[index]}{count > index ? " — построено" : " — впереди"}</title>{children}</g>;
  }
  return <svg viewBox="0 0 600 390" role="img" aria-label={`Твой дом: ${count} из 10 деталей`} className="world-house">
    <ellipse cx="300" cy="333" rx="235" ry="31" fill="var(--success-soft)" />
    <circle cx="480" cy="65" r="27" fill="var(--success-soft)" />
    <path d="M65 95h65m-40-12h70M450 140h70" stroke="var(--border)" strokeWidth="8" strokeLinecap="round" />
    {part(0, <rect x="155" y="302" width="290" height="21" rx="8" fill="var(--muted)" />)}
    {part(1, <path d="M175 178H425V304H175Z" fill="var(--surface)" stroke="var(--primary-strong)" strokeWidth="3" />)}
    {part(2, <path d="M145 181L300 65L455 181Z" fill="var(--primary)" stroke="var(--primary-strong)" strokeWidth="5" strokeLinejoin="round" />)}
    {part(3, <><path d="M270 304V235Q300 201 330 235V304Z" fill="var(--primary-strong)" /><circle cx="316" cy="266" r="4" fill="var(--surface)" /></>)}
    {part(4, <><rect x="199" y="209" width="47" height="52" rx="7" fill="var(--accent)" /><path d="M222 211v48m-21-24h43" stroke="var(--surface)" strokeWidth="4" /></>)}
    {part(5, <><rect x="354" y="209" width="47" height="52" rx="7" fill="var(--accent)" /><path d="M377 211v48m-21-24h43" stroke="var(--surface)" strokeWidth="4" /></>)}
    {part(6, <><rect x="258" y="305" width="84" height="13" rx="3" fill="var(--muted)" /><rect x="246" y="320" width="108" height="12" rx="3" fill="var(--muted)" /></>)}
    {part(7, <><path d="M257 303V226M343 303V226M249 226H351L300 199Z" fill="var(--primary)" stroke="var(--primary-strong)" strokeWidth="5" strokeLinejoin="round" /></>)}
    {part(8, <><rect x="206" y="216" width="33" height="38" rx="3" fill="var(--success-soft)" /><rect x="361" y="216" width="33" height="38" rx="3" fill="var(--success-soft)" /><path d="M222 216v38m-16-19h33M377 216v38m-16-19h33" stroke="var(--surface)" strokeWidth="3" /></>)}
    {part(9, <><rect x="247" y="158" width="106" height="29" rx="8" fill="var(--surface)" /><text x="300" y="178" textAnchor="middle" fill="var(--primary-strong)" fontSize="16" fontWeight="bold">Мой дом</text></>)}
    <path d="M105 322v-27m-12 8 12 8 13-16M490 324v-34m-12 10 12 11 14-19" stroke="var(--success)" strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>;
}
