import { FileSpreadsheet, Presentation } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  exportSheetsToExcel,
  exportToPpt,
  type ExcelSheet,
  type PptSummary,
} from '@/utils/export';
import { useToast } from './Toast';

interface ExportButtonsProps {
  filename: string;
  getSheets: () => ExcelSheet<any>[];
  getPptSummary: () => PptSummary;
  size?: 'sm' | 'md';
  className?: string;
}

export function ExportButtons({
  filename,
  getSheets,
  getPptSummary,
  size = 'md',
  className,
}: ExportButtonsProps) {
  const toast = useToast();

  const handleExcel = () => {
    try {
      exportSheetsToExcel(filename, getSheets());
      toast.success('Excel exported', 'Filtered data downloaded as .xlsx');
    } catch (err) {
      toast.error('Excel export failed', String(err));
    }
  };

  const handlePpt = () => {
    try {
      exportToPpt(filename, getPptSummary());
      toast.success('PPT exported', 'Summary deck downloaded as .pptx');
    } catch (err) {
      toast.error('PPT export failed', String(err));
    }
  };

  const base = cn(
    'inline-flex items-center gap-1.5 rounded-lg border font-semibold transition active:scale-[0.98]',
    size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm',
  );

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={handleExcel}
        className={cn(
          base,
          'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
        )}
      >
        <FileSpreadsheet
          className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'}
        />
        Excel
      </button>
      <button
        type="button"
        onClick={handlePpt}
        className={cn(
          base,
          'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100',
        )}
      >
        <Presentation className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        PPT
      </button>
    </div>
  );
}
