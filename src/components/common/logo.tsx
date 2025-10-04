import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/logo.svg"
        alt="Harthio Logo"
        width={32}
        height={32}
        priority
      />
      <span className="font-headline text-xl font-bold">Harthio</span>
    </div>
  );
}
