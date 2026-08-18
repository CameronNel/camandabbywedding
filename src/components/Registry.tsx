import React, { useState } from 'react';
import { useWedding } from '../context/WeddingContext';
import { Gift, Plane, Wine, ExternalLink, Copy, Check } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Plane: <Plane className="w-6 h-6" />,
  Gift: <Gift className="w-6 h-6" />,
  Wine: <Wine className="w-6 h-6" />
};

export const Registry: React.FC = () => {
  const { registryItems } = useWedding();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyAccount = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <section id="registry" className="py-24 relative bg-gradient-to-b from-[#FFFDFB] via-[#FFF6F9] to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-blush-200 text-rosewood text-xs uppercase tracking-widest font-medium mb-3">
            <Gift className="w-3.5 h-3.5 text-blush-500" />
            <span>Wishlist &amp; Registry</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-stone-800 tracking-tight mb-4">
            Gift Registry
          </h2>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-blush-400 to-transparent mx-auto mb-4"></div>
          <p className="font-display italic text-lg text-stone-600">
            Your presence at our wedding is the greatest gift of all. Should you wish to honor us with a gift or contribute to our honeymoon adventure, we have curated a few options below.
          </p>
        </div>

        {/* Registry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {registryItems.map(item => (
            <div
              key={item.id}
              className="glass-card rounded-3xl p-8 border border-blush-200 shadow-sm glass-card-hover flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blush-500 to-rose-400 text-white flex items-center justify-center mb-6 shadow-md shadow-blush-500/20">
                  {iconMap[item.icon] || <Gift className="w-6 h-6" />}
                </div>

                <h3 className="font-serif text-xl font-medium text-stone-800 mb-2">
                  {item.title}
                </h3>

                <p className="text-stone-600 text-xs leading-relaxed mb-6">
                  {item.description}
                </p>

                {/* Progress bar for honeymoon fund */}
                {item.type === 'honeymoon' && item.goalAmount && (
                  <div className="mb-6 p-4 rounded-2xl bg-blush-50/70 border border-blush-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-stone-700">Honeymoon Fund Goal</span>
                      <span className="font-semibold text-rosewood font-serif">
                        R{item.currentAmount?.toLocaleString()} / R{item.goalAmount?.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-blush-200/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blush-400 to-rose-500 rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(((item.currentAmount || 0) / item.goalAmount) * 100)
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* EFT Bank details */}
                {item.accountDetails && (
                  <div className="mb-4 p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-[11px] font-mono text-stone-700 flex items-center justify-between">
                    <span className="truncate">{item.accountDetails}</span>
                    <button
                      onClick={() => handleCopyAccount(item.accountDetails!, item.id)}
                      className="text-blush-600 hover:text-blush-800 ml-2 shrink-0 flex items-center gap-1 font-sans text-xs font-semibold"
                      title="Copy banking details"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Action Link */}
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-full bg-white hover:bg-blush-50 text-rosewood border border-blush-300 text-xs font-semibold uppercase tracking-wider transition shadow-sm hover:shadow flex items-center justify-center gap-2 group"
                >
                  <span>View Registry Store</span>
                  <ExternalLink className="w-3.5 h-3.5 text-blush-500 group-hover:translate-x-0.5 transition-transform" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
