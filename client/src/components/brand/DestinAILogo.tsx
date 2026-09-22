import { useTheme } from '@/context/ThemeContext';

interface DestinAILogoProps {
  variant?: 'horizontal' | 'vertical' | 'compact' | 'icon' | 'sidebar';
  height?: number;
  className?: string;
  forceTheme?: 'light' | 'dark';
}

/**
 * Official DestinAI branding component.
 *
 * The frontend uses transparent, theme-specific derivatives of the supplied
 * official brand assets so the logo visually merges into both light and dark
 * surfaces without a baked-in white/navy rectangle.
 */
export function DestinAILogo({
  variant = 'compact',
  height,
  className = '',
  forceTheme,
}: DestinAILogoProps) {
  const { resolvedTheme } = useTheme();
  const theme = forceTheme ?? resolvedTheme;

  const config: Record<string, { src: string; alt: string; defaultH: number }> = {
    horizontal: {
      src: `/branding/logos/destinai-horizontal-${theme}-transparent.png`,
      alt: 'DestinAI',
      defaultH: 42,
    },
    vertical: {
      src: `/branding/logos/destinai-vertical-${theme}-transparent.png`,
      alt: 'DestinAI — Shape Your Future with AI.',
      defaultH: 150,
    },
    compact: {
      src: `/branding/logos/destinai-compact-${theme}-transparent.png`,
      alt: 'DestinAI',
      defaultH: 34,
    },
    sidebar: {
      src: `/branding/logos/destinai-horizontal-${theme}-transparent.png`,
      alt: 'DestinAI',
      defaultH: 38,
    },
    icon: {
      src: '/branding/icons/destinai-icon-transparent.png',
      alt: 'DestinAI',
      defaultH: 48,
    },
  };

  const { src, alt, defaultH } = config[variant] ?? config.compact;
  const h = height ?? defaultH;

  return (
    <img
      src={src}
      alt={alt}
      height={h}
      className={className}
      style={{ height: h, width: 'auto', maxWidth: '100%', display: 'block', objectFit: 'contain' }}
      draggable={false}
    />
  );
}

export function DestinAIIcon({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/branding/icons/destinai-icon-transparent.png"
      alt="DestinAI"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
      className={className}
      draggable={false}
    />
  );
}
