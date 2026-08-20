import axios from 'axios';
import { get } from '@/axios/request';
import { storage, chrome } from '@/untils/utils';

export const DEFAULT_INDICES = ['1.000001', '0.399001', '0.399006', '1.000300'];

export const INDEX_FALLBACK = [
  { f14: '上证指数', f2: '3,186.81', f4: '+18.74', f3: '0.59', f12: '000001', fallback: true },
  { f14: '深证成指', f2: '9,747.16', f4: '+60.21', f3: '0.62', f12: '399001', fallback: true },
  { f14: '创业板指', f2: '1,881.76', f4: '+13.27', f3: '0.71', f12: '399006', fallback: true },
  { f14: '沪深300', f2: '3,645.12', f4: '+21.45', f3: '0.59', f12: '000300', fallback: true },
];

export function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function signedPercent(value) {
  const parsed = toNumber(value, NaN);
  if (!Number.isFinite(parsed)) return '--';
  return `${parsed > 0 ? '+' : ''}${parsed.toFixed(2)}%`;
}

export function signedAmount(value) {
  const parsed = toNumber(value, NaN);
  if (!Number.isFinite(parsed)) return '--';
  return `${parsed > 0 ? '+' : ''}${parsed.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function isTradingTime(date = new Date()) {
  const day = date.getDay();
  if (day === 0 || day === 6) return false;
  const minutes = date.getHours() * 60 + date.getMinutes();
  const morningStart = 9 * 60 + 30;
  const morningEnd = 11 * 60 + 30;
  const afternoonStart = 13 * 60;
  const afternoonEnd = 15 * 60;
  return (minutes >= morningStart && minutes <= morningEnd) || (minutes >= afternoonStart && minutes <= afternoonEnd);
}

export function calcFundRow(raw, position = {}) {
  const num = toNumber(position.num);
  const cost = toNumber(position.cost);
  const dwjz = toNumber(raw.dwjz || raw.nav || raw.price || raw.gsz);
  const gsz = toNumber(raw.gsz || raw.price || dwjz);
  const gszzl = toNumber(raw.gszzl || raw.rate);
  const amount = Number((gsz * num).toFixed(1));
  const previousAmount = Number((dwjz * num).toFixed(1));
  const dayGains = gsz ? Number(((gsz - dwjz) * num).toFixed(1)) : 0;
  const costGains = cost ? Number(((gsz - cost) * num).toFixed(1)) : 0;
  const costGainsRate = cost ? Number((((gsz - cost) / cost) * 100).toFixed(2)) : 0;
  return {
    fundcode: raw.fundcode || position.code,
    code: raw.fundcode || position.code,
    assetType: 'fund',
    name: raw.name || position.label || position.name || position.code,
    nav: dwjz,
    price: gsz,
    rate: gszzl,
    num,
    cost,
    amount,
    previousAmount,
    gains: dayGains,
    costGains,
    costGainsRate,
    updateTime: raw.gztime || raw.jzrq || '--',
  };
}

function normalizeSinaFundPayload(payload, position = {}) {
  const data = payload && payload.result && payload.result.data ? payload.result.data : {};
  const networth = Array.isArray(data.networth) ? data.networth : [];
  const latestEstimate = networth[networth.length - 1] || {};
  const previousNav = toNumber(data.worth);
  const estimatedNav = toNumber(latestEstimate.pre_nav2 || latestEstimate.pre_nav || data.worth);
  const rate = latestEstimate.nav2_pct !== undefined
    ? toNumber(latestEstimate.nav2_pct)
    : (previousNav ? ((estimatedNav - previousNav) * 100) / previousNav : toNumber(data.worth_rate) * 100);
  const worthDate = String(data.worth_date || '');
  const estimateDate = String(latestEstimate.pre_date || '');
  const date = /^\d{4}-\d{2}-\d{2}$/.test(estimateDate)
    ? estimateDate
    : (/^\d{8}$/.test(worthDate) ? `${worthDate.slice(0, 4)}-${worthDate.slice(4, 6)}-${worthDate.slice(6, 8)}` : '');
  const updateTime = date
    ? `${date}${latestEstimate.min_time ? ` ${latestEstimate.min_time.slice(0, 5)}` : ''}`
    : '--';

  return {
    fundcode: position.code,
    name: data.name || position.label || position.name || position.code,
    dwjz: previousNav,
    gsz: estimatedNav,
    gszzl: rate,
    gztime: updateTime,
  };
}

export function calcStockRow(raw, position = {}) {
  const num = toNumber(position.num);
  const cost = toNumber(position.cost);
  const price = toNumber(raw.f2);
  const previousPrice = toNumber(raw.f18 || price);
  const rate = toNumber(raw.f3);
  const earningsPerShare = toNumber(raw.f4);
  const amount = Number((price * num).toFixed(1));
  const previousAmount = Number((previousPrice * num).toFixed(1));
  const gains = Number((num * earningsPerShare).toFixed(1));
  const costGains = cost ? Number(((price - cost) * num).toFixed(1)) : 0;
  const costGainsRate = cost ? Number((((price - cost) / cost) * 100).toFixed(2)) : 0;
  return {
    fundcode: raw.f12 || position.code,
    code: raw.f12 || position.code,
    assetType: 'stock',
    market: raw.f13 || position.market,
    name: raw.f14 || position.label || position.name || position.code,
    nav: price,
    price,
    rate,
    num,
    cost,
    amount,
    previousAmount,
    gains,
    costGains,
    costGainsRate,
    updateTime: raw.f124 || '--',
  };
}

function isStockPosition(position = {}) {
  return /股票/.test(String(position.type || ''));
}

export async function loadSettings() {
  const res = await storage.get([
    'fundListM',
    'stockList',
    'seciList',
    'darkMode',
    'historicalRevenueAmount',
    'showAllGains',
    'showAllCost',
    'showTotalRevenue',
    'showTotalAssets',
    'showGSZ',
    'showAmount',
    'showGains',
    'showCost',
    'showCostRate',
    'showProportion',
    'userInfo',
  ]);
  return {
    ...res,
    fundListM: res.fundListM || [],
    stockList: res.stockList || [],
    seciList: res.seciList || DEFAULT_INDICES,
  };
}

export async function fetchMarketIndices(seciList = DEFAULT_INDICES) {
  if (!seciList.length) return INDEX_FALLBACK;
  const secids = seciList.join(',');
  const url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f12,f13,f14&secids=${secids}&_=${Date.now()}`;
  try {
    const response = await fetch(url);
    const res = await response.json();
    return res && res.data && res.data.diff && res.data.diff.length ? res.data.diff : INDEX_FALLBACK;
  } catch (error) {
    return INDEX_FALLBACK;
  }
}

export async function searchSecurities(query) {
  if (!query) return [];
  const res = await get('/searchapi/api/Info/Search', {
    appid: 'el1902262',
    type: 14,
    token: 'CCSDCZSDCXYMYZYYSYYXSMDDSMDHHDJT',
    and14: `MultiMatch/Name,Code,PinYin/${query}/true`,
    returnfields14: 'Name,Code,PinYin,MarketType,JYS,MktNum,JYS4App,MktNum4App,ID,Classify,IsExactMatch,SecurityType,SecurityTypeName',
    pageIndex14: 1,
    pageSize14: 10,
    isAssociation14: 'false1633883320220',
  });
  return (res && res.Data ? res.Data : []).map((item) => ({
    label: item.Name,
    value: item.Code,
    code: item.Code,
    market: item.MktNum,
    type: item.SecurityTypeName,
  }));
}

export async function fetchFunds(fundListM = []) {
  const fundPositions = fundListM.filter((item) => !isStockPosition(item));
  const stockPositions = fundListM.filter(isStockPosition);
  const requests = fundPositions.map((item) => axios.get('/sinaFundInfo/FdFundService.getEstimateNetworthPic', {
    params: { symbol: item.code },
  }));
  const [responses, stockRows] = await Promise.all([
    Promise.allSettled(requests),
    fetchStocks(stockPositions),
  ]);
  const fundRows = new Map(responses.map((result, index) => {
    const position = fundPositions[index];
    const raw = result.status === 'fulfilled' ? normalizeSinaFundPayload(result.value, position) : {};
    return [position.code, calcFundRow(raw, position)];
  }));
  const stockRowsByCode = new Map(stockRows.map((item) => [item.code, item]));
  return fundListM.map((position) => (isStockPosition(position)
    ? (stockRowsByCode.get(position.code) || calcStockRow({}, position))
    : fundRows.get(position.code)));
}

export async function fetchStocks(stockList = []) {
  if (!stockList.length) return [];
  const secids = stockList.map((item) => `${item.market}.${item.code}`).join(',');
  try {
    const res = await get('https://push2.eastmoney.com/api/qt/ulist.np/get?', {
      fields: 'f12,f13,f14,f2,f4,f3,f18',
      fltt: 2,
      secids,
    });
    const diff = res && res.data && res.data.diff ? res.data.diff : [];
    if (!diff.length) return stockList.map((position) => calcStockRow({}, position));
    return stockList.map((position) => {
      const raw = diff.find((item) => item.f12 === position.code) || {};
      return calcStockRow(raw, position);
    });
  } catch (error) {
    return stockList.map((position) => calcStockRow({}, position));
  }
}

function normalizeSeries(list = []) {
  return list
    .map((item) => {
      if (item && typeof item === 'object') {
        const value = Number(item.value);
        return Number.isFinite(value) ? { time: item.time, value } : null;
      }
      const value = Number(item);
      return Number.isFinite(value) ? value : null;
    })
    .filter((item) => item !== null);
}

async function fetchSinaFundDailyReturns(rows = []) {
  const targets = rows.filter((item) => Number(item.amount));
  if (!targets.length) return [];
  const responses = await Promise.allSettled(
    targets.map((item) => {
      const code = item.fundcode || item.code;
      return axios.get('/sinaFundInfo/FdFundService.getEstimateNetworthPic', {
        params: { symbol: code },
      });
    })
  );

  const timeline = new Set();
  const series = responses.map((result, index) => {
    if (result.status !== 'fulfilled') return null;
    const data = result.value && result.value.result && result.value.result.data;
    const networth = data && Array.isArray(data.networth) ? data.networth : [];
    const previousNav = toNumber(data && data.worth);
    const values = networth
      .map((item) => ({
        time: item.min_time ? item.min_time.slice(0, 5) : '',
        rate: item.nav2_pct !== undefined
          ? toNumber(item.nav2_pct) / 100
          : (previousNav && toNumber(item.pre_nav2)
            ? (toNumber(item.pre_nav2) - previousNav) / previousNav
            : (item.growthrate !== undefined ? toNumber(item.growthrate) : toNumber(item.nav_pct) / 100)),
      }))
      .filter((item) => item.time);
    values.forEach((item) => timeline.add(item.time));
    return {
      amount: Number(targets[index].previousAmount || targets[index].amount || 0),
      values,
    };
  });

  const times = Array.from(timeline).sort();
  if (!times.length) return [];
  const amountList = times.map((time) => ({ time, value: 0 }));
  responses.forEach((_, index) => {
    const current = series[index];
    if (!current) return;
    let rate = 0;
    let dataIndex = 0;
    amountList.forEach((point) => {
      while (current.values[dataIndex] && current.values[dataIndex].time <= point.time) {
        rate = current.values[dataIndex].rate;
        dataIndex += 1;
      }
      point.value += rate * current.amount;
    });
  });
  return normalizeSeries(amountList.map((point) => ({
    time: point.time,
    value: Number(point.value.toFixed(1)),
  })));
}

function mergeDailyReturns(seriesList = []) {
  const normalizedSeries = seriesList.map((series) => series.map((item) => {
    const match = String(item.time || '').match(/(\d{1,2}:\d{2})$/);
    return { ...item, time: match ? match[1] : item.time };
  }));
  const times = Array.from(new Set(normalizedSeries.flatMap((series) => series.map((item) => item.time)))).sort();
  const cursors = normalizedSeries.map(() => 0);
  const values = normalizedSeries.map(() => 0);
  return times.map((time) => {
    const value = normalizedSeries.reduce((sum, series, index) => {
      while (series[cursors[index]] && series[cursors[index]].time <= time) {
        values[index] = Number(series[cursors[index]].value || 0);
        cursors[index] += 1;
      }
      return sum + values[index];
    }, 0);
    return { time, value: Number(value.toFixed(1)) };
  });
}

export async function fetchFundDailyReturns(rows = []) {
  const fundRows = rows.filter((item) => item.assetType !== 'stock');
  const stockRows = rows.filter((item) => item.assetType === 'stock');
  const [fundReturns, stockReturns] = await Promise.all([
    fetchSinaFundDailyReturns(fundRows),
    fetchStockDailyReturns(stockRows),
  ]);
  return mergeDailyReturns([fundReturns, stockReturns]);
}

export async function fetchStockDailyReturns(rows = []) {
  const targets = rows.filter((item) => Number(item.num));
  if (!targets.length) return [];
  const responses = await Promise.allSettled(
    targets.map((item) => {
      const market = item.market || item.f13 || 1;
      const code = item.code || item.f12;
      const url = `https://push2.eastmoney.com/api/qt/stock/trends2/get?secid=${market}.${code}&fields1=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13&fields2=f51,f53,f56,f58&iscr=0&iscca=0&ndays=1&forcect=1`;
      return fetch(url).then((res) => res.json());
    })
  );
  let amountList = [];
  responses.forEach((result, index) => {
    if (result.status !== 'fulfilled' || !result.value || !result.value.data || !Array.isArray(result.value.data.trends)) return;
    const current = targets[index];
    const num = Number(current.num || 0);
    const prePrice = Number(result.value.data.prePrice || 0);
    const dataList = result.value.data.trends.map((item) => item.split(',')).map((item) => ({
      time: item[0],
      value: Number(((Number(item[1]) - prePrice) * num).toFixed(2)),
    }));
    amountList = amountList.length
      ? amountList.map((point, dataIndex) => ({
        time: point.time || (dataList[dataIndex] && dataList[dataIndex].time),
        value: Number(point.value || 0) + Number((dataList[dataIndex] && dataList[dataIndex].value) || 0),
      }))
      : dataList;
  });
  return normalizeSeries(amountList.map((point) => ({
    time: point.time,
    value: Number(point.value.toFixed(1)),
  })));
}

export async function saveFundList(fundListM) {
  storage.set({ fundListM }, () => chrome.runtime.sendMessage({ type: 'refreshOption' }));
}

export async function saveStockList(stockList) {
  storage.set({ stockList }, () => chrome.runtime.sendMessage({ type: 'refreshOption' }));
}

export async function saveSettings(payload) {
  storage.set(payload, () => chrome.runtime.sendMessage({ type: 'refreshOption' }));
}
