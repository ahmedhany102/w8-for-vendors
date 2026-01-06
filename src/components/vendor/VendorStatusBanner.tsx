import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { VendorStatus, getStatusLabel } from '@/hooks/useVendorProfile';

interface VendorStatusBannerProps {
  status: VendorStatus;
}

export const VendorStatusBanner = ({ status }: VendorStatusBannerProps) => {
  if (status === 'approved') {
    return null;
  }

  const config = {
    pending: {
      icon: Clock,
      bgColor: 'bg-yellow-500/10 border-yellow-500/20',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      iconColor: 'text-yellow-500',
      message: 'طلبك قيد المراجعة من قبل الإدارة. ستتمكن من إضافة المنتجات بعد الموافقة.'
    },
    rejected: {
      icon: XCircle,
      bgColor: 'bg-red-500/10 border-red-500/20',
      textColor: 'text-red-700 dark:text-red-400',
      iconColor: 'text-red-500',
      message: 'تم رفض طلبك. يرجى التواصل مع الإدارة لمعرفة السبب وإمكانية إعادة التقديم.'
    },
    suspended: {
      icon: AlertCircle,
      bgColor: 'bg-orange-500/10 border-orange-500/20',
      textColor: 'text-orange-700 dark:text-orange-400',
      iconColor: 'text-orange-500',
      message: 'تم إيقاف متجرك مؤقتاً. يرجى التواصل مع الإدارة لمعرفة السبب.'
    }
  };

  const { icon: Icon, bgColor, textColor, iconColor, message } = config[status];

  return (
    <div className={`p-4 rounded-lg border ${bgColor} mb-6`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 ${iconColor}`} />
        <div>
          <p className={`font-medium ${textColor}`}>
            حالة المتجر: {getStatusLabel(status)}
          </p>
          <p className={`text-sm mt-1 ${textColor} opacity-80`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};
