import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BrandLogoProps {
  variant?: 'light' | 'dark';
  className?: string;
  mobileIcon?: boolean;
  size?: string;
  animate?: boolean; // Added to fix the AnimatedBrandLogo TS error
  priority?: boolean; // Added to fix the AnimatedBrandLogo TS error
}

const BrandLogo: React.FC<BrandLogoProps> = ({ 
  variant, 
  className = '', 
  mobileIcon = false,
  size = '',
  animate,
  priority
}) => {
  const forceLight = variant === 'light';
  const forceDark = variant === 'dark';

  return (
    <Link href="/" className={`brand-logo-wrapper ${mobileIcon ? 'has-mobile-icon' : ''} ${size ? `size-${size}` : ''} ${className}`}>
      
      {!forceDark && (
        <Image
          src="/assets/images/logo/property-planet-logo-light.svg"
          alt="PROPERty PLANet"
          width={210}
          height={60}
          className={`logo-main ${forceLight ? '' : 'theme-light-only'} ${animate ? 'animate-logo' : ''}`}
          priority={priority || true}
        />
      )}

      {!forceLight && (
        <Image
          src="/assets/images/logo/property-planet-logo-dark.svg"
          alt="PROPERty PLANet"
          width={210}
          height={60}
          className={`logo-main ${forceDark ? '' : 'theme-dark-only'} ${animate ? 'animate-logo' : ''}`}
          priority={priority || true}
        />
      )}

      {mobileIcon && (
        <Image
          src="/assets/images/logo/property-planet-mark.svg"
          alt="PROPERty PLANet Icon"
          width={50}
          height={50}
          className="logo-mark"
          priority={priority || true}
        />
      )}
    </Link>
  );
};

export default BrandLogo;