/**
 * 时间格式化工具 - UTC 转北京时间（UTC+8）展示。
 */
const BEIJING_OFFSET = 8 * 60 * 60 * 1000;
function toBeijingDate(utcStr) {
    if (!utcStr)
        return new Date(NaN);
    let s = utcStr;
    if (!s.endsWith('Z') && !s.includes('+'))
        s = s.replace(' ', 'T') + 'Z';
    return new Date(s);
}
export function formatDateTime(utcStr) {
    if (!utcStr)
        return '';
    const d = toBeijingDate(utcStr);
    if (isNaN(d.getTime()))
        return utcStr;
    const bj = new Date(d.getTime() + BEIJING_OFFSET);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${bj.getUTCFullYear()}-${pad(bj.getUTCMonth() + 1)}-${pad(bj.getUTCDate())} ${pad(bj.getUTCHours())}:${pad(bj.getUTCMinutes())}:${pad(bj.getUTCSeconds())}`;
}
export function formatDate(utcStr) {
    if (!utcStr)
        return '';
    const d = toBeijingDate(utcStr);
    if (isNaN(d.getTime()))
        return utcStr;
    const bj = new Date(d.getTime() + BEIJING_OFFSET);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${bj.getUTCFullYear()}-${pad(bj.getUTCMonth() + 1)}-${pad(bj.getUTCDate())}`;
}
export function formatRelative(utcStr) {
    if (!utcStr)
        return '';
    const d = toBeijingDate(utcStr);
    if (isNaN(d.getTime()))
        return utcStr;
    const diff = Date.now() - d.getTime();
    if (diff < 0)
        return formatDateTime(utcStr);
    const min = Math.floor(diff / 60000);
    if (min < 1)
        return '刚刚';
    if (min < 60)
        return `${min}分钟前`;
    const hr = Math.floor(min / 60);
    if (hr < 24)
        return `${hr}小时前`;
    const day = Math.floor(hr / 24);
    if (day < 30)
        return `${day}天前`;
    return formatDate(utcStr);
}
//# sourceMappingURL=time.js.map