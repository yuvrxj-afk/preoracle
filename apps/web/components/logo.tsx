import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
}

export function LogoIcon({ size = 48, className = "" }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Preoracle"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      priority
    />
  );
}

export function LogoFull({ size = 32, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.png"
        alt="Preoracle"
        width={size}
        height={size}
        className="object-contain"
        priority
      />
      <span className="text-xl font-black text-[#ba9eff] font-manrope tracking-tighter">
        Preoracle
      </span>
    </div>
  );
}
