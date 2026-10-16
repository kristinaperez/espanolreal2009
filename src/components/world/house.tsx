import { useId, type ReactNode } from "react";

const names = ["Фундамент", "Стены", "Крыша", "Дверь", "Первое окно", "Второе окно", "Ступеньки", "Крыльцо", "Свет в окнах", "Табличка «Мой дом»"];

/** A Mediterranean casita. Construction order and reward count remain unchanged. */
export function House({ count }: { count: number }) {
  const patternId = useId();
  function part(index: number, children: ReactNode) {
    return <g key={index} data-built={count > index} className={count > index ? "world-built" : "world-outline"}><title>{`${names[index]}${count > index ? " — построено" : " — впереди"}`}</title>{children}</g>;
  }
  function windowFrame(x: number) {
    return <>
      <path d={`M${x} 255v-37q23-30 46 0v37Z`} fill="var(--house-glass)" stroke="var(--house-stone)" strokeWidth="6" />
      <g className="house-detail">
        <path d={`M${x-3} 212l-20-7v56l20-5Zm52 0 20-7v56l-20-5Z`} fill="var(--house-shutter)" stroke="var(--house-shutter-dark)" strokeWidth="2" />
        {[219,229,239,249].map(y => <path key={y} d={`M${x-19} ${y}l12 3m60-3 12-3`} stroke="var(--house-shutter-dark)" strokeWidth="2" />)}
        <path d={`M${x+23} 206v49m-21-25h42`} stroke="var(--house-stucco)" strokeWidth="3" />
        <path d={`M${x-4} 248h54v21h-54Zm10 0v21m11-21v21m11-21v21m11-21v21`} fill="none" stroke="var(--house-iron)" strokeWidth="2.5" strokeLinejoin="round" />
        <path d={`M${x-8} 271h62`} stroke="var(--house-stone)" strokeWidth="5" strokeLinecap="round" />
      </g>
    </>;
  }
  return <svg viewBox="0 0 600 390" role="img" aria-label={`Твой испанский дом: ${count} из 10 деталей`} className="world-house">
    <defs>
      <pattern id={patternId} width="24" height="18" patternUnits="userSpaceOnUse">
        <rect width="24" height="18" fill="var(--house-clay)" />
        <path d="M0 0v9q6 12 12 0V0m0 0v9q6 12 12 0V0" stroke="var(--house-clay-shadow)" strokeWidth="2" fill="none" />
        <path d="M3 2v6m12-6v6" stroke="var(--house-clay-light)" strokeWidth="2" strokeLinecap="round" />
      </pattern>
    </defs>
    <circle cx="475" cy="76" r="31" fill="var(--house-sun)" opacity=".85" />
    <path d="M35 106h54m-40-10h23M430 133h76" stroke="var(--house-cloud)" strokeWidth="7" strokeLinecap="round" />
    <path d="M18 301q70-60 150-16t180-7q88-47 235 17v48H18Z" fill="var(--house-hill)" opacity=".55" />
    <ellipse cx="300" cy="337" rx="238" ry="26" fill="var(--house-ground)" />
    {part(0, <>
      <rect x="151" y="306" width="298" height="19" rx="5" fill="var(--house-stone)" />
      <path className="house-detail" d="M155 315h288m-253-9v9m49 0v10m51-19v9m51 0v10m50-19v9" stroke="var(--house-stone-light)" strokeWidth="2" />
    </>)}
    {part(1, <>
      <path d="M166 177h268v129H166Z" fill="var(--house-stucco)" stroke="var(--house-stone-light)" strokeWidth="2" />
      <g className="house-detail">
        <path d="M421 180h13v126h-13Z" fill="var(--house-wall-shadow)" />
        <path d="M166 287h268v19H166Z" fill="var(--house-wall-shadow)" />
        <path d="M174 190h22m207 89h15m-241-4h9" stroke="var(--house-stone-light)" strokeWidth="3" strokeLinecap="round" />
      </g>
    </>)}
    {part(2, <>
      <path d="M141 182l31-66h256l31 66Z" fill={`url(#${patternId})`} stroke="var(--house-clay-shadow)" strokeWidth="4" strokeLinejoin="round" />
      <g className="house-detail">
        <path d="M382 113V78h27v35" fill="var(--house-stucco)" stroke="var(--house-stone-light)" strokeWidth="2" />
        <path d="M378 78h35m-235 35h244" stroke="var(--house-clay-shadow)" strokeWidth="7" strokeLinecap="round" />
        <path d="M145 183h310" stroke="var(--house-clay-shadow)" strokeWidth="7" strokeLinecap="round" />
        {Array.from({ length: 13 }, (_, i) => <path key={i} d={`M${150+i*24} 181q7 8 14 0`} stroke="var(--house-clay-light)" strokeWidth="3" fill="none" />)}
      </g>
    </>)}
    {part(3, <>
      <path d="M271 306v-67a29 29 0 0 1 58 0v67Z" fill="var(--house-wood)" stroke="var(--house-stone)" strokeWidth="7" />
      <g className="house-detail">
        <path d="M281 235v69m12-83v83m13-83v83m13-69v69" stroke="var(--house-wood-dark)" strokeWidth="2" />
        <path d="M276 259h48m-48 31h48" stroke="var(--house-iron)" strokeWidth="4" />
        <circle cx="316" cy="274" r="4" fill="var(--house-sun)" />
      </g>
    </>)}
    {part(4, windowFrame(199))}
    {part(5, windowFrame(355))}
    {part(6, <>
      <path d="M263 307h74v12h-74Zm-12 12h98v12h-98Zm-12 12h122v10H239Z" fill="var(--house-stone)" stroke="var(--house-stone-light)" strokeWidth="2" strokeLinejoin="round" />
      <path className="house-detail" d="M270 311h60m-72 12h84m-96 12h108" stroke="var(--house-stucco)" strokeWidth="2" />
    </>)}
    {part(7, <>
      <path d="M258 307v-84m84 84v-84M253 224h94l-7-17h-80Z" fill="var(--house-clay)" stroke="var(--house-wood-dark)" strokeWidth="4" strokeLinejoin="round" />
      <g className="house-detail">
        <path d="M259 210h82m-65-2-3 15m16-15-1 15m16-15 1 15m12-15 3 15" stroke="var(--house-clay-shadow)" strokeWidth="2" />
        {[181,419].map(x => <g key={x}>
          <path d={`M${x-13} 303h26l-4 27h-18Z`} fill="var(--house-clay)" stroke="var(--house-clay-shadow)" strokeWidth="2" />
          <path d={`M${x} 306v-24m0 16-11-9m11 3 10-12`} stroke="var(--house-leaf)" strokeWidth="3" fill="none" />
          {[-9,1,10].map((dx,i) => <circle key={dx} cx={x+dx} cy={282+i%2*5} r="5" fill="var(--house-flower)" />)}
        </g>)}
      </g>
    </>)}
    {part(8, <>
      <path d="M204 242v-23q18-23 36 0v23Zm156 0v-23q18-23 36 0v23Z" fill="var(--house-lamplight)" />
      <g className="house-detail">
        <path d="M222 207v35m-18-13h36m138-22v35m-18-13h36" stroke="var(--house-stucco)" strokeWidth="3" />
        <path d="M349 232h17m-8-8v8m-7 1h14l-2 18h-10Z" fill="var(--house-lamplight)" stroke="var(--house-iron)" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M348 256l-6 4m27-4 6 4" stroke="var(--house-lamplight)" strokeWidth="3" strokeLinecap="round" />
      </g>
    </>)}
    {part(9, <>
      <rect x="254" y="157" width="92" height="35" rx="4" fill="var(--house-stucco)" stroke="var(--house-tile)" strokeWidth="2" />
      <g className="house-detail" fill="var(--house-tile)">
        <path d="M257 160h86v29h-86Z" fill="none" stroke="var(--house-tile)" strokeWidth="1" />
        <text x="300" y="180" textAnchor="middle" fontSize="16" fontFamily="Georgia, serif" fontStyle="italic">Mi casa</text>
        {[260,340].map(x => <path key={x} d={`M${x} 172l3 3-3 3-3-3Z`} />)}
      </g>
    </>)}
  </svg>;
}
