import type { ReactNode } from "react";
import { LocaleRoot } from "../root-shell";
export { metadata, viewport } from "../root-shell";
export default function RussianContentLayout({ children }: { children: ReactNode }) {
  return <LocaleRoot language="ru">{children}</LocaleRoot>;
}
