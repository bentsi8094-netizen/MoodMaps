/**
 * Validation Helper for consistent auth logic across platforms.
 * All regex and basic checks should live here.
 */

export const validate_email = (email) => {
  if (!email) return "אימייל הוא שדה חובה";
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email.trim())) return "פורמט אימייל לא תקין";
  return null;
};

export const validate_password = (password) => {
  if (!password) return "סיסמה היא שדה חובה";
  if (password.length < 6) return "סיסמה חייבת להכיל לפחות 6 תווים";
  return null;
};

export const validate_name = (name, type = 'first') => {
  const label = type === 'first' ? "שם פרטי" : "שם משפחה";
  if (!name || name.trim().length < 2) return `${label} חייב להכיל לפחות 2 תווים`;
  return null;
};

export const validate_alias = (alias) => {
  if (!alias || alias.trim().length < 3) return "כינוי חייב להכיל לפחות 3 תווים";
  return null;
};
