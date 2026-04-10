import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createClient } from '@supabase/supabase-js';

// 기존과 동일한 Supabase 키 (Edge Function 실행을 위해 그대로 사용)
const supabaseUrl = 'https://mdpqzcwamhzxybldvctr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kcHF6Y3dhbWh6eHlibGR2Y3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTU0OTksImV4cCI6MjA4OTY5MTQ5OX0.qynZlOh2SDPVOg-0dNJA_zKL7sTGS8JTkInxz0mRQQY';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- 디자인 시스템 및 아이콘 (기존 유지) ---
const BRAND_GRADIENT = "bg-gradient-to-br from-[#5E2A8C] to-[#FF8C00]";
const BRAND_TEXT_GRADIENT = "bg-gradient-to-br from-[#5E2A8C] to-[#FF8C00] bg-clip-text text-transparent";
const SpottersLogo = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className={className}>
    <defs><linearGradient id="brand-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#5E2A8C" /><stop offset="100%" stopColor="#FF8C00" /></linearGradient></defs>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#brand-gradient)" />
  </svg>
);
const PlayIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M8 5v14l11-7z"/></svg>;

const createPointMarker = (place) => {
  let bgColor = place.status === '마감' ? 'bg-red-500' : place.status === '혼잡' ? 'bg-orange-500' : 'bg-emerald-500';
  let breatheClass = place.status !== '원활' ? 'animate-breathe' : '';

  return L.divIcon({
    className: 'custom-dot-marker',
    html: `
      <div class="relative flex items-center justify-center group cursor-pointer" style="width: 14px; height: 14px;">
        <div class="relative w-3.5 h-3.5 rounded-full border-[2px] border-white shadow-md ${bgColor} ${breatheClass} z-20"></div>
        <span class="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 text-[11.5px] font-bold text-neutral-800 tracking-tight whitespace-nowrap z-30" 
              style="text-shadow: -1.5px -1.5px 0 #fff, 1.5px -1.5px 0 #fff, -1.5px 1.5px 0 #fff, 1.5px 1.5px 0 #fff;">
          ${place.name}
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

function App() {
  const [placesData, setPlacesData] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mapCenter, setMapCenter] = useState([37.5425, 127.0570]); 
  
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [secretCount, setSecretCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) setIsAdminMode(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setIsAdminMode(!!session); });
    return () => subscription.unsubscribe();
  }, []);

  const fetchPlaces = async () => {
    try {
      const { data, error } = await supabase.from('places').select('*').order('trend_score', { ascending: false });
      if (error) throw error;
      setPlacesData(data || []);
    } catch (err) { console.error("로드 실패:", err.message); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchPlaces(); }, []);

  const handleSecretLogin = async () => {
    if (secretCount >= 4) {
      const email = window.prompt("관리자 아이디(이메일):");
      const pwd = window.prompt("관리자 비밀번호:");
      const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
      if (!error) setIsAdminMode(true);
      setSecretCount(0);
    } else { setSecretCount(prev => prev + 1); }
  };

  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
    setIsAdminMode(false);
  };

  // 🚀 핵심: 방금 배포한 Edge Function을 호출하는 버튼 로직
  const handleTriggerUpdate = async () => {
    if (!window.confirm("API를 호출하여 성수동 주변 핫스팟 정보를 자동 갱신하시겠습니까?\n(수집에 약 10~20초 소요됩니다)")) return;
    
    setIsUpdating(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-hotspots');
      if (error) throw error;
      alert(`✅ 성공! ${data.count}개의 핫스팟이 새로 갱신되었습니다.`);
      fetchPlaces(); // 갱신된 데이터로 지도 새로고침
    } catch (err) {
      alert(`[오류] 업데이트 실패: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <div className="bg-[#1A1A1A] min-h-screen flex items-center justify-center text-white font-bold animate-pulse">데이터를 불러오는 중...</div>;

  return (
    <>
      <style>{`
        body { font-family: 'Pretendard', sans-serif; }
        .leaflet-container { width: 100%; height: 100%; z-index: 0; background: #e5e5e5; }
        .custom-dot-marker { background: transparent; border: none; overflow: visible !important; }
        .modern-map-tiles { filter: grayscale(100%) brightness(1.05) contrast(0.95); }
        @keyframes noticeable-breathe { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.25); opacity: 0.75; } }
        .animate-breathe { animation: noticeable-breathe 1.2s infinite; }
      `}</style>

      <div className="bg-[#1A1A1A] min-h-screen flex items-center justify-center">
        <div className="w-full max-w-[430px] h-[100dvh] sm:h-[85vh] bg-[#FFFFFF] relative sm:rounded-[40px] overflow-hidden shadow-2xl sm:border-[8px] sm:border-neutral-800 flex flex-col">
          
          <header className="absolute top-0 w-full z-40 p-4 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-neutral-100 p-3.5 flex justify-between items-center pointer-events-auto">
              <div className="flex items-center gap-2">
                <SpottersLogo className="w-8 h-8" />
                <div className="flex flex-col">
                  <h1 className={`text-[20px] font-black tracking-tight leading-none ${BRAND_TEXT_GRADIENT}`}>SPOTTR<span className="text-neutral-900">.KR</span></h1>
                  <span onClick={handleSecretLogin} className="text-[9px] font-bold text-neutral-400 mt-0.5 cursor-pointer">
                    Seongsu Hotspots {isAdminMode && "(ADMIN)"}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {isAdminMode ? (
             <div className="flex-1 w-full bg-neutral-100 pt-[100px] pb-6 px-4 flex flex-col gap-4">
               <div className="flex justify-between items-center mb-2">
                 <h2 className="text-lg font-black">데이터 실시간 관리</h2>
                 <button onClick={handleAdminLogout} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full">로그아웃</button>
               </div>
               
               {/* 🚀 자동 업데이트 버튼 */}
               <div className="bg-white rounded-xl p-5 shadow-sm border border-neutral-200 text-center flex flex-col gap-3">
                 <p className="text-sm font-bold text-neutral-600">현재 구글/네이버/유튜브 데이터를 기반으로<br/>성수동 핫스팟을 자동 수집합니다.</p>
                 <button 
                   onClick={handleTriggerUpdate} 
                   disabled={isUpdating}
                   className={`w-full py-4 rounded-xl font-black text-white text-[15px] shadow-lg transition-all ${isUpdating ? 'bg-neutral-400' : BRAND_GRADIENT}`}
                 >
                   {isUpdating ? 'API 통신 및 수집 중...' : '🔥 데이터 자동 업데이트 실행'}
                 </button>
               </div>

               <div className="mt-4">
                 <h3 className="text-xs font-bold text-neutral-500 mb-2">현재 저장된 핫스팟 ({placesData.length}개)</h3>
                 <div className="flex flex-col gap-2 h-[300px] overflow-y-auto">
                   {placesData.map(p => (
                     <div key={p.no} className="bg-white p-3 rounded-lg border border-neutral-200 flex justify-between items-center">
                       <span className="font-bold text-sm truncate w-2/3">{p.name}</span>
                       <span className="text-[10px] bg-neutral-100 px-2 py-1 rounded text-neutral-500">트렌드: {p.trend_score}</span>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
          ) : (
            <div className="flex-1 relative z-0">
              <MapContainer center={mapCenter} zoom={16} zoomControl={false} className="w-full h-full">
                <TileLayer url={`https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=0MQk1Z9FONFMeu7MkCDh&lang=ko`} className="modern-map-tiles"/>
                <MapController center={mapCenter} />

                {placesData.map(place => (
                  <Marker key={place.no} position={[place.lat, place.lng]} icon={createPointMarker(place)} eventHandlers={{ click: () => { setSelectedPlace(place); setMapCenter([place.lat, place.lng]); }}}>
                    <Popup closeButton={false} autoPan={true} offset={[0, -10]} className="custom-photo-popup">
                      <div className="w-[180px] rounded-[16px] overflow-hidden bg-white shadow-xl pointer-events-auto">
                        <div className="relative w-full h-[120px] bg-neutral-200 group">
                          <img src={place.custom_img || `https://picsum.photos/seed/${place.no}/400/400`} className="w-full h-full object-cover" alt="썸네일"/>
                          {/* 유튜브 영상이 있으면 재생 버튼 표시 및 클릭 시 유튜브로 이동 */}
                          {place.youtube_vid && (
  <a href={place.youtube_vid} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/20 transition-colors">
    <div className="bg-[#03C75A] text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg border border-white/20">
      네이버 블로그 리뷰
    </div>
  </a>
)}
                        </div>
                        <div className="p-3">
                          <h3 className="text-[13px] font-black truncate">{place.name}</h3>
                          <div className="flex gap-1 mt-1">
                            <span className="text-[9px] bg-[#5E2A8C]/10 text-[#5E2A8C] px-1.5 py-0.5 rounded font-bold">{place.type}</span>
                            <span className="text-[9px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded">리뷰: {place.trend_score}</span>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;