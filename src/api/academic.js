import { apiRequest } from './client';

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, String(val));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export const academicApi = {
  // Sessions
  getSessions: (params) => apiRequest(`/sessions${buildQuery(params)}`),
  createSession: (data) => apiRequest('/sessions', { method: 'POST', body: data }),
  updateSession: (id, data) => apiRequest(`/sessions/${id}`, { method: 'PATCH', body: data }),
  deleteSession: (id) => apiRequest(`/sessions/${id}`, { method: 'DELETE' }),
  activateSession: (id) => apiRequest(`/sessions/${id}/activate`, { method: 'POST' }),

  // Terms
  getTerms: (params) => apiRequest(`/terms${buildQuery(params)}`),
  createTerm: (data) => apiRequest('/terms', { method: 'POST', body: data }),
  updateTerm: (id, data) => apiRequest(`/terms/${id}`, { method: 'PATCH', body: data }),
  deleteTerm: (id) => apiRequest(`/terms/${id}`, { method: 'DELETE' }),
  setCurrentTerm: (id) => apiRequest(`/terms/${id}/set-current`, { method: 'POST' }),

  // Classes
  getClasses: (params) => apiRequest(`/classes${buildQuery(params)}`),
  createClass: (data) => apiRequest('/classes', { method: 'POST', body: data }),
  updateClass: (id, data) => apiRequest(`/classes/${id}`, { method: 'PATCH', body: data }),
  deleteClass: (id) => apiRequest(`/classes/${id}`, { method: 'DELETE' }),

  // Subjects
  getSubjects: (params) => apiRequest(`/subjects${buildQuery(params)}`),
  createSubject: (data) => apiRequest('/subjects', { method: 'POST', body: data }),
  updateSubject: (id, data) => apiRequest(`/subjects/${id}`, { method: 'PATCH', body: data }),
  deleteSubject: (id) => apiRequest(`/subjects/${id}`, { method: 'DELETE' }),

  // Students
  getStudents: (params) => apiRequest(`/students${buildQuery(params)}`),
  createStudent: (data) => apiRequest('/students', { method: 'POST', body: data }),
  updateStudent: (id, data) => apiRequest(`/students/${id}`, { method: 'PATCH', body: data }),
  deleteStudent: (id) => apiRequest(`/students/${id}`, { method: 'DELETE' }),
  getStudentHistory: (id) => apiRequest(`/students/${id}/history`),

  // Teachers
  getTeachers: (params) => apiRequest(`/teachers${buildQuery(params)}`),
  createTeacher: (data) => apiRequest('/teachers', { method: 'POST', body: data }),
  updateTeacher: (id, data) => apiRequest(`/teachers/${id}`, { method: 'PATCH', body: data }),
  deleteTeacher: (id) => apiRequest(`/teachers/${id}`, { method: 'DELETE' }),
  getTeacherAssignments: (id) => apiRequest(`/teachers/${id}/assignments`),

  // Parents
  getParents: (params) => apiRequest(`/parents${buildQuery(params)}`),
  createParent: (data) => apiRequest('/parents', { method: 'POST', body: data }),
  updateParent: (id, data) => apiRequest(`/parents/${id}`, { method: 'PATCH', body: data }),
  deleteParent: (id) => apiRequest(`/parents/${id}`, { method: 'DELETE' }),

  // Attendance
  getAttendance: (params) => apiRequest(`/attendance${buildQuery(params)}`),
  recordAttendance: (data) => apiRequest('/attendance', { method: 'POST', body: data }),
  recordBatchAttendance: (batchData) => apiRequest('/attendance/batch', { method: 'POST', body: batchData }),

  // Grading & Results
  getGradingSchemes: (params) => apiRequest(`/grading-schemes${buildQuery(params)}`),
  createGradingScheme: (data) => apiRequest('/grading-schemes', { method: 'POST', body: data }),
  updateGradingScheme: (id, data) => apiRequest(`/grading-schemes/${id}`, { method: 'PATCH', body: data }),
  getResults: (params) => apiRequest(`/results${buildQuery(params)}`),
  saveResult: (data) => apiRequest('/results', { method: 'POST', body: data }),
  updateResult: (id, data) => apiRequest(`/results/${id}`, { method: 'PATCH', body: data }),
};

export default academicApi;
