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
  { key: 'minLength', label: `Tối thiểu ${PASSWORD_POLICY.MIN_LENGTH} ký tự` },
  { key: 'hasUppercase', label: 'Có ít nhất 1 chữ in hoa (A-Z)' },
  { key: 'hasNumber', label: 'Có ít nhất 1 chữ số (0-9)' },
  { key: 'hasSpecialChar', label: 'Có ít nhất 1 ký tự đặc biệt (!@#$...)' },
];

const PasswordPolicyChecklist: React.FC<PasswordPolicyChecklistProps> = ({
  password,
  className = '',
}) => {
  const result = validatePassword(password);

  if (!password) return null;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {RULES.map((rule) => {
        const passed = result[rule.key];
        return (
          <div
            key={rule.key}
            className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
              passed ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <span
              className={`flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full transition-all duration-200 ${
                passed
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {passed ? (
                <Check className="w-3 h-3" />
              ) : (
                <X className="w-3 h-3" />
              )}
            </span>
            <span>{rule.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default PasswordPolicyChecklist;