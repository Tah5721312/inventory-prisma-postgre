import { Role, defineAbilityRulesFor } from './ability';

// دالة للحصول على الدور من الـ cookies
export async function getRoleFromCookies(): Promise<Role> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const role = cookieStore.get('role')?.value as Role;
  
  // إذا لم يكن هناك دور محدد، نعيد 'GUEST' كافتراضي
  return role || 'GUEST';
}

// دالة للتحقق من صلاحية معينة
export async function hasPermission(action: string, subject: string): Promise<boolean> {
  const role = await getRoleFromCookies();
  const rules = defineAbilityRulesFor(role);
  
  // البحث عن القاعدة المطلوبة
  return rules.some(rule => 
    rule.action === action && 
    (rule.subject === subject || rule.subject === 'all')
  );
}

// دالة للحصول على جميع الصلاحيات للدور الحالي
export async function getCurrentPermissions(): Promise<{action: string, subject: string}[]> {
  const role = await getRoleFromCookies();
  const rules = defineAbilityRulesFor(role);
  
  return rules.map(rule => ({
    action: rule.action,
    subject: rule.subject
  }));
}

// دالة للتحقق من الدور
export async function isRole(role: Role): Promise<boolean> {
  const currentRole = await getRoleFromCookies();
  return currentRole === role;
}

// دالة للحصول على معلومات الدور
export async function getRoleInfo(): Promise<{
  role: Role;
  permissions: {action: string, subject: string}[];
  canAccessDashboard: boolean;
  canManageUsers: boolean;
}> {
  const role = await getRoleFromCookies();
  const permissions = await getCurrentPermissions();
  
  return {
    role,
    permissions,
    canAccessDashboard: await hasPermission('read', 'Dashboard'),
    canManageUsers: await hasPermission('manage', 'User'),
  };
}
