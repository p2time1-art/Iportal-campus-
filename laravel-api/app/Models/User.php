<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $table = 'users';

    protected $primaryKey = 'id';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = [
        'email',
        'password_hash',
        'full_name',
        'phone',
        'status',
        'email_verified_at',
        'password_changed_at',
        'must_change_password',
        'login_pin',
        'platform_pin',
        'active_school_id',
        'active_role',
        'is_school_admin',
        'is_super_admin',
        'last_login_at',
    ];

    protected $hidden = [
        'password_hash',
        'login_pin',
        'platform_pin',
    ];

    protected $casts = [
        'password_hash' => 'hashed',
        'email_verified_at' => 'datetime',
        'password_changed_at' => 'datetime',
        'last_login_at' => 'datetime',
        'must_change_password' => 'boolean',
        'is_school_admin' => 'boolean',
        'is_super_admin' => 'boolean',
    ];

    public function isActiveForAuthentication(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        if ($this->is_super_admin) {
            return true;
        }

        return $this->activeRoleMembership() !== null;
    }

    public function getAuthPassword(): string
    {
        return (string) $this->password_hash;
    }

    public function activeMembership(): ?SchoolMembership
    {
        return $this->memberships()
            ->where('status', 'active')
            ->orderByDesc('is_primary')
            ->first();
    }

    public function activeRoleMembership(): ?SchoolMembership
    {
        $membershipQuery = $this->memberships()->where('status', 'active');

        if (! empty($this->active_school_id)) {
            $membershipQuery->where('school_id', $this->active_school_id);
        }

        if (! empty($this->active_role)) {
            $membershipQuery->where('role', $this->active_role);
        }

        return $membershipQuery
            ->orderByDesc('is_primary')
            ->first();
    }

    public function membershipForSchool(int $schoolId): ?SchoolMembership
    {
        return $this->memberships()
            ->where('school_id', $schoolId)
            ->where('status', 'active')
            ->first();
    }

    public function safeProfile(): array
    {
        $activeSchool = $this->activeSchool()->first();
        $activeMembership = $this->activeRoleMembership();
        $roleCode = $this->is_super_admin ? 'SAD' : ($activeMembership ? $activeMembership->role : $this->active_role);
        $roleSlug = \App\Services\RolePermissionService::toSlug($roleCode);
        $permissions = \App\Services\RolePermissionService::permissionsForUser($this);

        return [
            'id' => $this->id,
            'email' => $this->email,
            'full_name' => $this->full_name,
            'pin' => $this->login_pin ?? $this->platform_pin,
            'role' => $roleCode,
            'role_slug' => $roleSlug,
            'permissions' => $permissions,
            'status' => $this->status,
            'must_change_password' => (bool) $this->must_change_password,
            'active_school_id' => $this->active_school_id,
            'school' => $activeSchool ? [
                'id' => $activeSchool->id,
                'name' => $activeSchool->name,
                'short_name' => $activeSchool->short_name,
                'code' => $activeSchool->code,
                'address' => $activeSchool->address,
                'email' => $activeSchool->email,
                'phone' => $activeSchool->phone,
                'website' => $activeSchool->website,
                'motto' => $activeSchool->metadata['motto'] ?? '',
                'city' => $activeSchool->metadata['city'] ?? '',
                'country' => $activeSchool->metadata['country'] ?? 'Nigeria',
                'logo_url' => $activeSchool->metadata['logo_url'] ?? '',
                'crest_url' => $activeSchool->metadata['crest_url'] ?? '',
                'primary_color' => $activeSchool->metadata['primary_color'] ?? '#0f172a',
                'accent_color' => $activeSchool->metadata['accent_color'] ?? '#4f46e5',
                'slug' => $activeSchool->metadata['slug'] ?? strtolower($activeSchool->short_name ?: ($activeSchool->code ?: 'campus')),
                'custom_domain' => $activeSchool->metadata['custom_domain'] ?? '',
                'plan' => $activeSchool->metadata['plan'] ?? 'standard',
            ] : null,
            'membership' => $activeMembership ? [
                'id' => $activeMembership->id,
                'school_id' => $activeMembership->school_id,
                'role' => $activeMembership->role,
                'role_slug' => $roleSlug,
                'permissions' => $permissions,
                'status' => $activeMembership->status,
                'is_primary' => (bool) $activeMembership->is_primary,
            ] : null,
        ];
    }

    public function activeSchool(): BelongsTo
    {
        return $this->belongsTo(School::class, 'active_school_id');
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(SchoolMembership::class);
    }

    public function schools(): BelongsToMany
    {
        return $this->belongsToMany(School::class, 'school_memberships', 'user_id', 'school_id')
            ->withPivot(['role', 'status', 'is_primary']);
    }

    public function roleDefinitions(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'school_memberships', 'user_id', 'role', 'id', 'slug')
            ->withPivot(['school_id', 'status', 'is_primary']);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(UserSession::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function teachers(): HasMany
    {
        return $this->hasMany(Teacher::class);
    }

    public function parentGuardianProfiles(): HasMany
    {
        return $this->hasMany(ParentGuardian::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function authoredAnnouncements(): HasMany
    {
        return $this->hasMany(Announcement::class, 'author_id');
    }

    public function uploadedDocuments(): HasMany
    {
        return $this->hasMany(Document::class, 'uploaded_by');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function actedAuditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'actor_user_id');
    }
}
