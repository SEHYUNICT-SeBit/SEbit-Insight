// ============================================================
// SEbit Insight v1.0 - Auth Routes
// GET /api/auth/me, POST /api/auth/dev-login, GET /api/auth/login,
// GET /api/auth/callback, POST /api/auth/logout
// ============================================================

import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { AppBindings, AuthUser } from '../types';

const route = new Hono<AppBindings>();

/**
 * GET /api/auth/me
 * 현재 로그인 사용자 정보 반환
 * (authMiddleware를 통해 c.get('user') 세팅 필요)
 */
route.get('/me', async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'UNAUTHORIZED', message: 'Not authenticated' }, 401);
    }

    // 부서 정보 포함하여 직원 조회
    const employee = await c.env.DB
      .prepare(
        `SELECT e.id, e.name, e.email, e.department_id,
                d.name AS department_name,
                e.position, e.role, e.is_active
         FROM employees e
         LEFT JOIN departments d ON e.department_id = d.id
         WHERE e.id = ? AND e.is_active = 1`
      )
      .bind(user.id)
      .first();

    if (!employee) {
      return c.json({ error: 'NOT_FOUND', message: 'User not found' }, 404);
    }

    return c.json({ data: employee });
  } catch (err) {
    console.error('GET /auth/me error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * POST /api/auth/dev-login
 * 개발 환경 전용 로그인 (production에서는 비활성화)
 * Body: { email: string }
 */
route.post('/dev-login', async (c) => {
  // 프로덕션 환경에서는 사용 불가
  if (c.env.ENVIRONMENT === 'production') {
    return c.json({ error: 'FORBIDDEN', message: 'Dev login is not available in production' }, 403);
  }

  try {
    const body = await c.req.json<{ email: string }>();

    if (!body.email) {
      return c.json({ error: 'VALIDATION_ERROR', message: 'email is required' }, 400);
    }

    // 이메일로 직원 조회
    const employee = await c.env.DB
      .prepare(
        `SELECT e.id, e.name, e.email, e.department_id,
                d.name AS department_name,
                e.position, e.role, e.is_active
         FROM employees e
         LEFT JOIN departments d ON e.department_id = d.id
         WHERE e.email = ? AND e.is_active = 1`
      )
      .bind(body.email)
      .first();

    if (!employee) {
      return c.json({ error: 'NOT_FOUND', message: 'Employee not found with this email' }, 404);
    }

    // 세션 생성 (24시간 유효)
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await c.env.DB
      .prepare(
        'INSERT INTO sessions (id, employee_id, expires_at) VALUES (?, ?, ?)'
      )
      .bind(sessionId, (employee as any).id, expiresAt)
      .run();

    // httpOnly 세션 쿠키 설정
    const isProduction = c.env.ENVIRONMENT === 'production';
    setCookie(c, 'session_id', sessionId, {
      httpOnly: true,
      sameSite: 'Lax',
      path: '/',
      secure: isProduction,
      maxAge: 24 * 60 * 60, // 24시간
    });

    return c.json({ data: employee });
  } catch (err) {
    console.error('POST /auth/dev-login error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

/**
 * GET /api/auth/login
 * 네이버 웍스 OAuth2 로그인 시작 또는 프론트엔드 로그인 페이지로 리다이렉트
 */
route.get('/login', async (c) => {
  const clientId = c.env.NW_CLIENT_ID;
  const redirectUri = c.env.NW_REDIRECT_URI;

  if (clientId && redirectUri) {
    // 네이버 웍스 OAuth2 인증 시작
    const authUrl = new URL('https://auth.worksmobile.com/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'profile');

    return c.redirect(authUrl.toString());
  }

  // 네이버 웍스 미설정 시 프론트엔드 로그인 페이지로 리다이렉트
  const frontendUrl = c.env.FRONTEND_URL || 'http://localhost:3100';
  return c.redirect(`${frontendUrl}/login`);
});

/**
 * GET /api/auth/callback
 * 네이버 웍스 OAuth2 콜백 - 인가 코드를 토큰으로 교환
 */
route.get('/callback', async (c) => {
  const code = c.req.query('code');
  const frontendUrl = c.env.FRONTEND_URL || 'http://localhost:3100';

  if (!code) {
    return c.redirect(`${frontendUrl}/login?error=missing_code`);
  }

  const clientId = c.env.NW_CLIENT_ID;
  const clientSecret = c.env.NW_CLIENT_SECRET;
  const redirectUri = c.env.NW_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return c.redirect(`${frontendUrl}/login?error=oauth_not_configured`);
  }

  try {
    // 인가 코드를 액세스 토큰으로 교환
    const tokenResponse = await fetch('https://auth.worksmobile.com/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return c.redirect(`${frontendUrl}/login?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json() as { access_token: string };

    // 사용자 프로필 조회
    const profileResponse = await fetch('https://www.worksapis.com/v1.0/users/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileResponse.ok) {
      console.error('Profile fetch failed:', await profileResponse.text());
      return c.redirect(`${frontendUrl}/login?error=profile_fetch_failed`);
    }

    const profile = await profileResponse.json() as {
      userId: string;
      userName: { lastName?: string; firstName?: string };
      email?: string;
    };

    const email = profile.email || `${profile.userId}@lineworks`;
    const name = `${profile.userName?.lastName || ''}${profile.userName?.firstName || ''}`.trim() || profile.userId;

    // 직원 조회 (nw_user_id 또는 이메일로)
    let employee = await c.env.DB
      .prepare('SELECT id, name, role FROM employees WHERE nw_user_id = ? AND is_active = 1')
      .bind(profile.userId)
      .first<AuthUser>();

    if (!employee) {
      employee = await c.env.DB
        .prepare('SELECT id, name, role FROM employees WHERE email = ? AND is_active = 1')
        .bind(email)
        .first<AuthUser>();
    }

    if (!employee) {
      // 신규 직원 자동 등록 (기본 role: user)
      const { generateId } = await import('../db/helpers');
      const newId = generateId('emp');

      await c.env.DB
        .prepare(
          `INSERT INTO employees (id, name, email, department_id, position, role, nw_user_id)
           VALUES (?, ?, ?, 'GENERAL', 'Staff', 'user', ?)`
        )
        .bind(newId, name, email, profile.userId)
        .run();

      employee = { id: newId, name, role: 'user' };
    } else {
      // nw_user_id 업데이트 (누락된 경우)
      await c.env.DB
        .prepare('UPDATE employees SET nw_user_id = ? WHERE id = ?')
        .bind(profile.userId, employee.id)
        .run();
    }

    // 세션 생성
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await c.env.DB
      .prepare('INSERT INTO sessions (id, employee_id, expires_at) VALUES (?, ?, ?)')
      .bind(sessionId, employee.id, expiresAt)
      .run();

    // 쿠키 설정
    const isProduction = c.env.ENVIRONMENT === 'production';
    setCookie(c, 'session_id', sessionId, {
      httpOnly: true,
      sameSite: 'Lax',
      path: '/',
      secure: isProduction,
      maxAge: 24 * 60 * 60,
    });

    return c.redirect(frontendUrl);
  } catch (err) {
    console.error('GET /auth/callback error:', err);
    return c.redirect(`${frontendUrl}/login?error=internal_error`);
  }
});

/**
 * POST /api/auth/logout
 * 로그아웃 - 세션 삭제 및 쿠키 제거
 */
route.post('/logout', async (c) => {
  try {
    const sessionId = getCookie(c, 'session_id');

    if (sessionId) {
      // DB에서 세션 삭제
      await c.env.DB
        .prepare('DELETE FROM sessions WHERE id = ?')
        .bind(sessionId)
        .run();
    }

    // 쿠키 제거
    deleteCookie(c, 'session_id', { path: '/' });

    return c.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('POST /auth/logout error:', err);
    return c.json({ error: 'INTERNAL_ERROR', message: 'Database error' }, 500);
  }
});

export default route;
