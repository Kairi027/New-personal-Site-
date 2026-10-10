/** 全国城市工具函数 - 与服务端 /weather/all-cities 接口配合使用 */
/** 省份排序优先级：直辖市 > 普通省 > 自治区 > 港澳台 */
const PROVINCE_ORDER = [
    '北京', '上海', '天津', '重庆',
    '广东', '江苏', '浙江', '山东', '河南', '河北', '湖南', '湖北', '福建', '安徽', '江西', '辽宁', '四川', '陕西', '山西', '海南', '云南', '贵州', '吉林', '黑龙江',
    '内蒙古', '广西', '宁夏', '新疆', '西藏', '青海',
    '香港', '澳门', '台湾',
];
/** 按省份优先级排序 */
export function sortProvinces(provinces) {
    return [...provinces].sort((a, b) => {
        const ia = PROVINCE_ORDER.indexOf(a);
        const ib = PROVINCE_ORDER.indexOf(b);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
}
/** 本地搜索过滤（用于前端即时过滤已加载的城市列表） */
export function filterCities(cities, keyword) {
    if (!keyword)
        return cities;
    const kw = keyword.toLowerCase().trim();
    const matched = cities.filter((c) => c.city_name.includes(kw) || c.pinyin.includes(kw) || c.pinyin.startsWith(kw));
    return matched.sort((a, b) => a.level - b.level);
}
/** 获取省份列表（已排序） */
export function getProvinceList(grouped) {
    return sortProvinces(Object.keys(grouped));
}
/** 热门城市列表 */
export const HOT_CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都'];
//# sourceMappingURL=cities.js.map