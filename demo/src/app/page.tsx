import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Task Manager
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          A simple task management application built with Next.js, Prisma, and
          the AI-DLC methodology.
        </p>
        <Link href="/tasks">
          <Button size="lg">Go to Tasks</Button>
        </Link>
      </div>
    </main>
  );
}
