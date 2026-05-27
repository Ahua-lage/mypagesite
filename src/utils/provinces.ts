interface ProvinceData {
    name: string;
    nameEn: string;
    aliases?: string[];
}

export const PROVINCES: ProvinceData[] = [
    { name: '北京', nameEn: 'Beijing', aliases: ['京'] },
    { name: '天津', nameEn: 'Tianjin', aliases: ['津'] },
    { name: '河北', nameEn: 'Hebei', aliases: ['冀'] },
    { name: '山西', nameEn: 'Shanxi', aliases: ['晋'] },
    { name: '内蒙古', nameEn: 'Inner Mongolia', aliases: ['蒙', '内蒙古自治区'] },
    { name: '辽宁', nameEn: 'Liaoning', aliases: ['辽'] },
    { name: '吉林', nameEn: 'Jilin', aliases: ['吉'] },
    { name: '黑龙江', nameEn: 'Heilongjiang', aliases: ['黑'] },
    { name: '上海', nameEn: 'Shanghai', aliases: ['沪'] },
    { name: '江苏', nameEn: 'Jiangsu', aliases: ['苏'] },
    { name: '浙江', nameEn: 'Zhejiang', aliases: ['浙'] },
    { name: '安徽', nameEn: 'Anhui', aliases: ['皖'] },
    { name: '福建', nameEn: 'Fujian', aliases: ['闽'] },
    { name: '江西', nameEn: 'Jiangxi', aliases: ['赣'] },
    { name: '山东', nameEn: 'Shandong', aliases: ['鲁'] },
    { name: '河南', nameEn: 'Henan', aliases: ['豫'] },
    { name: '湖北', nameEn: 'Hubei', aliases: ['鄂'] },
    { name: '湖南', nameEn: 'Hunan', aliases: ['湘'] },
    { name: '广东', nameEn: 'Guangdong', aliases: ['粤'] },
    { name: '广西', nameEn: 'Guangxi', aliases: ['桂', '广西壮族自治区'] },
    { name: '海南', nameEn: 'Hainan', aliases: ['琼'] },
    { name: '重庆', nameEn: 'Chongqing', aliases: ['渝'] },
    { name: '四川', nameEn: 'Sichuan', aliases: ['川', '蜀'] },
    { name: '贵州', nameEn: 'Guizhou', aliases: ['黔', '贵'] },
    { name: '云南', nameEn: 'Yunnan', aliases: ['滇', '云'] },
    { name: '西藏', nameEn: 'Tibet', aliases: ['藏', '西藏自治区'] },
    { name: '陕西', nameEn: 'Shaanxi', aliases: ['陕', '秦'] },
    { name: '甘肃', nameEn: 'Gansu', aliases: ['甘', '陇'] },
    { name: '青海', nameEn: 'Qinghai', aliases: ['青'] },
    { name: '宁夏', nameEn: 'Ningxia', aliases: ['宁', '宁夏回族自治区'] },
    { name: '新疆', nameEn: 'Xinjiang', aliases: ['新', '新疆维吾尔自治区'] },
    { name: '台湾', nameEn: 'Taiwan', aliases: ['台'] },
    { name: '香港', nameEn: 'Hong Kong', aliases: ['港', '香港特别行政区'] },
    { name: '澳门', nameEn: 'Macau', aliases: ['澳', '澳门特别行政区'] },
];

const provinceMap = new Map<string, ProvinceData>();
const aliasMap = new Map<string, ProvinceData>();
const nameEnMap = new Map<string, ProvinceData>();

PROVINCES.forEach((province) => {
    provinceMap.set(province.name, province);
    nameEnMap.set(province.nameEn.toLowerCase(), province);
    
    if (province.aliases) {
        province.aliases.forEach((alias) => {
            aliasMap.set(alias, province);
        });
    }
});

export function isValidProvince(provinceName: string): boolean {
    if (!provinceName || typeof provinceName !== 'string') {
        return false;
    }

    const normalizedName = provinceName.trim();
    return provinceMap.has(normalizedName) || 
           aliasMap.has(normalizedName) || 
           nameEnMap.has(normalizedName.toLowerCase());
}

export function getStandardProvinceName(provinceName: string): string {
    if (!provinceName || typeof provinceName !== 'string') {
        return provinceName;
    }

    const normalizedName = provinceName.trim();
    const normalizedLower = normalizedName.toLowerCase();
    
    const province = provinceMap.get(normalizedName) || 
                    aliasMap.get(normalizedName) || 
                    nameEnMap.get(normalizedLower);
    
    return province?.name || provinceName;
}
