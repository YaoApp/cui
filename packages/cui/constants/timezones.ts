/**
 * 全球时区选项
 * Global timezone options with UTC offsets
 */

export interface TimezoneOption {
	label: string
	value: string
	region: string
	utcOffset: string
}

export const timezoneOptions: TimezoneOption[] = [
	// UTC
	{ label: 'UTC', value: 'UTC', region: 'UTC', utcOffset: 'UTC+0' },

	// Africa
	{ label: 'Africa/Cairo (UTC+2)', value: 'Africa/Cairo', region: 'Africa', utcOffset: 'UTC+2' },
	{ label: 'Africa/Casablanca (UTC+1)', value: 'Africa/Casablanca', region: 'Africa', utcOffset: 'UTC+1' },
	{ label: 'Africa/Johannesburg (UTC+2)', value: 'Africa/Johannesburg', region: 'Africa', utcOffset: 'UTC+2' },
	{ label: 'Africa/Lagos (UTC+1)', value: 'Africa/Lagos', region: 'Africa', utcOffset: 'UTC+1' },
	{ label: 'Africa/Nairobi (UTC+3)', value: 'Africa/Nairobi', region: 'Africa', utcOffset: 'UTC+3' },

	// America
	{ label: 'America/New York (UTC-5/-4)', value: 'America/New_York', region: 'America', utcOffset: 'UTC-5/-4' },
	{
		label: 'America/Los Angeles (UTC-8/-7)',
		value: 'America/Los_Angeles',
		region: 'America',
		utcOffset: 'UTC-8/-7'
	},
	{ label: 'America/Chicago (UTC-6/-5)', value: 'America/Chicago', region: 'America', utcOffset: 'UTC-6/-5' },
	{ label: 'America/Denver (UTC-7/-6)', value: 'America/Denver', region: 'America', utcOffset: 'UTC-7/-6' },
	{ label: 'America/Phoenix (UTC-7)', value: 'America/Phoenix', region: 'America', utcOffset: 'UTC-7' },
	{ label: 'America/Toronto (UTC-5/-4)', value: 'America/Toronto', region: 'America', utcOffset: 'UTC-5/-4' },
	{ label: 'America/Vancouver (UTC-8/-7)', value: 'America/Vancouver', region: 'America', utcOffset: 'UTC-8/-7' },
	{
		label: 'America/Mexico City (UTC-6/-5)',
		value: 'America/Mexico_City',
		region: 'America',
		utcOffset: 'UTC-6/-5'
	},
	{ label: 'America/São Paulo (UTC-3/-2)', value: 'America/Sao_Paulo', region: 'America', utcOffset: 'UTC-3/-2' },
	{
		label: 'America/Buenos Aires (UTC-3)',
		value: 'America/Argentina/Buenos_Aires',
		region: 'America',
		utcOffset: 'UTC-3'
	},
	{ label: 'America/Lima (UTC-5)', value: 'America/Lima', region: 'America', utcOffset: 'UTC-5' },
	{ label: 'America/Bogota (UTC-5)', value: 'America/Bogota', region: 'America', utcOffset: 'UTC-5' },
	{ label: 'America/Santiago (UTC-4/-3)', value: 'America/Santiago', region: 'America', utcOffset: 'UTC-4/-3' },

	// Asia
	{ label: 'Asia/Shanghai (UTC+8)', value: 'Asia/Shanghai', region: 'Asia', utcOffset: 'UTC+8' },
	{ label: 'Asia/Tokyo (UTC+9)', value: 'Asia/Tokyo', region: 'Asia', utcOffset: 'UTC+9' },
	{ label: 'Asia/Seoul (UTC+9)', value: 'Asia/Seoul', region: 'Asia', utcOffset: 'UTC+9' },
	{ label: 'Asia/Hong Kong (UTC+8)', value: 'Asia/Hong_Kong', region: 'Asia', utcOffset: 'UTC+8' },
	{ label: 'Asia/Singapore (UTC+8)', value: 'Asia/Singapore', region: 'Asia', utcOffset: 'UTC+8' },
	{ label: 'Asia/Taipei (UTC+8)', value: 'Asia/Taipei', region: 'Asia', utcOffset: 'UTC+8' },
	{ label: 'Asia/Bangkok (UTC+7)', value: 'Asia/Bangkok', region: 'Asia', utcOffset: 'UTC+7' },
	{ label: 'Asia/Jakarta (UTC+7)', value: 'Asia/Jakarta', region: 'Asia', utcOffset: 'UTC+7' },
	{ label: 'Asia/Manila (UTC+8)', value: 'Asia/Manila', region: 'Asia', utcOffset: 'UTC+8' },
	{ label: 'Asia/Kuala Lumpur (UTC+8)', value: 'Asia/Kuala_Lumpur', region: 'Asia', utcOffset: 'UTC+8' },
	{ label: 'Asia/Mumbai (UTC+5:30)', value: 'Asia/Kolkata', region: 'Asia', utcOffset: 'UTC+5:30' },
	{ label: 'Asia/Delhi (UTC+5:30)', value: 'Asia/Kolkata', region: 'Asia', utcOffset: 'UTC+5:30' },
	{ label: 'Asia/Dhaka (UTC+6)', value: 'Asia/Dhaka', region: 'Asia', utcOffset: 'UTC+6' },
	{ label: 'Asia/Karachi (UTC+5)', value: 'Asia/Karachi', region: 'Asia', utcOffset: 'UTC+5' },
	{ label: 'Asia/Dubai (UTC+4)', value: 'Asia/Dubai', region: 'Asia', utcOffset: 'UTC+4' },
	{ label: 'Asia/Riyadh (UTC+3)', value: 'Asia/Riyadh', region: 'Asia', utcOffset: 'UTC+3' },
	{ label: 'Asia/Tehran (UTC+3:30/+4:30)', value: 'Asia/Tehran', region: 'Asia', utcOffset: 'UTC+3:30/+4:30' },
	{ label: 'Asia/Jerusalem (UTC+2/+3)', value: 'Asia/Jerusalem', region: 'Asia', utcOffset: 'UTC+2/+3' },
	{ label: 'Europe/Istanbul (UTC+3)', value: 'Europe/Istanbul', region: 'Asia', utcOffset: 'UTC+3' },

	// Europe
	{ label: 'Europe/London (UTC+0/+1)', value: 'Europe/London', region: 'Europe', utcOffset: 'UTC+0/+1' },
	{ label: 'Europe/Paris (UTC+1/+2)', value: 'Europe/Paris', region: 'Europe', utcOffset: 'UTC+1/+2' },
	{ label: 'Europe/Berlin (UTC+1/+2)', value: 'Europe/Berlin', region: 'Europe', utcOffset: 'UTC+1/+2' },
	{ label: 'Europe/Rome (UTC+1/+2)', value: 'Europe/Rome', region: 'Europe', utcOffset: 'UTC+1/+2' },
	{ label: 'Europe/Madrid (UTC+1/+2)', value: 'Europe/Madrid', region: 'Europe', utcOffset: 'UTC+1/+2' },
	{ label: 'Europe/Amsterdam (UTC+1/+2)', value: 'Europe/Amsterdam', region: 'Europe', utcOffset: 'UTC+1/+2' },
	{ label: 'Europe/Brussels (UTC+1/+2)', value: 'Europe/Brussels', region: 'Europe', utcOffset: 'UTC+1/+2' },
	{ label: 'Europe/Vienna (UTC+1/+2)', value: 'Europe/Vienna', region: 'Europe', utcOffset: 'UTC+1/+2' },
	{ label: 'Europe/Zurich (UTC+1/+2)', value: 'Europe/Zurich', region: 'Europe', utcOffset: 'UTC+1/+2' },
	{ label: 'Europe/Stockholm (UTC+1/+2)', value: 'Europe/Stockholm', region: 'Europe', utcOffset: 'UTC+1/+2' },
	{ label: 'Europe/Oslo (UTC+1/+2)', value: 'Europe/Oslo', region: 'Europe', utcOffset: 'UTC+1/+2' },
	{ label: 'Europe/Copenhagen (UTC+1/+2)', value: 'Europe/Copenhagen', region: 'Europe', utcOffset: 'UTC+1/+2' },
	{ label: 'Europe/Helsinki (UTC+2/+3)', value: 'Europe/Helsinki', region: 'Europe', utcOffset: 'UTC+2/+3' },
	{ label: 'Europe/Warsaw (UTC+1/+2)', value: 'Europe/Warsaw', region: 'Europe', utcOffset: 'UTC+1/+2' },
	{ label: 'Europe/Prague (UTC+1/+2)', value: 'Europe/Prague', region: 'Europe', utcOffset: 'UTC+1/+2' },
	{ label: 'Europe/Budapest (UTC+1/+2)', value: 'Europe/Budapest', region: 'Europe', utcOffset: 'UTC+1/+2' },
	{ label: 'Europe/Athens (UTC+2/+3)', value: 'Europe/Athens', region: 'Europe', utcOffset: 'UTC+2/+3' },
	{ label: 'Europe/Moscow (UTC+3)', value: 'Europe/Moscow', region: 'Europe', utcOffset: 'UTC+3' },
	{ label: 'Europe/Kiev (UTC+2/+3)', value: 'Europe/Kiev', region: 'Europe', utcOffset: 'UTC+2/+3' },
	{ label: 'Europe/Bucharest (UTC+2/+3)', value: 'Europe/Bucharest', region: 'Europe', utcOffset: 'UTC+2/+3' },

	// Oceania
	{ label: 'Australia/Sydney (UTC+10/+11)', value: 'Australia/Sydney', region: 'Oceania', utcOffset: 'UTC+10/+11' },
	{
		label: 'Australia/Melbourne (UTC+10/+11)',
		value: 'Australia/Melbourne',
		region: 'Oceania',
		utcOffset: 'UTC+10/+11'
	},
	{ label: 'Australia/Brisbane (UTC+10)', value: 'Australia/Brisbane', region: 'Oceania', utcOffset: 'UTC+10' },
	{ label: 'Australia/Perth (UTC+8)', value: 'Australia/Perth', region: 'Oceania', utcOffset: 'UTC+8' },
	{
		label: 'Australia/Adelaide (UTC+9:30/+10:30)',
		value: 'Australia/Adelaide',
		region: 'Oceania',
		utcOffset: 'UTC+9:30/+10:30'
	},
	{ label: 'Pacific/Auckland (UTC+12/+13)', value: 'Pacific/Auckland', region: 'Oceania', utcOffset: 'UTC+12/+13' },
	{
		label: 'Pacific/Wellington (UTC+12/+13)',
		value: 'Pacific/Auckland',
		region: 'Oceania',
		utcOffset: 'UTC+12/+13'
	},
	{ label: 'Pacific/Fiji (UTC+12/+13)', value: 'Pacific/Fiji', region: 'Oceania', utcOffset: 'UTC+12/+13' },
	{ label: 'Pacific/Honolulu (UTC-10)', value: 'Pacific/Honolulu', region: 'Oceania', utcOffset: 'UTC-10' },

	// Pacific
	{ label: 'Pacific/Guam (UTC+10)', value: 'Pacific/Guam', region: 'Pacific', utcOffset: 'UTC+10' },
	{ label: 'Pacific/Samoa (UTC+13/+14)', value: 'Pacific/Apia', region: 'Pacific', utcOffset: 'UTC+13/+14' },
	{ label: 'Pacific/Tahiti (UTC-10)', value: 'Pacific/Tahiti', region: 'Pacific', utcOffset: 'UTC-10' }
]

// 按地区分组的时区选项
export const timezoneOptionsByRegion = {
	UTC: timezoneOptions.filter((tz) => tz.region === 'UTC'),
	Africa: timezoneOptions.filter((tz) => tz.region === 'Africa'),
	America: timezoneOptions.filter((tz) => tz.region === 'America'),
	Asia: timezoneOptions.filter((tz) => tz.region === 'Asia'),
	Europe: timezoneOptions.filter((tz) => tz.region === 'Europe'),
	Oceania: timezoneOptions.filter((tz) => tz.region === 'Oceania'),
	Pacific: timezoneOptions.filter((tz) => tz.region === 'Pacific')
}

// 常用时区（用于快速选择）
export const popularTimezones = [
	'UTC',
	'America/New_York',
	'America/Los_Angeles',
	'Europe/London',
	'Europe/Paris',
	'Asia/Shanghai',
	'Asia/Tokyo',
	'Australia/Sydney'
]
	.map((value) => timezoneOptions.find((tz) => tz.value === value)!)
	.filter(Boolean)
