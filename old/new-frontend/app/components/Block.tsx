import type { ReactNode } from 'react';

type BlockProps = {
  title: string;
  children: ReactNode;
};

export function Block({ title, children }: BlockProps) {
  return (
    <div className="w-60 h-auto top-20 bg-white rounded-xl border border-black text-center flex flex-col items-center justify-center p-4 gap-2">
      <h2 className="font-bold">{title}</h2>
      {children}
    </div>
  );
}