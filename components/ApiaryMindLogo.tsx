import Image from 'next/image';

interface ApiaryMindLogoProps {
  className?: string;
}

export default function ApiaryMindLogo({ className }: ApiaryMindLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <span className="text-text-dark dark:text-amber-50 font-bold tracking-tight text-xl">
        Apiary
      </span>
      <Image src="/assets/bee-3d-icon.png" alt="ApiaryMind" width={32} height={32} />
      <span className="text-primary font-bold tracking-tight text-xl">Mind</span>
    </div>
  );
}
