'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, Plus } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        {/* Placeholder for page title, can be dynamic based on route later */}
        <h1 className="text-lg font-semibold text-card-foreground">Overview</h1>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-muted-foreground"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Link href="/applications/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="mr-2 h-4 w-4" />
          Add Application
        </Link>
      </div>
    </header>
  );
}
