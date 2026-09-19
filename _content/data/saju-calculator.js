/**
 * saju-calculator.js
 * 생년월일시(양력) → 사주팔자(년/월/일/시주) → 오행 비율 산출
 *
 * ✅ 절기 정확도 보정 완료 (9/11): 연주(입춘 기준)와 월주(12절 경계) 모두
 * 실제 태양 황경(apparent ecliptic longitude)을 저정밀 천문 공식(Meeus
 * 근사식, 1900~2100년 범위 오차 수 분 이내)으로 계산해 정확한 절입 시각을
 * 구하고, 그 시각을 기준으로 절기 경계를 판정합니다. (이전의 "매월 5일
 * 고정 근사치"보다 훨씬 정확 — 2024년 절기 실제값과 비교 검증 완료)
 * 생년월일시는 한국 표준시(KST, UTC+9) 기준으로 가정하며, 태어난 시간을
 * 모르는 경우 정오(12시)를 기준으로 절기 경계를 판정합니다.
 * 음력 생일 입력은 지원하지 않으며, 양력 기준으로만 계산합니다.
 */

const GAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const ZHI = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

// 천간 → 오행
const GAN_ELEMENT = ['목', '목', '화', '화', '토', '토', '금', '금', '수', '수'];
// 지지 → 오행
const ZHI_ELEMENT = ['수', '토', '목', '목', '토', '화', '화', '토', '금', '금', '토', '수'];

// 월지 순서 (절기 경계 기준)
// index 0 = 인월(입춘~경칩), ZHI 인덱스로는 2(인)부터 시작
const MONTH_ZHI_ORDER = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1]; // 인묘진사오미신유술해자축

// 연간에 따른 월간 시작 천간 (오호둔 규칙)
// 갑기년→병인월, 을경년→무인월, 병신년→경인월, 정임년→임인월, 무계년→갑인월
const MONTH_GAN_START = [2, 4, 6, 8, 0]; // yearGanIndex % 5 → 인월의 천간 인덱스

// 일간에 따른 시간 시작 천간 (오자둔 규칙)
// 갑기일→갑자시, 을경일→병자시, 병신일→무자시, 정임일→경자시, 무계일→임자시
const HOUR_GAN_START = [0, 2, 4, 6, 8]; // dayGanIndex % 5 → 자시의 천간 인덱스

function mod(n, m) {
  return ((n % m) + m) % m;
}

// ── 절기(태양 황경) 정밀 계산 ──────────────────────────────
// 저정밀 태양 겉보기 황경 공식(Meeus, Astronomical Algorithms 근사식).
// 1900~2100년 범위에서 오차 수 분 이내로, 절기 경계(월주 판정)에는 충분한 정밀도.
function toJulianDay(y, m, d, hourUT) {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5 + hourUT / 24;
}

function mod360(x) {
  return ((x % 360) + 360) % 360;
}

/** 태양의 겉보기 황경(도) 계산 */
function sunApparentLongitude(jd) {
  const T = (jd - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const Mrad = (M * Math.PI) / 180;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
    0.000289 * Math.sin(3 * Mrad);
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin((omega * Math.PI) / 180);
  return mod360(lambda);
}

/** 태양 황경이 targetDeg(도)에 도달하는 정확한 JD를 뉴턴법으로 근사 */
function findSolarTermJD(approxJD, targetDeg) {
  let jd = approxJD;
  for (let i = 0; i < 6; i++) {
    const lam = sunApparentLongitude(jd);
    const diff = mod(targetDeg - lam + 180, 360) - 180; // -180~180로 정규화
    jd += diff / 0.9856002; // 태양의 하루 평균 이동량(도)
  }
  return jd;
}

// 12절(월주 경계) — 각 절기의 대략적인 날짜(뉴턴법 초기값용)와 목표 황경, 그리고
// MONTH_ZHI_ORDER 상의 순서(인=0 ~ 축=11)
const SOLAR_TERMS_12 = [
  { name: '입춘', month: 2, approxDay: 4, deg: 315, order: 0 }, // → 인월
  { name: '경칩', month: 3, approxDay: 6, deg: 345, order: 1 }, // → 묘월
  { name: '청명', month: 4, approxDay: 5, deg: 15, order: 2 }, // → 진월
  { name: '입하', month: 5, approxDay: 6, deg: 45, order: 3 }, // → 사월
  { name: '망종', month: 6, approxDay: 6, deg: 75, order: 4 }, // → 오월
  { name: '소서', month: 7, approxDay: 7, deg: 105, order: 5 }, // → 미월
  { name: '입추', month: 8, approxDay: 8, deg: 135, order: 6 }, // → 신월
  { name: '백로', month: 9, approxDay: 8, deg: 165, order: 7 }, // → 유월
  { name: '한로', month: 10, approxDay: 8, deg: 195, order: 8 }, // → 술월
  { name: '입동', month: 11, approxDay: 7, deg: 225, order: 9 }, // → 해월
  { name: '대설', month: 12, approxDay: 7, deg: 255, order: 10 }, // → 자월
  { name: '소한', month: 1, approxDay: 6, deg: 285, order: 11 }, // → 축월
];

/** 특정 달력 연도(calendarYear) 안에 있는 12절의 정밀 JD 목록 계산 */
function computeYearTermJDs(calendarYear) {
  return SOLAR_TERMS_12.map((t) => {
    const approxJD = toJulianDay(calendarYear, t.month, t.approxDay, 12 - 9); // KST 정오 근사 초기값
    return { jd: findSolarTermJD(approxJD, t.deg), order: t.order };
  });
}

/** 생년월일시(KST) → UT 기준 율리우스일(JD). 시간 모름이면 정오로 가정 */
function birthToJD(year, month, day, hour, minute) {
  const h = hour === null || hour === undefined ? 12 : hour;
  const hourUT = h + minute / 60 - 9; // KST(UTC+9) → UT
  return toJulianDay(year, month, day, hourUT);
}

/**
 * 출생 시각 기준 정밀 절기 정보 계산
 * @returns {{ monthOrder: number, isBeforeIpchun: boolean }}
 *   monthOrder: MONTH_ZHI_ORDER 상의 인덱스(인월=0~축월=11)
 *   isBeforeIpchun: 해당 연도 입춘 이전 출생 여부(연주 판정용)
 */
function getPreciseSolarInfo(year, month, day, hour, minute) {
  const birthJD = birthToJD(year, month, day, hour, minute);

  // 앞뒤 여유를 두고 3개년치 12절 경계를 모두 모아 정렬 → 출생 시각이 속한 구간을 탐색
  const terms = [year - 1, year, year + 1]
    .flatMap(computeYearTermJDs)
    .sort((a, b) => a.jd - b.jd);

  let monthOrder = terms[0].order;
  for (const t of terms) {
    if (t.jd <= birthJD) monthOrder = t.order;
    else break;
  }

  const ipchunJD = computeYearTermJDs(year).find((t) => t.order === 0).jd;
  const isBeforeIpchun = birthJD < ipchunJD;

  return { monthOrder, isBeforeIpchun };
}

/** 연주(年柱) 계산 — 입춘(태양 황경 315도 도달 시각) 이전 출생은 전년도로 취급 */
function getYearPillar(year, solarInfo) {
  const pillarYear = solarInfo.isBeforeIpchun ? year - 1 : year;
  const ganIndex = mod(pillarYear - 4, 10);
  const zhiIndex = mod(pillarYear - 4, 12);
  return { gan: GAN[ganIndex], zhi: ZHI[zhiIndex], ganIndex, zhiIndex };
}

/** 월주(月柱) 계산 — 12절 경계를 정밀 계산한 monthOrder로 판정 */
function getMonthPillar(solarInfo, yearGanIndex) {
  const orderIndex = solarInfo.monthOrder;
  const zhiIndex = MONTH_ZHI_ORDER[orderIndex];
  const startGanIndex = MONTH_GAN_START[mod(yearGanIndex, 5)];
  const ganIndex = mod(startGanIndex + orderIndex, 10);
  return { gan: GAN[ganIndex], zhi: ZHI[zhiIndex], ganIndex, zhiIndex };
}

/** 일주(日柱) 계산 — 1900-01-31을 갑자일(index 0)로 두는 기준일법 */
function getDayPillar(date) {
  const baseDate = new Date(1900, 0, 31);
  const diffDays = Math.floor((date - baseDate) / 86400000);
  const ganIndex = mod(diffDays, 10);
  const zhiIndex = mod(diffDays, 12);
  return { gan: GAN[ganIndex], zhi: ZHI[zhiIndex], ganIndex, zhiIndex };
}

/** 시주(時柱) 계산 — 2시간 단위 12지시, 일간 기준 오자둔 규칙 적용 */
function getHourPillar(hour, minute, dayGanIndex) {
  // 23:00~00:59 = 자시(0), 01:00~02:59 = 축시(1) ... 순환
  const adjustedHour = mod(hour + 1, 24); // 23시를 다음날 0시대와 같은 구간으로 밀기 위한 보정
  const zhiIndex = Math.floor(adjustedHour / 2) % 12;

  const startGanIndex = HOUR_GAN_START[mod(dayGanIndex, 5)];
  const ganIndex = mod(startGanIndex + zhiIndex, 10);
  return { gan: GAN[ganIndex], zhi: ZHI[zhiIndex], ganIndex, zhiIndex };
}

/**
 * 사주팔자 및 오행 비율 계산
 * @param {Object} input
 * @param {number} input.year - 출생 연도 (양력)
 * @param {number} input.month - 출생 월 (1~12)
 * @param {number} input.day - 출생 일
 * @param {number|null} input.hour - 출생 시(0~23), 모르면 null
 * @param {number} [input.minute] - 출생 분
 */
function calculateSaju({ year, month, day, hour, minute = 0 }) {
  const birthDate = new Date(year, month - 1, day);
  const timeKnown = hour !== null && hour !== undefined;

  const solarInfo = getPreciseSolarInfo(year, month, day, hour, minute);
  const yearPillar = getYearPillar(year, solarInfo);
  const monthPillar = getMonthPillar(solarInfo, yearPillar.ganIndex);
  const dayPillar = getDayPillar(birthDate);
  const hourPillar = timeKnown ? getHourPillar(hour, minute, dayPillar.ganIndex) : null;

  const pillars = [yearPillar, monthPillar, dayPillar];
  if (hourPillar) pillars.push(hourPillar);

  // 오행 카운트 (천간 + 지지 = 기둥당 2개, 시주 모르면 3기둥 6개만 집계)
  const counts = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  pillars.forEach((p) => {
    counts[GAN_ELEMENT[p.ganIndex]] += 1;
    counts[ZHI_ELEMENT[p.zhiIndex]] += 1;
  });

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const elementRatio = {};
  Object.keys(counts).forEach((el) => {
    elementRatio[el] = Math.round((counts[el] / total) * 100);
  });

  // 반올림 오차 보정 (합이 100이 되도록 최대값에서 조정)
  const ratioSum = Object.values(elementRatio).reduce((a, b) => a + b, 0);
  if (ratioSum !== 100) {
    const maxKey = Object.keys(elementRatio).reduce((a, b) =>
      elementRatio[a] >= elementRatio[b] ? a : b
    );
    elementRatio[maxKey] += 100 - ratioSum;
  }

  const dominantElement = Object.keys(elementRatio).reduce((a, b) =>
    elementRatio[a] >= elementRatio[b] ? a : b
  );
  const deficientElement =
    Object.values(elementRatio).some((v) => v === 0)
      ? Object.keys(elementRatio).find((el) => elementRatio[el] === 0)
      : null;

  return {
    pillars: {
      year: `${yearPillar.gan}${yearPillar.zhi}`,
      month: `${monthPillar.gan}${monthPillar.zhi}`,
      day: `${dayPillar.gan}${dayPillar.zhi}`,
      hour: hourPillar ? `${hourPillar.gan}${hourPillar.zhi}` : null,
    },
    timeKnown,
    elementRatio,
    dominantElement,
    deficientElement,
  };
}

if (typeof module !== 'undefined') { module.exports = { calculateSaju, GAN, ZHI, GAN_ELEMENT, ZHI_ELEMENT }; }
