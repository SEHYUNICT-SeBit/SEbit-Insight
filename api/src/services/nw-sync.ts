// ============================================================
// SEbit Insight v1.0 - 네이버 웍스 Employee Sync Service
// ============================================================

import type { Env, SyncResult } from '../types';
import { generateId, nowISO } from '../db/helpers';

// ---------- 네이버 웍스 API Types ----------
interface NwUserName {
  lastName: string;
  firstName: string;
}

interface NwOrgUnit {
  orgUnitId: string;
  orgUnitName: string;
  positionName?: string;
  primary?: boolean;
}

interface NwOrganization {
  primary?: boolean;
  levelName?: string;
  orgUnits?: NwOrgUnit[];
}

interface NwUser {
  userId: string;
  email: string;
  userName: NwUserName;
  organizations?: NwOrganization[];
}

// ---------- Department name -> ID mapping ----------
const DEPT_NAME_MAP: Record<string, string> = {
  'SE 사업부': 'SE',
  'SM 사업부': 'SM',
  'AI 인프라 사업부': 'AI',
  'AI 사업부': 'AI',
  '콘텐츠 사업부': 'CONTENT',
  'R&D Lab': 'RND',
  'R&D 연구소': 'RND',
  '경영기획그룹': 'MGMT',
  'SE': 'SE',
  'SM': 'SM',
  'AI': 'AI',
  'CONTENT': 'CONTENT',
  'RND': 'RND',
  'MGMT': 'MGMT',
};

// ---------- Dev Mode Sample Data ----------
const SAMPLE_EMPLOYEES = [
  { userId: 'nw_se_001', email: 'jhpark@sehyunict.com',  name: '박준혁', dept: 'SE', position: '부장' },
  { userId: 'nw_se_002', email: 'yjkim@sehyunict.com',   name: '김유진', dept: 'SE', position: '과장' },
  { userId: 'nw_se_003', email: 'swlee@sehyunict.com',   name: '이성우', dept: 'SE', position: '대리' },
  { userId: 'nw_se_004', email: 'mjchoi@sehyunict.com',  name: '최민준', dept: 'SE', position: '사원' },
  { userId: 'nw_sm_001', email: 'hsyoon@sehyunict.com',  name: '윤현수', dept: 'SM', position: '차장' },
  { userId: 'nw_sm_002', email: 'ehjung@sehyunict.com',  name: '정은희', dept: 'SM', position: '과장' },
  { userId: 'nw_sm_003', email: 'kwhan@sehyunict.com',   name: '한기원', dept: 'SM', position: '사원' },
  { userId: 'nw_ai_001', email: 'tkoh@sehyunict.com',    name: '고태경', dept: 'AI', position: '이사' },
  { userId: 'nw_ai_002', email: 'syback@sehyunict.com',  name: '백서연', dept: 'AI', position: '대리' },
  { userId: 'nw_ai_003', email: 'jsnam@sehyunict.com',   name: '남지수', dept: 'AI', position: '사원' },
  { userId: 'nw_ct_001', email: 'mrshin@sehyunict.com',  name: '신민래', dept: 'CONTENT', position: '과장' },
  { userId: 'nw_ct_002', email: 'yhkang@sehyunict.com',  name: '강유현', dept: 'CONTENT', position: '사원' },
  { userId: 'nw_rnd_001', email: 'djlim@sehyunict.com',  name: '임동준', dept: 'RND', position: '부장' },
  { userId: 'nw_rnd_002', email: 'hsjeon@sehyunict.com', name: '전혜선', dept: 'RND', position: '차장' },
  { userId: 'nw_rnd_003', email: 'wbseo@sehyunict.com',  name: '서원범', dept: 'RND', position: '대리' },
];

// ---------- JWT Generation (Web Crypto API, RS256) ----------
async function generateServiceAccountJwt(env: Env): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: env.NW_CLIENT_ID,
    sub: env.NW_SERVICE_ACCOUNT_ID,
    iat: now,
    exp: now + 3600,
  };

  const b64url = (obj: object) => {
    const json = JSON.stringify(obj);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    return b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  };

  const signingInput = `${b64url(header)}.${b64url(payload)}`;

  // Import RSA private key (PKCS#8 PEM format)
  const pem = env.NW_PRIVATE_KEY!
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '')
    .replace(/\s+/g, '');

  const binaryDer = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signingInput)
  );

  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signingInput}.${signature}`;
}

// ---------- Get Access Token ----------
async function getAccessToken(jwt: string, env: Env): Promise<string> {
  const resp = await fetch('https://auth.worksmobile.com/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      assertion: jwt,
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      client_id: env.NW_CLIENT_ID!,
      client_secret: env.NW_CLIENT_SECRET!,
      scope: 'user.read',
    }).toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token exchange failed: ${resp.status} ${text}`);
  }

  const data = (await resp.json()) as { access_token: string };
  return data.access_token;
}

// ---------- Fetch All Users (cursor pagination) ----------
async function fetchAllUsers(accessToken: string): Promise<NwUser[]> {
  const users: NwUser[] = [];
  let cursor: string | undefined;

  do {
    const url = new URL('https://www.worksapis.com/v1.0/users');
    url.searchParams.set('count', '100');
    if (cursor) url.searchParams.set('cursor', cursor);

    const resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Users fetch failed: ${resp.status} ${text}`);
    }

    const data = (await resp.json()) as {
      users: NwUser[];
      responseMetaData?: { nextCursor?: string };
    };

    users.push(...data.users);
    cursor = data.responseMetaData?.nextCursor;
  } while (cursor);

  return users;
}

// ---------- Map 네이버 웍스 user to employee fields ----------
function mapNwUser(user: NwUser) {
  const org = user.organizations?.find((o) => o.primary) || user.organizations?.[0];
  const orgUnit = org?.orgUnits?.find((u) => u.primary) || org?.orgUnits?.[0];

  const name = `${user.userName.lastName}${user.userName.firstName}`;
  const departmentId = orgUnit?.orgUnitName ? DEPT_NAME_MAP[orgUnit.orgUnitName] || null : null;
  const position = orgUnit?.positionName || org?.levelName || '사원';

  return {
    nw_user_id: user.userId,
    email: user.email,
    name,
    department_id: departmentId,
    position,
  };
}

// ---------- Upsert employees in batches ----------
async function upsertEmployees(
  db: D1Database,
  employees: ReturnType<typeof mapNwUser>[]
): Promise<{ added: number; updated: number }> {
  let added = 0;
  let updated = 0;

  // Process in batches of 50
  for (let i = 0; i < employees.length; i += 50) {
    const batch = employees.slice(i, i + 50);
    const statements: D1PreparedStatement[] = [];

    for (const emp of batch) {
      // Check if employee exists by email
      const existing = await db
        .prepare('SELECT id, nw_user_id FROM employees WHERE email = ?')
        .bind(emp.email)
        .first<{ id: string; nw_user_id: string | null }>();

      if (existing) {
        // UPDATE: name, department_id, position, nw_user_id, is_active=1
        // NEVER update role
        // Preserve 휴직/병가 status; only restore 퇴직→재직
        statements.push(
          db
            .prepare(
              `UPDATE employees SET name = ?, department_id = ?, position = ?, nw_user_id = ?, is_active = 1,
               employment_status = CASE WHEN employment_status = '퇴직' THEN '재직' ELSE employment_status END
               WHERE id = ?`
            )
            .bind(emp.name, emp.department_id, emp.position, emp.nw_user_id, existing.id)
        );
        updated++;
      } else {
        // INSERT new employee
        const id = generateId('emp');
        statements.push(
          db
            .prepare(
              `INSERT INTO employees (id, name, email, department_id, position, role, nw_user_id, is_active, employment_status)
               VALUES (?, ?, ?, ?, ?, 'user', ?, 1, '재직')`
            )
            .bind(id, emp.name, emp.email, emp.department_id, emp.position, emp.nw_user_id)
        );
        added++;
      }
    }

    if (statements.length > 0) {
      await db.batch(statements);
    }
  }

  return { added, updated };
}

// ---------- Deactivate stale employees ----------
async function deactivateStale(
  db: D1Database,
  syncedNwUserIds: string[]
): Promise<number> {
  if (syncedNwUserIds.length === 0) return 0;

  // Only deactivate employees that:
  // 1. Have a nw_user_id (were synced before)
  // 2. Are not in the current sync set
  // 3. Are not master role
  // 4. Are currently active
  const placeholders = syncedNwUserIds.map(() => '?').join(',');
  const result = await db
    .prepare(
      `UPDATE employees SET is_active = 0, employment_status = '퇴직'
       WHERE nw_user_id IS NOT NULL
         AND nw_user_id NOT IN (${placeholders})
         AND role != 'master'
         AND is_active = 1`
    )
    .bind(...syncedNwUserIds)
    .run();

  return result.meta.changes ?? 0;
}

// ---------- Dev Mode Sync ----------
async function runDevSync(db: D1Database): Promise<SyncResult> {
  const mapped = SAMPLE_EMPLOYEES.map((s) => ({
    nw_user_id: s.userId,
    email: s.email,
    name: s.name,
    department_id: s.dept,
    position: s.position,
  }));

  const { added, updated } = await upsertEmployees(db, mapped);
  const now = nowISO();

  // Update sync_meta
  await db
    .prepare(
      `INSERT OR REPLACE INTO sync_meta (key, value, updated_at)
       VALUES ('last_sync', ?, ?)`
    )
    .bind(
      JSON.stringify({ status: 'success', synced_at: now, added, updated, deactivated: 0, is_dev_mode: true }),
      now
    )
    .run();

  return {
    added,
    updated,
    deactivated: 0,
    total: SAMPLE_EMPLOYEES.length,
    synced_at: now,
    is_dev_mode: true,
  };
}

// ---------- Main Sync Entry Point ----------
export async function runSync(env: Env, db: D1Database): Promise<SyncResult> {
  const isDevMode = !env.NW_SERVICE_ACCOUNT_ID || env.NW_SERVICE_ACCOUNT_ID === '';

  if (isDevMode) {
    console.log('[Sync] Dev mode: using sample employee data');
    return runDevSync(db);
  }

  console.log('[Sync] Production mode: fetching from 네이버 웍스 API');

  // 1. Generate JWT
  const jwt = await generateServiceAccountJwt(env);

  // 2. Get access token
  const accessToken = await getAccessToken(jwt, env);

  // 3. Fetch all users
  const nwUsers = await fetchAllUsers(accessToken);
  console.log(`[Sync] Fetched ${nwUsers.length} users from 네이버 웍스`);

  // 4. Map users to employee records
  const mapped = nwUsers.map(mapNwUser);

  // 5. Upsert employees
  const { added, updated } = await upsertEmployees(db, mapped);

  // 6. Deactivate stale employees
  const syncedIds = mapped.map((m) => m.nw_user_id);
  const deactivated = await deactivateStale(db, syncedIds);

  const now = nowISO();

  // 7. Update sync_meta
  await db
    .prepare(
      `INSERT OR REPLACE INTO sync_meta (key, value, updated_at)
       VALUES ('last_sync', ?, ?)`
    )
    .bind(
      JSON.stringify({ status: 'success', synced_at: now, added, updated, deactivated, is_dev_mode: false }),
      now
    )
    .run();

  console.log(`[Sync] Complete: added=${added}, updated=${updated}, deactivated=${deactivated}`);

  return {
    added,
    updated,
    deactivated,
    total: nwUsers.length,
    synced_at: now,
    is_dev_mode: false,
  };
}
