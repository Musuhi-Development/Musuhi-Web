"use client";

import { useState } from "react";
import { Mic } from "lucide-react";
import RecordingModal from "@/components/RecordingModal";

export default function FloatingActionButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-24 right-6 z-40">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center w-16 h-16 bg-[#2A5CAA] text-white rounded-full shadow-2xl hover:bg-[#1F4580] hover:scale-110 transition-all duration-200"
          aria-label="録音"
        >
          <Mic size={28} fill="white" />
        </button>
      </div>
      
      <RecordingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
