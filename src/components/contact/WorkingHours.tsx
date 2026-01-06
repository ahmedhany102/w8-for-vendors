
import React from 'react';

interface WorkingHoursProps {
  settings: any;
}

const WorkingHours: React.FC<WorkingHoursProps> = ({ settings }) => {
  const workingHours = settings?.working_hours || 'Monday - Friday: 9:00 AM - 10:00 PM\nSaturday: 10:00 AM - 8:00 PM\nSunday: 12:00 PM - 6:00 PM';

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium mb-4">Working Hours</h3>
      <div className="space-y-2 whitespace-pre-line">
        {workingHours}
      </div>
    </div>
  );
};

export default WorkingHours;
