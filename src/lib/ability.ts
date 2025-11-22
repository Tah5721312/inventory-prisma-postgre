import { AbilityBuilder, PureAbility } from '@casl/ability';

// تعريف الأدوار
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'USER' | 'GUEST';

// تعريف الصلاحيات
export type Actions = 'manage' | 'read' | 'create' | 'update' | 'delete';
export type Subjects = 'User' | 'Item' | 'Category' | 'Department' | 'Floor' | 'Rank' | 'Statistics' | 'Dashboard' | 'Reports' | 'all';

export type AppAbility = PureAbility<[Actions, Subjects]>;

// تعريف قاعدة الصلاحيات ككائن قابل للتسلسل
export interface AbilityRule {
  action: Actions;
  subject: Subjects;
  // Optional list of allowed fields for field-level authorization
  fields?: string | string[];
  conditions?: any;
}

// دالة لتحديد قواعد الصلاحيات حسب الدور
export function defineAbilityRulesFor(role: Role): AbilityRule[] {
  const rules: AbilityRule[] = [];

  switch (role) {
    case 'SUPER_ADMIN':
      // السوبر أدمن يملك كل الصلاحيات
      rules.push({ action: 'manage', subject: 'all' });
      break;

    case 'ADMIN':
      // الأدمن يستطيع إدارة كل شيء تقريبًا
      rules.push({ action: 'manage', subject: 'User' });
      rules.push({ action: 'manage', subject: 'Item' });
      rules.push({ action: 'manage', subject: 'Category' });
      rules.push({ action: 'manage', subject: 'Department' });
      rules.push({ action: 'manage', subject: 'Floor' });
      rules.push({ action: 'manage', subject: 'Rank' });
      rules.push({ action: 'read', subject: 'Statistics' });
      rules.push({ action: 'read', subject: 'Dashboard' });
      rules.push({ action: 'read', subject: 'Reports' });
      break;

    case 'USER':
      // المستخدم العادي يستطيع قراءة الأصناف وإنشاء وتحديث وحذف الأصناف الخاصة به
      rules.push({ action: 'read', subject: 'Item' });
      rules.push({ action: 'create', subject: 'Item' });
      // Example for conditional permission: can only manage their own items
      rules.push({ action: 'update', subject: 'Item', conditions: { USER_ID: '${user.id}' } });
      rules.push({ action: 'delete', subject: 'Item', conditions: { USER_ID: '${user.id}' } });
      break;

    case 'GUEST':
      // الضيف يستطيع قراءة البيانات العامة فقط
      rules.push({ action: 'read', subject: 'Item' });
      break;

    default:
      // لا صلاحيات للمستخدم غير المسجل
      break;
  }

  return rules;
}

// دالة لإنشاء Ability من القواعد
export function createAbilityFromRules(rules: AbilityRule[]): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(PureAbility);

  rules.forEach(rule => {
    if (rule.fields) {
      // fields then optional conditions
      (can as unknown as (
        action: Actions,
        subject: Subjects,
        fields?: string | string[],
        conditions?: any
      ) => void)(rule.action, rule.subject, rule.fields, rule.conditions);
    } else if (rule.conditions) {
      can(rule.action, rule.subject, rule.conditions);
    } else {
      can(rule.action, rule.subject);
    }
  });

  return build({
    fieldMatcher: (fields: string | string[]) => {
      if (!fields) return true;
      
      const fieldsArray = Array.isArray(fields) ? fields : [fields];
      
      // For now, allow all fields - this can be customized based on specific rules
      return fieldsArray.length > 0;
    }
  } as any);
}

// دالة لتحديد الصلاحيات حسب الدور (للخلفية)
export function defineAbilityFor(role: Role): AppAbility {
  const rules = defineAbilityRulesFor(role);
  return createAbilityFromRules(rules);
}

// Note: DB-backed ability helpers live in server-only module ability.server.ts