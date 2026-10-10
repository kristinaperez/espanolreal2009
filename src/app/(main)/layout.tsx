import type { ReactNode } from "react";
import { LocaleRoot } from "../root-shell";
export { metadata, viewport } from "../root-shell";
export default function MainLayout({ children }: { children: ReactNode }) { return <LocaleRoot>{children}</LocaleRoot>; }
