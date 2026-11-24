# Authorization Architecture

## Design goal

Authorization must enforce school isolation and user role boundaries. The system is a multi-tenant school platform; a user should never be able to read or modify records from another school unless the role and policy explicitly authorize it.

## Core authorization model

```text
Authenticated User
   ↓
School Membership
   ↓
Active School + Role
   ↓
Ownership / Relationship
   ↓
Policy / Service Validation
   ↓
Allowed Resource
```

## Role model

The current app and Base44 entity definitions strongly indicate the following canonical roles:

- `super_admin` (SAD)
- `school_admin` (ADM)
- `teacher` (TEA)
- `student` (STU)
- `parent` (PAR)

These roles should be modeled in the Laravel auth model and enforced by policy and middleware. The app should not treat school membership as a loose optional attribute; it should be the central access object.

## Authorization layers

### 1. Authentication layer
The user must be authenticated via Laravel session or token before any resource route is allowed.

### 2. School context layer
Each request should resolve the active school context from:
- `active_school_id` stored on the authenticated user
- or `school_id` from a route parameter
- or the selected school scope in the request payload

### 3. Policy layer
Policies should check:
- whether the user is a platform super admin
- whether the user is the school admin for the same school
- whether the user is the owner or assigned teacher for a record
- whether the user has linked parent/guardian access to the student
- whether the user is a student and can access their own records only

### 4. Service-level guardrails
Business services should perform a second check before writing data to ensure that even if policy or route validation is bypassed, the tenant boundary is not violated.

## Role-based access expectations

### Super Admin (SAD)
Super Admin is effectively platform-scoped. It should have rights to:
- school management
- platform reports
- platform transactions
- gateway configuration
- global user visibility over administration functions
- subscription and billing oversight
- audit log review
- system configuration and platform maintenance

Restrictions:
- not every action should be broad across all schools with no review; some writes should be constrained to platform admin approval workflows.

### School Admin (ADM)
School Admin should manage only their own school.

Allowed domains:
- students
- teachers
- parents
- classes
- subjects
- terms and sessions
- attendance and academic results
- fee categories and fee structures
- payment and billing oversight
- announcements
- user account setup and membership management
- report generation

Restrictions:
- cannot access other schools
- cannot view or modify another school’s payments, admissions, or academic records

### Teacher (TEA)
Teachers should only access records relevant to their assignments and classes.

Allowed domains:
- assigned classes
- students in those classes
- assignments and submissions for those classes
- attendance for assigned classes
- result entry and remarks for granted classes
- announcements and school communication

Restrictions:
- cannot see unrelated students or unrelated payment records
- cannot alter school-wide billing data unless explicitly authorized

### Student (STU)
Students should only access their own permitted records.

Allowed domains:
- own profile
- own attendance history
- own results
- own assignments
- own finance account and fees
- own communication and announcements

Restrictions:
- no access to other students’ records
- no access to school admin settings or billing management

### Parent / Guardian (PAR)
Parents should only access records linked to their children.

Allowed domains:
- own child profile data
- child academic results and attendance
- child payment and fee status
- school announcements and relevant documents

Restrictions:
- no access to unrelated student records
- no access to staff or admin functions

## Multi-tenant enforcement strategy

### School scoping
Every query for school-owned data should use `school_id` as a first-class filter. Where possible, use Eloquent scopes such as `scopeForSchool($query, $schoolId)`.

### Middleware
Recommended middleware:
- `RequireActiveSchoolMembership`
- `EnsureSchoolContext`
- `EnsureTenantAccess`

### Policy examples
- `SchoolPolicy` for platform or school-wide management
- `StudentPolicy` for access based on school and parent/student relation
- `TeacherPolicy` for assigned class or school-level admin access
- `PaymentPolicy` for student/self or school admin access
- `AnnouncementPolicy` for audience-based visibility

## Relationship-based authorization

Examples:
- A teacher may access a class if they are assigned to that class.
- A parent may access student data if a `guardian_relationships` record links them to that student.
- A student may access their own record if `user_id` or `student.user_id` matches the current authenticated user.
- A school admin may access records where the record `school_id` matches their active school.

## Best practice rules

1. Do not rely on frontend route names to authorize access.
2. Do not trust `school_id` in the body alone; validate it against the user’s active membership.
3. Do not allow direct object queries by ID without checking ownership and tenant membership.
4. Require explicit school scoping for all list and detail endpoints.
5. For sensitive writes, include audit logging and actor metadata.

## Security implications

This authorization design supports:
- school segregation
- strict data isolation
- least-privilege access
- role-specific operations
- parent/student visibility controls
- admin-only actions

The implementation must keep authorization logic out of controllers and into policies and middleware.

## Unknowns to confirm during Stage 3

- Whether there are separate finance-only roles beyond the current role set.
- Whether any parent access should be restricted to certain schools or a list of linked children.
- Whether `super_admin` should be represented as a `school_memberships` role or as a separate top-level platform identity.
- Whether a teacher may modify student results across multiple classes or only those assigned to them.
