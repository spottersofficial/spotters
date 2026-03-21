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

// --- 최신 성수260320 데이터 (11개) ---
const INITIAL_DATA = [
  { no: 1, type: '팝업스토어', status: '진행예정', wait: 0, time: '대기 없음', name: '새로중앙박물관 팝업스토어', address: '서울 성동구 연무장13길 11 1층', lat: 37.542817, lng: 127.058339, hasImage: true, labelPos: 'bottom', lastUpdated: null, customImg: null },
  { no: 2, type: '팝업스토어', status: '보통', wait: 20, time: '30분 내외', name: '코스모폴리탄X아이더 팝업', address: '서울 성동구 성수이로 88 (남정빌딩)', lat: 37.542794, lng: 127.056732, hasImage: true, labelPos: 'top', lastUpdated: null, customImg: null },
  { no: 3, type: '팝업스토어', status: '원활', wait: 0, time: '대기 없음', name: '베어스랜드', address: '서울특별시 성동구 성수이로16길 5 맵달SEOUL', lat: 37.541291, lng: 127.057236, hasImage: true, labelPos: 'right', lastUpdated: null, customImg: null },
  { no: 4, type: '팝업스토어', status: '혼잡', wait: 66, time: '50분 내외', name: '비오레 팝업', address: '서울 성동구 연무장길 65 LECT 성수', lat: 37.542297, lng: 127.056826, hasImage: true, labelPos: 'left', lastUpdated: null, customImg: null },
  { no: 5, type: '팝업스토어', status: '원활', wait: 0, time: '10분 내외', name: '쿠팡 알럭스 팝업', address: '서울 성동구 연무장11길 11 1층', lat: 37.542979, lng: 127.057113, hasImage: true, labelPos: 'top', lastUpdated: null, customImg: null },
  { no: 6, type: '팝업스토어', status: '혼잡', wait: 25, time: '30분 내외', name: '메디힐 팝업', address: '서울 성동구 연무장7길 13 올리브영N 성수 1층', lat: 37.544168, lng: 127.054538, hasImage: true, labelPos: 'right', lastUpdated: null, customImg: null },
  { no: 7, type: '팝업스토어', status: '보통', wait: 10, time: '10분 내외', name: '레인메이커스 뷰티원더랜드 팝업', address: '서울 성동구 연무장길 73 XYZ SEOUL', lat: 37.542152, lng: 127.057234, hasImage: true, labelPos: 'bottom', lastUpdated: null, customImg: null },
  { no: 8, type: '팝업스토어', status: '보통', wait: 10, time: '10분 내외', name: '와키윌리 성수 플래그십 스토어', address: '서울 성동구 성수이로 86', lat: 37.542506, lng: 127.056641, hasImage: true, labelPos: 'left', lastUpdated: null, customImg: null },
  { no: 9, type: '팝업스토어', status: '보통', wait: 5, time: '10분 내외', name: '성수 콜랩코리아 팝업 스토어', address: '서울 성동구 연무장7길 16', lat: 37.543963, lng: 127.055146, hasImage: true, labelPos: 'top', lastUpdated: null, customImg: null },
  { no: 10, type: '팝업스토어', status: '보통', wait: 15, time: '10분 내외', name: '클리어디어 프레시 마트 팝업', address: '서울 성동구 연무장길 81 무신사 뷰티 스페이스 1', lat: 37.541721, lng: 127.058289, hasImage: true, labelPos: 'right', lastUpdated: null, customImg: null },
  { no: 11, type: '팝업스토어', status: '보통', wait: 5, time: '10분 내외', name: 'Feenah THE DATE GALLERY', address: '서울 성동구 연무장길 99 The A', lat: 37.541206, lng: 127.060254, hasImage: true, labelPos: 'left', lastUpdated: null, customImg: null }
];

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
  if (!timestamp) return '오늘 1시간 전 업데이트';
  
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
  } else if (place.status.includes('진행예정')) {
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
  const [wait, setWait] = useState(place.wait);
  const [status, setStatus] = useState(place.status);
  
  const initialTimeNum = parseInt(String(place.time).replace(/[^0-9]/g, '')) || 0;
  const [timeNum, setTimeNum] = useState(initialTimeNum); 
  
  const [imageFile, setImageFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200 flex flex-col gap-3">
      <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
        <h4 className="font-bold text-sm text-neutral-900">{place.name}</h4>
        <span className="text-[10px] text-neutral-400">{place.type}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-neutral-500 uppercase">혼잡도 상태</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium outline-none focus:border-[#FF8C00]">
            <option value="원활">원활</option>
            <option value="보통">보통</option>
            <option value="혼잡">혼잡</option>
            <option value="마감">마감</option>
            <option value="진행예정">진행예정</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-neutral-500 uppercase">대기 인원(명)</label>
          <input type="number" min="0" value={wait} onChange={(e) => setWait(Number(e.target.value))} className="p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium outline-none focus:border-[#FF8C00]" />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-neutral-500 uppercase">예상 대기시간(분) - 0 입력시 '대기 없음'</label>
        <input 
          type="number" 
          min="0" 
          value={timeNum} 
          onChange={(e) => setTimeNum(Number(e.target.value))} 
          placeholder="예: 30" 
          className="p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium outline-none focus:border-[#FF8C00]" 
        />
      </div>

      <div className="flex flex-col gap-1">
         <label className="text-[10px] font-bold text-neutral-500 uppercase">현장 사진 업데이트 (선택)</label>
         <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="text-xs text-neutral-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-[#5E2A8C] hover:file:bg-purple-100" />
      </div>

      <button 
        onClick={async () => {
          setIsSaving(true);
          const formattedTime = timeNum === 0 ? '대기 없음' : `${timeNum}분 내외`;
          await onSave(place.no, status, wait, formattedTime, imageFile);
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
  const [placesData, setPlacesData] = useState(INITIAL_DATA);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mapCenter, setMapCenter] = useState([37.5425, 127.0570]); 
  const [expandedImage, setExpandedImage] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [secretCount, setSecretCount] = useState(0);

  // --- 데이터 로드 ---
  useEffect(() => {
    fetch('/data.json?t=' + new Date().getTime())
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const mergedData = INITIAL_DATA.map(initPlace => {
            const savedPlace = data.find(p => p.name?.trim() === initPlace.name?.trim());
            
            if (savedPlace) {
              return { 
                ...initPlace, 
                status: savedPlace.status, 
                wait: savedPlace.wait, 
                time: savedPlace.time, 
                lastUpdated: savedPlace.lastUpdated, 
                customImg: savedPlace.customImg 
              };
            }
            return initPlace;
          });
          setPlacesData(mergedData);
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

  const handleAdminSave = async (no, newStatus, newWait, newTime, imageFile) => {
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
          return { 
            ...p, 
            status: newStatus, 
            wait: newWait, 
            time: newTime, 
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
        setPlacesData(updatedData); 
        
        if (selectedPlace && selectedPlace.no === no) {
          setSelectedPlace(updatedData.find(p => p.no === no));
        }

        alert(`저장 성공!\n\n1~2분 뒤에 반영됩니다.`);
      } else {
        throw new Error(`데이터 갱신 실패`);
      }

    } catch (err) {
      console.error(err);
      alert(`[오류] ${err.message}`);
    }
  };

  const handlePlaceClick = (place) => {
    setSelectedPlace(place);
    setMapCenter([place.lat, place.lng]);
  };

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
          
          <header className="absolute top-0 w-full z-50 p-4 pt-6 sm:pt-4 pointer-events-none flex flex-col gap-2.5">
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

            {!isAdminMode && (
              <>
                <div 
                  onClick={() => alert("📌 빠른 즐겨찾기 추가 방법\n\n📱 아이폰(사파리): 하단 [공유] 버튼 > [홈 화면에 추가]\n📱 갤럭시(크롬): 상단 [메뉴] 버튼 > [⭐별표] 또는 [홈 화면에 추가]\n💻 PC: 키보드 Ctrl + D (Mac은 Cmd + D)")}
                  className="pointer-events-auto bg-amber-50 border border-amber-200 rounded-[14px] p-2.5 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98] transition-transform"
                >
                  <span className="text-[14px]">⭐</span>
                  <span className="text-[11px] font-bold text-amber-700 tracking-tight">즐겨찾기에 추가하고 실시간 업데이트를 확인하세요 !</span>
                </div>

                <div className={`pointer-events-auto ${BRAND_GRADIENT} text-white text-[11px] font-bold text-center py-2.5 px-3 rounded-[14px] shadow-lg flex items-center justify-center gap-1.5 border border-white/20`}>
                  <AlertCircleIcon className="w-4 h-4 opacity-90" />
                  웹사이트 실시간 정보는 주말(토/일 12:00~17:00)에만 업데이트됩니다.
                </div>
              </>
            )}
          </header>

          {isAdminMode ? (
            <div className="flex-1 w-full h-full bg-neutral-100 pt-[160px] pb-6 px-4 overflow-y-auto flex flex-col gap-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-black text-neutral-900">데이터 실시간 관리</h2>
                <button onClick={() => setIsAdminMode(false)} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full">닫기</button>
              </div>

              <div className="flex flex-col gap-4 pb-10">
                {placesData.map(place => (
                  <AdminRow key={place.no} place={place} onSave={handleAdminSave} />
                ))}
              </div>
            </div>

          ) : (

          <>
            <div className="flex-1 w-full h-full relative z-0">
              <MapContainer center={mapCenter} zoom={16} zoomControl={false} className="w-full h-full">
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                <MapController center={mapCenter} />
                
                {placesData.map(place => (
                  <Marker 
                    key={place.no} 
                    position={[place.lat, place.lng]}
                    icon={createPointMarker(place)}
                    eventHandlers={{ click: () => handlePlaceClick(place) }}
                  >
                    {selectedPlace?.no === place.no && (
                      <Tooltip permanent interactive direction="top" offset={[0, -12]} opacity={1} className="photo-tooltip">
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
                            {formatTimeAgo(place.lastUpdated)}
                          </div>
                          
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-8 flex flex-col items-center text-center">
                            <span className="text-white text-xs font-black block truncate w-full mb-0.5">{place.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${place.status === '마감' || place.status === '만차' ? 'bg-red-500/90 text-white' : place.status === '혼잡' ? 'bg-orange-500/90 text-white' : place.status === '보통' ? 'bg-amber-500/90 text-white' : place.status.includes('진행예정') ? 'bg-[#5E2A8C]/90 text-white' : 'bg-green-500/90 text-white'}`}>
                              {place.status} 
                              {place.status !== '마감' && !place.status.includes('진행예정') ? ` ${place.wait}명` : ''}
                            </span>
                          </div>
                        </div>
                      </Tooltip>
                    )}
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {selectedPlace && (
              <div className="absolute bottom-[24px] w-full px-4 z-40 animate-in slide-in-from-bottom-5">
                <div 
                  className="bg-white rounded-[24px] shadow-2xl border border-neutral-100 p-4 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => setExpandedImage(selectedPlace)}
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedPlace(null); }} 
                    className="absolute top-3 right-3 p-1.5 bg-neutral-100 rounded-full text-neutral-500 hover:bg-neutral-200 z-10"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                  
                  <div className="flex gap-4">
                    <img 
                      src={selectedPlace.customImg || `/images/${selectedPlace.no}.jpg`} 
                      alt={selectedPlace.name} 
                      className="w-20 h-20 rounded-[16px] object-cover shadow-sm shrink-0" 
                      onError={(e) => { e.target.src = `https://picsum.photos/seed/${selectedPlace.no}/200/200`; }}
                    />
                    
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold text-[#5E2A8C] bg-[#5E2A8C]/10 px-2 py-0.5 rounded w-max`}>{selectedPlace.type}</span>
                        <span className="text-[9px] font-bold text-[#FF8C00] bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                          {formatTimeAgo(selectedPlace.lastUpdated)}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-neutral-900 leading-tight mb-1 pr-6 line-clamp-1 font-montserrat">{selectedPlace.name}</h3>
                      <p className="text-[11px] font-medium text-neutral-500 mb-2 leading-relaxed">{selectedPlace.address}</p>
                      
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-md whitespace-nowrap ${
                          selectedPlace.status === '마감' || selectedPlace.status === '만차' ? 'bg-red-100 text-red-600' : 
                          selectedPlace.status === '혼잡' ? 'bg-orange-100 text-orange-600' : 
                          selectedPlace.status === '보통' ? 'bg-amber-100 text-amber-700' : 
                          selectedPlace.status.includes('진행예정') ? 'bg-[#5E2A8C]/10 text-[#5E2A8C]' :
                          selectedPlace.status === '원활' || selectedPlace.status === '여유' ? 'bg-green-100 text-green-700' : 
                          'bg-neutral-100 text-neutral-600'
                        }`}>
                          {selectedPlace.status} 
                          {selectedPlace.status !== '마감' && !selectedPlace.status.includes('진행예정') ? ` ${selectedPlace.wait}명` : ''}
                        </span>
                        
                        <span className="text-xs font-bold text-neutral-400 whitespace-nowrap">{selectedPlace.time}</span>

                        <a
                          href={`https://map.naver.com/p/directions/-/${selectedPlace.lng},${selectedPlace.lat},${encodeURIComponent(selectedPlace.name)}/-/transit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto bg-[#03C75A] hover:bg-[#02b351] transition-colors text-white text-[10px] font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1 shadow-sm"
                          onClick={(e) => e.stopPropagation()} 
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                          길찾기
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
