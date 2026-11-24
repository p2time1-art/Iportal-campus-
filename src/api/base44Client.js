import { apiRequest } from './client';
import { authApi } from './auth';
import { compressImageFile } from '@/lib/imageCompressor';

/**
 * Maps entity model names used in React components to Laravel REST API endpoints
 */
const ENTITY_ROUTES = {
  Student: 'students',
  Teacher: 'teachers',
  ParentGuardian: 'parents',
  GuardianRelationship: 'guardian-relationships',
  SchoolClass: 'classes',
  Subject: 'subjects',
  AcademicSession: 'sessions',
  Term: 'terms',
  Attendance: 'attendance',
  Result: 'results',
  GradingScheme: 'grading-schemes',
  TeacherAssignment: 'teacher-assignments',
  ClassAssignment: 'class-assignments',
  StudentClassMembership: 'class-assignments',
  School: 'schools',
  User: 'users',
  SchoolMembership: 'memberships',
  Announcement: 'announcements',
  Notification: 'notifications',
  FeeCategory: 'fee-categories',
  FeeStructure: 'fee-structures',
  Payment: 'payments',
  StudentCharge: 'student-charges',
  Receipt: 'receipts',
  PaymentAllocation: 'payment-allocations',
  OnlinePaymentTransaction: 'online-payment-transactions',
  TermRemark: 'term-remarks',
  Assignment: 'assignments',
  AssignmentSubmission: 'assignment-submissions',
  AdmissionApplication: 'admission-applications',
  JobVacancy: 'job-vacancies',
  TimetableEntry: 'timetable-entries',
  Subscription: 'subscriptions',
  PlatformTransaction: 'platform-transactions',
  AuditLog: 'audit-logs',
};

// In-memory GET cache & in-flight request deduplication
const responseCache = new Map();
const inflightRequests = new Map();
const CACHE_TTL_MS = 15000; // 15 seconds TTL for identical GET requests

export function invalidateApiCache(endpointPrefix = null) {
  if (!endpointPrefix) {
    responseCache.clear();
    return;
  }
  for (const key of responseCache.keys()) {
    if (key.startsWith(`/${endpointPrefix}`)) {
      responseCache.delete(key);
    }
  }
}

async function cachedGet(url) {
  const now = Date.now();
  const cached = responseCache.get(url);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  if (inflightRequests.has(url)) {
    return inflightRequests.get(url);
  }

  const promise = apiRequest(url)
    .then((res) => {
      responseCache.set(url, { data: res, timestamp: Date.now() });
      inflightRequests.delete(url);
      return res;
    })
    .catch((err) => {
      inflightRequests.delete(url);
      throw err;
    });

  inflightRequests.set(url, promise);
  return promise;
}

function getEndpoint(entityName) {
  if (ENTITY_ROUTES[entityName]) {
    return ENTITY_ROUTES[entityName];
  }
  // Fallback: convert PascalCase to kebab-case plural
  return entityName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase() + 's';
}

function buildQuery(params = {}, sort = null, limit = null) {
  const query = new URLSearchParams();

  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
  }

  if (sort) query.append('sort', sort);
  if (limit) query.append('limit', String(limit));

  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

function createEntityApi(entityName) {
  const endpoint = getEndpoint(entityName);

  return {
    async filter(params = {}, sort = null, limit = null) {
      const qs = buildQuery(params, sort, limit);
      const res = await cachedGet(`/${endpoint}${qs}`);
      return Array.isArray(res) ? res : (res?.data || []);
    },

    async paginate(params = {}, sort = null) {
      const merged = { page: 1, per_page: 25, ...params };
      const qs = buildQuery(merged, sort, null);
      const res = await apiRequest(`/${endpoint}${qs}`);
      if (Array.isArray(res)) {
        return {
          data: res,
          meta: {
            current_page: Number(merged.page) || 1,
            per_page: Number(merged.per_page) || 25,
            total: res.length,
            last_page: 1,
            from: res.length > 0 ? 1 : 0,
            to: res.length,
          },
        };
      }
      return {
        data: res?.data || [],
        meta: res?.meta || {
          current_page: Number(merged.page) || 1,
          per_page: Number(merged.per_page) || 25,
          total: (res?.data || []).length,
          last_page: 1,
          from: (res?.data || []).length > 0 ? 1 : 0,
          to: (res?.data || []).length,
        },
      };
    },

    async list(sort = null, limit = null) {
      return this.filter({}, sort, limit);
    },

    async get(id) {
      return cachedGet(`/${endpoint}/${id}`);
    },

    async create(data) {
      const res = await apiRequest(`/${endpoint}`, {
        method: 'POST',
        body: data,
      });
      invalidateApiCache();
      return res;
    },

    async update(id, data) {
      const res = await apiRequest(`/${endpoint}/${id}`, {
        method: 'PATCH',
        body: data,
      });
      invalidateApiCache();
      return res;
    },

    async updateMany(filterParams, updatePayload) {
      const items = await this.filter(filterParams);
      const patch = updatePayload?.$set || updatePayload || {};
      await Promise.all((items || []).map((item) => this.update(item.id, patch)));
      invalidateApiCache();
      return { updated: (items || []).length };
    },

    async delete(id) {
      const res = await apiRequest(`/${endpoint}/${id}`, {
        method: 'DELETE',
      });
      invalidateApiCache();
      return res;
    },
  };
}

const entityApiCache = new Map();

/**
 * Universal entity proxy for frontend backward-compatibility
 * Completely eliminates @base44/sdk while preserving existing UI calls
 */
const entitiesProxy = new Proxy({}, {
  get(_target, prop) {
    if (typeof prop === 'string') {
      if (!entityApiCache.has(prop)) {
        entityApiCache.set(prop, createEntityApi(prop));
      }
      return entityApiCache.get(prop);
    }
    return undefined;
  },
});

export const base44 = {
  entities: entitiesProxy,
  auth: {
    ...authApi,
    async updateMe(data) {
      const res = await apiRequest('/user', {
        method: 'PATCH',
        body: data,
      });
      invalidateApiCache();
      return res;
    },
  },
  functions: {
    async invoke(name, payload = {}) {
      const isReadOnly = ['getAcademicContext', 'getAdminDashboardStats', 'getPlatformStats', 'getParentContext', 'getStudentFinance'].includes(name);
      if (isReadOnly) {
        const cacheKey = `/functions/${name}?payload=${JSON.stringify(payload)}`;
        return cachedGetWithPost(cacheKey, `/functions/${name}`, payload);
      }
      const res = await apiRequest(`/functions/${name}`, {
        method: 'POST',
        body: payload,
      });
      invalidateApiCache();
      return res;
    },
  },
  storage: {
    async upload(file, purpose = 'document') {
      const processed = await compressImageFile(file, { purpose });
      const formData = new FormData();
      formData.append('file', processed);
      formData.append('purpose', purpose);
      return apiRequest('/documents/upload', {
        method: 'POST',
        body: formData,
      });
    },
  },
  integrations: {
    Core: {
      async UploadFile({ file, purpose = 'document' }) {
        const processed = await compressImageFile(file, { purpose });
        const formData = new FormData();
        formData.append('file', processed);
        formData.append('purpose', purpose);
        const res = await apiRequest('/documents/upload', {
          method: 'POST',
          body: formData,
        });
        return { file_url: res.file_url || res.url };
      },
    },
  },
};

async function cachedGetWithPost(cacheKey, endpoint, payload) {
  const now = Date.now();
  const cached = responseCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey);
  }
  const promise = apiRequest(endpoint, { method: 'POST', body: payload })
    .then((res) => {
      responseCache.set(cacheKey, { data: res, timestamp: Date.now() });
      inflightRequests.delete(cacheKey);
      return res;
    })
    .catch((err) => {
      inflightRequests.delete(cacheKey);
      throw err;
    });
  inflightRequests.set(cacheKey, promise);
  return promise;
}

export default base44;
