'use client';

import { ReactNode } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Web App همیشه در dark mode است (class="dark" در layout.tsx)
  // این کامپوننت فقط برای سازگاری با ساختار landing وجود دارد
  return <>{children}</>;
}
