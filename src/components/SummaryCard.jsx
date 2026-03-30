import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PlayCircle, Clock } from "lucide-react";

const SummaryCard = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className=" max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-10 shadow-2xl">
        
        {/* Başlık Bölümü */}
        <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
          <div className="p-3 bg-cyan-500/20 rounded-2xl">
            <PlayCircle className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              AI Video Analysis
            </h3>
            <p className="text-sm text-cyan-400/80 font-medium uppercase tracking-wider">
              Smart Summary
            </p>
          </div>
        </div>

        {/* RICH TEXT (MARKDOWN) İÇERİK ALANI */}
        <div className="prose prose-invert prose-cyan max-w-none">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // Kalın yazıları (**) daha parlak ve belirgin yapıyoruz
              strong: ({node, ...props}) => <span className="text-white font-black bg-white/5 px-1 rounded" {...props} />,
              // Listeleri düzenliyoruz
              ul: ({node, ...props}) => <ul className="list-disc space-y-2 ml-4 text-gray-300" {...props} />,
              li: ({node, ...props}) => <li className="marker:text-cyan-400" {...props} />,
              // Paragraflar arası boşluk
              p: ({node, ...props}) => <p className="mb-4 text-gray-200 leading-relaxed" {...props} />,
            }}
          >
            {summary}
          </ReactMarkdown>
        </div>

        {/* Alt Bilgi */}
        <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between text-gray-400">
          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-4 h-4" />
            <span>Analysis completed in seconds</span>
          </div>
          <span className="text-[10px] uppercase tracking-widest opacity-50">
            Powered by Gemini 1.5
          </span>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;