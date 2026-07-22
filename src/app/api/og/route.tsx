import { ImageResponse } from 'next/og';
import { decodeRoast } from '@/lib/share';
import { getScoreTheme } from '@/lib/score';

export const runtime = 'nodejs';

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roast = decodeRoast(searchParams.get('s'));

  const score = roast ? roast.score : null;
  const theme = roast ? getScoreTheme(roast.score) : { color: '#f43f5e', label: 'Roast My Resume', key: 'reject' as const };
  const bullet = roast ? roast.bullet : 'Grade a resume bullet in seconds and let a cynical AI recruiter react.';
  const shownBullet = bullet.length > 150 ? `${bullet.slice(0, 147)}...` : bullet;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#07080a',
          backgroundImage:
            'radial-gradient(circle at 15% 0%, rgba(244,63,94,0.14) 0%, transparent 45%), radial-gradient(circle at 100% 100%, rgba(251,146,60,0.10) 0%, transparent 45%)',
          padding: '64px 72px',
          color: '#f0f3f6',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 26, letterSpacing: 2, color: '#9aa5b1' }}>
          ROAST MY RESUME
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', color: theme.color }}>
            <span style={{ fontSize: 200, fontWeight: 800, lineHeight: 1 }}>{score ?? 0}</span>
            <span style={{ fontSize: 56, fontWeight: 700, color: '#626f7a', marginLeft: 8 }}>/100</span>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 34,
              fontWeight: 700,
              color: theme.color,
              padding: '10px 22px',
              borderRadius: 16,
              border: `2px solid ${theme.color}`,
              marginBottom: 24,
            }}
          >
            {theme.label}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 30,
            lineHeight: 1.4,
            color: '#d1d5db',
            fontStyle: 'italic',
            borderLeft: '4px solid #626f7a',
            paddingLeft: 24,
          }}
        >
          {`"${shownBullet}"`}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 26, color: '#9aa5b1' }}>
          <span style={{ display: 'flex' }}>Think you can do better?</span>
          <span style={{ display: 'flex', color: '#f0f3f6', fontWeight: 600 }}>Grade your own bullet {'>'}</span>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );
}
