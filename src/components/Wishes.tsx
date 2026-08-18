import React, { useState } from 'react';
import { useWedding } from '../context/WeddingContext';
import { MessageSquareHeart, Heart, Send, Sparkles } from 'lucide-react';

export const Wishes: React.FC = () => {
  const { wishes, addWish, likeWish } = useWedding();
  const [author, setAuthor] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !message.trim()) return;

    addWish(author.trim(), message.trim());
    setAuthor('');
    setMessage('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <section id="wishes" className="py-24 relative bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blush-50 border border-blush-200 text-rosewood text-xs uppercase tracking-widest font-medium mb-3">
            <MessageSquareHeart className="w-3.5 h-3.5 text-blush-500" />
            <span>Words of Love</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-stone-800 tracking-tight mb-4">
            Guestbook &amp; Wishes
          </h2>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-blush-400 to-transparent mx-auto mb-4"></div>
          <p className="font-display italic text-lg text-stone-600">
            Leave a note of love, wisdom, or joyful memories for the newlyweds.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Post a Wish Form */}
          <div className="lg:col-span-4">
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-blush-200 shadow-lg sticky top-28">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-gold" />
                <h3 className="font-serif text-xl text-stone-800">Leave a Blessing</h3>
              </div>

              {submitted ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center animate-fadeIn">
                  Thank you! Your wish has been added to our guestbook. 💕
                </div>
              ) : (
                <form onSubmit={handleSubmitWish} className="space-y-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1 font-medium">
                      Your Name(s) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Grandma Rose &amp; Uncle Leo"
                      value={author}
                      onChange={e => setAuthor(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-blush-200 text-xs focus:ring-2 focus:ring-blush-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-stone-500 mb-1 font-medium">
                      Your Message *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Write your wishes, advice, or love note here..."
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-blush-200 text-xs focus:ring-2 focus:ring-blush-200 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-full bg-gradient-to-r from-blush-500 to-rose-500 text-white font-medium text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Blessing</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Wishes List */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {wishes.map(wish => (
                <div
                  key={wish.id}
                  className="glass-card rounded-3xl p-6 border border-blush-200/80 shadow-sm glass-card-hover flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-serif font-semibold text-stone-800 text-base">
                        {wish.name}
                      </div>
                      <span className="text-[11px] text-stone-400">
                        {new Date(wish.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <p className="text-stone-600 text-xs leading-relaxed font-display italic text-base mb-4">
                      &ldquo;{wish.message}&rdquo;
                    </p>
                  </div>

                  <div className="flex items-center justify-end pt-3 border-t border-blush-100">
                    <button
                      onClick={() => likeWish(wish.id)}
                      className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-blush-600 transition group"
                    >
                      <Heart className="w-4 h-4 text-blush-400 group-hover:scale-125 group-hover:fill-blush-500 transition-transform" />
                      <span className="font-medium text-stone-600">{wish.likes || 0}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
