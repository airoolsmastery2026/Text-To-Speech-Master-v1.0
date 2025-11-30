import React from 'react';
import { Sparkles } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="w-full py-8 text-center space-y-3">
      <div className="flex items-center justify-center gap-3">
        <Sparkles className="w-8 h-8 text-brand-gold animate-pulse" />
        <h1 className="text-4xl md:text-5xl font-bold text-brand-gold tracking-wide uppercase drop-shadow-lg">
          Text To Speech Master
        </h1>
        <Sparkles className="w-8 h-8 text-brand-gold animate-pulse" />
      </div>
      <p className="text-gray-300 text-lg md:text-xl font-light">
        Ứng dụng chuyển văn bản thành giọng nói AI – hỗ trợ Tiếng Việt
      </p>
      <p className="text-brand-gold/90 text-sm md:text-base font-bold uppercase tracking-wide pt-2">
        Tác giả: NGUYỄN HỮU HƯƠNG &nbsp;|&nbsp; SĐT: 0328721724
      </p>
    </header>
  );
};

export default Header;