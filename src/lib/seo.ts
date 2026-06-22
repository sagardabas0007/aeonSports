import { Metadata } from 'next';

/**
 * Default SEO configuration
 */
export const defaultMetadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://aeonsports.com'),
  title: {
    default: 'AeonSports - AI-Powered Sports Tokenization',
    template: '%s | AeonSports',
  },
  description:
    'Transform football moments into tradeable tokens. AI-powered analysis of FIFA matches launching tokens on Base blockchain via Clanker and Flaunch.',
  keywords: [
    'sports tokenization',
    'FIFA tokens',
    'Base blockchain',
    'sports crypto',
    'football tokens',
    'AI sports analysis',
    'Clanker',
    'Flaunch',
    'Base network',
    'sports NFT',
  ],
  authors: [{ name: 'AeonSports Team' }],
  creator: 'AeonSports',
  publisher: 'AeonSports',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'AeonSports - AI-Powered Sports Tokenization',
    description:
      'Transform football moments into tradeable tokens. AI-powered analysis of FIFA matches launching tokens on Base blockchain.',
    siteName: 'AeonSports',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AeonSports - AI-Powered Sports Tokenization',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AeonSports - AI-Powered Sports Tokenization',
    description:
      'Transform football moments into tradeable tokens. AI-powered analysis of FIFA matches launching tokens on Base blockchain.',
    images: ['/twitter-image.png'],
    creator: '@aeonsports',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

/**
 * Generate metadata for match page
 */
export function generateMatchMetadata(match: {
  id: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
}): Metadata {
  const title = `${match.home_team} vs ${match.away_team}`;
  const score = match.home_score !== null ? `${match.home_score}-${match.away_score}` : 'Live';
  const description = `Watch ${match.home_team} vs ${match.away_team} - ${score}. AI analysis and player tokens on Base blockchain.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${process.env.NEXT_PUBLIC_APP_URL}/match/${match.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

/**
 * Generate JSON-LD structured data
 */
export function generateStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'AeonSports',
    description:
      'AI-powered sports tokenization platform transforming football moments into tradeable tokens on Base blockchain.',
    url: process.env.NEXT_PUBLIC_APP_URL,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    creator: {
      '@type': 'Organization',
      name: 'AeonSports',
    },
  };
}
