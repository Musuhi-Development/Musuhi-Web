"use client";

import { Settings, Users, ChevronRight, Edit3 } from "lucide-react";

export default function MyPage() {
  return (
    <div className="pb-24">
      {/* Profile Header */}
      <div className="bg-white p-6 pb-8 border-b">
         <div className="flex justify-end mb-4">
             <button className="text-gray-400 hover:text-gray-600">
                 <Settings size={22} />
             </button>
         </div>
         
         <div className="flex flex-col items-center">
             <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 relative">
                 <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-sm border border-gray-100 text-gray-500">
                     <Edit3 size={14} />
                 </button>
             </div>
             <h1 className="text-xl font-bold text-gray-900">Ando User</h1>
             <p className="text-sm text-gray-500 mb-4">@ando_musuhi</p>
             
             <div className="flex gap-8 text-center">
                 <div>
                     <p className="font-bold text-lg">12</p>
                     <p className="text-xs text-gray-500">ジャーナル</p>
                 </div>
                 <div>
                     <p className="font-bold text-lg">45</p>
                     <p className="text-xs text-gray-500">つながり</p>
                 </div>
                 <div>
                     <p className="font-bold text-lg">8</p>
                     <p className="text-xs text-gray-500">ギフト</p>
                 </div>
             </div>
         </div>
      </div>

      {/* Menu List */}
      <div className="mt-4 bg-white border-y border-gray-100 divide-y divide-gray-100">
          <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                      <Users size={16} />
                  </div>
                  <span className="font-medium text-gray-800">つながりリスト (家族・友人)</span>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
          </button>
          
          <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center">
                      <Settings size={16} />
                  </div>
                  <span className="font-medium text-gray-800">アカウント設定</span>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
          </button>
      </div>

      <div className="mt-6 text-center">
          <button className="text-xs text-red-500 font-medium p-2">ログアウト</button>
      </div>
    </div>
  );
}
