import { useState } from "react";
import { Datepicker } from "flowbite-react";

export function DateRangePicker({ onRangeChange }) {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const handleStartChange = (date) => {
    setStartDate(date);
    if (onRangeChange) {
      onRangeChange({ start: date, end: endDate });
    }
  };

  const handleEndChange = (date) => {
    setEndDate(date);
    if (onRangeChange) {
      onRangeChange({ start: startDate, end: date });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-10 items-center w-full max-w-md">
      <div className="w-full">
        <span className="block mb-2 text-sm font-medium">
          From
        </span>
        <Datepicker
          value={startDate || undefined}   
          onSelectedDateChanged={handleStartChange}
          maxDate={endDate || undefined}
          placeholder="Select start date"
        />
      </div>

      <div className="w-full">
        <span className="block mb-2 text-sm font-medium">
          To
        </span>
        <Datepicker
          value={endDate || undefined}
          onSelectedDateChanged={handleEndChange}
          minDate={startDate || undefined}
          maxDate={new Date()} 
          placeholder="Select end date"
        />
      </div>
    </div>
  );
}

export default DateRangePicker;