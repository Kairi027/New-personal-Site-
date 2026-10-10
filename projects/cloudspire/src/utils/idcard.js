const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const CHECK_CODES = '10X98765432';

function validateName(name) {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 20;
}

function checksumOf(id) {
  let sum = 0;
  for (let i = 0; i < 17; i += 1) {
    sum += Number(id[i]) * WEIGHTS[i];
  }
  return CHECK_CODES[sum % 11];
}

function parseBirthday(id) {
  const year = Number(id.slice(6, 10));
  const month = Number(id.slice(10, 12));
  const day = Number(id.slice(12, 14));
  const date = new Date(year, month - 1, day);
  const valid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
  return { year, month, day, valid };
}

function calcAge(birth, now) {
  let age = now.getFullYear() - birth.year;
  const monthDiff = now.getMonth() + 1 - birth.month;
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.day)) {
    age -= 1;
  }
  return age;
}

function validateIdCard(id, now) {
  const today = now || new Date();
  const normalized = typeof id === 'string' ? id.trim().toUpperCase() : '';
  if (!/^\d{17}[\dX]$/.test(normalized)) {
    return { ok: false, reason: '身份证格式不正确' };
  }
  if (checksumOf(normalized) !== normalized[17]) {
    return { ok: false, reason: '身份证校验位不正确' };
  }
  const birth = parseBirthday(normalized);
  if (!birth.valid) {
    return { ok: false, reason: '身份证出生日期无效' };
  }
  const age = calcAge(birth, today);
  if (age < 18) {
    return { ok: false, reason: '未满18岁无法进入' };
  }
  return { ok: true, birthday: birth, age };
}

function validateAuth(name, id, now) {
  if (!validateName(name)) {
    return { ok: false, reason: '姓名需为2-20个字符' };
  }
  const idResult = validateIdCard(id, now);
  if (!idResult.ok) return idResult;
  return { ok: true, name: name.trim(), ...idResult };
}

module.exports = {
  validateName,
  validateIdCard,
  validateAuth,
  calcAge,
  checksumOf,
};
