"use client";

interface PageLoaderProps {
  text?: string;
}

export function PageLoader({ text = "Loading..." }: PageLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-10 pointer-events-none"
        style={{ backgroundImage: 'url(/assets/SumiSumi.jpg)' }}
      />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="spinner-blue" />
        <p className="text-[#1A2A3A] font-medium tracking-wide">{text}</p>
      </div>
    </div>
  );
}
