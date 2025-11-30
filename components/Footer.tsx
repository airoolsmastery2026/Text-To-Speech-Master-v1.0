
import React, { useState } from 'react';
import { Facebook, Youtube, Info, BookOpen, X, Lightbulb, List, Layers, Mic, Volume2, Fingerprint, Code2, Globe, Terminal, MonitorPlay, DownloadCloud } from 'lucide-react';

const Footer: React.FC = () => {
  const [showGuide, setShowGuide] = useState(false);
  const [guideTab, setGuideTab] = useState<'intro' | 'steps' | 'tips' | 'install'>('intro');

  return (
    <>
      <footer className="w-full mt-12 py-10 border-t border-brand-blueLight bg-brand-blueLight/30">
        <div className="max-w-6xl mx-auto px-4">
          
          {/* 3-COLUMN LAYOUT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            
            {/* COLUMN 1: MỤC TIÊU */}
            <div className="space-y-4">
              <h3 className="text-brand-gold font-bold text-lg flex items-center gap-2">
                <Info size={20} />
                Mục tiêu
              </h3>
              <div className="text-gray-400 text-sm space-y-3">
                <p className="flex items-center gap-2 font-bold text-white">
                  <Code2 size={16} className="text-brand-gold" />
                  <span>Nhà phát triển: [NGUYỄN HỮU HƯƠNG]</span>
                </p>
                <div className="leading-relaxed opacity-90 space-y-2 text-justify">
                  <p>
                    Đây là ứng dụng "All-in-One"
                  </p>
                  <p className="text-gray-300">
                    Mục tiêu: Hỗ trợ creator, giáo viên, marketer, youtuber, tiktoker, tạo giọng đọc AI chất lượng cao miễn phí. giúp bạn chuyển đổi qua lại giữa Văn bản và Giọng nói một cách chuyên nghiệp. Không cần cài đặt phần mềm nặng máy, mọi thứ đều hoạt động ngay trên trình duyệt của bạn.
                  </p>
                </div>
              </div>
            </div>

            {/* COLUMN 2: COMMUNITY */}
            <div className="space-y-4">
              <h3 className="text-brand-gold font-bold text-lg flex items-center gap-2">
                <Globe size={20} />
                Cộng đồng
              </h3>
              <div className="space-y-3">
                 {/* Zalo Link */}
                <a 
                  href="https://zalo.me/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group p-2 hover:bg-gray-700/30 rounded-lg -ml-2"
                >
                  <span className="bg-blue-600 w-8 h-8 rounded-full text-white group-hover:scale-110 transition-transform font-bold text-xs flex items-center justify-center shadow-lg">
                    Z
                  </span>
                  <div>
                    <span className="block font-bold text-gray-200 text-sm">Nhóm Zalo Hỗ Trợ</span>
                  </div>
                </a>

                {/* Facebook Link */}
                <a 
                  href="https://www.facebook.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group p-2 hover:bg-gray-700/30 rounded-lg -ml-2"
                >
                  <span className="bg-blue-700 w-8 h-8 rounded-full text-white group-hover:scale-110 transition-transform flex items-center justify-center shadow-lg">
                    <Facebook size={16} />
                  </span>
                  <div>
                    <span className="block font-bold text-gray-200 text-sm">Cộng đồng Facebook</span>
                  </div>
                </a>

                {/* YouTube Link */}
                <a 
                  href="https://www.youtube.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group p-2 hover:bg-gray-700/30 rounded-lg -ml-2"
                >
                  <span className="bg-red-600 w-8 h-8 rounded-full text-white group-hover:scale-110 transition-transform flex items-center justify-center shadow-lg">
                    <Youtube size={16} />
                  </span>
                  <div>
                    <span className="block font-bold text-gray-200 text-sm">Kênh YouTube Hướng Dẫn</span>
                  </div>
                </a>
              </div>
            </div>

            {/* COLUMN 3: GUIDE - LEFT ALIGNED */}
            <div className="space-y-4 flex flex-col items-start">
              <h3 className="text-brand-gold font-bold text-lg flex items-center gap-2">
                <BookOpen size={20} />
                Hỗ trợ
              </h3>
              
              <p className="text-gray-400 text-sm text-left">
                Gặp khó khăn khi sử dụng? <br/> Xem hướng dẫn chi tiết bên dưới.
              </p>

              <button
                onClick={() => setShowGuide(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-brand-gold hover:text-brand-blue text-gray-200 rounded-full text-sm transition-all border border-gray-600 hover:border-brand-gold shadow-lg group"
              >
                <Lightbulb size={16} className="group-hover:text-brand-blue text-brand-gold" />
                Hướng dẫn sử dụng
              </button>
            </div>

          </div>

          {/* BOTTOM COPYRIGHT SECTION - CENTERED */}
          <div className="border-t border-gray-700/50 pt-6 text-center">
            <p className="text-xs text-gray-500 mb-1">© 2024 Text To Speech Master. Powered by Google Gemini.</p>
            <p className="text-sm text-brand-gold/80 font-bold uppercase tracking-wider">
              Tác giả: NGUYỄN HỮU HƯƠNG &nbsp;|&nbsp; SĐT: 0328721724
            </p>
          </div>
        </div>
      </footer>

      {/* GUIDE MODAL */}
      {showGuide && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in"
          onClick={() => setShowGuide(false)}
        >
          <div 
            className="bg-brand-blueLight border border-gray-600 rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-brand-blue/50 rounded-t-xl">
              <h2 className="text-2xl font-bold text-brand-gold flex items-center gap-2">
                <BookOpen size={24} />
                Hướng dẫn sử dụng
              </h2>
              <button onClick={() => setShowGuide(false)} className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-gray-700 bg-brand-blue/30 overflow-x-auto">
              <button 
                onClick={() => setGuideTab('intro')}
                className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-2 whitespace-nowrap ${guideTab === 'intro' ? 'text-brand-gold border-brand-gold bg-brand-gold/5' : 'text-gray-400 border-transparent hover:text-white'}`}
              >
                <Info size={16} /> Giới thiệu
              </button>
              <button 
                onClick={() => setGuideTab('steps')}
                className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-2 whitespace-nowrap ${guideTab === 'steps' ? 'text-brand-gold border-brand-gold bg-brand-gold/5' : 'text-gray-400 border-transparent hover:text-white'}`}
              >
                <List size={16} /> Quy trình (Steps)
              </button>
              <button 
                onClick={() => setGuideTab('tips')}
                className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-2 whitespace-nowrap ${guideTab === 'tips' ? 'text-brand-gold border-brand-gold bg-brand-gold/5' : 'text-gray-400 border-transparent hover:text-white'}`}
              >
                <Lightbulb size={16} /> Mẹo hay
              </button>
              <button 
                onClick={() => setGuideTab('install')}
                className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors border-b-2 whitespace-nowrap ${guideTab === 'install' ? 'text-brand-gold border-brand-gold bg-brand-gold/5' : 'text-gray-400 border-transparent hover:text-white'}`}
              >
                <DownloadCloud size={16} /> Cài đặt
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-grow overflow-y-auto p-6 text-gray-300 space-y-6 custom-scrollbar">
              
              {/* TAB: INTRO */}
              {guideTab === 'intro' && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-xl font-bold text-white">Chào mừng đến với Text To Speech Master</h3>
                  <p>
                    Đây là ứng dụng "All-in-One" giúp bạn chuyển đổi qua lại giữa Văn bản và Giọng nói một cách chuyên nghiệp. 
                    Không cần cài đặt phần mềm nặng máy, mọi thứ đều hoạt động ngay trên trình duyệt của bạn.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-brand-blue p-4 rounded-lg border border-gray-700">
                      <h4 className="font-bold text-brand-gold mb-2 flex items-center gap-2"><Volume2 size={18}/> Đa dạng giọng đọc</h4>
                      <p className="text-sm">Tích hợp Gemini (Free), Google Cloud (Standard) và ElevenLabs (Cao cấp) để bạn có hàng chục lựa chọn giọng đọc.</p>
                    </div>
                    <div className="bg-brand-blue p-4 rounded-lg border border-gray-700">
                      <h4 className="font-bold text-brand-gold mb-2 flex items-center gap-2"><Layers size={18}/> Xử lý hàng loạt</h4>
                      <p className="text-sm">Chế độ Batch Mode giúp bạn tạo giọng đọc cho 50 file văn bản hoặc trích xuất text từ 50 file ghi âm cùng lúc.</p>
                    </div>
                    <div className="bg-brand-blue p-4 rounded-lg border border-gray-700">
                       <h4 className="font-bold text-brand-gold mb-2 flex items-center gap-2"><Fingerprint size={18}/> Tạo giọng Clone</h4>
                       <p className="text-sm">Tải lên mẫu giọng của chính bạn để tạo ra một bản sao AI độc bản (yêu cầu ElevenLabs API).</p>
                    </div>
                    <div className="bg-brand-blue p-4 rounded-lg border border-gray-700">
                       <h4 className="font-bold text-brand-gold mb-2 flex items-center gap-2"><Mic size={18}/> Audio Mixer</h4>
                       <p className="text-sm">Tự động ghép nhạc nền vào giọng đọc, hỗ trợ chỉnh volume và xuất file Stereo chuyên nghiệp.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: STEPS */}
              {guideTab === 'steps' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Step 1: TTS */}
                  <div className="border-l-2 border-brand-gold pl-4">
                    <h3 className="text-lg font-bold text-white mb-2">1. Chuyển Văn bản thành Giọng nói (TTS)</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li><strong>Bước 1:</strong> Chọn tab "Văn bản → Giọng nói".</li>
                      <li><strong>Bước 2:</strong> Chọn Ngôn ngữ và Giọng đọc trong phần Cấu hình. (Bấm icon Loa để nghe thử).</li>
                      <li><strong>Bước 3:</strong> Nhập văn bản hoặc tải file <code>.txt</code> lên.</li>
                      <li><strong>Bước 4:</strong> Bấm nút "Chuyển thành giọng nói" và chờ AI xử lý.</li>
                      <li><strong>Bước 5:</strong> Sau khi xong, bạn có thể tải về ngay hoặc ghép thêm nhạc nền ở cột kết quả.</li>
                    </ul>
                  </div>

                  {/* Step 2: STT */}
                  <div className="border-l-2 border-green-500 pl-4">
                    <h3 className="text-lg font-bold text-white mb-2">2. Chuyển Giọng nói thành Văn bản (STT)</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li><strong>Bước 1:</strong> Chọn tab "Giọng nói → Văn bản".</li>
                      <li><strong>Bước 2:</strong> Bấm vào khu vực Upload để chọn file Audio/Video (hoặc kéo thả file vào).</li>
                      <li><strong>Bước 3:</strong> Bấm "Chuyển thành văn bản". Gemini AI sẽ phân tích và chép lại nội dung.</li>
                      <li><strong>Bước 4:</strong> Sao chép kết quả hoặc tải file <code>.txt</code> về máy.</li>
                    </ul>
                  </div>

                  {/* Step 3: Batch */}
                  <div className="border-l-2 border-blue-500 pl-4">
                    <h3 className="text-lg font-bold text-white mb-2">3. Xử lý hàng loạt (Batch Mode)</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li><strong>Bước 1:</strong> Kích hoạt nút "Chế độ Hàng loạt" ở góc phải phần Cấu hình.</li>
                      <li><strong>Bước 2:</strong> Kéo thả nhiều file cùng lúc vào ô nhận diện.</li>
                      <li><strong>Bước 3:</strong> Bấm "Bắt đầu xử lý". Ứng dụng sẽ chạy lần lượt từng file (Queue).</li>
                      <li><strong>Bước 4:</strong> Theo dõi tiến độ ở cột phải và bấm nút tải xuống tương ứng cho từng file đã xong.</li>
                    </ul>
                  </div>

                  {/* Step 4: Clone */}
                  <div className="border-l-2 border-purple-500 pl-4">
                    <h3 className="text-lg font-bold text-white mb-2">4. Tạo giọng Clone & Cài đặt API</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li>Bấm nút "Cài đặt API" ở góc trên cùng để nhập Key của Google Cloud hoặc ElevenLabs.</li>
                      <li>Để tạo giọng mới: Bấm nút "Clone" nhỏ cạnh label Giọng đọc -> Tải lên các file ghi âm mẫu -> Đặt tên -> Bấm "Tạo giọng".</li>
                      <li>Giọng mới sẽ xuất hiện trong danh sách chọn giọng ngay lập tức.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB: TIPS */}
              {guideTab === 'tips' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-yellow-900/20 border border-yellow-600/30 p-4 rounded-lg">
                    <h4 className="font-bold text-yellow-500 mb-2">🚀 Mẹo tối ưu chất lượng</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
                      <li><strong>Định dạng file:</strong> Luôn ưu tiên dùng file <code>.txt</code> (UTF-8) để tránh lỗi font chữ khi upload.</li>
                      <li><strong>Nhạc nền:</strong> Nếu bạn muốn video hay hơn, hãy chọn nhạc nền Stereo. Ứng dụng sẽ tự động trộn giọng đọc (Mono) thành Stereo để âm thanh dày và hay hơn.</li>
                      <li><strong>Ngắt nghỉ:</strong> Trong văn bản, hãy dùng dấu phẩy (,) để ngắt câu ngắn và dấu chấm (.) để nghỉ dài hơn. Xuống dòng để AI hiểu là chuyển đoạn.</li>
                    </ul>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-600/30 p-4 rounded-lg">
                    <h4 className="font-bold text-blue-400 mb-2">🔑 Mẹo tiết kiệm chi phí</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
                      <li><strong>Gemini Free:</strong> Giọng Gemini hoàn toàn miễn phí và không giới hạn nhiều như các dịch vụ khác. Hãy dùng nó cho các bản nháp hoặc dự án cá nhân.</li>
                      <li><strong>Quản lý Key:</strong> ElevenLabs tính phí theo ký tự. Hãy kiểm tra kỹ văn bản trước khi bấm tạo để tránh lãng phí quota.</li>
                      <li><strong>Batch Mode:</strong> Nếu có 50 file ngắn, hãy dùng Batch Mode thay vì làm thủ công từng cái, giúp tiết kiệm thời gian đáng kể.</li>
                    </ul>
                  </div>

                   <div className="bg-red-900/20 border border-red-600/30 p-4 rounded-lg">
                    <h4 className="font-bold text-red-400 mb-2">⚠️ Lưu ý quan trọng</h4>
                    <p className="text-sm text-gray-300">
                      API Key của bạn được lưu trong trình duyệt (Local Storage) để tiện sử dụng lại. Nếu dùng máy tính công cộng, hãy nhớ bấm nút <strong>"Xóa Key đã lưu"</strong> trong phần Cài đặt trước khi rời đi để bảo mật tài khoản.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB: INSTALLATION GUIDE */}
              {guideTab === 'install' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="p-4 bg-brand-blueLight border-l-4 border-brand-gold rounded-r-lg">
                      <p className="text-gray-300 text-sm">
                          Ứng dụng này được xây dựng bằng <strong>React & TypeScript</strong>. Bạn không thể chạy trực tiếp file HTML. 
                          Vui lòng chọn 1 trong 2 cách dưới đây để chạy.
                      </p>
                  </div>

                  {/* METHOD 1: ONLINE */}
                  <div className="bg-brand-blue border border-gray-700 rounded-xl overflow-hidden">
                      <div className="bg-gray-800 p-4 flex items-center gap-3 border-b border-gray-700">
                          <div className="bg-green-600 p-2 rounded-lg"><MonitorPlay size={20} className="text-white"/></div>
                          <h3 className="font-bold text-lg text-white">Cách 1: Chạy Online (Nhanh nhất - Không cần cài đặt)</h3>
                      </div>
                      <div className="p-6 space-y-4">
                           <p className="text-gray-400 text-sm">Đây là cách dễ nhất để xem kết quả ngay lập tức.</p>
                          <ol className="list-decimal list-inside space-y-3 text-sm text-gray-300">
                              <li>Truy cập trang web <strong><a href="https://stackblitz.com" target="_blank" rel="noreferrer" className="text-brand-gold hover:underline">StackBlitz.com</a></strong>.</li>
                              <li>Chọn tạo dự án mới: <strong>"React with TypeScript"</strong>.</li>
                              <li>Trong khung quản lý file bên trái:
                                  <ul className="list-disc list-inside ml-4 mt-1 text-gray-400">
                                      <li>Xóa các file mặc định trong thư mục <code>src</code>.</li>
                                      <li>Tạo lại cấu trúc thư mục giống hệt code đã cung cấp (<code>src/components</code>, <code>src/services</code>, <code>src/utils</code>).</li>
                                      <li>Copy & Paste nội dung code vào các file tương ứng (App.tsx, types.ts, v.v.).</li>
                                  </ul>
                              </li>
                              <li>Trong khung <strong>Dependencies</strong>, nhập tên các thư viện sau để cài đặt:
                                  <div className="mt-2 bg-black p-3 rounded font-mono text-green-400 border border-gray-700">
                                      @google/genai<br/>
                                      lucide-react
                                  </div>
                              </li>
                              <li>Ứng dụng sẽ tự động chạy ở khung bên phải.</li>
                          </ol>
                      </div>
                  </div>

                   {/* METHOD 2: LOCAL */}
                  <div className="bg-brand-blue border border-gray-700 rounded-xl overflow-hidden">
                      <div className="bg-gray-800 p-4 flex items-center gap-3 border-b border-gray-700">
                          <div className="bg-blue-600 p-2 rounded-lg"><Terminal size={20} className="text-white"/></div>
                          <h3 className="font-bold text-lg text-white">Cách 2: Chạy trên máy tính (Khuyên dùng lâu dài)</h3>
                      </div>
                      <div className="p-6 space-y-6">
                          <div>
                              <h4 className="font-bold text-brand-gold mb-2">Bước 1: Cài đặt môi trường</h4>
                              <p className="text-sm text-gray-400">Tải và cài đặt Node.js (bản LTS) tại: <a href="https://nodejs.org" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">nodejs.org</a>. Sau đó mở Terminal (hoặc CMD/PowerShell).</p>
                          </div>
                          
                          <div>
                              <h4 className="font-bold text-brand-gold mb-2">Bước 2: Tạo dự án</h4>
                              <div className="bg-black p-4 rounded-lg font-mono text-xs text-gray-300 border border-gray-700 overflow-x-auto whitespace-pre">
<span className="text-gray-500"># 1. Tạo dự án mới tên là tts-app dùng Vite</span>
<span className="text-yellow-400">npm create vite@latest tts-app -- --template react-ts</span>

<span className="text-gray-500"># 2. Đi vào thư mục dự án</span>
<span className="text-yellow-400">cd tts-app</span>

<span className="text-gray-500"># 3. Cài đặt các thư viện cần thiết</span>
<span className="text-yellow-400">npm install</span>
<span className="text-yellow-400">npm install @google/genai lucide-react</span>
<span className="text-yellow-400">npm install -D tailwindcss postcss autoprefixer</span>
                              </div>
                          </div>

                          <div>
                              <h4 className="font-bold text-brand-gold mb-2">Bước 3: Cấu hình Tailwind CSS</h4>
                              <p className="text-sm text-gray-400 mb-2">Chạy lệnh: <code>npx tailwindcss init -p</code>. Sửa file <code>tailwind.config.js</code>:</p>
                              <div className="bg-black p-3 rounded font-mono text-xs text-gray-400 border border-gray-700 mb-2">
                                  export default &#123;<br/>
                                  &nbsp;&nbsp;content: ["./index.html", "./src/**/*.&#123;js,ts,jsx,tsx&#125;"],<br/>
                                  &nbsp;&nbsp;theme: &#123; extend: &#123; colors: &#123; brand: &#123; ... &#125; &#125; &#125; &#125;,<br/>
                                  &nbsp;&nbsp;plugins: [],<br/>
                                  &#125;
                              </div>
                              <p className="text-sm text-gray-400">Sửa file <code>src/index.css</code>:</p>
                               <div className="bg-black p-3 rounded font-mono text-xs text-gray-400 border border-gray-700">
                                  @tailwind base;<br/>
                                  @tailwind components;<br/>
                                  @tailwind utilities;<br/><br/>
                                  body &#123; background-color: #0f172a; color: #f8fafc; &#125;
                              </div>
                          </div>

                          <div>
                              <h4 className="font-bold text-brand-gold mb-2">Bước 4: Copy Code vào dự án</h4>
                              <ul className="list-disc list-inside text-sm text-gray-400 space-y-2">
                                  <li><strong>index.html:</strong> Copy nội dung file index.html (giữ lại script main.tsx và thêm script lamejs).</li>
                                  <li><strong>Trong thư mục src:</strong> Tạo các file <code>types.ts</code>, <code>App.tsx</code> và các thư mục <code>components</code>, <code>services</code>, <code>utils</code> với file con tương ứng.</li>
                                  <li className="text-yellow-200 bg-yellow-900/20 p-2 rounded border border-yellow-700/50">
                                      <strong>Lưu ý:</strong> Trong file <code>services/geminiService.ts</code>, nếu gặp lỗi process.env, hãy sửa thành logic lấy key từ localStorage hoặc import.meta.env.
                                  </li>
                              </ul>
                          </div>

                          <div>
                              <h4 className="font-bold text-brand-gold mb-2">Bước 5: Chạy ứng dụng</h4>
                              <div className="bg-black p-3 rounded font-mono text-green-400 border border-gray-700">
                                  npm run dev
                              </div>
                              <p className="text-sm text-gray-400 mt-2">Mở link hiện ra (vd: http://localhost:5173) để sử dụng.</p>
                          </div>

                          <div>
                              <h4 className="font-bold text-brand-gold mb-2">Cấu trúc thư mục</h4>
                              <div className="bg-black p-4 rounded-lg font-mono text-xs text-gray-300 border border-gray-700 overflow-x-auto whitespace-pre">
tts-app/<br/>
├── index.html          (Chứa script tailwind và lamejs)<br/>
├── package.json<br/>
├── src/<br/>
│   ├── main.tsx        (Code khởi chạy React - tương ứng index.tsx cũ)<br/>
│   ├── App.tsx         (Code chính)<br/>
│   ├── types.ts        (Định nghĩa kiểu)<br/>
│   ├── index.css       (Cấu hình Tailwind directives)<br/>
│   ├── components/     (Header.tsx, Footer.tsx)<br/>
│   ├── services/       (geminiService.ts, externalTtsService.ts)<br/>
│   └── utils/          (audioUtils.ts)
                              </div>
                          </div>
                      </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
