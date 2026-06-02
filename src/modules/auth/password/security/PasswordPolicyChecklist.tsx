'use client';

import React from 'react';
import { PASSWORD_POLICY } from '../constants/password-policy';
import type { PasswordPolicyResult } from '../../shared/types/auth.types';
import { Check, X } from 'lucide-react';

// ─── Password Validation Utility ─────────────────────────────────────────────

export const validatePassword = (password: string): PasswordPolicyResult => ({
  minLength: password.length >= PASSWORD_POLICY.MIN_LENGTH,
  hasUppercase: /[A-Z]/.test(password),
  hasNumber: /[0-9]/.test(password),
  hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  get isValid() {
    return this.minLength && this.hasUppercase && this.hasNumber && this.hasSpecialChar;
  },
});

// ─── Component ───────────────────────────────────────────────────────────────

interface PasswordPolicyChecklistProps {
  password: string;
  className?: string;
}

interface PolicyRule {
  key: keyof Omit<PasswordPolicyResult, 'isValid'>;
  label: string;
}

const RULES: PolicyRule[] = [
  { key: 'minLength', label: `At least ${PASSWORD_POLICY.MIN_LENGTH} characters` },
  { key: 'hasUppercase', label: 'Contains at least 1 uppercase letter (A-Z)' },
  { key: 'hasNumber', label: 'Contains at least 1 digit (0-9)' },
  { key: 'hasSpecialChar', label: 'Contains at least 1 special character (!@#$...)' },
];

const PasswordPolicyChecklist: React.FC<PasswordPolicyChecklistProps> = ({
  password,
  className = '',
}) => {
  const result = validatePassword(password);

  if (!password) return null;

  // Filter only failed rules (only errors)
  const failedRules = RULES.filter((rule) => !result[rule.key]);

  // If there are no failed rules, don't display the pop-up
  if (failedRules.length === 0) return null;

  return (
    <div
      className={`absolute left-0 right-0 top-full mt-2 z-50 bg-white/95 backdrop-blur-md border border-rose-200/80 rounded-2xl p-4 shadow-xl animate-fadeIn ${className}`}
    >
      <div className="text-xs font-bold text-rose-600 mb-2 flex items-center gap-1.5">
        <X className="w-4 h-4 text-rose-500 stroke-[2.5]" />
        <span>Password does not meet these requirements:</span>
      </div>
      <div className="space-y-1.5 pl-1">
        {failedRules.map((rule) => (
          <div
            key={rule.key}
            className="flex items-center gap-2 text-xs text-gray-700 font-medium"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
            <span>{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordPolicyChecklist;
