import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function sanitizeForHeader(val: string) {
  return val.replace(/[^\x20-\x7E]/g, '').trim();
}

const GOOGLE_API_KEY = sanitizeForHeader(Deno.env.get('GOOGLE_API_KEY') || '');
const NAVER_CLIENT_ID = sanitizeForHeader(Deno.env.get('NAVER_CLIENT_ID') || '');
const NAVER_CLIENT_SECRET = sanitizeForHeader(Deno.env.get('NAVER_CLIENT_SECRET') || '');
const SUPABASE_URL = sanitizeForHeader(Deno.env.get('SUPABASE_URL') || '');
const SUPABASE_SERVICE_ROLE_KEY = sanitizeForHeader(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '');

const NAVER_AD_CUSTOMER_ID = sanitizeForHeader(Deno.env.get('NAVER_AD_CUSTOMER_ID') || '');
const NAVER_AD_ACCESS_LICENSE = sanitizeForHeader(Deno.env.get('NAVER_AD_ACCESS_LICENSE') || '');
const NAVER_AD_SECRET_KEY = sanitizeForHeader(Deno.env.get('NAVER_AD_SECRET_KEY') || '');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function cleanPlaceName(name: string, stopWordsRegex: RegExp) {
  let cleaned = name.split(/[,|\(\)\[\]\-]/)[0];
  cleaned = cleaned.replace(stopWordsRegex, '').trim();
  return cleaned.length > 0 ? cleaned : name;
}

function getExtractKeyword(name: string, stopWordsRegex: RegExp) {
  const parts = name.split(/[,|\(\)\[\]\-]/);
  let target = parts.find(p => /[가-힣]/.test(p)) || parts[0];
  const hadSeparator = parts.length > 1;

  const globalStopWordsRegex = new RegExp(stopWordsRegex.source, 'gi');
  target = target.replace(globalStopWordsRegex, ' ').trim();
  
  if (/[가-힣]/.test(target)) target = target.replace(/[a-zA-Z]/g, '').trim();
  
  if (!hadSeparator) {
    const words = target.split(/\s+/).filter(Boolean);
    target = words[0] || target;
  }
  
  target = target.replace(/[^가-힣a-zA-Z0-9]/g, '');
  return target;
}

async function generateSignature(timestamp: string, method: string, path: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${method}.${path}`));
  const signatureBytes = new Uint8Array(signature);
  let binary = '';
  for (let i = 0; i < signatureBytes.byteLength; i++) { binary += String.fromCharCode(signatureBytes[i]); }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    let reqBody: any = {};
    try {
      const text = await req.text();
      if (text) reqBody = JSON.parse(text);
    } catch (e) {
      console.log('JSON Parse Error');
    }
    
    const currentRegion = reqBody.region || '성수';

    // stations 테이블에서 지역 설정 조회
    const { data: stationData, error: stationError } = await supabase
      .from('stations')
      .select('lat, lng, region_prefix, stop_words, radius')
      .eq('name', currentRegion)
      .eq('active', true)
      .single();

    if (stationError || !stationData) {
      throw new Error(`'${currentRegion}' 지역 설정을 찾을 수 없습니다. stations 테이블을 확인하세요.`);
    }

    const TARGET_LAT       = stationData.lat;
    const TARGET_LNG       = stationData.lng;
    const REGION_PREFIX    = stationData.region_prefix;
    const STOP_WORDS_REGEX = new RegExp(stationData.stop_words, 'i');
    const SEARCH_RADIUS    = stationData.radius ?? 800;

    const MAX_PAGES        = 3;
    const PAGE_DELAY       = 1500;
    const MAX_CANDIDATES   = 150;
    const NAVER_AD_DELAY   = 250;
    const NAVER_SEARCH_DELAY = 400;

    const searchQueries = [
      { category: '식당/맛집', type: 'restaurant', keyword: '맛집' },
      { category: '식당/맛집', type: 'restaurant', keyword: '' },
      { category: '식당/맛집', type: 'restaurant', keyword: '한식당' },
      { category: '식당/맛집', type: 'restaurant', keyword: '한식' },
      { category: '식당/맛집', type: 'restaurant', keyword: '베트남' },
      { category: '식당/맛집', type: 'restaurant', keyword: '파스타' },
      { category: '식당/맛집', type: 'restaurant', keyword: '양식' }, 
      { category: '식당/맛집', type: 'restaurant', keyword: '고기' },
      { category: '식당/맛집', type: 'restaurant', keyword: '곱창' },
      { category: '식당/맛집', type: 'restaurant', keyword: '일식' },
      { category: '식당/맛집', type: 'restaurant', keyword: '퓨전' },
      { category: '식당/맛집', type: 'restaurant', keyword: '핫플' },
      { category: '식당/맛집', type: '', keyword: '바베큐' },
      { category: '식당/맛집', type: '', keyword: '삼겹살' },
      { category: '식당/맛집', type: '', keyword: '고깃집' },
      { category: '식당/맛집', type: '', keyword: '갈비' },
      { category: '카페/베이커리', type: 'cafe', keyword: '핫플' },
      { category: '카페/베이커리', type: 'cafe', keyword: '' },
      { category: '카페/베이커리', type: '', keyword: '카페' },
      { category: '카페/베이커리', type: 'cafe', keyword: '드립' },
      { category: '카페/베이커리', type: 'cafe', keyword: '커피' },

      { category: '카페/베이커리', type: 'bakery', keyword: '도넛' },
      { category: '카페/베이커리', type: 'cafe', keyword: '에스프레소' },
      { category: '카페/베이커리', type: 'bakery', keyword: '' },
      { category: '카페/베이커리', type: '', keyword: '빵집' },
      { category: '카페/베이커리', type: '', keyword: '아이스크림' },
      { category: '카페/베이커리', type: '', keyword: '디저트' },
      { category: '카페/베이커리', type: '', keyword: '케이크' },
      { category: '카페/베이커리', type: '', keyword: '제과점' },
      { category: '카페/베이커리', type: '', keyword: '전통차' },
      { category: '카페/베이커리', type: '', keyword: '찻집' },
      { category: '카페/베이커리', type: '', keyword: '빙수' },
      { category: '쇼핑/문화', type: 'clothing_store', keyword: '' },
      { category: '쇼핑/문화', type: 'shoe_store', keyword: '' },
      { category: '쇼핑/문화', type: '', keyword: '소품샵' },
      { category: '쇼핑/문화', type: 'tourist_attraction', keyword: '' },
      { category: '쇼핑/문화', type: 'art_gallery', keyword: '' },
      { category: '쇼핑/문화', type: '', keyword: '팝업스토어' }
    ];

    let allPlaces: any[] = [];

    // 400m 오프셋 (위도 1도 ≈ 111,000m / 경도 1도 ≈ 111,000m × cos(lat))
    const LAT_OFFSET = 400 / 111000;
    const LNG_OFFSET = 400 / (111000 * Math.cos((TARGET_LAT * Math.PI) / 180));
    const OFFSET_RADIUS = 500;

    // 5개 중심점: 원래 중심 + 북/남/동/서 400m 오프셋
    const searchCenters = [
      { lat: TARGET_LAT,              lng: TARGET_LNG,              radius: SEARCH_RADIUS },
      { lat: TARGET_LAT + LAT_OFFSET, lng: TARGET_LNG,              radius: OFFSET_RADIUS },
      { lat: TARGET_LAT - LAT_OFFSET, lng: TARGET_LNG,              radius: OFFSET_RADIUS },
      { lat: TARGET_LAT,              lng: TARGET_LNG + LNG_OFFSET, radius: OFFSET_RADIUS },
      { lat: TARGET_LAT,              lng: TARGET_LNG - LNG_OFFSET, radius: OFFSET_RADIUS },
    ];

    // 단일 중심점으로 검색하는 함수
    async function searchFromCenter(q: any, center: { lat: number; lng: number; radius: number }) {
      let results: any[] = [];
      let pageToken = '';

      for (let page = 0; page < MAX_PAGES; page++) {
        let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${center.lat},${center.lng}&radius=${center.radius}&language=ko&key=${GOOGLE_API_KEY}`;
        if (q.type) url += `&type=${q.type}`;
        if (q.keyword) url += `&keyword=${encodeURIComponent(q.keyword)}`;

        let data: any = null;
        let success = false;

        for (let retry = 0; retry < 3; retry++) {
          let fetchUrl = url;
          if (pageToken) fetchUrl += `&pagetoken=${pageToken}`;

          try {
            const res = await fetch(fetchUrl);
            data = await res.json();

            if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
              success = true;
              break;
            } else if (data.status === 'INVALID_REQUEST' && pageToken) {
              await new Promise(r => setTimeout(r, 2000));
            } else if (data.status === 'OVER_QUERY_LIMIT') {
              await new Promise(r => setTimeout(r, 2000));
            } else {
              await new Promise(r => setTimeout(r, 1000));
            }
          } catch (err) {
            await new Promise(r => setTimeout(r, 1000));
          }
        }

        if (!success || !data) break;

        const filtered = (data.results || []).filter((p: any) => {
          const invalidTypes = ['locality', 'political', 'neighborhood', 'route', 'park', 'subway_station', 'bus_station', 'place_of_worship', 'government_office'];
          const invalidNameKeywords = ['거리', '길', '역', '공원', '출구', '사거리', '교차로', '카페거리', '나들목'];
          
          const franchiseKeywords = [
            '교촌', '투다리', '스타벅스', '메가커피', '이디야', '투썸', '빽다방', '컴포즈', '할리스', '탐앤탐스', 
            '파스쿠찌', '파리바게뜨', '뚜레쥬르', '김밥천국', '맥도날드', '버거킹', '롯데리아', 'KFC', '고깃집',
            '맘스터치', '도미노피자', '피자헛', 'BBQ', 'BHC', 'bhc', '배스킨라빈스', '던킨', '방탈출',
            '명륜진사갈비', '새마을식당', '역전할머니맥주', '백소정', '써브웨이', '고봉민','슈펜', '마곡초밥', '압구정곱창', '을지로 노가리골목',
            'exup', '전자담배', '성수미술관','서울맛집','성수 맛집','셜록홈즈','홍대맛집','홍대 맛집','홍대 고기집','메이드카페','홍대합정','합정맛집','마트','호텔','소망교회','홍대향수공방'
          ];
          
          const hasInvalidType = p.types?.some((t: string) => invalidTypes.includes(t));
          const hasInvalidName = invalidNameKeywords.some((word: string) => (p.name || '').includes(word));
          const isFranchise = franchiseKeywords.some((word: string) => (p.name || '').includes(word));
          
          return !hasInvalidType && !hasInvalidName && !isFranchise && p.business_status === 'OPERATIONAL' && (p.user_ratings_total || 0) >= 10;
        }).map((p: any) => ({ ...p, primary_category: q.category })); 

        results = results.concat(filtered);

        if (data.next_page_token) {
          pageToken = data.next_page_token;
          await new Promise(r => setTimeout(r, PAGE_DELAY));
        } else {
          break;
        }
      }
      return results;
    }

    // 각 쿼리 × 5개 중심점으로 병렬 검색
    const googlePromises = searchQueries.map(async (q) => {
      const centerResults = await Promise.all(
        searchCenters.map(center => searchFromCenter(q, center))
      );
      return centerResults.flat();
    });

    const resultsArray = await Promise.all(googlePromises);
    resultsArray.forEach(results => { allPlaces = allPlaces.concat(results); });

    const uniquePlacesMap = new Map();
    allPlaces.forEach(p => { if (!uniquePlacesMap.has(p.place_id)) uniquePlacesMap.set(p.place_id, p); });
    
    let candidatePlaces = Array.from(uniquePlacesMap.values());

    const categoriesList = ['식당/맛집', '카페/베이커리', '쇼핑/문화'];
    const limitPerCategory = Math.floor(MAX_CANDIDATES / categoriesList.length);
    
    let balancedCandidates: any[] = [];
    
    categoriesList.forEach(cat => {
        const topInCategory = candidatePlaces
            .filter(p => p.primary_category === cat)
            .sort((a: any, b: any) => (b.user_ratings_total || 0) - (a.user_ratings_total || 0))
            .slice(0, limitPerCategory);
        balancedCandidates = balancedCandidates.concat(topInCategory);
    });
    
    candidatePlaces = balancedCandidates;
  

    if (candidatePlaces.length === 0) throw new Error(`${currentRegion} 지역 구글 검색 결과 0건. 모수가 부족합니다.`);
    
    const MANUAL_CANDIDATES: Record<string, any[]> = {
      '압구정': [
        {
          name: '부케 드 뺑',
          geometry: { location: { lat: 37.525550, lng: 127.035400 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '카페/베이커리',
          user_ratings_total: 999
        },
        {
          name: '압구정연탄공장',
          geometry: { location: { lat: 37.526121, lng: 127.036670 } },
          place_id: 'manual_yeontangongjang',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '압구정제주집',
          geometry: { location: { lat: 37.521524, lng: 127.031112 } },
          place_id: 'manual_jejujip',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '압구정도슬박',
          geometry: { location: { lat: 37.521524, lng: 127.031112 } },
          place_id: 'manual_doseulbak',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '압구정투아투아',
          geometry: { location: { lat: 37.526354, lng: 127.036785 } },
          place_id: 'manual_tourtour',
          primary_category: '카페/베이커리',
          user_ratings_total: 999
        },
        {
          name: '압구정이웃집통통이',
          geometry: { location: { lat: 37.527336, lng: 127.038767 } },
          place_id: 'manual_tongtonge',
          primary_category: '카페/베이커리',
          user_ratings_total: 999
        },
      ],
      '홍대': [
        {
          name: '홍대육몽',
          geometry: { location: { lat: 37.553226, lng: 126.920697 } },
          place_id: 'manual_yukmong',
          primary_category: '식당/맛집',
          user_ratings_total: 9999
        },
        {
          name: '홍대돈부리',
          geometry: { location: { lat: 37.552423, lng: 126.922427 } },
          place_id: 'manual_hongdae_donburi',
          primary_category: '식당/맛집',
          user_ratings_total: 9999
        },
        {
          name: '홍대무신사',
          geometry: { location: { lat: 37.556541, lng: 126.924057 } },
          place_id: 'manual_hongdae_musinsa',
          primary_category: '쇼핑/문화',
          user_ratings_total: 9999
        },
        {
          name: '홍대카미야',
          geometry: { location: { lat: 37.552551, lng: 126.922356 } },
          place_id: 'manual_hongdae_musinsa',
          primary_category: '식당/맛집',
          user_ratings_total: 9999
        },
        {
          name: '홍대도마',
          geometry: { location: { lat: 37.553059, lng: 126.921397 } },
          place_id: 'manual_hongdae_musinsa',
          primary_category: '식당/맛집',
          user_ratings_total: 9999
        },
        {
          name: '홍대커피랩',
          geometry: { location: { lat: 37.554941, lng: 126.929222 } },
          place_id: 'manual_hongdae_musinsa',
          primary_category: '카페/베이커리',
          user_ratings_total: 9999
        },
        {
          name: '홍대신이도가',
          geometry: { location: { lat: 37.551428, lng: 126.920962 } },
          place_id: 'manual_hongdae_musinsa',
          primary_category: '카페/베이커리',
          user_ratings_total: 9999
        },
        {
          name: '홍대공명',
          geometry: { location: { lat: 37.559917, lng: 126.926249 } },
          place_id: 'manual_hongdae_musinsa',
          primary_category: '카페/베이커리',
          user_ratings_total: 9999
        },
        {
          name: '홍대만동제과',
          geometry: { location: { lat: 37.561506, lng: 126.927253 } },
          place_id: 'manual_hongdae_musinsa',
          primary_category: '카페/베이커리',
          user_ratings_total: 9999
        },
        {
          name: '홍대하이디라오',
          geometry: { location: { lat: 37.557216, lng: 126.924912 } },
          place_id: 'manual_hongdae_musinsa',
          primary_category: '식당/맛집',
          user_ratings_total: 9999
        },
        {
          name: '홍대삿뽀로',
          geometry: { location: { lat: 37.556372, lng: 126.920518 } },
          place_id: 'manual_hongdae_sapporo',
          primary_category: '식당/맛집',
          user_ratings_total: 9999
        },
      ],
      '성수' : [
        {
          name: '성수무신사',
          geometry: { location: { lat: 37.541575, lng: 127.056388 } },
          place_id: 'manual_seongsu_musinsa',
          primary_category: '쇼핑/문화',
          user_ratings_total: 9999
        },
        {
          name: '성수마뗑킴',
          geometry: { location: { lat: 37.547365, lng: 127.053980 } },
          place_id: 'manual_seongsu_matinkim',
          primary_category: '쇼핑/문화',
          user_ratings_total: 9999
        },
        {
          name: '성수디올',
          geometry: { location: { lat: 37.543769, lng: 127.052254 } },
          place_id: 'manual_seongsu_dior',
          primary_category: '쇼핑/문화',
          user_ratings_total: 9999
        },
        {
          name: '성수미키스시',
          geometry: { location: { lat: 37.542905, lng: 127.056078 } },
          place_id: 'manual_seongsu_dior',
          primary_category: '식당/맛집',
          user_ratings_total: 9999
        },
        {
          name: '성수싹쓰리곱창',
          geometry: { location: { lat: 37.538431, lng: 127.055879 } },
          place_id: 'manual_seongsu_dior',
          primary_category: '식당/맛집',
          user_ratings_total: 9999
        },
        {
          name: '성수족발',
          geometry: { location: { lat: 37.546064, lng: 127.054364 } },
          place_id: 'manual_seongsu_dior',
          primary_category: '식당/맛집',
          user_ratings_total: 9999
        },
        {
          name: '성수마리오네',
          geometry: { location: { lat: 37.548935, lng: 127.054320 } },
          place_id: 'manual_seongsu_dior',
          primary_category: '식당/맛집',
          user_ratings_total: 9999
        },
        {
          name: '성수테니',
          geometry: { location: { lat: 37.541191, lng: 127.059311 } },
          place_id: 'manual_seongsu_dior',
          primary_category: '카페/베이커리',
          user_ratings_total: 9999
        },
        {
          name: '성수본지르르',
          geometry: { location: { lat: 37.549304, lng: 127.054655 } },
          place_id: 'manual_seongsu_dior',
          primary_category: '카페/베이커리',
          user_ratings_total: 9999
        },
      ],
        '을지로' : [
        {
          name: '을지로오덕장',
          geometry: { location: { lat: 37.566032, lng: 126.990055 } },
          place_id: 'manual_euljiro_oduckjang',
          primary_category: '식당/맛집',
          user_ratings_total: 9999
        },
        {
          name: '을지로빠우',
          geometry: { location: { lat: 37.567220, lng: 126.995594 } },
          place_id: 'manual_euljiro_bbau',
          primary_category: '카페/베이커리',
          user_ratings_total: 9999
        },
         {
          name: '을지로공간갑',
          geometry: { location: { lat: 37.565462, lng: 126.990278 } },
          place_id: 'manual_euljiro_gongangap',
          primary_category: '카페/베이커리',
          user_ratings_total: 9999
        },
        {
          name: '을지로콘티뉴이티',
          geometry: { location: { lat: 37.563839, lng: 126.990391 } },
          place_id: 'manual_euljiro_gongangap',
          primary_category: '카페/베이커리',
          user_ratings_total: 9999
        },
        {
          name: '을지로다케오호르몬',
          geometry: { location: { lat: 37.565639, lng: 126.991004 } },
          place_id: 'manual_euljiro_dakeohormon',
          primary_category: '식당/맛집',
          user_ratings_total: 9999
        },
        {
          name: '을지깐깐',
          geometry: { location: { lat: 37.565739, lng: 126.991065 } },
          place_id: 'manual_eulji_kkankkan',
          primary_category: '식당/맛집',
          user_ratings_total: 9999
        },
        {
          name: '을지다락',
          geometry: { location: { lat: 37.563716, lng: 126.991412 } },
          place_id: 'manual_eulji_darak',
          primary_category: '식당/맛집',
          user_ratings_total: 9999
        },
      ],
      '잠실': [
        {
          name: '잠실오레노라멘',
          geometry: { location: { lat: 37.509569, lng: 127.109436 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
         {
          name: '잠실애슐리퀸즈',
          geometry: { location: { lat: 37.514472, lng: 127.099999 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '잠실MIP',
          geometry: { location: { lat: 37.509942, lng: 127.105918 } },
          place_id: 'manual_MIP',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '잠실메밀집',
          geometry: { location: { lat: 37.510861, lng: 127.107864 } },
          place_id: 'manual_MIP',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '잠실아그라',
          geometry: { location: { lat: 37.512200, lng: 127.101780 } },
          place_id: 'manual_MIP',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '잠실빌즈',
          geometry: { location: { lat: 37.513236, lng: 127.103849 } },
          place_id: 'manual_MIP',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
         {
          name: '잠실바이킹스워프',
          geometry: { location: { lat: 37.513335, lng: 127.103744 } },
          place_id: 'manual_MIP',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '잠실우프',
          geometry: { location: { lat: 37.507144, lng: 127.106413 } },
          place_id: 'manual_MIP',
          primary_category: '카페/베이커리',
          user_ratings_total: 999
        },
         {
          name: '잠실미크',
          geometry: { location: { lat: 37.507418, lng: 127.105662 } },
          place_id: 'manual_MIP',
          primary_category: '카페/베이커리',
          user_ratings_total: 999
        },
        {
          name: '잠실봉땅',
          geometry: { location: { lat: 37.509636, lng: 127.106169 } },
          place_id: 'manual_MIP',
          primary_category: '카페/베이커리',
          user_ratings_total: 999
        },
         {
          name: '잠실뷰클런즈',
          geometry: { location: { lat: 37.508367, lng: 127.109590 } },
          place_id: 'manual_MIP',
          primary_category: '카페/베이커리',
          user_ratings_total: 999
        },
        {
          name: '잠실터틀힙',
          geometry: { location: { lat: 37.510006, lng: 127.109505 } },
          place_id: 'manual_MIP',
          primary_category: '카페/베이커리',
          user_ratings_total: 999
        },
        {
          name: '잠실로얄테라스가든',
          geometry: { location: { lat: 37.513109, lng: 127.103438 } },
          place_id: 'manual_MIP',
          primary_category: '카페/베이커리',
          user_ratings_total: 999
        },
        {
          name: '잠실디저티스트',
          geometry: { location: { lat: 37.510639, lng: 127.107637 } },
          place_id: 'manual_MIP',
          primary_category: '카페/베이커리',
          user_ratings_total: 999
        },
         {
          name: '잠실이성당',
          geometry: { location: { lat: 37.512456, lng: 127.099229 } },
          place_id: 'manual_MIP',
          primary_category: '카페/베이커리',
          user_ratings_total: 999
        },
        {
          name: '잠실키친205',
          geometry: { location: { lat: 37.514038, lng: 127.104551 } },
          place_id: 'manual_MIP',
          primary_category: '카페/베이커리',
          user_ratings_total: 999
        },
      ],
      '마곡': [
        {
          name: '마곡돈탐구소',
          geometry: { location: { lat: 37.560991, lng: 126.828530 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '마곡금고깃집',
          geometry: { location: { lat: 37.560419, lng: 126.833157 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '마곡숙성도',
          geometry: { location: { lat: 37.561764, lng: 126.825933 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '마곡상해루',
          geometry: { location: { lat: 37.566211, lng: 126.826761 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
         {
          name: '마곡소복집',
          geometry: { location: { lat: 37.568113, lng: 126.825428 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '마곡하양옥',
          geometry: { location: { lat: 37.559070, lng: 126.828219 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
      ],
      '천호': [
        {
          name: '천호경송',
          geometry: { location: { lat: 37.538551, lng: 127.127979 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '천호향돈',
          geometry: { location: { lat: 37.536508, lng: 127.126790 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '천호대팔이네',
          geometry: { location: { lat: 37.539759, lng: 127.125451 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '천호돈',
          geometry: { location: { lat: 37.539182, lng: 127.126212 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '천호더식당',
          geometry: { location: { lat: 37.538728, lng: 127.127519 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '천호하츠베이커리',
          geometry: { location: { lat: 37.538859, lng: 127.124466 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '카페/베이커리',
          user_ratings_total: 999
        },
        {
          name: '천호블랑제리',
          geometry: { location: { lat: 37.536896, lng: 127.123168 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '카페/베이커리',
          user_ratings_total: 999
        },
      ],
      '강남': [
        {
          name: '강남고메램',
          geometry: { location: { lat: 37.494788, lng: 127.028630 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '강남노랑저고리',
          geometry: { location: { lat: 37.498280, lng: 127.025217 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '강남소보키',
          geometry: { location: { lat: 37.501654, lng: 127.027311 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '강남쿄코코',
          geometry: { location: { lat: 37.503337, lng: 127.027411 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '강남화기애애',
          geometry: { location: { lat: 37.502873, lng: 127.026535 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '강남하이디라오',
          geometry: { location: { lat: 37.502613, lng: 127.024735 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
         {
          name: '강남떡도리탕',
          geometry: { location: { lat: 37.500475, lng: 127.028071 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '강남알부자',
          geometry: { location: { lat: 37.500705, lng: 127.027842 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '강남다몽집',
          geometry: { location: { lat: 37.501824, lng: 127.027161 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '강남한과와락',
          geometry: { location: { lat: 37.502941, lng: 127.027154 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '카페/베이커리',
          user_ratings_total: 999
        },
        {
          name: '강남호랑가시',
          geometry: { location: { lat: 37.502983, lng: 127.027286 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '카페/베이커리',
          user_ratings_total: 999
        },
      ],
      '노원': [
        {
          name: '노원쭈꾸미달인',
          geometry: { location: { lat: 37.656591, lng: 127.063197 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '노원목고기집',
          geometry: { location: { lat: 37.656633, lng: 127.065564 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '노원위안바오',
          geometry: { location: { lat: 37.656011, lng: 127.060545 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
        {
          name: '노원털보고된이',
          geometry: { location: { lat: 37.655878, lng: 127.063737 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },{
          name: '노원동선식당',
          geometry: { location: { lat: 37.656153, lng: 127.066021 } },
          place_id: 'manual_bouquet_de_pain',
          primary_category: '식당/맛집',
          user_ratings_total: 999
        },
      ]
    };

    if (MANUAL_CANDIDATES[currentRegion]) {
      candidatePlaces = candidatePlaces.concat(MANUAL_CANDIDATES[currentRegion]);
    }

    const EXACT_OVERRIDES: Record<string, Record<string, string>> = {
      '성수': {
        'bd버거': 'bd버거',
        '베이커리 카페 루프': '성수루프',
        '무신사 엠프티': '성수무신사엠프티',
        'musinsa store': '성수무신사',
        '무신사 테라스': '성수무신사테라스',
        '크리스찬 디올': '성수디올',
        '아뜰리에호수': '성수아뜰리에호수'
      },
      '홍대': {
        '무신사 스탠다드': '홍대무신사스탠다드',
        'musinsa standard': '홍대무신사스탠다드',
        '무신사 스토어': '홍대무신사',
        'musinsa store': '홍대무신사',
        '무신사': '홍대무신사',
        'musinsa': '홍대무신사',
        '카카오프렌즈': '홍대카카오프렌즈',
        '라인프렌즈': '홍대라인프렌즈',
        '육몽': '홍대육몽',        
        '홍대돈부리': '홍대돈부리' 
      },
      '마곡': {},
      '잠실': {'쭈꾸미':'그냥쭈꾸미'},
      '이태원': {'고깃집': '이태원그냥고깃집','케이크샵': '이태원그냥케이크샵', '이태원숯불구이': '이태원그냥숯불구이'
      },
      '을지로': {},
      '압구정': {
        '부케 드 뺑': '부케드뺑','안다즈':'그냥안다즈','가담':'그냥가담','부베트':'그냥부베트','골드피쉬':'그냥골드피쉬'
      },
      '강남': {'강남 맛집 소개팅':'강남그냥소개팅','김밥카페':'강남그냥김밥','강남뉴욕러브베이글':'강남그냥뉴욕러브베이글'},
      '천호': {'왕대포':'그냥왕대포','누룽지통닭구이':'그냥누룽지통닭구이','크리스탈제이드':'그냥크리스탈제이드','장원닭한마리':'그냥장원닭한마리'},
      '노원':{'이자카야 모리':'그냥이자카야 모리'}
    };

    // 1. 네이버 API 호출 전 모든 후보군의 키워드 사전 추출
    let preEvaluatedPlaces = candidatePlaces.map(place => {
      let expectedNaverKw = '';
      let isOverridden = false;
      const lowerName = place.name.toLowerCase();

      const regionOverrides = EXACT_OVERRIDES[currentRegion];
      if (regionOverrides) {
          const sortedKeys = Object.keys(regionOverrides).sort((a, b) => b.length - a.length);
          for (const key of sortedKeys) {
            if (lowerName.includes(key.toLowerCase())) {
              expectedNaverKw = regionOverrides[key];
              isOverridden = true;
              break;
            }
          }
      }

      if (!isOverridden) {
        let coreKw = getExtractKeyword(place.name, STOP_WORDS_REGEX); 
        if (!coreKw || coreKw.length < 1) {
            return { ...place, expectedNaverKw: '', cleanedName: cleanPlaceName(place.name, STOP_WORDS_REGEX) };
        }
        
        // 상호명(coreKw)에 이미 지역명이나 축약어(예: '을지')가 포함된 경우 중복 부착 방지
        const checkKeyword = currentRegion === '을지로' ? '을지' : currentRegion;
        let candidateKw = coreKw.includes(checkKeyword) ? coreKw : `${REGION_PREFIX}${coreKw}`;
        
        // 범용 키워드 차단 로직
        const genericKws = ['커피','케이크샵','스시', '카페', '맛집', '식당', '술집', '젤라또', '방탈출', '베이커리', '숯불구이', '고깃집', '고기집', '닭갈비', '초밥', '라멘', '야키토리', '미용실', '제과점', '디저트', '소품샵', '팝업','오마카세','삼계탕','교회','한식'];

        if (genericKws.includes(coreKw) || genericKws.some(w => candidateKw === `${REGION_PREFIX}${w}`)) {
            const rawName = place.name.split(/[,|\(\)\[\]\-]/)[0].replace(/\s+/g, '');
            // 범용 키워드일 때도 동일한 중복 체크 기준 적용
            candidateKw = rawName.includes(checkKeyword) ? rawName : REGION_PREFIX + rawName;
        }
        expectedNaverKw = candidateKw;
      }
      return { ...place, expectedNaverKw, cleanedName: cleanPlaceName(place.name, STOP_WORDS_REGEX) };
    });

    // 2. 추출된 키워드를 기준으로 '본점' 우선 중복 제거 병합
    let deduplicatedPlaces: any[] = [];
    const kwMap = new Map<string, any[]>();

    preEvaluatedPlaces.forEach(p => {
        const kw = p.expectedNaverKw;
        if (!kw || kw.trim() === '') {
            deduplicatedPlaces.push(p);
        } else {
            if (!kwMap.has(kw)) kwMap.set(kw, []);
            kwMap.get(kw)!.push(p);
        }
    });

    kwMap.forEach((places, kw) => {
        if (places.length === 1) {
            deduplicatedPlaces.push(places[0]);
        } else {
            const mainBranch = places.find(p => p.name.includes('본점'));
            if (mainBranch) {
                deduplicatedPlaces.push(mainBranch);
            } else {
                places.sort((a, b) => (b.user_ratings_total || 0) - (a.user_ratings_total || 0));
                deduplicatedPlaces.push(places[0]);
            }
        }
    });

    // 3. 중복 제거된 깔끔한 리스트만 네이버 API 호출 (비용 절감)
    let evaluatedPlaces: any[] = [];
    for (let i = 0; i < deduplicatedPlaces.length; i++) {
      const place = deduplicatedPlaces[i];
      
      if (!place.expectedNaverKw) {
          evaluatedPlaces.push({ ...place, searchVolume: 10 });
          continue;
      }

      const timestamp = Date.now().toString();
      const signature = await generateSignature(timestamp, 'GET', '/keywordstool', NAVER_AD_SECRET_KEY);
      const adUrl = `https://api.naver.com/keywordstool?hintKeywords=${encodeURIComponent(place.expectedNaverKw)}&showDetail=1`;
      
      try {
        const res = await fetch(adUrl, {
          method: 'GET',
          headers: { 'X-Timestamp': timestamp, 'X-API-KEY': NAVER_AD_ACCESS_LICENSE, 'X-Customer': NAVER_AD_CUSTOMER_ID, 'X-Signature': signature }
        });

        let exactSearchVolume = 10; 
        if (res.ok) {
          const data = await res.json();
          if (data.keywordList && data.keywordList.length > 0) {
            const exactMatch = data.keywordList.find((k: any) => {
              const naverCore = k.relKeyword.replace(/[^가-힣a-zA-Z0-9]/g, '');
              return naverCore === place.expectedNaverKw;
            });
            if (exactMatch) {
              const pc = typeof exactMatch.monthlyPcQcCnt === 'number' ? exactMatch.monthlyPcQcCnt : 10;
              const mobile = typeof exactMatch.monthlyMobileQcCnt === 'number' ? exactMatch.monthlyMobileQcCnt : 10;
              exactSearchVolume = pc + mobile;
            }
          }
        }
        evaluatedPlaces.push({ ...place, searchVolume: exactSearchVolume });
      } catch (e) {
        evaluatedPlaces.push({ ...place, searchVolume: 10 });
      }
      
      await new Promise(r => setTimeout(r, NAVER_AD_DELAY));
    }

    // 카테고리 강제 재지정 사전 (분류 오류 수정용)
    const CATEGORY_OVERRIDES: Record<string, string> = {
      '바이킹스워프': '식당/맛집',
      '더메이드뷔페': '식당/맛집',
      '언플러그드': '쇼핑/문화'
    };

    const categorizedPlaces: Record<string, any[]> = { '식당/맛집': [], '카페/베이커리': [], '쇼핑/문화': [] };
    
    evaluatedPlaces.forEach(p => {
      // 이름에 사전의 키워드가 포함되어 있으면 강제로 카테고리 변경
      for (const [key, correctCat] of Object.entries(CATEGORY_OVERRIDES)) {
        if (p.name.includes(key)) {
          p.primary_category = correctCat;
          break;
        }
      }
      if (categorizedPlaces[p.primary_category]) categorizedPlaces[p.primary_category].push(p);
    });

    let finalTopPlaces: any[] = [];
    let csvData = "카테고리,카테고리별 순위,상호명,추출된키워드,구글리뷰수,네이버검색량\n";

    for (const category in categorizedPlaces) {
      const allSortedPlaces = categorizedPlaces[category].sort((a, b) => b.searchVolume - a.searchVolume);
      const top10 = allSortedPlaces.slice(0, 10).map((p, idx) => ({ ...p, rankNo: idx + 1 }));
      
      top10.forEach((p) => {
        csvData += `${category},${category} ${p.rankNo}위,"${p.name}","${p.expectedNaverKw || ''}",${p.user_ratings_total || 0},${p.searchVolume || 0}\n`;
      });
      
      finalTopPlaces = finalTopPlaces.concat(top10);
    }

    const finalHotspots = [];
    for (let i = 0; i < finalTopPlaces.length; i++) {
      const place = finalTopPlaces[i];
      const kw = place.expectedNaverKw || (`${REGION_PREFIX} ` + place.cleanedName);
      const pQuery = encodeURIComponent(kw);
      
      const blogUrl = `https://openapi.naver.com/v1/search/blog.json?query=${pQuery}&display=1&sort=sim`;
      const imgUrl = `https://openapi.naver.com/v1/search/image.json?query=${pQuery}&display=1&sort=sim`;
      const naverHeaders = { 'X-Naver-Client-Id': NAVER_CLIENT_ID, 'X-Naver-Client-Secret': NAVER_CLIENT_SECRET };

      const [blogRes, imgRes] = await Promise.all([
        fetch(blogUrl, { headers: naverHeaders }),
        fetch(imgUrl, { headers: naverHeaders })
      ]);

      let bestBlogLink = null;
      let imageUrl = null;

      if (blogRes.ok) {
        const bData = await blogRes.json();
        bestBlogLink = bData.items?.[0]?.link || null;
      }
      if (imgRes.ok) {
        const iData = await imgRes.json();
        imageUrl = iData.items?.[0]?.link || null;
      }
      if (!imageUrl) {
        imageUrl = `https://picsum.photos/seed/${place.place_id}/400/400`;
      }

      finalHotspots.push({
        no: place.rankNo,
        name: place.name,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        type: place.primary_category, 
        status: '원활',
        custom_img: imageUrl,
        youtube_vid: bestBlogLink,
        trend_score: place.searchVolume || 0,
        last_updated: new Date().getTime(),
        extracted_kw: kw,
        region: currentRegion
      });
      
      await new Promise(r => setTimeout(r, NAVER_SEARCH_DELAY));
    }

    await supabase.from('places').delete().is('region', null);

    const { error: clearError } = await supabase.from('places').delete().eq('region', currentRegion).neq('no', 0);
    if (clearError) throw clearError;

    const { error: dbError } = await supabase.from('places').insert(finalHotspots);
    if (dbError) throw dbError;

    // stations 테이블 last_updated 갱신
    await supabase
      .from('stations')
      .update({ last_updated: new Date().toISOString() })
      .eq('name', currentRegion);

    return new Response(JSON.stringify({ success: true, count: finalHotspots.length, data: finalHotspots, debug_csv: csvData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});