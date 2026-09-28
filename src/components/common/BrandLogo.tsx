import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BrandLogoProps {
  variant?: 'light' | 'dark';
  className?: string;
  mobileIcon?: boolean;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ 
  variant, 
  className = '', 
  mobileIcon = false 
}) => {
  const forceLight = variant === 'light';
  const forceDark = variant === 'dark';

  return (
    <Link href="/" className={`brand-logo-wrapper ${mobileIcon ? 'has-mobile-icon' : ''} ${className}`}>
      
      {!forceDark && (
        <Image
          src="/assets/images/logo/property-planet-logo-light.png"
          alt="PROPERty PLANet"
          width={210}
          height={60}
          className={`logo-main ${forceLight ? '' : 'theme-light-only'}`}
          priority
        />
      )}

      {!forceLight && (
        <Image
          src="/assets/images/logo/property-planet-logo-dark.png"
          alt="PROPERty PLANet"
          width={210}
          height={60}
          className={`logo-main ${forceDark ? '' : 'theme-dark-only'}`}
          priority
        />
      )}

      {mobileIcon && (
        <Image
          src="/assets/images/logo/property-planet-mark.png"
          alt="PROPERty PLANet Icon"
          width={50}
          height={50}
          className="logo-mark"
          priority
        />
      )}
    </Link>
  );
};

export default BrandLogo;
