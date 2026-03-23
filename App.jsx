import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 🚀 수파베이스 연동
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mdpqzcwamhzxybldvctr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kcHF6Y3dhbWh6eHlibGR2Y3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTU0OTksImV4cCI6MjA4OTY5MTQ5OX0.qynZlOh2SDPVOg-0dNJA_zKL7sTGS8JTkInxz0mRQQY';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- 디자인 시스템 ---
const BRAND_GRADIENT = "bg-gradient-to-br from-[#5E2A8C] to-[#FF8C00]";
const BRAND_TEXT_GRADIENT = "bg-gradient-to-br from-[#5E2A8C] to-[#FF8C00] bg-clip-text text-transparent";
const PURPLE_COLOR = "#5E2A8C";

// --- 다국어 텍스트 및 변환 로직 ---
const REPORT_KEYWORDS_KO = ['🎁 사은품/경품 대박', '📸 포토존 예쁨', '🏃‍♂️ 진행 빠름', '😥 품절 많음', '☕️ 대기 쾌적'];
const REPORT_KEYWORDS_EN = ['🎁 Great Gifts', '📸 Nice Photo Zone', '🏃‍♂️ Fast Line', '😥 Sold Out', '☕️ Nice Waiting Area'];

const T = {
  ko: {
    eventTitle: "이번 주 이벤트",
    eventDesc: "경품/현장 사진 제보하고 메가커피 받기!",
    eventBadge: "선정시 증정",
    notice: "웹사이트 실시간 정보는 주말(토/일 12:00~17:00)만 업데이트됩니다.",
    tabInfo: "기본 정보",
    tabReport: "실시간 제보",
    noReport: "아직 제보가 없어요!",
    noReportDesc: "첫 제보자가 되어 메가커피를 받아가세요 ☕️",
    btnReport: "경품/이벤트 사진 올리고 쿠폰 받기",
    modalTitle: "현장 제보하기",
    step1: "1. 제보자 정보",
    step1Desc: "이벤트 당첨 연락을 위해 정확히 입력해주세요! (웹사이트에 절대 공개되지 않습니다)",
    namePlace: "이름",
    phonePlace: "휴대폰 번호 (010-0000-0000)",
    privacy: "(필수) 경품 추첨 및 발송을 위한 개인정보 수집 및 이용에 동의합니다.",
    privacySub: "* 수집된 정보는 목적 달성 후 1개월 내 파기됩니다.",
    step2: "2. 현장 사진을 올려주세요",
    step2Desc: "팝업 내부, 포토존, 받은 경품이나 굿즈 사진을 올려주세요!",
    uploadPlace: "터치해서 사진 선택 (1장)",
    step3: "3. 어떤 점이 좋았나요?",
    step3Desc: "(다중 선택)",
    step4: "4. 꿀팁이나 한 줄 평 (선택)",
    step4Place: "예: 뒷문으로 가면 대기 없어요! / 3시쯤 굿즈 다 털렸네요 ㅠㅠ",
    submitBtn: "제보 완료하고 이벤트 응모하기",
    submitWait: "업로드 중...",
    bestPhoto: "베스트 제보 포토 📸",
    noTextReport: "사진만 있는 제보입니다",
    waitSuffix: "명",
    routeBtn: "길찾기",
    photoCount: "장",
    alertNamePhone: "이벤트 당첨을 위해 이름과 휴대폰 번호를 모두 입력해주세요!",
    alertPrivacy: "개인정보 수집 및 이용에 동의해주세요!",
    alertPhoto: "현장 사진이나 경품 사진을 1장 꼭 올려주세요!",
    alertKeyword: "현장 분위기 키워드를 선택해 주세요!",
    alertSuccess: "🎉 제보가 성공적으로 접수되었습니다!\n메가커피 쿠폰 추첨에 자동 응모되었습니다.",
    alertError: "제보 중 오류가 발생했습니다:",
    swipeGuide: "👉 화면 옆 화살표를 눌러 현장 제보를 확인하세요!",
    adminTitle: "데이터 실시간 관리", 
    adminClose: "닫기",
    live: "LIVE"
  },
  en: {
    eventTitle: "This Week's Event",
    eventDesc: "Share photos and get a Mega Coffee coupon!",
    eventBadge: "Selected",
    notice: "Real-time info is only updated on weekends (Sat/Sun 12:00~17:00).",
    tabInfo: "Info",
    tabReport: "Live Reports",
    noReport: "No reports yet!",
    noReportDesc: "Be the first to report and get a coffee ☕️",
    btnReport: "Review Upload", // 🚀 영문버전 버튼 텍스트 수정
    modalTitle: "Submit a Report",
    step1: "1. Reporter Info",
    step1Desc: "Please enter accurately for event rewards! (Will NOT be shown publicly)",
    namePlace: "Name",
    phonePlace: "Phone Number",
    privacy: "(Required) I agree to the collection and use of personal info for the event.",
    privacySub: "* Data will be destroyed within 1 month.",
    step2: "2. Upload a Photo",
    step2Desc: "Upload inside views, photo zones, or event gifts!",
    uploadPlace: "Tap to select (1 photo)",
    step3: "3. What did you like?",
    step3Desc: "(Multiple choice)",
    step4: "4. Tips or short review (Optional)",
    step4Place: "e.g. No wait at the back door! / Goods sold out at 3PM ㅠㅠ",
    submitBtn: "Submit Report & Enter Event",
    submitWait: "Uploading...",
    bestPhoto: "Best Photo 📸",
    noTextReport: "Photo-only report",
    waitSuffix: " ppl",
    routeBtn: "Directions",
    photoCount: "",
    alertNamePhone: "Please enter both name and phone number for the event!",
    alertPrivacy: "Please agree to the privacy policy!",
    alertPhoto: "Please upload at least 1 photo!",
    alertKeyword: "Please select at least one keyword!",
    alertSuccess: "🎉 Report successfully submitted!\nYou have been entered into the event.",
    alertError: "An error occurred:",
    swipeGuide: "👉 Swipe to see live reports!",
    adminTitle: "Real-time Data Management",
    adminClose: "Close",
    live: "LIVE"
  }
};

const translateStatus = (status, lang) => {
  if(lang === 'ko') return status;
  const map = { "원활": "Good", "보통": "Normal", "혼잡": "Crowded", "마감": "Closed", "진행예정": "Upcoming", "3/22 종료": "Ended (3/22)" };
  return map[status] || status;
}

const translateType = (type, lang) => {
  if(lang === 'ko') return type;
  const map = { "팝업스토어": "Pop-up", "식당": "Restaurant", "카페": "Cafe", "베이커리": "Bakery", "디저트": "Dessert", "상점": "Store" };
  return map[type] || type;
}

const translateTime = (time, lang) => {
  if(lang === 'ko') return time;
  if(!time) return '';
  return time.replace('대기 없음', 'No wait').replace('분 내외', ' mins').replace('불가', 'N/A');
}

const formatTimeAgo = (timestamp, lang) => {
  if (!timestamp) return lang === 'ko' ? '최근 업데이트' : 'Recently updated';
  const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMinutes < 1) return lang === 'ko' ? '방금 업데이트' : 'Just updated';
  if (diffMinutes < 60) return lang === 'ko' ? `${diffMinutes}분 전 업데이트` : `Updated ${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return lang === 'ko' ? `${diffHours}시간 전 업데이트` : `Updated ${diffHours}h ago`;
  return lang === 'ko' ? `${Math.floor(diffHours / 24)}일 전 업데이트` : `Updated ${Math.floor(diffHours / 24)}d ago`;
};

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
const CameraIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const GiftIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>;
const ChevronLeft = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="15 18 9 12 15 6"/></svg>;
const ChevronRight = ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"/></svg>;

// --- 압축 기계 ---
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
        if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } 
        else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const STATION_EXITS = [
  { id: 'exit3', lat: 37.544025, lng: 127.057117, name_ko: '성수역 3번 출구', name_en: 'Seongsu Stn. Exit 3' },
  { id: 'exit4', lat: 37.544847, lng: 127.054754, name_ko: '성수역 4번 출구', name_en: 'Seongsu Stn. Exit 4' }
];

const createExitMarker = (exit, lang) => {
  const displayName = lang === 'en' ? exit.name_en : exit.name_ko;
  return L.divIcon({
    className: 'custom-exit-marker',
    html: `
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-900/80 backdrop-blur-sm border border-neutral-700 text-white font-bold text-[9px] px-2 py-1 rounded-md shadow-md whitespace-nowrap tracking-wide">
        ${displayName}
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0] 
  });
};

const createPointMarker = (place, lang) => {
  let bgColor = 'bg-neutral-500';
  let breatheClass = '';
  
  if (place.status === '마감' || place.status === '만차') { bgColor = 'bg-red-500'; breatheClass = 'animate-breathe'; } 
  else if (place.status === '혼잡') { bgColor = 'bg-orange-500'; breatheClass = 'animate-breathe'; } 
  else if (place.status === '보통') { bgColor = 'bg-amber-400'; } 
  else if (place.status === '원활' || place.status === '여유') { bgColor = 'bg-emerald-500'; } 
  else if (place.status && place.status.includes('진행예정')) { bgColor = `bg-[${PURPLE_COLOR}]`; }
  else if (place.status === '3/22 종료') { bgColor = 'bg-black'; }

  let labelPositionClass = place.labelPos === 'top' ? 'bottom-full mb-1.5 left-1/2 -translate-x-1/2' :
                           place.labelPos === 'bottom' ? 'top-full mt-1.5 left-1/2 -translate-x-1/2' :
                           place.labelPos === 'left' ? 'right-full mr-2 top-1/2 -translate-y-1/2' :
                           'left-full ml-2 top-1/2 -translate-y-1/2';

  const displayName = lang === 'en' ? (place.name_en || place.name) : place.name;

  return L.divIcon({
    className: 'custom-dot-marker',
    html: `
      <div class="relative flex items-center justify-center group cursor-pointer" style="width: 14px; height: 14px;">
        <div class="relative w-3.5 h-3.5 rounded-full border-[2px] border-white shadow-md ${bgColor} ${breatheClass} z-20 transition-transform group-hover:scale-125"></div>
        <span class="absolute ${labelPositionClass} text-[11.5px] font-bold text-neutral-800 tracking-tight whitespace-nowrap z-30" 
              style="text-shadow: -1.5px -1.5px 0 #fff, 1.5px -1.5px 0 #fff, -1.5px 1.5px 0 #fff, 1.5px 1.5px 0 #fff, 0 2px 4px rgba(0,0,0,0.15); font-family: Pretendard, sans-serif;">
          ${displayName}
        </span>
      </div>
    `,
    iconSize: [14, 14], iconAnchor: [7, 7] 
  });
};

const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => { map.flyTo(center, 16, { animate: true, duration: 0.8 }); }, [center, map]);
  return null;
};

// --- 관리자 전용 컴포넌트 ---
const AdminRow = ({ place, reports, onSave, onToggleReport, onUpdateLang }) => {
    const [wait, setWait] = useState(place.wait || 0);
    const [status, setStatus] = useState(place.status || '보통');
    const initialTimeNum = parseInt(String(place.time).replace(/[^0-9]/g, '')) || 0;
    const [timeNum, setTimeNum] = useState(initialTimeNum); 
    const [imageFile, setImageFile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
  
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200 flex flex-col gap-3">
        <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
          <h4 className="font-bold text-sm text-neutral-900">{place.name}</h4>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-neutral-500 uppercase">상태</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs outline-none">
              <option value="원활">원활</option>
              <option value="보통">보통</option>
              <option value="혼잡">혼잡</option>
              <option value="마감">마감</option>
              <option value="진행예정">진행예정</option>
              <option value="3/22 종료">3/22 종료</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-neutral-500 uppercase">대기(명)</label>
            <input type="number" min="0" value={wait} onChange={(e) => setWait(Number(e.target.value))} className="p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs outline-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-neutral-500 uppercase">시간(분)</label>
            <input type="number" min="0" value={timeNum} onChange={(e) => setTimeNum(Number(e.target.value))} className="p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs outline-none" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
           <label className="text-[10px] font-bold text-neutral-500 uppercase">현장 사진 업데이트</label>
           <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="text-xs text-neutral-500 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-purple-50 file:text-[#5E2A8C]" />
        </div>
        <button 
          onClick={async () => {
            setIsSaving(true);
            const formattedTime = timeNum === 0 ? '대기 없음' : `${timeNum}분 내외`;
            await onSave(place.no, status, wait, formattedTime, imageFile);
            setIsSaving(false); setImageFile(null); 
          }} 
          disabled={isSaving}
          className={`mt-1 w-full text-white font-bold text-xs py-2 rounded-lg ${isSaving ? 'bg-neutral-400' : 'bg-[#1A1A1A]'}`}
        >
          {isSaving ? "저장 중..." : "업데이트 저장"}
        </button>

        {/* 유저 제보 관리 영역 */}
        {reports.length > 0 && (
          <div className="mt-3 pt-3 border-t border-neutral-100">
            <h5 className="text-[11px] font-bold text-neutral-800 mb-2">유저 제보 ({reports.length}건)</h5>
            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
              {reports.map(r => (
                <div key={r.id} className={`flex gap-2 p-2 rounded-lg border ${r.is_selected ? 'bg-orange-50 border-orange-200' : 'bg-neutral-50 border-neutral-200'}`}>
                  <img src={r.photo_url} className="w-12 h-12 object-cover rounded-md shrink-0" alt="제보사진"/>
                  <div className="flex flex-col justify-between w-full min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-[#5E2A8C] truncate">{r.kakao_id}</span>
                        <select 
                          value={r.display_lang || 'all'} 
                          onChange={(e) => onUpdateLang(r.id, e.target.value)}
                          className="text-[9px] border border-neutral-300 rounded px-1 py-0.5 outline-none bg-white text-neutral-600 font-bold w-max"
                        >
                          <option value="all">KR+EN (전체)</option>
                          <option value="ko">KR (한글판)</option>
                          <option value="en">EN (영문판)</option>
                        </select>
                      </div>
                      <button onClick={() => onToggleReport(r.id, !r.is_selected)} className={`text-[9px] px-2 py-0.5 rounded font-bold ${r.is_selected ? 'bg-red-500 text-white' : 'bg-neutral-200 text-neutral-700'}`}>
                        {r.is_selected ? '선택해제' : '홈에 노출하기'}
                      </button>
                    </div>
                    <p className="text-[10px] text-neutral-600 truncate mt-1">{r.review_text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
};

// --- 메인 App 컴포넌트 ---
function App() {
  const [lang, setLang] = useState('ko');
  const t = T[lang];

  const [placesData, setPlacesData] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mapCenter, setMapCenter] = useState([37.5425, 127.0570]); 
  
  const [activeTab, setActiveTab] = useState('info'); 
  const [showReportForm, setShowReportForm] = useState(false);
  const currentKeywords = lang === 'ko' ? REPORT_KEYWORDS_KO : REPORT_KEYWORDS_EN;
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [reportText, setReportText] = useState('');
  const [reportFile, setReportFile] = useState(null);
  
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [placeReports, setPlaceReports] = useState([]); 
  const [adminReports, setAdminReports] = useState([]); 

  const [expandedCarousel, setExpandedCarousel] = useState(null); 

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [secretCount, setSecretCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 🚀 보안 적용: 세션 및 인증 상태 실시간 구독
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsAdminMode(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setIsAdminMode(true);
      else setIsAdminMode(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPlaces = async () => {
    try {
      const { data, error } = await supabase.from('places').select('*').order('no', { ascending: true });
      if (error) throw error;
      const formattedData = data.map(item => ({
        ...item, hasImage: item.has_image, labelPos: item.label_pos || 'right',
        lastUpdated: item.last_updated, customImg: item.custom_img
      }));
      setPlacesData(formattedData);
    } catch (err) { console.error("로드 실패:", err.message); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchPlaces();
    const subscription = supabase.channel('public:places')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'places' }, () => fetchPlaces())
      .subscribe();
    return () => supabase.removeChannel(subscription);
  }, []);

  useEffect(() => {
    if (selectedPlace) {
      supabase.from('reports').select('*').eq('place_no', selectedPlace.no).eq('is_selected', true).order('created_at', {ascending: false})
        .then(({data}) => {
          const filtered = (data || []).filter(r => !r.display_lang || r.display_lang === 'all' || r.display_lang === lang);
          setPlaceReports(filtered);
        });
    }
  }, [selectedPlace, lang]);

  const fetchAdminReports = async () => {
    const { data } = await supabase.from('reports').select('*').order('created_at', {ascending: false});
    setAdminReports(data || []);
  };

  useEffect(() => {
    if (isAdminMode) fetchAdminReports();
  }, [isAdminMode]);

  // 🚀 보안 적용: Supabase Auth를 통한 실제 로그인 기능 연동
  const handleSecretLogin = async () => {
    if (secretCount >= 4) {
      const email = window.prompt("관리자 아이디(이메일)를 입력하세요:");
      if (!email) { setSecretCount(0); return; }
      
      const pwd = window.prompt("관리자 비밀번호를 입력하세요:");
      if (!pwd) { setSecretCount(0); return; }

      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: pwd,
      });

      if (error) {
        alert("로그인 실패: 아이디 또는 비밀번호가 올바르지 않습니다.");
      } else {
        setIsAdminMode(true);
      }
      setSecretCount(0);
    } else { 
      setSecretCount(prev => prev + 1); 
    }
  };

  // 🚀 보안 적용: Supabase Auth 실제 로그아웃 기능
  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
    setIsAdminMode(false);
  };

  const handleAdminSave = async (no, newStatus, newWait, newTime, imageFile) => {
    try {
      let newImgUrl = null;
      if (imageFile) {
        const compressedBlob = await compressImage(imageFile);
        const fileName = `${no}_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('popup-photos').upload(fileName, compressedBlob, { contentType: 'image/jpeg' });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('popup-photos').getPublicUrl(fileName);
        newImgUrl = publicUrl;
      }
      const updatePayload = { status: newStatus, wait: newWait, time: newTime, last_updated: Date.now() };
      if (newImgUrl) updatePayload.custom_img = newImgUrl;
      const { error: updateError } = await supabase.from('places').update(updatePayload).eq('no', no);
      if (updateError) throw updateError;
      alert(`저장 성공!`);
    } catch (err) { alert(`[오류] ${err.message}`); }
  };

  const handleToggleReportSelection = async (reportId, newStatus) => {
    const { error } = await supabase.from('reports').update({ is_selected: newStatus }).eq('id', reportId);
    if (!error) fetchAdminReports(); 
  };

  const handleUpdateReportLang = async (reportId, newLang) => {
    const { error } = await supabase.from('reports').update({ display_lang: newLang }).eq('id', reportId);
    if (!error) fetchAdminReports();
  };

  const handlePlaceClick = (place) => {
    setSelectedPlace(place);
    setMapCenter([place.lat, place.lng]);
    setActiveTab('info');
  };

  const handleUserReportSubmit = async () => {
    if (!userName || !userPhone) return alert(t.alertNamePhone);
    if (!privacyConsent) return alert(t.alertPrivacy);
    if (!reportFile) return alert(t.alertPhoto);
    if (selectedKeywords.length === 0) return alert(t.alertKeyword);
    
    setIsSubmitting(true);
    try {
      const compressedBlob = await compressImage(reportFile);
      const fileName = `report_${selectedPlace.no}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('popup-photos').upload(fileName, compressedBlob, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('popup-photos').getPublicUrl(fileName);

      const { error: insertError } = await supabase.from('reports').insert({
        place_no: selectedPlace.no,
        photo_url: publicUrl,
        keywords: selectedKeywords,
        review_text: reportText,
        kakao_id: `${userName} / ${userPhone}`, 
        display_lang: lang, 
        created_at: Date.now()
      });
      if (insertError) throw insertError;

      alert(t.alertSuccess);
      
      setShowReportForm(false);
      setReportFile(null); setSelectedKeywords([]); setReportText(''); 
      setUserName(''); setUserPhone(''); setPrivacyConsent(false);
    } catch (err) {
      alert(`${t.alertError} ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCarouselSlides = () => {
    if (!expandedCarousel) return [];
    
    const displayName = lang === 'en' ? (expandedCarousel.place.name_en || expandedCarousel.place.name) : expandedCarousel.place.name;
    const displayAddress = lang === 'en' ? (expandedCarousel.place.address_en || expandedCarousel.place.address) : expandedCarousel.place.address;

    const mainSlide = {
      type: 'main', img: expandedCarousel.place.customImg || `/images/${expandedCarousel.place.no}.jpg`,
      title: displayName, text: displayAddress
    };
    const reportSlides = expandedCarousel.reports.map(r => ({
      type: 'report', img: r.photo_url, title: t.bestPhoto, text: r.review_text, keywords: r.keywords
    }));
    return [mainSlide, ...reportSlides];
  };

  const currentSlides = getCarouselSlides();

  if (isLoading) {
    return (
      <div className="bg-[#1A1A1A] min-h-screen flex items-center justify-center">
        <div className="w-full max-w-[430px] h-[100dvh] bg-[#FFFFFF] relative flex items-center justify-center">
          <div className="text-center font-bold text-[#5E2A8C] animate-pulse">Loading SEONGSU.NOW data...🚀</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&display=swap');
        body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif; }
        .font-montserrat { font-family: 'Montserrat', sans-serif; }
        .leaflet-container { width: 100%; height: 100%; z-index: 0; background: #e5e5e5; }
        
        .custom-dot-marker { background: transparent; border: none; overflow: visible !important; }
        .custom-photo-popup .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; padding: 0 !important; }
        .custom-photo-popup .leaflet-popup-tip-container { display: none !important; }
        .custom-photo-popup .leaflet-popup-content { margin: 0 !important; width: 180px !important; height: 180px !important; }
        
        /* 🚀 무채색 현대적 지도 튜닝 필터 */
        .modern-map-tiles { filter: grayscale(100%) brightness(1.05) contrast(0.95); }
        .custom-exit-marker { background: transparent; border: none; overflow: visible !important; }

        .scrollbar-hide::-webkit-scrollbar { display: none; }
        @keyframes noticeable-breathe { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.25); opacity: 0.75; } }
        .animate-breathe { animation: noticeable-breathe 1.2s ease-in-out infinite; }
      `}</style>

      <div className="bg-[#1A1A1A] min-h-screen flex items-center justify-center">
        <div className="w-full max-w-[430px] h-[100dvh] sm:h-[85vh] bg-[#FFFFFF] relative sm:rounded-[40px] overflow-hidden shadow-2xl sm:border-[8px] sm:border-neutral-800 flex flex-col">
          
          <header className="absolute top-0 w-full z-40 p-4 pt-6 sm:pt-4 pointer-events-none flex flex-col gap-2.5">
            <div className="bg-white/85 backdrop-blur-xl rounded-2xl shadow-sm border border-neutral-100 p-3.5 flex justify-between items-center pointer-events-auto">
              <div className="flex items-center gap-2">
                <SpottersLogo className="w-8 h-8 drop-shadow-sm" />
                <div className="flex flex-col mt-0.5">
                  <h1 className={`text-[22px] font-black tracking-tight leading-none font-montserrat ${BRAND_TEXT_GRADIENT}`}>
                    SEONGSU<span className="text-neutral-900">.NOW</span>
                  </h1>
                  <span onClick={handleSecretLogin} className="text-[9px] font-bold text-neutral-400 tracking-widest uppercase mt-0.5 cursor-pointer select-none">
                    by Spottr {isAdminMode && "(ADMIN)"} <span className="lowercase font-normal">| admin@spottr.kr</span>
                  </span>
                </div>
              </div>
              <div className="flex bg-neutral-100 rounded-lg p-1 border border-neutral-200 shadow-inner">
                <button onClick={() => setLang('ko')} className={`text-[10px] font-black px-2.5 py-1 rounded-md transition-all ${lang === 'ko' ? 'bg-white text-[#5E2A8C] shadow-sm' : 'text-neutral-400'}`}>KR</button>
                <button onClick={() => setLang('en')} className={`text-[10px] font-black px-2.5 py-1 rounded-md transition-all ${lang === 'en' ? 'bg-white text-[#5E2A8C] shadow-sm' : 'text-neutral-400'}`}>EN</button>
              </div>
            </div>

            {!isAdminMode && lang === 'ko' && (
              <div className={`pointer-events-auto bg-neutral-900 text-white text-[11px] font-bold py-3 px-4 rounded-[16px] shadow-lg flex items-center justify-between border border-neutral-700 animate-in slide-in-from-top-2`}>
                <div className="flex items-center gap-2">
                  <GiftIcon className="w-5 h-5 text-[#FF8C00]" />
                  <div className="flex flex-col">
                    <span className="text-[#FF8C00] text-[9px]">{t.eventTitle}</span>
                    <span>{t.eventDesc}</span>
                  </div>
                </div>
                <span className="bg-[#FF8C00] text-black px-2 py-1 rounded-md text-[10px] font-black">{t.eventBadge}</span>
              </div>
            )}
            
            {/* 🚀 주말 업데이트 공지 배너 코드 삭제됨 */}
          </header>

          {isAdminMode ? (
             <div className="flex-1 w-full h-full bg-neutral-100 pt-[160px] pb-6 px-4 overflow-y-auto flex flex-col gap-4">
               <div className="flex justify-between items-center mb-2">
                 <h2 className="text-lg font-black text-neutral-900">{t.adminTitle}</h2>
                 {/* 🚀 보안 적용: 닫기 버튼을 로그아웃 버튼으로 교체 */}
                 <button onClick={handleAdminLogout} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full">{t.adminClose}</button>
               </div>
               <div className="flex flex-col gap-4 pb-10">
                 {placesData.map(place => ( 
                   <AdminRow key={place.no} place={place} reports={adminReports.filter(r => r.place_no === place.no)} onSave={handleAdminSave} onToggleReport={handleToggleReportSelection} onUpdateLang={handleUpdateReportLang} /> 
                 ))}
               </div>
             </div>
          ) : (
          <>
            <div className="flex-1 w-full h-full relative z-0">
              <MapContainer center={mapCenter} zoom={16} zoomControl={false} className="w-full h-full">
                <TileLayer 
                  key={lang}
                  url={`https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=0MQk1Z9FONFMeu7MkCDh&lang=${lang}`} 
                  attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a>'
                  className="modern-map-tiles"
                />
                <MapController center={mapCenter} />

                {lang === 'en' && STATION_EXITS.map(exit => (
                  <Marker 
                    key={exit.id} 
                    position={[exit.lat, exit.lng]} 
                    icon={createExitMarker(exit, lang)} 
                    interactive={false}
                  />
                ))}

                {placesData.map(place => (
                  <Marker 
                    key={place.no} 
                    position={[place.lat, place.lng]} 
                    icon={createPointMarker(place, lang)} 
                    eventHandlers={{ click: () => handlePlaceClick(place) }}
                  >
                    <Popup className="custom-photo-popup" closeButton={false} autoPan={false} offset={[0, -10]} minWidth={180} maxWidth={180}>
                      <div 
                        className="cursor-pointer active:scale-95 transition-transform drop-shadow-xl pointer-events-auto relative"
                        style={{ width: '180px', height: '180px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCarousel({ 
                            place: place, 
                            reports: place.no === selectedPlace?.no ? placeReports : [], 
                            currentIndex: 0 
                          });
                        }}
                      >
                        <img 
                          src={place.customImg || `/images/${place.no}.jpg`} 
                          alt={place.name} 
                          className="w-full h-full object-cover rounded-[14px] border-[3px] border-white bg-neutral-200 pointer-events-auto"
                          onError={(e) => { e.target.src = `https://picsum.photos/seed/${place.no}/400/400`; }}
                        />
                        <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md pointer-events-none z-10 border border-red-500">
                          <span className="w-1 h-1 rounded-full bg-white animate-pulse"></span>
                          {t.live}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {selectedPlace && !showReportForm && (
              <div className="absolute bottom-[24px] w-full px-4 z-40 animate-in slide-in-from-bottom-5 pointer-events-none">
                <div className="bg-white rounded-[24px] shadow-2xl border border-neutral-100 p-4 relative overflow-hidden flex flex-col pointer-events-auto">
                  <button onClick={() => setSelectedPlace(null)} className="absolute top-3 right-3 p-1.5 bg-neutral-100 rounded-full text-neutral-500 hover:bg-neutral-200 z-10">
                    <XIcon className="w-4 h-4" />
                  </button>
                  
                  <div className="flex w-full mb-4 border-b border-neutral-100 relative pr-8">
                    <button onClick={() => setActiveTab('info')} className={`flex-1 pb-2 text-[12px] font-bold transition-colors ${activeTab === 'info' ? 'text-[#5E2A8C] border-b-[2px] border-[#5E2A8C]' : 'text-neutral-400'}`}>
                      {t.tabInfo}
                    </button>
                    <button onClick={() => setActiveTab('reports')} className={`flex-1 pb-2 text-[12px] font-bold transition-colors ${activeTab === 'reports' ? 'text-[#FF8C00] border-b-[2px] border-[#FF8C00]' : 'text-neutral-400'}`}>
                      {t.tabReport} ({placeReports.length})
                    </button>
                  </div>

                  {activeTab === 'info' && (
                    <div className="flex gap-4 animate-in fade-in duration-200">
                      <div className="relative shrink-0">
                        <img 
                          src={selectedPlace.customImg || `/images/${selectedPlace.no}.jpg`} alt={selectedPlace.name} 
                          className="w-[84px] h-[84px] rounded-[16px] object-cover shadow-sm cursor-pointer border border-neutral-100" 
                          onClick={() => setExpandedCarousel({ place: selectedPlace, reports: placeReports, currentIndex: 0 })}
                        />
                        {placeReports.length > 0 && (
                          <div className="absolute -bottom-2 -right-2 bg-neutral-900 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-md animate-bounce">
                            +{placeReports.length}{t.photoCount}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-bold text-[#5E2A8C] bg-[#5E2A8C]/10 px-2 py-0.5 rounded w-max">{translateType(selectedPlace.type, lang)}</span>
                          <span className="text-[9px] font-bold text-[#FF8C00] bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">{formatTimeAgo(selectedPlace.lastUpdated, lang)}</span>
                        </div>
                        <h3 className="text-lg font-black text-neutral-900 leading-tight mb-1 pr-2 line-clamp-1 font-montserrat">
                          {lang === 'en' ? (selectedPlace.name_en || selectedPlace.name) : selectedPlace.name}
                        </h3>
                        <p className="text-[11px] font-medium text-neutral-500 mb-2 leading-relaxed truncate">
                          {lang === 'en' ? (selectedPlace.address_en || selectedPlace.address) : selectedPlace.address}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black px-2 py-1 rounded-md whitespace-nowrap ${
                            selectedPlace.status === '마감' ? 'bg-red-100 text-red-600' : 
                            selectedPlace.status === '3/22 종료' ? 'bg-neutral-200 text-neutral-800' : 
                            'bg-green-100 text-green-700'
                          }`}>
                            {translateStatus(selectedPlace.status, lang)} {selectedPlace.wait > 0 && `${selectedPlace.wait}${t.waitSuffix}`}
                          </span>
                          <span className="text-xs font-bold text-neutral-400">{translateTime(selectedPlace.time, lang)}</span>
                          {lang === 'ko' && (
                            <a href={`https://map.naver.com/p/directions/-/${selectedPlace.lng},${selectedPlace.lat},${encodeURIComponent(selectedPlace.name)}/-/transit`} target="_blank" rel="noopener noreferrer" className="ml-auto bg-[#03C75A] text-white text-[10px] font-bold px-2 py-1.5 rounded-md flex items-center gap-1">
                              {t.routeBtn}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'reports' && (
                    <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                      {placeReports.length === 0 ? (
                        <div className="text-center py-4 bg-neutral-50 rounded-[16px]">
                          <p className="text-[11px] text-neutral-500 font-bold mb-1">{t.noReport}</p>
                          <p className="text-[10px] text-neutral-400">{t.noReportDesc}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-2 scrollbar-hide">
                          {placeReports.map(report => (
                            <div key={report.id} className="flex gap-3 bg-neutral-50 p-2.5 rounded-[16px] items-center cursor-pointer active:scale-95 transition-transform" onClick={() => {
                              const reportIndex = placeReports.findIndex(r => r.id === report.id) + 1;
                              setExpandedCarousel({ place: selectedPlace, reports: placeReports, currentIndex: reportIndex });
                            }}>
                              <img src={report.photo_url} className="w-12 h-12 bg-neutral-200 rounded-[10px] flex-shrink-0 object-cover" alt="제보" />
                              <div className="flex flex-col min-w-0">
                                <div className="flex gap-1 mb-1 overflow-x-auto scrollbar-hide whitespace-nowrap">
                                  {report.keywords?.slice(0, 2).map((k, i) => {
                                    const translatedK = lang === 'en' ? (REPORT_KEYWORDS_EN[REPORT_KEYWORDS_KO.indexOf(k)] || k) : k;
                                    return <span key={i} className="bg-white border border-neutral-200 text-[9px] px-1.5 py-0.5 rounded text-neutral-600 font-bold shrink-0">{translatedK}</span>
                                  })}
                                </div>
                                <p className="text-[11px] text-neutral-800 font-medium truncate">{report.review_text || t.noTextReport}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* 🚀 제보 버튼이 영문판에서도 노출되도록 조건 수정 */}
                      <button onClick={() => setShowReportForm(true)} className={`${BRAND_GRADIENT} text-white font-bold text-[13px] py-3 rounded-[14px] w-full flex justify-center items-center gap-1.5 shadow-md active:scale-[0.98] transition-transform`}>
                        <CameraIcon className="w-4 h-4" /> {t.btnReport}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showReportForm && (
              <div className="absolute inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-bottom-full duration-300">
                <div className="flex items-center justify-between p-4 border-b border-neutral-100">
                  <h2 className="text-lg font-black text-neutral-900">{t.modalTitle}</h2>
                  <button onClick={() => setShowReportForm(false)} className="p-2 bg-neutral-100 rounded-full text-neutral-600"><XIcon className="w-5 h-5"/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <div>
                      <span className="text-[13px] font-bold text-neutral-800">{t.step1} <span className="text-red-500">*</span></span>
                      <p className="text-[10px] text-[#FF8C00] font-bold mt-0.5">{t.step1Desc}</p>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" value={userName} onChange={(e) => setUserName(e.target.value)}
                        placeholder={t.namePlace} 
                        className="bg-neutral-50 border border-neutral-200 rounded-[12px] p-3 text-[13px] outline-none focus:border-[#5E2A8C] w-1/3"
                      />
                      <input 
                        type="tel" value={userPhone} onChange={(e) => setUserPhone(e.target.value)}
                        placeholder={t.phonePlace} 
                        className="bg-neutral-50 border border-neutral-200 rounded-[12px] p-3 text-[13px] outline-none focus:border-[#5E2A8C] flex-1"
                      />
                    </div>
                    <label className="flex items-start gap-2 cursor-pointer mt-1">
                      <input type="checkbox" checked={privacyConsent} onChange={(e) => setPrivacyConsent(e.target.checked)} className="mt-0.5 w-3.5 h-3.5" />
                      <span className="text-[11px] text-neutral-600 font-medium leading-tight">
                        {t.privacy}<br/>
                        <span className="text-red-500 font-bold">{t.privacySub}</span>
                      </span>
                    </label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-[13px] font-bold text-neutral-800">{t.step2} <span className="text-red-500">*</span></span>
                    <span className="text-[10px] text-neutral-500 font-medium -mt-1">{t.step2Desc}</span>
                    <label className="border-2 border-dashed border-neutral-200 bg-neutral-50 rounded-[16px] h-[120px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-neutral-100 transition-colors">
                      <CameraIcon className="w-8 h-8 text-neutral-400" />
                      <span className="text-[11px] text-[#5E2A8C] font-bold">{reportFile ? reportFile.name : t.uploadPlace}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setReportFile(e.target.files[0])} />
                    </label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-[13px] font-bold text-neutral-800">{t.step3} <span className="text-neutral-400 font-normal">{t.step3Desc}</span></span>
                    <div className="flex flex-wrap gap-2">
                      {currentKeywords.map(keyword => (
                        <button 
                          key={keyword}
                          onClick={() => setSelectedKeywords(prev => prev.includes(keyword) ? prev.filter(k => k !== keyword) : [...prev, keyword])}
                          className={`px-3 py-2 rounded-full text-[12px] font-bold border transition-colors ${selectedKeywords.includes(keyword) ? 'bg-[#FF8C00]/10 border-[#FF8C00] text-[#FF8C00]' : 'bg-white border-neutral-200 text-neutral-500'}`}
                        >
                          {keyword}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-[13px] font-bold text-neutral-800">{t.step4}</span>
                    <textarea 
                      value={reportText} onChange={(e) => setReportText(e.target.value)}
                      placeholder={t.step4Place} 
                      className="bg-neutral-50 border border-neutral-200 rounded-[12px] p-3 text-[13px] outline-none focus:border-[#5E2A8C] min-h-[80px]"
                    />
                  </div>
                </div>

                <div className="p-4 border-t border-neutral-100">
                  <button onClick={handleUserReportSubmit} disabled={isSubmitting} className={`w-full py-4 rounded-[16px] font-black text-white text-[15px] shadow-lg ${reportFile && userName && userPhone && privacyConsent && selectedKeywords.length > 0 ? BRAND_GRADIENT : 'bg-neutral-300'}`}>
                    {isSubmitting ? t.submitWait : t.submitBtn}
                  </button>
                </div>
              </div>
            )}

            {expandedCarousel && currentSlides.length > 0 && (
              <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
                <button onClick={() => setExpandedCarousel(null)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 z-50">
                  <XIcon className="w-6 h-6" />
                </button>

                <div className="absolute top-6 font-montserrat font-bold text-white/50 text-sm tracking-widest z-50">
                  {expandedCarousel.currentIndex + 1} / {currentSlides.length}
                </div>

                <div className="relative w-full max-w-md h-full flex items-center justify-center p-4">
                  {expandedCarousel.currentIndex > 0 && (
                    <button 
                      className="absolute left-2 p-3 text-white/70 hover:text-white z-50"
                      onClick={(e) => { e.stopPropagation(); setExpandedCarousel(prev => ({...prev, currentIndex: prev.currentIndex - 1})) }}
                    >
                      <ChevronLeft className="w-8 h-8 drop-shadow-lg" />
                    </button>
                  )}

                  <div className="w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                    <img 
                      src={currentSlides[expandedCarousel.currentIndex].img} 
                      alt="팝업이미지" 
                      className="w-full max-h-[60vh] object-contain rounded-[24px] shadow-2xl transition-all duration-300"
                      onError={(e) => { e.target.src = `https://picsum.photos/seed/${expandedCarousel.place.no}/600/800`; }}
                    />
                    
                    <div className="w-full mt-6 text-center px-4">
                      {currentSlides[expandedCarousel.currentIndex].type === 'report' ? (
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-[#FF8C00] font-black text-[11px] bg-[#FF8C00]/10 px-2.5 py-1 rounded-full">{currentSlides[expandedCarousel.currentIndex].title}</span>
                          <div className="flex gap-1 justify-center flex-wrap mt-1">
                            {currentSlides[expandedCarousel.currentIndex].keywords?.map((k, i) => {
                              const translatedK = lang === 'en' ? (REPORT_KEYWORDS_EN[REPORT_KEYWORDS_KO.indexOf(k)] || k) : k;
                              return <span key={i} className="text-white text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">{translatedK}</span>
                            })}
                          </div>
                          <p className="text-white/90 text-[13px] font-medium mt-2 leading-relaxed bg-white/10 p-3 rounded-xl inline-block text-left w-full max-w-[300px]">
                            "{currentSlides[expandedCarousel.currentIndex].text}"
                          </p>
                        </div>
                      ) : (
                        <>
                          <span className="text-white font-black text-xl tracking-tight font-montserrat">{currentSlides[expandedCarousel.currentIndex].title}</span>
                          <p className="text-white/50 text-xs mt-1.5">{currentSlides[expandedCarousel.currentIndex].text}</p>
                          {currentSlides.length > 1 && <p className="text-[#FF8C00] text-[10px] font-bold mt-4 animate-pulse">{t.swipeGuide}</p>}
                        </>
                      )}
                    </div>
                  </div>

                  {expandedCarousel.currentIndex < currentSlides.length - 1 && (
                    <button 
                      className="absolute right-2 p-3 text-white/70 hover:text-white z-50"
                      onClick={(e) => { e.stopPropagation(); setExpandedCarousel(prev => ({...prev, currentIndex: prev.currentIndex + 1})) }}
                    >
                      <ChevronRight className="w-8 h-8 drop-shadow-lg" />
                    </button>
                  )}
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
