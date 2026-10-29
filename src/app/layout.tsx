import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Impact Tank | Live Pitch & Team Feedback',
  description:
    'Real-time anonymous feedback and voting platform for event pitches, showcase teams, and audience choice awards.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
