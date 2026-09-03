import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  light?: boolean;
}

export default function Logo({ className = "h-14 sm:h-16 md:h-20 w-auto object-contain cursor-pointer" }: LogoProps) {
  const [imgSrc, setImgSrc] = useState<string>('/logo.png');
  const [hasError, setHasError] = useState<boolean>(false);

  const handleError = () => {
    if (imgSrc === '/logo.png') {
      setImgSrc('/logo/logo.png');
    } else if (imgSrc === '/logo/logo.png') {
      setImgSrc('/logo-1.png');
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className="flex items-center gap-2.5" id="main-pcs-logo-text">
        <span className="font-black text-2xl md:text-3xl tracking-tight text-slate-900">PCS</span>
        <div className="flex flex-col leading-tight text-left">
          <span className="text-xs md:text-sm font-bold text-blue-600">Professional</span>
          <span className="text-[10px] md:text-xs font-semibold text-slate-500">Computer Services</span>
        </div>
      </div>
    );
  }

  return (
    <img 
      src={imgSrc} 
      alt="Professional Computer Services" 
      className={className}
      onError={handleError}
      id="main-pcs-logo-img"
    />
  );
}

