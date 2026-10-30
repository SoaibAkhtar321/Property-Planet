import React from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  variant?: 'light' | 'dark';
  className?: string;
  mobileIcon?: boolean;
  size?: string;
  animate?: boolean;
  priority?: boolean;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ 
  variant, 
  className = '', 
  mobileIcon = false,
  size = '',
  animate = false,
  priority = true
}) => {
  const forceLight = variant === 'light';
  const forceDark = variant === 'dark';

  return (
    // A <span>, not a <Link>: every caller already wraps the logo in its own
    // link (some to /admin or /dashboard). A link inside a link is invalid
    // HTML and caused a hydration error on every page.
    <span className={`brand-logo-wrapper ${mobileIcon ? 'has-mobile-icon' : ''} ${size ? `size-${size}` : ''} ${className}`}>
      
      {!forceDark && (
        <Image
          src="/assets/images/logo/property-planet-logo-light-v2.svg"
          alt="PROPERty PLANet"
          width={210}
          height={60}
          className={`logo-main ${forceLight ? '' : 'theme-light-only'} ${animate ? 'animate-logo' : ''}`}
          priority={priority}
        />
      )}

      {!forceLight && (
        <Image
          src="/assets/images/logo/property-planet-logo-dark-v2.svg"
          alt="PROPERty PLANet"
          width={210}
          height={60}
          className={`logo-main ${forceDark ? '' : 'theme-dark-only'} ${animate ? 'animate-logo' : ''}`}
          priority={priority}
        />
      )}

      {mobileIcon && (
        <Image
          src="/assets/images/logo/property-planet-mark-v2.svg"
          alt="PROPERty PLANet Icon"
          width={50}
          height={50}
          className="logo-mark"
          priority={priority}
        />
      )}
    </span>
  );
};

export default BrandLogo;
