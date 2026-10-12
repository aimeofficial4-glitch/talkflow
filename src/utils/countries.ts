export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  region: 'East Africa' | 'North Africa' | 'West/Central Africa' | 'Southern Africa' | 'Europe' | 'Americas' | 'Asia' | 'Middle East';
  defaultLanguage: string;
  defaultTimezone: string;
  isEastAfrica?: boolean;
}

// Complete East African Community (EAC) & Greater East Africa countries
export const EAST_AFRICAN_COUNTRIES: CountryInfo[] = [
  {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    dialCode: '+254',
    region: 'East Africa',
    defaultLanguage: 'sw',
    defaultTimezone: 'Africa/Nairobi',
    isEastAfrica: true,
  },
  {
    code: 'TZ',
    name: 'Tanzania',
    flag: '🇹🇿',
    dialCode: '+255',
    region: 'East Africa',
    defaultLanguage: 'sw',
    defaultTimezone: 'Africa/Dar_es_Salaam',
    isEastAfrica: true,
  },
  {
    code: 'UG',
    name: 'Uganda',
    flag: '🇺🇬',
    dialCode: '+256',
    region: 'East Africa',
    defaultLanguage: 'en',
    defaultTimezone: 'Africa/Kampala',
    isEastAfrica: true,
  },
  {
    code: 'RW',
    name: 'Rwanda',
    flag: '🇷🇼',
    dialCode: '+250',
    region: 'East Africa',
    defaultLanguage: 'en',
    defaultTimezone: 'Africa/Kigali',
    isEastAfrica: true,
  },
  {
    code: 'BI',
    name: 'Burundi',
    flag: '🇧🇮',
    dialCode: '+257',
    region: 'East Africa',
    defaultLanguage: 'fr',
    defaultTimezone: 'Africa/Bujumbura',
    isEastAfrica: true,
  },
  {
    code: 'SS',
    name: 'South Sudan',
    flag: '🇸🇸',
    dialCode: '+211',
    region: 'East Africa',
    defaultLanguage: 'en',
    defaultTimezone: 'Africa/Juba',
    isEastAfrica: true,
  },
  {
    code: 'CD',
    name: 'Democratic Republic of the Congo',
    flag: '🇨🇩',
    dialCode: '+243',
    region: 'East Africa',
    defaultLanguage: 'fr',
    defaultTimezone: 'Africa/Kinshasa',
    isEastAfrica: true,
  },
  {
    code: 'SO',
    name: 'Somalia',
    flag: '🇸🇴',
    dialCode: '+252',
    region: 'East Africa',
    defaultLanguage: 'ar',
    defaultTimezone: 'Africa/Mogadishu',
    isEastAfrica: true,
  },
  {
    code: 'ET',
    name: 'Ethiopia',
    flag: '🇪🇹',
    dialCode: '+251',
    region: 'East Africa',
    defaultLanguage: 'en',
    defaultTimezone: 'Africa/Addis_Ababa',
    isEastAfrica: true,
  },
  {
    code: 'DJ',
    name: 'Djibouti',
    flag: '🇩🇯',
    dialCode: '+253',
    region: 'East Africa',
    defaultLanguage: 'fr',
    defaultTimezone: 'Africa/Djibouti',
    isEastAfrica: true,
  },
  {
    code: 'ER',
    name: 'Eritrea',
    flag: '🇪🇷',
    dialCode: '+291',
    region: 'East Africa',
    defaultLanguage: 'en',
    defaultTimezone: 'Africa/Asmara',
    isEastAfrica: true,
  },
];

// Additional international countries
export const GLOBAL_COUNTRIES: CountryInfo[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', region: 'Americas', defaultLanguage: 'en', defaultTimezone: 'America/New_York' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', region: 'Europe', defaultLanguage: 'en', defaultTimezone: 'Europe/London' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20', region: 'North Africa', defaultLanguage: 'ar', defaultTimezone: 'Africa/Cairo' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34', region: 'Europe', defaultLanguage: 'es', defaultTimezone: 'Europe/Madrid' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', region: 'Europe', defaultLanguage: 'fr', defaultTimezone: 'Europe/Paris' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49', region: 'Europe', defaultLanguage: 'de', defaultTimezone: 'Europe/Berlin' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81', region: 'Asia', defaultLanguage: 'ja', defaultTimezone: 'Asia/Tokyo' },
  { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86', region: 'Asia', defaultLanguage: 'zh', defaultTimezone: 'Asia/Shanghai' },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91', region: 'Asia', defaultLanguage: 'hi', defaultTimezone: 'Asia/Kolkata' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55', region: 'Americas', defaultLanguage: 'pt', defaultTimezone: 'America/Sao_Paulo' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', dialCode: '+82', region: 'Asia', defaultLanguage: 'ko', defaultTimezone: 'Asia/Seoul' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971', region: 'Middle East', defaultLanguage: 'ar', defaultTimezone: 'Asia/Dubai' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966', region: 'Middle East', defaultLanguage: 'ar', defaultTimezone: 'Asia/Riyadh' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', dialCode: '+92', region: 'Asia', defaultLanguage: 'ur', defaultTimezone: 'Asia/Karachi' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234', region: 'West/Central Africa', defaultLanguage: 'en', defaultTimezone: 'Africa/Lagos' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27', region: 'Southern Africa', defaultLanguage: 'en', defaultTimezone: 'Africa/Johannesburg' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', region: 'Americas', defaultLanguage: 'en', defaultTimezone: 'America/Toronto' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61', region: 'Asia', defaultLanguage: 'en', defaultTimezone: 'Australia/Sydney' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', dialCode: '+62', region: 'Asia', defaultLanguage: 'id', defaultTimezone: 'Asia/Jakarta' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', dialCode: '+90', region: 'Middle East', defaultLanguage: 'tr', defaultTimezone: 'Europe/Istanbul' },
];

export const ALL_COUNTRIES: CountryInfo[] = [
  ...EAST_AFRICAN_COUNTRIES,
  ...GLOBAL_COUNTRIES,
];

export function findCountryByNameOrCode(query: string): CountryInfo | undefined {
  if (!query) return undefined;
  const q = query.toLowerCase().trim();
  return ALL_COUNTRIES.find(
    (c) =>
      c.code.toLowerCase() === q ||
      c.name.toLowerCase() === q ||
      query.includes(c.name) ||
      query.includes(c.flag)
  );
}
