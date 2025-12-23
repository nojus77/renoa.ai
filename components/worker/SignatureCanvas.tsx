'use client';

import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void;
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  onSkip?: () => void;
}

export default function SignaturePad({
  onSave,
  customerName,
  onCustomerNameChange,
  onSkip
}: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 300, height: 200 });
  const [isEmpty, setIsEmpty] = useState(true);

  // Resize canvas to fit container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setCanvasSize({ width, height: 200 });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleClear = () => {
    sigRef.current?.clear();
    setIsEmpty(true);
  };

  const handleEnd = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      setIsEmpty(false);
    }
  };

  const handleSave = () => {
    if (!customerName.trim()) {
      alert('Please enter customer name');
      return;
    }
    if (sigRef.current?.isEmpty()) {
      alert('Please provide a signature');
      return;
    }
    const dataUrl = sigRef.current?.toDataURL('image/png');
    if (dataUrl) {
      onSave(dataUrl);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Customer Name</label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => onCustomerNameChange(e.target.value)}
          className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Enter customer name"
        />
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-2">Signature</label>
        <div
          ref={containerRef}
          className="border border-zinc-700 rounded-lg bg-white overflow-hidden"
        >
          <SignatureCanvas
            ref={sigRef}
            onEnd={handleEnd}
            canvasProps={{
              width: canvasSize.width,
              height: canvasSize.height,
              className: 'touch-none',
              style: {
                width: '100%',
                height: '200px',
                touchAction: 'none'
              }
            }}
            backgroundColor="white"
            penColor="black"
          />
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          Sign with your finger or stylus
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleClear}
          className="flex-1 py-3 border border-zinc-600 rounded-lg text-zinc-300 font-medium hover:bg-zinc-800 transition-colors"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isEmpty || !customerName.trim()}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
            isEmpty || !customerName.trim()
              ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-500'
          }`}
        >
          Accept Signature
        </button>
      </div>

      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Customer not available - Skip signature
        </button>
      )}
    </div>
  );
}
