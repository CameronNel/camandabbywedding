import React, { useState, useRef } from 'react';
import { useWedding } from '../context/WeddingContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Printer,
  X,
  Sparkles,
  Heart,
  QrCode,
  Download,
  Check,
  Edit2,
  FileDown,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

interface PrintInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestNameOverride?: string;
}

export const PrintInvitationModal: React.FC<PrintInvitationModalProps> = ({
  isOpen,
  onClose,
  guestNameOverride
}) => {
  const { config, activeGuest } = useWedding();
  const [customGuestName, setCustomGuestName] = useState(
    guestNameOverride || activeGuest?.name || ''
  );
  const [isEditingName, setIsEditingName] = useState(false);
  const [includeQrCode, setIncludeQrCode] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const weddingDateFormatted = new Date(config.weddingDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Generate 5x7 High-Res PDF (300 DPI standard wedding invitation size)
  const handleDownloadPdf = async () => {
    if (!cardRef.current) return;
    setIsGeneratingPdf(true);
    try {
      // High resolution scale factor (3x) for crisp typography and graphics
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#FCF9F6',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);

      // Standard 5 x 7 inches portrait wedding card PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [5, 7],
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, 5, 7, undefined, 'FAST');
      const filename = `${config.brideShortName}_${config.groomShortName}_Wedding_Invitation.pdf`;
      pdf.save(filename);

      setDownloadSuccess('PDF downloaded in 5×7" luxury print quality!');
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (err) {
      console.error('Failed to generate PDF', err);
      alert('Could not generate PDF. Please try the Print button.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Generate High-Res PNG Image
  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsGeneratingImage(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#FCF9F6',
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${config.brideShortName}_${config.groomShortName}_Wedding_Card.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess('High-res invitation image downloaded!');
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (err) {
      console.error('Failed to generate image', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn no-print-backdrop">
      <div className="bg-white rounded-3xl shadow-2xl border border-blush-200 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Top Control Bar (Hidden in Print) */}
        <div className="px-6 py-4 border-b border-blush-100 bg-gradient-to-r from-blush-50 via-white to-blush-50 flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blush-500 to-rose-400 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-gold-light" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-stone-800 text-base sm:text-lg">
                Keepsake Wedding Stationery
              </h3>
              <p className="text-xs text-stone-500">
                5×7&quot; Standard Luxury Cardstock • High-Res Vector PDF &amp; Image
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct High-Res PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-blush-500 to-rose-500 text-white text-xs font-semibold uppercase tracking-wider shadow-md hover:shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Download 5x7 High-Res PDF"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customization Toolbar (Hidden in Print) */}
        <div className="px-6 py-3 bg-stone-50 border-b border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600 no-print">
          <div className="flex items-center gap-2">
            <span className="text-stone-400 font-medium">Guest Addressee:</span>
            {isEditingName ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. Eleanor Montgomery"
                  value={customGuestName}
                  onChange={e => setCustomGuestName(e.target.value)}
                  className="px-3 py-1 rounded-xl border border-blush-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blush-400"
                  autoFocus
                />
                <button
                  onClick={() => setIsEditingName(false)}
                  className="px-2.5 py-1 rounded-xl bg-blush-500 text-white text-[11px] font-medium"
                >
                  Apply
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 font-medium text-stone-800 bg-white px-2.5 py-1 rounded-xl border border-stone-200">
                <span>{customGuestName || 'Formal (No specific name)'}</span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-blush-600 hover:text-blush-800 ml-1"
                  title="Edit Guest Name"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeQrCode}
                onChange={e => setIncludeQrCode(e.target.checked)}
                className="rounded text-blush-500 focus:ring-blush-400"
              />
              <span>Include RSVP QR Code</span>
            </label>

            <button
              onClick={handleDownloadImage}
              disabled={isGeneratingImage}
              className="flex items-center gap-1 text-stone-600 hover:text-blush-600 font-medium transition"
              title="Download as PNG"
            >
              {isGeneratingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5 text-blush-500" />}
              <span>Save PNG Image</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1 text-stone-600 hover:text-blush-600 font-medium transition"
              title="Print directly"
            >
              <Printer className="w-3.5 h-3.5 text-stone-500" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Download Success Banner */}
        {downloadSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-6 py-2 text-xs flex items-center gap-2 justify-center font-medium animate-fadeIn no-print">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Printable Physical 5x7 Card Container */}
        <div
          id="printable-invitation-container"
          className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#ECE8E1] flex justify-center items-center"
        >
          {/* THE 5x7 RATIO WEDDING INVITATION CARD */}
          <div
            ref={cardRef}
            id="printable-invitation-card"
            className="w-full max-w-[480px] aspect-[5/7] bg-[#FCF9F6] rounded-2xl p-7 sm:p-9 shadow-2xl relative border-[2px] border-[#D4AF37]/50 text-center flex flex-col justify-between overflow-hidden"
            style={{
              boxShadow: '0 25px 50px -12px rgba(104, 45, 56, 0.25)',
              fontFamily: '"Cormorant Garamond", Georgia, serif'
            }}
          >
            {/* Fine Art Paper Texture & Golden Hairline Frame */}
            <div className="absolute inset-2.5 sm:inset-3 border border-[#D4AF37]/40 rounded-xl pointer-events-none"></div>
            <div className="absolute inset-3.5 sm:inset-4 border border-dashed border-[#E3B8C8]/60 rounded-lg pointer-events-none"></div>

            {/* Corner Botanical Watercolor Peonies (Vector SVG) */}
            <div className="absolute top-1 left-1 w-20 h-20 opacity-70 pointer-events-none">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="28" cy="28" r="16" fill="#F86D93" opacity="0.3" />
                <circle cx="42" cy="20" r="11" fill="#FFA2B8" opacity="0.35" />
                <path d="M0 0 C45 15 65 45 75 85 C55 65 25 45 0 0 Z" fill="#D4AF37" opacity="0.35" />
                <path d="M12 0 C45 35 65 55 85 75 C65 55 35 45 12 0 Z" fill="#7E9E7E" opacity="0.25" />
              </svg>
            </div>
            <div className="absolute top-1 right-1 w-20 h-20 opacity-70 pointer-events-none rotate-90">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="28" cy="28" r="16" fill="#F86D93" opacity="0.3" />
                <circle cx="42" cy="20" r="11" fill="#FFA2B8" opacity="0.35" />
                <path d="M0 0 C45 15 65 45 75 85 C55 65 25 45 0 0 Z" fill="#D4AF37" opacity="0.35" />
                <path d="M12 0 C45 35 65 55 85 75 C65 55 35 45 12 0 Z" fill="#7E9E7E" opacity="0.25" />
              </svg>
            </div>
            <div className="absolute bottom-1 left-1 w-20 h-20 opacity-70 pointer-events-none -rotate-90">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="28" cy="28" r="16" fill="#F86D93" opacity="0.3" />
                <circle cx="42" cy="20" r="11" fill="#FFA2B8" opacity="0.35" />
                <path d="M0 0 C45 15 65 45 75 85 C55 65 25 45 0 0 Z" fill="#D4AF37" opacity="0.35" />
                <path d="M12 0 C45 35 65 55 85 75 C65 55 35 45 12 0 Z" fill="#7E9E7E" opacity="0.25" />
              </svg>
            </div>
            <div className="absolute bottom-1 right-1 w-20 h-20 opacity-70 pointer-events-none rotate-180">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="28" cy="28" r="16" fill="#F86D93" opacity="0.3" />
                <circle cx="42" cy="20" r="11" fill="#FFA2B8" opacity="0.35" />
                <path d="M0 0 C45 15 65 45 75 85 C55 65 25 45 0 0 Z" fill="#D4AF37" opacity="0.35" />
                <path d="M12 0 C45 35 65 55 85 75 C65 55 35 45 12 0 Z" fill="#7E9E7E" opacity="0.25" />
              </svg>
            </div>

            {/* CARD TOP: Wax Seal & Personalized Addressee */}
            <div className="relative z-10 pt-1">
              {/* 3D Wax Seal Monogram */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#A63A56] via-[#ED3B72] to-[#F86D93] mx-auto flex items-center justify-center shadow-lg shadow-blush-900/20 border-2 border-white ring-2 ring-[#D4AF37]/50 mb-2">
                <span className="font-script text-2xl text-white drop-shadow-sm font-normal">
                  {config.brideShortName[0]} &amp; {config.groomShortName[0]}
                </span>
              </div>

              {customGuestName && (
                <div className="inline-block bg-[#FFF4F7] border border-[#F8B4C8] rounded-full px-3 py-0.5 mb-1.5 shadow-sm">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#801337] font-semibold">
                    Cordially Invited: {customGuestName}
                  </span>
                </div>
              )}

              <p className="font-script text-2xl sm:text-3xl text-[#DB205B] mb-0.5">
                Together with their families
              </p>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-stone-500 font-medium">
                Request the honour of your presence at the marriage of
              </p>
            </div>

            {/* CARD CENTER: Couple Names & Golden Divider */}
            <div className="relative z-10 my-1">
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-stone-900 font-normal tracking-wide leading-tight">
                {config.brideName}
              </h1>
              <div className="font-script text-3xl sm:text-4xl text-[#DB205B] my-0.5">
                and
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-stone-900 font-normal tracking-wide leading-tight">
                {config.groomName}
              </h2>

              <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto my-2.5"></div>

              {/* Date & Time */}
              <div className="space-y-0.5">
                <p className="font-serif text-sm sm:text-base font-semibold text-stone-800 tracking-wide">
                  {weddingDateFormatted}
                </p>
                <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-stone-500 font-medium">
                  At Three O&apos;Clock in the Afternoon
                </p>
              </div>

              {/* Venue */}
              <div className="mt-2 text-stone-700">
                <p className="font-serif text-xs sm:text-sm font-semibold text-[#801337]">
                  {config.ceremonyVenue.name}
                </p>
                <p className="text-[10px] text-stone-500">
                  {config.ceremonyVenue.address}, {config.ceremonyVenue.city}
                </p>
              </div>

              <p className="text-[10px] sm:text-[11px] font-display italic text-stone-600 mt-1.5">
                Dinner, Dancing &amp; Merriment to follow at {config.receptionVenue.name}
              </p>
            </div>

            {/* CARD BOTTOM: Dress Code & Scannable QR Code */}
            <div className="relative z-10 pb-1">
              <div className="text-[9px] uppercase tracking-[0.2em] text-stone-500 py-1 border-t border-[#F0D5DF] max-w-xs mx-auto mb-1.5">
                <span>{config.dressCode.title}</span>
              </div>

              {includeQrCode && (
                <div className="pt-1.5 border-t border-dashed border-[#E3B8C8] flex items-center justify-between max-w-[340px] mx-auto text-left">
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-stone-400 font-semibold block">
                      Kindly RSVP Online by May 1st
                    </span>
                    <span className="text-[9px] text-stone-700 font-mono font-medium">
                      {window.location.host || 'wedding.rsvp'}
                    </span>
                    {activeGuest && (
                      <span className="text-[9px] text-[#DB205B] font-mono font-bold block">
                        Code: {activeGuest.inviteCode}
                      </span>
                    )}
                  </div>

                  <div className="w-10 h-10 rounded-md bg-white border border-stone-200 p-0.5 flex items-center justify-center text-stone-800 shadow-sm shrink-0">
                    <QrCode className="w-full h-full text-stone-800" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls (Hidden in Print) */}
        <div className="p-4 bg-white border-t border-blush-100 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          <div className="text-xs text-stone-500 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-blush-500 fill-blush-500" />
            <span>5×7&quot; ratio ready for physical printing on cardstock or sharing digitally.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-gradient-to-r from-blush-500 to-rose-500 text-white text-xs font-semibold uppercase tracking-wider shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Download 5×7&quot; PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CutePrintButton: React.FC<{
  className?: string;
  guestName?: string;
  variant?: 'pill' | 'outline' | 'card';
}> = ({ className = '', guestName, variant = 'pill' }) => {
  const [modalOpen, setModalOpen] = useState(false);

  if (variant === 'outline') {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-rosewood bg-white hover:bg-blush-50 border border-blush-300 shadow-sm hover:border-blush-400 hover:shadow transition-all group ${className}`}
          title="Print or Download Keepsake Invitation"
        >
          <span className="w-5 h-5 rounded-full bg-blush-100 flex items-center justify-center text-blush-600 group-hover:scale-110 transition-transform text-[11px]">
            💌
          </span>
          <span>Print Card</span>
          <Sparkles className="w-3 h-3 text-gold" />
        </button>

        <PrintInvitationModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          guestNameOverride={guestName}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className={`group relative inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-semibold uppercase tracking-wider text-rosewood bg-gradient-to-r from-[#FFF5F8] via-white to-[#FFF0F5] border border-blush-300 shadow-md shadow-blush-900/5 hover:shadow-lg hover:shadow-blush-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all overflow-hidden ${className}`}
        title="Download or Print 5x7 Keepsake Invitation"
      >
        <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-blush-500 to-rose-400 text-white flex items-center justify-center shadow-sm text-[11px] group-hover:rotate-12 transition-transform">
          💌
        </span>
        <span className="font-serif tracking-wide text-stone-800 group-hover:text-blush-700 transition-colors">
          Print Keepsake Invitation
        </span>
        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] animate-pulse" />
      </button>

      <PrintInvitationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        guestNameOverride={guestName}
      />
    </>
  );
};
