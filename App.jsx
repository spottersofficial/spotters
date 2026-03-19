import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- [디자인 시스템 1] Color Palette ---
const BRAND_GRADIENT = "bg-gradient-to-br from-[#5E2A8C] to-[#FF8C00]";
const BRAND_TEXT_GRADIENT = "bg-gradient-to-br from-[#5E2A8C] to-[#FF8C00] bg-clip-text text-transparent";
const PURPLE_COLOR = "#5E2A8C";

// --- [디자인 시스템 2] 로고 및 아이콘 ---
const SpottersLogo = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className={className}>
    <defs>
      <linearGradient id="brand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#5E2A8C" />
        <stop offset="100%" stopColor="#FF8C00" />
      </linearGradient>
    </defs>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#brand-gradient)" />
  </svg>
);

const XIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const AlertCircleIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

const StorefrontIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>;
const CoffeeIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>;
const ParkingIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>;
const BookOpenIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;

// --- 초기 상점 & 주차장 통합 데이터 ---
const INITIAL_DATA = [
  { no: 1, type: '팝업스토어', status: '혼잡', wait: 30, time: '30분 내외', name: '프리카 성수 팝업', address: '서울 성동구 연무장13길 4 1층', lat: 37.544722, lng: 127.056111, hasImage: true, labelPos: 'top', lastUpdated: null, customImg: null },
  { no: 2, type: '팝업스토어', status: '마감', wait: 0, time: '불가', name: '이클립스 월드', address: '서울 성동구 성수이로 88 남정빌딩', lat: 37.543056, lng: 127.056944, hasImage: true, labelPos: 'right', lastUpdated: null, customImg: null },
  { no: 3, type: '팝업스토어', status: '혼잡', wait: 35, time: '30분 내외', name: '베어스랜드', address: '서울특별시 성동구 성수이로16길 5', lat: 37.546111, lng: 127.058333, hasImage: true, labelPos: 'left', lastUpdated: null, customImg: null },
  { no: 4, type: '팝업스토어', status: '혼잡', wait: 35, time: '30분 내외', name: '온그리디언츠 이너글로우', address: '서울 성동구 연무장길 65 LECT', lat: 37.543611, lng: 127.054722, hasImage: true, labelPos: 'bottom', lastUpdated: null, customImg: null },
  { no: 5, type: '팝업스토어', status: '보통', wait: 15, time: '10분 내외', name: '쿠팡 알럭스 팝업', address: '서울 성동구 연무장11길 11 1층', lat: 37.545556, lng: 127.053889, hasImage: true, labelPos: 'top', lastUpdated: null, customImg: null },
  { no: 6, type: '팝업스토어', status: '보통', wait: 10, time: '10분 내외', name: '러쉬 성수 팝업씨어터', address: '서울 성동구 연무장길 58-1 2층', lat: 37.543333, lng: 127.055000, hasImage: true, labelPos: 'right', lastUpdated: null, customImg: null },
  { no: 7, type: '팝업스토어', status: '보통', wait: 15, time: '10분 내외', name: '무직타이거 팝업', address: '서울 성동구 연무장길 57 이구홈', lat: 37.543056, lng: 127.055278, hasImage: true, labelPos: 'left', lastUpdated: null, customImg: null },
  { no: 8, type: '팝업스토어', status: '원활', wait: 0, time: '대기 없음', name: '옴니피플 빈티지 팝업', address: '서울 성동구 연무장15길 11 EQL', lat: 37.545833, lng: 127.057222, hasImage: true, labelPos: 'top', lastUpdated: null, customImg: null },
  { no: 9, type: '팝업스토어', status: '보통', wait: 15, time: '10분 내외', name: '성수 콜랩코리아 팝업', address: '서울 성동구 연무장7길 16', lat: 37.545278, lng: 127.053611, hasImage: true, labelPos: 'bottom', lastUpdated: null, customImg: null },
  { no: 10, type: '팝업스토어', status: '원활', wait: 0, time: '대기 없음', name: '와키윌리 성수 플래그십', address: '서울 성동구 성수이로 86', lat: 37.542850, lng: 127.056900, hasImage: true, labelPos: 'left', lastUpdated: null, customImg: null },
  { no: 11, type: '팝업스토어', status: '혼잡', wait: 60, time: '50분 내외', name: '조말론 런던 잉글리시 페어', address: '서울 성동구 연무장7길 13 올리브영N', lat: 37.545000, lng: 127.053889, hasImage: true, labelPos: 'right', lastUpdated: null, customImg: null },
  { no: 12, type: '팝업스토어', status: '진행예정', wait: 0, time: '대기 없음', name: '레인메이커스 뷰티원더랜드', address: '서울 성동구 연무장길 73 XYZ SEOUL', lat: 37.543889, lng: 127.054167, hasImage: true, labelPos: 'top', lastUpdated: null, customImg: null },
  { no: 13, type: '팝업스토어', status: '진행예정', wait: 0, time: '대기 없음', name: '새로중앙박물관 팝업스토어', address: '서울 성동구 연무장13길 11 1층', lat: 37.544850, lng: 127.056250, hasImage: true, labelPos: 'right', lastUpdated: null, customImg: null },
  { no: 14, type: '카페', status: '보통', wait: 5, time: '10분 내외', name: '카페씨떼', address: '서울 성동구 성수이로 71 주3동', lat: 37.542222, lng: 127.056111, hasImage: true, labelPos: 'bottom', lastUpdated: null, customImg: null },
  { no: 15, type: '식당', status: '보통', wait: 10, time: '30분 내외', name: '멘츠루 성수점', address: '서울 성동구 성수이로20길 10 103호', lat: 37.541944, lng: 127.056389, hasImage: true, labelPos: 'left', lastUpdated: null, customImg: null },
  { no: 16, type: '카페', status: '보통', wait: 5, time: '10분 내외', name: '젠젠 성수점', address: '서울 성동구 연무장11길 10', lat: 37.545278, lng: 127.054167, hasImage: true, labelPos: 'right', lastUpdated: null, customImg: null },
  { no: 17, type: '카페', status: '보통', wait: 5, time: '10분 내외', name: '성수동대림창고갤러리', address: '서울 성동구 성수이로 78', lat: 37.541667, lng: 127.056944, hasImage: true, labelPos: 'top', lastUpdated: null, customImg: null },
  { no: 18, type: '식당', status: '보통', wait: 3, time: '10분 내외', name: '안목 성수', address: '서울 성동구 뚝섬로13길 34 1층', lat: 37.542222, lng: 127.052778, hasImage: true, labelPos: 'right', lastUpdated: null, customImg: null },
  { no: 19, type: '식당', status: '원활', wait: 3, time: '10분 내외', name: 'bd 버거', address: '서울 성동구 성수이로14길 7 2층', lat: 37.542500, lng: 127.056111, hasImage: true, labelPos: 'left', lastUpdated: null, customImg: null },
  { no: 20, type: '베이커리', status: '혼잡', wait: 40, time: '30분 내외', name: '자연도 소금빵', address: '서울 성동구 연무장길 56-1 1층', lat: 37.543333, lng: 127.055278, hasImage: true, labelPos: 'top', lastUpdated: null, customImg: null },
  { no: 21, type: '디저트', status: '혼잡', wait: 80, time: '50분 내외', name: '마망젤라또', address: '서울 성동구 연무장9길 8 1층', lat: 37.544722, lng: 127.055000, hasImage: true, labelPos: 'left', lastUpdated: null, customImg: null },
  { no: 22, type: '카페', status: '보통', wait: 6, time: '10분 내외', name: '핌피', address: '서울 성동구 연무장9길 6 1층', lat: 37.544722, lng: 127.055278, hasImage: true, labelPos: 'right', lastUpdated: null, customImg: null },
  { no: 23, type: '디저트', status: '보통', wait: 20, time: '10분 내외', name: '트리츠', address: '서울 성동구 연무장길 70 1층', lat: 37.543889, lng: 127.053889, hasImage: true, labelPos: 'bottom', lastUpdated: null, customImg: null },
  { no: 24, type: '식당', status: '원활', wait: 0, time: '대기 없음', name: 'Bored & Hungry', address: '서울 성동구 성수이로18길 32 1층', lat: 37.542500, lng: 127.056389, hasImage: true, labelPos: 'right', lastUpdated: null, customImg: null },
  { no: 25, type: '식당', status: '혼잡', wait: 10, time: '50분 내외', name: '죠죠 성수점', address: '서울 성동구 연무장17길 7 1층', lat: 37.546111, lng: 127.056389, hasImage: true, labelPos: 'top', lastUpdated: null, customImg: null },
  { no: 26, type: '카페', status: '원활', wait: 0, time: '대기 없음', name: '프롤라 카페', address: '서울 성동구 연무장17길 5 1층', lat: 37.546111, lng: 127.056111, hasImage: true, labelPos: 'left', lastUpdated: null, customImg: null },
  { no: 27, type: '식당', status: '원활', wait: 0, time: '대기 없음', name: '페이퍼플레이트 피자', address: '서울 성동구 성수이로14길 15 1층', lat: 37.542100, lng: 127.056000, hasImage: true, labelPos: 'top', lastUpdated: null, customImg: null },
  { no: 28, type: '카페', status: '원활', wait: 0, time: '대기 없음', name: '레이지요거트', address: '서울 성동구 성수이로14길 14 B동', lat: 37.542222, lng: 127.056389, hasImage: true, labelPos: 'right', lastUpdated: null, customImg: null },
  { no: 29, type: '카페', status: '원활', wait: 0, time: '대기 없음', name: '플로렌틴', address: '서울 성동구 성수이로14길 14 가동', lat: 37.542350, lng: 127.056450, hasImage: true, labelPos: 'bottom', lastUpdated: null, customImg: null },
  { no: 30, type: '상점', status: '보통', wait: 10, time: '10분 내외', name: '헤트라스', address: '서울 성동구 연무장길 68 B1~3F', lat: 37.543750, lng: 127.053750, hasImage: true, labelPos: 'right', lastUpdated: null, customImg: null },
  { no: 31, type: '식당', status: '원활', wait: 10, time: '50분 내외', name: '꿉당', address: '서울 성동구 성수이로20길 10 경협회관', lat: 37.541800, lng: 127.056500, hasImage: true, labelPos: 'top', lastUpdated: null, customImg: null },
  { no: 32, type: '식당', status: '원활', wait: 3, time: '10분 내외', name: '이북집 순대국', address: '서울특별시 성동구 성수이로20길 10 1층', lat: 37.542050, lng: 127.056250, hasImage: true, labelPos: 'right', lastUpdated: null, customImg: null },
  { no: 33, type: '상점', status: '원활', wait: 0, time: '대기 없음', name: '리얼월드성수', address: '서울특별시 성동구 연무장13길 8 메리히어', lat: 37.544900, lng: 127.056000, hasImage: true, labelPos: 'bottom', lastUpdated: null, customImg: null },
  { no: 34, type: '상점', status: '원활', wait: 0, time: '대기 없음', name: '클라이밍파크', address: '서울 성동구 연무장13길 7', lat: 37.544722, lng: 127.055833, hasImage: true, labelPos: 'left', lastUpdated: null, customImg: null },
  { no: 35, type: '상점', status: '보통', wait: 15, time: '10분 내외', name: '미피스토어 서울', address: '서울 성동구 연무장13길 5', lat: 37.544722, lng: 127.055556, hasImage: true, labelPos: 'top', lastUpdated: null, customImg: null },
  
  { no: 30001, type: '주차장', status: '원활', wait: 50, capacity: 154, time: '총 154면 / 남은 50대', name: '팩토리얼 성수', address: '서울 성동구 연무장7길 13', lat: 37.543880, lng: 127.054350, hasImage: false, labelPos: 'bottom', lastUpdated: null, customImg: null },
  { no: 30002, type: '주차장', status: '마감', wait: 0, capacity: 70, time: '총 70면 / 남은 0대', name: '무신사 E1', address: '서울 성동구 성수동2가 271-22', lat: 37.544650, lng: 127.055550, hasImage: false, labelPos: 'top', lastUpdated: null, customImg: null },
  { no: 30003, type: '주차장', status: '원활', wait: 34, capacity: 178, time: '총 178면 / 남은 34대', name: '무신사 S1', address: '서울 성동구 성수동2가 324-2', lat: 37.542600, lng: 127.055950, hasImage: false, labelPos: 'right', lastUpdated: null, customImg: null }
];

const adjustOverlappingCoordinates = (data) => {
  return data.map(place => {
    if (place.no === 1) return { ...place, lat: 37.544600, lng: 127.056111 };
    if (place.no === 13) return { ...place, lat: 37.544980, lng: 127.056250 };
    return place;
  });
};

const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 800; 

        if (width > height) {
          if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        }
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMinutes < 1) return '방금 업데이트';
  if (diffMinutes < 60) return `${diffMinutes}분 전 업데이트`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전 업데이트`;
  return `${Math.floor(diffHours / 24)}일 전 업데이트`;
};

// --- 지도 점 마커 로직 ---
const createPointMarker = (place) => {
  let bgColor = 'bg-neutral-500';
  let pulseEffect = '';
  let breatheClass = '';

  if (place.status === '마감' || place.status === '만차') {
    bgColor = 'bg-red-500'; 
    breatheClass = 'animate-breathe'; 
  } else if (place.status === '혼잡') {
    bgColor = 'bg-orange-500';
    breatheClass = 'animate-breathe'; 
  } else if (place.status === '보통') {
    bgColor = 'bg-amber-400';
  } else if (place.status === '원활' || place.status === '여유') {
    bgColor = 'bg-emerald-500';
  } else if (place.status === '진행예정') {
    bgColor = `bg-[${PURPLE_COLOR}]`;
  }

  let labelPositionClass = '';
  switch(place.labelPos) {
    case 'top': labelPositionClass = 'bottom-full mb-1.5 left-1/2 -translate-x-1/2'; break;
    case 'bottom': labelPositionClass = 'top-full mt-1.5 left-1/2 -translate-x-1/2'; break;
    case 'left': labelPositionClass = 'right-full mr-2 top-1/2 -translate-y-1/2'; break;
    case 'right': default: labelPositionClass = 'left-full ml-2 top-1/2 -translate-y-1/2'; break;
  }

  return L.divIcon({
    className: 'custom-dot-marker',
    html: `
      <div class="relative flex items-center justify-center group cursor-pointer" style="width: 14px; height: 14px;">
        ${pulseEffect}
        <div class="relative w-3.5 h-3.5 rounded-full border-[2px] border-white shadow-md ${bgColor} ${breatheClass} z-20 transition-transform group-hover:scale-125"></div>
        <span class="absolute ${labelPositionClass} text-[11.5px] font-bold text-neutral-800 tracking-tight whitespace-nowrap z-30" 
              style="text-shadow: -1.5px -1.5px 0 #fff, 1.5px -1.5px 0 #fff, -1.5px 1.5px 0 #fff, 1.5px 1.5px 0 #fff, 0 2px 4px rgba(0,0,0,0.15); font-family: Pretendard, sans-serif;">
          ${place.name}
        </span>
      </div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7] 
  });
};

const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => { map.flyTo(center, 16, { animate: true, duration: 0.8 }); }, [center, map]);
  return null;
};

// --- 관리자(Admin) 전용 개별 수정 패널 ---
const AdminRow = ({ place, onSave }) => {
  const isParking = place.type === '주차장';
  
  const [wait, setWait] = useState(place.wait);
  const [status, setStatus] = useState(place.status);
  const [imageFile, setImageFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isParking) {
      if (wait >= 10) setStatus('원활');
      else if (wait >= 1 && wait <= 9) setStatus('혼잡');
      else if (wait <= 0) setStatus('마감');
    }
  }, [wait, isParking]);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200 flex flex-col gap-3">
      <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
        <h4 className="font-bold text-sm text-neutral-900">{place.name}</h4>
        <span className="text-[10px] text-neutral-400">{place.type}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-neutral-500 uppercase">혼잡도 상태</label>
          {isParking ? (
            <div className={`p-2 rounded-lg text-xs font-bold text-center border ${
              status === '원활' ? 'bg-green-50 text-green-600 border-green-200' :
              status === '혼잡' ? 'bg-orange-50 text-orange-600 border-orange-200' :
              'bg-red-50 text-red-600 border-red-200'
            }`}>
              {status}
            </div>
          ) : (
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium outline-none focus:border-[#FF8C00]">
              <option value="원활">원활</option>
              <option value="보통">보통</option>
              <option value="혼잡">혼잡</option>
              <option value="마감">마감</option>
              <option value="진행예정">진행예정</option>
            </select>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-neutral-500 uppercase">{isParking ? '현재 가능 대수(손으로 입력)' : '대기 인원(명)'}</label>
          <input type="number" min="0" value={wait} onChange={(e) => setWait(Number(e.target.value))} className="p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium outline-none focus:border-[#FF8C00]" />
        </div>
      </div>

      {!isParking && (
        <div className="flex flex-col gap-1">
           <label className="text-[10px] font-bold text-neutral-500 uppercase">현장 사진 업데이트 (선택)</label>
           <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="text-xs text-neutral-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-[#5E2A8C] hover:file:bg-purple-100" />
        </div>
      )}

      <button 
        onClick={async () => {
          setIsSaving(true);
          await onSave(place.no, status, wait, imageFile);
          setIsSaving(false);
          setImageFile(null); 
        }} 
        disabled={isSaving}
        className={`mt-1 w-full text-white font-bold text-xs py-2.5 rounded-lg transition-colors ${isSaving ? 'bg-neutral-400' : 'bg-[#1A1A1A] hover:bg-[#FF8C00]'}`}
      >
        {isSaving ? "저장 중..." : "데이터 업데이트 저장"}
      </button>
    </div>
  );
};

// --- 메인 App 컴포넌트 ---
function App() {
  const [placesData, setPlacesData] = useState(adjustOverlappingCoordinates(INITIAL_DATA));
  const [activeTab, setActiveTab] = useState('팝업스토어');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mapCenter, setMapCenter] = useState([37.5445, 127.0560]); 
  const [expandedImage, setExpandedImage] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [secretCount, setSecretCount] = useState(0);

  // --- 데이터 로드 ---
  useEffect(() => {
    fetch('/data.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const mergedData = INITIAL_DATA.map(initPlace => {
            const savedPlace = data.find(p => p.no === initPlace.no);
            return savedPlace ? { ...initPlace, ...savedPlace } : initPlace;
          });
          setPlacesData(adjustOverlappingCoordinates(mergedData));
        }
      })
      .catch(err => console.error("데이터 로드 실패:", err));
  }, []);

  const handleSecretLogin = () => {
    if (secretCount >= 4) {
      const pwd = window.prompt("관리자 비밀번호를 입력하세요.");
      if (pwd === "mmjc0812") {
        setIsAdminMode(true);
      } else {
        alert("비밀번호가 일치하지 않습니다.");
      }
      setSecretCount(0);
    } else {
      setSecretCount(prev => prev + 1);
    }
  };

  const handleAdminSave = async (no, newStatus, newWait, imageFile) => {
    const TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
    const REPO = import.meta.env.VITE_REPO_NAME;
    let newImgUrl = null;

    if (!TOKEN || !REPO) {
      alert("Netlify/Cloudflare 환경 변수 설정이 필요합니다.");
      return;
    }

    try {
      if (imageFile) {
        const compressedBase64 = await compressImage(imageFile); 
        
        const fileExt = "jpg"; 
        const fileName = `upload_${no}_${Date.now()}.${fileExt}`;
        const filePath = `public/images/${fileName}`;

        const imgUploadRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Admin: Upload optimized image for place ${no}`,
            content: compressedBase64
          })
        });

        if (!imgUploadRes.ok) throw new Error('이미지 업로드 실패');
        newImgUrl = `/images/${fileName}`;
      }

      const updatedData = placesData.map(p => {
        if (p.no === no) {
          const updatedTime = p.type === '주차장' ? `총 ${p.capacity}면 / 남은 ${newWait}대` : p.time;
          return { 
            ...p, 
            status: newStatus, 
            wait: newWait, 
            time: updatedTime,
            lastUpdated: Date.now(),
            ...(newImgUrl && { customImg: newImgUrl })
          };
        }
        return p;
      });

      let sha = null;
      try {
        const fileRes = await fetch(`https://api.github.com/repos/${REPO}/contents/public/data.json`, {
          headers: { Authorization: `Bearer ${TOKEN}` }
        });
        if (fileRes.ok) {
          const fileData = await fileRes.json();
          sha = fileData.sha;
        }
      } catch (err) { /* ignore */ }

      const jsonBody = {
        message: `Admin: Update data for place ${no}`,
        content: btoa(unescape(encodeURIComponent(JSON.stringify(updatedData, null, 2))))
      };
      if (sha) jsonBody.sha = sha;

      const updateRes = await fetch(`https://api.github.com/repos/${REPO}/contents/public/data.json`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonBody)
      });

      if (updateRes.ok) {
        setPlacesData(adjustOverlappingCoordinates(updatedData)); 
        alert(`저장 성공!\n\n1~2분 뒤에 반영됩니다.`);
      } else {
        throw new Error(`데이터 갱신 실패`);
      }

    } catch (err) {
      console.error(err);
      alert(`[오류] ${err.message}`);
    }
  };

  const filteredData = placesData.filter(item => {
    if (activeTab === '팝업스토어') return item.type === '팝업스토어';
    if (activeTab === 'F&B/상점') return ['식당', '카페', '베이커리', '디저트', '상점'].includes(item.type);
    if (activeTab === '주차장') return item.type === '주차장';
    return true;
  });

  const handlePlaceClick = (place) => {
    setSelectedPlace(place);
    setMapCenter([place.lat, place.lng]);
  };

  const tabs = [
    { id: '팝업스토어', label: '팝업', icon: StorefrontIcon },
    { id: 'F&B/상점', label: 'F&B/상점', icon: CoffeeIcon },
    { id: '주차장', label: '주차장', icon: ParkingIcon },
    { id: '블로그', label: '팝업 정보', isLink: true, url: 'https://blog.naver.com/spotters', icon: BookOpenIcon }
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&display=swap');
        body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif; }
        .font-montserrat { font-family: 'Montserrat', sans-serif; }
        .leaflet-container { width: 100%; height: 100%; z-index: 0; background: #e5e5e5; }
        .leaflet-bottom { z-index: 0 !important; }
        .custom-dot-marker { background: transparent; border: none; overflow: visible !important; }
        .photo-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
        .photo-tooltip::before { display: none !important; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        
        /* 💡 [수정완료] 눈에 띄지만 과하지 않은 고급스러운 깜빡임 애니메이션 (크기 1.25배 확대 + 투명도) */
        @keyframes noticeable-breathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.25); opacity: 0.75; }
        }
        .animate-breathe {
          animation: noticeable-breathe 1.2s ease-in-out infinite;
        }
      `}</style>

      <div className="bg-[#1A1A1A] min-h-screen flex items-center justify-center">
        <div className="w-full max-w-[430px] h-[100dvh] sm:h-[85vh] bg-[#FFFFFF] relative sm:rounded-[40px] overflow-hidden shadow-2xl sm:border-[8px] sm:border-neutral-800 flex flex-col">
          
          <header className="absolute top-0 w-full z-50 p-4 pt-6 sm:pt-4 pointer-events-none">
            <div className="bg-white/85 backdrop-blur-xl rounded-2xl shadow-sm border border-neutral-100 p-3.5 flex justify-between items-center pointer-events-auto">
              <div className="flex items-center gap-2">
                <SpottersLogo className="w-8 h-8 drop-shadow-sm" />
                <div className="flex flex-col mt-0.5">
                  <h1 className={`text-[22px] font-black tracking-tight leading-none font-montserrat ${BRAND_TEXT_GRADIENT}`}>
                    SEONGSU<span className="text-neutral-900">.NOW</span>
                  </h1>
                  <span onClick={handleSecretLogin} className="text-[9px] font-bold text-neutral-400 tracking-widest uppercase mt-0.5 cursor-pointer select-none">
                    by Spotters {isAdminMode && "(ADMIN)"}
                  </span>
                </div>
              </div>
              {!isAdminMode && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 rounded-md border border-red-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-red-600 tracking-wider">LIVE</span>
                </div>
              )}
            </div>
          </header>

          {isAdminMode ? (
            <div className="flex-1 w-full h-full bg-neutral-100 pt-28 pb-6 px-4 overflow-y-auto flex flex-col gap-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-black text-neutral-900">데이터 실시간 관리</h2>
                <button onClick={() => setIsAdminMode(false)} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full">닫기</button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {tabs.filter(t => !t.isLink).map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap ${activeTab === tab.id ? 'bg-[#5E2A8C] text-white' : 'bg-white text-neutral-600 border border-neutral-200'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-4 pb-10">
                {filteredData.map(place => (
                  <AdminRow key={place.no} place={place} onSave={handleAdminSave} />
                ))}
              </div>
            </div>

          ) : (

          <>
            <nav className="absolute top-24 w-full z-40 px-4 pointer-events-none flex flex-col gap-2.5">
              <div className={`pointer-events-auto ${BRAND_GRADIENT} text-white text-[11px] font-bold text-center py-2.5 px-3 rounded-[14px] shadow-lg flex items-center justify-center gap-1.5 border border-white/20`}>
                <AlertCircleIcon className="w-4 h-4 opacity-90" />
                이 웹사이트의 실시간 정보는 주말(토/일)에만 업데이트 됩니다.
              </div>
            </nav>

            <div className="flex-1 w-full h-full relative z-0">
              <MapContainer center={mapCenter} zoom={16} zoomControl={false} className="w-full h-full">
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                <MapController center={mapCenter} />
                
                {filteredData.map(place => (
                  <Marker 
                    key={place.no} 
                    position={[place.lat, place.lng]}
                    icon={createPointMarker(place)}
                    eventHandlers={{ click: () => handlePlaceClick(place) }}
                  >
                    {/* 💡 [수정완료] 위아래 싱크 불일치 문제를 해결하기 위해, 하단 카드가 켜진 '선택된 장소'에만 툴팁이 고정(permanent)되도록 설정 */}
                    {selectedPlace?.no === place.no && place.hasImage && (
                      <Tooltip permanent interactive direction="top" offset={[0, -12]} opacity={1} className="photo-tooltip">
                        {/* 💡 [수정완료] 사진뿐만 아니라 상단 팝업 전체 영역을 터치해도 사진이 확대되도록 이벤트 추가 */}
                        <div 
                          className="relative w-[140px] h-[180px] rounded-[24px] overflow-hidden shadow-2xl border-[4px] border-white cursor-pointer active:scale-95 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedImage(place);
                          }}
                        >
                          <img 
                            src={place.customImg || `/images/${place.no}.jpg`} 
                            alt={place.name} 
                            className="w-full h-full object-cover" 
                            onError={(e) => { e.target.src = `https://picsum.photos/seed/${place.no}/300/400`; }}
                          />
                          
                          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[9px] px-2 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            {place.lastUpdated ? formatTimeAgo(place.lastUpdated) : 'LIVE'}
                          </div>
                          
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-8 flex flex-col items-center text-center">
                            <span className="text-white text-xs font-black block truncate w-full mb-0.5">{place.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${place.status === '마감' || place.status === '만차' ? 'bg-red-500/90 text-white' : place.status === '혼잡' ? 'bg-orange-500/90 text-white' : place.status === '보통' ? 'bg-amber-500/90 text-white' : 'bg-green-500/90 text-white'}`}>
                              {place.status} 
                              {place.type === '주차장' 
                                ? (place.status === '마감' ? '' : ` ${place.wait}대`) 
                                : (place.status !== '마감' ? ` ${place.wait}명` : '')}
                            </span>
                          </div>
                        </div>
                      </Tooltip>
                    )}
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* 마커 클릭 시 하단에 뜨는 정보 팝업창 */}
            {selectedPlace && (
              <div className="absolute bottom-[88px] w-full px-4 z-40 animate-in slide-in-from-bottom-5">
                {/* 💡 [수정완료] 하단 팝업창(하얀색 카드) 전체를 터치해도 사진이 확대되도록 설정 */}
                <div 
                  className="bg-white rounded-[24px] shadow-2xl border border-neutral-100 p-4 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => {
                    // 주차장은 확대할 사진이 없으므로 무시
                    if (selectedPlace.type !== '주차장') {
                      setExpandedImage(selectedPlace);
                    }
                  }}
                >
                  {/* 💡 닫기 버튼을 누를 때는 사진 확대 기능이 작동하지 않도록 충돌 방지 처리 */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedPlace(null); }} 
                    className="absolute top-3 right-3 p-1.5 bg-neutral-100 rounded-full text-neutral-500 hover:bg-neutral-200 z-10"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                  
                  <div className="flex gap-4">
                    {/* 주차장일 경우 사진 영역을 렌더링하지 않음 */}
                    {selectedPlace.type !== '주차장' && (
                      <img 
                        src={selectedPlace.customImg || `/images/${selectedPlace.no}.jpg`} 
                        alt={selectedPlace.name} 
                        className="w-20 h-20 rounded-[16px] object-cover shadow-sm shrink-0" 
                        onError={(e) => { e.target.src = `https://picsum.photos/seed/${selectedPlace.no}/200/200`; }}
                      />
                    )}
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold text-[#5E2A8C] bg-[#5E2A8C]/10 px-2 py-0.5 rounded w-max`}>{selectedPlace.type}</span>
                        {selectedPlace.lastUpdated && (
                          <span className="text-[9px] font-bold text-[#FF8C00] bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">{formatTimeAgo(selectedPlace.lastUpdated)}</span>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-neutral-900 leading-tight mb-1 pr-6 line-clamp-1 font-montserrat">{selectedPlace.name}</h3>
                      <p className="text-[11px] font-medium text-neutral-500 mb-2 leading-relaxed">{selectedPlace.address}</p>
                      
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-md whitespace-nowrap ${
                          selectedPlace.status === '마감' || selectedPlace.status === '만차' ? 'bg-red-100 text-red-600' : 
                          selectedPlace.status === '혼잡' ? 'bg-orange-100 text-orange-600' : 
                          selectedPlace.status === '보통' ? 'bg-amber-100 text-amber-700' : 
                          selectedPlace.status === '원활' || selectedPlace.status === '여유' ? 'bg-green-100 text-green-700' : 
                          'bg-neutral-100 text-neutral-600'
                        }`}>
                          {selectedPlace.status} 
                          {selectedPlace.type === '주차장' 
                            ? (selectedPlace.status === '마감' ? '' : ` ${selectedPlace.wait}대`) 
                            : (selectedPlace.status !== '마감' ? ` ${selectedPlace.wait}명` : '')}
                        </span>
                        
                        <span className="text-xs font-bold text-neutral-400 whitespace-nowrap">{selectedPlace.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <nav className="absolute bottom-0 w-full bg-white/95 backdrop-blur-md border-t border-neutral-200 z-50 flex justify-around items-center pt-3 pb-5 sm:pb-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-b-none sm:rounded-b-[32px]">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id && !tab.isLink;
                
                if (tab.isLink) {
                  return (
                    <a 
                      key={tab.id} 
                      href={tab.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 w-16 text-neutral-400 hover:text-[#5E2A8C] transition-colors"
                    >
                      <Icon className="w-[22px] h-[22px]" />
                      <span className="text-[10px] font-bold">{tab.label}</span>
                    </a>
                  );
                }
                
                return (
                  <button 
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setSelectedPlace(null); }}
                    className={`flex flex-col items-center gap-1.5 w-16 transition-colors ${
                      isActive 
                        ? 'text-[#FF8C00]' 
                        : 'text-neutral-400 hover:text-neutral-600'
                    }`}
                  >
                    <div className={`relative ${isActive ? 'scale-110 transition-transform' : ''}`}>
                      <Icon className="w-[22px] h-[22px]" />
                      {isActive && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#5E2A8C] border-2 border-white"></span>}
                    </div>
                    <span className="text-[10px] font-bold">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {expandedImage && (
              <div 
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                onClick={() => setExpandedImage(null)}
              >
                <div className="relative w-full max-w-md flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => setExpandedImage(null)} 
                    className="absolute -top-12 right-0 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                  >
                    <XIcon className="w-6 h-6" />
                  </button>
                  <img 
                    src={expandedImage.customImg || `/images/${expandedImage.no}.jpg`} 
                    alt={expandedImage.name} 
                    className="w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl"
                    onError={(e) => { e.target.src = `https://picsum.photos/seed/${expandedImage.no}/600/800`; }}
                  />
                  <div className="w-full mt-4 text-center">
                    <span className="text-white font-black text-lg tracking-tight font-montserrat">{expandedImage.name}</span>
                    <p className="text-neutral-400 text-sm mt-1">{expandedImage.address}</p>
                  </div>
                </div>
              </div>
            )}
          </>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
