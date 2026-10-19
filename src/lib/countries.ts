export interface Country {
  code: string;
  name: string;
  nameHe: string;
  dialCode: string;
  flag: string;
  placeholder: string;
  minLength: number;
  maxLength: number;
}

export const COUNTRIES: Country[] = [
  {
    code: "IL",
    name: "Israel",
    nameHe: "ישראל",
    dialCode: "+972",
    flag: "🇮🇱",
    placeholder: "050-123-4567",
    minLength: 9,
    maxLength: 10,
  },
  {
    code: "US",
    name: "United States",
    nameHe: "ארצות הברית",
    dialCode: "+1",
    flag: "🇺🇸",
    placeholder: "(555) 000-0000",
    minLength: 10,
    maxLength: 10,
  },
  {
    code: "GB",
    name: "United Kingdom",
    nameHe: "בריטניה",
    dialCode: "+44",
    flag: "🇬🇧",
    placeholder: "7700 900123",
    minLength: 10,
    maxLength: 11,
  },
  {
    code: "CA",
    name: "Canada",
    nameHe: "קנדה",
    dialCode: "+1",
    flag: "🇨🇦",
    placeholder: "(555) 000-0000",
    minLength: 10,
    maxLength: 10,
  },
  {
    code: "FR",
    name: "France",
    nameHe: "צרפת",
    dialCode: "+33",
    flag: "🇫🇷",
    placeholder: "6 12 34 56 78",
    minLength: 9,
    maxLength: 10,
  },
  {
    code: "DE",
    name: "Germany",
    nameHe: "גרמניה",
    dialCode: "+49",
    flag: "🇩🇪",
    placeholder: "151 12345678",
    minLength: 10,
    maxLength: 11,
  },
  {
    code: "RU",
    name: "Russia",
    nameHe: "רוסיה",
    dialCode: "+7",
    flag: "🇷🇺",
    placeholder: "912 345-67-89",
    minLength: 10,
    maxLength: 10,
  },
  {
    code: "UA",
    name: "Ukraine",
    nameHe: "אוקראינה",
    dialCode: "+380",
    flag: "🇺🇦",
    placeholder: "50 123 4567",
    minLength: 9,
    maxLength: 9,
  },
  {
    code: "IT",
    name: "Italy",
    nameHe: "איטליה",
    dialCode: "+39",
    flag: "🇮🇹",
    placeholder: "312 3456789",
    minLength: 9,
    maxLength: 10,
  },
  {
    code: "ES",
    name: "Spain",
    nameHe: "ספרד",
    dialCode: "+34",
    flag: "🇪🇸",
    placeholder: "612 34 56 78",
    minLength: 9,
    maxLength: 9,
  },
  {
    code: "AU",
    name: "Australia",
    nameHe: "אוסטרליה",
    dialCode: "+61",
    flag: "🇦🇺",
    placeholder: "412 345 678",
    minLength: 9,
    maxLength: 9,
  },
  {
    code: "BR",
    name: "Brazil",
    nameHe: "ברזיל",
    dialCode: "+55",
    flag: "🇧🇷",
    placeholder: "11 91234-5678",
    minLength: 10,
    maxLength: 11,
  },
  {
    code: "IN",
    name: "India",
    nameHe: "הודו",
    dialCode: "+91",
    flag: "🇮🇳",
    placeholder: "98765 43210",
    minLength: 10,
    maxLength: 10,
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    nameHe: "איחוד האמירויות",
    dialCode: "+971",
    flag: "🇦🇪",
    placeholder: "50 123 4567",
    minLength: 9,
    maxLength: 9,
  },
  {
    code: "CY",
    name: "Cyprus",
    nameHe: "קפריסין",
    dialCode: "+357",
    flag: "🇨🇾",
    placeholder: "99 123456",
    minLength: 8,
    maxLength: 8,
  },
  {
    code: "GR",
    name: "Greece",
    nameHe: "יוון",
    dialCode: "+30",
    flag: "🇬🇷",
    placeholder: "69 1234 5678",
    minLength: 10,
    maxLength: 10,
  },
  {
    code: "NL",
    name: "Netherlands",
    nameHe: "הולנד",
    dialCode: "+31",
    flag: "🇳🇱",
    placeholder: "6 12345678",
    minLength: 9,
    maxLength: 9,
  },
  {
    code: "CH",
    name: "Switzerland",
    nameHe: "שווייץ",
    dialCode: "+41",
    flag: "🇨🇭",
    placeholder: "79 123 45 67",
    minLength: 9,
    maxLength: 9,
  },
  {
    code: "TR",
    name: "Turkey",
    nameHe: "טורקיה",
    dialCode: "+90",
    flag: "🇹🇷",
    placeholder: "512 345 67 89",
    minLength: 10,
    maxLength: 10,
  },
  {
    code: "GE",
    name: "Georgia",
    nameHe: "גאורגיה",
    dialCode: "+995",
    flag: "🇬🇪",
    placeholder: "555 12 34 56",
    minLength: 9,
    maxLength: 9,
  },
  {
    code: "PL",
    name: "Poland",
    nameHe: "פולין",
    dialCode: "+48",
    flag: "🇵🇱",
    placeholder: "512 345 678",
    minLength: 9,
    maxLength: 9,
  },
  {
    code: "RO",
    name: "Romania",
    nameHe: "רומניה",
    dialCode: "+40",
    flag: "🇷🇴",
    placeholder: "712 345 678",
    minLength: 9,
    maxLength: 10,
  },
  {
    code: "MX",
    name: "Mexico",
    nameHe: "מקסיקו",
    dialCode: "+52",
    flag: "🇲🇽",
    placeholder: "55 1234 5678",
    minLength: 10,
    maxLength: 10,
  },
  {
    code: "AR",
    name: "Argentina",
    nameHe: "ארגנטינה",
    dialCode: "+54",
    flag: "🇦🇷",
    placeholder: "9 11 1234-5678",
    minLength: 10,
    maxLength: 11,
  },
  {
    code: "JP",
    name: "Japan",
    nameHe: "יפן",
    dialCode: "+81",
    flag: "🇯🇵",
    placeholder: "90 1234 5678",
    minLength: 10,
    maxLength: 10,
  },
  {
    code: "KR",
    name: "South Korea",
    nameHe: "דרום קוריאה",
    dialCode: "+82",
    flag: "🇰🇷",
    placeholder: "10 1234 5678",
    minLength: 9,
    maxLength: 10,
  },
  {
    code: "CN",
    name: "China",
    nameHe: "סין",
    dialCode: "+86",
    flag: "🇨🇳",
    placeholder: "138 1234 5678",
    minLength: 11,
    maxLength: 11,
  },
  {
    code: "SG",
    name: "Singapore",
    nameHe: "סינגפור",
    dialCode: "+65",
    flag: "🇸🇬",
    placeholder: "8123 4567",
    minLength: 8,
    maxLength: 8,
  },
  {
    code: "TH",
    name: "Thailand",
    nameHe: "תאילנד",
    dialCode: "+66",
    flag: "🇹🇭",
    placeholder: "81 234 5678",
    minLength: 9,
    maxLength: 9,
  },
  {
    code: "PH",
    name: "Philippines",
    nameHe: "פיליפינים",
    dialCode: "+63",
    flag: "🇵🇭",
    placeholder: "912 345 6789",
    minLength: 10,
    maxLength: 10,
  },
  {
    code: "ZA",
    name: "South Africa",
    nameHe: "דרום אפריקה",
    dialCode: "+27",
    flag: "🇿🇦",
    placeholder: "82 123 4567",
    minLength: 9,
    maxLength: 9,
  },
  {
    code: "EG",
    name: "Egypt",
    nameHe: "מצרים",
    dialCode: "+20",
    flag: "🇪🇬",
    placeholder: "10 1234 5678",
    minLength: 10,
    maxLength: 10,
  },
  {
    code: "JO",
    name: "Jordan",
    nameHe: "ירדן",
    dialCode: "+962",
    flag: "🇯🇴",
    placeholder: "7 9123 4567",
    minLength: 9,
    maxLength: 9,
  },
  {
    code: "MA",
    name: "Morocco",
    nameHe: "מרוקו",
    dialCode: "+212",
    flag: "🇲🇦",
    placeholder: "6 12 34 56 78",
    minLength: 9,
    maxLength: 9,
  },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]!; // Israel (+972)

export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
  normalizedPhone: string;
  formattedDisplay: string;
}

export function validatePhoneForCountry(
  country: Country,
  rawLocal: string,
): PhoneValidationResult {
  const digits = rawLocal.replace(/\D/g, "");

  if (!digits) {
    return {
      isValid: false,
      normalizedPhone: "",
      formattedDisplay: "",
    };
  }

  // Israel specific validation rules
  if (country.code === "IL") {
    // Israeli mobile prefixes usually start with 050..058 or 50..58
    if (digits.startsWith("05")) {
      if (digits.length < 10) {
        return {
          isValid: false,
          error: `Missing ${10 - digits.length} digits (10 digits expected)`,
          normalizedPhone: `972${digits.slice(1)}`,
          formattedDisplay: formatIsraeliLocal(digits),
        };
      }
      if (digits.length > 10) {
        return {
          isValid: false,
          error: "Too many digits (10 digits expected)",
          normalizedPhone: `972${digits.slice(1, 10)}`,
          formattedDisplay: formatIsraeliLocal(digits.slice(0, 10)),
        };
      }
      return {
        isValid: true,
        normalizedPhone: `972${digits.slice(1)}`,
        formattedDisplay: formatIsraeliLocal(digits),
      };
    }

    if (digits.startsWith("5")) {
      if (digits.length < 9) {
        return {
          isValid: false,
          error: `Missing ${9 - digits.length} digits (9 digits expected)`,
          normalizedPhone: `972${digits}`,
          formattedDisplay: formatIsraeliLocal(`0${digits}`),
        };
      }
      if (digits.length > 9) {
        return {
          isValid: false,
          error: "Too many digits (9 digits expected without 0)",
          normalizedPhone: `972${digits.slice(0, 9)}`,
          formattedDisplay: formatIsraeliLocal(`0${digits.slice(0, 9)}`),
        };
      }
      return {
        isValid: true,
        normalizedPhone: `972${digits}`,
        formattedDisplay: formatIsraeliLocal(`0${digits}`),
      };
    }

    if (digits.startsWith("0")) {
      // Landline 02, 03, 04, 08, 09
      if (digits.length < 9) {
        return {
          isValid: false,
          error: `Missing ${9 - digits.length} digits`,
          normalizedPhone: `972${digits.slice(1)}`,
          formattedDisplay: digits,
        };
      }
      if (digits.length === 9) {
        return {
          isValid: true,
          normalizedPhone: `972${digits.slice(1)}`,
          formattedDisplay: digits,
        };
      }
      return {
        isValid: false,
        error: "Too many digits",
        normalizedPhone: `972${digits.slice(1, 9)}`,
        formattedDisplay: digits,
      };
    }

    // QA test identities (e.g. 555) for developer environments
    if (digits === "555" || digits === "1234") {
      return {
        isValid: true,
        normalizedPhone: digits,
        formattedDisplay: digits,
      };
    }

    return {
      isValid: false,
      error: "Mobile number should start with 05 (e.g. 050-123-4567)",
      normalizedPhone: `972${digits}`,
      formattedDisplay: digits,
    };
  }

  // International phone validation
  const cleanDigits = digits.startsWith("0") ? digits.slice(1) : digits;
  const dialDigits = country.dialCode.replace(/\D/g, "");

  if (cleanDigits.length < country.minLength) {
    const diff = country.minLength - cleanDigits.length;
    return {
      isValid: false,
      error: `Number too short (missing ${diff} digits)`,
      normalizedPhone: `${dialDigits}${cleanDigits}`,
      formattedDisplay: cleanDigits,
    };
  }

  if (cleanDigits.length > country.maxLength) {
    return {
      isValid: false,
      error: `Number too long (maximum ${country.maxLength} digits)`,
      normalizedPhone: `${dialDigits}${cleanDigits.slice(0, country.maxLength)}`,
      formattedDisplay: cleanDigits,
    };
  }

  return {
    isValid: true,
    normalizedPhone: `${dialDigits}${cleanDigits}`,
    formattedDisplay: cleanDigits,
  };
}

function formatIsraeliLocal(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 10)}`;
}
