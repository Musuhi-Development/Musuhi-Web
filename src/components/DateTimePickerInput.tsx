"use client";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, "0");
  return { value: h, label: `${h}:00` };
});

function parseValue(value: string): { date: string; hour: string } {
  if (!value) return { date: "", hour: "" };
  const tIdx = value.indexOf("T");
  if (tIdx === -1) return { date: value, hour: "" };
  return { date: value.slice(0, tIdx), hour: value.slice(tIdx + 1, tIdx + 3) };
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
};

export default function DateTimePickerInput({ value, onChange, disabled, minDate, maxDate }: Props) {
  const { date, hour } = parseValue(value);

  const handleDateChange = (newDate: string) => {
    if (!newDate) { onChange(""); return; }
    onChange(`${newDate}T${hour || "00"}:00`);
  };

  const handleHourChange = (newHour: string) => {
    if (!date) return;
    onChange(`${date}T${newHour}:00`);
  };

  return (
    <div className="flex gap-2">
      <input
        type="date"
        value={date}
        onChange={(e) => handleDateChange(e.target.value)}
        disabled={disabled}
        min={minDate}
        max={maxDate}
        className="flex-1 min-w-0 appearance-none bg-white border border-gray-200 text-gray-700 py-3 px-3 rounded-xl focus:outline-none focus:border-[#2A5CAA] text-sm"
      />
      <select
        value={hour}
        onChange={(e) => handleHourChange(e.target.value)}
        disabled={disabled || !date}
        className="w-28 appearance-none bg-white border border-gray-200 text-gray-700 py-3 px-3 rounded-xl focus:outline-none focus:border-[#2A5CAA] text-sm disabled:opacity-50"
      >
        <option value="">時間</option>
        {HOUR_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
