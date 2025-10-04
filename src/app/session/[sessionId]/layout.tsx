
import { ReactNode } from 'react';

// This layout is minimal because the session page is a full-screen experience
// and does not need the standard dashboard navigation.
export default function SessionLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
